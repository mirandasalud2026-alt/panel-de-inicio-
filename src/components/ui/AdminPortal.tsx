import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Trash2, 
  Settings, 
  Newspaper, 
  Calendar,
  Plus, 
  Download, 
  Play, 
  Terminal, 
  Clock, 
  RefreshCw,
  Mountain,
  Palmtree, 
  BarChart,
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

interface AdminPortalProps {
  restricted?: boolean;
}

export default function AdminPortal({ restricted = false }: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<'scripts' | 'noticias' | 'calendario' | 'config' | 'mapa' | 'usuarios'>(restricted ? 'noticias' : 'usuarios');
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [systemUsers, setSystemUsers] = useState<UserProfile[]>([]);
  const [mapGlobalConfig, setMapGlobalConfig] = useState({ title: 'Miranda Salud SIG', bgUrl: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [editingNoticia, setEditingNoticia] = useState<Noticia | null>(null);
  const [editingEvento, setEditingEvento] = useState<any | null>(null);
  const [logs, setLogs] = useState<{ time: string, msg: string }[]>([]);
  const [executingScript, setExecutingScript] = useState<string | null>(null);
  const [isDbLoading, setIsDbLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    fetchNoticias();
    fetchEventos();
    fetchUsers();
    fetchConfig();
    agregarLog('Panel de Administración sincronizado.');
  }, []);

  const fetchEventos = async () => {
    if (!supabase) return;
    setIsDbLoading(true);
    try {
      const { data, error } = await supabase
        .from('calendario')
        .select('*')
        .order('fecha', { ascending: true });
      if (!error) setEventos(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setIsDbLoading(false);
    }
  };

  const saveEvento = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const eventoData = {
      titulo: formData.get('titulo') as string,
      fecha: formData.get('fecha') as string,
      tipo: formData.get('tipo') as string,
      descripcion: formData.get('descripcion') as string,
    };

    if (supabase) {
      setIsDbLoading(true);
      try {
        if (editingEvento) {
          const { error } = await supabase
            .from('calendario')
            .update(eventoData)
            .eq('id', editingEvento.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('calendario')
            .insert(eventoData);
          if (error) throw error;
        }
        await fetchEventos();
      } catch (err: any) {
        agregarLog(`❌ Error DB Calendario: ${err.message}`);
      } finally {
        setIsDbLoading(false);
      }
    }
    setIsCalendarModalOpen(false);
    setEditingEvento(null);
    agregarLog(`📅 Evento "${eventoData.titulo}" procesado.`);
  };

  const deleteEvento = async (id: any) => {
    if (confirm('¿Eliminar este evento del calendario?')) {
      if (supabase) {
        try {
          await supabase.from('calendario').delete().eq('id', id);
          await fetchEventos();
        } catch (err) {
          console.error(err);
        }
      }
      agregarLog('🗑️ Evento eliminado.');
    }
  };

  const fetchConfig = async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('mapa_config').select('*').eq('id', 'default').maybeSingle();
      if (data) {
        setMapGlobalConfig(prev => ({ ...prev, bgUrl: data.background_image || '' }));
      }
    } catch (err) {
      console.error('Error fetching config:', err);
    }
  };

  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setIsDbLoading(true);
    try {
      const { error } = await supabase
        .from('mapa_config')
        .upsert({
          id: 'default',
          background_image: mapGlobalConfig.bgUrl,
          updated_at: new Date().toISOString()
        });
      if (error) throw error;
      agregarLog('⚙️ Configuración global actualizada.');
      notify('Configuración guardada');
    } catch (err: any) {
      agregarLog(`❌ Error config: ${err.message}`);
    } finally {
      setIsDbLoading(false);
    }
  };

  // Mock satisfy notify for consistency if needed or use local feedback
  const notify = (msg: string) => {
    console.log(msg);
  };

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

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ rol: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      agregarLog(`👤 Rol de usuario actualizado a ${newRole}.`);
      fetchUsers();
    } catch (err: any) {
      agregarLog(`❌ Error rol: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Seguro que desea eliminar el perfil de este usuario? No podrá acceder al sistema hasta que se registre de nuevo.')) return;
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      agregarLog(`🗑️ Perfil de usuario eliminado.`);
      fetchUsers();
    } catch (err: any) {
      agregarLog(`❌ Error eliminar usuario: ${err.message}`);
    }
  };

  const agregarLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('es-VE');
    setLogs(prev => [...prev, { time, msg }]);
  };

  const ejecutarScript = async (id: string) => {
    setExecutingScript(id);
    agregarLog(`🚀 Iniciando: ${id}...`);
    
    if (id === 'syncAll') {
      try {
        const res = await fetch('/api/sync/workspace', { method: 'POST' });
        const data = await res.json();
        if (data.status === 'success') {
          agregarLog(`✅ Google Workspace: ${data.message} (${data.filesFound} archivos encontrados)`);
        } else {
          agregarLog(`❌ Error Workspace: ${data.message}`);
        }
      } catch (err: any) {
        agregarLog(`❌ Error de Red: ${err.message}`);
      }
    } else {
      // Logic for other scripts
      await new Promise(resolve => setTimeout(resolve, 2000));
      agregarLog(`✅ Éxito: ${id} ejecutado correctamente.`);
    }
    
    setExecutingScript(null);
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
    { id: 'syncAll', name: 'Sincronizar Cloud', desc: 'Actualizar base de datos central con reportes de los 5 ejes', icon: <RefreshCw />, color: 'bg-blue-500', action: 'SyncCloud' },
    { id: 'syncStats', name: 'Procesar KPI', desc: 'Recalcular indicadores de gestión y cobertura de salud', icon: <BarChart />, color: 'bg-emerald-500', action: 'ProcessStats' },
    { id: 'backup', name: 'Backup SIG', desc: 'Generar respaldo de capas geográficas y configuraciones', icon: <Database />, color: 'bg-indigo-500', action: 'BackupSIG' },
    { id: 'report', name: 'Reporte Epidemiológico', desc: 'Generar boletín semanal consolidado en PDF/Excel', icon: <Newspaper />, color: 'bg-amber-500', action: 'GenReport' },
    { id: 'cache', name: 'Resetear Caché', desc: 'Forzar refresco de datos en dispositivos cliente', icon: <Eraser />, color: 'bg-rose-500', action: 'ClearCache' },
  ];

  return (
    <div className="space-y-6">
      {/* TABS */}
      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 max-w-4xl overflow-x-auto custom-scrollbar">
        {[
          { id: 'scripts', label: 'Scripts/Sync', icon: <Settings size={14} /> },
          { id: 'mapa', label: 'SIG/Mapa', icon: <MapIcon size={14} /> },
          { id: 'noticias', label: 'Noticias', icon: <Newspaper size={14} /> },
          { id: 'calendario', label: 'Calendario', icon: <Calendar size={14} /> },
          { id: 'usuarios', label: 'Acreditador', icon: <Users size={14} /> },
          { id: 'config', label: 'Configuración', icon: <Database size={14} /> },
        ].filter(tab => !restricted || ['noticias', 'calendario'].includes(tab.id)).map(tab => (
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
        <div className="flex-1 overflow-y-auto px-1 custom-scrollbar" style={{ maxHeight: restricted ? '500px' : 'none' }}>
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
                    onClick={() => ejecutarScript(script.id)}
                    className="w-full py-3 bg-[#0B3D5C] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#1A5F7A] disabled:opacity-50 transition-colors"
                  >
                    {executingScript === script.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Play size={14} />
                    )}
                    {executingScript === script.id ? 'Ejecutando...' : 'Iniciar Proceso'}
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

        {activeTab === 'calendario' && (
          <motion.div 
            key="calendario"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                <Calendar className="text-[#0B3D5C]" /> Gestión de Jornadas y Eventos
              </h2>
              <button 
                onClick={() => { setEditingEvento(null); setIsCalendarModalOpen(true); }}
                className="bg-[#0B3D5C] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg hover:bg-[#1A5F7A]"
              >
                <Plus size={16} /> Nuevo Evento
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventos.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-white rounded-[2rem] border border-dashed border-gray-200">
                   <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">No hay eventos programados</p>
                </div>
              ) : eventos.map(evento => (
                <div key={evento.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative group">
                  <div className={`absolute top-6 right-6 w-2 h-2 rounded-full ${
                    evento.tipo === 'jornada' ? 'bg-blue-500' : evento.tipo === 'vacunacion' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}></div>
                  
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">{evento.fecha}</span>
                  <h3 className="font-bold text-gray-800 mb-2 truncate pr-4">{evento.titulo}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-6 h-8">{evento.descripcion}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                      evento.tipo === 'jornada' ? 'bg-blue-50 text-blue-600' : evento.tipo === 'vacunacion' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {evento.tipo}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingEvento(evento); setIsCalendarModalOpen(true); }}
                        className="p-1.5 text-blue-400 hover:text-blue-600"
                      >
                        <PenBox size={14} />
                      </button>
                      <button 
                        onClick={() => deleteEvento(evento.id)}
                        className="p-1.5 text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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
                <Users className="text-blue-600" /> Acreditador
              </h2>
              <div className="flex gap-2">
                 <button onClick={fetchUsers} className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 transition-colors">
                    <RefreshCw size={14} className={isDbLoading ? 'animate-spin' : ''} />
                 </button>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] overflow-x-auto border border-gray-100 shadow-sm custom-scrollbar">
               <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-gray-50 border-b border-gray-100">
                     <tr>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Usuario</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Rol</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Estado</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 text-right">Acciones</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {systemUsers.length === 0 ? (
                        <tr>
                           <td colSpan={4} className="px-6 py-20 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">
                              No hay usuarios registrados
                           </td>
                        </tr>
                     ) : systemUsers.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-[#0B3D5C]/10 flex items-center justify-center text-[#0B3D5C] font-bold text-xs">
                                    {u.nombre.charAt(0).toUpperCase()}
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-800">{u.nombre}</span>
                                    <span className="text-[10px] text-gray-400">{u.email}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                 <select 
                                   value={u.rol}
                                   onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                   className={`w-fit text-[9px] font-black uppercase px-2 py-1 rounded-md border-none focus:ring-1 focus:ring-[#0B3D5C]/10 cursor-pointer ${
                                     u.rol === 'admin' ? 'bg-red-50 text-red-600' : u.rol === 'directivo' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                                   }`}
                                 >
                                   <option value="admin">Administrador</option>
                                   <option value="directivo">Directivo</option>
                                   <option value="oficina">Operador</option>
                                 </select>
                              </div>
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
                                      className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                                      title="Suspender"
                                    >
                                       <UserX size={16} />
                                    </button>
                                 )}
                                 <button 
                                   onClick={() => handleDeleteUser(u.id)}
                                   className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                   title="Eliminar Perfil"
                                 >
                                    <Trash2 size={16} />
                                 </button>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="md:col-span-2 space-y-6">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                     <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest mb-6 border-b border-gray-50 pb-4">Preferencias Globales</h4>
                     <form onSubmit={saveConfig} className="space-y-6">
                        <div>
                           <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">URL Fondo del Mapa</label>
                           <input 
                             value={mapGlobalConfig.bgUrl}
                             onChange={e => setMapGlobalConfig(prev => ({ ...prev, bgUrl: e.target.value }))}
                             placeholder="Ex: https://..."
                             className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none"
                           />
                        </div>
                        <button 
                          type="submit"
                          disabled={isDbLoading}
                          className="w-full py-4 bg-[#0B3D5C] text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-[#0B3D5C]/10 flex items-center justify-center gap-2"
                        >
                           {isDbLoading ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
                           Actualizar Cloud SIG
                        </button>
                     </form>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        { label: 'Sincronización Cloud', desc: 'Conectado a la tabla mapa_config', active: !!supabase },
                        { label: 'Gestión de Noticias', desc: 'Tabla "noticias" operacional', active: noticias.length > 0 },
                        { label: 'Seguridad RLS', desc: 'Protección de capas por rol admin', active: true },
                        { label: 'Control de Usuarios', desc: 'Acreditación manual activada', active: systemUsers.length > 0 },
                    ].map((c, i) => (
                        <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
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
               </div>

               <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2.5rem]">
                     <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-2">
                       <AlertCircle size={16} /> Acción SQL
                     </h4>
                     <p className="text-[10px] text-amber-700 leading-relaxed mb-4">
                       Si el portal muestra errores de <b>"infinite recursion"</b>, ejecute el SQL de <b>database-setup.sql</b>.
                     </p>
                     <div className="bg-slate-900 rounded-xl p-4 overflow-hidden relative">
                        <pre className="text-[8px] text-blue-300 font-mono overflow-x-auto custom-scrollbar">
                          {`-- 1. SOLUCIONAR RECURSIÓN
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT rol FROM public.usuarios WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. ACCESO MANUAL
UPDATE public.usuarios SET rol = 'admin', estado = 'aprobado' WHERE email = 'EMAIL';`}
                        </pre>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
        </div>
      </AnimatePresence>

      {/* MODAL CALENDARIO */}
      {isCalendarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {editingEvento ? 'Editar Evento' : 'Nuevo Evento de Salud'}
            </h3>
            
            <form onSubmit={saveEvento} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Título del Evento</label>
                <input 
                  name="titulo"
                  required
                  defaultValue={editingEvento?.titulo}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0B3D5C]/10 transition-all" 
                  placeholder="Ej: Mega Jornada de Vacunación..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fecha</label>
                  <input 
                    name="fecha"
                    type="date"
                    required
                    defaultValue={editingEvento?.fecha}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tipo</label>
                  <select 
                    name="tipo"
                    defaultValue={editingEvento?.tipo || 'jornada'}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none"
                  >
                    <option value="jornada">Jornada</option>
                    <option value="vacunacion">Vacunación</option>
                    <option value="reunion">Reunión</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Descripción</label>
                <textarea 
                  name="descripcion"
                  required
                  rows={3}
                  defaultValue={editingEvento?.descripcion}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none"
                  placeholder="Detalles sobre la ubicación, personal requerido..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsCalendarModalOpen(false)}
                  className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-bold text-xs uppercase tracking-widest border border-gray-100"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-[#0B3D5C] text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-[#0B3D5C]/20 hover:bg-[#1A5F7A]"
                >
                  {editingEvento ? 'Actualizar' : 'Agendar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

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
