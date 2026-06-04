import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

// Interfaz definida para tu tabla 'usuarios'
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
    try {
      // 1. Intentar buscar el perfil existente
      let { data: profileData, error: fetchError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      // 2. SI NO EXISTE: Crear el perfil automáticamente
      if (!profileData) {
        console.log("Perfil no encontrado, creando perfil para:", authUser.email);
        
        const { data: newProfile, error: insertError } = await supabase
          .from('usuarios')
          .insert([{
            id: authUser.id,
            nombre: 'Usuario Nuevo',
            email: authUser.email,
            rol: 'oficina', // Rol por defecto
            estado: 'pendiente'
          }])
          .select()
          .single();

        if (insertError) {
          console.error("Error al crear perfil automático:", insertError);
          return null;
        }
        return newProfile as UserProfile;
      }

      return profileData as UserProfile;
    } catch (err) {
      console.error("Error en el flujo de perfil:", err);
      return null;
    }
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

    // Escuchar cambios en la sesión (Login/Logout)
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