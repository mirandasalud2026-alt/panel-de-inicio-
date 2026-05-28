'use client';

import React, { useState, useEffect, useCallback } from 'react';
import NominalForms from './components/NominalForms';
import NominalIframeWidget from './components/NominalIframeWidget';
import GoogleScriptFormsTabs from './components/GoogleScriptFormsTabs';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Send,
  Calendar,
  Layers,
  ChevronRight,
  Database,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Activity,
  Baby,
  Skull,
  FileCheck,
  ShieldAlert,
  Download
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Inicializar cliente de Supabase
const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, anonKey);
};

export default function AdminIntegrationDemo() {
  const [activeTab, setActiveTab] = useState<'quirurgica' | 'obstetrica' | 'defuncion' | 'drive_jobs'>('quirurgica');
  const [showFormModal, setShowFormModal] = useState(false);
  const [formSource, setFormSource] = useState<'integrated' | 'google_script'>('integrated');
  
  // Contadores vivos para las 4 tablas
  const [counts, setCounts] = useState({
    quirurgica: 0,
    obstetrica: 0,
    defuncion: 0,
    nominales: 0
  });
  
  const [loadingCounts, setLoadingCounts] = useState(false);

  // Función para consultar los totales en Supabase
  const refreshingCounts = useCallback(async () => {
    setLoadingCounts(true);
    try {
      const supabase = getSupabaseClient();
      
      const [qRes, oRes, dRes, nRes] = await Promise.all([
        supabase.from('registros_quirurgicos').select('*', { count: 'exact', head: true }),
        supabase.from('registros_obstetricos').select('*', { count: 'exact', head: true }),
        supabase.from('registros_defunciones').select('*', { count: 'exact', head: true }),
        supabase.from('nominales').select('*', { count: 'exact', head: true })
      ]);

      setCounts({
        quirurgica: qRes.count || 0,
        obstetrica: oRes.count || 0,
        defuncion: dRes.count || 0,
        nominales: nRes.count || 0
      });
    } catch (err) {
      console.error("Error consultando contadores de registros:", err);
    } finally {
      setLoadingCounts(false);
    }
  }, []);

  // Cargar contadores iniciales al iniciar
  useEffect(() => {
    refreshingCounts();
  }, [refreshingCounts]);

  // Callback ejecutado tras guardar exitosamente una nueva ficha desde NominalForms
  const handleRecordSaved = (tipo: 'quirurgica' | 'obstetrica' | 'defuncion') => {
    // Incrementar en caliente
    setCounts(prev => ({
      ...prev,
      [tipo]: prev[tipo] + 1,
      nominales: prev.nominales + 1
    }));
    // Re-verificar contra Supabase
    refreshingCounts();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans relative">
      
      {/* SECCIÓN BANNER SUPERIOR INSTITUCIONAL */}
      <div className="bg-[#0B3D5C] text-white p-6 md:p-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-[#0B3D5C] text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              ZONA DE CONTROL NOMINAL SALUD MUNICIPAL 2026
            </span>
            {loadingCounts && (
              <span className="text-[9.5px] font-bold text-amber-300 animate-pulse flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin inline" /> Actualizando contadores...
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight mt-2">Mando Unificado Miranda Salud</h1>
          <p className="text-xs text-slate-300 font-medium max-w-2xl mt-1">
            Administración centralizada de expedientes clínicos y resguardo transaccional. Sincronización íntegra vía Supabase y resguardo automático en Google Drive.
          </p>
        </div>

        {/* ACCIONES Y MENÚ DE CONTROL SUPERIOR */}
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-stretch sm:items-center">
          {/* Botón Cargar Nuevo Registro (Modal) */}
          <button
            onClick={() => setShowFormModal(true)}
            className="px-5 py-3.5 bg-amber-400 hover:bg-amber-500 text-[#0B3D5C] font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>+ Nuevo Registro</span>
          </button>

          <div className="flex flex-wrap gap-1.5 bg-black/20 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('quirurgica')}
              className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'quirurgica' ? 'bg-white text-[#0B3D5C] shadow-md' : 'text-white hover:bg-white/10'
              }`}
            >
              <Activity size={12} />
              Quirúrgica ({counts.quirurgica})
            </button>
            
            <button
              onClick={() => setActiveTab('obstetrica')}
              className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'obstetrica' ? 'bg-white text-[#0B3D5C] shadow-md' : 'text-white hover:bg-white/10'
              }`}
            >
              <Baby size={12} />
              Obstétrica ({counts.obstetrica})
            </button>

            <button
              onClick={() => setActiveTab('defuncion')}
              className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'defuncion' ? 'bg-white text-[#0B3D5C] shadow-md' : 'text-white hover:bg-white/10'
              }`}
            >
              <Skull size={12} />
              Defunción ({counts.defuncion})
            </button>

            <button
              onClick={() => setActiveTab('drive_jobs')}
              className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'drive_jobs' ? 'bg-white text-[#0B3D5C] shadow-md' : 'text-white hover:bg-white/10'
              }`}
            >
              <FileSpreadsheet size={12} />
              Respaldo e Informes
            </button>
          </div>
        </div>
      </div>

      {/* COMPONENTES INDICADORES DE CONTEO EN MINI TABLERO */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 mt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => setActiveTab('quirurgica')}
            className={`cursor-pointer p-4 rounded-2xl border text-left shadow-sm flex items-center justify-between transition-all ${
              activeTab === 'quirurgica' ? 'bg-indigo-50/55 border-indigo-200 ring-2 ring-indigo-600/10' : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#0B3D5C]">Nominal Quirúrgica</span>
              <h4 className="text-xl font-extrabold text-[#0B3D5C]">({counts.quirurgica})</h4>
            </div>
            <div className="w-10 h-10 bg-slate-50 text-[#0B3D5C] rounded-xl flex items-center justify-center border border-slate-100">
              <Activity size={18} />
            </div>
          </button>

          <button 
            onClick={() => setActiveTab('obstetrica')}
            className={`cursor-pointer p-4 rounded-2xl border text-left shadow-sm flex items-center justify-between transition-all ${
              activeTab === 'obstetrica' ? 'bg-pink-50/40 border-pink-200 ring-2 ring-pink-600/10' : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-pink-500">Nómina Obstétrica</span>
              <h4 className="text-xl font-extrabold text-pink-700">({counts.obstetrica})</h4>
            </div>
            <div className="w-10 h-10 bg-pink-50/50 text-pink-600 rounded-xl flex items-center justify-center border border-pink-100">
              <Baby size={18} />
            </div>
          </button>

          <button
            onClick={() => setActiveTab('defuncion')}
            className={`cursor-pointer p-4 rounded-2xl border text-left shadow-sm flex items-center justify-between transition-all ${
              activeTab === 'defuncion' ? 'bg-rose-50/40 border-rose-200 ring-2 ring-rose-600/10' : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-500">Nómina Defunción</span>
              <h4 className="text-xl font-extrabold text-rose-700">({counts.defuncion})</h4>
            </div>
            <div className="w-10 h-10 bg-rose-50/50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100">
              <Skull size={18} />
            </div>
          </button>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1 flex items-start justify-between w-full">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#0B3D5C]">Bitácora Nominales <b className="text-[8px] text-slate-400 italic">Hist. 7dias</b></span>
                <h4 className="text-xl font-extrabold text-indigo-950">({counts.nominales})</h4>
              </div>
              <button 
                onClick={refreshingCounts}
                title="Sincronizar totales vivos de Supabase"
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <RefreshCw size={14} className={loadingCounts ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO DE ZONA PRINCIPAL INTERACTIVA */}
      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
        
        {/* LISTADOS DE EACH APARTADO EN EL MANDO UNIFICADO */}
        {activeTab === 'quirurgica' && (
          <RecordsViewerTable key="quirurgica-tbl" table="registros_quirurgicos" onRecordsModified={refreshingCounts} />
        )}

        {activeTab === 'obstetrica' && (
          <RecordsViewerTable key="obstetrica-tbl" table="registros_obstetricos" onRecordsModified={refreshingCounts} />
        )}

        {activeTab === 'defuncion' && (
          <RecordsViewerTable key="defuncion-tbl" table="registros_defunciones" onRecordsModified={refreshingCounts} />
        )}

        {/* MODULO DRIVE RESPALDO Y PURGA MANUAL DE 7 DIAS (Tab drive_jobs) */}
        {activeTab === 'drive_jobs' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Respaldo a Drive */}
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-2">
                <h2 className="text-lg font-black text-[#0B3D5C] uppercase tracking-wide">Módulo de Sincronización e Informes</h2>
                <p className="text-xs text-slate-400">Genere archivos Excel empaquetados e integrados para ser transmitidos de forma segura al repositorio institucional.</p>
              </div>

              <DriveReportGenerator />
            </div>

            {/* Módulo Depuración Manual Purgas 7 Días */}
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-2">
                <h2 className="text-lg font-black text-rose-800 uppercase tracking-wide">Saneamiento y Depuración Nominal</h2>
                <p className="text-xs text-slate-400">Gestione la higiene de la base de datos eliminando registros redundantes que superen el periodo de auditoría temporal (7 días).</p>
              </div>

              <ManualPurgeModule onPurged={refreshingCounts} />
            </div>

          </div>
        )}
      </main>

      {/* MODAL MODERNO REFORZADO PARA NUEVO REGISTRO CLÍNICO NOMINAL */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 overflow-y-auto flex items-center justify-center p-4 backdrop-blur-md transition-all duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 w-full max-w-5xl overflow-hidden relative flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#0B3D5C] text-white px-6 py-4 flex items-center justify-between border-b border-slate-200 shadow-sm">
              <div>
                <span className="text-[9px] font-black uppercase text-amber-300 tracking-wider block">Sincronizador Miranda Salud</span>
                <h3 className="text-sm font-black uppercase tracking-tight mt-0.5">
                  Nueva Ficha: {activeTab === 'quirurgica' ? 'NOMINAL-QUIRÚRGICA' : activeTab === 'obstetrica' ? 'NÓMINA OBSTÉTRICA' : activeTab === 'defuncion' ? 'NÓMINA DEFUNCIÓN' : 'FICHA MUNICIPAL'}
                </h3>
              </div>
              <button 
                onClick={() => setShowFormModal(false)}
                className="text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Cerrar ✕
              </button>
            </div>

            {/* Selector de Origen de Formulario (Integrado vs. Google Apps Script) */}
            <div className="bg-slate-100 p-1.5 rounded-2xl mx-6 md:mx-8 mt-5 border border-slate-200/60 flex items-center gap-1.5 shadow-sm shrink-0">
              <button
                onClick={() => setFormSource('integrated')}
                className={`flex-1 py-3 px-4 rounded-xl text-[9.5px] font-black uppercase tracking-widest transition-all duration-205 cursor-pointer ${
                  formSource === 'integrated' 
                    ? 'bg-[#0B3D5C] text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                Formulario Integrado (Supabase)
              </button>
              <button
                onClick={() => setFormSource('google_script')}
                className={`flex-1 py-3 px-4 rounded-xl text-[9.5px] font-black uppercase tracking-widest transition-all duration-205 cursor-pointer ${
                  formSource === 'google_script' 
                    ? 'bg-[#0B3D5C] text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                Formulario Google Apps Script (Hojas de Google)
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-slate-50/40">
              {formSource === 'integrated' ? (
                <NominalForms 
                  activeTab={
                    activeTab === 'quirurgica' ? 'quirurgica' : 
                    activeTab === 'obstetrica' ? 'obstetrica' : 
                    activeTab === 'defuncion' ? 'defuncion' : 'quirurgica'
                  }
                  onRecordSaved={(tipo) => {
                    handleRecordSaved(tipo);
                    setShowFormModal(false);
                  }} 
                />
              ) : (
                <div className="space-y-4">
                  <NominalIframeWidget
                    formType={
                      activeTab === 'quirurgica' ? 'quirurgica' : 
                      activeTab === 'obstetrica' ? 'obstetrica' : 
                      activeTab === 'defuncion' ? 'defuncion' : 'quirurgica'
                    }
                    height="580px"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// TABLA RESPONSIVA DE REGISTROS CON BÚSQUEDA FLUIDA Y ELIMINACIÓN REAL EN SUPABASE
// =========================================================================
function RecordsViewerTable({ 
  onRecordsModified, 
  table 
}: { 
  onRecordsModified: () => void; 
  table?: 'registros_quirurgicos' | 'registros_obstetricos' | 'registros_defunciones' | 'nominales'; 
  key?: string;
}) {
  const [selectedTable, setSelectedTable] = useState<'registros_quirurgicos' | 'registros_obstetricos' | 'registros_defunciones' | 'nominales'>(table || 'registros_quirurgicos');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (table) {
      setSelectedTable(table);
    }
  }, [table]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 8;
  const [totalCount, setTotalCount] = useState(0);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);

  // Consultar registros paginados desde Supabase
  const loadRecords = useCallback(async () => {
    setLoading(true);
    setDeleteStatus(null);
    try {
      const supabase = getSupabaseClient();
      let query = supabase.from(selectedTable).select('*', { count: 'exact' });

      // Aplicar filtros de búsqueda por Cédula, Nombre o Centro de Salud
      const term = searchQuery.trim().toUpperCase();
      if (term) {
        if (selectedTable === 'registros_quirurgicos') {
          query = query.or(`cedula_paciente.ilike.%${term}%,nombre_paciente.ilike.%${term}%,apellido_paciente.ilike.%${term}%,centro_salud.ilike.%${term}%`);
        } else if (selectedTable === 'registros_obstetricos') {
          query = query.or(`cedula_madre.ilike.%${term}%,nombre_madre.ilike.%${term}%,apellido_madre.ilike.%${term}%,centro_salud.ilike.%${term}%`);
        } else if (selectedTable === 'registros_defunciones') {
          query = query.or(`cedula_fallecido.ilike.%${term}%,nombre_fallecido.ilike.%${term}%,apellido_fallecido.ilike.%${term}%,centro_salud.ilike.%${term}%`);
        } else if (selectedTable === 'nominales') {
          query = query.or(`cedula_principal.ilike.%${term}%,centro_salud.ilike.%${term}%`);
        }
      }

      // Ordenar por ID descendente
      const from = currentPage * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, count, error } = await query
        .order('id', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setItems(data || []);
      setTotalCount(count || 0);

    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedTable, searchQuery, currentPage]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Restablecer página al cambiar de tabla o filtro
  const handleTableChange = (table: 'registros_quirurgicos' | 'registros_obstetricos' | 'registros_defunciones' | 'nominales') => {
    setSelectedTable(table);
    setSearchQuery('');
    setCurrentPage(0);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    loadRecords();
  };

  // Acción para eliminar un registro clínico directamente de Supabase
  const handleDeleteRow = async (id: number) => {
    if (!confirm('¿Está completamente seguro de que desea eliminar permanentemente este registro clínico de la base de datos de Miranda Salud? Esta acción no se puede deshacer.')) return;
    
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from(selectedTable)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDeleteStatus(`✓ Registro con ID #${id} eliminado correctamente del sistema.`);
      // Si el elemento es borrado, actualizar listado y contadores del componente padre dashboard
      loadRecords();
      onRecordsModified();
    } catch (err: any) {
      console.error(err);
      setDeleteStatus(`Error al eliminar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 space-y-6">
      
      {/* Selector de tipo de lista */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-sm font-black text-[#0B3D5C] uppercase tracking-wide flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-500" /> 
            {selectedTable === 'registros_quirurgicos' && 'Visor Nominal Quirúrgico Centralizado'}
            {selectedTable === 'registros_obstetricos' && 'Visor Nominal Obstétrico Centralizado'}
            {selectedTable === 'registros_defunciones' && 'Visor Nominal de Defunciones Centralizado'}
            {selectedTable === 'nominales' && 'Bitácora Nominal Histórica (7 días)'}
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Mostrando registros guardados en vivo</p>
        </div>

        {/* Pestañas de Visualización de Listas */}
        {!table && (
          <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-100 w-full md:w-auto">
            {(['registros_quirurgicos', 'registros_obstetricos', 'registros_defunciones', 'nominales'] as const).map((tbl) => (
              <button
                key={tbl}
                onClick={() => handleTableChange(tbl)}
                className={`px-3 py-2 rounded-lg text-[9.5px] font-black uppercase tracking-wider cursor-pointer ${
                  selectedTable === tbl 
                    ? 'bg-[#0B3D5C] text-white' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-150'
                }`}
              >
                {tbl === 'registros_quirurgicos' && 'Quirúrgicas'}
                {tbl === 'registros_obstetricos' && 'Obstétricas'}
                {tbl === 'registros_defunciones' && 'Defunciones'}
                {tbl === 'nominales' && 'Bitácora'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Buscador de registros por campos de texto de pacientes o centro medico */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por Cédula, Nombres, Apellidos o Establecimiento de Salud..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-[#0B3D5C]"
          />
          <button type="submit" className="absolute right-3.5 top-3 text-[#0B3D5C]">
            <Search size={16} />
          </button>
        </div>
        <button
          type="submit"
          className="px-5 py-3 bg-[#0B3D5C] hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
        >
          Filtrar
        </button>
      </form>

      {/* Alerta de borrado */}
      {deleteStatus && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-[10px] uppercase font-black tracking-wider border border-emerald-100 rounded-xl">
          {deleteStatus}
        </div>
      )}

      {/* Listas según la tabla seleccionada */}
      <div className="overflow-x-auto rounded-xl border border-slate-150">
        <table className="w-full text-xs text-left text-slate-700">
          <thead className="text-[9.5px] uppercase font-black text-[#0B3D5C] bg-slate-50 border-b border-slate-150">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Establecimiento</th>
              {selectedTable === 'registros_quirurgicos' && (
                <>
                  <th className="px-4 py-3">Cédula</th>
                  <th className="px-4 py-3">Paciente</th>
                  <th className="px-4 py-3">Especialidad/Tipo</th>
                  <th className="px-4 py-3">Urg/Elec</th>
                </>
              )}
              {selectedTable === 'registros_obstetricos' && (
                <>
                  <th className="px-4 py-3">Cédula Madre</th>
                  <th className="px-4 py-3">Madre</th>
                  <th className="px-4 py-3">Neonato</th>
                  <th className="px-4 py-3">Tipo Parto</th>
                </>
              )}
              {selectedTable === 'registros_defunciones' && (
                <>
                  <th className="px-4 py-3">Cédula Fallecido</th>
                  <th className="px-4 py-3">Fallecido</th>
                  <th className="px-4 py-3">Patología / Causa</th>
                  <th className="px-4 py-3">Hora</th>
                </>
              )}
              {selectedTable === 'nominales' && (
                <>
                  <th className="px-4 py-3">Tipo Mov</th>
                  <th className="px-4 py-3">Cédula Clave</th>
                  <th className="px-4 py-3">Payload (JSON)</th>
                </>
              )}
              <th className="px-4 py-3 text-right">Controles</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center py-8 text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0B3D5C]" />
                  Consultando registros Supabase...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-8 text-slate-400 font-medium">
                  No se encontraron fichas guardadas que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-black text-[#0B3D5C]">#{item.id}</td>
                  <td className="px-4 py-3 font-semibold whitespace-nowrap">{item.fecha || item.fecha_creacion?.split('T')[0]}</td>
                  <td className="px-4 py-3 uppercase font-bold text-[10px] max-w-[150px] truncate" title={item.centro_salud}>{item.centro_salud}</td>
                  
                  {/* Vista Condicional de Quirúrgicos */}
                  {selectedTable === 'registros_quirurgicos' && (
                    <>
                      <td className="px-4 py-3 font-semibold text-slate-500 whitespace-nowrap">{item.cedula_paciente}</td>
                      <td className="px-4 py-3 uppercase font-black whitespace-nowrap">{item.nombre_paciente} {item.apellido_paciente}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold uppercase text-[9.5px] text-[#0B3D5C]">{item.especialidad_quirurgica}</div>
                        <div className="text-[10px] text-slate-400 font-medium truncate max-w-[180px]">{item.tipo_intervencion}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[8.5px] font-black tracking-wide ${
                          item.urgente_electiva === 'URGENTE' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {item.urgente_electiva}
                        </span>
                      </td>
                    </>
                  )}

                  {/* Vista Condicional de Obstétricos */}
                  {selectedTable === 'registros_obstetricos' && (
                    <>
                      <td className="px-4 py-3 font-semibold text-slate-500 whitespace-nowrap">{item.cedula_madre}</td>
                      <td className="px-4 py-3 uppercase font-black whitespace-nowrap">{item.nombre_madre} {item.apellido_madre}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold uppercase text-[9.5px] text-[#0B3D5C]">{item.nombre_infante}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{item.sexo_infante || 'NO SPEC'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[8.5px] font-black bg-pink-50 text-pink-700 border border-pink-100">
                          {item.tipo_parto} / {item.tipo_intervencion || 'NATURAL'}
                        </span>
                      </td>
                    </>
                  )}

                  {/* Vista Condicional de Defunciones */}
                  {selectedTable === 'registros_defunciones' && (
                    <>
                      <td className="px-4 py-3 font-semibold text-slate-500 whitespace-nowrap">{item.cedula_fallecido || 'NO POSEE'}</td>
                      <td className="px-4 py-3 uppercase font-black whitespace-nowrap">{item.nombre_fallecido} {item.apellido_fallecido}</td>
                      <td className="px-4 py-3 max-w-[150px] truncate font-bold text-[9px] uppercase tracking-wide text-rose-950" title={item.patologia}>{item.patologia}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{item.hora_fallecimiento}</td>
                    </>
                  )}

                  {/* Vista Condicional de Bitacora Nominales */}
                  {selectedTable === 'nominales' && (
                    <>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase ${
                          item.tipo_registro === 'quirurgica' ? 'bg-indigo-100 text-indigo-700' :
                          item.tipo_registro === 'obstetrica' ? 'bg-pink-105 bg-pink-100 text-pink-700' : 'bg-stone-100 text-stone-700'
                        }`}>
                          {item.tipo_registro}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">{item.cedula_principal}</td>
                      <td className="px-4 py-3">
                        <div className="text-[8.5px] font-mono text-slate-500 max-w-[200px] truncate bg-slate-50 p-1.5 rounded border border-slate-100">
                          {JSON.stringify(item.datos)}
                        </div>
                      </td>
                    </>
                  )}

                  {/* Botones de acción directos */}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleDeleteRow(item.id)}
                      className="p-1 px-2.5 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg text-[9px] font-bold uppercase transition-all inline-flex items-center gap-1 cursor-pointer"
                      title="Eliminar registro permanentemente"
                    >
                      <Trash2 size={11} /> Borrar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="text-[10px] text-slate-400 font-bold uppercase">
            Mostrando página {currentPage + 1} de {totalPages} ({totalCount} registros en total)
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="p-2 border border-slate-200 text-[#0B3D5C] disabled:text-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage >= totalPages - 1}
              className="p-2 border border-slate-200 text-[#0B3D5C] disabled:text-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ChevronRightIcon size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// =========================================================================
// COMPONENTE AUXILIAR INDEPENDIENTE PARA GENERAR EL REPORTE EN EXCEL (DRIVE REPORTE)
// =========================================================================
function DriveReportGenerator() {
  const [tabla, setTabla] = useState('nominales');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string; details?: any } | null>(null);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch('/api/generar-reporte', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tabla,
          fecha_inicio: fechaInicio || undefined,
          fecha_fin: fechaFin || undefined
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || 'Error en la petición de compilación Excel.');
      }

      setStatus({
        type: 'success',
        text: `¡REPORTE GENERADO CON ÉXITO!`,
        details: resData
      });

    } catch (err: any) {
      console.error(err);
      setStatus({
        type: 'error',
        text: err.message || 'Fallo de comunicación con el endpoint de Google Drive/Next API. Revise variables de entorno u OAuth.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
      
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="w-12 h-12 bg-slate-50 border border-slate-250 text-indigo-900 rounded-2xl flex items-center justify-center">
          <FileSpreadsheet size={24} />
        </div>
        <div>
          <h3 className="text-sm font-black text-[#0B3D5C] uppercase tracking-wide">Compilar Excel hacia Google Drive</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ID Carpeta: 19RTGSwQuisCSr1YLZrZX6ezngQ_69Mhv</p>
        </div>
      </div>

      <form onSubmit={handleGenerateReport} className="space-y-4">
        
        {/* Selector de Tabla */}
        <div>
          <label className="text-[9px] font-black text-[#0B3D5C] uppercase tracking-widest block mb-1.5">
            <Layers className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> Selección de Tabla de Datos *
          </label>
          <select
            value={tabla}
            onChange={(e) => setTabla(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-[#0B3D5C] focus:outline-none focus:border-[#0B3D5C]"
          >
            <option value="nominales">TABLA DE NOMINALES (BITÁCORA TOTAL CON JSON EXPANDIDO)</option>
            <option value="registros_quirurgicos">REGISTROS CLÍNICOS: NOMINALES QUIRÚRGICAS</option>
            <option value="registros_obstetricos">REGISTROS CLÍNICOS: NÓMINA OBSTÉTRICA</option>
            <option value="registros_defunciones">REGISTROS CLÍNICOS: NÓMINA DE DETALLES DE DEFUNCIÓN</option>
          </select>
        </div>

        {/* Rango de Fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
              <Calendar className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> Filtrar desde Fecha
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
              <Calendar className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> Filtrar hasta Fecha
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
            />
          </div>
        </div>

        {/* Informativo de Progreso y Estatus */}
        {status && (
          <div className={`p-4 rounded-2xl border text-xs font-bold space-y-2 uppercase tracking-wide leading-relaxed ${
            status.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
              : 'bg-rose-50 text-rose-800 border-rose-100'
          }`}>
            <div className="flex items-start gap-2.5">
              {status.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
              <span>{status.text}</span>
            </div>
            
            {status.type === 'success' && status.details && (
              <div className="bg-white/60 p-3 rounded-xl mt-2 text-[10px] space-y-1 font-mono hover:bg-white text-emerald-950 border border-emerald-100/50">
                <div>• EXCEL: {status.details.fileName}</div>
                <div>• TOTAL REGISTROS: {status.details.recordsCount}</div>
                <div>• DRIVE FILE ID: {status.details.fileId}</div>
              </div>
            )}
          </div>
        )}

        {/* Botón de Envío */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-900 hover:bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-md transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Validando Drive y Guardando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Compilar y Sincronizar
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// =========================================================================
// COMPONENTE AUXILIAR PARA LA DEPURACIÓN MANUAL DE LA BITÁCORA (>7 DÍAS)
// =========================================================================
function ManualPurgeModule({ onPurged }: { onPurged: () => void }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string; count?: number } | null>(null);

  const handleManualPurge = async () => {
    if (!confirm('¿Está seguro de que desea ejecutar la purga manual sobre la bitácora nominal temporal? Se eliminarán permanentemente todos los registros con más de 7 días de antigüedad.')) return;
    
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch('/api/purgar-nominales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error enviando petición de purga.');
      }

      setStatus({
        type: 'success',
        text: `¡Purga completada exitosamente!`,
        count: data.purgedCount
      });
      // Notificar al dashboard principal para actualizar el contador de bitácora
      onPurged();

    } catch (err: any) {
      console.error(err);
      setStatus({
        type: 'error',
        text: err.message || 'Error comunicando con el endpoint de saneamiento.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-rose-100 shadow-xl space-y-6">
      <div className="flex items-center gap-3 border-b border-rose-50 pb-4">
        <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-[#cf0921] rounded-2xl flex items-center justify-center">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h3 className="text-sm font-black text-rose-950 uppercase tracking-wide">Purga de Bitácora Nominales</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Saneamiento estricto temporal de 7 días</p>
        </div>
      </div>

      <div className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase space-y-2">
        <p>• La bitácora transaccional 'nominales' únicamente sirve de copia de respaldo de seguridad intermedia antes de la sincronización de archivos Excel.</p>
        <p>• Los registros médicos persistirán ilimitados en sus tablas maestras específicas de quirófanos, obstetricia y necropsia.</p>
      </div>

      {status && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-start gap-3 uppercase tracking-wide leading-relaxed ${
          status.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
            : 'bg-rose-50 text-rose-800 border-rose-100'
        }`}>
          {status.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          <div>
            <div>{status.text}</div>
            {status.count !== undefined && (
              <div className="font-mono text-[10px] mt-1 text-slate-400">• Registros transaccionales depurados: {status.count}</div>
            )}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          onClick={handleManualPurge}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-4 bg-[#cf0921] hover:bg-black text-white text-[10.5px] font-black uppercase tracking-widest rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Depurando base de datos...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              Ejecutar Purga de Registros Antiguos
            </>
          )}
        </button>
      </div>
    </div>
  );
}
