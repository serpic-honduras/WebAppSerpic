
import { useState, useEffect, useCallback } from 'react';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { devWarn } from '@/utils/secureLogger';

export const useSecureSession = () => {
  const { user, loading } = useSecureAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);

  const checkSession = useCallback(() => {
    return !!user;
  }, [user]);

  const logout = useCallback(() => {
    // This is now handled by useSecureAuth
    devWarn('logout should be called from useSecureAuth.signOut()');
  }, []);

  const login = useCallback(() => {
    // This is now handled by useSecureAuth
    devWarn('login should be called from useSecureAuth.signIn()');
  }, []);

  return {
    isAuthenticated,
    isLoading: loading,
    login,
    logout,
    checkSession
  };
};
