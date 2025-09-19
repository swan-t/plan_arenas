import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi, usersApi, arenasApi } from '@/services/api';
import type { Team } from '@/types';

const SchedulingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invitations' | 'calendar' | 'admin'>('invitations');
  const [selectedArenaId, setSelectedArenaId] = useState<number | null>(null);
  const queryClient = useQueryClient();

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
            <h2>Admin View</h2>
            <p>Manage unscheduled games</p>
            <div className="placeholder">
              Admin view functionality will be implemented here
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulingPage;