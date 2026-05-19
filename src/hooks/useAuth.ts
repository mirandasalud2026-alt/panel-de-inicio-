import { useState, useEffect } from 'react';
import { supabase, UserProfile } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('sim_demo_admin') === 'true') {
      const role = localStorage.getItem('sim_demo_role');
      return { email: role === 'directivo' ? 'directivo@miranda.gob.ve' : 'miranda.salud2026@gmail.com' } as User;
    }
    return null;
  });
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('sim_demo_admin') === 'true') {
      const role = localStorage.getItem('sim_demo_role');
      if (role === 'directivo') {
        return {
          id: 'demo-directivo',
          nombre: 'Director de Vigilancia (Demo)',
          email: 'directivo@miranda.gob.ve',
          rol: 'directivo',
          estado: 'aprobado'
        };
      }
      return {
        id: 'demo-admin',
        nombre: 'Administrador Central (Demo)',
        email: 'miranda.salud2026@gmail.com',
        rol: 'admin',
        estado: 'aprobado'
      };
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Use isPending to avoid clearing state while we are checking auth
    let isChecking = true;

    async function fetchProfile(uid: string, currentUserEmail: string | undefined) {
      if (!supabase) {
        // Even without Supabase, handle demo
        if (currentUserEmail === 'miranda.salud2026@gmail.com') {
          setProfile({
            id: uid || 'demo-admin',
            nombre: 'Administrador Central (Demo)',
            email: 'miranda.salud2026@gmail.com',
            rol: 'admin',
            estado: 'aprobado'
          });
        } else if (currentUserEmail === 'directivo@miranda.gob.ve') {
          setProfile({
            id: uid || 'demo-directivo',
            nombre: 'Director de Vigilancia (Demo)',
            email: 'directivo@miranda.gob.ve',
            rol: 'directivo',
            estado: 'aprobado'
          });
        }
        setLoading(false);
        return;
      }

      // Safeguard against infinite loading if DB hangs (e.g., RLS recursion)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 8000)
      );

      try {
        const fetchPromise = supabase
          .from('usuarios')
          .select('*')
          .eq('id', uid)
          .single();
        
        const response: any = await Promise.race([fetchPromise, timeoutPromise]);
        const { data, error } = response;
        
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
        console.warn('Profile fetch failed or timed out:', err);
        if (mounted) {
          // Fallback if it fails or times out
          setProfile({
            id: uid,
            nombre: currentUserEmail === 'miranda.salud2026@gmail.com' ? 'Administrador Central (Recovery)' : 'Usuario Oficina',
            email: currentUserEmail || '',
            rol: currentUserEmail === 'miranda.salud2026@gmail.com' ? 'admin' : 'oficina'
          });
          setLoading(false);
        }
      }
    }

    // Helper to resolve demo profile
    const setDemoState = () => {
      const isDemo = localStorage.getItem('sim_demo_admin') === 'true';
      if (!isDemo) return false;

      const demoRole = localStorage.getItem('sim_demo_role');
      if (demoRole === 'directivo') {
        setUser({ email: 'directivo@miranda.gob.ve' } as User);
        setProfile({
          id: 'demo-directivo',
          nombre: 'Director de Vigilancia (Demo)',
          email: 'directivo@miranda.gob.ve',
          rol: 'directivo',
          estado: 'aprobado'
        });
      } else {
        setUser({ email: 'miranda.salud2026@gmail.com' } as User);
        setProfile({
          id: 'demo-admin',
          nombre: 'Administrador Central (Demo)',
          email: 'miranda.salud2026@gmail.com',
          rol: 'admin',
          estado: 'aprobado'
        });
      }
      setLoading(false);
      return true;
    };

    // Get initial session
    const checkAuth = async () => {
      try {
        if (!mounted) return;
        
        const { data: { session } } = await (supabase ? supabase.auth.getSession() : Promise.resolve({ data: { session: null } }));
        if (!mounted) return;
        
        const currentUser = session?.user ?? null;
        
        if (currentUser) {
          setUser(currentUser);
          await fetchProfile(currentUser.id, currentUser.email);
        } else if (setDemoState()) {
          // Handled by setDemoState
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Supabase session fetch failed:', err);
        if (mounted && !setDemoState()) {
          setLoading(false);
        }
      }
    };

    checkAuth();
    
    // Storage listener for demo login sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sim_demo_admin' || e.key === 'sim_demo_role') {
        if (mounted) setDemoState();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Listen for changes
    let subscription: { unsubscribe: () => void } | null = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return;
        const currentUser = session?.user ?? null;
        
        if (currentUser) {
          setUser(currentUser);
          localStorage.removeItem('sim_demo_admin'); // Clear bypass if real session starts
          await fetchProfile(currentUser.id, currentUser.email);
        } else if (localStorage.getItem('sim_demo_admin') === 'true') {
          // Robust demo handling in state change
          setDemoState();
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      });
      subscription = data.subscription;
    }

    return () => {
      mounted = false;
      window.removeEventListener('storage', handleStorageChange);
      if (subscription) subscription.unsubscribe();
    };
  }, []); // Run once on mount

  return { user, profile, loading };
}
