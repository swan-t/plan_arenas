import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi, usersApi, arenasApi, gamesApi, seasonsApi, leaguesApi } from '@/services/api';
import type { Team, Game } from '@/types';

const SchedulingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invitations' | 'calendar' | 'admin'>('invitations');
  const [selectedArenaId, setSelectedArenaId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Manual scheduling state
  const [showManualScheduling, setShowManualScheduling] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [manualDate, setManualDate] = useState('');
  const [manualTime, setManualTime] = useState('');
  
  // Calendar view state
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Fetch arenas
  const {
    data: arenas = [],
    isLoading: arenasLoading,
    error: arenasError,
  } = useQuery({
    queryKey: ['arenas'],
    queryFn: () => arenasApi.getAll(),
  });

  // Fetch teams for current season by arena
  const {
    data: teams = [],
    isLoading: teamsLoading,
    error: teamsError,
  } = useQuery({
    queryKey: ['teams', selectedArenaId],
    queryFn: () => teamsApi.getByArena(selectedArenaId!),
    enabled: !!selectedArenaId,
  });

  const {
    data: users = [],
    isLoading: usersLoading,
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  // Fetch seasons for manual scheduling
  const {
    data: seasons = [],
  } = useQuery({
    queryKey: ['seasons'],
    queryFn: () => seasonsApi.getAll(),
  });

  // Fetch leagues for manual scheduling
  const {
    data: leagues = [],
  } = useQuery({
    queryKey: ['leagues'],
    queryFn: async () => {
      if (seasons.length === 0) return [];
      // Get leagues from all seasons
      const allLeagues = [];
      for (const season of seasons) {
        const seasonLeagues = await leaguesApi.getBySeason(season.id);
        allLeagues.push(...seasonLeagues);
      }
      return allLeagues;
    },
    enabled: seasons.length > 0,
  });

  // Fetch all games for collision detection
  const {
    data: allGames = [],
    isLoading: gamesLoading,
  } = useQuery({
    queryKey: ['all-games-admin'],
    queryFn: () => gamesApi.getAll(),
  });

  // Invite team mutation
  const inviteTeamMutation = useMutation({
    mutationFn: async (teamId: number) => {
      const team = teams.find(t => t.id === teamId);
      if (!team) throw new Error('Team not found');
      
      if (!team.contact_email) {
        throw new Error('Team has no contact email');
      }
      
      // Create user for the team
      await usersApi.create({
        email: team.contact_email,
        team_id: teamId,
        admin: false,
      });
      
      // Update team scheduling status to "currently scheduling"
      await teamsApi.update(teamId, {
        club_id: team.club_id,
        league_id: team.league_id,
        name: team.name,
        url: team.url,
        contact_email: team.contact_email,
        scheduling_done_at: undefined, // Clear any previous completion
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', selectedArenaId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Mark team as complete mutation
  const markTeamCompleteMutation = useMutation({
    mutationFn: async (teamId: number) => {
      const team = teams.find(t => t.id === teamId);
      if (!team) throw new Error('Team not found');
      
      await teamsApi.update(teamId, {
        club_id: team.club_id,
        league_id: team.league_id,
        name: team.name,
        url: team.url,
        contact_email: team.contact_email,
        scheduling_done_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', selectedArenaId] });
    },
  });

  // Update game mutation for manual scheduling
  const updateGameMutation = useMutation({
    mutationFn: async ({ gameId, updates }: { gameId: number; updates: Partial<Game> }) => {
      await gamesApi.update(gameId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-games-admin'] });
      setShowManualScheduling(false);
      setSelectedGame(null);
      setManualDate('');
      setManualTime('');
    },
  });

  // Helper functions
  const getTeamStatus = (team: Team) => {
    const teamUser = users.find(u => u.team_id === team.id);
    if (team.scheduling_done_at) {
      return 'completed';
    } else if (teamUser) {
      return 'active';
    } else {
      return 'pending';
    }
  };

  // Get games for the selected arena
  const getArenaGames = () => {
    if (!selectedArenaId) return [];
    return allGames.filter(game => game.arena_id === selectedArenaId);
  };

  // Check for collision with other games
  const isTimeSlotAvailable = (gameId: number, newDateTime: Date) => {
    const arenaGames = getArenaGames();
    const newStart = newDateTime;
    const newEnd = new Date(newStart.getTime() + (selectedGame?.ice_time || 140) * 60000);

    return !arenaGames.some(game => {
      if (game.id === gameId) return false; // Don't check against the same game
      
      const existingStart = new Date(game.starts_at);
      const existingEnd = new Date(existingStart.getTime() + game.ice_time * 60000);
      
      // Check for overlap
      return (newStart < existingEnd && newEnd > existingStart);
    });
  };

  // Get team name helper
  const getTeamName = (teamId: number) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : `Team ${teamId}`;
  };

  // Get league name helper
  const getLeagueName = (leagueId: number) => {
    const league = leagues.find(l => l.id === leagueId);
    return league ? league.name : `League ${leagueId}`;
  };

  // Handle manual scheduling
  const handleManualSchedule = (game: Game) => {
    setSelectedGame(game);
    setShowManualScheduling(true);
    // Pre-fill with current game time
    const currentDate = new Date(game.starts_at);
    setManualDate(currentDate.toISOString().split('T')[0]);
    setManualTime(currentDate.toTimeString().slice(0, 5));
  };

  // Handle manual scheduling submission
  const handleManualScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGame || !manualDate || !manualTime) return;

    const newDateTime = new Date(`${manualDate}T${manualTime}:00`);
    
    if (!isTimeSlotAvailable(selectedGame.id, newDateTime)) {
      alert('This time slot conflicts with another game. Please choose a different time.');
      return;
    }

    updateGameMutation.mutate({
      gameId: selectedGame.id,
      updates: { starts_at: newDateTime.toISOString() }
    });
  };

  // Calendar view helper functions
  const getDaysWithGames = (startDate: Date) => {
    if (!selectedArenaId) return [];
    
    const arenaGames = getArenaGames();
    
    // Get all unique dates that have games
    const gameDates = new Set<string>();
    arenaGames.forEach(game => {
      const gameDate = new Date(game.starts_at).toISOString().split('T')[0];
      gameDates.add(gameDate);
    });
    
    // Convert to sorted array of Date objects
    const sortedDates = Array.from(gameDates)
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => a.getTime() - b.getTime());
    
    // Find dates around the current date
    const currentDateStr = startDate.toISOString().split('T')[0];
    const currentIndex = sortedDates.findIndex(date => 
      date.toISOString().split('T')[0] === currentDateStr
    );
    
    if (currentIndex === -1) {
      // If current date has no games, find the closest date with games
      const closestDate = sortedDates.find(date => date >= startDate) || 
                         sortedDates[sortedDates.length - 1];
      if (closestDate) {
        const closestIndex = sortedDates.indexOf(closestDate);
        const startIndex = Math.max(0, closestIndex - 5);
        const endIndex = Math.min(sortedDates.length, startIndex + 10);
        return sortedDates.slice(startIndex, endIndex);
      }
      return [];
    }
    
    // Get 10 days around the current date
    const startIndex = Math.max(0, currentIndex - 5);
    const endIndex = Math.min(sortedDates.length, startIndex + 10);
    return sortedDates.slice(startIndex, endIndex);
  };

  const getGamesForDate = (date: Date) => {
    if (!selectedArenaId) return [];
    const dateStr = date.toISOString().split('T')[0];
    return getArenaGames().filter(game => {
      const gameDate = new Date(game.starts_at).toISOString().split('T')[0];
      return gameDate === dateStr;
    });
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('sv-SE', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const navigateDays = (direction: 'prev' | 'next') => {
    const daysWithGames = getDaysWithGames(currentDate);
    if (daysWithGames.length === 0) return;
    
    const currentIndex = daysWithGames.findIndex(date => 
      date.toISOString().split('T')[0] === currentDate.toISOString().split('T')[0]
    );
    
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'next' 
      ? Math.min(daysWithGames.length - 1, currentIndex + 10)
      : Math.max(0, currentIndex - 10);
    
    setCurrentDate(daysWithGames[newIndex]);
  };

  // Compact games for a specific day
  const compactGamesForDay = async (date: Date) => {
    const games = getGamesForDate(date);
    if (games.length === 0) return;

    // Filter out games with default time (10:00 AM) - these are not scheduled yet
    const scheduledGames = games.filter(game => {
      const gameTime = new Date(game.starts_at);
      return gameTime.getHours() !== 10 || gameTime.getMinutes() !== 0;
    });

    if (scheduledGames.length === 0) {
      alert('No games with scheduled times found for this day.');
      return;
    }

    // Sort games by start time
    const sortedGames = [...scheduledGames].sort((a, b) => 
      new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    );

    // Calculate new start times by removing gaps
    const updatedGames = [];
    let currentTime = new Date(sortedGames[0].starts_at);
    
    for (let i = 0; i < sortedGames.length; i++) {
      const game = sortedGames[i];
      const gameDuration = game.ice_time; // in minutes
      
      // Update the game's start time
      const updatedGame = {
        ...game,
        starts_at: new Date(currentTime).toISOString()
      };
      
      updatedGames.push(updatedGame);
      
      // Move current time to the end of this game
      currentTime = new Date(currentTime.getTime() + gameDuration * 60000);
    }

    // Update all games in the day
    try {
      for (const game of updatedGames) {
        await updateGameMutation.mutateAsync({
          gameId: game.id,
          updates: { starts_at: game.starts_at }
        });
      }
      alert(`Successfully compacted ${updatedGames.length} games for ${formatDate(date)}`);
    } catch (error) {
      console.error('Error compacting games:', error);
      alert('Error compacting games. Please try again.');
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Scheduling Complete';
      case 'active': return 'Currently Scheduling';
      case 'pending': return 'Not Invited';
      default: return 'Unknown';
    }
  };

  const handleInviteTeam = (teamId: number) => {
    inviteTeamMutation.mutate(teamId);
  };

  const handleMarkComplete = (teamId: number) => {
    markTeamCompleteMutation.mutate(teamId);
  };

  if (arenasLoading) {
    return <div className="loading">Loading arenas...</div>;
  }

  if (arenasError) {
    return <div className="error">Error loading arenas data</div>;
  }

  if (!selectedArenaId) {
    return (
      <div className="scheduling-page">
        <div className="header">
          <h1>Game Scheduling</h1>
          <p>Select an arena to manage team scheduling for the current season</p>
        </div>
        
        <div className="arena-selector">
          <h2>Select Arena</h2>
          <div className="arenas-grid">
            {arenas.map((arena) => (
              <button
                key={arena.id}
                className="arena-card"
                onClick={() => setSelectedArenaId(arena.id)}
              >
                <h3>{arena.name}</h3>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (teamsLoading || usersLoading) {
    return <div className="loading">Loading scheduling data...</div>;
  }

  if (teamsError) {
    return <div className="error">Error loading teams data</div>;
  }

  const selectedArena = arenas.find(a => a.id === selectedArenaId);

  return (
    <div className="scheduling-page">
      <div className="header">
        <h1>Game Scheduling</h1>
        <p>Manage team invitations and game scheduling for the current season</p>
        <div className="arena-info">
          <span className="current-arena">Arena: {selectedArena?.name}</span>
          <button 
            className="btn btn-secondary btn-small"
            onClick={() => setSelectedArenaId(null)}
          >
            Change Arena
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab ${activeTab === 'invitations' ? 'active' : ''}`}
          onClick={() => setActiveTab('invitations')}
        >
          Team Invitations
        </button>
        <button
          className={`tab ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          Calendar View
        </button>
        <button
          className={`tab ${activeTab === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveTab('admin')}
        >
          Admin View
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'invitations' && (
          <div>
            <h2>Team Invitations</h2>
            <p>Invite teams to schedule their games</p>
            
            <div className="teams-list">
              {teams.map((team) => {
                const status = getTeamStatus(team);
                return (
                  <div key={team.id} className="team-card">
                    <div className="team-info">
                      <h3>{team.name}</h3>
                      <p className="team-email">{team.contact_email}</p>
                      <div className="team-status">
                        <span className={`status-badge ${status}`}>
                          {getStatusText(status)}
                        </span>
                      </div>
                    </div>
                    <div className="team-actions">
                      {status === 'pending' && (
                        <button
                          className="btn btn-primary"
                          onClick={() => handleInviteTeam(team.id)}
                          disabled={inviteTeamMutation.isPending}
                        >
                          {inviteTeamMutation.isPending ? 'Inviting...' : 'Invite Team'}
                        </button>
                      )}
                      {status === 'active' && (
                        <button
                          className="btn btn-success"
                          onClick={() => handleMarkComplete(team.id)}
                          disabled={markTeamCompleteMutation.isPending}
                        >
                          {markTeamCompleteMutation.isPending ? 'Marking...' : 'Mark Complete'}
                        </button>
                      )}
                      {status === 'completed' && (
                        <span className="completed-text">✓ Completed</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div>
            <h2>Calendar View</h2>
            <p>View scheduled games by day</p>
            <div className="placeholder">
              Calendar view functionality will be implemented here
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div>
            <h2>Admin View - Manual Game Scheduling</h2>
            <p>Schedule games at any time, any day with collision detection</p>
            
            {!selectedArenaId ? (
              <div className="warning">
                <p>⚠️ Please select an arena first to view and manage games.</p>
              </div>
            ) : (
              <div>
                {/* Manual Scheduling Form */}
                {showManualScheduling && selectedGame && (
                  <div className="manual-scheduling-form">
                    <h3>Manually Schedule Game</h3>
                    <div className="game-info">
                      <p><strong>Game:</strong> {getTeamName(selectedGame.home_team_id)} vs {getTeamName(selectedGame.away_team_id)}</p>
                      <p><strong>League:</strong> {getLeagueName(selectedGame.league_id)}</p>
                      <p><strong>Ice Time:</strong> {selectedGame.ice_time} minutes</p>
                    </div>
                    
                    <form onSubmit={handleManualScheduleSubmit} className="form">
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="manualDate">Date:</label>
                          <input
                            type="date"
                            id="manualDate"
                            value={manualDate}
                            onChange={(e) => setManualDate(e.target.value)}
                            required
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="manualTime">Time:</label>
                          <input
                            type="time"
                            id="manualTime"
                            value={manualTime}
                            onChange={(e) => setManualTime(e.target.value)}
                            required
                            className="form-input"
                          />
                        </div>
                      </div>
                      <div className="form-actions">
                        <button 
                          type="submit" 
                          className="btn btn-primary"
                          disabled={updateGameMutation.isPending}
                        >
                          {updateGameMutation.isPending ? 'Scheduling...' : 'Schedule Game'}
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-secondary"
                          onClick={() => {
                            setShowManualScheduling(false);
                            setSelectedGame(null);
                            setManualDate('');
                            setManualTime('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* View Toggle */}
                <div className="view-toggle">
                  <button
                    className={`btn ${viewMode === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setViewMode('calendar')}
                  >
                    Calendar View
                  </button>
                  <button
                    className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setViewMode('list')}
                  >
                    List View
                  </button>
                </div>

                {/* Calendar View */}
                {viewMode === 'calendar' && (
                  <div className="calendar-view">
                    <div className="calendar-header">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => navigateDays('prev')}
                      >
                        ← Previous 10 Days
                      </button>
                      <h3>
                        Games Schedule - {currentDate.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}
                      </h3>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => navigateDays('next')}
                      >
                        Next 10 Days →
                      </button>
                    </div>
                    
                    <div className="calendar-grid">
                      {getDaysWithGames(currentDate).map((date) => {
                        const games = getGamesForDate(date);
                        return (
                          <div key={date.toISOString()} className="calendar-day">
                            <div className="day-header">
                              <h4>{formatDate(date)}</h4>
                              <div className="day-header-actions">
                                <span className="game-count">{games.length} game{games.length !== 1 ? 's' : ''}</span>
                                <button
                                  className="btn btn-sm btn-compact"
                                  onClick={() => compactGamesForDay(date)}
                                  title="Remove gaps between games"
                                >
                                  Compact
                                </button>
                              </div>
                            </div>
                            <div className="day-games">
                              {games.map((game) => (
                                <div
                                  key={game.id}
                                  className="calendar-game"
                                  onClick={() => handleManualSchedule(game)}
                                  title="Click to manually schedule"
                                >
                                  <div className="game-time">{formatTime(game.starts_at)}</div>
                                  <div className="game-teams">
                                    {getTeamName(game.home_team_id)} vs {getTeamName(game.away_team_id)}
                                  </div>
                                  <div className="game-details">
                                    {getLeagueName(game.league_id)} • {game.ice_time}min
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {getDaysWithGames(currentDate).length === 0 && (
                      <div className="no-games">
                        <p>No games found for this arena.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                  <div className="games-list">
                    <h3>Games in {arenas.find(a => a.id === selectedArenaId)?.name}</h3>
                    
                    {gamesLoading ? (
                      <div className="loading">Loading games...</div>
                    ) : (
                      <div className="games-grid">
                        {getArenaGames().map((game) => (
                          <div key={game.id} className="game-card">
                            <div className="game-info">
                              <h4>{getTeamName(game.home_team_id)} vs {getTeamName(game.away_team_id)}</h4>
                              <p><strong>League:</strong> {getLeagueName(game.league_id)}</p>
                              <p><strong>Date & Time:</strong> {new Date(game.starts_at).toLocaleString('sv-SE')}</p>
                              <p><strong>Duration:</strong> {game.ice_time} minutes</p>
                            </div>
                            <div className="game-actions">
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleManualSchedule(game)}
                              >
                                Manually set date and time
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        {getArenaGames().length === 0 && (
                          <div className="no-games">
                            <p>No games found for this arena.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulingPage;