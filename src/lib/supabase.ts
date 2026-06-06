// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tzmhagwihumwiprsnyid.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6bWhhZ3dpaHVtd2lwcnNueWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjU2NDUsImV4cCI6MjA5NDU0MTY0NX0.ofDFZn5JpOrDktK4YSnUk-Qsd2V5Eil1Nl-xf84rr78';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Faltan variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'sb-auth-token',
    flowType: 'pkce',
  },
});

export type UserRole = 'admin' | 'directivo' | 'oficina' | 'nominal';

export interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  id_centro?: string | null;
  cod_eje?: string | null;
  nombre_centro?: string | null;
  asic_centro?: string | null;
}