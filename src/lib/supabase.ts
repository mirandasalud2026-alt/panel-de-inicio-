import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Logs for debugging environment variables (safe to show in dev)
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ SUPABASE_URL o SUPABASE_ANON_KEY no detectados.');
  console.warn('Asegúrese de usar el prefijo VITE_ en el panel de Secretos (Ej: VITE_SUPABASE_URL).');
}

let cachedSupabase: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (cachedSupabase) return cachedSupabase;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-url')) {
    return null;
  }

  try {
    cachedSupabase = createClient(supabaseUrl, supabaseAnonKey);
    return cachedSupabase;
  } catch (err) {
    console.error('Error creating Supabase client:', err);
    return null;
  }
};

// Singleton instance
export const supabase = getSupabase();

export type UserRole = 'admin' | 'directivo' | 'oficina';

export interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  estado?: 'pendiente' | 'aprobado' | 'rechazado';
}

export interface HealthReport {
  id: string;
  establecimiento: string;
  estado: 'activo' | 'pendiente' | 'inactivo';
  created_at: string;
  creator_id: string;
}
