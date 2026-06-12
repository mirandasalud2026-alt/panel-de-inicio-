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

      </div>
    </div>
  );
}
