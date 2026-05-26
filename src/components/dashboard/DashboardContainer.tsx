import React from 'react';
import { useDashboardData } from '../../hooks/useDashboardData';
import DashboardHeader from './DashboardHeader';
import ComplianceByEje from './ComplianceByEje';
import WeeklyLoadHistory from './WeeklyLoadHistory';
import TransitoTable from './TransitoTable';
import { Database, Info, RefreshCw } from 'lucide-react';

export default function DashboardContainer() {
  const { 
    reportes, 
    isLoading, 
    error,
    fetchData
  } = useDashboardData();

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto w-full px-3 sm:px-4 py-2 text-slate-700 min-h-screen">
      
      {/* 1. Header with Controls */}
      <DashboardHeader />

      {/* Error alert wrapper */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-150 text-rose-700 text-xs font-bold rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info size={14} className="shrink-0" />
            <span>Atención: {error}</span>
          </div>
          <button 
            onClick={fetchData} 
            className="flex items-center gap-1 bg-white border border-rose-200 text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-100 transition-all text-[9px] uppercase font-black"
          >
            <RefreshCw size={10} />
            Reintentar
          </button>
        </div>
      )}

      {/* 2. Interactive Compliance Widget */}
      <ComplianceByEje />

      {/* 3. Weekly Load History timeline */}
      <WeeklyLoadHistory />

      {/* Title block for transit reports data list */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 mt-4">
        <div>
          <h3 className="text-sm font-black text-[#0B3D5C] uppercase tracking-wider">
            Reportes en Tránsito de Salud
          </h3>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
            Consolidado unificado en tiempo real de rezagos y cumplimiento por establecimiento
          </p>
        </div>
        {reportes.length > 0 && (
          <span className="text-[9px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-black uppercase tracking-wider">
            {reportes.length} Centros Sincronizados
          </span>
        )}
      </div>

      {/* 3. Direct Transito Table component */}
      <div className="min-h-[300px] flex flex-col gap-4">
        <TransitoTable />
      </div>

      {/* 3. Minimal footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100 pt-4 mt-4 text-slate-400">
        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider">
          <Database size={11} className="text-emerald-500 shrink-0" />
          <span>Proveedor de Datos: Google Sheets & Supabase DB (Sincronización Directa)</span>
        </div>
        <span className="text-[8px] font-bold uppercase tracking-widest text-[#0B3D5C]">
          SISTEMA DE INFORMACIÓN GEOGRÁFICA DE SALUD (SIG) • MIRANDA SALUD 2026
        </span>
      </div>

    </div>
  );
}
