import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { 
  Settings, 
  ExternalLink, 
  Edit3, 
  Info, 
  Activity, 
  ShieldCheck, 
  Package, 
  Users, 
  Building2,
  X,
  Link as LinkIcon,
  MousePointer2,
  Layout,
  Upload,
  RefreshCw,
  Mountain,
  Palmtree,
  BarChart,
  HardDrive,
  Eraser,
  Terminal,
  Clock,
  Play,
  Loader2,
  Newspaper,
  Save
} from 'lucide-react';

interface Eje {
  id: string;
  name: string;
  color: string;
  icon: React.ReactNode;
  url: string;
  description: string;
}

interface LogEntry {
  time: string;
  msg: string;
}

interface InteractiveMirandaMapProps {
  isAdminMode?: boolean;
}

const INITIAL_EJES: Eje[] = [
  { 
    id: 'epidemiologico', 
    name: 'Eje Epidemiológico', 
    color: '#3B82F6', // Azul
    icon: <Activity size={18} />, 
    url: 'https://sites.google.com/view/saludmiranda04/menu-epidemiologia',
    description: 'URL: /menu-epidemiologia'
  },
  { 
    id: 'inmunizacion', 
    name: 'Eje de Inmunización', 
    color: '#10B981', // Verde
    icon: <ShieldCheck size={18} />, 
    url: 'https://sites.google.com/view/saludmiranda04/config-vacunas',
    description: 'URL: /config-vacunas'
  },
  { 
    id: 'suministros', 
    name: 'Eje de Suministros', 
    color: '#F59E0B', // Naranja
    icon: <Package size={18} />, 
    url: 'https://sites.google.com/view/saludmiranda04/inventario-medico',
    description: 'URL: /inventario-medico'
  },
  { 
    id: 'personal', 
    name: 'Eje de Personal', 
    color: '#8B5CF6', // Púrpura
    icon: <Users size={18} />, 
    url: 'https://sites.google.com/view/saludmiranda04/gestion-personal',
    description: 'URL: /gestion-personal'
  },
  { 
    id: 'infraestructura', 
    name: 'Eje de Infraestructura', 
    color: '#EF4444', // Rojo
    icon: <Building2 size={18} />, 
    url: 'https://sites.google.com/view/saludmiranda04/estado-ambulatorios',
    description: 'URL: /estado-ambulatorios'
  },
];

export default function InteractiveMirandaMap({ isAdminMode = false }: InteractiveMirandaMapProps) {
  const [activeEje, setActiveEje] = useState<Eje>(INITIAL_EJES[0]);
  const [ejes, setEjes] = useState<Eje[]>(INITIAL_EJES);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number, y: number }[]>([]);
  const [customPolygons, setCustomPolygons] = useState<{ points: { x: number, y: number }[], ejeId: string, id: string }[]>([]);
  const [editingEje, setEditingEje] = useState<Eje | null>(null);
  const [editForm, setEditForm] = useState({ name: '', url: '', color: '', description: '' });
  const [hoveredMunicipio, setHoveredMunicipio] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar Datos desde Supabase
  useEffect(() => {
    const fetchMapData = async () => {
      if (!supabase) return;

      try {
        // 1. Cargar Configuración General
        const { data: config, error: configError } = await supabase
          .from('mapa_config')
          .select('*')
          .eq('id', 'default')
          .single();

        if (config) {
          setBackgroundImage(config.background_image);
          if (config.ejes_data) {
             const loadedEjes = config.ejes_data.map((e: any) => ({
                ...e,
                icon: INITIAL_EJES.find(ie => ie.id === e.id)?.icon || <Activity size={18} />
             }));
             setEjes(loadedEjes);
             setActiveEje(loadedEjes[0]);
          }
        }

        // 2. Cargar Polígonos
        const { data: polygons, error: polyError } = await supabase
          .from('mapa_poligonos')
          .select('*');

        if (polygons) {
          setCustomPolygons(polygons.map(p => ({
            id: p.id,
            ejeId: p.eje_id,
            points: p.points as { x: number, y: number }[]
          })));
        }
        
        addLog('Datos del mapa cargados desde la base de datos.');
      } catch (err) {
        console.error('Error loading map data:', err);
        addLog('Error al conectar con la base de datos.');
      }
    };

    fetchMapData();
  }, []);

  const saveMapConfig = async (currentEjes?: Eje[], currentBg?: string | null) => {
    if (!supabase || !isAdminMode) return;
    setIsSaving(true);
    try {
      const ejesToSave = (currentEjes || ejes).map(e => ({
        id: e.id,
        name: e.name,
        color: e.color,
        url: e.url,
        description: e.description
      }));

      const { error } = await supabase
        .from('mapa_config')
        .upsert({
          id: 'default',
          background_image: currentBg !== undefined ? currentBg : backgroundImage,
          ejes_data: ejesToSave,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      addLog('Configuración guardada exitosamente.');
    } catch (err) {
      console.error('Save error:', err);
      addLog('Error al guardar configuración.');
    } finally {
      setIsSaving(false);
    }
  };

  const savePolygon = async (poly: { id: string, points: { x: number, y: number }[], ejeId: string }) => {
     if (!supabase || !isAdminMode) return;
     try {
        const { error } = await supabase
          .from('mapa_poligonos')
          .upsert({
            id: poly.id,
            eje_id: poly.ejeId,
            points: poly.points
          });
        if (error) throw error;
     } catch (err) {
        console.error('Save poly error:', err);
     }
  };

  const deletePolygonFromDB = async (id: string) => {
     if (!supabase || !isAdminMode) return;
     try {
        await supabase.from('mapa_poligonos').delete().eq('id', id);
     } catch (err) {
        console.error('Delete poly error:', err);
     }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        setBackgroundImage(result);
        addLog('Nueva imagen de fondo cargada.');
        await saveMapConfig(undefined, result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawingMode) return;
    
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 800;
    const y = ((e.clientY - rect.top) / rect.height) * 500;
    
    setCurrentPoints([...currentPoints, { x, y }]);
  };

  const finishPolygon = async () => {
    if (currentPoints.length < 3) return;
    
    const newPolygon = {
      id: Math.random().toString(36).substr(2, 9),
      points: currentPoints,
      ejeId: activeEje.id
    };
    
    setCustomPolygons([...customPolygons, newPolygon]);
    setCurrentPoints([]);
    setIsDrawingMode(false);
    addLog(`Nuevo polígono dibujado y asignado a ${activeEje.name}.`);
    await savePolygon(newPolygon);
  };

  const clearCurrentPoints = () => setCurrentPoints([]);
  const removePolygon = async (id: string) => {
    setCustomPolygons(customPolygons.filter(p => p.id !== id));
    addLog('Polígono eliminado.');
    await deletePolygonFromDB(id);
  };

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('es-VE', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });
    setLogs(prev => [...prev, { time, msg }]);
  };

  return (
    <div className="flex flex-col h-full min-h-[700px] bg-[#0B1525] text-slate-200 rounded-[3rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/5 relative">
      
      {/* Header de Gestión Maestra (Admin Mode) */}
      {isAdminMode && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[40] flex items-center gap-4 px-8 py-3 bg-[#0A111E]/80 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] active:scale-95 transition-all">
          <div className="flex items-center gap-3 pr-4 border-r border-white/10">
             <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
             <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap">Gestión Maestra Activa</span>
          </div>
          <div className="flex items-center gap-2">
             <Users size={14} className="text-blue-400" />
             <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Admin: miranda.salud2026@gmail.com</span>
          </div>
        </div>
      )}

      {/* SIG CONTROLS (Solo en Admin Mode) - Integrados en página */}
      {isAdminMode && (
        <div className="absolute top-24 right-8 z-30 flex flex-col gap-4 w-72">
           <div className="bg-[#0A111E]/90 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-2xl flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                 <div className="flex items-center gap-2">
                    <Edit3 size={16} className="text-blue-400" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Editor SIG</span>
                 </div>
                 <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
              </div>

              {/* Selector de Eje Activo */}
              <div className="space-y-2">
                 <div className="flex items-center justify-between px-1">
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Eje de Datos</label>
                    {isSaving && <Loader2 size={10} className="animate-spin text-blue-400" />}
                 </div>
                 <div className="grid grid-cols-5 gap-1.5">
                    {ejes.map((eje) => (
                       <button
                         key={eje.id}
                         onClick={() => setActiveEje(eje)}
                         title={eje.name}
                         className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all border ${
                           activeEje.id === eje.id 
                             ? 'border-white/30 shadow-lg scale-110' 
                             : 'border-white/5 opacity-40 hover:opacity-100'
                         }`}
                         style={{ backgroundColor: eje.color }}
                       >
                         {eje.icon}
                       </button>
                    ))}
                 </div>
                 <div className="px-1 mt-1">
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter">{activeEje.name}</span>
                 </div>
              </div>

              {/* Upload Image */}
              <div className="flex flex-col gap-2">
                 <label className="p-4 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center hover:border-blue-500/30 transition-colors cursor-pointer group bg-black/20">
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <Upload size={16} className="text-slate-600 group-hover:text-blue-400 mb-2" />
                    <span className="text-[8px] font-black text-white uppercase tracking-widest text-center leading-tight">
                       {backgroundImage ? 'Cambiar Mapa' : 'Subir Mapa Base'}
                    </span>
                 </label>
                 {backgroundImage && (
                    <button 
                      onClick={async () => {
                        setBackgroundImage(null);
                        await saveMapConfig(undefined, null);
                      }}
                      className="text-[7px] font-black text-rose-500 uppercase tracking-widest hover:underline flex items-center justify-center gap-1"
                    >
                      <X size={10} /> Quitar Mapa
                    </button>
                 )}
              </div>

              {/* Drawing Controls */}
              <div className="flex flex-col gap-2">
                {!isDrawingMode ? (
                  <button 
                    onClick={() => setIsDrawingMode(true)}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                  >
                    <MousePointer2 size={12} /> Empezar a Dibujar
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={finishPolygon}
                      className="w-full py-4 bg-green-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-500 transition-all shadow-lg shadow-green-900/20"
                    >
                      Guardar Área ({currentPoints.length})
                    </button>
                    <div className="flex gap-2">
                      <button 
                        onClick={clearCurrentPoints}
                        className="flex-1 py-3 bg-white/5 text-slate-400 rounded-xl text-[8px] font-black uppercase tracking-widest border border-white/5"
                      >
                        Limpiar
                      </button>
                      <button 
                        onClick={() => { setIsDrawingMode(false); clearCurrentPoints(); }}
                        className="flex-1 py-3 bg-rose-500/10 text-rose-500 rounded-xl text-[8px] font-black uppercase tracking-widest"
                      >
                        Salir
                      </button>
                    </div>
                  </div>
                )}
              </div>
           </div>

           {/* Lista de Polígonos */}
           {customPolygons.length > 0 && (
              <div className="bg-[#0A111E]/90 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-2xl flex flex-col gap-4 max-h-[200px] overflow-y-auto custom-scrollbar">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-3">Capas Dibujadas</span>
                 {customPolygons.map(poly => {
                    const eje = ejes.find(e => e.id === poly.ejeId);
                    return (
                      <div key={poly.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                         <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: eje?.color }}></div>
                            <span className="text-[8px] font-black text-slate-300 uppercase truncate max-w-[100px]">{eje?.name}</span>
                         </div>
                         <button 
                          onClick={() => removePolygon(poly.id)}
                          className="text-slate-600 hover:text-rose-500 transition-colors"
                         >
                            <X size={12} />
                         </button>
                      </div>
                    );
                 })}
              </div>
           )}

           {/* Editor de Propiedades del Eje Activo */}
           <div className="bg-[#0A111E]/90 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Config: {activeEje.name}</span>
                 <Settings size={12} className="text-slate-500" />
              </div>
              <div className="space-y-3">
                 <div>
                    <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-1">Nombre del Eje</label>
                    <input 
                      type="text" 
                      value={activeEje.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        const updatedEjes = ejes.map(ej => ej.id === activeEje.id ? { ...ej, name: newName } : ej);
                        setEjes(updatedEjes);
                        setActiveEje(prev => ({ ...prev, name: newName }));
                      }}
                      onBlur={() => saveMapConfig()}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-bold text-white focus:outline-none focus:border-blue-500/50"
                    />
                 </div>
                 <div>
                    <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-1">URL de Redirección</label>
                    <div className="flex gap-2">
                       <input 
                        type="text" 
                        value={activeEje.url}
                        onChange={(e) => {
                          const newUrl = e.target.value;
                          const updatedEjes = ejes.map(ej => ej.id === activeEje.id ? { ...ej, url: newUrl } : ej);
                          setEjes(updatedEjes);
                          setActiveEje(prev => ({ ...prev, url: newUrl }));
                        }}
                        onBlur={() => saveMapConfig()}
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-bold text-white focus:outline-none focus:border-blue-500/50"
                       />
                       <a href={activeEje.url} target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
                          <ExternalLink size={14} />
                       </a>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Footer info (Solo admin mode simple indicator) */}
      {isAdminMode && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
           <p className="text-[8px] text-slate-600 font-black uppercase tracking-[0.5em] bg-black/40 px-6 py-2 rounded-full border border-white/5">
              Consola SIG • {isDrawingMode ? 'Modo Dibujo Activo' : 'Sincronizado'}
           </p>
        </div>
      )}

      {/* Area del Mapa (Escenario Completo) */}
      <main className="flex-1 relative flex flex-col bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#112035] to-[#0A111E]">
        


        {/* El Mapa Vectorial (Fondo Oscuro con Capas de Colores) */}
        <div className="flex-1 flex items-center justify-center relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
             <div className="w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[150px]"></div>
          </div>
          
          {/* Fondo de Grilla Técnica */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

          <svg 
            viewBox="0 0 800 500" 
            className="w-full h-full max-w-4xl drop-shadow-[0_40px_120px_rgba(0,0,0,1)] relative z-10 p-4 overflow-hidden bg-black/20 rounded-[2rem]"
            onClick={handleSvgClick}
            id="interactive-svg-map"
          >
            {/* Imagen de Fondo Cargada */}
            {backgroundImage && (
              <image 
                href={backgroundImage} 
                x="0" 
                y="0" 
                width="800" 
                height="500" 
                preserveAspectRatio="xMidYMid meet"
                className="opacity-90 pointer-events-none" 
              />
            )}

            {/* Polígonos Guardados Dinómicos */}
            {customPolygons.map((poly) => {
              const eje = ejes.find(e => e.id === poly.ejeId) || activeEje;
              return (
                <g key={poly.id} className="cursor-pointer group">
                  <polygon 
                    points={poly.points.map(p => `${p.x},${p.y}`).join(' ')}
                    fill={hoveredMunicipio === poly.id ? eje.color : `${eje.color}60`}
                    stroke={eje.color}
                    strokeWidth="3"
                    strokeOpacity={hoveredMunicipio === poly.id ? 1 : 0.8}
                    onMouseEnter={() => setHoveredMunicipio(poly.id)}
                    onMouseLeave={() => setHoveredMunicipio(null)}
                    onClick={(e) => { e.stopPropagation(); if(!isAdminMode) window.open(eje.url, '_blank'); }}
                    className="transition-all duration-300"
                    style={{ filter: hoveredMunicipio === poly.id ? `drop-shadow(0 0 30px ${eje.color})` : 'none' }}
                  />
                  {isAdminMode && hoveredMunicipio === poly.id && (
                    <foreignObject 
                      x={poly.points[0].x} 
                      y={poly.points[0].y} 
                      width="40" 
                      height="40"
                    >
                      <button 
                        onClick={(e) => { e.stopPropagation(); removePolygon(poly.id); }}
                        className="bg-rose-600 text-white p-1.5 rounded-lg shadow-lg hover:bg-rose-500 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </foreignObject>
                  )}
                </g>
              );
            })}

            {/* Polígono en Construcción (Dibujando) */}
            {currentPoints.length > 0 && (
              <g>
                <polyline 
                  points={currentPoints.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={activeEje.color}
                  strokeWidth="3"
                  className="animate-pulse"
                />
                {currentPoints.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="5" fill="white" stroke={activeEje.color} strokeWidth="2" />
                ))}
              </g>
            )}

            {/* Marcadores de Ejemplo (Solo si no hay polígonos ni imagen) */}
            {!backgroundImage && customPolygons.length === 0 && (
              <g id="mapa-placeholder" className="opacity-40 animate-pulse">
                <path
                  d="M150,150 L250,120 L300,180 L280,260 L180,280 Z"
                  fill={`${activeEje.color}60`}
                  stroke={activeEje.color}
                  strokeWidth="3"
                />
                <text x="180" y="215" fill="white" className="text-[12px] font-black pointer-events-none opacity-80 uppercase tracking-widest select-none shadow-black drop-shadow-md">Panel de Dibujo Activo (Suba un fondo)</text>
              </g>
            )}
          </svg>

          {/* Tooltip Dinámico (SaaS Style) */}
          <AnimatePresence>
            {hoveredMunicipio && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-50 pointer-events-none"
                style={{ top: '25%', left: '50%', transform: 'translateX(-50%)' }}
              >
                <div className="bg-[#0A111E] border border-white/10 p-6 rounded-3xl min-w-[280px]">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeEje.color }}></div>
                         <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{hoveredMunicipio}</span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Activo</span>
                   </div>
                   
                   <div className="space-y-4">
                      <div className="flex justify-between items-center">
                         <span className="text-[11px] font-bold text-slate-400">Estado del Eje:</span>
                         <span className="text-[11px] font-black text-white" style={{ color: activeEje.color }}>45.8% (Medio)</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                         <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '45.8%' }}
                            className="h-full" 
                            style={{ backgroundColor: activeEje.color }}
                         ></motion.div>
                      </div>
                      <p className="text-[9px] text-slate-500 leading-tight border-t border-white/5 pt-3 font-medium">
                        Reporte automático vía SIM: Recibido hace 12m desde el CDI principal.
                      </p>
                   </div>
                </div>
                {/* Flecha del tooltip */}
                <div className="w-4 h-4 bg-[#0A111E] rotate-45 border-r border-b border-white/10 mx-auto -mt-2"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer info Area Mapa */}
        <div className="mt-8 flex justify-between items-center border-t border-white/5 pt-6 opacity-40">
           <div className="flex gap-1.5">
              {['METRO', 'ALTOS', 'TUY', 'G-G', 'BARLO'].map(m => (
                <div key={m} className="px-2 py-0.5 border border-white/10 rounded-sm text-[8px] font-black text-slate-600">{m}</div>
              ))}
           </div>
           <div className="flex items-center gap-6">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Capa de Redirección: {activeEje.url.substring(0, 30)}...</span>
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">v2.6.01_STABLE</span>
           </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        #interactive-svg-map {
           cursor: ${isDrawingMode ? 'crosshair' : 'default'};
        }
      `}} />
    </div>
  );
}

function MapPin({ size, style }: { size: number, style?: React.CSSProperties }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      style={style}
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  );
}
