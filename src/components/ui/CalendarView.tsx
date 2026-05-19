import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, X, Info, MapPin, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Evento {
  id: number;
  titulo: string;
  fecha: string;
  tipo: 'jornada' | 'vacunacion' | 'reunion' | 'otro';
  descripcion: string;
}

export default function CalendarView({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchEventos();
    }
  }, [isOpen]);

  const fetchEventos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('calendario')
        .select('*')
        .order('fecha', { ascending: true });
      if (error) throw error;
      setEventos(data || []);
    } catch (err) {
      console.error('Error fetching calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-[#0B3D5C]/80 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden relative"
          >
            {/* Header */}
            <div className="p-8 md:p-12 pb-6 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-[#0B3D5C]/10 p-2.5 rounded-2xl">
                    <Calendar className="text-[#0B3D5C]" size={24} />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">Cronograma de Salud</h2>
                </div>
                <p className="text-gray-500 font-medium ml-12">Próximas jornadas y actividades en el estado Miranda</p>
              </div>
              <button 
                onClick={onClose}
                className="bg-gray-100 hover:bg-gray-200 text-gray-500 p-4 rounded-full transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 md:px-12 pb-12 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-12 h-12 border-4 border-[#0B3D5C]/20 border-t-[#0B3D5C] rounded-full animate-spin"></div>
                  <p className="text-[#0B3D5C] font-bold text-sm uppercase tracking-widest">Sincronizando calendario...</p>
                </div>
              ) : eventos.length === 0 ? (
                <div className="py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100 mt-4">
                  <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Info className="text-gray-300" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No hay jornadas programadas</h3>
                  <p className="text-gray-400 font-medium">Vuelve pronto para ver las nuevas actualizaciones.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                  {eventos.map((evento, i) => (
                    <motion.div
                      key={evento.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="group bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                    >
                      {/* Badge Tipo */}
                      <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest ${
                        evento.tipo === 'jornada' ? 'bg-blue-500 text-white' : 
                        evento.tipo === 'vacunacion' ? 'bg-emerald-500 text-white' : 
                        evento.tipo === 'reunion' ? 'bg-amber-500 text-white' : 'bg-gray-800 text-white'
                      }`}>
                        {evento.tipo}
                      </div>

                      <div className="mb-6">
                        <div className="flex items-center gap-2 text-[#0B3D5C] font-black text-sm uppercase tracking-tighter mb-4">
                          <Clock size={14} />
                          {new Date(evento.fecha).toLocaleDateString('es-ES', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long' 
                          })}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 leading-tight group-hover:text-[#0B3D5C] transition-colors">{evento.titulo}</h3>
                      </div>

                      <p className="text-sm text-gray-500 font-medium line-clamp-3 mb-6 min-h-[4.5rem]">
                        {evento.descripcion}
                      </p>

                      <div className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest pt-6 border-t border-gray-50 mt-auto">
                        <MapPin size={12} className="text-red-400" />
                        Ubicación según despliegue
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex justify-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gobernación del Estado Miranda &copy; 2026</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
