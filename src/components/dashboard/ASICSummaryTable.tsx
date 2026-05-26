import React, { useMemo } from 'react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { Target, ArrowUpRight, HelpCircle } from 'lucide-react';

export default function ASICSummaryTable() {
  const { asics, selectedEje, isLoading } = useDashboardData();

  const filteredASICs = useMemo(() => {
    if (selectedEje === 'TODO') return asics;
    return asics.filter(a => a.eje_geografico.toUpperCase() === selectedEje.toUpperCase());
  }, [asics, selectedEje]);

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black text-[#0B3D5C] uppercase tracking-wider block">
            Rendimiento por ASIC (Áreas de Salud Integral)
          </span>
          <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">
            Cada ASIC calcula su porcentaje de forma aislada para promediar la operatividad real
          </span>
        </div>
        <span className="text-[9px] bg-[#0B3D5C] text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
          {filteredASICs.length} Áreas
        </span>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Consolidando datos de ASICs...
        </div>
      ) : filteredASICs.length === 0 ? (
        <div className="py-12 text-center text-xs font-semibold text-slate-400 uppercase tracking-widest bg-slate-50 border border-dashed border-slate-100 rounded-xl">
          Ninguna ASIC disponible para este filtro
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-150">
                <th className="py-2.5 px-3">ASIC / Unidad Territorial</th>
                <th className="py-2.5 px-3">Eje Geográfico</th>
                <th className="py-2.5 px-3 text-center">Centros Totales</th>
                <th className="py-2.5 px-3 text-center">Reportaron (Verde)</th>
                <th className="py-2.5 px-3 text-right">Porcentaje de Reporte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px] font-semibold text-slate-700">
              {filteredASICs.map((item, index) => {
                let colorClass = 'text-rose-650';
                let bgClass = 'bg-rose-50/40';
                if (item.porcentaje >= 80) {
                  colorClass = 'text-emerald-700';
                  bgClass = 'bg-emerald-50/45';
                } else if (item.porcentaje >= 50) {
                  colorClass = 'text-amber-700';
                  bgClass = 'bg-amber-50/45';
                }

                return (
                  <tr key={index} className="hover:bg-slate-50/40">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <Target size={12} className="text-[#0B3D5C] shrink-0" />
                        <span className="font-bold text-slate-800 uppercase">{item.asic}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[9px] text-slate-400 uppercase font-black">{item.eje_geografico}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-800">{item.total_centros}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-650">{item.centros_reportaron}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-black ${colorClass} ${bgClass}`}>
                        {item.porcentaje}%
                        <ArrowUpRight size={12} className="shrink-0" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
