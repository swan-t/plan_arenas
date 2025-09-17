import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seasonsApi } from '@/services/api';
import type { Season, CreateSeasonData } from '@/types';

const SeasonsManager: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState('');
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [editName, setEditName] = useState('');

  const queryClient = useQueryClient();

  // Fetch seasons
  const {
    data: seasons = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['seasons'],
    queryFn: seasonsApi.getAll,
  });

  // Create season mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateSeasonData) => seasonsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      setNewSeasonName('');
      setIsCreating(false);
    },
  });

  // Update season mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateSeasonData> }) =>
      seasonsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      setEditingSeason(null);
      setEditName('');
    },
  });

  // Delete season mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => seasonsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSeasonName.trim()) {
      createMutation.mutate({ name: newSeasonName.trim() });
    }
  };

  const handleEdit = (season: Season) => {
    setEditingSeason(season);
    setEditName(season.name);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSeason && editName.trim()) {
      updateMutation.mutate({
        id: editingSeason.id,
        data: { name: editName.trim() },
      });
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this season?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div className="loading">Loading seasons...</div>;
  if (error) return <div className="error">Error loading seasons</div>;

  return (
    <div className="seasons-manager">
      <div className="header">
        <h2>Seasons Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => setIsCreating(true)}
          disabled={isCreating}
        >
          Add New Season
        </button>
      </div>

      {/* Create Season Form */}
      {isCreating && (
        <form onSubmit={handleCreate} className="form">
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
            <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Season'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsCreating(false);
                setNewSeasonName('');
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Seasons List */}
      <div className="seasons-list">
        {seasons.length === 0 ? (
          <p className="empty-state">No seasons found. Create your first season above.</p>
        ) : (
          seasons.map((season) => (
            <div key={season.id} className="season-item">
              {editingSeason?.id === season.id ? (
                <form onSubmit={handleUpdate} className="edit-form">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="edit-input"
                    required
                  />
                  <div className="edit-actions">
                    <button type="submit" className="btn btn-sm btn-primary" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => {
                        setEditingSeason(null);
                        setEditName('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <span className="season-name">{season.name}</span>
                  <div className="season-actions">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEdit(season)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(season.id)}
                      disabled={deleteMutation.isPending}
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
  );
};

export default SeasonsManager;
