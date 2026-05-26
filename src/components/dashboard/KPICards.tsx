import React from 'react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { Award, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

export default function KPICards() {
  const { stats, isLoading } = useDashboardData();

  const cards = [
    {
      label: 'Cumplimiento General',
      value: `${stats.cumplimiento_general}%`,
      subtitle: 'Promedio de cumplimiento por Eje',
      color: 'text-[#0B3D5C]',
      bg: 'bg-blue-50/50',
      icon: <Award className="text-[#0B3D5C]" size={18} />
    },
    {
      label: 'Centros Reportados',
      value: `${stats.centros_reportaron} / ${stats.total_centros}`,
      subtitle: `${stats.total_centros - stats.centros_reportaron} pendientes de reporte`,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50/50',
      icon: <CheckCircle2 className="text-emerald-600" size={18} />
    },
    {
      label: 'Ejes al Día',
      value: `${stats.ejes_al_dia} / ${stats.total_ejes}`,
      subtitle: 'Ejes con promedio ≥ 75%',
      color: 'text-amber-700',
      bg: 'bg-amber-50/50',
      icon: <AlertTriangle className="text-amber-600" size={18} />
    },
    {
      label: 'ASICs Activas',
      value: stats.total_asics.toString(),
      subtitle: 'Áreas de Salud Integral',
      color: 'text-purple-700',
      bg: 'bg-purple-50/50',
      icon: <HelpCircle className="text-purple-600" size={18} />
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((card, i) => (
        <div 
          key={i} 
          className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest block truncate">
              {card.label}
            </span>
            <div className={`p-1.5 rounded-lg ${card.bg}`}>
              {card.icon}
            </div>
          </div>

          <div className="flex flex-col gap-0.5 mt-1">
            <span className={`text-lg font-black tracking-tight ${card.color}`}>
              {isLoading ? '...' : card.value}
            </span>
            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block truncate">
              {isLoading ? 'Procesando coordenadas...' : card.subtitle}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
