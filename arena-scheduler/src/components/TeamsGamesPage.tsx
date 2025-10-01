import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi, gamesApi, seasonsApi, leaguesApi, clubsApi, arenasApi } from '@/services/api';
import type { Team, Game, CreateTeamData, CreateGameData } from '@/types';

const TeamsGamesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'teams' | 'games'>('teams');
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState<number | null>(null);

  // Teams form state
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamClubId, setNewTeamClubId] = useState<number | ''>('');
  const [newTeamUrl, setNewTeamUrl] = useState('');
  const [newTeamContactEmail, setNewTeamContactEmail] = useState('');
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamClubId, setEditTeamClubId] = useState<number | ''>('');
  const [editTeamUrl, setEditTeamUrl] = useState('');
  const [editTeamContactEmail, setEditTeamContactEmail] = useState('');

  // Games form state
  const [newGameHomeTeamId, setNewGameHomeTeamId] = useState<number | ''>('');
  const [newGameAwayTeamId, setNewGameAwayTeamId] = useState<number | ''>('');
  const [newGameArenaId, setNewGameArenaId] = useState<number | ''>('');
  const [newGameStartsAt, setNewGameStartsAt] = useState('');
  const [newGameIceTime, setNewGameIceTime] = useState<number | ''>(140);
  const [showCustomIceTime, setShowCustomIceTime] = useState(false);
  const [customIceTime, setCustomIceTime] = useState<number | ''>('');
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editGameHomeTeamId, setEditGameHomeTeamId] = useState<number | ''>('');
  const [editGameAwayTeamId, setEditGameAwayTeamId] = useState<number | ''>('');
  const [editGameArenaId, setEditGameArenaId] = useState<number | ''>('');
  const [editGameStartsAt, setEditGameStartsAt] = useState('');
  const [editGameIceTime, setEditGameIceTime] = useState<number | ''>('');
  const [showEditCustomIceTime, setShowEditCustomIceTime] = useState(false);
  const [editCustomIceTime, setEditCustomIceTime] = useState<number | ''>('');

  const queryClient = useQueryClient();

  // Fetch data
  const {
    data: seasons = [],
  } = useQuery({
    queryKey: ['seasons'],
    queryFn: seasonsApi.getAll,
  });

  // Auto-select current season when seasons are loaded
  useEffect(() => {
    if (seasons.length > 0 && !selectedSeasonId) {
      // Auto-select the season with is_current: true
      const currentSeason = seasons.find(season => season.is_current);
      if (currentSeason) {
        setSelectedSeasonId(currentSeason.id);
      } else {
        // Fallback to the most recent season if no current season is marked
        const fallbackSeason = seasons[seasons.length - 1];
        if (fallbackSeason) {
          setSelectedSeasonId(fallbackSeason.id);
        }
      }
    }
  }, [seasons, selectedSeasonId]);

  const {
    data: leagues = [],
  } = useQuery({
    queryKey: ['leagues', selectedSeasonId],
    queryFn: () => selectedSeasonId ? leaguesApi.getBySeason(selectedSeasonId) : Promise.resolve([]),
    enabled: !!selectedSeasonId,
  });

  // Auto-set ice time to league's default when league is selected
  useEffect(() => {
    if (selectedLeagueId && leagues.length > 0) {
      const selectedLeague = leagues.find(league => league.id === selectedLeagueId);
      if (selectedLeague && selectedLeague.default_ice_time) {
        setNewGameIceTime(selectedLeague.default_ice_time);
      }
    }
  }, [selectedLeagueId, leagues]);

  const {
    data: clubs = [],
  } = useQuery({
    queryKey: ['clubs'],
    queryFn: clubsApi.getAll,
  });

  const {
    data: arenas = [],
  } = useQuery({
    queryKey: ['arenas'],
    queryFn: arenasApi.getAll,
  });

  const {
    data: teams = [],
    isLoading: teamsLoading,
    error: teamsError,
  } = useQuery({
    queryKey: ['teams', selectedLeagueId],
    queryFn: () => selectedLeagueId ? teamsApi.getByLeague(selectedLeagueId) : Promise.resolve([]),
    enabled: !!selectedLeagueId,
  });

  const {
    data: games = [],
    isLoading: gamesLoading,
    error: gamesError,
  } = useQuery({
    queryKey: ['games', selectedLeagueId],
    queryFn: () => selectedLeagueId ? gamesApi.getByLeague(selectedLeagueId) : Promise.resolve([]),
    enabled: !!selectedLeagueId,
  });

  // Teams mutations
  const createTeamMutation = useMutation({
    mutationFn: (data: CreateTeamData) => teamsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', selectedLeagueId] });
      setNewTeamName('');
      setNewTeamClubId('');
      setNewTeamUrl('');
      setNewTeamContactEmail('');
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateTeamData> }) =>
      teamsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', selectedLeagueId] });
      setEditingTeam(null);
      setEditTeamName('');
      setEditTeamClubId('');
      setEditTeamUrl('');
      setEditTeamContactEmail('');
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (id: number) => teamsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', selectedLeagueId] });
    },
  });

  // Games mutations
  const createGameMutation = useMutation({
    mutationFn: (data: CreateGameData) => gamesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games', selectedLeagueId] });
      setNewGameHomeTeamId('');
      setNewGameAwayTeamId('');
      setNewGameArenaId('');
      setNewGameStartsAt('');
      setShowCustomIceTime(false);
      setCustomIceTime('');
      // Reset ice time to the league's default
      if (selectedLeagueId && leagues.length > 0) {
        const selectedLeague = leagues.find(league => league.id === selectedLeagueId);
        if (selectedLeague && selectedLeague.default_ice_time) {
          setNewGameIceTime(selectedLeague.default_ice_time);
        } else {
          setNewGameIceTime(140); // fallback
        }
      } else {
        setNewGameIceTime(140); // fallback
      }
    },
  });

  const updateGameMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateGameData> }) =>
      gamesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games', selectedLeagueId] });
      setEditingGame(null);
      setEditGameHomeTeamId('');
      setEditGameAwayTeamId('');
      setEditGameArenaId('');
      setEditGameStartsAt('');
      setEditGameIceTime('');
      setShowEditCustomIceTime(false);
      setEditCustomIceTime('');
    },
  });

  const deleteGameMutation = useMutation({
    mutationFn: (id: number) => gamesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games', selectedLeagueId] });
    },
  });

  // Event handlers
  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeamName.trim() && newTeamClubId && selectedLeagueId) {
      createTeamMutation.mutate({
        name: newTeamName.trim(),
        club_id: Number(newTeamClubId),
        league_id: selectedLeagueId,
        url: newTeamUrl.trim() || undefined,
        contact_email: newTeamContactEmail.trim() || undefined,
      });
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setEditTeamName(team.name);
    setEditTeamClubId(team.club_id);
    setEditTeamUrl(team.url || '');
    setEditTeamContactEmail(team.contact_email || '');
  };

  const handleUpdateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeam && editTeamName.trim() && editTeamClubId && selectedLeagueId) {
      updateTeamMutation.mutate({
        id: editingTeam.id,
        data: {
          name: editTeamName.trim(),
          club_id: Number(editTeamClubId),
          league_id: selectedLeagueId,
          url: editTeamUrl.trim() || undefined,
          contact_email: editTeamContactEmail.trim() || undefined,
        },
      });
    }
  };

  const handleDeleteTeam = (id: number) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      deleteTeamMutation.mutate(id);
    }
  };

  const handleCreateGame = (e: React.FormEvent) => {
    e.preventDefault();
    const iceTime = showCustomIceTime ? customIceTime : newGameIceTime;
    if (newGameHomeTeamId && newGameAwayTeamId && selectedLeagueId && newGameArenaId && newGameStartsAt && iceTime) {
      // Add default time (8:00 AM) to the date
      const startsAtWithTime = `${newGameStartsAt}T08:00:00`;
      
      createGameMutation.mutate({
        home_team_id: Number(newGameHomeTeamId),
        away_team_id: Number(newGameAwayTeamId),
        league_id: selectedLeagueId,
        arena_id: Number(newGameArenaId),
        starts_at: startsAtWithTime,
        ice_time: Number(iceTime),
      });
    }
  };

  const handleEditGame = (game: Game) => {
    setEditingGame(game);
    setEditGameHomeTeamId(game.home_team_id);
    setEditGameAwayTeamId(game.away_team_id);
    setEditGameArenaId(game.arena_id);
    // Extract just the date part from the datetime
    setEditGameStartsAt(game.starts_at.split('T')[0]);
    setEditGameIceTime(game.ice_time);
    // Check if ice time is custom (not in standard options)
    const standardTimes = [75, 90, 100, 120, 140];
    if (standardTimes.includes(game.ice_time)) {
      setShowEditCustomIceTime(false);
      setEditCustomIceTime('');
    } else {
      setShowEditCustomIceTime(true);
      setEditCustomIceTime(game.ice_time);
    }
  };

  const handleUpdateGame = (e: React.FormEvent) => {
    e.preventDefault();
    const iceTime = showEditCustomIceTime ? editCustomIceTime : editGameIceTime;
    if (editingGame && editGameHomeTeamId && editGameAwayTeamId && selectedLeagueId && editGameArenaId && editGameStartsAt && iceTime) {
      // Add default time (8:00 AM) to the date
      const startsAtWithTime = `${editGameStartsAt}T08:00:00`;
      
      updateGameMutation.mutate({
        id: editingGame.id,
        data: {
          home_team_id: Number(editGameHomeTeamId),
          away_team_id: Number(editGameAwayTeamId),
          league_id: selectedLeagueId,
          arena_id: Number(editGameArenaId),
          starts_at: startsAtWithTime,
          ice_time: Number(iceTime),
        },
      });
    }
  };

  const handleDeleteGame = (id: number) => {
    if (window.confirm('Are you sure you want to delete this game?')) {
      deleteGameMutation.mutate(id);
    }
  };

  // Helper functions

  const getSeasonName = (seasonId: number) => {
    const season = seasons.find(s => s.id === seasonId);
    return season ? season.name : `Season ${seasonId}`;
  };

  const getLeagueName = (leagueId: number) => {
    const league = leagues.find(l => l.id === leagueId);
    return league ? league.name : `League ${leagueId}`;
  };

  const getArenaName = (arenaId: number) => {
    const arena = arenas.find(a => a.id === arenaId);
    return arena ? arena.name : `Arena ${arenaId}`;
  };


  const formatIceTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${minutes} min (${hours}h ${mins}m)` : `${minutes} min (${hours}h)`;
    }
    return `${minutes} min`;
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

  const getClubName = (clubId: number) => {
    const club = clubs.find(c => c.id === clubId);
    return club ? club.name : 'Unknown Club';
  };

  const getTeamDisplayName = (team: Team) => {
    const clubName = getClubName(team.club_id);
    return `${clubName} - ${team.name}`;
  };

  const getTeamArenaId = (teamId: number) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return null;
    const club = clubs.find(c => c.id === team.club_id);
    return club ? club.arena_id : null;
  };

  const getTeamNameWithClub = (teamId: number) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return `Team ${teamId}`;
    const clubName = getClubName(team.club_id);
    return `${clubName} - ${team.name}`;
  };

  return (
    <div className="teams-games-page">
      <div className="header">
        <h1>Teams & Games Management</h1>
        <p>Manage teams and schedule games for your leagues.</p>
      </div>

      {/* Season and League Selection */}
      <div className="selection-section">
        <div className="selection-row">
          <div className="form-group">
            <label htmlFor="seasonSelect">Season:</label>
            <select
              id="seasonSelect"
              value={selectedSeasonId || ''}
              onChange={(e) => {
                setSelectedSeasonId(Number(e.target.value) || null);
                setSelectedLeagueId(null);
              }}
              className="season-select"
            >
              <option value="">Choose a season</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name} {season.is_current ? '(Current)' : ''}
                </option>
              ))}
            </select>
            {selectedSeasonId && (
              <div className="season-info">
                <span className="current-season-indicator">
                  ✓ Currently managing: {getSeasonName(selectedSeasonId)}
                </span>
              </div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="leagueSelect">League:</label>
            <select
              id="leagueSelect"
              value={selectedLeagueId || ''}
              onChange={(e) => setSelectedLeagueId(Number(e.target.value) || null)}
              className="league-select"
              disabled={!selectedSeasonId}
            >
              <option value="">Choose a league</option>
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!selectedSeasonId ? (
        <div className="warning">
          <p>⚠️ Please select a season to manage teams and games.</p>
        </div>
      ) : !selectedLeagueId ? (
        <div className="warning">
          <p>⚠️ Please select a league to manage teams and games.</p>
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab ${activeTab === 'teams' ? 'active' : ''}`}
              onClick={() => setActiveTab('teams')}
            >
              Teams ({teams.length})
            </button>
            <button
              className={`tab ${activeTab === 'games' ? 'active' : ''}`}
              onClick={() => setActiveTab('games')}
            >
              Games ({games.length})
            </button>
          </div>

          {/* Teams Tab */}
          {activeTab === 'teams' && (
            <div className="tab-content">
              <div className="section-header">
                <h2>Teams Management</h2>
              </div>

              {/* Always visible form */}
              <form onSubmit={handleCreateTeam} className="form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="teamName">Team Name:</label>
                    <input
                      id="teamName"
                      type="text"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="e.g., Team Alpha"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="teamClub">Club:</label>
                    <select
                      id="teamClub"
                      value={newTeamClubId}
                      onChange={(e) => setNewTeamClubId(Number(e.target.value))}
                      required
                    >
                      <option value="">Select a club</option>
                      {clubs.map((club) => (
                        <option key={club.id} value={club.id}>
                          {club.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="teamLeague">League:</label>
                    <select
                      id="teamLeague"
                      value={selectedLeagueId || ''}
                      disabled
                      className="disabled-select"
                    >
                      <option value={selectedLeagueId}>{getLeagueName(selectedLeagueId!)}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="teamContactEmail">Contact Email:</label>
                    <input
                      id="teamContactEmail"
                      type="email"
                      value={newTeamContactEmail}
                      onChange={(e) => setNewTeamContactEmail(e.target.value)}
                      placeholder="team@example.com"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="teamUrl">Team URL (optional):</label>
                  <input
                    id="teamUrl"
                    type="url"
                    value={newTeamUrl}
                    onChange={(e) => setNewTeamUrl(e.target.value)}
                    placeholder="https://team-website.com"
                  />
                </div>
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={createTeamMutation.isPending}
                  >
                    {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
                  </button>
                </div>
              </form>

              <div className="list">
                {teamsLoading ? (
                  <div className="loading">Loading teams...</div>
                ) : teamsError ? (
                  <div className="error">Error loading teams</div>
                ) : teams.length === 0 ? (
                  <p className="empty-state">No teams found. Create your first team above.</p>
                ) : (
                  teams.map((team) => (
                    <div key={team.id} className="list-item">
                      {editingTeam?.id === team.id ? (
                        <form onSubmit={handleUpdateTeam} className="edit-form">
                          <input
                            type="text"
                            value={editTeamName}
                            onChange={(e) => setEditTeamName(e.target.value)}
                            className="edit-input"
                            placeholder="Team name"
                            required
                          />
                          <select
                            value={editTeamClubId}
                            onChange={(e) => setEditTeamClubId(Number(e.target.value))}
                            className="edit-select"
                            required
                          >
                            {clubs.map((club) => (
                              <option key={club.id} value={club.id}>
                                {club.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="email"
                            value={editTeamContactEmail}
                            onChange={(e) => setEditTeamContactEmail(e.target.value)}
                            className="edit-input"
                            placeholder="Contact email"
                          />
                          <div className="edit-actions">
                            <button type="submit" className="btn btn-sm btn-primary" disabled={updateTeamMutation.isPending}>
                              {updateTeamMutation.isPending ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                setEditingTeam(null);
                                setEditTeamName('');
                                setEditTeamClubId('');
                                setEditTeamUrl('');
                                setEditTeamContactEmail('');
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="item-info">
                            <span className="item-name">{team.name}</span>
                            <div className="item-details">
                              <span className="item-detail">Club: {getClubName(team.club_id)}</span>
                              <span className="item-detail">League: {getLeagueName(team.league_id)}</span>
                              {team.contact_email && (
                                <span className="item-detail">Email: {team.contact_email}</span>
                              )}
                              {team.url && (
                                <span className="item-detail">
                                  <a href={team.url} target="_blank" rel="noopener noreferrer">
                                    Website
                                  </a>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="item-actions">
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleEditTeam(team)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteTeam(team.id)}
                              disabled={deleteTeamMutation.isPending}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Games Tab */}
          {activeTab === 'games' && (
            <div className="tab-content">
              <div className="section-header">
                <h2>Games Management</h2>
              </div>

              {/* Always visible form */}
              <form onSubmit={handleCreateGame} className="form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="gameHomeTeam">Home Team:</label>
                    <select
                      id="gameHomeTeam"
                      value={newGameHomeTeamId}
                      onChange={(e) => {
                        const teamId = Number(e.target.value);
                        setNewGameHomeTeamId(teamId);
                        // Auto-set arena to the team's club arena
                        const arenaId = getTeamArenaId(teamId);
                        if (arenaId) {
                          setNewGameArenaId(arenaId);
                        }
                      }}
                      required
                    >
                      <option value="">Select home team</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {getTeamDisplayName(team)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="gameAwayTeam">Away Team:</label>
                    <select
                      id="gameAwayTeam"
                      value={newGameAwayTeamId}
                      onChange={(e) => setNewGameAwayTeamId(Number(e.target.value))}
                      required
                    >
                      <option value="">Select away team</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {getTeamDisplayName(team)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="gameLeague">League:</label>
                    <select
                      id="gameLeague"
                      value={selectedLeagueId || ''}
                      disabled
                      className="disabled-select"
                    >
                      <option value={selectedLeagueId}>{getLeagueName(selectedLeagueId!)}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="gameArena">Arena:</label>
                    <select
                      id="gameArena"
                      value={newGameArenaId}
                      onChange={(e) => setNewGameArenaId(Number(e.target.value))}
                      required
                    >
                      <option value="">Select an arena</option>
                      {arenas.map((arena) => (
                        <option key={arena.id} value={arena.id}>
                          {arena.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="gameStartsAt">Start Date:</label>
                    <input
                      id="gameStartsAt"
                      type="date"
                      value={newGameStartsAt}
                      onChange={(e) => setNewGameStartsAt(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="gameIceTime">Ice Time:</label>
                    <select
                      id="gameIceTime"
                      value={newGameIceTime}
                      onChange={(e) => setNewGameIceTime(Number(e.target.value))}
                      required
                      disabled={showCustomIceTime}
                    >
                      <option value="">Select ice time</option>
                      <option value="75">75 minutes (1h 15m)</option>
                      <option value="90">90 minutes (1h 30m)</option>
                      <option value="100">100 minutes (1h 40m)</option>
                      <option value="120">120 minutes (2h 00m)</option>
                      <option value="140">140 minutes (2h 20m)</option>
                    </select>
                    <div className="custom-ice-time-section">
                      <button
                        type="button"
                        className="btn btn-sm btn-link"
                        onClick={() => {
                          setShowCustomIceTime(!showCustomIceTime);
                          if (!showCustomIceTime) {
                            setCustomIceTime('');
                          }
                        }}
                      >
                        {showCustomIceTime ? 'Use standard times' : 'Manually set ice time'}
                      </button>
                      {showCustomIceTime && (
                        <div className="custom-ice-time-input">
                          <input
                            type="number"
                            value={customIceTime}
                            onChange={(e) => setCustomIceTime(Number(e.target.value))}
                            placeholder="Enter minutes (e.g., 240)"
                            min="1"
                            max="480"
                            required
                            className="custom-input"
                          />
                          <span className="input-help">minutes</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={createGameMutation.isPending || teams.length < 2}
                  >
                    {createGameMutation.isPending ? 'Creating...' : 'Create Game'}
                  </button>
                </div>
              </form>

              {teams.length < 2 && (
                <div className="warning">
                  <p>⚠️ You need at least 2 teams to create games.</p>
                </div>
              )}

              <div className="list">
                {gamesLoading ? (
                  <div className="loading">Loading games...</div>
                ) : gamesError ? (
                  <div className="error">Error loading games</div>
                ) : games.length === 0 ? (
                  <p className="empty-state">No games found. Create your first game above.</p>
                ) : (
                  games.map((game) => (
                    <div key={game.id} className="list-item">
                      {editingGame?.id === game.id ? (
                        <form onSubmit={handleUpdateGame} className="edit-form">
                          <select
                            value={editGameHomeTeamId}
                            onChange={(e) => {
                              const teamId = Number(e.target.value);
                              setEditGameHomeTeamId(teamId);
                              // Auto-set arena to the team's club arena
                              const arenaId = getTeamArenaId(teamId);
                              if (arenaId) {
                                setEditGameArenaId(arenaId);
                              }
                            }}
                            className="edit-select"
                            required
                          >
                            {teams.map((team) => (
                              <option key={team.id} value={team.id}>
                                {getTeamDisplayName(team)}
                              </option>
                            ))}
                          </select>
                          <select
                            value={editGameAwayTeamId}
                            onChange={(e) => setEditGameAwayTeamId(Number(e.target.value))}
                            className="edit-select"
                            required
                          >
                            {teams.map((team) => (
                              <option key={team.id} value={team.id}>
                                {getTeamDisplayName(team)}
                              </option>
                            ))}
                          </select>
                          <select
                            value={editGameArenaId}
                            onChange={(e) => setEditGameArenaId(Number(e.target.value))}
                            className="edit-select"
                            required
                          >
                            {arenas.map((arena) => (
                              <option key={arena.id} value={arena.id}>
                                {arena.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="date"
                            value={editGameStartsAt}
                            onChange={(e) => setEditGameStartsAt(e.target.value)}
                            className="edit-input"
                            required
                          />
                          <select
                            value={editGameIceTime}
                            onChange={(e) => setEditGameIceTime(Number(e.target.value))}
                            className="edit-select"
                            required
                            disabled={showEditCustomIceTime}
                          >
                            <option value="">Select ice time</option>
                            <option value="75">75 min (1h 15m)</option>
                            <option value="90">90 min (1h 30m)</option>
                            <option value="100">100 min (1h 40m)</option>
                            <option value="120">120 min (2h 00m)</option>
                            <option value="140">140 min (2h 20m)</option>
                          </select>
                          <div className="custom-ice-time-section">
                            <button
                              type="button"
                              className="btn btn-sm btn-link"
                              onClick={() => {
                                setShowEditCustomIceTime(!showEditCustomIceTime);
                                if (!showEditCustomIceTime) {
                                  setEditCustomIceTime('');
                                }
                              }}
                            >
                              {showEditCustomIceTime ? 'Use standard times' : 'Manually set ice time'}
                            </button>
                            {showEditCustomIceTime && (
                              <div className="custom-ice-time-input">
                                <input
                                  type="number"
                                  value={editCustomIceTime}
                                  onChange={(e) => setEditCustomIceTime(Number(e.target.value))}
                                  placeholder="Enter minutes (e.g., 240)"
                                  min="1"
                                  max="480"
                                  required
                                  className="custom-input"
                                />
                                <span className="input-help">minutes</span>
                              </div>
                            )}
                          </div>
                          <div className="edit-actions">
                            <button type="submit" className="btn btn-sm btn-primary" disabled={updateGameMutation.isPending}>
                              {updateGameMutation.isPending ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                setEditingGame(null);
                                setEditGameHomeTeamId('');
                                setEditGameAwayTeamId('');
                                setEditGameArenaId('');
                                setEditGameStartsAt('');
                                setEditGameIceTime('');
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="item-info">
                            <span className="item-name">
                              {getTeamNameWithClub(game.home_team_id)} vs {getTeamNameWithClub(game.away_team_id)}
                            </span>
                            <div className="item-details">
                              <span className="item-detail">Arena: {getArenaName(game.arena_id)}</span>
                              <span className="item-detail">League: {getLeagueName(game.league_id)}</span>
                              <span className="item-detail">Time: {formatDateTime(game.starts_at)}</span>
                              <span className="item-detail">Duration: {formatIceTime(game.ice_time)}</span>
                            </div>
                          </div>
                          <div className="item-actions">
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleEditGame(game)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteGame(game.id)}
                              disabled={deleteGameMutation.isPending}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeamsGamesPage;
