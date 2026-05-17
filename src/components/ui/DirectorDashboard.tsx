import { motion } from 'motion/react';
import { LucideIcon, BarChart3, Users, FileText, Activity } from 'lucide-react';

interface CardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}

const StatCard = ({ title, value, icon: Icon, color }: CardProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`${color === 'bg-[#1A5F7A]' ? 'bg-[#1A5F7A] text-white' : 'bg-white text-gray-900'} p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-48`}
  >
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-2xl text-xl ${color === 'bg-[#1A5F7A]' ? 'bg-white/20' : 'bg-gray-50 text-[#0B3D5C]'}`}>
        <Icon size={24} />
      </div>
      {color !== 'bg-[#1A5F7A]' && (
        <span className="text-xs font-bold text-green-500 bg-green-50 px-2.5 py-1 rounded-lg">+12.4%</span>
      )}
    </div>
    <div>
      <p className={`${color === 'bg-[#1A5F7A]' ? 'text-white/70' : 'text-gray-500'} text-sm font-medium mb-1`}>{title}</p>
      <h3 className="text-4xl font-extrabold tracking-tight">{value}</h3>
    </div>
  </motion.div>
);

export default function DirectorDashboard() {
  return (
    <div className="space-y-8 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Cobertura Global" value="94.2%" icon={Activity} color="bg-white" />
        <StatCard title="ASICs Activos" value="21 / 21" icon={BarChart3} color="bg-white" />
        <StatCard title="Reportes Semanales" value="148" icon={FileText} color="bg-[#1A5F7A]" />
        <StatCard title="Personal Red" value="1,420" icon={Users} color="bg-white" />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h4 className="font-bold text-gray-800 text-lg">Atención por Municipio</h4>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">Distribución semanal</p>
            </div>
            <div className="flex gap-2">
              <span className="w-3 h-3 bg-[#0B3D5C] rounded-full"></span>
              <span className="w-3 h-3 bg-[#1A5F7A] rounded-full"></span>
              <span className="w-3 h-3 bg-gray-200 rounded-full"></span>
            </div>
          </div>
          
          <div className="flex items-end justify-between h-48 gap-4 px-2">
            {[24, 44, 32, 36, 16, 40, 28].map((h, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h * 4}px` }}
                className={`w-full rounded-t-xl ${i % 2 === 0 ? 'bg-gray-100' : i === 1 ? 'bg-[#0B3D5C]' : 'bg-[#1A5F7A]'}`}
              />
            ))}
          </div>
          <div className="grid grid-cols-7 mt-6 text-[10px] font-bold text-gray-400 uppercase text-center tracking-tighter">
            <span>Sucre</span><span>Guaic</span><span>Chacao</span><span>Baruta</span><span>Plaza</span><span>Zamora</span><span>Lander</span>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
          <h4 className="font-bold text-gray-800 mb-8 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
            Estado de Red
          </h4>
          <div className="space-y-8">
            {[
              { name: 'Hosp. Victorino Santaella', status: 'Sincronizado', time: '5 min', color: 'bg-green-500' },
              { name: 'CDI Lecumberry', status: 'Pendiente', time: 'Hoy', color: 'bg-yellow-500' },
              { name: 'Ambulatorio Belem', status: 'Sincronizado', time: '1h', color: 'bg-green-500' },
              { name: 'SRI Charallave', status: 'Error', time: '2h', color: 'bg-red-500' }
            ].map((node, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-2 h-2 ${node.color} rounded-full`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">{node.name}</p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">{node.status} • {node.time}</p>
                </div>
                <button className="text-[10px] font-bold text-[#0B3D5C] uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Detalles</button>
              </div>
            ))}
            <div className="pt-6 border-t border-gray-100">
               <button className="w-full py-4 bg-gray-50 text-gray-500 text-[10px] font-bold rounded-2xl border border-gray-200 uppercase tracking-widest hover:bg-gray-100 transition-colors">
                 Mapa Georeferencial
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
