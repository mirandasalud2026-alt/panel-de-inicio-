import { useState, useEffect } from 'react';
import { supabase, UserProfile } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchProfile(uid: string, currentUserEmail: string | undefined) {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', uid)
          .single();
        
        if (error) {
          console.warn('Profile fetch error (using fallback):', error.message);
        }
        if (mounted) {
          if (!error && data) {
            setProfile(data as UserProfile);
          } else {
            setProfile({
              id: uid,
              nombre: currentUserEmail === 'miranda.salud2026@gmail.com' ? 'Administrador Central' : 'Usuario Oficina',
              email: currentUserEmail || '',
              rol: currentUserEmail === 'miranda.salud2026@gmail.com' ? 'admin' : 'oficina'
            });
          }
          setLoading(false);
        }
      } catch (err) {
        if (mounted) setLoading(false);
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id, currentUser.email);
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.error('Supabase session fetch failed:', err);
      if (mounted) setLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id, currentUser.email);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Run once on mount

  return { user, profile, loading };
}
