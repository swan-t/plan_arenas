import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seasonsApi, arenasApi, clubsApi } from '@/services/api';
import type { Season, Arena, Club, CreateSeasonData, CreateArenaData, CreateClubData } from '@/types';

const SetupPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'seasons' | 'arenas' | 'clubs'>('seasons');
  
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

  const getArenaName = (arenaId: number) => {
    const arena = arenas.find(a => a.id === arenaId);
    return arena ? arena.name : `Arena ${arenaId}`;
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
    </div>
  );
};

export default SetupPage;
