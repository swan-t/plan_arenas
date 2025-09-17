import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SetupPage from '@/components/SetupPage';
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
        <SetupPage />
      </div>
    </QueryClientProvider>
  );
}

export default App;