import React, { useMemo, useState } from 'react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { AlertCircle, Calendar, RefreshCw, CheckCircle2, Search, Clock } from 'lucide-react';

export default function TransitoTable() {
  const { reportes, selectedEje, isLoading } = useDashboardData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODO' | 'Verde' | 'Amarillo' | 'Rojo'>('TODO');

  const filteredReportes = useMemo(() => {
    let result = reportes || [];
    
    // 1. Eje filter
    if (selectedEje !== 'TODO') {
      result = result.filter(r => (r.eje_geografico || '').toUpperCase() === selectedEje.toUpperCase());
    }

    // 2. Status filter
    if (statusFilter !== 'TODO') {
      result = result.filter(r => r.estado_semaforo === statusFilter);
    }

    // 3. Search filter
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      result = result.filter(r => 
        (r.nombre_centro || '').toLowerCase().includes(q) || 
        (r.asic || '').toLowerCase().includes(q) ||
        (r.id_centro || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [reportes, selectedEje, statusFilter, searchTerm]);

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
      
      {/* Table filters strip */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Centro, ASIC o ID..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#0B3D5C]"
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {(['TODO', 'Verde', 'Amarillo', 'Rojo'] as const).map(status => {
            const isSelected = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 transition-all ${
                  isSelected 
                    ? status === 'Verde' ? 'bg-emerald-600 text-white shadow-sm' :
                      status === 'Amarillo' ? 'bg-amber-500 text-white shadow-sm' :
                      status === 'Rojo' ? 'bg-rose-600 text-white shadow-sm' :
                      'bg-slate-800 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {status === 'TODO' ? 'TODOS' : status}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Table view */}
      {isLoading ? (
        <div className="py-12 text-center text-xs font-bold uppercase tracking-wider text-slate-400 flex flex-col items-center justify-center gap-2">
          <RefreshCw size={16} className="animate-spin text-[#0B3D5C]" />
          Verificando registros...
        </div>
      ) : filteredReportes.length === 0 ? (
        <div className="py-12 text-center text-xs font-semibold text-slate-400 uppercase tracking-widest bg-slate-50 border border-dashed border-slate-100 rounded-xl">
          Sin registros para los filtros seleccionados
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-150">
                <th className="py-2.5 px-3">Establecimiento</th>
                <th className="py-2.5 px-3">ASIC / Unidad</th>
                <th className="py-2.5 px-3">Eje Geográfico</th>
                <th className="py-2.5 px-3">Último Reporte</th>
                <th className="py-2.5 px-3 text-center">Horas Retraso</th>
                <th className="py-2.5 px-3 text-right">Semáforo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {filteredReportes.map((item) => (
                <tr key={item.id_centro} className="hover:bg-slate-50/40 font-semibold text-slate-700">
                  <td className="py-2.5 px-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-800">{item.nombre_centro}</span>
                      <span className="text-[8px] text-slate-400 font-mono font-bold uppercase">{item.id_centro}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-[#0B3D5C] uppercase">{item.asic}</td>
                  <td className="py-2.5 px-3 text-slate-500 uppercase font-bold text-[9px]">{item.eje_geografico}</td>
                  <td className="py-2.5 px-3 text-slate-500 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-slate-400" />
                      {new Date(item.ultimo_reporte).toLocaleDateString('es-VE')} - {new Date(item.ultimo_reporte).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[9px] font-bold text-slate-600">
                      <Clock size={11} className="text-slate-400" />
                      {item.horas_retraso} hrs
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      item.estado_semaforo === 'Verde' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                      item.estado_semaforo === 'Amarillo' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                      'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        item.estado_semaforo === 'Verde' ? 'bg-emerald-500' :
                        item.estado_semaforo === 'Amarillo' ? 'bg-amber-500' :
                        'bg-rose-500'
                      }`} />
                      {item.estado_semaforo}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer notes */}
      <span className="text-[8px] text-gray-400 uppercase font-bold text-right">
        Mostrando {filteredReportes.length} de {reportes.length} centros totales geolocalizados
      </span>
    </div>
  );
}
