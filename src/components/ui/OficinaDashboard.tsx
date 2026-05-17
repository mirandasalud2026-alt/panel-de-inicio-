import { motion } from 'motion/react';
import { Plus, Edit2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function OficinaDashboard() {
  const reportes = [
    { id: '1', establecimiento: 'Hospital Central Victorino S.S.', estado: 'activo', fecha: 'Hoy, 10:30 AM' },
    { id: '2', establecimiento: 'CDI Los Helechos', estado: 'pendiente', fecha: 'Ayer, 4:15 PM' },
    { id: '3', establecimiento: 'Ambulatorio Beata María', estado: 'activo', fecha: '14 May, 9:00 AM' },
    { id: '4', establecimiento: 'SRI El Barbecho', estado: 'inactivo', fecha: '12 May, 11:20 AM' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">Gestión Operativa</h2>
          <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-widest">Carga de reportes diarios</p>
        </div>
        <button className="bg-[#0B3D5C] text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-transform hover:bg-[#0A3450]">
          <Plus size={24} />
        </button>
      </div>

      <div className="space-y-4">
        {reportes.map((reporte) => (
          <motion.div
            key={reporte.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-800 truncate text-sm md:text-base">{reporte.establecimiento}</h4>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">Sincronizado: {reporte.fecha}</p>
            </div>
            
            <div className="flex items-center gap-4">
              <span className={`hidden xs:flex items-center gap-1.5 text-[10px] uppercase font-bold px-3 py-1.5 rounded-full ${
                reporte.estado === 'activo' ? 'bg-green-100 text-green-700' : 
                reporte.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' : 
                'bg-gray-100 text-gray-700'
              }`}>
                {reporte.estado === 'activo' ? <CheckCircle2 size={12} /> : 
                 reporte.estado === 'pendiente' ? <Clock size={12} /> : 
                 <AlertCircle size={12} />}
                {reporte.estado}
              </span>
              <button className="w-10 h-10 bg-gray-50 border border-gray-100 text-gray-400 hover:text-[#0B3D5C] hover:bg-blue-50 transition-all rounded-xl flex items-center justify-center">
                <Edit2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border-l-4 border-l-[#0B3D5C] border border-gray-100 flex items-start gap-4">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#0B3D5C] shrink-0">
          <AlertCircle size={20} />
        </div>
        <div className="space-y-1">
          <h5 className="text-sm font-bold text-gray-800">Recordatorio de Cierre</h5>
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            Los cierres de información se realizan todos los viernes a las 12:00 PM. Asegúrese de haber cargado todos los ASICs asignados para evitar retrasos en el boletín epidemiológico.
          </p>
        </div>
      </div>
    </div>
  );
}
