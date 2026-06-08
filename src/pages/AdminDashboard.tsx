import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Home } from 'lucide-react';
import FloatingBackButton from '../components/ui/FloatingBackButton';
import AdminPortal from '../components/ui/AdminPortal';

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();

  useEffect(() => {
    if (profile && profile.rol !== 'admin') {
      window.location.href = '/';
    }
  }, [profile]);

  if (!profile || profile.rol !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white/50 text-xs font-black uppercase tracking-widest">
        Verificando credenciales de administración...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700">
      {/* CABECERA INSTITUCIONAL */}
      <div className="bg-[#0B3D5C] text-white py-6 px-4 sm:px-6 relative shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 text-white rounded-2xl">
              <span className="font-display font-black text-xl">M</span>
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tight leading-none mb-1 font-display">
                Gobernación del Estado Bolivariano de Miranda
              </h1>
              <h2 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed">
                Dirección Estadal de Salud • Panel de Control Principal
              </h2>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <div>
              <p className="text-[11px] font-black uppercase text-[#FFD700]">Sesión Administrativa Autorizada</p>
              <p className="text-[9px] text-slate-350 text-slate-300 font-mono mt-0.5">{profile.nombre} • Rol: {profile.rol}</p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 active:scale-95 transition text-[9px] font-black uppercase tracking-widest rounded-lg cursor-pointer"
                title="Volver al Portal de Carga"
              >
                <Home size={11} /> Volver al Portal
              </button>
              <button
                onClick={signOut}
                className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 active:scale-95 transition text-white text-[9px] font-black uppercase tracking-widest rounded-lg cursor-pointer"
                title="Cerrar sesión de Miranda Salud"
              >
                <LogOut size={11} /> Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 pb-24">
        <AdminPortal />
      </div>

      <FloatingBackButton />
    </div>
  );
}
