import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let cachedSupabase: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (cachedSupabase) return cachedSupabase;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Secrets panel.');
  }

  cachedSupabase = createClient(supabaseUrl, supabaseAnonKey);
  return cachedSupabase;
};

// Singleton instance for convenience, but check before use or use getSupabase()
export const supabase = (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-url')) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export type UserRole = 'admin' | 'directivo' | 'oficina';

export interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
}

export interface HealthReport {
  id: string;
  establecimiento: string;
  estado: 'activo' | 'pendiente' | 'inactivo';
  created_at: string;
  creator_id: string;
}
