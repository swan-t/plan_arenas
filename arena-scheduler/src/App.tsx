import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { UserProvider, useUser } from '@/contexts/UserContext';
import LoginPage from '@/components/LoginPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import SetupPage from '@/components/SetupPage';
import TeamsGamesPage from '@/components/TeamsGamesPage';
import { sessionManager } from '@/services/api';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Initialize session on app start
sessionManager.initializeSession();

const AppContent: React.FC = () => {
  const { isAuthenticated, isAdmin, user, logout, isLoading } = useUser();
  const [currentPage, setCurrentPage] = useState<'setup' | 'teams-games'>('setup');

  if (isLoading) {
    return (
      <div className="loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="container">
      {/* Navigation */}
      <nav className="main-nav">
        <div className="nav-left">
          <button
            className={`nav-btn ${currentPage === 'setup' ? 'active' : ''}`}
            onClick={() => setCurrentPage('setup')}
          >
            Setup
          </button>
          <button
            className={`nav-btn ${currentPage === 'teams-games' ? 'active' : ''}`}
            onClick={() => setCurrentPage('teams-games')}
          >
            Teams & Games
          </button>
        </div>
        <div className="nav-right">
          <div className="user-info">
            <span className="user-email">{user?.email}</span>
            {isAdmin && <span className="admin-badge">Admin</span>}
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Page Content */}
      <ProtectedRoute requireAdmin={true}>
        {currentPage === 'setup' && <SetupPage />}
      </ProtectedRoute>
      
      <ProtectedRoute>
        {currentPage === 'teams-games' && <TeamsGamesPage />}
      </ProtectedRoute>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;