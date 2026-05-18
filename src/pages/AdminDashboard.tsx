import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import DirectorDashboard from '../components/ui/DirectorDashboard';
import OficinaDashboard from '../components/ui/OficinaDashboard';
import AdminPortal from '../components/ui/AdminPortal';
import InteractiveMirandaMap from '../components/InteractiveMirandaMap';
import { supabase } from '../lib/supabase';
import { LogOut, User, ShieldCheck } from 'lucide-react';

export default function AdminDashboard() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B3D5C]"></div>
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
             Hola <b>{profile.nombre}</b>. Tu solicitud de acceso al sistema SIM Miranda está siendo revisada por un administrador.
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

  return (
    <div className="min-h-screen bg-[#F3F4F6] pb-10 font-sans">
      {/* Header */}
      <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 md:px-8 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 ${profile.rol === 'admin' ? 'bg-red-600' : 'bg-[#0B3D5C]'} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm transition-colors`}>
            {profile.rol === 'admin' ? <ShieldCheck size={24} /> : profile.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <h2 className="text-lg font-bold text-gray-800 leading-none">
              {profile.rol === 'admin' ? 'Gestión Maestra' : profile.rol === 'directivo' ? 'Panel de Control' : 'Panel Operativo'}
            </h2>
            <p className="text-xs text-gray-400 mt-1 font-medium">Conectado como {profile.rol}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <div className="hidden xs:flex flex-col items-end">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{profile.nombre}</span>
            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest ${
              profile.rol === 'admin' ? 'bg-red-50 text-red-600' : 'bg-[#0B3D5C]/10 text-[#0B3D5C]'
            }`}>
              {profile.rol}
            </span>
          </div>
          
          <button 
            onClick={() => {
              localStorage.removeItem('sim_demo_admin');
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

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 md:p-8">
        {profile.rol === 'admin' && <AdminPortal />}
        {profile.rol === 'directivo' && <DirectorDashboard />}
        {profile.rol === 'oficina' && <OficinaDashboard />}
      </main>

      <footer className="mt-8 px-6 text-center opacity-30">
        <p className="text-[10px] text-[#0B3D5C] font-extrabold uppercase tracking-[0.3em]">
          SIM Miranda • Seguridad Reforzada 2026
        </p>
      </footer>
    </div>
  );
}
