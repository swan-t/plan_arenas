import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import SetupPage from '@/components/SetupPage';
import TeamsGamesPage from '@/components/TeamsGamesPage';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [currentPage, setCurrentPage] = useState<'setup' | 'teams-games'>('setup');

  return (
    <QueryClientProvider client={queryClient}>
      <div className="container">
        {/* Navigation */}
        <nav className="main-nav">
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
        </nav>

        {/* Page Content */}
        {currentPage === 'setup' && <SetupPage />}
        {currentPage === 'teams-games' && <TeamsGamesPage />}
      </div>
    </QueryClientProvider>
  );
}

export default App;