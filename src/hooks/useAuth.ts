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

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    async function fetchProfile(uid: string) {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', uid)
        .single();
      
      if (!error && data) {
        setProfile(data as UserProfile);
      } else {
        // Fallback or auto-profile creation for demo
        setProfile({
          id: uid,
          nombre: user?.user_metadata?.full_name || 'Usuario',
          email: user?.email || '',
          rol: user?.email === 'miranda.salud2026@gmail.com' ? 'directivo' : 'oficina'
        });
      }
      setLoading(false);
    }

    return () => subscription.unsubscribe();
  }, [user?.email, user?.user_metadata?.full_name]);

  return { user, profile, loading };
}
