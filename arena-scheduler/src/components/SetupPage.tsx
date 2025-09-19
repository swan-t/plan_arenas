import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seasonsApi, arenasApi, clubsApi, leaguesApi } from '@/services/api';
import UserManagement from '@/components/UserManagement';
import type { Season, Arena, Club, League, CreateSeasonData, CreateArenaData, CreateClubData, CreateLeagueData } from '@/types';

const SetupPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'seasons' | 'arenas' | 'clubs' | 'leagues' | 'users'>('seasons');
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  
  // Form states
  const [isCreatingSeason, setIsCreatingSeason] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState('');
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [editSeasonName, setEditSeasonName] = useState('');

  // Always show forms for arenas and clubs
  const [newArenaName, setNewArenaName] = useState('');
  const [editingArena, setEditingArena] = useState<Arena | null>(null);
  const [editArenaName, setEditArenaName] = useState('');

  const [newClubName, setNewClubName] = useState('');
  const [newClubArenaId, setNewClubArenaId] = useState<number | ''>('');
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [editClubName, setEditClubName] = useState('');
  const [editClubArenaId, setEditClubArenaId] = useState<number | ''>('');

  // Leagues form state
  const [newLeagueName, setNewLeagueName] = useState('');
  const [newLeaguePriority, setNewLeaguePriority] = useState<number | ''>('');
  const [newLeagueDefaultIceTime, setNewLeagueDefaultIceTime] = useState<number | ''>(140);
  const [newLeagueOfficialUrl, setNewLeagueOfficialUrl] = useState('');
  const [editingLeague, setEditingLeague] = useState<League | null>(null);
  const [editLeagueName, setEditLeagueName] = useState('');
  const [editLeaguePriority, setEditLeaguePriority] = useState<number | ''>('');
  const [editLeagueDefaultIceTime, setEditLeagueDefaultIceTime] = useState<number | ''>('');
  const [editLeagueOfficialUrl, setEditLeagueOfficialUrl] = useState('');
  const [editLeagueSeasonId, setEditLeagueSeasonId] = useState<number | ''>('');

  const queryClient = useQueryClient();

  // Fetch data
  const {
    data: seasons = [],
    isLoading: seasonsLoading,
    error: seasonsError,
  } = useQuery({
    queryKey: ['seasons'],
    queryFn: seasonsApi.getAll,
  });

  // Auto-select current season when seasons are loaded
  React.useEffect(() => {
    if (seasons.length > 0 && !selectedSeasonId) {
      // Auto-select the most recent season (last in the array)
      const currentSeason = seasons[seasons.length - 1];
      if (currentSeason) {
        setSelectedSeasonId(currentSeason.id);
      }
    }
  }, [seasons, selectedSeasonId]);

  const {
    data: arenas = [],
    isLoading: arenasLoading,
    error: arenasError,
  } = useQuery({
    queryKey: ['arenas'],
    queryFn: arenasApi.getAll,
  });

  const {
    data: clubs = [],
    isLoading: clubsLoading,
    error: clubsError,
  } = useQuery({
    queryKey: ['clubs'],
    queryFn: clubsApi.getAll,
  });

  const {
    data: leagues = [],
    isLoading: leaguesLoading,
    error: leaguesError,
  } = useQuery({
    queryKey: ['leagues', selectedSeasonId],
    queryFn: () => selectedSeasonId ? leaguesApi.getBySeason(selectedSeasonId) : Promise.resolve([]),
    enabled: !!selectedSeasonId,
  });

  // Seasons mutations
  const createSeasonMutation = useMutation({
    mutationFn: (data: CreateSeasonData) => seasonsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      setNewSeasonName('');
      setIsCreatingSeason(false);
    },
  });

  const updateSeasonMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateSeasonData> }) =>
      seasonsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      setEditingSeason(null);
      setEditSeasonName('');
    },
  });

  const deleteSeasonMutation = useMutation({
    mutationFn: (id: number) => seasonsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
    },
  });

  // Arenas mutations
  const createArenaMutation = useMutation({
    mutationFn: (data: CreateArenaData) => arenasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arenas'] });
      setNewArenaName('');
    },
  });

  const updateArenaMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateArenaData> }) =>
      arenasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arenas'] });
      setEditingArena(null);
      setEditArenaName('');
    },
  });

  const deleteArenaMutation = useMutation({
    mutationFn: (id: number) => arenasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arenas'] });
    },
  });

  // Clubs mutations
  const createClubMutation = useMutation({
    mutationFn: (data: CreateClubData) => clubsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      setNewClubName('');
      setNewClubArenaId('');
    },
  });

  const updateClubMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateClubData> }) =>
      clubsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      setEditingClub(null);
      setEditClubName('');
      setEditClubArenaId('');
    },
  });

  const deleteClubMutation = useMutation({
    mutationFn: (id: number) => clubsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
    },
  });

  // Leagues mutations
  const createLeagueMutation = useMutation({
    mutationFn: (data: CreateLeagueData) => leaguesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leagues', selectedSeasonId] });
      setNewLeagueName('');
      setNewLeaguePriority('');
      setNewLeagueDefaultIceTime('');
      setNewLeagueOfficialUrl('');
    },
  });

  const updateLeagueMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateLeagueData> }) =>
      leaguesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leagues', selectedSeasonId] });
      setEditingLeague(null);
      setEditLeagueName('');
      setEditLeaguePriority('');
      setEditLeagueDefaultIceTime('');
      setEditLeagueOfficialUrl('');
      setEditLeagueSeasonId('');
    },
  });

  const deleteLeagueMutation = useMutation({
    mutationFn: (id: number) => leaguesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leagues', selectedSeasonId] });
    },
  });

  // Event handlers
  const handleCreateSeason = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSeasonName.trim()) {
      createSeasonMutation.mutate({ name: newSeasonName.trim() });
    }
  };

  const handleEditSeason = (season: Season) => {
    setEditingSeason(season);
    setEditSeasonName(season.name);
  };

  const handleUpdateSeason = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSeason && editSeasonName.trim()) {
      updateSeasonMutation.mutate({
        id: editingSeason.id,
        data: { name: editSeasonName.trim() },
      });
    }
  };

  const handleDeleteSeason = (id: number) => {
    if (window.confirm('Are you sure you want to delete this season?')) {
      deleteSeasonMutation.mutate(id);
    }
  };

  const handleCreateArena = (e: React.FormEvent) => {
    e.preventDefault();
    if (newArenaName.trim()) {
      createArenaMutation.mutate({ name: newArenaName.trim() });
    }
  };

  const handleEditArena = (arena: Arena) => {
    setEditingArena(arena);
    setEditArenaName(arena.name);
  };

  const handleUpdateArena = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingArena && editArenaName.trim()) {
      updateArenaMutation.mutate({
        id: editingArena.id,
        data: { name: editArenaName.trim() },
      });
    }
  };

  const handleDeleteArena = (id: number) => {
    if (window.confirm('Are you sure you want to delete this arena?')) {
      deleteArenaMutation.mutate(id);
    }
  };

  const handleCreateClub = (e: React.FormEvent) => {
    e.preventDefault();
    if (newClubName.trim() && newClubArenaId) {
      createClubMutation.mutate({ 
        name: newClubName.trim(), 
        arena_id: Number(newClubArenaId) 
      });
    }
  };

  const handleEditClub = (club: Club) => {
    setEditingClub(club);
    setEditClubName(club.name);
    setEditClubArenaId(club.arena_id);
  };

  const handleUpdateClub = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClub && editClubName.trim() && editClubArenaId) {
      updateClubMutation.mutate({
        id: editingClub.id,
        data: { 
          name: editClubName.trim(), 
          arena_id: Number(editClubArenaId) 
        },
      });
    }
  };

  const handleDeleteClub = (id: number) => {
    if (window.confirm('Are you sure you want to delete this club?')) {
      deleteClubMutation.mutate(id);
    }
  };

  // Leagues event handlers
  const handleCreateLeague = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLeagueName.trim() && newLeaguePriority && newLeagueDefaultIceTime && selectedSeasonId) {
      createLeagueMutation.mutate({
        name: newLeagueName.trim(),
        priority: Number(newLeaguePriority),
        default_ice_time: Number(newLeagueDefaultIceTime),
        official_url: newLeagueOfficialUrl.trim() || undefined,
        season_id: selectedSeasonId,
      });
    }
  };

  const handleEditLeague = (league: League) => {
    setEditingLeague(league);
    setEditLeagueName(league.name);
    setEditLeaguePriority(league.priority);
    setEditLeagueDefaultIceTime(league.default_ice_time);
    setEditLeagueOfficialUrl(league.official_url || '');
    setEditLeagueSeasonId(league.season_id);
  };

  const handleUpdateLeague = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLeague && editLeagueName.trim() && editLeaguePriority && editLeagueDefaultIceTime && editLeagueSeasonId) {
      updateLeagueMutation.mutate({
        id: editingLeague.id,
        data: {
          name: editLeagueName.trim(),
          priority: Number(editLeaguePriority),
          default_ice_time: Number(editLeagueDefaultIceTime),
          official_url: editLeagueOfficialUrl.trim() || undefined,
          season_id: Number(editLeagueSeasonId),
        },
      });
    }
  };

  const handleDeleteLeague = (id: number) => {
    if (window.confirm('Are you sure you want to delete this league?')) {
      deleteLeagueMutation.mutate(id);
    }
  };

  const getArenaName = (arenaId: number) => {
    const arena = arenas.find(a => a.id === arenaId);
    return arena ? arena.name : `Arena ${arenaId}`;
  };

  const getSeasonName = (seasonId: number) => {
    const season = seasons.find(s => s.id === seasonId);
    return season ? season.name : `Season ${seasonId}`;
  };

  const formatIceTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${minutes} min (${hours}h ${mins}m)` : `${minutes} min (${hours}h)`;
    }
    return `${minutes} min`;
  };

  return (
    <div className="setup-page">
      <div className="header">
        <h1>Arena Scheduler Setup</h1>
        <p>Configure your seasons, arenas, and clubs for the ice hockey scheduling system.</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab ${activeTab === 'seasons' ? 'active' : ''}`}
          onClick={() => setActiveTab('seasons')}
        >
          Seasons ({seasons.length})
        </button>
        <button
          className={`tab ${activeTab === 'arenas' ? 'active' : ''}`}
          onClick={() => setActiveTab('arenas')}
        >
          Arenas ({arenas.length})
        </button>
        <button
          className={`tab ${activeTab === 'clubs' ? 'active' : ''}`}
          onClick={() => setActiveTab('clubs')}
        >
          Clubs ({clubs.length})
        </button>
        <button
          className={`tab ${activeTab === 'leagues' ? 'active' : ''}`}
          onClick={() => setActiveTab('leagues')}
        >
          Leagues ({leagues.length})
        </button>
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
      </div>

      {/* Seasons Tab */}
      {activeTab === 'seasons' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Seasons Management</h2>
            <button
              className="btn btn-primary"
              onClick={() => setIsCreatingSeason(true)}
              disabled={isCreatingSeason}
            >
              Add New Season
            </button>
          </div>

          {isCreatingSeason && (
            <form onSubmit={handleCreateSeason} className="form">
              <div className="form-group">
                <label htmlFor="seasonName">Season Name:</label>
                <input
                  id="seasonName"
                  type="text"
                  value={newSeasonName}
                  onChange={(e) => setNewSeasonName(e.target.value)}
                  placeholder="e.g., 2024-2025 Season"
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={createSeasonMutation.isPending}>
                  {createSeasonMutation.isPending ? 'Creating...' : 'Create Season'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsCreatingSeason(false);
                    setNewSeasonName('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="list">
            {seasonsLoading ? (
              <div className="loading">Loading seasons...</div>
            ) : seasonsError ? (
              <div className="error">Error loading seasons</div>
            ) : seasons.length === 0 ? (
              <p className="empty-state">No seasons found. Create your first season above.</p>
            ) : (
              seasons.map((season) => (
                <div key={season.id} className="list-item">
                  {editingSeason?.id === season.id ? (
                    <form onSubmit={handleUpdateSeason} className="edit-form">
                      <input
                        type="text"
                        value={editSeasonName}
                        onChange={(e) => setEditSeasonName(e.target.value)}
                        className="edit-input"
                        required
                      />
                      <div className="edit-actions">
                        <button type="submit" className="btn btn-sm btn-primary" disabled={updateSeasonMutation.isPending}>
                          {updateSeasonMutation.isPending ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setEditingSeason(null);
                            setEditSeasonName('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <span className="item-name">{season.name}</span>
                      <div className="item-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEditSeason(season)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteSeason(season.id)}
                          disabled={deleteSeasonMutation.isPending}
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

      {/* Arenas Tab */}
      {activeTab === 'arenas' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Arenas Management</h2>
          </div>

          {/* Always visible form */}
          <form onSubmit={handleCreateArena} className="form">
            <div className="form-group">
              <label htmlFor="arenaName">Arena Name:</label>
              <input
                id="arenaName"
                type="text"
                value={newArenaName}
                onChange={(e) => setNewArenaName(e.target.value)}
                placeholder="e.g., Main Ice Arena"
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={createArenaMutation.isPending}>
                {createArenaMutation.isPending ? 'Creating...' : 'Create Arena'}
              </button>
            </div>
          </form>

          <div className="list">
            {arenasLoading ? (
              <div className="loading">Loading arenas...</div>
            ) : arenasError ? (
              <div className="error">Error loading arenas</div>
            ) : arenas.length === 0 ? (
              <p className="empty-state">No arenas found. Create your first arena above.</p>
            ) : (
              arenas.map((arena) => (
                <div key={arena.id} className="list-item">
                  {editingArena?.id === arena.id ? (
                    <form onSubmit={handleUpdateArena} className="edit-form">
                      <input
                        type="text"
                        value={editArenaName}
                        onChange={(e) => setEditArenaName(e.target.value)}
                        className="edit-input"
                        required
                      />
                      <div className="edit-actions">
                        <button type="submit" className="btn btn-sm btn-primary" disabled={updateArenaMutation.isPending}>
                          {updateArenaMutation.isPending ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setEditingArena(null);
                            setEditArenaName('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <span className="item-name">{arena.name}</span>
                      <div className="item-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEditArena(arena)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteArena(arena.id)}
                          disabled={deleteArenaMutation.isPending}
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

      {/* Clubs Tab */}
      {activeTab === 'clubs' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Clubs Management</h2>
          </div>

          {arenas.length === 0 && (
            <div className="warning">
              <p>⚠️ You need to create at least one arena before adding clubs.</p>
            </div>
          )}

          {/* Always visible form */}
          <form onSubmit={handleCreateClub} className="form">
            <div className="form-group">
              <label htmlFor="clubName">Club Name:</label>
              <input
                id="clubName"
                type="text"
                value={newClubName}
                onChange={(e) => setNewClubName(e.target.value)}
                placeholder="e.g., Hockey Club Alpha"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="clubArena">Arena:</label>
              <select
                id="clubArena"
                value={newClubArenaId}
                onChange={(e) => setNewClubArenaId(Number(e.target.value))}
                required
                disabled={arenas.length === 0}
              >
                <option value="">Select an arena</option>
                {arenas.map((arena) => (
                  <option key={arena.id} value={arena.id}>
                    {arena.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={createClubMutation.isPending || arenas.length === 0}
              >
                {createClubMutation.isPending ? 'Creating...' : 'Create Club'}
              </button>
            </div>
          </form>

          <div className="list">
            {clubsLoading ? (
              <div className="loading">Loading clubs...</div>
            ) : clubsError ? (
              <div className="error">Error loading clubs</div>
            ) : clubs.length === 0 ? (
              <p className="empty-state">No clubs found. Create your first club above.</p>
            ) : (
              clubs.map((club) => (
                <div key={club.id} className="list-item">
                  {editingClub?.id === club.id ? (
                    <form onSubmit={handleUpdateClub} className="edit-form">
                      <input
                        type="text"
                        value={editClubName}
                        onChange={(e) => setEditClubName(e.target.value)}
                        className="edit-input"
                        required
                      />
                      <select
                        value={editClubArenaId}
                        onChange={(e) => setEditClubArenaId(Number(e.target.value))}
                        className="edit-select"
                        required
                      >
                        {arenas.map((arena) => (
                          <option key={arena.id} value={arena.id}>
                            {arena.name}
                          </option>
                        ))}
                      </select>
                      <div className="edit-actions">
                        <button type="submit" className="btn btn-sm btn-primary" disabled={updateClubMutation.isPending}>
                          {updateClubMutation.isPending ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setEditingClub(null);
                            setEditClubName('');
                            setEditClubArenaId('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="item-info">
                        <span className="item-name">{club.name}</span>
                        <span className="item-detail">at {getArenaName(club.arena_id)}</span>
                      </div>
                      <div className="item-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEditClub(club)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteClub(club.id)}
                          disabled={deleteClubMutation.isPending}
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

      {/* Leagues Tab */}
      {activeTab === 'leagues' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Leagues Management</h2>
          </div>

          {seasons.length === 0 ? (
            <div className="warning">
              <p>⚠️ You need to create at least one season before adding leagues.</p>
            </div>
          ) : (
            <div className="season-selector">
              <label htmlFor="seasonSelect">Select Season:</label>
              <select
                id="seasonSelect"
                value={selectedSeasonId || ''}
                onChange={(e) => setSelectedSeasonId(Number(e.target.value) || null)}
                className="season-select"
              >
                <option value="">Choose a season to manage leagues</option>
                {seasons.map((season, index) => (
                  <option key={season.id} value={season.id}>
                    {season.name} {index === seasons.length - 1 ? '(Current)' : ''}
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
          )}

          {selectedSeasonId && (
            <>
              {/* Always visible form */}
              <form onSubmit={handleCreateLeague} className="form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="leagueName">League Name:</label>
                <input
                  id="leagueName"
                  type="text"
                  value={newLeagueName}
                  onChange={(e) => setNewLeagueName(e.target.value)}
                  placeholder="e.g., Premier League"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="leaguePriority">Priority:</label>
                <input
                  id="leaguePriority"
                  type="number"
                  value={newLeaguePriority}
                  onChange={(e) => setNewLeaguePriority(Number(e.target.value))}
                  placeholder="1"
                  min="1"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="leagueDefaultIceTime">Default Ice Time:</label>
                <select
                  id="leagueDefaultIceTime"
                  value={newLeagueDefaultIceTime}
                  onChange={(e) => setNewLeagueDefaultIceTime(Number(e.target.value))}
                  required
                >
                  <option value="">Select ice time</option>
                  <option value="75">75 minutes (1h 15m)</option>
                  <option value="90">90 minutes (1h 30m)</option>
                  <option value="100">100 minutes (1h 40m)</option>
                  <option value="120">120 minutes (2h 00m)</option>
                  <option value="140">140 minutes (2h 20m)</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="leagueSeason">Season:</label>
                <select
                  id="leagueSeason"
                  value={selectedSeasonId || ''}
                  disabled
                  className="disabled-select"
                >
                  <option value={selectedSeasonId}>{getSeasonName(selectedSeasonId!)}</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="leagueOfficialUrl">Official URL (optional):</label>
              <input
                id="leagueOfficialUrl"
                type="url"
                value={newLeagueOfficialUrl}
                onChange={(e) => setNewLeagueOfficialUrl(e.target.value)}
                placeholder="https://example.com/league"
              />
            </div>
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={createLeagueMutation.isPending}
              >
                {createLeagueMutation.isPending ? 'Creating...' : 'Create League'}
              </button>
            </div>
          </form>

          <div className="list">
            {leaguesLoading ? (
              <div className="loading">Loading leagues...</div>
            ) : leaguesError ? (
              <div className="error">Error loading leagues</div>
            ) : leagues.length === 0 ? (
              <p className="empty-state">No leagues found. Create your first league above.</p>
            ) : (
              leagues.map((league) => (
                <div key={league.id} className="list-item">
                  {editingLeague?.id === league.id ? (
                    <form onSubmit={handleUpdateLeague} className="edit-form">
                      <input
                        type="text"
                        value={editLeagueName}
                        onChange={(e) => setEditLeagueName(e.target.value)}
                        className="edit-input"
                        placeholder="League name"
                        required
                      />
                      <input
                        type="number"
                        value={editLeaguePriority}
                        onChange={(e) => setEditLeaguePriority(Number(e.target.value))}
                        className="edit-input"
                        placeholder="Priority"
                        min="1"
                        required
                      />
                      <select
                        value={editLeagueDefaultIceTime}
                        onChange={(e) => setEditLeagueDefaultIceTime(Number(e.target.value))}
                        className="edit-select"
                        required
                      >
                        <option value="">Select ice time</option>
                        <option value="75">75 min (1h 15m)</option>
                        <option value="90">90 min (1h 30m)</option>
                        <option value="100">100 min (1h 40m)</option>
                        <option value="120">120 min (2h 00m)</option>
                        <option value="140">140 min (2h 20m)</option>
                      </select>
                      <select
                        value={editLeagueSeasonId}
                        onChange={(e) => setEditLeagueSeasonId(Number(e.target.value))}
                        className="edit-select"
                        required
                      >
                        {seasons.map((season) => (
                          <option key={season.id} value={season.id}>
                            {season.name}
                          </option>
                        ))}
                      </select>
                      <div className="edit-actions">
                        <button type="submit" className="btn btn-sm btn-primary" disabled={updateLeagueMutation.isPending}>
                          {updateLeagueMutation.isPending ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setEditingLeague(null);
                            setEditLeagueName('');
                            setEditLeaguePriority('');
                            setEditLeagueDefaultIceTime('');
                            setEditLeagueOfficialUrl('');
                            setEditLeagueSeasonId('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="item-info">
                        <span className="item-name">{league.name}</span>
                        <div className="item-details">
                          <span className="item-detail">Priority: {league.priority}</span>
                          <span className="item-detail">Ice Time: {formatIceTime(league.default_ice_time)}</span>
                          <span className="item-detail">Season: {getSeasonName(league.season_id)}</span>
                          {league.official_url && (
                            <span className="item-detail">
                              <a href={league.official_url} target="_blank" rel="noopener noreferrer">
                                Official Site
                              </a>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="item-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEditLeague(league)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteLeague(league.id)}
                          disabled={deleteLeagueMutation.isPending}
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
            </>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="tab-content">
          <UserManagement />
        </div>
      )}
    </div>
  );
};

export default SetupPage;
