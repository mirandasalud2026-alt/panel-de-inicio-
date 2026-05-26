import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import DirectorDashboard from '../components/ui/DirectorDashboard';
import MinimalistDashboard from '../components/ui/MinimalistDashboard';
import OficinaDashboard from '../components/ui/OficinaDashboard';
import AdminPortal from '../components/ui/AdminPortal';
import InteractiveMirandaMap from '../components/InteractiveMirandaMap';
import { supabase } from '../lib/supabase';
import { LogOut, User, ShieldCheck, Clock, FileCheck, ExternalLink, LayoutDashboard, TrendingUp, AlertTriangle, LayoutGrid } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const { user, profile, loading } = useAuth();
  const [activeDirectivoView, setActiveDirectivoView] = useState<'analitico' | 'minimalista' | 'mapa'>('analitico');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeDirectivoView, profile?.rol]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F3F4F6] p-10 text-center">
        <div className="relative mb-8">
           <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-100 border-t-[#0B3D5C]"></div>
           <div className="absolute inset-0 flex items-center justify-center">
              <ShieldCheck className="text-[#0B3D5C]/20" size={24} />
           </div>
        </div>
        <h3 className="text-sm font-black text-[#0B3D5C] uppercase tracking-[0.3em] mb-2">Iniciando Sistema</h3>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest max-w-xs leading-relaxed">
          Sincronizando credenciales y políticas de seguridad...
        </p>
        
        <div className="mt-12 text-[9px] text-gray-300 font-medium uppercase tracking-tighter">
          Si esto demora más de 10 segundos, verifique su conexión o las variables VITE_ en Vercel.
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[8px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-all"
        >
          Forzar Recarga
        </button>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" />;
  }

  if (profile.rol !== 'admin' && profile.estado === 'pendiente') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] p-6">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 max-w-lg text-center">
           <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Clock size={40} />
           </div>
           <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-4">Acreditación en Proceso</h2>
           <p className="text-gray-500 leading-relaxed mb-8">
             Hola <b>{profile.nombre}</b>. Tu solicitud de acceso al sistema de Miranda Salud está siendo revisada por un administrador.
           </p>
           <button 
             onClick={() => {
               supabase?.auth.signOut();
               window.location.href = '/login';
             }}
             className="px-8 py-4 bg-gray-50 text-gray-400 font-bold rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all uppercase text-xs tracking-widest"
           >
             Cerrar Sesión
           </button>
        </div>
      </div>
    );
  }

  // Si es admin, mostrar AdminPortal
  if (profile.rol === 'admin') {
    return (
      <div className="min-h-screen bg-[#F3F4F6] pb-10 font-sans flex flex-col justify-start">
        <div className="sticky top-0 z-30 shadow-md shrink-0">
          <div className="h-2 w-full flex">
            <div className="flex-1 bg-[#FFD700]"></div>
            <div className="flex-1 bg-[#002F6C]"></div>
            <div className="flex-1 bg-[#CF0921]"></div>
            <div className="flex-1 bg-[#008751]"></div>
          </div>

          <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 md:px-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                <ShieldCheck size={24} />
              </div>
              <div className="hidden sm:block">
                <h2 className="text-lg font-bold text-gray-800 leading-none">Gestión Maestra</h2>
                <p className="text-xs text-gray-400 mt-1 font-medium">Conectado como {profile.rol}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
              <div className="hidden xs:flex flex-col items-end">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{profile.nombre}</span>
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest bg-red-50 text-red-600">
                  {profile.rol}
                </span>
              </div>
              
              <button 
                onClick={() => {
                  localStorage.removeItem('sim_demo_admin');
                  localStorage.removeItem('sim_demo_role');
                  supabase?.auth.signOut();
                  if (!supabase) window.location.href = '/login';
                }}
                className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm"
                title="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </div>
          </header>
        </div>

        <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-12 w-full">
          <AdminPortal />
        </main>

        <footer className="mt-8 px-6 text-center opacity-30">
          <p className="text-[10px] text-[#0B3D5C] font-extrabold uppercase tracking-[0.3em]">
            Miranda Salud • Seguridad Reforzada 2026
          </p>
        </footer>
      </div>
    );
  }

  // Si es directivo, mostrar el consolidado de reportes en tránsito directamente
  if (profile.rol === 'directivo') {
    return (
      <div className="min-h-screen bg-[#F3F4F6] pb-10 font-sans flex flex-col justify-start">
        <div className="sticky top-0 z-30 shadow-md shrink-0">
          <div className="h-2 w-full flex">
            <div className="flex-1 bg-[#FFD700]"></div>
            <div className="flex-1 bg-[#002F6C]"></div>
            <div className="flex-1 bg-[#CF0921]"></div>
            <div className="flex-1 bg-[#008751]"></div>
          </div>

          <header className="bg-white border-b border-gray-200">
            <div className="h-20 flex items-center justify-between px-6 md:px-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#0B3D5C] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {profile.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <h2 className="text-lg font-bold text-gray-800 leading-none">Panel de Control Directivo</h2>
                  <p className="text-xs text-gray-400 mt-1 font-medium">Conectado como {profile.rol}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-6">
                <div className="hidden xs:flex flex-col items-end">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{profile.nombre}</span>
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest bg-[#0B3D5C]/10 text-[#0B3D5C]">
                    {profile.rol}
                  </span>
                </div>
                
                <button 
                  onClick={() => {
                    localStorage.removeItem('sim_demo_admin');
                    localStorage.removeItem('sim_demo_role');
                    supabase?.auth.signOut();
                    if (!supabase) window.location.href = '/login';
                  }}
                  className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm"
                  title="Cerrar sesión"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </header>
        </div>

        <main className="max-w-7xl mx-auto p-6 md:p-8 w-full">
          <DirectorDashboard />
        </main>

        <footer className="mt-8 px-6 text-center opacity-30">
          <p className="text-[10px] text-[#0B3D5C] font-extrabold uppercase tracking-[0.3em]">
            Miranda Salud • Seguridad Reforzada 2026
          </p>
        </footer>
      </div>
    );
  }

  // Si es oficina, mostrar OficinaDashboard
  return (
    <div className="min-h-screen bg-[#F3F4F6] pb-10 font-sans flex flex-col justify-start">
      <div className="sticky top-0 z-30 shadow-md shrink-0">
        <div className="h-2 w-full flex">
          <div className="flex-1 bg-[#FFD700]"></div>
          <div className="flex-1 bg-[#002F6C]"></div>
          <div className="flex-1 bg-[#CF0921]"></div>
          <div className="flex-1 bg-[#008751]"></div>
        </div>

        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 md:px-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#0B3D5C] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {profile.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <h2 className="text-lg font-bold text-gray-800 leading-none">Panel Operativo</h2>
              <p className="text-xs text-gray-400 mt-1 font-medium">Conectado como {profile.rol}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden xs:flex flex-col items-end">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{profile.nombre}</span>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest bg-[#0B3D5C]/10 text-[#0B3D5C]">
                {profile.rol}
              </span>
            </div>
            
            <button 
              onClick={() => {
                localStorage.removeItem('sim_demo_admin');
                localStorage.removeItem('sim_demo_role');
                supabase?.auth.signOut();
                if (!supabase) window.location.href = '/login';
              }}
              className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
      </div>

      <main className="max-w-7xl mx-auto p-6 md:p-8 w-full">
        <OficinaDashboard />
      </main>

      <footer className="mt-8 px-6 text-center opacity-30">
        <p className="text-[10px] text-[#0B3D5C] font-extrabold uppercase tracking-[0.3em]">
          Miranda Salud • Seguridad Reforzada 2026
        </p>
      </footer>
    </div>
  );
}