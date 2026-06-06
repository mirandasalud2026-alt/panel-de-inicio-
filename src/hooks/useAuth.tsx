// hooks/useAuth.tsx
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase, UserProfile } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  fetchingProfile: boolean;
  fetchError: string | null;
  signOut: () => Promise<void>;
  retryFetchProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);
  const lastFetchedUserIdRef = useRef<string | null>(null);
  const profileRef = useRef<UserProfile | null>(null);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const fetchProfile = useCallback(async (userId: string, email?: string, timeoutMs = 1500) => {
    if (lastFetchedUserIdRef.current === userId && profileRef.current) {
      return profileRef.current;
    }
    if (fetchingRef.current) return null;

    fetchingRef.current = true;
    setFetchingProfile(true);
    setFetchError(null);

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout al obtener perfil')), timeoutMs)
      );

      const queryPromise = supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) throw new Error(`Error BD: ${error.message}`);

      if (data) {
        const userProfile = { ...data } as UserProfile;
        if (data.id_centro) {
          const { data: centroData } = await supabase
            .from('transito_reportes')
            .select('nombre_centro, asic')
            .eq('id_centro', data.id_centro)
            .maybeSingle();
          if (centroData) {
            userProfile.nombre_centro = centroData.nombre_centro;
            userProfile.asic_centro = centroData.asic;
          }
        }
        lastFetchedUserIdRef.current = userId;
        setProfile(userProfile);
        return userProfile;
      }

      // Auto-crear perfil si no existe
      const userEmail = email || '';
      const isMainAdmin = userEmail.toLowerCase() === 'miranda.salud2026@gmail.com';
      const newProfile: UserProfile = {
        id: userId,
        nombre: userEmail.split('@')[0].toUpperCase(),
        email: userEmail || 'usuario@mirandasalud.com',
        rol: isMainAdmin ? 'admin' : 'nominal',
        estado: 'aprobado',
        id_centro: null,
        cod_eje: null,
      };

      const { error: insertError } = await supabase.from('usuarios').insert(newProfile);
      if (insertError) throw new Error(`No se pudo crear perfil: ${insertError.message}`);

      lastFetchedUserIdRef.current = userId;
      setProfile(newProfile);
      return newProfile;
    } catch (err: any) {
      console.warn('Error obteniendo perfil, aplicando perfil de contingencia:', err.message);
      const fallbackProfile: UserProfile = {
        id: userId,
        nombre: email ? email.split('@')[0].toUpperCase() : 'USUARIO',
        email: email || 'usuario@mirandasalud.com',
        rol: email === 'miranda.salud2026@gmail.com' ? 'admin' : 'nominal',
        estado: 'aprobado',
      };
      lastFetchedUserIdRef.current = userId;
      setProfile(fallbackProfile);
      setFetchError(null);
      return fallbackProfile;
    } finally {
      fetchingRef.current = false;
      setFetchingProfile(false);
    }
  }, []);

  const retryFetchProfile = useCallback(() => {
    if (!user?.id) return;
    lastFetchedUserIdRef.current = null;
    setFetchError(null);
    fetchProfile(user.id, user.email);
  }, [user, fetchProfile]);

  useEffect(() => {
    mountedRef.current = true;
    const init = async () => {
      setLoading(true);
      const isDemo = localStorage.getItem('sim_demo_admin') === 'true';
      if (isDemo) {
        setUser({ id: 'demo-user-id', email: 'demo@test.com' } as any);
        setProfile({
          id: 'demo-user-id', nombre: 'DEMO', email: 'demo@test.com',
          rol: 'admin', estado: 'aprobado',
        });
        setLoading(false);
        return;
      }
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id, session.user.email);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (localStorage.getItem('sim_demo_admin') === 'true') return;
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id, session.user.email);
      } else {
        setUser(null);
        setProfile(null);
        lastFetchedUserIdRef.current = null;
      }
    });

    return () => {
      mountedRef.current = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = async () => {
    localStorage.removeItem('sim_demo_admin');
    localStorage.removeItem('sim_demo_role');
    localStorage.removeItem('sim_demo_cod_eje');
    localStorage.removeItem('sim_demo_cod_asic');
    localStorage.removeItem('sim_demo_id_centro');
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setFetchError(null);
    lastFetchedUserIdRef.current = null;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, fetchingProfile, fetchError, signOut, retryFetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}