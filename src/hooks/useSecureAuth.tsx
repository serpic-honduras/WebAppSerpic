
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeInput, validateEmailDetailed, validatePassword } from '@/utils/inputValidation';
import { apiRateLimiter } from '@/utils/securityUtils';
import { devError, devLog } from '@/utils/secureLogger';
import {
  PermissionKey,
  PermissionMatrix,
  emptyMatrix,
  mergeMatrices,
  readOnlyMatrix,
} from '@/lib/permissions';

interface SecureAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isAuditor: boolean;
  permissions: PermissionMatrix;
  can: (permission: PermissionKey) => boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const SecureAuthContext = createContext<SecureAuthContextType | undefined>(undefined);

export const SecureAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuditor, setIsAuditor] = useState(false);
  const [permissions, setPermissions] = useState<PermissionMatrix>(emptyMatrix());


  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only log non-sensitive information
        devLog('Auth state change:', event);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Check if user is admin when session changes
        if (session?.user) {
          setTimeout(() => {
            checkUserRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsAuditor(false);
          setPermissions(emptyMatrix());
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      devLog('Initial session established');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        setTimeout(() => {
          checkUserRole(session.user.id);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (!error && data) {
        const roles = data.map((r: any) => r.role as string);
        const admin = roles.includes('admin');
        const auditor = roles.includes('auditor');
        setIsAdmin(admin);
        setIsAuditor(auditor);
        await loadPermissions(roles, admin, auditor);
      } else {
        setIsAdmin(false);
        setIsAuditor(false);
        setPermissions(emptyMatrix());
      }
    } catch (error) {
      devError('Error checking role:', error);
      setIsAdmin(false);
      setIsAuditor(false);
      setPermissions(emptyMatrix());
    }
  };

  const loadPermissions = async (roles: string[], admin: boolean, auditor: boolean) => {
    try {
      // Roles table is admin-only; each user fetches only their own
      // roles' permissions through a security definer function.
      const { data, error } = await supabase.rpc('get_my_permissions');

      if (error || !data?.length) {
        // Fallback so the app stays usable if the roles table is unreachable
        setPermissions(auditor && !admin ? readOnlyMatrix() : emptyMatrix());
        return;
      }

      // Auditor is strictly read-only, regardless of other assigned roles
      const relevant = auditor && !admin
        ? data.filter((r: any) => r.key === 'auditor')
        : data;

      setPermissions(mergeMatrices(relevant.map((r: any) => (r.permissions ?? {}) as PermissionMatrix)));
    } catch (error) {
      devError('Error loading permissions:', error);
      setPermissions(auditor && !admin ? readOnlyMatrix() : emptyMatrix());
    }
  };

  const can = (permission: PermissionKey): boolean => !!permissions[permission];


  const signUp = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    try {
      // Rate limiting check
      if (!apiRateLimiter.isAllowed(`signup_${email}`)) {
        return { error: { message: 'Too many signup attempts. Please try again later.' } as AuthError };
      }

      // Validate and sanitize inputs
      const sanitizedEmail = sanitizeInput(email.toLowerCase());
      
      const emailValidation = validateEmailDetailed(sanitizedEmail);
      if (!emailValidation.isValid) {
        return { error: { message: emailValidation.error || 'Invalid email format' } as AuthError };
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return { error: { message: passwordValidation.error || 'Invalid password' } as AuthError };
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      return { error };
    } catch (error) {
      devError('Signup error:', error);
      return { error: { message: 'An unexpected error occurred' } as AuthError };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    try {
      // Rate limiting check
      if (!apiRateLimiter.isAllowed(`signin_${email}`)) {
        return { error: { message: 'Too many login attempts. Please try again later.' } as AuthError };
      }

      // Validate and sanitize inputs
      const sanitizedEmail = sanitizeInput(email.toLowerCase());
      
      const emailValidation = validateEmailDetailed(sanitizedEmail);
      if (!emailValidation.isValid) {
        return { error: { message: emailValidation.error || 'Invalid email format' } as AuthError };
      }

      if (!password || password.length < 6) {
        return { error: { message: 'Password must be at least 6 characters' } as AuthError };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password
      });

      return { error };
    } catch (error) {
      devError('Signin error:', error);
      return { error: { message: 'An unexpected error occurred' } as AuthError };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      devError('Signout error:', error);
    }
  };

  return (
    <SecureAuthContext.Provider value={{
      user,
      session,
      loading,
      permissions,
      can,

      isAdmin,
      isAuditor,
      signUp,
      signIn,
      signOut
    }}>
      {children}
    </SecureAuthContext.Provider>
  );
};

export const useSecureAuth = () => {
  const context = useContext(SecureAuthContext);
  if (context === undefined) {
    throw new Error('useSecureAuth must be used within a SecureAuthProvider');
  }
  return context;
};
