import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  supabase,
  onAuthStateChange,
  clearAuthToken,
  setAuthToken,
  devLogin as supabaseDevLogin,
  signIn,
  signUp,
  signInWithGoogle,
  resendVerificationEmail,
  sendPasswordReset,
  signOut,
} from '../utils/supabase';

const supabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
const allowDevFallback = import.meta.env.DEV || import.meta.env.VITE_ALLOW_DEV_LOGIN === 'true';

type AuthValue = {
  authenticated: boolean;
  token: string | null;
  user: any;
  loading: boolean;
  canUseDevLogin: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string) => Promise<any>;
  loginWithGoogle: () => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  devLogin: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

function useProvideAuth(): AuthValue {
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const syncSession = (session: { access_token: string; user: any } | null) => {
    if (!session) return;

    setAuthToken(session.access_token);
    setToken(session.access_token);
    setAuthenticated(true);
    setUser(session.user);
  };

  const toAuthError = (err: any, fallback: string) => {
    const message = err?.message || fallback;
    const lower = String(message).toLowerCase();
    if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network request failed')) {
      return 'Auth service is unreachable. Check your Supabase URL/keys configuration and try again.';
    }
    if (lower.includes('could not resolve host') || lower.includes('nxdomain') || lower.includes('dns')) {
      return 'Auth service hostname could not be resolved. Verify SUPABASE_URL and VITE_SUPABASE_URL.';
    }
    if (lower.includes('email not confirmed')) {
      return 'Your email is not confirmed yet. Check your inbox and verify your account first.';
    }
    if (lower.includes('invalid login credentials')) {
      return 'Invalid email or password.';
    }
    return message;
  };

  useEffect(() => {
    if (!supabaseConfigured) {
      const devToken = localStorage.getItem('petal_token');
      if (allowDevFallback && devToken) {
        setToken(devToken);
        setAuthenticated(true);
        setUser({ id: 'dev-user', email: 'dev@petal.local' });
      }
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        syncSession(session as any);
      } else {
        clearAuthToken();
        setToken(null);
        setAuthenticated(false);
        setUser(null);
      }
      setLoading(false);
    }).catch(() => {
      clearAuthToken();
      setToken(null);
      setAuthenticated(false);
      setUser(null);
      setLoading(false);
    });

    const { data: { subscription } } = onAuthStateChange((_event, session) => {
      if (session) {
        setAuthToken(session.access_token);
        setToken(session.access_token);
        setAuthenticated(true);
        setUser(session.user);
      } else {
        clearAuthToken();
        setToken(null);
        setAuthenticated(false);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (!supabaseConfigured) {
      if (!allowDevFallback) {
        throw new Error('Supabase authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      }
      const t = await supabaseDevLogin();
      setToken(t);
      setAuthenticated(true);
      setUser({ id: 'dev-user', email: email || 'dev@petal.local' });
      return { session: { access_token: t } };
    }
    const { data, error } = await signIn(email, password);
    if (error) throw new Error(toAuthError(error, 'Failed to sign in.'));
    const authData = data ?? { session: null, user: null };
    if (!authData.session) {
      throw new Error('Sign in did not return an active session. If this is a new account, confirm your email first.');
    }
    syncSession(authData.session ?? null);
    return authData;
  };

  const signup = async (email: string, password: string) => {
    if (!supabaseConfigured) {
      if (!allowDevFallback) {
        throw new Error('Supabase authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      }
      const t = await supabaseDevLogin();
      setToken(t);
      setAuthenticated(true);
      setUser({ id: 'dev-user', email: email || 'dev@petal.local' });
      return { session: { access_token: t }, user: { email } };
    }
    const { data, error } = await signUp(email, password);
    if (error) throw new Error(toAuthError(error, 'Failed to create account.'));
    const authData = data ?? { session: null, user: null };
    syncSession(authData.session ?? null);
    return authData;
  };

  const loginWithGoogle = async () => {
    if (!supabaseConfigured) {
      throw new Error('Supabase authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }
    const { error } = await signInWithGoogle();
    if (error) {
      throw error;
    }
  };

  const resendVerification = async (email: string) => {
    if (!supabaseConfigured) {
      throw new Error('Supabase authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }
    const { error } = await resendVerificationEmail(email);
    if (error) {
      throw new Error(toAuthError(error, 'Failed to resend verification email.'));
    }
  };

  const requestPasswordReset = async (email: string) => {
    if (!supabaseConfigured) {
      throw new Error('Supabase authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }
    const { error } = await sendPasswordReset(email);
    if (error) {
      throw new Error(toAuthError(error, 'Failed to send password reset email.'));
    }
  };

  const logout = async () => {
    if (supabaseConfigured) {
      await signOut();
    }
    clearAuthToken();
    setToken(null);
    setAuthenticated(false);
    setUser(null);
  };

  const devLogin = async () => {
    if (!allowDevFallback) {
      throw new Error('Dev login is disabled outside local development.');
    }
    const t = await supabaseDevLogin();
    setToken(t);
    setAuthenticated(true);
    setUser({ id: 'dev-user', email: 'dev@petal.local' });
  };

  return useMemo(() => ({
    authenticated,
    token,
    user,
    loading,
    canUseDevLogin: allowDevFallback,
    login,
    signup,
    loginWithGoogle,
    resendVerification,
    requestPasswordReset,
    logout,
    devLogin,
  }), [authenticated, token, user, loading]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useProvideAuth();
  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
