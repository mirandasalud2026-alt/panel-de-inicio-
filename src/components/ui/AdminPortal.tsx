import React, { useState, useEffect, useRef } from 'react';
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
  Database,
  LayoutDashboard,
  Activity,
  TrendingUp,
  Bell,
  Server,
  HardDrive,
  Cloud,
  Layers
} from 'lucide-react';
import InteractiveMirandaMap from '../InteractiveMirandaMap';
import { supabase, UserProfile } from '../../lib/supabase';
import { googleSignIn, initAuth } from '../../lib/firebaseAuth';
import { googleWorkspaceService } from '../../services/googleWorkspaceService';
import { WorkspaceManager } from './WorkspaceManager';
import NominalesManager from '../admin/NominalesManager';
import GoogleScriptFormsTabs from '../admin/GoogleScriptFormsTabs';
import { FileSpreadsheet } from 'lucide-react';

interface Noticia {
  id: string | number;
  titulo: string;
  categoria: 'urgente' | 'informativa' | 'evento';
  texto: string;
  fecha: string;
}

interface TransitoReporte {
  id_centro: string;
  nombre_centro: string;
  asic: string;
  eje_geografico: string;
  ultimo_reporte: string;
  estado_semaforo: string;
  horas_retraso: number;
  actualizado_en: string;
}

const MOCK_TRANSITO_REPORTES: TransitoReporte[] = [
  {
    id_centro: "ALT_AS_GUA",
    nombre_centro: "Ambulatorio Guaremal",
    asic: "ASIC GUAREMAL",
    eje_geografico: "ALTOS MIRANDINOS",
    ultimo_reporte: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    estado_semaforo: "Verde",
    horas_retraso: 0,
    actualizado_en: new Date().toISOString()
  },
  {
    id_centro: "ALT_AS_CAR_CDI",
    nombre_centro: "CDI Carrizal",
    asic: "ASIC CARRIZAL",
    eje_geografico: "ALTOS MIRANDINOS",
    ultimo_reporte: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
    estado_semaforo: "Amarillo",
    horas_retraso: 30,
    actualizado_en: new Date().toISOString()
  },
  {
    id_centro: "VAL_AS_OCU",
    nombre_centro: "Ambulatorio Ocumare",
    asic: "ASIC OCUMARE DEL TUY",
    eje_geografico: "VALLES DEL TUY",
    ultimo_reporte: new Date(Date.now() - 52 * 3600 * 1000).toISOString(),
    estado_semaforo: "Rojo",
    horas_retraso: 52,
    actualizado_en: new Date().toISOString()
  },
  {
    id_centro: "GUA_AS_GG",
    nombre_centro: "Hospitalito de Guarenas",
    asic: "ASIC GUARENAS",
    eje_geografico: "GUARENAS-GUATIRE",
    ultimo_reporte: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    estado_semaforo: "Verde",
    horas_retraso: 0,
    actualizado_en: new Date().toISOString()
  },
  {
    id_centro: "BAR_AS_MAM",
    nombre_centro: "CDI Mamporal",
    asic: "ASIC MAMPORAL",
    eje_geografico: "BARLOVENTO",
    ultimo_reporte: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    estado_semaforo: "Verde",
    horas_retraso: 0,
    actualizado_en: new Date().toISOString()
  },
  {
    id_centro: "MET_AS_CHA",
    nombre_centro: "Ambulatorio El Pedregal",
    asic: "ASIC CHACAO",
    eje_geografico: "METROPOLITANO",
    ultimo_reporte: new Date(Date.now() - 61 * 3600 * 1000).toISOString(),
    estado_semaforo: "Rojo",
    horas_retraso: 61,
    actualizado_en: new Date().toISOString()
  }
];

export default function AdminPortal({ restricted = false }: { restricted?: boolean }) {
  const trigger3HoursRef = useRef<(() => void) | null>(null);
  const [activeTab, setActiveTab] = useState<'mapa' | 'mapa_admin' | 'cumplimiento' | 'noticias' | 'calendario' | 'usuarios' | 'nominales' | 'widgets_google'>('cumplimiento');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [systemUsers, setSystemUsers] = useState<UserProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [editingNoticia, setEditingNoticia] = useState<Noticia | null>(null);
  const [editingEvento, setEditingEvento] = useState<any | null>(null);
  const [logs, setLogs] = useState<{ time: string, msg: string }[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  // Compliance states
  const [transitoReportes, setTransitoReportes] = useState<TransitoReporte[]>([]);
  const [filterSemaforo, setFilterSemaforo] = useState<string>('Todos');
  const [filterEje, setFilterEje] = useState<string>('Todos');

  useEffect(() => {
    fetchNoticias();
    fetchEventos();
    fetchUsers();
    fetchTransitoReportes();
    agregarLog('Panel de Administración sincronizado.');

    const unsubscribe = initAuth(
      (u, token) => {
        setUser(u);
        setAccessToken(token);
        agregarLog(`🌐 Conectado con cuenta de Google: ${u.email}`);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const agregarLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('es-VE');
    setLogs(prev => [...prev.slice(-49), { time, msg }]);
  };

  const fetchNoticias = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('noticias')
        .select('*')
        .order('fecha', { ascending: false });
      if (!error && data) setNoticias(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEventos = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('calendario')
        .select('*')
        .order('fecha', { ascending: true });
      if (!error && data) setEventos(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('usuarios').select('*');
      if (!error && data) setSystemUsers(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchTransitoReportes = async () => {
    if (!supabase) {
      setTransitoReportes(MOCK_TRANSITO_REPORTES);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('transito_reportes')
        .select('*')
        .order('actualizado_en', { ascending: false });
      if (!error && data && data.length > 0) {
        setTransitoReportes(data);
      } else {
        setTransitoReportes(MOCK_TRANSITO_REPORTES);
      }
    } catch (err) {
      setTransitoReportes(MOCK_TRANSITO_REPORTES);
    }
  };

  const handleUserStatus = async (userId: string, newStatus: string) => {
    if (!supabase) return;
    try {
      await supabase.from('usuarios').update({ estado: newStatus }).eq('id', userId);
      agregarLog(`👤 Usuario actualizado a ${newStatus}.`);
      fetchUsers();
    } catch (err: any) {
      agregarLog(`❌ Error: ${err.message}`);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!supabase) return;
    try {
      await supabase.from('usuarios').update({ rol: newRole }).eq('id', userId);
      agregarLog(`👤 Rol actualizado a ${newRole}.`);
      fetchUsers();
    } catch (err: any) {
      agregarLog(`❌ Error: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    if (!supabase) return;
    try {
      await supabase.from('usuarios').delete().eq('id', userId);
      agregarLog(`🗑️ Usuario eliminado.`);
      fetchUsers();
    } catch (err: any) {
      agregarLog(`❌ Error: ${err.message}`);
    }
  };

  const saveNoticia = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const noticiaData = {
      titulo: formData.get('titulo') as string,
      categoria: formData.get('categoria') as any,
      texto: formData.get('texto') as string,
      fecha: new Date().toISOString()
    };

    if (supabase) {
      setIsDbLoading(true);
      try {
        if (editingNoticia) {
          await supabase.from('noticias').update(noticiaData).eq('id', editingNoticia.id);
        } else {
          await supabase.from('noticias').insert(noticiaData);
        }
        await fetchNoticias();
      } catch (err: any) {
        agregarLog(`❌ Error: ${err.message}`);
      } finally {
        setIsDbLoading(false);
      }
    }
    setIsModalOpen(false);
    setEditingNoticia(null);
    agregarLog(`📰 Noticia procesada.`);
  };

  const deleteNoticia = async (id: string | number) => {
    if (!confirm('¿Eliminar esta noticia?')) return;
    if (supabase) {
      try {
        await supabase.from('noticias').delete().eq('id', id);
        await fetchNoticias();
      } catch (err: any) {
        agregarLog(`❌ Error: ${err.message}`);
      }
    }
    agregarLog('🗑️ Noticia eliminada.');
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
          await supabase.from('calendario').update(eventoData).eq('id', editingEvento.id);
        } else {
          await supabase.from('calendario').insert(eventoData);
        }
        await fetchEventos();
      } catch (err: any) {
        agregarLog(`❌ Error: ${err.message}`);
      } finally {
        setIsDbLoading(false);
      }
    }
    setIsCalendarModalOpen(false);
    setEditingEvento(null);
    agregarLog(`📅 Evento procesado.`);
  };

  const deleteEvento = async (id: any) => {
    if (!confirm('¿Eliminar este evento?')) return;
    if (supabase) {
      try {
        await supabase.from('calendario').delete().eq('id', id);
        await fetchEventos();
      } catch (err) {
        console.error(err);
      }
    }
    agregarLog('🗑️ Evento eliminado.');
  };

  // Filtrado de reportes
  const reportesFiltrados = transitoReportes.filter(r => {
    const matchesEje = filterEje === 'Todos' || r.eje_geografico.toUpperCase() === filterEje.toUpperCase();
    const matchesSemaforo = filterSemaforo === 'Todos' || r.estado_semaforo.toUpperCase() === filterSemaforo.toUpperCase();
    return matchesEje && matchesSemaforo;
  });

  const totalCentros = transitoReportes.length;
  const cumplidosCount = transitoReportes.filter(r => r.estado_semaforo.toLowerCase() === 'verde').length;
  const demoradosCount = transitoReportes.filter(r => r.estado_semaforo.toLowerCase() === 'amarillo').length;
  const fueraCount = transitoReportes.filter(r => r.estado_semaforo.toLowerCase() === 'rojo').length;
  const porcentajeCumplido = totalCentros > 0 ? Math.round((cumplidosCount / totalCentros) * 100) : 0;

  const tabs = [
    { id: 'cumplimiento', label: 'Tránsito', icon: <Activity size={14} /> },
    { id: 'nominales', label: 'Ramas Nominales', icon: <Layers size={14} /> },
    { id: 'widgets_google', label: 'Formularios Google', icon: <FileSpreadsheet size={14} /> },
    { id: 'mapa', label: 'Mapa SIG', icon: <MapIcon size={14} /> },
    { id: 'noticias', label: 'Noticias', icon: <Newspaper size={14} /> },
    { id: 'calendario', label: 'Calendario', icon: <Calendar size={14} /> },
    { id: 'usuarios', label: 'Usuarios', icon: <Users size={14} /> },
  ];

  if (restricted) {
    tabs.length = 2;
  }

  return (
    <div className="space-y-4">
      {/* TABS COMPACTOS */}
      <div className="flex flex-wrap gap-1.5 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
              activeTab === tab.id 
                ? 'bg-[#0B3D5C] text-white shadow-md' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* MAPA */}
        {activeTab === 'mapa' && (
          <motion.div key="mapa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="h-[480px] rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <InteractiveMirandaMap isAdminMode={true} />
            </div>
          </motion.div>
        )}

        {/* CUMPLIMIENTO COMPACTO */}
        {activeTab === 'cumplimiento' && (
          <motion.div key="cumplimiento" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-xl border border-gray-100 text-center">
                <p className="text-[9px] font-black text-gray-400 uppercase">Cumplimiento</p>
                <p className="text-xl font-black text-[#0B3D5C]">{porcentajeCumplido}%</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-100 text-center">
                <p className="text-[9px] font-black text-green-500 uppercase">Verde</p>
                <p className="text-xl font-black text-green-600">{cumplidosCount}</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-100 text-center">
                <p className="text-[9px] font-black text-amber-500 uppercase">Amarillo</p>
                <p className="text-xl font-black text-amber-600">{demoradosCount}</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-100 text-center">
                <p className="text-[9px] font-black text-red-500 uppercase">Rojo</p>
                <p className="text-xl font-black text-red-600">{fueraCount}</p>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
              <select
                value={filterEje}
                onChange={(e) => setFilterEje(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-[10px] font-bold"
              >
                <option value="Todos">Todos los Ejes</option>
                <option value="ALTOS MIRANDINOS">Altos Mirandinos</option>
                <option value="VALLES DEL TUY">Valles del Tuy</option>
                <option value="GUARENAS-GUATIRE">Guarenas-Guatire</option>
                <option value="BARLOVENTO">Barlovento</option>
                <option value="METROPOLITANO">Metropolitano</option>
              </select>
              <select
                value={filterSemaforo}
                onChange={(e) => setFilterSemaforo(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-[10px] font-bold"
              >
                <option value="Todos">Todos</option>
                <option value="Verde">Verde</option>
                <option value="Amarillo">Amarillo</option>
                <option value="Rojo">Rojo</option>
              </select>
              <button
                onClick={fetchTransitoReportes}
                className="px-3 py-2 bg-[#0B3D5C] text-white rounded-xl"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {/* Tabla compacta */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-gray-50 text-[9px] font-black text-gray-400 uppercase">
                    <tr>
                      <th className="px-3 py-2">Centro</th>
                      <th className="px-3 py-2 hidden sm:table-cell">ASIC</th>
                      <th className="px-3 py-2 text-center">Estado</th>
                      <th className="px-3 py-2 text-right">Retraso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {reportesFiltrados.map((r) => (
                      <tr key={r.id_centro} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <p className="text-[10px] font-bold">{r.nombre_centro.split(' ').slice(0,2).join(' ')}</p>
                          <p className="text-[8px] text-gray-400">{r.id_centro}</p>
                        </td>
                        <td className="px-3 py-2 hidden sm:table-cell">
                          <p className="text-[9px] font-bold">{r.asic}</p>
                          <p className="text-[8px] text-gray-400">{r.eje_geografico}</p>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            r.estado_semaforo === 'Verde' ? 'bg-green-500' : 
                            r.estado_semaforo === 'Amarillo' ? 'bg-amber-500' : 'bg-red-500'
                          }`} />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className={`text-[9px] font-bold ${
                            r.horas_retraso === 0 ? 'text-green-600' : 
                            r.horas_retraso < 48 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {r.horas_retraso === 0 ? 'Al día' : `${r.horas_retraso}h`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {reportesFiltrados.length > 0 && (
              <p className="text-[9px] text-[#0B3D5C] font-black tracking-widest uppercase text-center mt-2 animate-pulse">
                Desliza sobre la tabla para examinar los {reportesFiltrados.length} centros registrados
              </p>
            )}

            {/* SECCIÓN DE SINCRONIZACIÓN MOVIDA A TRANSITO */}
            <div className="border-t border-dashed border-gray-150 pt-6 mt-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="space-y-1 text-center sm:text-left font-sans">
                  <h4 className="text-xs font-black text-gray-800 uppercase tracking-tight flex items-center justify-center sm:justify-start gap-1.5">
                    <Clock size={13} className="text-[#0B3D5C]" /> Configuración de Disparadores Temporales
                  </h4>
                  <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                    Configura y activa de forma inmediata el cron automático de Apps Script para consolidar los reportes en el Dashboard cada 3 horas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (trigger3HoursRef.current) {
                      agregarLog('⏳ Iniciando configuración manual del Cron de 3 horas desde la pestaña de Tránsito...');
                      trigger3HoursRef.current();
                    } else {
                      alert('El módulo de Sincronización se está cargando. Por favor, intente de nuevo en un momento.');
                    }
                  }}
                  className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-5 py-3 bg-[#0B3D5C] hover:bg-[#082E47] text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm hover:shadow-md hover:translate-y-[-1px] active:translate-y-[0px] cursor-pointer font-sans"
                >
                  <Clock size={14} /> Configurar Cron 3 Horas
                </button>
              </div>

              <WorkspaceManager onRegisterTriggerHandler={(handler) => { trigger3HoursRef.current = handler; }} />
            </div>
          </motion.div>
        )}

        {/* NOTICIAS COMPACTO */}
        {activeTab === 'noticias' && (
          <motion.div key="noticias" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="flex justify-end">
              <button 
                onClick={() => { setEditingNoticia(null); setIsModalOpen(true); }}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#0B3D5C] text-white rounded-xl text-[9px] font-black"
              >
                <Plus size={12} /> Nueva
              </button>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {noticias.slice(0, 10).map(noticia => (
                <div key={noticia.id} className="bg-white p-3 rounded-xl border border-gray-100 relative">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                    noticia.categoria === 'urgente' ? 'bg-red-500' : 
                    noticia.categoria === 'informativa' ? 'bg-blue-500' : 'bg-emerald-500'
                  }`} />
                  <div className="pl-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[8px] font-black text-gray-400">{noticia.fecha}</span>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingNoticia(noticia); setIsModalOpen(true); }} className="p-1 text-gray-400 hover:text-blue-500">
                          <PenBox size={10} />
                        </button>
                        <button onClick={() => deleteNoticia(noticia.id)} className="p-1 text-gray-400 hover:text-red-500">
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] font-bold mt-1">{noticia.titulo}</p>
                    <p className="text-[9px] text-gray-500 line-clamp-2 mt-0.5">{noticia.texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CALENDARIO COMPACTO */}
        {activeTab === 'calendario' && (
          <motion.div key="calendario" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="flex justify-end">
              <button 
                onClick={() => { setEditingEvento(null); setIsCalendarModalOpen(true); }}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#0B3D5C] text-white rounded-xl text-[9px] font-black"
              >
                <Plus size={12} /> Agendar
              </button>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {eventos.slice(0, 10).map(evento => (
                <div key={evento.id} className="bg-white p-3 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-black text-gray-400">{evento.fecha}</span>
                      <p className="text-[10px] font-bold mt-0.5">{evento.titulo}</p>
                      <p className="text-[8px] text-gray-500 mt-0.5 line-clamp-1">{evento.descripcion}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingEvento(evento); setIsCalendarModalOpen(true); }} className="p-1 text-gray-400 hover:text-blue-500">
                        <PenBox size={10} />
                      </button>
                      <button onClick={() => deleteEvento(evento.id)} className="p-1 text-gray-400 hover:text-red-500">
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* USUARIOS COMPACTO */}
        {activeTab === 'usuarios' && (
          <motion.div key="usuarios" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="flex justify-end">
              <button onClick={fetchUsers} className="px-3 py-1.5 bg-gray-50 rounded-xl text-[9px] font-black">
                <RefreshCw size={12} className={isDbLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {systemUsers.map(u => (
                <div key={u.id} className="bg-white p-3 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#0B3D5C]/10 flex items-center justify-center text-[10px] font-bold">
                          {u.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold">{u.nombre}</p>
                          <p className="text-[8px] text-gray-400 truncate max-w-[150px]">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <select 
                          value={u.rol}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="text-[8px] font-black px-2 py-0.5 rounded-md bg-gray-100"
                        >
                          <option value="admin">Admin</option>
                          <option value="directivo">Directivo</option>
                          <option value="oficina">Operador</option>
                        </select>
                        <select 
                          value={(u as any).estado || 'pendiente'}
                          onChange={(e) => handleUserStatus(u.id, e.target.value)}
                          className="text-[8px] font-black px-2 py-0.5 rounded-md bg-gray-100"
                        >
                          <option value="aprobado">Aprobado</option>
                          <option value="pendiente">Pendiente</option>
                          <option value="rechazado">Rechazado</option>
                        </select>
                        <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      (u as any).estado === 'aprobado' ? 'bg-green-500' : 
                      (u as any).estado === 'rechazado' ? 'bg-red-500' : 'bg-amber-500'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* COMPONENTE MAESTRO DE SISTEMAS NOMINALES */}
        {activeTab === 'nominales' && (
          <motion.div key="nominales-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <NominalesManager />
          </motion.div>
        )}

        {/* COMPONENTE DE FORMULARIOS DE GOOGLE APPS SCRIPT */}
        {activeTab === 'widgets_google' && (
          <motion.div key="widgets-google-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GoogleScriptFormsTabs iframeHeight="720px" />
          </motion.div>
        )}

      </AnimatePresence>

      {/* LOGS COMPACTOS (opcional) */}
      {showLogs && (
        <div className="bg-gray-900 rounded-xl p-3 mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[8px] font-black text-gray-400 uppercase">Registro</span>
            <button onClick={() => setShowLogs(false)} className="text-gray-500 text-[8px]">×</button>
          </div>
          <div className="space-y-0.5 max-h-32 overflow-y-auto">
            {logs.map((log, i) => (
              <p key={i} className="text-[8px] font-mono text-green-400"><span className="text-gray-500">[{log.time}]</span> {log.msg}</p>
            ))}
          </div>
        </div>
      )}

      {!showLogs && (
        <button onClick={() => setShowLogs(true)} className="text-[8px] text-gray-400 hover:text-gray-600">
          📋 Mostrar registro
        </button>
      )}

      {/* MODAL NOTICIA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white w-full max-w-md rounded-2xl p-5">
            <h3 className="text-sm font-bold mb-4">{editingNoticia ? 'Editar Noticia' : 'Nueva Noticia'}</h3>
            <form onSubmit={saveNoticia} className="space-y-3">
              <input name="titulo" required defaultValue={editingNoticia?.titulo} placeholder="Título" className="w-full p-3 bg-gray-50 rounded-xl text-sm" />
              <select name="categoria" defaultValue={editingNoticia?.categoria || 'informativa'} className="w-full p-3 bg-gray-50 rounded-xl text-sm">
                <option value="informativa">Informativa</option>
                <option value="urgente">Urgente</option>
                <option value="evento">Evento</option>
              </select>
              <textarea name="texto" required rows={3} defaultValue={editingNoticia?.texto} placeholder="Contenido..." className="w-full p-3 bg-gray-50 rounded-xl text-sm" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 rounded-xl text-xs font-bold">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-[#0B3D5C] text-white rounded-xl text-xs font-bold">Guardar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL CALENDARIO */}
      {isCalendarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white w-full max-w-md rounded-2xl p-5">
            <h3 className="text-sm font-bold mb-4">{editingEvento ? 'Editar Evento' : 'Nuevo Evento'}</h3>
            <form onSubmit={saveEvento} className="space-y-3">
              <input name="titulo" required defaultValue={editingEvento?.titulo} placeholder="Título" className="w-full p-3 bg-gray-50 rounded-xl text-sm" />
              <input name="fecha" type="date" required defaultValue={editingEvento?.fecha} className="w-full p-3 bg-gray-50 rounded-xl text-sm" />
              <select name="tipo" defaultValue={editingEvento?.tipo || 'jornada'} className="w-full p-3 bg-gray-50 rounded-xl text-sm">
                <option value="jornada">Jornada</option>
                <option value="vacunacion">Vacunación</option>
                <option value="reunion">Reunión</option>
              </select>
              <textarea name="descripcion" required rows={2} defaultValue={editingEvento?.descripcion} placeholder="Descripción" className="w-full p-3 bg-gray-50 rounded-xl text-sm" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsCalendarModalOpen(false)} className="flex-1 py-3 bg-gray-100 rounded-xl text-xs font-bold">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-[#0B3D5C] text-white rounded-xl text-xs font-bold">Guardar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}