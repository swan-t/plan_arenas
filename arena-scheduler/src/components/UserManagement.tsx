import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/services/api';
import type { User, CreateUserData } from '@/types';

const UserManagement: React.FC = () => {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserEmail, setEditUserEmail] = useState('');

  const queryClient = useQueryClient();

  // Fetch data
  const {
    data: users = [],
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserData) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setNewUserEmail('');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateUserData> }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      setEditUserEmail('');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Helper functions

  // Event handlers
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserEmail.trim()) {
      createUserMutation.mutate({
        email: newUserEmail.trim(),
        team_id: 0, // Admin users don't need a team
        admin: true, // All users created here are admins
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserEmail(user.email);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser && editUserEmail.trim()) {
      updateUserMutation.mutate({
        id: editingUser.id,
        data: {
          email: editUserEmail.trim(),
          team_id: 0, // Admin users don't need a team
          admin: true, // Keep as admin
        },
      });
    }
  };

  const handleDeleteUser = (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('sv-SE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (usersLoading) {
    return <div className="loading">Loading users...</div>;
  }

  if (usersError) {
    return <div className="error">Error loading users</div>;
  }

  return (
    <div className="user-management">
      <div className="section-header">
        <h2>Admin User Management</h2>
        <p>Manage admin user accounts for system access</p>
      </div>

      {/* Create User Form */}
      <div className="form">
        <h3>Create New Admin User</h3>
        <form onSubmit={handleCreateUser}>
          <div className="form-group">
            <label htmlFor="userEmail">Email Address:</label>
            <input
              id="userEmail"
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="Enter admin email address"
              required
              className="form-input"
            />
          </div>
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? 'Creating...' : 'Create Admin User'}
            </button>
          </div>
        </form>
      </div>

      {/* Users List */}
      <div className="list">
        <h3>Admin Users ({users.length})</h3>
        {users.length === 0 ? (
          <p className="empty-state">No admin users found. Create your first admin user above.</p>
        ) : (
          users.map((user) => (
            <div key={user.id} className="list-item">
              {editingUser?.id === user.id ? (
                <form onSubmit={handleUpdateUser} className="edit-form">
                  <input
                    type="email"
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    className="edit-input"
                    required
                  />
                  <div className="edit-actions">
                    <button
                      type="submit"
                      className="btn btn-sm btn-primary"
                      disabled={updateUserMutation.isPending}
                    >
                      {updateUserMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => {
                        setEditingUser(null);
                        setEditUserEmail('');
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
                      {user.email}
                      <span className="admin-badge">Admin</span>
                    </span>
                    <div className="item-details">
                      {user.email_code && (
                        <span className="item-detail">
                          Code expires: {formatDate(user.code_expires_at || '')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="item-actions">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEditUser(user)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={deleteUserMutation.isPending}
                    >
                      {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
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

export default UserManagement;
