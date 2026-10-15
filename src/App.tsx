
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import { SecureAuthProvider } from '@/hooks/useSecureAuth';
import AuthGuard from '@/components/AuthGuard';
import Index from '@/pages/Index';
import NewProject from '@/pages/NewProject';
import ProjectView from '@/pages/ProjectView';
import ProjectSummary from '@/pages/ProjectSummary';
import Profile from '@/pages/Profile';
import SettingsPage from '@/pages/Settings';
import NotFound from '@/pages/NotFound';
import './App.css';

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
      <SecureAuthProvider>
        <Router>
          <AuthGuard>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/new-project" element={<NewProject />} />
              <Route path="/project/:id" element={<ProjectView />} />
              <Route path="/project/:id/summary" element={<ProjectSummary />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />

            </Routes>
          </AuthGuard>
        </Router>
        <Toaster />
      </SecureAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
