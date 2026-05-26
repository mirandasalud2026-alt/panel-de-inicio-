import React from 'react';
import { useDashboardData } from '../../hooks/useDashboardData';
import DashboardHeader from './DashboardHeader';
import KPICards from './KPICards';
import SemaforoChart from './Charts/SemaforoChart';
import ResumenASICChart from './Charts/ResumenASICChart';
import ASICSummaryTable from './ASICSummaryTable';
import TransitoTable from './TransitoTable';
import { BarChart3, TrendingUp, AlertCircle, Database, Server, Info, RefreshCw } from 'lucide-react';

export default function DashboardContainer() {
  const { 
    selectedTab, 
    setSelectedTab, 
    reportes, 
    isLoading, 
    error,
    lastUpdate,
    fetchData
  } = useDashboardData();

  const tabOptions = [
    { id: 'semaforo', label: 'Semáforo', icon: <BarChart3 size={13} /> },
    { id: 'resumen_asic', label: 'Resumen ASIC', icon: <TrendingUp size={13} /> },
    { id: 'transito', label: 'Tránsito Real', icon: <AlertCircle size={13} /> }
  ];

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto w-full px-3 sm:px-4 py-2 text-slate-700 min-h-screen">
      
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

      {/* 2. Key Performance Indicators grid */}
      <KPICards />

      {/* 3. Segmented navigation container */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-1">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {tabOptions.map(tab => {
            const isActive = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-sm font-black' 
                    : 'bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 border-dashed'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {reportes.length > 0 && (
          <span className="text-[9px] text-[#0B3D5C] bg-[#0B3D5C]/15 px-2 py-0.5 rounded-full font-black uppercase tracking-wider hidden xs:inline-block">
            {reportes.length} Registrados
          </span>
        )}
      </div>

      {/* 4. Dynamic view tab context contents */}
      <div className="min-h-[300px] flex flex-col gap-4">
        {selectedTab === 'semaforo' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Visual stacked semaforos */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2">
              <div>
                <span className="text-[10px] font-black text-[#0B3D5C] uppercase tracking-wider block">
                  Distribución del Semáforo de Cumplimiento
                </span>
                <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">
                  Cálculo del nivel de rezago por centros activos
                </span>
              </div>
              <SemaforoChart />
            </div>

            {/* Compliance percentages comparison */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2">
              <div>
                <span className="text-[10px] font-black text-[#0B3D5C] uppercase tracking-wider block">
                  Operatividad Consolidada por Ejes
                </span>
                <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">
                  Porcentajes acumulados (Promedio de sus ASICs integrados)
                </span>
              </div>
              <ResumenASICChart />
            </div>

          </div>
        )}

        {selectedTab === 'resumen_asic' && (
          <ASICSummaryTable />
        )}

        {selectedTab === 'transito' && (
          <TransitoTable />
        )}
      </div>

      {/* 5. Minimal unified footer info */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100 pt-4 mt-4 text-slate-400">
        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider">
          <Database size={11} className="text-emerald-500 shrink-0" />
          <span>Proveedor de Datos: Google Sheets (Sincronización Directa)</span>
        </div>
        <span className="text-[8px] font-bold uppercase tracking-widest text-[#0B3D5C]">
          SISTEMA DE INFORMACIÓN GEOGRÁFICA DE SALUD (SIG) • MIRANDA SALUD 2026
        </span>
      </div>

    </div>
  );
}
