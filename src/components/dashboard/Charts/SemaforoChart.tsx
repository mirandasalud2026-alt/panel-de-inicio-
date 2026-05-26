import React from 'react';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export default function SemaforoChart() {
  const { ejes, isLoading, selectedEje } = useDashboardData();

  // Filter or map
  const data = ejes
    .filter(e => selectedEje === 'TODO' || e.eje_geografico.toUpperCase() === selectedEje.toUpperCase())
    .map(e => ({
      name: e.eje_geografico.replace('EJE', '').trim(),
      'Al día (Verde)': e.verdes,
      'Atraso Medio (Amarillo)': e.amarillos,
      'Atraso Crítico (Rojo)': e.rojos
    }));

  if (isLoading) {
    return (
      <div className="h-[260px] flex items-center justify-center text-xs font-semibold text-slate-400 uppercase tracking-widest">
        Procesando Semáforos...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-xs font-semibold text-slate-400 uppercase tracking-widest">
        Sin Datos Disponibles
      </div>
    );
  }

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#64748B', fontSize: 8, fontWeight: 700 }} 
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            tick={{ fill: '#64748B', fontSize: 8, fontWeight: 700 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#FFFFFF', 
              borderRadius: '12px', 
              border: '1px solid #E2E8F0',
              fontFamily: 'sans-serif',
              fontSize: '10px',
              fontWeight: '700'
            }} 
          />
          <Legend 
            verticalAlign="top" 
            height={36} 
            iconSize={8}
            iconType="circle"
            wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: '#64748B' }}
          />
          <Bar dataKey="Al día (Verde)" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Atraso Medio (Amarillo)" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Atraso Crítico (Rojo)" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
