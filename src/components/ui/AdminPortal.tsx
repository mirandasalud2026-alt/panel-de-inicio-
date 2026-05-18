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
  Palmtree, 
  BarChart,
  HardDrive,
  Eraser,
  PenBox,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Map as MapIcon,
  UserCheck,
  UserX,
  Database
} from 'lucide-react';
import InteractiveMirandaMap from '../InteractiveMirandaMap';
import { supabase, UserProfile } from '../../lib/supabase';

interface Noticia {
  id: string | number;
  titulo: string;
  categoria: 'urgente' | 'informativa' | 'evento';
  texto: string;
  fecha: string;
}

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState<'scripts' | 'noticias' | 'config' | 'mapa' | 'usuarios'>('scripts');
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [systemUsers, setSystemUsers] = useState<UserProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNoticia, setEditingNoticia] = useState<Noticia | null>(null);
  const [logs, setLogs] = useState<{ time: string, msg: string }[]>([]);
  const [executingScript, setExecutingScript] = useState<string | null>(null);
  const [isDbLoading, setIsDbLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    fetchNoticias();
    fetchUsers();
    agregarLog('Panel de Administración sincronizado.');
  }, []);

  const fetchNoticias = async () => {
    if (!supabase) {
      const saved = localStorage.getItem('sim_miranda_noticias');
      if (saved) setNoticias(JSON.parse(saved));
      return;
    }
    
    setIsDbLoading(true);
    try {
      const { data, error } = await supabase
        .from('noticias')
        .select('*')
        .order('fecha', { ascending: false });
      
      if (error) throw error;
      if (data && data.length > 0) {
        setNoticias(data);
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
      }
    } catch (err) {
      console.error('Error fetching noticias:', err);
    } finally {
      setIsDbLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('usuarios').select('*');
      if (error) throw error;
      setSystemUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      if (err.message?.includes('recursion')) {
        agregarLog('⚠️ Error RLS Detectado: Ejecute el SQL de database-setup.sql en Supabase.');
      }
    }
  };

  const handleUserStatus = async (userId: string, newStatus: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ estado: newStatus })
        .eq('id', userId);
      
      if (error) throw error;
      agregarLog(`👤 Usuario actualizado a ${newStatus}.`);
      fetchUsers();
    } catch (err: any) {
      agregarLog(`❌ Error usuarios: ${err.message}`);
    }
  };

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

  const saveNoticia = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const noticiaData: Partial<Noticia> = {
      titulo: formData.get('titulo') as string,
      categoria: formData.get('categoria') as any,
      texto: formData.get('texto') as string,
      fecha: new Date().toISOString()
    };

    if (supabase) {
      setIsDbLoading(true);
      try {
        if (editingNoticia) {
          const { error } = await supabase
            .from('noticias')
            .update(noticiaData)
            .eq('id', editingNoticia.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('noticias')
            .insert(noticiaData);
          if (error) throw error;
        }
        await fetchNoticias();
      } catch (err: any) {
        agregarLog(`❌ Error DB Noticias: ${err.message}`);
      } finally {
        setIsDbLoading(false);
      }
    } else {
      // Local Fallback
      let updated;
      const fullNoticia = { ...noticiaData, id: editingNoticia ? editingNoticia.id : Date.now() } as Noticia;
      if (editingNoticia) {
        updated = noticias.map(n => n.id === fullNoticia.id ? fullNoticia : n);
      } else {
        updated = [fullNoticia, ...noticias];
      }
      setNoticias(updated);
      localStorage.setItem('sim_miranda_noticias', JSON.stringify(updated));
    }

    setIsModalOpen(false);
    setEditingNoticia(null);
    agregarLog(`📰 Noticia "${noticiaData.titulo}" procesada.`);
  };

  const deleteNoticia = async (id: string | number) => {
    if (confirm('¿Eliminar esta noticia?')) {
      if (supabase) {
        try {
          const { error } = await supabase.from('noticias').delete().eq('id', id);
          if (error) throw error;
          await fetchNoticias();
        } catch (err: any) {
          agregarLog(`❌ Error eliminar: ${err.message}`);
        }
      } else {
        const updated = noticias.filter(n => n.id !== id);
        setNoticias(updated);
        localStorage.setItem('sim_miranda_noticias', JSON.stringify(updated));
      }
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
      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 max-w-3xl overflow-x-auto custom-scrollbar">
        {[
          { id: 'scripts', label: 'Scripts/Sync', icon: <Settings size={14} /> },
          { id: 'mapa', label: 'SIG/Mapa', icon: <MapIcon size={14} /> },
          { id: 'noticias', label: 'Noticias', icon: <Newspaper size={14} /> },
          { id: 'usuarios', label: 'Acreditación', icon: <Users size={14} /> },
          { id: 'config', label: 'Configuración', icon: <Database size={14} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-[#0B3D5C] text-white shadow-[0_10px_20px_-5px_rgba(11,61,92,0.3)]' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
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

        {activeTab === 'usuarios' && (
          <motion.div 
            key="usuarios"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
               <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                <Users className="text-blue-600" /> Acreditación de Usuarios
              </h2>
              <div className="flex gap-2">
                 <button onClick={fetchUsers} className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 transition-colors">
                    <RefreshCw size={14} className={isDbLoading ? 'animate-spin' : ''} />
                 </button>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm">
               <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                     <tr>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Usuario</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Rol</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Estado</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 text-right">Acciones</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {systemUsers.map(u => (
                        <tr key={u.id}>
                           <td className="px-6 py-4">
                              <div className="flex flex-col">
                                 <span className="text-sm font-bold text-gray-800">{u.nombre}</span>
                                 <span className="text-[10px] text-gray-400">{u.email}</span>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                 u.rol === 'admin' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                              }`}>{u.rol}</span>
                           </td>
                           <td className="px-6 py-4">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                 (u as any).estado === 'aprobado' ? 'bg-green-50 text-green-600' : (u as any).estado === 'rechazado' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                              }`}>{(u as any).estado || 'pendiente'}</span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                 {(u as any).estado !== 'aprobado' && (
                                    <button 
                                      onClick={() => handleUserStatus(u.id, 'aprobado')}
                                      className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                      title="Aprobar"
                                    >
                                       <UserCheck size={16} />
                                    </button>
                                 )}
                                 {(u as any).estado !== 'rechazado' && (
                                    <button 
                                      onClick={() => handleUserStatus(u.id, 'rechazado')}
                                      className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                      title="Rechazar"
                                    >
                                       <UserX size={16} />
                                    </button>
                                 )}
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'config' && (
          <motion.div 
            key="config"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
               <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-blue-400">
                  <Database />
               </div>
               <div>
                  <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Estructura del Sistema</h3>
                  <p className="text-[10px] text-gray-400 font-medium">Configuración de tablas y seguridad RLS</p>
               </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2.5rem] mb-6">
               <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-2">
                 <AlertCircle size={16} /> Acción Requerida en Supabase
               </h4>
               <p className="text-xs text-amber-700 leading-relaxed mb-4">
                 Para que el portal funcione correctamente (Noticias, Usuarios y SIG), debe ejecutar el script SQL de configuración en su consola de Supabase. Esto solucionará el error de <b>"infinite recursion"</b>.
               </p>
               <div className="bg-slate-900 rounded-xl p-4 overflow-hidden relative">
                  <pre className="text-[9px] text-blue-300 font-mono overflow-x-auto custom-scrollbar">
                    {`-- SQL DE EMERGENCIA (Fragmento)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT rol FROM public.usuarios 
          WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`}
                  </pre>
                  <div className="absolute top-2 right-2 px-2 py-1 bg-white/10 rounded text-[8px] font-bold text-white uppercase">Ver archivo database-setup.sql</div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
               {[
                  { label: 'Sincronización Cloud', desc: 'Conectado a la tabla mapa_config', active: !!supabase },
                  { label: 'Gestión de Noticias', desc: 'Tabla "noticias" operacional', active: noticias.length > 0 },
                  { label: 'Seguridad RLS', desc: 'Protección de capas por rol admin', active: true },
                  { label: 'Control de Usuarios', desc: 'Acreditación manual activada', active: systemUsers.length > 0 },
               ].map((c, i) => (
                  <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                     <div className="flex justify-between items-start mb-4">
                        <span className={`w-3 h-3 rounded-full ${c.active ? 'bg-green-500' : 'bg-gray-200'}`}></span>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${c.active ? 'bg-blue-600' : 'bg-gray-200'}`}>
                           <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${c.active ? 'left-6' : 'left-1'}`}></div>
                        </div>
                     </div>
                     <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">{c.label}</h4>
                     <p className="text-[10px] text-gray-400 mt-1">{c.desc}</p>
                  </div>
               ))}
            </div>
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
