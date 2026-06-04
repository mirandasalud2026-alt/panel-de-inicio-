// hooks/useAuth.ts - Versión CORREGIDA
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'directivo' | 'oficina' | 'nominal';
  estado: 'aprobado' | 'pendiente' | 'rechazado';
  id_centro?: string | null;
  cod_eje?: string | null;
  nombre_centro?: string | null;
  asic_centro?: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user ID:', userId);
      
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      if (data) {
        console.log('Profile found:', data);
        const userProfile = { ...data } as UserProfile;
        
        // Cargar datos adicionales del centro si está vinculado
        if (data.id_centro) {
          try {
            const { data: centroData } = await supabase
              .from('transito_reportes')
              .select('nombre_centro, asic')
              .eq('id_centro', data.id_centro)
              .maybeSingle();
            
            if (centroData) {
              userProfile.nombre_centro = centroData.nombre_centro;
              userProfile.asic_centro = centroData.asic;
            }
          } catch (centroErr) {
            console.error('Error fetching associated center details:', centroErr);
          }
        }
        
        return userProfile;
      }
      
      console.log('No profile found for user:', userId);
      return null;
    } catch (err) {
      console.error('Unexpected error in fetchProfile:', err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      setLoading(true);
      
      // 1. Obtener la sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!mounted) return;
      
      if (session?.user) {
        setUser(session.user);
        const userProfile = await fetchProfile(session.user.id);
        if (mounted) {
          setProfile(userProfile);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      
      if (mounted) {
        setLoading(false);
      }
    };

    initializeAuth();

    // 2. Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (!mounted) return;
        
        if (session?.user) {
          setUser(session.user);
          const userProfile = await fetchProfile(session.user.id);
          if (mounted) {
            setProfile(userProfile);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return { user, profile, loading, signOut };
}