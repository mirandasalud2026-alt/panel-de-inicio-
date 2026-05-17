import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Secrets.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export type UserRole = 'directivo' | 'oficina';

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
