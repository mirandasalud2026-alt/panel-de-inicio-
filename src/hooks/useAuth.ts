import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Asegúrate de que esta ruta sea correcta
import { User } from '@supabase/supabase-js';

// Define la interfaz de tu usuario para mayor orden
export interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'directivo' | 'oficina' | 'nominal';
  estado: 'aprobado' | 'pendiente' | 'bloqueado';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Lógica centralizada para cargar el perfil
  async function cargarPerfil(authUser: User) {
    // A. MODO DEMO: Si está activado en localStorage, saltamos la DB
    if (typeof window !== 'undefined' && localStorage.getItem('sim_demo_admin') === 'true') {
      const role = localStorage.getItem('sim_demo_role');
      return {
        id: 'demo-id',
        nombre: 'Usuario Demo',
        email: authUser.email || 'demo@mirandasalud.com',
        rol: (role as any) || 'nominal',
        estado: 'aprobado'
      } as UserProfile;
    }

    // B. MODO REAL: Consultamos tu tabla maestra 'usuarios'
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error) {
      console.error("Error cargando perfil desde usuarios:", error);
      return null;
    }
    return data as UserProfile;
  }

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const p = await cargarPerfil(session.user);
        if (mounted) {
          setUser(session.user);
          setProfile(p);
        }
      }
      if (mounted) setLoading(false);
    }

    initAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        cargarPerfil(session.user).then(p => {
          if (mounted) {
            setUser(session.user);
            setProfile(p);
          }
        });
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading };
}