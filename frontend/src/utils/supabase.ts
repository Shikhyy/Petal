import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export type { User, Session };

export function setAuthToken(token: string) {
  localStorage.setItem('petal_token', token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem('petal_token');
}

export function clearAuthToken() {
  localStorage.removeItem('petal_token');
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (data?.session) {
    setAuthToken(data.session.access_token);
  }
  return { data, error };
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/app` },
  });
  return { data, error };
}

export async function signOut() {
  await supabase.auth.signOut();
  clearAuthToken();
}

export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

// Dev fallback when Supabase is not configured
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  return !!token;
}

export async function devLogin(userId: string = '00000000-0000-0000-0000-000000000001'): Promise<string> {
  const token = btoa(JSON.stringify({ sub: userId, email: 'dev@petal.local' }));
  setAuthToken(token);
  return token;
}
