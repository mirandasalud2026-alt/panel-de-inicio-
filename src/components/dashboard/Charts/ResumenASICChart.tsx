import React from 'react';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function ResumenASICChart() {
  const { ejes, isLoading, selectedEje } = useDashboardData();

  const data = ejes
    .filter(e => selectedEje === 'TODO' || e.eje_geografico.toUpperCase() === selectedEje.toUpperCase())
    .map(e => ({
      name: e.eje_geografico.replace('EJE', '').trim(),
      'Cumplimiento (%)': e.porcentaje_eje
    }));

  if (isLoading) {
    return (
      <div className="h-[260px] flex items-center justify-center text-xs font-semibold text-slate-400 uppercase tracking-widest">
        Procesando porcentajes...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-xs font-semibold text-slate-400 uppercase tracking-widest">
        Sin Datos de Cumplimiento
      </div>
    );
  }

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 10, right: 15, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
          <XAxis 
            type="number" 
            domain={[0, 100]} 
            tick={{ fill: '#64748B', fontSize: 8, fontWeight: 700 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            tick={{ fill: '#334155', fontSize: 8, fontWeight: 800 }} 
            tickLine={false}
            axisLine={false}
            width={90}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0F172A', 
              borderRadius: '12px', 
              border: 'none',
              fontFamily: 'sans-serif',
              fontSize: '10px',
              fontWeight: '700',
              color: '#FFFFFF'
            }}
            itemStyle={{ color: '#10B981' }}
          />
          <Bar dataKey="Cumplimiento (%)" fill="#0B3D5C" radius={[0, 4, 4, 0]} barSize={12}>
            {data.map((entry, index) => {
              const val = entry['Cumplimiento (%)'];
              let color = '#0B3D5C'; // Primary blue
              if (val >= 85) color = '#10B981'; // Green
              else if (val < 60) color = '#EF4444'; // Red
              else if (val < 80) color = '#F59E0B'; // Yellow
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
