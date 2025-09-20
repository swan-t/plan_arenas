import React from 'react';
import { useUser } from '@/contexts/UserContext';
import type { Team } from '@/types';

const TeamSelectionPage: React.FC = () => {
  const { user, selectedTeam, selectTeam } = useUser();

  if (!user?.teams) {
    return (
      <div className="team-selection-page">
        <div className="loading">Loading teams...</div>
      </div>
    );
  }

  const handleTeamSelect = (team: Team) => {
    selectTeam(team);
  };

  return (
    <div className="team-selection-page">
      <div className="header">
        <h1>Select Team</h1>
        <p>Choose which team you want to work with:</p>
      </div>

      <div className="teams-grid">
        {user.teams.map((team) => (
          <div
            key={team.id}
            className={`team-card ${selectedTeam?.id === team.id ? 'selected' : ''}`}
            onClick={() => handleTeamSelect(team)}
          >
            <div className="team-info">
              <h3>{team.name}</h3>
              <div className="team-details">
                <p><strong>League:</strong> {team.league_id}</p>
                <p><strong>Club:</strong> {team.club_id}</p>
                {team.contact_email && (
                  <p><strong>Contact:</strong> {team.contact_email}</p>
                )}
                {team.scheduling_done_at ? (
                  <div className="status-badge completed">
                    ✓ Scheduling Complete
                  </div>
                ) : (
                  <div className="status-badge pending">
                    ⏳ Currently Scheduling
                  </div>
                )}
              </div>
            </div>
            <div className="team-actions">
              <button
                className="btn btn-primary"
                onClick={() => handleTeamSelect(team)}
              >
                {selectedTeam?.id === team.id ? 'Selected' : 'Select Team'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedTeam && (
        <div className="selected-team-info">
          <h3>Selected Team: {selectedTeam.name}</h3>
          <p>You can now proceed to schedule games for this team.</p>
        </div>
      )}
    </div>
  );
};

export default TeamSelectionPage;
