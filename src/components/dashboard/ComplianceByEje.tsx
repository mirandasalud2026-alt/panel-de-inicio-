import React, { useState, useEffect } from 'react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { Award, CheckCircle2, Building2, ChevronRight, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';

export default function ComplianceByEje() {
  const { ejes, isLoading } = useDashboardData();
  const [activeEje, setActiveEje] = useState<string>('');

  // Set the first available Eje as active on load
  useEffect(() => {
    if (ejes && ejes.length > 0 && !activeEje) {
      // Prefer METROPOLITANO or first axis with data
      const defaultEje = ejes.find(e => e.asics.length > 0)?.eje_geografico || ejes[0].eje_geografico;
      setActiveEje(defaultEje);
    }
  }, [ejes, activeEje]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col items-center justify-center min-h-[250px] gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-emerald-600 animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-widest text-[#0B3D5C] animate-pulse">
          Analizando niveles de cumplimiento...
        </span>
      </div>
    );
  }

  if (!ejes || ejes.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-6 flex items-center justify-center min-h-[250px]">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <AlertCircle className="text-amber-500" size={24} />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            No hay información de cumplimiento por ejes disponible
          </span>
        </div>
      </div>
    );
  }

  // Find the selected Eje data object
  const selectedEjeData = (ejes || []).find(
    e => ((e && e.eje_geografico) || '').toUpperCase().trim() === (activeEje || '').toUpperCase().trim()
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
      
      {/* LEFT PANEL: Interactive Compliance Chart */}
      <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded-lg bg-indigo-50 text-indigo-600 block shrink-0">
              <TrendingUp size={14} />
            </span>
            <h4 className="text-[11px] font-black text-[#0B3D5C] uppercase tracking-wider">
              Nivel de Cumplimiento por Eje Geográfico
            </h4>
          </div>
          <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
            Presiona o haz clic en cualquier barra para ver el desglose de ASICs a la derecha
          </p>
        </div>

        {/* Custom Interactive SVG/HTML Bar Chart */}
        <div className="flex flex-col gap-3.5 my-1">
          {ejes.map((eje) => {
            const isSelected = eje.eje_geografico.toUpperCase().trim() === activeEje.toUpperCase().trim();
            const percent = eje.porcentaje_eje;
            
            // Color based on compliance value
            let barColorClass = 'bg-emerald-500';
            let textColorClass = 'text-emerald-700 bg-emerald-50';
            if (percent < 60) {
              barColorClass = 'bg-rose-500';
              textColorClass = 'text-rose-700 bg-rose-50';
            } else if (percent < 80) {
              barColorClass = 'bg-amber-500';
              textColorClass = 'text-amber-700 bg-amber-50';
            }

            return (
              <button
                key={eje.eje_geografico}
                onClick={() => setActiveEje(eje.eje_geografico)}
                type="button"
                className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col gap-2 ${
                  isSelected 
                    ? 'bg-[#0B3D5C]/5 border-[#0B3D5C] ring-1 ring-[#0B3D5C]/30 shadow-md transform scale-[1.01]' 
                    : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100 hover:border-gray-200'
                }`}
              >
                {/* Info Header inside bar line */}
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${
                    isSelected ? 'text-[#0B3D5C]' : 'text-slate-700'
                  }`}>
                    {eje.eje_geografico.replace('EJE', '').trim()}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                      {eje.centros_reportaron} / {eje.total_centros} centros
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${textColorClass}`}>
                      {percent}%
                    </span>
                  </div>
                </div>

                {/* Bar track container */}
                <div className="w-full h-2.5 bg-slate-200/60 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${barColorClass}`}
                    style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL: Dynamic ASICs list for selected Eje */}
      <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-1.5 justify-between">
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600 block shrink-0">
                <Building2 size={14} />
              </span>
              <h4 className="text-[11px] font-black text-[#0B3D5C] uppercase tracking-wider">
                ASICs en {activeEje ? activeEje.replace('EJE', '').trim() : 'Eje Seleccionado'}
              </h4>
            </div>
            {selectedEjeData && (
              <span className="text-[8px] font-black bg-[#0B3D5C]/5 text-[#0B3D5C] border border-[#0B3D5C]/15 px-2 py-0.5 rounded-full uppercase tracking-widest">
                {selectedEjeData.asics.length} ASICs
              </span>
            )}
          </div>
          <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
            Cumplimiento directo y reportes consolidados por cada Área de Salud Integral Comunitaria
          </p>
        </div>

        {/* Dynamic ASICs Grid list */}
        <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
          {selectedEjeData && selectedEjeData.asics.length > 0 ? (
            // Sort by percentage descending - placing high compliance first
            [...selectedEjeData.asics]
              .sort((a, b) => b.porcentaje - a.porcentaje)
              .map((asic, idx) => {
                const compliesFully = asic.porcentaje === 100;
                
                let chipColorClass = 'text-amber-800 bg-amber-50 border border-amber-100';
                let progressColor = 'bg-amber-500';
                if (compliesFully) {
                  chipColorClass = 'text-emerald-800 bg-emerald-50 border border-emerald-100';
                  progressColor = 'bg-emerald-500';
                } else if (asic.porcentaje < 60) {
                  chipColorClass = 'text-rose-800 bg-rose-50 border border-rose-100';
                  progressColor = 'bg-rose-500';
                }

                return (
                  <div 
                    key={asic.asic + '-' + idx}
                    className="p-3 bg-slate-50/40 rounded-2xl border border-slate-100 grid grid-cols-12 gap-3 items-center hover:bg-slate-50 transition-all duration-150"
                  >
                    {/* ASIC Name identifier */}
                    <div className="col-span-12 xs:col-span-6 flex items-center gap-2">
                      <div className="p-1 bg-white rounded-lg border border-slate-100 shrink-0">
                        {compliesFully ? (
                          <CheckCircle2 size={13} className="text-emerald-500" />
                        ) : (
                          <Building2 size={13} className="text-[#0B3D5C]" />
                        )}
                      </div>
                      <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider block truncate">
                        {asic.asic}
                      </span>
                    </div>

                    {/* Progress details */}
                    <div className="col-span-7 xs:col-span-3 flex flex-col gap-1">
                      <span className="text-[7px] text-gray-400 font-extrabold uppercase tracking-widest">
                        Centro Sincronizado
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-black text-slate-700">
                          {asic.centros_reportaron}
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold">
                          de {asic.total_centros}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${progressColor}`}
                          style={{ width: `${asic.porcentaje}%` }}
                        />
                      </div>
                    </div>

                    {/* Compliance Indicator Pill */}
                    <div className="col-span-5 xs:col-span-3 flex justify-end">
                      {compliesFully ? (
                        <div className={`px-2 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${chipColorClass}`}>
                          <Sparkles size={8} className="text-emerald-600 animate-pulse" />
                          <span>100% Al Día</span>
                        </div>
                      ) : (
                        <div className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest ${chipColorClass}`}>
                          {asic.porcentaje}%
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center gap-1 text-center min-h-[140px]">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                Sin ASICs para esta zona
              </span>
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider text-center max-w-[150px]">
                No se registraron ASICs sincronizados en este eje territorial
              </span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
