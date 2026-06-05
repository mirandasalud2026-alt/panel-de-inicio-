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
      
      console.log('No profile found for user:', userId, ', creating auto-profile in database...');
      const { data: authData } = await supabase.auth.getUser();
      const userEmail = authData?.user?.email || '';
      
      const isMainAdmin = userEmail.toLowerCase() === 'miranda.salud2026@gmail.com';
      const defaultProfile: UserProfile = {
        id: userId,
        nombre: (userEmail ? userEmail.split('@')[0] : 'USUARIO').toUpperCase(),
        email: userEmail || 'usuario@mirandasalud.com',
        rol: isMainAdmin ? 'admin' : 'nominal',
        estado: 'aprobado',
        id_centro: null,
        cod_eje: null
      };

      try {
        const { error: insertError } = await supabase
          .from('usuarios')
          .insert(defaultProfile);
        
        if (insertError) {
          console.warn('Error al auto-crear perfil en Base de Datos:', insertError);
        } else {
          console.log('✅ Perfil auto-creado exitosamente:', defaultProfile);
        }
      } catch (insertEx) {
        console.warn('Error insertando perfil en usuarios:', insertEx);
      }

      return defaultProfile;
    } catch (err) {
      console.error('Unexpected error in fetchProfile:', err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      setLoading(true);
      
      // 1. Check demo bypass first
      const isDemo = localStorage.getItem('sim_demo_admin') === 'true';
      if (isDemo) {
        const role = localStorage.getItem('sim_demo_role');
        const simulatedProfile: UserProfile = {
          id: 'demo-user-id',
          nombre: role === 'admin' ? 'Administrador General' : 'Cargador Nominal Territorial',
          email: role === 'admin' ? 'miranda.salud2026@gmail.com' : 'nominal@mirandasalud.com',
          rol: (role || 'admin') as any,
          estado: 'aprobado',
          id_centro: localStorage.getItem('sim_demo_id_centro'),
          cod_eje: localStorage.getItem('sim_demo_cod_eje'),
          nombre_centro: localStorage.getItem('sim_demo_id_centro') ? 'Centro Médico Demo' : undefined,
          asic_centro: localStorage.getItem('sim_demo_cod_asic') || undefined
        };
        if (mounted) {
          setUser({ id: 'demo-user-id', email: simulatedProfile.email } as any);
          setProfile(simulatedProfile);
          setLoading(false);
        }
        return;
      }

      // 2. Fallback to Supabase
      try {
        if (!supabase) {
          if (mounted) setLoading(false);
          return;
        }
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
      } catch (err) {
        console.error('Unhandled error resolving Supabase session:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // 3. Escuchar cambios en la autenticación (solo si no es demo)
    let subscription: any = null;
    if (supabase && localStorage.getItem('sim_demo_admin') !== 'true') {
      try {
        const { data } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state change:', event, session?.user?.id);
            
            if (!mounted) return;
            if (localStorage.getItem('sim_demo_admin') === 'true') return; // skip if demo was set during interaction
            
            try {
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
            } catch (err) {
              console.error('Error on auth state changed logic:', err);
            } finally {
              if (mounted) {
                setLoading(false);
              }
            }
          }
        );
        subscription = data?.subscription;
      } catch (e) {
        console.error('Error setting up onAuthStateChange:', e);
      }
    }

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signOut = async () => {
    localStorage.removeItem('sim_demo_admin');
    localStorage.removeItem('sim_demo_role');
    localStorage.removeItem('sim_demo_cod_eje');
    localStorage.removeItem('sim_demo_cod_asic');
    localStorage.removeItem('sim_demo_id_centro');
    
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Supabase auth signout returned error or warning:', e);
    }
    
    setUser(null);
    setProfile(null);
  };

  return { user, profile, loading, signOut };
}