import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SeasonsManager from '@/components/SeasonsManager';
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
  return (
    <QueryClientProvider client={queryClient}>
      <div className="container">
        <h1>Arena Scheduler</h1>
        <SeasonsManager />
      </div>
    </QueryClientProvider>
  );
}

export default App;