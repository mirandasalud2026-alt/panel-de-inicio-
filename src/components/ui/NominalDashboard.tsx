import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { 
  LogOut, 
  User, 
  Activity, 
  HeartPulse, 
  FileSpreadsheet, 
  ExternalLink,
  ShieldCheck,
  LayoutGrid
} from 'lucide-react';
import { motion } from 'motion/react';

export default function NominalDashboard() {
  const { user, profile, loading } = useAuth();

  const handleLogout = async () => {
    localStorage.removeItem('sim_demo_admin');
    localStorage.removeItem('sim_demo_role');
    localStorage.removeItem('sim_demo_cod_eje');
    localStorage.removeItem('sim_demo_cod_asic');
    localStorage.removeItem('sim_demo_id_centro');
    
    if (supabase) {
      await supabase.auth.signOut();
    }
    window.location.href = '/';
  };

  const handleOpenForm = (type: 'QUIRURGICA' | 'OBSTETRICIA' | 'DEFUNCION') => {
    const emailParam = user?.email ? encodeURIComponent(user.email) : '';
    window.open(`/nominal-form?type=${type}&email=${emailParam}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-10 text-center">
        <div className="relative mb-8">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-neutral-200 border-t-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldCheck className="text-blue-600/20" size={24} />
          </div>
        </div>
        <h3 className="text-sm font-black text-blue-900 uppercase tracking-[0.3em] mb-2">Cargando Tablero</h3>
        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest max-w-xs leading-relaxed">
          Verificando sesión nominal institucional...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-between selection:bg-blue-500/20">
      {/* Flag decoration banner */}
      <div className="h-2 w-full flex shrink-0">
        <div className="flex-1 bg-[#FFD700]"></div>
        <div className="flex-1 bg-[#002F6C]"></div>
        <div className="flex-1 bg-[#CF0921]"></div>
        <div className="flex-1 bg-[#008751]"></div>
      </div>

      {/* Main header block */}
      <header className="bg-white border-b border-neutral-200 shadow-sm px-6 py-4 md:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-md cursor-default">
              📊
            </div>
            <div>
              <h1 className="text-lg font-black text-neutral-800 tracking-tight flex items-center gap-2">
                SIM MIRANDA <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md">PORTAL NOMINAL</span>
              </h1>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">
                Dirección Estadal de Salud • Gobierno de Miranda
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100 justify-between sm:justify-end">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 border border-neutral-200">
                <User size={16} />
              </div>
              <div>
                <div className="text-xs font-black text-neutral-700 leading-none truncate max-w-[150px]">
                  {profile?.nombre || 'Usuario Nominal'}
                </div>
                <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                  {profile?.rol || 'nominal'}
                </div>
              </div>
            </div>

            <button
              id="btn-logout"
              onClick={handleLogout}
              className="px-3.5 py-2.5 bg-neutral-50 hover:bg-red-50 text-neutral-500 hover:text-red-500 hover:border-red-200 border border-neutral-200 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-bold"
              title="Cerrar sesión"
            >
              <LogOut size={14} />
              <span className="hidden xs:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hub Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 md:py-16">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-12"
        >
          {/* Welcome and Instructions */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-700 text-[10px] font-black uppercase tracking-widest">
              <LayoutGrid size={12} /> Panel de Transcripción Independiente
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-neutral-800 tracking-tight leading-tight uppercase">
              Módulos de Carga Nominal
            </h2>
            <p className="text-xs text-neutral-500 font-medium leading-relaxed">
              Seleccione la planilla epidemiológica correspondiente. El sistema abrirá un entorno de transcripción dedicado, independiente y optimizado para terminales de alto rendimiento.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Box 1: Quirúrgica */}
            <motion.div
              id="bento-quirurgica"
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              onClick={() => handleOpenForm('QUIRURGICA')}
              className="bg-white p-8 rounded-[2.5rem] border border-neutral-200 shadow-sm hover:shadow-xl hover:border-blue-500/20 transition-all cursor-pointer group flex flex-col justify-between h-[300px]"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <Activity size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-neutral-800 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                    Carga Quirúrgica
                  </h3>
                  <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                    Registro de intervenciones, médicos tratantes, estatus del paciente y diagnósticos de intervenciones programadas o de emergencia.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-emerald-600 group-hover:translate-x-1 transition-transform">
                <span>Abrir Planilla</span>
                <ExternalLink size={14} />
              </div>
            </motion.div>

            {/* Box 2: Obstetricia */}
            <motion.div
              id="bento-obstetricia"
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              onClick={() => handleOpenForm('OBSTETRICIA')}
              className="bg-white p-8 rounded-[2.5rem] border border-neutral-200 shadow-sm hover:shadow-xl hover:border-blue-500/20 transition-all cursor-pointer group flex flex-col justify-between h-[300px]"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 border border-rose-100 group-hover:bg-rose-500 group-hover:text-white transition-all">
                  <HeartPulse size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-neutral-800 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                    Carga Obstetricia
                  </h3>
                  <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                    Control especializado de embarazos, partos de emergencia, cesáreas y reportes institucionales de control materno.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-rose-600 group-hover:translate-x-1 transition-transform">
                <span>Abrir Planilla</span>
                <ExternalLink size={14} />
              </div>
            </motion.div>

            {/* Box 3: Defunción */}
            <motion.div
              id="bento-defuncion"
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              onClick={() => handleOpenForm('DEFUNCION')}
              className="bg-white p-8 rounded-[2.5rem] border border-neutral-200 shadow-sm hover:shadow-xl hover:border-blue-500/20 transition-all cursor-pointer group flex flex-col justify-between h-[300px]"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-500 border border-neutral-200 group-hover:bg-neutral-800 group-hover:text-white transition-all">
                  <FileSpreadsheet size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-neutral-800 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                    Carga Defunciones
                  </h3>
                  <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                    Registro legal, demográfico y epidemiológico de actas de defunción institucionales con justificación de causas directas de fallecimiento.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-neutral-500 group-hover:translate-x-1 transition-transform">
                <span>Abrir Planilla</span>
                <ExternalLink size={14} />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* Footer Info Container */}
      <footer className="py-8 border-t border-neutral-200 bg-white leading-none text-center shrink-0">
        <p className="text-[9px] text-[#0B3D5C] font-black uppercase tracking-[0.25em]">
          GOBIERNO DE MIRANDA • DIRECCIÓN ESTADAL DE SALUD • SIM Miranda 2026
        </p>
      </footer>
    </div>
  );
}
