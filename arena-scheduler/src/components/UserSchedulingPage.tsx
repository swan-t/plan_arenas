import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gamesApi, arenasApi, clubsApi, leaguesApi, nestedApi, seasonsApi } from '@/services/api';
import { useUser } from '@/contexts/UserContext';
import { Game } from '@/types';

const UserSchedulingPage: React.FC = () => {
  const { user } = useUser();
  const [selectedArenaId, setSelectedArenaId] = useState<number | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [schedulingMode, setSchedulingMode] = useState<'list' | 'schedule'>('list');
  const [selectedDay, setSelectedDay] = useState<'friday' | 'saturday' | 'sunday'>('friday');
  const queryClient = useQueryClient();

  // First, fetch all seasons to get leagues from each season
  const {
    data: seasons = [],
    isLoading: seasonsLoading,
    error: seasonsError,
  } = useQuery({
    queryKey: ['seasons'],
    queryFn: () => seasonsApi.getAll(),
  });

  // Get the current season (assuming the first one is current)
  const currentSeason = seasons.length > 0 ? seasons[0] : null;

  // Fetch leagues for the current season
  const {
    data: leagues = [],
    isLoading: leaguesLoading,
    error: leaguesError,
  } = useQuery({
    queryKey: ['leagues', currentSeason?.id],
    queryFn: () => leaguesApi.getBySeason(currentSeason!.id),
    enabled: !!currentSeason?.id,
  });

  // Fetch user's team by getting all teams from all leagues and finding the user's team
  const {
    data: userTeam,
    isLoading: userTeamLoading,
    error: userTeamError,
  } = useQuery({
    queryKey: ['user-team', user?.team_id, leagues],
    queryFn: async () => {
      if (!user?.team_id || leagues.length === 0) return null;
      
      // Fetch teams from all leagues and find the user's team
      for (const league of leagues) {
        try {
          const teams = await nestedApi.getLeagueTeams(league.id);
          const foundTeam = teams.find((team: any) => team.id === user.team_id);
          if (foundTeam) {
            return foundTeam;
          }
        } catch (error) {
          console.warn(`Failed to fetch teams for league ${league.id}:`, error);
        }
      }
      return null;
    },
    enabled: !!user?.team_id && leagues.length > 0,
  });

  // Fetch user's club
  const {
    data: userClub,
    isLoading: userClubLoading,
    error: userClubError,
  } = useQuery({
    queryKey: ['user-club', userTeam?.club_id],
    queryFn: () => clubsApi.getById(userTeam!.club_id),
    enabled: !!userTeam?.club_id,
  });

  // Fetch user's arena
  const {
    data: userArena,
    isLoading: userArenaLoading,
    error: userArenaError,
  } = useQuery({
    queryKey: ['user-arena', userClub?.arena_id],
    queryFn: () => arenasApi.getById(userClub!.arena_id),
    enabled: !!userClub?.arena_id,
  });

  // Set the arena ID when we have it
  useEffect(() => {
    if (userArena?.id && !selectedArenaId) {
      setSelectedArenaId(userArena.id);
    }
  }, [userArena?.id, selectedArenaId]);

  // Fetch teams for the user's team's league
  const {
    data: teams = [],
    isLoading: teamsLoading,
    error: teamsError,
  } = useQuery({
    queryKey: ['teams', userTeam?.league_id],
    queryFn: () => nestedApi.getLeagueTeams(userTeam!.league_id),
    enabled: !!userTeam?.league_id,
  });

  // Fetch all games for the arena to check for conflicts
  const {
    data: allGames = [],
    isLoading: allGamesLoading,
    error: allGamesError,
  } = useQuery({
    queryKey: ['all-games', userArena?.id],
    queryFn: () => gamesApi.getAll(),
    enabled: !!userArena?.id,
  });

  // Filter games for this team in the selected arena
  const teamGames = allGames.filter(game => 
    (game.home_team_id === user?.team_id || game.away_team_id === user?.team_id) &&
    game.arena_id === userArena?.id
  );

  // Update game mutation
  const updateGameMutation = useMutation({
    mutationFn: async ({ gameId, updates }: { gameId: number; updates: Partial<Game> }) => {
      await gamesApi.update(gameId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games', user?.team_id] });
    },
  });

  // Helper functions
  const getTeamName = (teamId: number) => {
    const team = teams.find((t: any) => t.id === teamId);
    return team?.name || `Team ${teamId}`;
  };

  const getArenaName = (arenaId: number) => {
    // Use userArena if it matches, otherwise return a generic name
    if (arenaId === userArena?.id) {
      return userArena.name;
    }
    return `Arena ${arenaId}`;
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('sv-SE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get the day of the week for a game
  const getGameDay = (game: Game): 'friday' | 'saturday' | 'sunday' => {
    const gameDate = new Date(game.starts_at);
    const dayOfWeek = gameDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    if (dayOfWeek === 5) return 'friday';
    if (dayOfWeek === 6) return 'saturday';
    if (dayOfWeek === 0) return 'sunday';
    
    // Default to friday if it's not a weekend day
    return 'friday';
  };

  // Check if a time slot is available (not conflicting with other games)
  const isTimeSlotAvailable = (time: string, gameDay: 'friday' | 'saturday' | 'sunday') => {
    if (!selectedGame || !userArena) return true;
    
    const [hours, minutes] = time.split(':');
    const slotTime = new Date(selectedGame.starts_at);
    slotTime.setHours(parseInt(hours), parseInt(minutes));
    
    // Update the date to match the selected day
    const gameDate = new Date(selectedGame.starts_at);
    const dayOfWeek = gameDate.getDay();
    const targetDayOfWeek = gameDay === 'friday' ? 5 : gameDay === 'saturday' ? 6 : 0;
    const daysDiff = targetDayOfWeek - dayOfWeek;
    slotTime.setDate(slotTime.getDate() + daysDiff);
    
    // Check if this time conflicts with any other game in the same arena
    const conflictingGame = allGames.find(game => {
      // Skip the current game being scheduled
      if (game.id === selectedGame.id) return false;
      // Only check games in the same arena
      if (game.arena_id !== userArena.id) return false;
      
      const gameTime = new Date(game.starts_at);
      const gameEndTime = new Date(gameTime.getTime() + game.ice_time * 60000);
      const slotEndTime = new Date(slotTime.getTime() + selectedGame.ice_time * 60000);
      
      // Check for overlap: two time periods overlap if one starts before the other ends
      return (slotTime < gameEndTime && slotEndTime > gameTime);
    });
    
    return !conflictingGame;
  };

  // Handle game scheduling
  const handleScheduleGame = (game: Game) => {
    setSelectedGame(game);
    setSelectedDay(getGameDay(game));
    setSchedulingMode('schedule');
  };

  const handleUpdateGameTime = async (newTime: string) => {
    if (!selectedGame) return;
    
    try {
      const [hours, minutes] = newTime.split(':');
      const newDateTime = new Date(selectedGame.starts_at);
      newDateTime.setHours(parseInt(hours), parseInt(minutes));
      
      // Update the date to match the selected day
      const gameDate = new Date(selectedGame.starts_at);
      const dayOfWeek = gameDate.getDay();
      const targetDayOfWeek = selectedDay === 'friday' ? 5 : selectedDay === 'saturday' ? 6 : 0;
      const daysDiff = targetDayOfWeek - dayOfWeek;
      newDateTime.setDate(newDateTime.getDate() + daysDiff);
      
      await updateGameMutation.mutateAsync({
        gameId: selectedGame.id,
        updates: { starts_at: newDateTime.toISOString() }
      });
      
      setSchedulingMode('list');
      setSelectedGame(null);
    } catch (error) {
      console.error('Failed to schedule game:', error);
    }
  };

  const handleCancelScheduling = () => {
    setSchedulingMode('list');
    setSelectedGame(null);
  };

  // Loading states
  if (seasonsLoading || leaguesLoading || userTeamLoading || userClubLoading || userArenaLoading) {
    return <div className="loading">Loading your team information...</div>;
  }

  if (seasonsError || leaguesError || userTeamError || userClubError || userArenaError) {
    return <div className="error">Error loading team data</div>;
  }

  if (!userTeam || !userClub || !userArena) {
    return (
      <div className="scheduling-page">
        <div className="header">
          <h1>Schedule Your Games</h1>
          <p>Unable to load your team information</p>
        </div>
        <div className="error">
          <p>Your account is not properly associated with a team, club, or arena.</p>
          <p>Please contact an administrator for assistance.</p>
        </div>
      </div>
    );
  }

  if (teamsLoading || allGamesLoading) {
    return <div className="loading">Loading your team's games...</div>;
  }

  if (teamsError || allGamesError) {
    return <div className="error">Error loading games data</div>;
  }

  // We already have userTeam, userClub, and userArena from the queries above
  // No need to find them again

  return (
    <div className="scheduling-page">
      <div className="header">
        <h1>Schedule Your Games</h1>
        <p>Manage your team's game schedule</p>
        <div className="arena-info">
          <span className="current-arena">Arena: {userArena.name}</span>
          <span className="team-info">Team: {userTeam.name}</span>
          <span className="club-info">Club: {userClub.name}</span>
        </div>
      </div>

      {schedulingMode === 'list' ? (
        <div className="games-section">
          <h2>Your Team's Games</h2>
          <p>Click on a game to schedule or reschedule it</p>
          
          {teamGames.length === 0 ? (
            <div className="no-games">
              <p>No games scheduled for your team yet.</p>
              <p>Games will appear here once they are created by an administrator.</p>
            </div>
          ) : (
            <div className="games-list">
              {teamGames.map((game) => (
                <div key={game.id} className="game-card">
                  <div className="game-info">
                    <h3>
                      {getTeamName(game.home_team_id)} vs {getTeamName(game.away_team_id)}
                    </h3>
                    <p className="game-details">
                      <strong>Arena:</strong> {getArenaName(game.arena_id)}<br />
                      <strong>Date & Time:</strong> {formatDateTime(game.starts_at)}<br />
                      <strong>Duration:</strong> {game.ice_time} minutes
                    </p>
                  </div>
                  <div className="game-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleScheduleGame(game)}
                    >
                      Schedule Game
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="scheduling-interface">
          <h2>Schedule Game</h2>
          {selectedGame && (
            <div className="game-scheduling">
              <div className="game-info">
                <h3>
                  {getTeamName(selectedGame.home_team_id)} vs {getTeamName(selectedGame.away_team_id)}
                </h3>
                <p className="game-details">
                  <strong>Date:</strong> {new Date(selectedGame.starts_at).toLocaleDateString()}<br />
                  <strong>Day:</strong> {getGameDay(selectedGame).charAt(0).toUpperCase() + getGameDay(selectedGame).slice(1)}<br />
                  <strong>Duration:</strong> {selectedGame.ice_time} minutes
                </p>
              </div>
              
              <div className="time-selection">
                <h3>Select Time</h3>
                
                {/* Legend */}
                <div className="time-legend">
                  <div className="legend-item">
                    <div className="legend-color available"></div>
                    <span>Available</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color disabled"></div>
                    <span>Not Available</span>
                  </div>
                </div>
                
                {/* Day Selection */}
                <div className="day-selector">
                  <button
                    className={`day-btn ${selectedDay === 'friday' ? 'active' : ''} ${getGameDay(selectedGame) === 'friday' ? 'correct-day' : ''}`}
                    onClick={() => setSelectedDay('friday')}
                  >
                    Friday {getGameDay(selectedGame) === 'friday' ? '(Game Day)' : ''}
                  </button>
                  <button
                    className={`day-btn ${selectedDay === 'saturday' ? 'active' : ''} ${getGameDay(selectedGame) === 'saturday' ? 'correct-day' : ''}`}
                    onClick={() => setSelectedDay('saturday')}
                  >
                    Saturday {getGameDay(selectedGame) === 'saturday' ? '(Game Day)' : ''}
                  </button>
                  <button
                    className={`day-btn ${selectedDay === 'sunday' ? 'active' : ''} ${getGameDay(selectedGame) === 'sunday' ? 'correct-day' : ''}`}
                    onClick={() => setSelectedDay('sunday')}
                  >
                    Sunday {getGameDay(selectedGame) === 'sunday' ? '(Game Day)' : ''}
                  </button>
                </div>

                <div className="time-slots">
                  {/* Friday Section */}
                  <div className={`day-section ${selectedDay === 'friday' ? 'active' : 'disabled'}`}>
                    <h4>Friday (19:45 - 22:30)</h4>
                    <div className="time-grid">
                      {['19:45', '20:00', '20:15', '20:30', '20:45', '21:00', '21:15', '21:30', '21:45', '22:00', '22:15'].map(time => {
                        const isAvailable = selectedDay === 'friday' && isTimeSlotAvailable(time, 'friday');
                        const isOccupied = selectedDay === 'friday' && !isTimeSlotAvailable(time, 'friday');
                        
                        // Hide occupied time slots
                        if (isOccupied) return null;
                        
                        return (
                          <button
                            key={time}
                            className={`time-slot ${!isAvailable ? 'disabled' : ''}`}
                            onClick={() => isAvailable && handleUpdateGameTime(time)}
                            disabled={!isAvailable}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Saturday Section */}
                  <div className={`day-section ${selectedDay === 'saturday' ? 'active' : 'disabled'}`}>
                    <h4>Saturday (11:00 - 19:30)</h4>
                    <div className="time-grid">
                      {['11:00', '11:15', '11:30', '11:45', '12:00', '12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '13:45', '14:00', '14:15', '14:30', '14:45', '15:00', '15:15', '15:30', '15:45', '16:00', '16:15', '16:30', '16:45', '17:00', '17:15', '17:30', '17:45', '18:00', '18:15', '18:30', '18:45', '19:00', '19:15'].map(time => {
                        const isAvailable = selectedDay === 'saturday' && isTimeSlotAvailable(time, 'saturday');
                        const isOccupied = selectedDay === 'saturday' && !isTimeSlotAvailable(time, 'saturday');
                        
                        // Hide occupied time slots
                        if (isOccupied) return null;
                        
                        return (
                          <button
                            key={time}
                            className={`time-slot ${!isAvailable ? 'disabled' : ''}`}
                            onClick={() => isAvailable && handleUpdateGameTime(time)}
                            disabled={!isAvailable}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Sunday Section */}
                  <div className={`day-section ${selectedDay === 'sunday' ? 'active' : 'disabled'}`}>
                    <h4>Sunday (13:00 - 19:30)</h4>
                    <div className="time-grid">
                      {['13:00', '13:15', '13:30', '13:45', '14:00', '14:15', '14:30', '14:45', '15:00', '15:15', '15:30', '15:45', '16:00', '16:15', '16:30', '16:45', '17:00', '17:15', '17:30', '17:45', '18:00', '18:15', '18:30', '18:45', '19:00', '19:15'].map(time => {
                        const isAvailable = selectedDay === 'sunday' && isTimeSlotAvailable(time, 'sunday');
                        const isOccupied = selectedDay === 'sunday' && !isTimeSlotAvailable(time, 'sunday');
                        
                        // Hide occupied time slots
                        if (isOccupied) return null;
                        
                        return (
                          <button
                            key={time}
                            className={`time-slot ${!isAvailable ? 'disabled' : ''}`}
                            onClick={() => isAvailable && handleUpdateGameTime(time)}
                            disabled={!isAvailable}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="scheduling-actions">
                <button
                  className="btn btn-secondary"
                  onClick={handleCancelScheduling}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSchedulingPage;
