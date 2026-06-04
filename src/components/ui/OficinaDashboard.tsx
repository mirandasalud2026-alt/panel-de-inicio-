import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ChevronLeft, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  FileSpreadsheet, 
  Calendar,
  Activity,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import ReporteDiarioTabular from '../admin/ReporteDiarioTabular';

export default function OficinaDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const fetchRecentReports = async () => {
    if (!profile?.id_centro) return;
    setLoadingReports(true);
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('reportes_diarios')
          .select('*')
          .eq('id_centro', profile.id_centro)
          .order('fecha', { ascending: false })
          .limit(10);

        if (!error && data) {
          setRecentReports(data);
          setLoadingReports(false);
          return;
        }
      }
      
      // Fallback local
      const localKey = 'local_bulk_reportes_diarios';
      const localExistentes = JSON.parse(localStorage.getItem(localKey) || '[]');
      const filtrados = localExistentes.filter((r: any) => r.id_centro === profile.id_centro);
      // Agrupar o ordenar por fecha
      setRecentReports(filtrados.slice().reverse().slice(0, 10));
    } catch (err) {
      console.warn('Error al cargar reportes recientes:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (profile?.id_centro) {
      fetchRecentReports();
    }
  }, [profile?.id_centro, showForm]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Clock className="animate-spin text-[#0B3D5C] mr-2" size={24} />
        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Cargando perfil...</span>
      </div>
    );
  }

  // Si no tiene centro asignado, mostrar advertencia
  if (profile && !profile.id_centro) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-900 p-8 rounded-3xl max-w-xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-amber-500" size={28} />
          <h3 className="text-base font-black uppercase tracking-wide">Centro Médico No Asignado</h3>
        </div>
        <p className="text-xs font-semibold leading-relaxed text-amber-800">
          Tu cuenta de usuario está activa pero no tiene una jurisdicción médica asociada (id_centro nulo). 
          Por favor, solicita a un administrador que asigne tu centro de salud desde el Panel General.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Tarjeta Informativa de la Jurisdicción */}
      <div className="bg-gradient-to-r from-[#0B3D5C] to-[#155A8A] text-white p-6 md:p-8 rounded-[2rem] shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10">
          <Building2 size={240} className="stroke-[1]" />
        </div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-[9px] font-black uppercase tracking-widest w-fit">
            📍 Jurisdicción Operativa Asignada
          </div>
          
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">{profile?.nombre_centro || 'Establecimiento Local'}</h2>
            <p className="text-xs text-slate-200 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <span>ASIC: {profile?.asic_centro || 'Eje Territorial Miranda'}</span>
              <span>•</span>
              <span>ID: {profile?.id_centro}</span>
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-extrabold uppercase text-amber-300 pt-2">
            <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full">Rol: {profile?.rol}</span>
            <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full">Estatus: {profile?.estado}</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!showForm ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Cabecera sección */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Historial de Reportes</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Últimos datos reportados por tu centro</p>
              </div>
              <button 
                onClick={() => setShowForm(true)}
                className="bg-[#0B3D5C] hover:bg-[#0A3450] text-white px-5 py-3 rounded-2xl shadow-lg active:scale-95 transition-all text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={15} />
                Nuevo Reporte
              </button>
            </div>

            {/* Listado */}
            {loadingReports ? (
              <div className="flex justify-center py-12">
                <Clock className="animate-spin text-slate-400 mr-2" size={18} />
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargando historial...</span>
              </div>
            ) : recentReports.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 p-8 rounded-3xl text-center space-y-3">
                <FileSpreadsheet className="mx-auto text-slate-300" size={32} />
                <div>
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide">Sin reportes registrados</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Aún no has cargado reportes diarios de consultas o emergencias para este centro.</p>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-1 text-[10px] font-black text-[#0B3D5C] hover:underline uppercase tracking-wider"
                >
                  Comenzar carga aquí <ArrowRight size={12} />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentReports.map((report, idx) => (
                  <motion.div
                    key={report.id || idx}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${
                        report.tipo_formulario === 'RDC' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      }`}>
                        {report.tipo_formulario}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-slate-800 uppercase">
                            {report.tipo_formulario === 'RDC' ? 'Consultas' : 'Emergencias'}
                          </span>
                          <span className="text-[8px] font-extrabold bg-slate-100 text-slate-500 rounded px-1 uppercase tracking-tight">
                            {report.grupo_etario.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                          <Calendar size={10} />
                          {report.fecha}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Ingresados</span>
                      <span className="text-xs font-black text-[#0B3D5C] tracking-wide">
                        M: {report.masculino} | F: {report.femenino}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Recordatorio */}
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-50 text-[#0B3D5C] border border-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle size={18} />
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest">Información Epidemiológica</h5>
                <p className="text-[10.5px] text-slate-500 leading-relaxed font-bold">
                  Recuerde que cada carga transaccional de planillas RDC/REC impacta directamente en el semáforo estatal de reportes y actualiza el estatus de cumplimiento de su ASIC en tiempo real.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="space-y-4"
          >
            {/* Header del Formulario */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowForm(false)}
                className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 hover:text-slate-800 uppercase tracking-widest transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
                Volver al historial
              </button>
              
              <span className="text-[8px] font-extrabold bg-[#0B3D5C]/10 text-[#0B3D5C] px-3 py-1 rounded-full uppercase tracking-wider">
                RDC (Consultas) / REC (Emergencias)
              </span>
            </div>

            {/* Componente Formulario */}
            <ReporteDiarioTabular 
              idCentro={profile.id_centro} 
              onSuccess={() => {
                setTimeout(() => {
                  setShowForm(false);
                }, 1500);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
