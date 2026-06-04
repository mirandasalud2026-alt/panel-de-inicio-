import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

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

  async function cargarPerfil(authUser: User) {
    // A. MODO DEMO
    if (typeof window !== 'undefined' && localStorage.getItem('sim_demo_admin') === 'true') {
      const role = localStorage.getItem('sim_demo_role') || 'nominal';
      return {
        id: 'demo-id',
        nombre: 'Usuario Demo',
        email: authUser.email || 'demo@mirandasalud.com',
        rol: role,
        estado: 'aprobado'
      } as UserProfile;
    }

    // B. MODO REAL: Consultamos tu tabla 'usuarios'
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserProfile;
    } catch (e) {
      console.error("Error al cargar perfil:", e);
      return null;
    }
  }

  useEffect(() => {
    let mounted = true;

    async function init() {
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

    init();

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

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  return { user, profile, loading };
}