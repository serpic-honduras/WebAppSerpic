import { ReactNode } from 'react';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import AuthPage from '@/components/AuthPage';

interface AuthGuardProps {
  children: ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, loading } = useSecureAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <img
            src="/lovable-uploads/logo-transparent.png"
            alt="SERPIC Logo"
            className="h-16 w-auto mx-auto mb-4 animate-pulse"
          />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <>{children}</>;
};

export default AuthGuard;
