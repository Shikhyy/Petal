import { useState, useEffect } from 'react';
import { supabase, onAuthStateChange, clearAuthToken, devLogin as supabaseDevLogin } from '../utils/supabase';

const supabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing dev token first
    const devToken = localStorage.getItem('petal_token');
    if (devToken) {
      setToken(devToken);
      setAuthenticated(true);
      setLoading(false);
      return;
    }

    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setToken(session.access_token);
        setAuthenticated(true);
        setUser(session.user);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const { data: { subscription } } = onAuthStateChange((_event, session) => {
      if (session) {
        setToken(session.access_token);
        setAuthenticated(true);
        setUser(session.user);
      } else {
        setToken(null);
        setAuthenticated(false);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (!supabaseConfigured) throw new Error('Supabase not configured');
    const { signIn } = await import('../utils/supabase');
    const { data, error } = await signIn(email, password);
    if (error) throw error;
    return data;
  };

  const signup = async (email: string, password: string) => {
    if (!supabaseConfigured) throw new Error('Supabase not configured');
    const { signUp } = await import('../utils/supabase');
    const { data, error } = await signUp(email, password);
    if (error) throw error;
    return data;
  };

  const loginWithGoogle = async () => {
    if (!supabaseConfigured) throw new Error('Supabase not configured');
    const { signInWithGoogle } = await import('../utils/supabase');
    await signInWithGoogle();
  };

  const logout = async () => {
    if (supabaseConfigured) {
      const { signOut } = await import('../utils/supabase');
      await signOut();
    }
    clearAuthToken();
    setToken(null);
    setAuthenticated(false);
    setUser(null);
  };

  const devLogin = async () => {
    const t = await supabaseDevLogin();
    setToken(t);
    setAuthenticated(true);
  };

  return { authenticated, token, user, loading, login, signup, loginWithGoogle, logout, devLogin };
}
