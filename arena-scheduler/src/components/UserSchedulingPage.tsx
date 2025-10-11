import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gamesApi, arenasApi, clubsApi, leaguesApi, nestedApi, seasonsApi, messagesApi } from '@/services/api';
import { useUser } from '@/contexts/UserContext';
import { Game } from '@/types';

const UserSchedulingPage: React.FC = () => {
  const { selectedTeam } = useUser();
  const [selectedArenaId, setSelectedArenaId] = useState<number | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [schedulingMode, setSchedulingMode] = useState<'list' | 'schedule'>('list');
  const [selectedDay, setSelectedDay] = useState<'friday' | 'saturday' | 'sunday' | 'monday' | 'wednesday' | 'special'>('friday');
  const [selectedWeek, setSelectedWeek] = useState<number>(0); // 0 = current week, -1 = previous week, 1 = next week
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
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

  // Get the current season (find the one with is_current: true)
  const currentSeason = seasons.find(season => season.is_current) || (seasons.length > 0 ? seasons[0] : null);

  // Fetch leagues for the current season
  const {
    isLoading: leaguesLoading,
    error: leaguesError,
  } = useQuery({
    queryKey: ['leagues', currentSeason?.id],
    queryFn: () => leaguesApi.getBySeason(currentSeason!.id),
    enabled: !!currentSeason?.id,
  });

  // Use the selected team directly
  const userTeam = selectedTeam;

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

  // Fetch games for the user's team's league
  const {
    data: leagueGames = [],
    isLoading: leagueGamesLoading,
    error: leagueGamesError,
  } = useQuery({
    queryKey: ['league-games', userTeam?.league_id],
    queryFn: () => gamesApi.getByLeague(userTeam!.league_id),
    enabled: !!userTeam?.league_id,
  });

  // Also try fetching all games and filtering by team
  const {
    data: allGamesForTeam = [],
    isLoading: allGamesForTeamLoading,
    error: allGamesForTeamError,
  } = useQuery({
    queryKey: ['all-games-for-team', userTeam?.id],
    queryFn: () => gamesApi.getAll(),
    enabled: !!userTeam?.id,
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

  // Check if a game is considered scheduled
  const isGameScheduled = (game: Game) => {
    // Games are considered scheduled if scheduled_at is not null or undefined
    return game.scheduled_at !== null && game.scheduled_at !== undefined;
  };

  // Filter games for this team in the selected arena (both scheduled and unscheduled)
  // Try both league games and all games approaches
  const teamGamesFromLeague = leagueGames.filter(game => {
    const isTeamMatch = game.home_team_id === selectedTeam?.id || game.away_team_id === selectedTeam?.id;
    const isArenaMatch = game.arena_id === userArena?.id;
    
    return isTeamMatch && isArenaMatch;
  });

  const teamGamesFromAll = allGamesForTeam.filter(game => {
    const isTeamMatch = game.home_team_id === selectedTeam?.id || game.away_team_id === selectedTeam?.id;
    const isArenaMatch = game.arena_id === userArena?.id;
    
    return isTeamMatch && isArenaMatch;
  });

  // Use whichever approach finds games
  const allTeamGames = teamGamesFromLeague.length > 0 ? teamGamesFromLeague : teamGamesFromAll;
  
  // Separate scheduled and unscheduled games
  const scheduledGames = allTeamGames.filter(game => isGameScheduled(game));
  const unscheduledGames = allTeamGames.filter(game => !isGameScheduled(game));
  
  // Combine them with unscheduled first, then scheduled
  const teamGames = [...unscheduledGames, ...scheduledGames];


  // Update game mutation
  const updateGameMutation = useMutation({
    mutationFn: async ({ gameId, updates }: { gameId: number; updates: Partial<Game> }) => {
      await gamesApi.update(gameId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['league-games', userTeam?.league_id] });
      queryClient.invalidateQueries({ queryKey: ['all-games', userArena?.id] });
      queryClient.invalidateQueries({ queryKey: ['all-games-for-team', userTeam?.id] });
    },
  });

  // Send verification email mutation
  const sendVerificationMutation = useMutation({
    mutationFn: async () => {
      return await messagesApi.sendScheduledGamesVerification();
    },
    onSuccess: () => {
      alert('Verification email sent successfully!');
    },
    onError: (error) => {
      console.error('Failed to send verification email:', error);
      alert('Failed to send verification email. Please try again.');
    },
  });

  // Check if all games are scheduled
  const allGamesScheduled = teamGames.length > 0 && teamGames.every(game => isGameScheduled(game));

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
  const getGameDay = (game: Game): 'friday' | 'saturday' | 'sunday' | 'monday' | 'wednesday' => {
    const gameDate = new Date(game.starts_at);
    const dayOfWeek = gameDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    if (dayOfWeek === 1) return 'monday';
    if (dayOfWeek === 3) return 'wednesday';
    if (dayOfWeek === 5) return 'friday';
    if (dayOfWeek === 6) return 'saturday';
    if (dayOfWeek === 0) return 'sunday';
    
    // Default to friday if it's not a recognized day
    return 'friday';
  };

  // Get the weekend dates for the selected week
  const getWeekendDates = (weekOffset: number) => {
    // Use the game's date as the reference point, not today's date
    const referenceDate = selectedGame ? new Date(selectedGame.starts_at) : new Date();
    const currentDay = referenceDate.getDay();
    
    // Calculate the Friday of the week containing the reference date
    let daysToFriday;
    if (currentDay === 0) { // Sunday
      daysToFriday = -2; // Go back to Friday
    } else if (currentDay === 6) { // Saturday
      daysToFriday = -1; // Go back to Friday
    } else if (currentDay === 5) { // Friday
      daysToFriday = 0; // Today is Friday
    } else { // Monday through Thursday
      daysToFriday = 5 - currentDay; // Days until Friday
    }
    
    const friday = new Date(referenceDate);
    friday.setDate(referenceDate.getDate() + daysToFriday);
    
    // Add week offset
    friday.setDate(friday.getDate() + (weekOffset * 7));
    
    const saturday = new Date(friday);
    saturday.setDate(friday.getDate() + 1);
    
    const sunday = new Date(friday);
    sunday.setDate(friday.getDate() + 2);
    
    return { friday, saturday, sunday };
  };


  // Get special days within the week (Monday to Sunday)
  const getSpecialDaysInRange = () => {
    const { friday, sunday } = getWeekendDates(selectedWeek);
    const specialDays = [];
    
    // Calculate the Monday of the week (5 days before Friday)
    const monday = new Date(friday);
    monday.setDate(friday.getDate() - 5);
    
    // Calculate the Sunday of the week (same as our sunday)
    const weekEnd = new Date(sunday);
    
    // Check if 26/12 or 6/1 fall within the week range (Monday to Sunday)
    const startDate = new Date(monday);
    const endDate = new Date(weekEnd);
    
    // Check 26/12 of the current year
    const dec26 = new Date(friday.getFullYear(), 11, 26); // Month is 0-indexed
    if (dec26 >= startDate && dec26 <= endDate) {
      specialDays.push({ date: dec26, name: 'Boxing Day (26/12)' });
    }
    
    // Check 6/1 of the current year
    const jan6 = new Date(friday.getFullYear(), 0, 6); // Month is 0-indexed
    if (jan6 >= startDate && jan6 <= endDate) {
      specialDays.push({ date: jan6, name: 'Epiphany (6/1)' });
    }
    
    // Check 26/12 of next year (in case we're in December and looking at January)
    const nextYearDec26 = new Date(friday.getFullYear() + 1, 11, 26);
    if (nextYearDec26 >= startDate && nextYearDec26 <= endDate) {
      specialDays.push({ date: nextYearDec26, name: 'Boxing Day (26/12)' });
    }
    
    // Check 6/1 of next year (in case we're in December and looking at January)
    const nextYearJan6 = new Date(friday.getFullYear() + 1, 0, 6);
    if (nextYearJan6 >= startDate && nextYearJan6 <= endDate) {
      specialDays.push({ date: nextYearJan6, name: 'Epiphany (6/1)' });
    }
    
    return specialDays;
  };

  // Get the date for a specific day in the selected week
  const getDateForDay = (day: 'friday' | 'saturday' | 'sunday' | 'monday' | 'wednesday' | 'special') => {
    if (day === 'special') {
      const specialDays = getSpecialDaysInRange();
      return specialDays.length > 0 ? specialDays[0].date : new Date();
    }
    const { friday, saturday, sunday } = getWeekendDates(selectedWeek);
    
    if (day === 'friday') return friday;
    if (day === 'saturday') return saturday;
    if (day === 'sunday') return sunday;
    if (day === 'monday') {
      const monday = new Date(friday);
      monday.setDate(friday.getDate() - 4); // Monday is 4 days before Friday
      return monday;
    }
    if (day === 'wednesday') {
      const wednesday = new Date(friday);
      wednesday.setDate(friday.getDate() - 2); // Wednesday is 2 days before Friday
      return wednesday;
    }
    
    return friday; // fallback
  };

  // Check if a date is a blocked day (24/12, 25/12, 31/12)
  const isBlockedDay = (date: Date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return (day === 24 && month === 12) || // Christmas Eve
           (day === 25 && month === 12) || // Christmas Day
           (day === 31 && month === 12);   // New Year's Eve
  };

  // Check if a time slot is available (not conflicting with other games)
  const isTimeSlotAvailable = (time: string, gameDay: 'friday' | 'saturday' | 'sunday' | 'monday' | 'wednesday' | 'special') => {
    if (!selectedGame || !userArena) return true;
    
    const [hours, minutes] = time.split(':');
    let slotTime;
    
    if (gameDay === 'special') {
      // For special days, we need to get the special day date
      const specialDays = getSpecialDaysInRange();
      if (specialDays.length === 0) return false;
      slotTime = new Date(specialDays[0].date); // Use the first special day
    } else {
      slotTime = getDateForDay(gameDay);
    }
    
    slotTime.setHours(parseInt(hours), parseInt(minutes));
    
    // Check if this is a blocked day (24/12, 25/12, 31/12)
    if (isBlockedDay(slotTime)) {
      return false;
    }
    
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

  const handleUpdateGameTime = async (newTime: string, dayType?: 'friday' | 'saturday' | 'sunday' | 'monday' | 'wednesday' | 'special') => {
    if (!selectedGame) return;
    
    try {
      const [hours, minutes] = newTime.split(':');
      let newDateTime;
      
      if (dayType === 'special') {
        const specialDays = getSpecialDaysInRange();
        if (specialDays.length === 0) return;
        newDateTime = new Date(specialDays[0].date);
      } else {
        newDateTime = getDateForDay(selectedDay);
      }
      
      newDateTime.setHours(parseInt(hours), parseInt(minutes));
      
      await updateGameMutation.mutateAsync({
        gameId: selectedGame.id,
        updates: { 
          starts_at: newDateTime.toISOString(),
          scheduled_at: newDateTime.toISOString() // Mark as scheduled
        }
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

  // Check if all time slots are taken for the current weekend
  const areAllSlotsTaken = () => {
    const fridaySlots = ['19:45', '22:05'];
    const saturdaySlots = ['11:00', '13:20', '15:40', '18:00'];
    const sundaySlots = ['13:00', '15:20', '17:40'];
    const specialSlots = ['11:00', '13:20', '15:40', '18:00'];
    const mondaySlots = ['21:15'];
    const wednesdaySlots = ['21:15'];
    
    const allSlots: Array<{ time: string; day: 'friday' | 'saturday' | 'sunday' | 'monday' | 'wednesday' | 'special' }> = [
      ...fridaySlots.map(time => ({ time, day: 'friday' as const })),
      ...saturdaySlots.map(time => ({ time, day: 'saturday' as const })),
      ...sundaySlots.map(time => ({ time, day: 'sunday' as const }))
    ];
    
    // Add special day slots if they exist
    const specialDays = getSpecialDaysInRange();
    if (specialDays.length > 0) {
      allSlots.push(...specialSlots.map(time => ({ time, day: 'special' as const })));
    }
    
    // Add Monday and Wednesday slots if ice time is 75 minutes
    if (selectedGame && selectedGame.ice_time === 75) {
      allSlots.push(...mondaySlots.map(time => ({ time, day: 'monday' as const })));
      allSlots.push(...wednesdaySlots.map(time => ({ time, day: 'wednesday' as const })));
    }
    
    return allSlots.every(({ time, day }) => !isTimeSlotAvailable(time, day));
  };

  // Calendar view helper functions
  const getDaysWithGames = (startDate: Date) => {
    if (!selectedTeam?.id || !userArena) return [];
    
    // Get all unique dates that have games for this team
    const gameDates = new Set<string>();
    teamGames.forEach(game => {
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
    if (!selectedTeam?.id || !userArena) return [];
    const dateStr = date.toISOString().split('T')[0];
    return teamGames.filter(game => {
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

  // Loading states
  if (seasonsLoading || leaguesLoading || userClubLoading || userArenaLoading) {
    return <div className="loading">Loading your team information...</div>;
  }

  if (seasonsError || leaguesError || userClubError || userArenaError) {
    return <div className="error">Error loading team data</div>;
  }

  if (!selectedTeam || !userTeam || !userClub || !userArena) {
    return (
      <div className="scheduling-page">
        <div className="header">
          <h1>Schedule Your Games</h1>
          <p>Please select a team to continue.</p>
        </div>
        <div className="error">
          <p>Your account is not properly associated with a team, club, or arena.</p>
          <p>Please contact an administrator for assistance.</p>
        </div>
      </div>
    );
  }

  if (teamsLoading || leagueGamesLoading || allGamesForTeamLoading || allGamesLoading) {
    return <div className="loading">Loading your team's games...</div>;
  }

  if (teamsError || leagueGamesError || allGamesForTeamError || allGamesError) {
    return <div className="error">Error loading games data: {leagueGamesError?.message || allGamesForTeamError?.message || teamsError?.message || allGamesError?.message}</div>;
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

      {/* View Toggle and Actions */}
      <div className="view-toggle">
        <div>
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
        
        {allGamesScheduled && (
          <button
            className="btn btn-primary"
            onClick={() => sendVerificationMutation.mutate()}
            disabled={sendVerificationMutation.isPending}
          >
            {sendVerificationMutation.isPending ? 'Sending...' : 'Send Verification Email'}
          </button>
        )}
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
              Your Games - {currentDate.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}
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
                    <span className="game-count">{games.length} game{games.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="day-games">
                    {games.map((game) => (
                      <div
                        key={game.id}
                        className={`calendar-game ${isGameScheduled(game) ? 'scheduled' : ''}`}
                        onClick={() => !isGameScheduled(game) && handleScheduleGame(game)}
                        title={isGameScheduled(game) ? "Game is scheduled" : "Click to schedule this game"}
                      >
                        <div className="game-time">{formatTime(game.starts_at)}</div>
                        <div className="game-teams">
                          {getTeamName(game.home_team_id)} vs {getTeamName(game.away_team_id)}
                        </div>
                        <div className="game-details">
                          {game.ice_time}min
                          {isGameScheduled(game) && <span className="scheduled-badge">Scheduled</span>}
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
              <p>No games found for your team.</p>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && schedulingMode === 'list' && (
        <div className="games-section">
          <h2>Your Team's Games</h2>
          <p>Unscheduled games can be scheduled by clicking on them</p>
          
          {teamGames.length === 0 ? (
            <div className="no-games">
              <p>No games found for your team.</p>
              <p>No games have been created yet.</p>
            </div>
          ) : (
            <div className="games-list">
              {teamGames.map((game) => (
                <div key={game.id} className={`game-card ${isGameScheduled(game) ? 'scheduled' : ''}`}>
                  <div className="game-info">
                    <h3>
                      {getTeamName(game.home_team_id)} vs {getTeamName(game.away_team_id)}
                      {isGameScheduled(game) && <span className="scheduled-badge">Scheduled</span>}
                    </h3>
                    <p className="game-details">
                      <strong>Arena:</strong> {getArenaName(game.arena_id)}<br />
                      <strong>Date & Time:</strong> {formatDateTime(game.starts_at)}<br />
                      <strong>Duration:</strong> {game.ice_time} minutes
                    </p>
                  </div>
                  <div className="game-actions">
                    {!isGameScheduled(game) ? (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleScheduleGame(game)}
                      >
                        Schedule Game
                      </button>
                    ) : (
                      <button
                        className="btn btn-secondary"
                        disabled
                      >
                        Already Scheduled
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scheduling Interface */}
      {schedulingMode === 'schedule' && (
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
                
                {/* Week Navigation */}
                <div className="week-navigation">
                  <button
                    className="week-nav-btn"
                    onClick={() => setSelectedWeek(selectedWeek - 1)}
                  >
                    ← Previous Week
                  </button>
                  <div className="week-info">
                    {(() => {
                      const { friday, sunday } = getWeekendDates(selectedWeek);
                      const formatDate = (date: Date) => {
                        const day = date.getDate();
                        const month = date.getMonth() + 1;
                        return `${day}/${month}`;
                      };
                      return `${formatDate(friday)}-${formatDate(sunday)}`;
                    })()}
                  </div>
                  <button
                    className="week-nav-btn"
                    onClick={() => setSelectedWeek(selectedWeek + 1)}
                  >
                    Next Week →
                  </button>
                </div>
                
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
                  {/* Special Days */}
                  {getSpecialDaysInRange().map((specialDay, index) => (
                    <button
                      key={`special-${index}`}
                      className={`day-btn ${selectedDay === 'special' ? 'active' : ''} special-day`}
                      onClick={() => setSelectedDay('special')}
                    >
                      {specialDay.name}
                    </button>
                  ))}
                  
                  {/* Monday and Wednesday - only show for 75-minute games */}
                  {selectedGame && selectedGame.ice_time === 75 && (
                    <>
                      <button
                        className={`day-btn ${selectedDay === 'monday' ? 'active' : ''} ${getGameDay(selectedGame) === 'monday' ? 'correct-day' : ''} ${isBlockedDay(getDateForDay('monday')) ? 'blocked-day' : ''}`}
                        onClick={() => setSelectedDay('monday')}
                        disabled={isBlockedDay(getDateForDay('monday'))}
                      >
                        Monday {getGameDay(selectedGame) === 'monday' ? '(Game Day)' : ''} {isBlockedDay(getDateForDay('monday')) ? '(No Games)' : ''}
                      </button>
                      <button
                        className={`day-btn ${selectedDay === 'wednesday' ? 'active' : ''} ${getGameDay(selectedGame) === 'wednesday' ? 'correct-day' : ''} ${isBlockedDay(getDateForDay('wednesday')) ? 'blocked-day' : ''}`}
                        onClick={() => setSelectedDay('wednesday')}
                        disabled={isBlockedDay(getDateForDay('wednesday'))}
                      >
                        Wednesday {getGameDay(selectedGame) === 'wednesday' ? '(Game Day)' : ''} {isBlockedDay(getDateForDay('wednesday')) ? '(No Games)' : ''}
                      </button>
                    </>
                  )}
                  
                  <button
                    className={`day-btn ${selectedDay === 'friday' ? 'active' : ''} ${getGameDay(selectedGame) === 'friday' ? 'correct-day' : ''} ${isBlockedDay(getDateForDay('friday')) ? 'blocked-day' : ''}`}
                    onClick={() => setSelectedDay('friday')}
                    disabled={isBlockedDay(getDateForDay('friday'))}
                  >
                    Friday {getGameDay(selectedGame) === 'friday' ? '(Game Day)' : ''} {isBlockedDay(getDateForDay('friday')) ? '(No Games)' : ''}
                  </button>
                  <button
                    className={`day-btn ${selectedDay === 'saturday' ? 'active' : ''} ${getGameDay(selectedGame) === 'saturday' ? 'correct-day' : ''} ${isBlockedDay(getDateForDay('saturday')) ? 'blocked-day' : ''}`}
                    onClick={() => setSelectedDay('saturday')}
                    disabled={isBlockedDay(getDateForDay('saturday'))}
                  >
                    Saturday {getGameDay(selectedGame) === 'saturday' ? '(Game Day)' : ''} {isBlockedDay(getDateForDay('saturday')) ? '(No Games)' : ''}
                  </button>
                  <button
                    className={`day-btn ${selectedDay === 'sunday' ? 'active' : ''} ${getGameDay(selectedGame) === 'sunday' ? 'correct-day' : ''} ${isBlockedDay(getDateForDay('sunday')) ? 'blocked-day' : ''}`}
                    onClick={() => setSelectedDay('sunday')}
                    disabled={isBlockedDay(getDateForDay('sunday'))}
                  >
                    Sunday {getGameDay(selectedGame) === 'sunday' ? '(Game Day)' : ''} {isBlockedDay(getDateForDay('sunday')) ? '(No Games)' : ''}
                  </button>
                </div>

                {/* All Slots Taken Message */}
                {areAllSlotsTaken() && (
                  <div className="all-slots-taken">
                    <h4>All time slots are taken for this weekend</h4>
                    <p>Try selecting a different week using the navigation above.</p>
                  </div>
                )}

                {/* Blocked Days Message */}
                {(() => {
                  const fridayBlocked = isBlockedDay(getDateForDay('friday'));
                  const saturdayBlocked = isBlockedDay(getDateForDay('saturday'));
                  const sundayBlocked = isBlockedDay(getDateForDay('sunday'));
                  const allDaysBlocked = fridayBlocked && saturdayBlocked && sundayBlocked;
                  
                  if (allDaysBlocked) {
                    return (
                      <div className="all-slots-taken">
                        <h4>No games allowed on this weekend</h4>
                        <p>Games are not allowed on Christmas Eve (24/12), Christmas Day (25/12), or New Year's Eve (31/12).</p>
                      </div>
                    );
                  }
                  
                  if (fridayBlocked || saturdayBlocked || sundayBlocked) {
                    const blockedDays = [];
                    if (fridayBlocked) blockedDays.push('Friday');
                    if (saturdayBlocked) blockedDays.push('Saturday');
                    if (sundayBlocked) blockedDays.push('Sunday');
                    
                    return (
                      <div className="blocked-days-info">
                        <h4>Some days are blocked</h4>
                        <p>No games allowed on: {blockedDays.join(', ')}</p>
                      </div>
                    );
                  }
                  
                  return null;
                })()}

                <div className="time-slots">
                  {/* Special Days Section */}
                  {getSpecialDaysInRange().map((specialDay, index) => (
                    <div key={index} className={`day-section ${selectedDay === 'special' ? 'active' : 'disabled'}`}>
                      <h4>{specialDay.name}</h4>
                      <div className="time-grid">
                        {['11:00', '13:20', '15:40', '18:00'].map(time => {
                          const isAvailable = selectedDay === 'special' && isTimeSlotAvailable(time, 'special');
                          const isOccupied = selectedDay === 'special' && !isTimeSlotAvailable(time, 'special');
                          
                          // Hide occupied time slots
                          if (isOccupied) return null;
                          
                          return (
                            <button
                              key={time}
                              className={`time-slot ${!isAvailable ? 'disabled' : ''}`}
                              onClick={() => isAvailable && handleUpdateGameTime(time, 'special')}
                              disabled={!isAvailable}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Monday Section - only show for 75-minute games */}
                  {selectedGame && selectedGame.ice_time === 75 && (
                    <div className={`day-section ${selectedDay === 'monday' ? 'active' : 'disabled'}`}>
                      <h4>Monday (21:15)</h4>
                      <div className="time-grid">
                        {['21:15'].map(time => {
                          const isAvailable = selectedDay === 'monday' && isTimeSlotAvailable(time, 'monday');
                          const isOccupied = selectedDay === 'monday' && !isTimeSlotAvailable(time, 'monday');
                          
                          // Hide occupied time slots
                          if (isOccupied) return null;
                          
                          return (
                            <button
                              key={time}
                              className={`time-slot ${!isAvailable ? 'disabled' : ''}`}
                              onClick={() => isAvailable && handleUpdateGameTime(time, 'monday')}
                              disabled={!isAvailable}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Wednesday Section - only show for 75-minute games */}
                  {selectedGame && selectedGame.ice_time === 75 && (
                    <div className={`day-section ${selectedDay === 'wednesday' ? 'active' : 'disabled'}`}>
                      <h4>Wednesday (21:15)</h4>
                      <div className="time-grid">
                        {['21:15'].map(time => {
                          const isAvailable = selectedDay === 'wednesday' && isTimeSlotAvailable(time, 'wednesday');
                          const isOccupied = selectedDay === 'wednesday' && !isTimeSlotAvailable(time, 'wednesday');
                          
                          // Hide occupied time slots
                          if (isOccupied) return null;
                          
                          return (
                            <button
                              key={time}
                              className={`time-slot ${!isAvailable ? 'disabled' : ''}`}
                              onClick={() => isAvailable && handleUpdateGameTime(time, 'wednesday')}
                              disabled={!isAvailable}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Friday Section */}
                  <div className={`day-section ${selectedDay === 'friday' ? 'active' : 'disabled'}`}>
                    <h4>Friday (19:45 - 22:30)</h4>
                    <div className="time-grid">
                      {['19:45', '22:05'].map(time => {
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
                      {['11:00', '13:20', '15:40', '18:00'].map(time => {
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
                      {['13:00', '15:20', '17:40'].map(time => {
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
