import React from 'react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { RefreshCw, MapPin, Globe, Loader2, Calendar } from 'lucide-react';

export default function DashboardHeader() {
  const { 
    selectedEje, 
    setSelectedEje, 
    isSyncing, 
    syncSheets, 
    lastUpdate,
    isLoading,
    fetchData
  } = useDashboardData();

  const EjesList = [
    { id: 'TODO', label: 'TODOS LOS EJES' },
    { id: 'ALTOS MIRANDINOS', label: 'ALTOS MIRANDINOS' },
    { id: 'VALLES DEL TUY', label: 'VALLES DEL TUY' },
    { id: 'GUARENAS GUATIRE', label: 'GUARENAS-GUATIRE' },
    { id: 'BARLOVENTO', label: 'BARLOVENTO' },
    { id: 'METROPOLITANO', label: 'METROPOLITANO' }
  ];

  return (
    <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Logo and Titles */}
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#0B3D5C]/10 text-[#0B3D5C] rounded-xl">
            <Globe size={22} className={isLoading || isSyncing ? 'animate-spin' : ''} />
          </div>
          <div>
            <h1 className="text-base font-black text-gray-900 uppercase tracking-tight">
              Miranda Salud - SIG
            </h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              Monitoreo del Semáforo de Cumplimiento Territorial
            </p>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {lastUpdate && (
            <div className="text-right hidden xs:block">
              <span className="text-[8px] text-gray-400 uppercase font-bold block">
                Última Actualización
              </span>
              <span className="text-[10px] font-semibold text-slate-700">
                {lastUpdate.toLocaleTimeString('es-VE')}
              </span>
            </div>
          )}
          
          <button
            onClick={() => fetchData(false)}
            disabled={isLoading || isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Recargar datos desde base de datos"
          >
            {isLoading ? (
              <Loader2 size={12} className="animate-spin text-white" />
            ) : (
              <RefreshCw size={12} />
            )}
            Actualizar Vista
          </button>

          <button
            onClick={syncSheets}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B3D5C] hover:bg-[#082E47] text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Importar nuevos reportes de Google Sheets"
          >
            {isSyncing ? (
              <Loader2 size={12} className="animate-spin text-white" />
            ) : (
              <RefreshCw size={12} />
            )}
            Sincronizar Hojas
          </button>
        </div>

      </div>

      {/* Segmented/scroll Eje Filters */}
      <div className="border-t border-slate-50 pt-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="flex items-center gap-1 text-slate-400 text-[9px] font-black uppercase tracking-wider shrink-0 mr-1.5">
            <MapPin size={11} className="text-slate-400" />
            Filtrar:
          </div>
          {EjesList.map(e => {
            const isSelected = selectedEje === e.id;
            return (
              <button
                key={e.id}
                onClick={() => setSelectedEje(e.id)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 transition-all ${
                  isSelected 
                    ? 'bg-[#0B3D5C] text-white shadow-sm font-black' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                {e.label}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
