// lib/supabase.ts - VERSIÓN CORREGIDA
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Logs para depuración
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ SUPABASE_URL o SUPABASE_ANON_KEY no detectados.');
  console.warn('Asegúrese de usar el prefijo VITE_ en el panel de Secretos (Ej: VITE_SUPABASE_URL).');
}

let cachedSupabase: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (cachedSupabase) return cachedSupabase;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-url')) {
    console.error('❌ Credenciales de Supabase inválidas o faltantes');
    return null;
  }

  try {
    // CONFIGURACIÓN CRÍTICA: Asegurar que la sesión se mantiene
    cachedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,      // Refrescar token automáticamente
        persistSession: true,         // Persistir sesión en localStorage
        detectSessionInUrl: true,     // Detectar sesión en URL
        storage: localStorage,        // Usar localStorage para persistencia
        storageKey: 'sb-auth-token',  // Clave única para el token
        flowType: 'pkce',             // Usar PKCE (más seguro)
        debug: false,                 // Desactivar logs debug en producción/iframe para evitar errores de clonación de Symbols
      },
      global: {
        headers: {
          'x-application-name': 'miranda-salud',
        },
      },
    });
    
    console.log('✅ Supabase client initialized successfully');
    return cachedSupabase;
  } catch (err) {
    console.error('❌ Error creating Supabase client:', err);
    return null;
  }
};

// Exportar una instancia que maneje la sesión automáticamente
export const supabase = getSupabase();

// Helper para verificar el estado de autenticación
export const checkAuthStatus = async () => {
  if (!supabase) return { isAuthenticated: false, userId: null, error: 'No supabase client' };
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return { isAuthenticated: false, userId: null, error: error.message };
    }
    
    const isAuthenticated = !!session;
    const userId = session?.user?.id || null;
    
    console.log('Auth status:', { isAuthenticated, userId, email: session?.user?.email });
    
    return { isAuthenticated, userId, session, error: null };
  } catch (err) {
    console.error('Unexpected error checking auth:', err);
    return { isAuthenticated: false, userId: null, error: String(err) };
  }
};

export type UserRole = 'admin' | 'directivo' | 'oficina' | 'nominal';

export interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  estado?: 'pendiente' | 'aprobado' | 'rechazado';
  id_centro?: string | null;
  cod_eje?: string | null;
  nombre_centro?: string | null;
  asic_centro?: string | null;
}

export interface HealthReport {
  id: string;
  establecimiento: string;
  estado: 'activo' | 'pendiente' | 'inactivo';
  created_at: string;
  creator_id: string;
}