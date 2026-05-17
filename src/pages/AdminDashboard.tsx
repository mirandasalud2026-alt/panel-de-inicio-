import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import DirectorDashboard from '../components/ui/DirectorDashboard';
import OficinaDashboard from '../components/ui/OficinaDashboard';
import { supabase } from '../lib/supabase';
import { LogOut, User } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-[#F3F4F6] pb-10 font-sans">
      {/* Header */}
      <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 md:px-8 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#0B3D5C] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
            {profile.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <h2 className="text-lg font-bold text-gray-800 leading-none">
              {profile.rol === 'directivo' ? 'Panel de Control' : 'Panel Operativo'}
            </h2>
            <p className="text-xs text-gray-400 mt-1 font-medium">Bienvenido, {profile.nombre}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <span className="hidden xs:inline-block px-4 py-1.5 bg-[#0B3D5C]/10 text-[#0B3D5C] text-xs font-bold rounded-full uppercase tracking-wider">
            {profile.rol === 'directivo' ? 'Directivo' : 'Oficina'}
          </span>
          
          <button 
            onClick={() => supabase.auth.signOut()}
            className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm"
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 md:p-8">
        {profile.rol === 'directivo' ? <DirectorDashboard /> : <OficinaDashboard />}
      </main>

      {/* Footer Info */}
      <footer className="mt-auto px-6 text-center">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
          Plataforma de Gestión Sanitaria v1.0
        </p>
      </footer>
    </div>
  );
}
