import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { showErrorToast } from './utils/errorHandler';
import './index.css';

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error: any, _variables, _context, mutation) => {
      // Allow individual mutations to opt-out if handled manually (e.g., custom inline forms)
      if (mutation.options.meta?.skipGlobalErrorToast) {
        return;
      }
      showErrorToast(error);
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
