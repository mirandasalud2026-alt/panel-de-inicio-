// src/components/ui/NominalDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  HeartPulse, 
  FileSpreadsheet, 
  LogOut, 
  User, 
  Sparkles, 
  ClipboardList, 
  AlertCircle,
  Clock,
  ExternalLink,
  BarChart3
} from 'lucide-react';
import { schemaService } from '../../services/schemaService';
import { pipelineService } from '../../services/pipelineService';
import { ConfiguracionModulo } from '../../types/admin';
import { DynamicForm } from '../DynamicForm';
import AnalyticsEngine from './AnalyticsEngine';
import MiFichaPersonal from './MiFichaPersonal';
import { motion } from 'motion/react';

export default function NominalDashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'carga' | 'analisis' | 'ficha'>('carga');

  const [assignedModules, setAssignedModules] = useState<ConfiguracionModulo[]>([]);
  const [selectedModule, setSelectedModule] = useState<ConfiguracionModulo | null>(null);
  const [recentClaims, setRecentClaims] = useState<any[]>([]);

  // Automatically restrict active tab if not fully approved
  useEffect(() => {
    if (profile && profile.estado !== 'aprobado' && profile.rol !== 'admin') {
      setActiveTab('ficha');
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.email) {
      loadAssignedForms();
    }
    loadRecentActivity();
  }, [profile]);

  const loadAssignedForms = () => {
    if (!profile?.email) return;
    
    // Cargar todos los módulos dinámicos configurados
    const allModules = schemaService.getDynamicModules();
    
    // Cargar mapas de asignaciones del correo del usuario
    const savedAssignments = localStorage.getItem(`assigned_modules_user_${profile.email.toLowerCase()}`);
    const assignedIds: string[] = savedAssignments ? JSON.parse(savedAssignments) : [];
    
    // Filtrar los módulos que coincidan con la lista asignada
    const filtered = allModules.filter(m => assignedIds.includes(m.id));
    setAssignedModules(filtered);
  };

  const loadRecentActivity = () => {
    // Cargar logs locales recientes
    const logs = localStorage.getItem('s_admin_google_sheets_sync');
    setRecentClaims(logs ? JSON.parse(logs).slice(0, 5) : []);
  };

  const openStaticForm = (type: 'QUIRURGICA' | 'OBSTETRICA' | 'DEFUNCION') => {
    const emailParam = user?.email ? encodeURIComponent(user.email) : '';
    navigate(`/nominal-form?type=${type}&email=${emailParam}`);
  };

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
                Dirección Estadal de Salud • Portal de Carga Nominal
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[11px] font-black uppercase text-[#FFD700]">Carga Autorizada por el MPPS</p>
              <p className="text-[9px] text-slate-300 font-mono mt-0.5">{profile?.nombre || 'Operador'} • Rol: {profile?.rol || 'nominal'}</p>
              <p className="text-[8px] text-slate-400 font-mono italic">{profile?.email}</p>
            </div>
            
            <button 
              onClick={signOut} 
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 pb-24 space-y-8">
        
        {/* INTERACTIVE VIEW MODE SWITCHER */}
        <div className="flex justify-start bg-slate-100 p-1 rounded-2xl border border-slate-200 w-fit">
          <button
            onClick={() => {
              if (profile?.estado === 'aprobado' || profile?.rol === 'admin') {
                setActiveTab('carga');
              }
            }}
            disabled={profile?.estado !== 'aprobado' && profile?.rol !== 'admin'}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all ${
              profile?.estado !== 'aprobado' && profile?.rol !== 'admin'
                ? 'opacity-50 cursor-not-allowed text-slate-400' 
                : 'cursor-pointer'
            } ${
              activeTab === 'carga' 
                ? 'bg-[#0B3D5C] text-white shadow-xs' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {profile?.estado !== 'aprobado' && profile?.rol !== 'admin' && <span className="mr-0.5">🔒</span>} Cargar Planillas
          </button>
          <button
            onClick={() => {
              if (profile?.estado === 'aprobado' || profile?.rol === 'admin') {
                setActiveTab('analisis');
              }
            }}
            disabled={profile?.estado !== 'aprobado' && profile?.rol !== 'admin'}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all ${
              profile?.estado !== 'aprobado' && profile?.rol !== 'admin'
                ? 'opacity-50 cursor-not-allowed text-slate-400' 
                : 'cursor-pointer'
            } ${
              activeTab === 'analisis' 
                ? 'bg-[#0B3D5C] text-white shadow-xs' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {profile?.estado !== 'aprobado' && profile?.rol !== 'admin' && <span className="mr-0.5">🔒</span>} <BarChart3 size={14} /> Sala de Análisis
          </button>
          <button
            onClick={() => setActiveTab('ficha')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'ficha' 
                ? 'bg-[#0B3D5C] text-white shadow-xs' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <User size={13} /> Mi Ficha de Personal
          </button>
        </div>

        {profile?.estado !== 'aprobado' && profile?.rol !== 'admin' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-3xl p-5 mb-2 text-center shadow-xs">
            <h3 className="text-sm font-black uppercase tracking-wider text-amber-850 flex items-center justify-center gap-2 font-display">
              ⚠️ Acceso Restringido - Cuenta Pendiente de Aprobación
            </h3>
            <p className="text-[10px] font-bold max-w-2xl mx-auto leading-relaxed mt-2 uppercase">
              Usted tiene acceso exclusivo de lectura y edición de su Ficha de Personal. Sin embargo, para realizar atenciones nominales o acceder a la Sala de Análisis, un Administrador de la Dirección Estadal de Salud debe habilitar y asignarle el Establecimiento en el Panel de Control.
            </p>
          </div>
        )}

        {activeTab === 'analisis' ? (
          <AnalyticsEngine />
        ) : activeTab === 'ficha' ? (
          <MiFichaPersonal />
        ) : (
          <>
            {/* BANNER IDENTIDAD DEL OPERADOR */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#0B3D5C]/10 text-[#0B3D5C] rounded-2xl flex items-center justify-center font-display text-lg font-black uppercase">
              {profile?.nombre ? profile.nombre.charAt(0) : 'U'}
            </div>
            <div>
              <h3 className="text-base font-black text-[#0B3D5C] uppercase tracking-tight font-display">
                ¡Bienvenido al Portal de Carga, {profile?.nombre || 'Operador'}!
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                Utiliza las siguientes planillas certificadas para reportar las atenciones diarias.
              </p>
            </div>
          </div>
          
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-150 border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-550 bg-emerald-500 animate-pulse"></span> Sistema de Registro Activo
            </span>
          </div>
        </div>

        {/* REPORTE NOMINAL MAESTRO */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#0B3D5C] border-b border-slate-200 pb-2">
            📋 Reportes Matriz (Estáticos del Sistema)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button 
              onClick={() => openStaticForm('QUIRURGICA')} 
              className="bg-white p-6 rounded-3xl shadow-xs text-left hover:shadow-md transition-all border border-slate-200 flex flex-col justify-between h-[180px] hover:-translate-y-0.5 cursor-pointer"
            >
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit">
                <Activity size={24} />
              </div>
              <div>
                <span className="px-2 py-0.5 rounded text-[8.5px] font-black bg-blue-50 text-blue-700 uppercase tracking-widest block w-fit mb-1">Criterio Quirúrgico</span>
                <h2 className="font-black text-slate-800 text-sm uppercase">Carga Quirúrgica</h2>
                <p className="text-[10px] text-slate-410 text-slate-400 mt-1">Intervenciones y procedimientos programados</p>
              </div>
            </button>

            <button 
              onClick={() => openStaticForm('OBSTETRICA')} 
              className="bg-white p-6 rounded-3xl shadow-xs text-left hover:shadow-md transition-all border border-slate-200 flex flex-col justify-between h-[180px] hover:-translate-y-0.5 cursor-pointer"
            >
              <div className="p-3 bg-pink-50 text-pink-600 rounded-2xl w-fit">
                <HeartPulse size={24} />
              </div>
              <div>
                <span className="px-2 py-0.5 rounded text-[8.5px] font-black bg-pink-50 text-pink-700 uppercase tracking-widest block w-fit mb-1">Plan Natal Regional</span>
                <h2 className="font-black text-slate-800 text-sm uppercase">Nómina Obstétrica</h2>
                <p className="text-[10px] text-slate-410 text-slate-400 mt-1">Partos, cesáreas y atenciones neonatales</p>
              </div>
            </button>

            <button 
              onClick={() => openStaticForm('DEFUNCION')} 
              className="bg-white p-6 rounded-3xl shadow-xs text-left hover:shadow-md transition-all border border-slate-200 flex flex-col justify-between h-[180px] hover:-translate-y-0.5 cursor-pointer"
            >
              <div className="p-3 bg-slate-50 text-slate-650 text-slate-600 rounded-2xl w-fit">
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <span className="px-2 py-0.5 rounded text-[8.5px] font-black bg-slate-100 text-slate-700 uppercase tracking-widest block w-fit mb-1">Mortalidad</span>
                <h2 className="font-black text-slate-800 text-sm uppercase">Defunciones</h2>
                <p className="text-[10px] text-slate-410 text-slate-400 mt-1">Certificación y causas clínicas de decesos</p>
              </div>
            </button>
          </div>
        </div>

        {/* REPORTE DINÁMICO ASIGNADO COGNITIVAMENTE */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
            <Sparkles size={14} className="text-blue-600" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">
              🚰 Reportes Especiales Asignados (Data-Driven)
            </h3>
          </div>

          {assignedModules.length === 0 ? (
            <div className="bg-slate-100/50 rounded-3xl border border-slate-200 p-10 text-center text-slate-400 italic text-xs font-semibold leading-relaxed max-w-lg">
              <ClipboardList size={28} className="mx-auto mb-3 text-slate-350" />
              <span>No tienes formularios dinámicos especiales asignados a tu cuenta por ahora.</span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-2">Visita al administrador si requieres carga adicional para tu ASIC (Ej: Registro fallas de Agua).</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {assignedModules.map(m => (
                <button 
                  key={m.id}
                  onClick={() => {
                    setSelectedModule(m);
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                  }}
                  className={`bg-white p-6 rounded-3xl shadow-xs text-left hover:shadow-md transition-all border ${
                    selectedModule?.id === m.id ? 'border-blue-500 ring-2 ring-blue-500/15' : 'border-slate-200'
                  } flex flex-col justify-between h-[180px] hover:-translate-y-0.5 cursor-pointer`}
                >
                  <div className="p-3 bg-blue-50 text-blue-600 font-display rounded-2xl w-fit text-xl">
                    {m.meta_datos.icono || '📋'}
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded text-[8.5px] font-black bg-blue-100 text-blue-800 uppercase tracking-widest block w-fit mb-1">Dynamic SSPA Form</span>
                    <h2 className="font-black text-slate-800 text-sm uppercase">{m.meta_datos.tabla_nombre}</h2>
                    <p className="text-[10px] text-slate-410 text-slate-400 mt-1 line-clamp-2">{m.meta_datos.descripcion}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CARGA ACTIVA DEL FORMULARIO COGNITIVO */}
        {selectedModule && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 max-w-2xl"
          >
            <div className="flex justify-between items-center bg-slate-100 px-4 py-2 rounded-2xl border">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ejecución del Reporte Especial</span>
              <button 
                onClick={() => setSelectedModule(null)}
                className="text-xs font-black text-rose-500 hover:text-rose-700 uppercase"
              >
                cerrar planilla ×
              </button>
            </div>
            
            <DynamicForm 
              config={selectedModule}
              onSubmit={async (datos) => {
                const res = await pipelineService.procesarRegistro(selectedModule, datos);
                if (res.success) {
                  loadRecentActivity();
                }
              }}
            />
          </motion.div>
        )}

        {/* ACTIVIDAD RECIENTE */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 max-w-2xl">
          <h4 className="text-xs font-black uppercase tracking-widest text-[#0B3D5C] border-b border-slate-100 pb-2">
            🕒 Tu Historial Reciente de Envíos SSPA
          </h4>

          {recentClaims.length === 0 ? (
            <p className="text-[10.5px] text-slate-400 italic">No tienes envíos registrados en esta terminal.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentClaims.map((claim, index) => (
                <div key={index} className="py-2.5 flex items-center justify-between text-xs font-semibold">
                  <div>
                    <span className="font-mono text-blue-600 block lowercase">{claim.tabla}</span>
                    <span className="text-[8.4px] text-slate-400 font-mono tracking-tight block mt-1">{new Date(claim.fijo_fecha).toLocaleTimeString()} • ID: {claim.id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 font-mono block">Espejo Google Sheets</span>
                    <span className="text-green-600 block text-[9px] uppercase font-black">Espejo Completo ✓</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </>
    )}
  </div>
</div>
  );
}
