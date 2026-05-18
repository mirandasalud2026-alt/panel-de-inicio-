import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Trash2, 
  Settings, 
  Newspaper, 
  Plus, 
  Download, 
  Play, 
  Terminal, 
  Clock, 
  RefreshCw,
  Mountain,
  Palmtree, // For Valles del Tuy icon equivalent
  BarChart,
  HardDrive,
  Eraser,
  PenBox,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Map as MapIcon
} from 'lucide-react';
import InteractiveMirandaMap from '../InteractiveMirandaMap';

interface Noticia {
  id: number;
  titulo: string;
  categoria: 'urgente' | 'informativa' | 'evento';
  texto: string;
  fecha: string;
}

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState<'scripts' | 'noticias' | 'config' | 'mapa'>('scripts');
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNoticia, setEditingNoticia] = useState<Noticia | null>(null);
  const [logs, setLogs] = useState<{ time: string, msg: string }[]>([]);
  const [executingScript, setExecutingScript] = useState<string | null>(null);

  // Load initial news
  useEffect(() => {
    const saved = localStorage.getItem('sim_miranda_noticias');
    if (saved) {
      setNoticias(JSON.parse(saved));
    } else {
      const defaultNoticias: Noticia[] = [
        {
          id: 1,
          titulo: 'Bienvenido al Panel de Administración',
          categoria: 'informativa',
          texto: 'Desde este panel podrás gestionar noticias y ejecutar las sincronizaciones automáticas de los ASICs.',
          fecha: new Date().toISOString().split('T')[0]
        }
      ];
      setNoticias(defaultNoticias);
      localStorage.setItem('sim_miranda_noticias', JSON.stringify(defaultNoticias));
    }
    
    agregarLog('Panel iniciado. Esperando comandos...');
  }, []);

  const agregarLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('es-VE');
    setLogs(prev => [...prev, { time, msg }]);
  };

  const ejecutarScript = async (name: string) => {
    setExecutingScript(name);
    agregarLog(`🚀 Iniciando: ${name}...`);
    
    // Simulate execution
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setExecutingScript(null);
    agregarLog(`✅ Éxito: ${name} ejecutado correctamente.`);
  };

  const saveNoticia = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const noticiaData: Noticia = {
      id: editingNoticia ? editingNoticia.id : Date.now(),
      titulo: formData.get('titulo') as string,
      categoria: formData.get('categoria') as any,
      texto: formData.get('texto') as string,
      fecha: new Date().toISOString().split('T')[0]
    };

    let updated;
    if (editingNoticia) {
      updated = noticias.map(n => n.id === noticiaData.id ? noticiaData : n);
    } else {
      updated = [noticiaData, ...noticias];
    }

    setNoticias(updated);
    localStorage.setItem('sim_miranda_noticias', JSON.stringify(updated));
    setIsModalOpen(false);
    setEditingNoticia(null);
    agregarLog(`📰 Noticia "${noticiaData.titulo}" guardada.`);
  };

  const deleteNoticia = (id: number) => {
    if (confirm('¿Eliminar esta noticia?')) {
      const updated = noticias.filter(n => n.id !== id);
      setNoticias(updated);
      localStorage.setItem('sim_miranda_noticias', JSON.stringify(updated));
      agregarLog('🗑️ Noticia eliminada.');
    }
  };

  const scripts = [
    { id: 'syncAll', name: 'Sincronizar Todo', desc: 'Sincronización completa de los 5 ejes', icon: <RefreshCw />, color: 'bg-blue-500' },
    { id: 'syncAM', name: 'Altos Mirandinos', desc: 'Sincronizar solo ASICs de Altos Mirandinos', icon: <Mountain />, color: 'bg-emerald-500' },
    { id: 'syncVT', name: 'Valles del Tuy', desc: 'Sincronizar solo ASICs de Valles del Tuy', icon: <Palmtree />, color: 'bg-indigo-500' },
    { id: 'report', name: 'Generar Reporte', desc: 'Crea reporte semanal consolidado en PDF', icon: <BarChart />, color: 'bg-amber-500' },
    { id: 'cache', name: 'Limpiar Caché', desc: 'Limpia la caché de datos y fuerza actualización', icon: <Eraser />, color: 'bg-rose-500' },
    { id: 'backup', name: 'Respaldo Completo', desc: 'Backup de todas las hojas a Google Drive', icon: <HardDrive />, color: 'bg-slate-700' },
  ];

  return (
    <div className="space-y-6">
      {/* TABS */}
      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 max-w-2xl overflow-x-auto">
        {[
          { id: 'scripts', label: 'Automatizaciones', icon: <Settings size={16} /> },
          { id: 'mapa', label: 'Editor de Mapa', icon: <MapIcon size={16} /> },
          { id: 'noticias', label: 'Noticias', icon: <Newspaper size={16} /> },
          { id: 'config', label: 'Configuración', icon: <Shield size={16} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-[#0B3D5C] text-white shadow-lg' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'scripts' && (
          <motion.div 
            key="scripts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                <Settings className="text-[#0B3D5C]" /> Ejecutar Sincronizaciones
              </h2>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <Clock size={12} /> Última: hace 23 min
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {scripts.map(script => (
                <div 
                  key={script.id}
                  className={`bg-white p-6 rounded-[2rem] shadow-sm border-2 transition-all ${
                    executingScript === script.id ? 'border-amber-400 animate-pulse' : 'border-transparent hover:border-[#0B3D5C]'
                  }`}
                >
                  <div className={`w-12 h-12 ${script.color} text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-gray-200`}>
                    {script.icon}
                  </div>
                  <h3 className="font-bold text-gray-800 mb-1">{script.name}</h3>
                  <p className="text-[10px] text-gray-400 font-medium leading-relaxed mb-6 h-8 overflow-hidden">{script.desc}</p>
                  
                  <button 
                    disabled={executingScript !== null}
                    onClick={() => ejecutarScript(script.name)}
                    className="w-full py-3 bg-[#0B3D5C] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#1A5F7A] disabled:opacity-50 transition-colors"
                  >
                    {executingScript === script.name ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Play size={14} />
                    )}
                    {executingScript === script.name ? 'Ejecutando...' : 'Ejecutar'}
                  </button>
                </div>
              ))}
            </div>

            {/* Terminal Log */}
            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 overflow-hidden">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Terminal size={14} /> Registro de Actividad
              </h3>
              <div className="bg-slate-900 rounded-2xl p-5 font-mono text-[11px] h-48 overflow-y-auto space-y-1">
                {logs.map((log, i) => (
                  <div key={i} className="text-slate-300">
                    <span className="text-slate-500">[{log.time}]</span> {log.msg}
                  </div>
                ))}
                {executingScript && (
                  <div className="text-amber-400 flex items-center gap-2">
                    <Loader2 size={10} className="animate-spin" /> Ejecutando proceso en background...
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'mapa' && (
          <motion.div 
            key="mapa"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 min-h-[500px] h-[calc(100vh-250px)]"
          >
            <InteractiveMirandaMap isAdminMode={true} />
          </motion.div>
        )}

        {activeTab === 'noticias' && (
          <motion.div 
            key="noticias"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                <Newspaper className="text-[#0B3D5C]" /> Gestión de Noticias
              </h2>
              <button 
                onClick={() => { setEditingNoticia(null); setIsModalOpen(true); }}
                className="bg-[#0B3D5C] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg hover:bg-[#1A5F7A]"
              >
                <Plus size={16} /> Nueva Noticia
              </button>
            </div>

            <div className="grid gap-4">
              {noticias.map(noticia => (
                <div key={noticia.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 relative overflow-hidden">
                  <div className={`w-1.5 h-full absolute left-0 top-0 ${
                    noticia.categoria === 'urgente' ? 'bg-red-500' : noticia.categoria === 'informativa' ? 'bg-blue-500' : 'bg-emerald-500'
                  }`}></div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        noticia.categoria === 'urgente' ? 'bg-red-50 text-red-600' : noticia.categoria === 'informativa' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {noticia.categoria}
                      </span>
                      <span className="text-[10px] font-medium text-gray-400">{noticia.fecha}</span>
                    </div>
                    <h3 className="font-bold text-gray-800 mb-2">{noticia.titulo}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{noticia.texto}</p>
                  </div>
                  
                  <div className="flex md:flex-col justify-end gap-2 shrink-0">
                    <button 
                      onClick={() => { setEditingNoticia(noticia); setIsModalOpen(true); }}
                      className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <PenBox size={18} />
                    </button>
                    <button 
                      onClick={() => deleteNoticia(noticia.id)}
                      className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'config' && (
          <motion.div 
            key="config"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200"
          >
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-200 mb-6">
              <Shield size={40} />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Panel en Desarrollo</h3>
            <p className="text-sm text-gray-400 mt-2">La configuración avanzada estará disponible en la v1.3.0</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL NOTICIA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {editingNoticia ? 'Editar Noticia' : 'Nueva Noticia'}
            </h3>
            
            <form onSubmit={saveNoticia} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Título de la Noticia</label>
                <input 
                  name="titulo"
                  required
                  defaultValue={editingNoticia?.titulo}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0B3D5C]/10 transition-all" 
                  placeholder="Ej: Actualización del sistema..."
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Categoría</label>
                <select 
                  name="categoria"
                  defaultValue={editingNoticia?.categoria || 'informativa'}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none"
                >
                  <option value="informativa">Informativa</option>
                  <option value="urgente">Urgente</option>
                  <option value="evento">Evento</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Contenido</label>
                <textarea 
                  name="texto"
                  required
                  rows={4}
                  defaultValue={editingNoticia?.texto}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none"
                  placeholder="Escriba el detalle aquí..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-bold text-xs uppercase tracking-widest border border-gray-100"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-[#0B3D5C] text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-[#0B3D5C]/20 hover:bg-[#1A5F7A]"
                >
                  {editingNoticia ? 'Actualizar' : 'Guardar noticia'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
