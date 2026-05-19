import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  Users, 
  MapPin, 
  Calendar as CalendarIcon, 
  Filter, 
  ChevronDown, 
  ArrowUpRight, 
  Clock,
  Activity,
  FileText
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const workflowData = [
  { name: 'Lun', atenciones: 400, meta: 350 },
  { name: 'Mar', atenciones: 600, meta: 350 },
  { name: 'Mie', atenciones: 550, meta: 350 },
  { name: 'Jue', atenciones: 700, meta: 350 },
  { name: 'Vie', atenciones: 900, meta: 800 },
  { name: 'Sab', atenciones: 300, meta: 200 },
  { name: 'Dom', atenciones: 150, meta: 100 },
];

const regionData = [
  { name: 'Altos Mirandinos', value: 4500, color: '#0B3D5C' },
  { name: 'Valles del Tuy', value: 5200, color: '#1A5F7A' },
  { name: 'Metropolitana', value: 6800, color: '#2A9D8F' },
  { name: 'Guarenas-Guatire', value: 3100, color: '#E9C46A' },
  { name: 'Barlovento', value: 2400, color: '#F4A261' },
];

export default function DirectorDashboard() {
  const [selectedEje, setSelectedEje] = useState('Todos');
  const [dateRange, setDateRange] = useState('Última Semana');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* FILTROS ESTRATÉGICOS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 px-4 py-2">
          <Filter size={16} className="text-[#0B3D5C]" />
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filtros de Control</span>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <select 
              value={selectedEje}
              onChange={(e) => setSelectedEje(e.target.value)}
              className="w-full appearance-none bg-gray-50 border border-transparent rounded-2xl px-5 py-3 pr-10 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B3D5C]/10 transition-all cursor-pointer"
            >
              <option>Todos los Ejes</option>
              <option>Altos Mirandinos</option>
              <option>Valles del Tuy</option>
              <option>Metropolitana</option>
              <option>Guarenas-Guatire</option>
              <option>Barlovento</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative flex-1 md:flex-none">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full appearance-none bg-gray-50 border border-transparent rounded-2xl px-5 py-3 pr-10 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B3D5C]/10 transition-all cursor-pointer"
            >
              <option>Hoy</option>
              <option>Última Semana</option>
              <option>Último Mes</option>
              <option>Año 2026</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* METRICAS CLAVE: QUIEN, CUANDO, DONDE, CUANTOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="¿Cuántos?" 
          label="Atenciones Totales"
          value="22,148" 
          subValue="+854 hoy"
          icon={Activity} 
          trend="+12%"
          color="bg-[#0B3D5C]" 
        />
        <StatCard 
          title="¿Dónde?" 
          label="Eje con mayor impacto"
          value="Valles del Tuy" 
          subValue="5,200 casos"
          icon={MapPin} 
          color="bg-white" 
        />
        <StatCard 
          title="¿Quién?" 
          label="Centros Reportando"
          value="21 ASICs" 
          subValue="100% Cobertura"
          icon={Users} 
          color="bg-white" 
        />
        <StatCard 
          title="¿Cuándo?" 
          label="Pico de Actividad"
          value="8:00 AM" 
          subValue="Promedio diario"
          icon={Clock} 
          color="bg-white" 
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* GRAFICO DE FLUJO DE TRABAJO */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-[3rem] p-8 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h4 className="font-bold text-gray-800 text-lg">Flujo de Trabajo Semanal</h4>
              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-black">Meta vs Realidad</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#0B3D5C]"></div>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Atenciones</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Meta</span>
              </div>
            </div>
          </div>
          
          <div className="h-[400px] w-full min-h-[400px] relative overflow-hidden bg-slate-50/50 rounded-[3rem] border border-gray-100 shadow-inner">
            {isMounted && (
              <ResponsiveContainer key="chart-workflow" width="100%" height="100%" minHeight={300}>
                <AreaChart data={workflowData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAtenciones" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0B3D5C" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0B3D5C" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 800, fill: '#9CA3AF' }}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '20px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="atenciones" 
                    stroke="#0B3D5C" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorAtenciones)" 
                  />
                  <Area 
                    type="step" 
                    dataKey="meta" 
                    stroke="#E5E7EB" 
                    strokeDasharray="5 5"
                    fill="transparent" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* DISTRIBUCIÓN POR EJE */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-[3rem] p-8 shadow-sm border border-gray-100 flex flex-col">
          <h4 className="font-bold text-gray-800 mb-8 flex items-center gap-2 uppercase tracking-tight">
            Impacto por Eje
          </h4>
          
          <div className="flex-1 space-y-6">
            {regionData.map((eje, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-gray-500">{eje.name}</span>
                  <span className="text-[#0B3D5C]">{eje.value.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(eje.value / 7000) * 100}%` }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: eje.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-50">
             <button className="w-full py-4 bg-[#0B3D5C] text-white text-[10px] font-black rounded-2xl shadow-xl shadow-[#0B3D5C]/20 uppercase tracking-widest hover:bg-[#1A5F7A] transition-all flex items-center justify-center gap-2">
               Ver Regionalización <ArrowUpRight size={14} />
             </button>
          </div>
        </div>

        {/* TABLA DE REPORTE RESUMEN */}
        <div className="col-span-12 bg-white rounded-[3rem] p-8 shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <FileText className="text-[#0B3D5C]" size={20} />
              Reportes Consolidados
            </h4>
            <button className="text-[10px] font-black text-[#0B3D5C] uppercase tracking-widest border-b-2 border-[#0B3D5C] pb-0.5">
              Descargar Todo
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="pb-4 px-2">¿Quién? (ASIC)</th>
                  <th className="pb-4 px-2">¿Cuándo?</th>
                  <th className="pb-4 px-2">¿Dónde?</th>
                  <th className="pb-4 px-2">¿Cuántos?</th>
                  <th className="pb-4 px-2">Estado</th>
                  <th className="pb-4 px-2"></th>
                </tr>
              </thead>
              <tbody className="text-xs font-bold text-gray-700">
                {[
                  { who: 'Lecumberry', when: '12:45 PM', where: 'Valles del Tuy', count: '142', status: 'Verificado' },
                  { who: 'Victorino S.', when: '11:30 AM', where: 'Altos Mirandinos', count: '540', status: 'Verificado' },
                  { who: 'Baruta I', when: '10:15 AM', where: 'Metropolitana', count: '210', status: 'Pendiente' },
                  { who: 'Charallave Norte', when: '09:00 AM', where: 'Valles del Tuy', count: '98', status: 'Verificado' },
                ].map((row, i) => (
                  <tr key={i} className="border-t border-gray-50 group hover:bg-gray-50/50 transition-colors">
                    <td className="py-5 px-2">{row.who}</td>
                    <td className="py-5 px-2 text-gray-400">{row.when}</td>
                    <td className="py-5 px-2 text-gray-400">{row.where}</td>
                    <td className="py-5 px-2 text-[#0B3D5C] font-black">{row.count}</td>
                    <td className="py-5 px-2">
                      <span className={`px-2 py-1 rounded-lg text-[9px] uppercase tracking-widest ${
                        row.status === 'Verificado' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-5 px-2 text-right">
                       <button className="p-2 bg-gray-100 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                         <ChevronDown size={14} className="-rotate-90" />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  label: string;
  value: string;
  subValue?: string;
  icon: any;
  trend?: string;
  color?: string;
}

function StatCard({ title, label, value, subValue, icon: Icon, trend, color = 'bg-white' }: StatCardProps) {
  const isDark = color === 'bg-[#0B3D5C]';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isDark ? 'bg-[#0B3D5C] text-white shadow-xl shadow-[#0B3D5C]/20' : 'bg-white text-gray-900 border border-gray-100'} p-6 rounded-[2.5rem] shadow-sm flex flex-col justify-between h-56 transition-all hover:scale-[1.02]`}
    >
      <div className="flex justify-between items-start">
        <div>
          <span className={`${isDark ? 'text-white/50' : 'text-gray-400'} text-[10px] font-black uppercase tracking-[0.2em] block mb-1`}>{title}</span>
          <h4 className="text-sm font-bold opacity-80">{label}</h4>
        </div>
        <div className={`p-3 rounded-2xl ${isDark ? 'bg-white/10' : 'bg-gray-50 text-[#0B3D5C]'}`}>
          <Icon size={20} />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-black tracking-tighter">{value}</h3>
          {trend && <span className="text-[10px] font-black text-green-500">{trend}</span>}
        </div>
        {subValue && (
          <p className={`${isDark ? 'text-white/40' : 'text-gray-400'} text-[10px] font-black uppercase tracking-widest mt-2`}>
            {subValue}
          </p>
        )}
      </div>
    </motion.div>
  );
}

