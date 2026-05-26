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
  CheckCircle2,
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
  Save,
  Trash2,
  Database,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface Eje {
  id: string;
  name: string;
  color: string;
  icon: React.ReactNode;
  url: string;
  description: string;
}

interface InteractiveMirandaMapProps {
  isAdminMode?: boolean;
}

const INITIAL_EJES: Eje[] = [
  { 
    id: 'epidemiologico', 
    name: 'Eje Epidemiológico', 
    color: '#3B82F6',
    icon: <Activity size={18} />, 
    url: 'https://sites.google.com/view/saludmiranda04/menu-epidemiologia',
    description: 'URL: /menu-epidemiologia'
  },
  { 
    id: 'inmunizacion', 
    name: 'Eje de Inmunización', 
    color: '#10B981',
    icon: <ShieldCheck size={18} />, 
    url: 'https://sites.google.com/view/saludmiranda04/config-vacunas',
    description: 'URL: /config-vacunas'
  },
  { 
    id: 'suministros', 
    name: 'Eje de Suministros', 
    color: '#F59E0B',
    icon: <Package size={18} />, 
    url: 'https://sites.google.com/view/saludmiranda04/inventario-medico',
    description: 'URL: /inventario-medico'
  },
  { 
    id: 'personal', 
    name: 'Eje de Personal', 
    color: '#8B5CF6',
    icon: <Users size={18} />, 
    url: 'https://sites.google.com/view/saludmiranda04/gestion-personal',
    description: 'URL: /gestion-personal'
  },
  { 
    id: 'infraestructura', 
    name: 'Eje de Infraestructura', 
    color: '#EF4444',
    icon: <Building2 size={18} />, 
    url: 'https://sites.google.com/view/saludmiranda04/estado-ambulatorios',
    description: 'URL: /estado-ambulatorios'
  },
  { 
    id: 'altos_mirandinos', 
    name: 'Eje Altos Mirandinos', 
    color: '#0EA5E9',
    icon: <Mountain size={18} />, 
    url: 'https://sites.google.com/view/saludmiranda04/eje-altos-mirandinos',
    description: 'Eje Territorial 01'
  },
  { 
    id: 'valles_del_tuy', 
    name: 'Eje Valles del Tuy', 
    color: '#84CC16',
    icon: <Mountain size={18} />, 
    url: 'https://sites.google.com/view/saludmiranda04/eje-valles-del-tuy',
    description: 'Eje Territorial 02'
  },
  { 
    id: 'guarenas_guatire', 
    name: 'Eje Guarenas-Guatire', 
    color: '#F97316',
    icon: <Mountain size={18} />, 
    url: 'https://sites.google.com/view/saludmiranda04/eje-guarenas-guatire',
    description: 'Eje Territorial 03'
  },
  { 
    id: 'barlovento', 
    name: 'Eje Barlovento', 
    color: '#06B6D4',
    icon: <Palmtree size={18} />, 
    url: 'https://sites.google.com/view/saludmiranda04/eje-barlovento',
    description: 'Eje Territorial 04'
  },
  { 
    id: 'metropolitano', 
    name: 'Eje Metropolitano', 
    color: '#6366F1',
    icon: <Building2 size={18} />, 
    url: 'https://sites.google.com/view/saludmiranda04/eje-metropolitano',
    description: 'Eje Territorial 05'
  },
];

// Obtiene dimensiones reales de una imagen (URL o base64)
const getImageDimensions = (src: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });
};

export default function InteractiveMirandaMap({ isAdminMode = false }: InteractiveMirandaMapProps) {
  const [activeEje, setActiveEje] = useState<Eje>(INITIAL_EJES[0]);
  const [ejes, setEjes] = useState<Eje[]>(INITIAL_EJES);
  const [backgroundImage, setBackgroundImage] = useState<string | null>('https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?auto=format&fit=crop&q=80&w=2000');
  const [bgUrlInput, setBgUrlInput] = useState('https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?auto=format&fit=crop&q=80&w=2000');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number, y: number }[]>([]);
  const [customPolygons, setCustomPolygons] = useState<{ points: { x: number, y: number }[], ejeId: string, id: string }[]>([]);
  const [editingEje, setEditingEje] = useState<Eje | null>(null);
  const [editForm, setEditForm] = useState({ name: '', url: '', color: '', description: '' });
  const [hoveredMunicipio, setHoveredMunicipio] = useState<string | null>(null);
  const [selectedPolygonId, setSelectedPolygonId] = useState<string | null>(null);
  const [isConsoleMinimized, setIsConsoleMinimized] = useState(false);
  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<'testing' | 'ok' | 'error' | 'disconnected'>('ok');
  const [lastAction, setLastAction] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
  const [noticias, setNoticias] = useState<any[]>([]);
  const [territorialData, setTerritorialData] = useState<Record<string, any>>({});
  const [isNewsOpen, setIsNewsOpen] = useState(false);
  const [showSqlRepair, setShowSqlRepair] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapDimensions, setMapDimensions] = useState({ width: 800, height: 500 });

  // Zoom & Pan states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchStartDist, setTouchStartDist] = useState<number | null>(null);
  const [touchStartZoom, setTouchStartZoom] = useState<number>(1);

  const sqlCode = `CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT rol FROM public.usuarios 
          WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuarios ven su propio perfil" ON public.usuarios;
CREATE POLICY "Usuarios ven su propio perfil" ON public.usuarios
    FOR SELECT TO authenticated
    USING (auth.uid() = id OR get_user_role() = 'admin');`;

  // Solo detecta móvil/orientación, NO modifica viewBox
  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 768);
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    window.addEventListener('orientationchange', checkScreen);
    return () => {
      window.removeEventListener('resize', checkScreen);
      window.removeEventListener('orientationchange', checkScreen);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    console.log(`Notification [${type}]: ${msg}`);
    setLastAction({ msg, type });
    setTimeout(() => setLastAction(null), 5000);
  };

  const runConnectionTest = async () => {
    if (!supabase) {
      setDbStatus('disconnected');
      return false;
    }
    setDbStatus('testing');
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test timeout')), 5000)
      );
      const fetchPromise = supabase.from('mapa_config').select('id').eq('id', 'default').maybeSingle();
      const response: any = await Promise.race([fetchPromise, timeoutPromise]);
      if (response.error) throw response.error;
      setDbStatus('ok');
      return true;
    } catch (err: any) {
      console.error('Connection test failed:', err);
      setDbStatus('error');
      return false;
    }
  };

  // Carga inicial desde Supabase
  useEffect(() => {
    let mounted = true;
    const fetchMapData = async () => {
      setIsLoading(true);
      const hasConnection = await runConnectionTest();
      if (!mounted) return;
      if (!hasConnection || !supabase) {
        setIsLoading(false);
        return;
      }
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Map fetch timeout')), 10000)
        );
        console.log('Fetching map config...');
        const fetchConfig = supabase
          .from('mapa_config')
          .select('*')
          .eq('id', 'default')
          .maybeSingle();
        const configRes: any = await Promise.race([fetchConfig, timeoutPromise]);
        const config = configRes.data;
        const configError = configRes.error;
        if (configError) throw configError;
        if (config && mounted) {
          setBackgroundImage(config.background_image);
          setBgUrlInput(config.background_image || '');
          
          // Obtener dimensiones reales de la imagen cargada
          if (config.background_image) {
            try {
              const dims = await getImageDimensions(config.background_image);
              if (mounted) setMapDimensions({ width: dims.width, height: dims.height });
            } catch (err) {
              console.warn('No se pudieron obtener dimensiones de la imagen remota, usando default');
            }
          }
          
          if (config.ejes_data) {
             const loadedEjes = config.ejes_data.map((e: any) => ({
                ...e,
                icon: INITIAL_EJES.find(ie => ie.id === e.id)?.icon || <Activity size={18} />
             }));
             setEjes(loadedEjes);
             setActiveEje(loadedEjes[0]);
          }
        }
        console.log('Fetching polygons...');
        const fetchPolys = supabase
          .from('mapa_poligonos')
          .select('*');
        const polyRes: any = await Promise.race([fetchPolys, timeoutPromise]);
        const polygons = polyRes.data;
        const polyError = polyRes.error;
        if (polyError) throw polyError;
        if (polygons && mounted) {
          setCustomPolygons(polygons.map((p: any) => ({
            id: p.id,
            ejeId: p.eje_id,
            points: p.points as { x: number, y: number }[]
          })));
        }
        const fetchNews = supabase
          .from('noticias')
          .select('*')
          .order('fecha', { ascending: false })
          .limit(5);
        const newsRes: any = await Promise.race([fetchNews, timeoutPromise]);
        const newsData = newsRes.data;
        if (newsData && mounted) {
          setNoticias(newsData);
        }

        const fetchTerri = supabase
          .from('territorial_data')
          .select('*');
        const terriRes: any = await Promise.race([fetchTerri, timeoutPromise]);
        if (terriRes.data && mounted) {
           const mappedData = terriRes.data.reduce((acc: any, curr: any) => {
              acc[curr.eje_id] = curr;
              return acc;
           }, {});
           setTerritorialData(mappedData);
        }

        if (mounted) console.log('Map data synchronized');
      } catch (err: any) {
        console.error('Error loading map data:', err);
        if (err.message?.includes('recursion')) {
          setDbStatus('error');
          notify('Error de Seguridad RLS en Base de Datos. Contacte Admin.', 'error');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    fetchMapData();
    return () => { mounted = false; };
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
      const finalBg = currentBg !== undefined ? currentBg : backgroundImage;
      const { error } = await supabase
        .from('mapa_config')
        .upsert({
          id: 'default',
          background_image: finalBg,
          ejes_data: ejesToSave,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      if (error) throw error;
      setDbStatus('ok');
      notify('Configuración sincronizada');
    } catch (err: any) {
      console.error('Save error:', err);
      setDbStatus('error');
      notify(err.message || 'Error al guardar', 'error');
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
          }, { onConflict: 'id' });
        if (error) throw error;
        notify('Capa guardada');
     } catch (err: any) {
        console.error('Save poly error:', err);
        notify('Error en capa', 'error');
     }
  };

  const deletePolygon = async (id: string) => {
    console.log('Attempting to delete polygon with ID:', id);
    if (!isAdminMode) {
      console.warn('Delete aborted: Not in admin mode');
      return;
    }
    setCustomPolygons(prev => {
      const filtered = prev.filter(p => p.id !== id);
      console.log(`Local state updated. Remaining polygons: ${filtered.length}`);
      return filtered;
    });
    if (selectedPolygonId === id) {
      setSelectedPolygonId(null);
    }
    if (supabase) {
      try {
        console.log('Sending delete request to Supabase...');
        const { error } = await supabase.from('mapa_poligonos').delete().eq('id', id);
        if (error) {
          console.error('Supabase delete error:', error);
          notify('Error en base de datos: ' + error.message, 'error');
        } else {
          console.log('Supabase delete success');
          notify('Capa eliminada correctamente');
        }
      } catch (err: any) {
        console.error('Delete exception:', err);
        notify('Error al eliminar: ' + (err.message || 'Error desconocido'), 'error');
      }
    } else {
      console.log('Supabase not available, delete was local only');
      notify('Capa eliminada localmente');
    }
  };

  const updatePolygonEje = async (polyId: string, newEjeId: string) => {
    if (!isAdminMode || !supabase) return;
    const updatedPolys = customPolygons.map(p => 
      p.id === polyId ? { ...p, ejeId: newEjeId } : p
    );
    setCustomPolygons(updatedPolys);
    try {
      const { error } = await supabase
        .from('mapa_poligonos')
        .update({ eje_id: newEjeId })
        .eq('id', polyId);
      if (error) throw error;
      notify('Vínculo actualizado');
    } catch (err) {
      console.error('Update poly error:', err);
      notify('Error al actualizar', 'error');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 5) {
        notify('Archivo muy pesado (>5MB)', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        setBackgroundImage(result);
        setBgUrlInput(result.startsWith('data:') ? 'Imagen Base64' : result);
        
        // Fijar viewBox al tamaño real de la imagen
        try {
          const dims = await getImageDimensions(result);
          setMapDimensions({ width: dims.width, height: dims.height });
        } catch (err) {
          console.error('No se pudo obtener dimensiones de la imagen');
        }
        
        await saveMapConfig(undefined, result);
      };
      reader.onerror = () => notify('Error al leer el archivo', 'error');
      reader.readAsDataURL(file);
    }
  };

  const handleUrlUpdate = async () => {
    if (bgUrlInput === 'Imagen Base64' || bgUrlInput === backgroundImage) return;
    setBackgroundImage(bgUrlInput);
    
    // Fijar viewBox al tamaño real de la imagen URL
    try {
      const dims = await getImageDimensions(bgUrlInput);
      setMapDimensions({ width: dims.width, height: dims.height });
    } catch (err) {
      console.error('No se pudo obtener dimensiones de la imagen URL');
    }
    
    await saveMapConfig(undefined, bgUrlInput);
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawingMode) return;
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    
    // Obtener CTM del contenedor de zoom/paneo para deshacer la transformacion y dibujar en los pixeles correctos
    const target = svg.querySelector('#zoom-pan-container') || svg;
    const ctm = (target as any).getScreenCTM();
    if (!ctm) return;
    const svgP = pt.matrixTransform(ctm.inverse());
    if (svgP) {
      setCurrentPoints([...currentPoints, { x: svgP.x, y: svgP.y }]);
    }
  };

  // Mouse & Touch gestores para Paneo (Drag) y Zoom
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDrawingMode) return;
    if (e.button !== 0) return; // Solo boton izquierdo
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDrawingMode || !isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    if (isDrawingMode) return;
    
    // Prevenir scrolling de la pagina principal al interactuar con el mapa
    e.preventDefault();
    const zoomFactor = 1.1;
    let newZoom = zoom;
    if (e.deltaY < 0) {
      newZoom = Math.min(zoom * zoomFactor, 10);
    } else {
      newZoom = Math.max(zoom / zoomFactor, 0.5);
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xs = (mouseX - pan.x) / zoom;
    const ys = (mouseY - pan.y) / zoom;

    setZoom(newZoom);
    setPan({
      x: mouseX - xs * newZoom,
      y: mouseY - ys * newZoom
    });
  };

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (isDrawingMode) return;
    
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      setTouchStartDist(dist);
      setTouchStartZoom(zoom);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (isDrawingMode) return;
    
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      setPan({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    } else if (e.touches.length === 2 && touchStartDist !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const scale = dist / touchStartDist;
      const newZoom = Math.max(0.5, Math.min(10, touchStartZoom * scale));
      
      const rect = e.currentTarget.getBoundingClientRect();
      const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const midY = (t1.clientY + t2.clientY) / 2 - rect.top;
      
      const xs = (midX - pan.x) / zoom;
      const ys = (midY - pan.y) / zoom;
      
      setZoom(newZoom);
      setPan({
        x: midX - xs * newZoom,
        y: midY - ys * newZoom
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchStartDist(null);
  };

  // Botones flotantes de zoom
  const zoomIn = () => {
    const newZoom = Math.min(zoom * 1.3, 10);
    const midX = mapDimensions.width / 2;
    const midY = mapDimensions.height / 2;
    const xs = (midX - pan.x) / zoom;
    const ys = (midY - pan.y) / zoom;
    setZoom(newZoom);
    setPan({
      x: midX - xs * newZoom,
      y: midY - ys * newZoom
    });
  };

  const zoomOut = () => {
    const newZoom = Math.max(zoom / 1.3, 0.5);
    const midX = mapDimensions.width / 2;
    const midY = mapDimensions.height / 2;
    const xs = (midX - pan.x) / zoom;
    const ys = (midY - pan.y) / zoom;
    setZoom(newZoom);
    setPan({
      x: midX - xs * newZoom,
      y: midY - ys * newZoom
    });
  };

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
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
    setIsConsoleMinimized(false);
    await savePolygon(newPolygon);
  };

  const clearCurrentPoints = () => setCurrentPoints([]);

  // ---------- JSX ----------
  return (
    <div className="flex flex-col w-full h-full bg-[#0B1525] text-slate-200 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/5 relative" style={{ maxWidth: '100vw', maxHeight: '100dvh' }}>
      
      {isMobile && (
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 text-white shadow-2xl"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      )}

      {isMobile && !isLandscape && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none sm:hidden">
           <motion.div 
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 0.6 }}
             className="flex flex-col items-center gap-4 text-slate-500"
           >
              <div className="w-16 h-16 border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center animate-bounce">
                 <RefreshCw size={32} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Rote para mejor vista</span>
           </motion.div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 z-[100] bg-[#0B1525]/95 backdrop-blur-3xl flex flex-col items-center justify-center p-4 sm:p-8 text-center overflow-y-auto">
           {!showSqlRepair ? (
             <>
               <div className="relative mb-8">
                  <div className="w-20 h-20 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                     <Database className="text-blue-500 animate-pulse" size={24} />
                  </div>
               </div>
               <div className="max-w-md">
                  <h3 className="text-lg font-black text-white uppercase tracking-[0.3em] mb-2">Miranda Salud SIG</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8">
                    Sincronizando capas geográficas y preferencias globales con la nube de salud...
                  </p>
                  {!supabase && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2rem] mb-8"
                    >
                      <div className="flex items-center justify-center gap-2 text-amber-500 mb-2">
                        <AlertCircle size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Configuración Faltante</span>
                      </div>
                      <p className="text-[10px] text-amber-400/80 mb-2 font-medium">
                         No se detectaron las credenciales de Supabase.
                      </p>
                      <div className="bg-black/20 p-3 rounded-xl text-[8px] font-mono text-slate-400 mb-2 text-left space-y-1">
                        <div>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌'}</div>
                        <div>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌'}</div>
                      </div>
                      <p className="text-[9px] text-slate-500 italic">
                        Verifique que las variables tengan el prefijo <b>VITE_</b> en su proveedor (Vercel/AI Studio).
                      </p>
                    </motion.div>
                  )}
                  {dbStatus === 'error' && supabase && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-[2rem] mb-8"
                    >
                      <div className="flex items-center justify-center gap-2 text-rose-500 mb-2">
                        <AlertCircle size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Error de Sincronización</span>
                      </div>
                      <p className="text-[10px] text-rose-400/80 mb-4 font-medium uppercase tracking-tighter">
                         Se detectó un error de RLS (Recursión Infinita) en Supabase.
                      </p>
                      <button 
                        onClick={() => setShowSqlRepair(true)}
                        className="w-full py-3 bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-900/20 mb-3"
                      >
                        Ver Instrucciones de Reparación
                      </button>
                    </motion.div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button 
                        onClick={() => {
                          setIsLoading(false);
                          notify('Modo Local (Offline) forzado', 'error');
                        }}
                        className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-slate-400 hover:text-white hover:bg-white/10 uppercase transition-all tracking-widest flex items-center justify-center gap-2"
                      >
                        <Play size={10} /> Omitir y Usar Modo Local
                      </button>
                      <button 
                        onClick={runConnectionTest}
                        className="px-8 py-3 bg-blue-500/10 border border-blue-500/20 rounded-full text-[9px] font-black text-blue-400 hover:text-white hover:bg-blue-500/30 uppercase transition-all tracking-widest flex items-center justify-center gap-2 min-w-[140px]"
                      >
                        <RefreshCw size={10} className={dbStatus === 'testing' ? 'animate-spin' : ''} />
                        Reintentar
                      </button>
                  </div>
               </div>
             </>
           ) : (
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="max-w-2xl w-full bg-[#0A111E] border border-white/10 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-2xl text-left max-h-[90vh] overflow-y-auto"
             >
                <div className="flex justify-between items-start mb-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500">
                         <Terminal size={24} />
                      </div>
                      <div>
                         <h3 className="text-xl font-black text-white uppercase tracking-tight">Reparación SQL</h3>
                         <p className="text-xs text-slate-500 font-medium">Siga estos pasos para activar la sincronización</p>
                      </div>
                   </div>
                   <button onClick={() => setShowSqlRepair(false)} className="text-slate-500 hover:text-white">
                      <X size={24} />
                   </button>
                </div>
                <div className="space-y-6">
                   <div className="flex gap-4">
                      <div className="w-6 h-6 shrink-0 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">1</div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                         Vaya a su dashboard de <span className="text-blue-400 font-black">Supabase</span> y entre a la sección <span className="text-white font-bold">SQL Editor</span>.
                      </p>
                   </div>
                   <div className="flex gap-4">
                      <div className="w-6 h-6 shrink-0 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">2</div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                         Copie el siguiente código y ejecútelo presionando <span className="text-white font-bold">RUN</span>.
                      </p>
                   </div>
                   <div className="relative group">
                      <pre className="w-full bg-black/40 border border-white/5 p-6 rounded-2xl text-[10px] text-blue-300 font-mono overflow-x-auto custom-scrollbar">
                         {sqlCode}
                      </pre>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(sqlCode);
                          notify('Código SQL Copiado');
                        }}
                        className="absolute top-4 right-4 p-2 bg-white/10 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                         <Save size={14} />
                      </button>
                   </div>
                   <p className="text-[10px] text-amber-500/80 bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 italic">
                      <b>Nota:</b> Esto desactivará el error "infinite recursion" al separar la lógica de roles de las políticas RLS.
                   </p>
                   <button 
                     onClick={() => { setShowSqlRepair(false); runConnectionTest(); }}
                     className="w-full py-4 bg-white text-black rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-blue-400 hover:text-white transition-all shadow-xl"
                   >
                      Ya ejecuté el SQL, Reintentar ahora
                   </button>
                </div>
             </motion.div>
           )}
        </div>
      )}

      {/* Noticias Sidebar Omitida por solicitud de limpieza */}

      {/* Toolbar Admin Omitida por solicitud */}

      {isAdminMode && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
           <p className="text-[8px] text-slate-600 font-black uppercase tracking-[0.5em] bg-black/40 px-6 py-2 rounded-full border border-white/5">
              Consola SIG • {isDrawingMode ? 'Modo Dibujo Activo' : 'Sincronizado'}
           </p>
        </div>
      )}

      <main className="flex-1 relative flex flex-col overflow-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#112035] to-[#0A111E]" style={{ minHeight: 0 }}>
        <div className="flex-1 flex flex-col items-center justify-center relative p-1 sm:p-4" style={{ minHeight: 0 }}>
          <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
            <div className="w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] md:w-[800px] md:h-[800px] bg-blue-500/10 rounded-full blur-[150px]"></div>
          </div>
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

          <AnimatePresence>
            {isDrawingMode && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`absolute z-[30] bg-blue-600 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full border border-blue-400 shadow-2xl pointer-events-none
                  ${isMobile ? 'top-16 left-4 right-4 text-center' : 'top-20 left-1/2 -translate-x-1/2'}
                `}
              >
                <span className="text-[8px] sm:text-[10px] font-black text-white uppercase tracking-[0.2em]">
                  {isMobile ? 'Toque el mapa para definir puntos' : `Haga clic en el mapa para definir los puntos de la capa (${currentPoints.length})`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full h-full flex items-center justify-center overflow-hidden" style={{ minHeight: 0 }}>
            {!isLandscape && isMobile && (
              <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[35] pointer-events-none flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/80 backdrop-blur-md rounded-full border border-amber-400/50 shadow-xl">
                  <RefreshCw size={12} className="animate-spin text-white" />
                  <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">Rote el teléfono para dibujar</span>
                </div>
              </div>
            )}

            <svg 
              viewBox={`0 0 ${mapDimensions.width} ${mapDimensions.height}`}
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-auto max-w-full transform-gpu transition-transform duration-500"
              style={{ 
                maxHeight: '100%', 
                maxWidth: '100%',
                cursor: isDrawingMode ? 'crosshair' : (isDragging ? 'grabbing' : 'grab'),
                touchAction: 'none'
              }}
              onClick={handleSvgClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              id="interactive-svg-map"
            >
              <rect width={mapDimensions.width} height={mapDimensions.height} fill="transparent" />
              
              <g id="zoom-pan-container" transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {backgroundImage && (
                  <image 
                    href={backgroundImage} 
                    x="0" 
                    y="0" 
                    width={mapDimensions.width} 
                    height={mapDimensions.height} 
                    preserveAspectRatio="xMidYMid meet"
                    className="opacity-90 pointer-events-none" 
                  />
                )}

                {customPolygons.map((poly) => {
                  const eje = ejes.find(e => e.id === poly.ejeId) || activeEje;
                  const isSelected = selectedPolygonId === poly.id;
                  return (
                    <g key={poly.id} className="cursor-pointer group">
                      <polygon 
                        points={poly.points.map(p => `${p.x},${p.y}`).join(' ')}
                        fill={isSelected ? `${eje.color}90` : (hoveredMunicipio === poly.id ? eje.color : `${eje.color}60`)}
                        stroke={isSelected ? '#FFFFFF' : eje.color}
                        strokeWidth={isSelected ? "4" : "3"}
                        strokeOpacity={isSelected || hoveredMunicipio === poly.id ? 1 : 0.8}
                        strokeDasharray={isSelected ? "5,5" : "none"}
                        onMouseEnter={() => setHoveredMunicipio(poly.id)}
                        onMouseLeave={() => setHoveredMunicipio(null)}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (isAdminMode) {
                            setSelectedPolygonId(isSelected ? null : poly.id);
                          } else {
                            window.open(eje.url, '_blank'); 
                          }
                        }}
                        className="transition-all duration-300"
                        style={{ 
                          filter: (isSelected || hoveredMunicipio === poly.id) 
                             ? `drop-shadow(0 0 30px ${eje.color})` 
                             : 'none' 
                        }}
                      />
                      {isAdminMode && isSelected && (
                        <foreignObject 
                          x={poly.points[0].x - 40} 
                          y={poly.points[0].y - 80} 
                          width="100" 
                          height="120"
                          className="overflow-visible"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="flex gap-1.5 p-2 bg-[#0B1525]/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl">
                              {ejes.map(e => (
                                <button
                                  key={e.id}
                                  onClick={(e_evt) => { e_evt.stopPropagation(); updatePolygonEje(poly.id, e.id); }}
                                  className={`w-6 h-6 rounded-lg border-2 transition-all ${
                                    poly.ejeId === e.id ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'
                                   }`}
                                  style={{ backgroundColor: e.color }}
                                  title={e.name}
                                />
                              ))}
                            </div>
                            <button 
                              onClick={(e_evt) => { e_evt.stopPropagation(); deletePolygon(poly.id); }}
                              className="w-12 h-12 flex items-center justify-center bg-rose-600 text-white rounded-full shadow-[0_10px_30px_rgba(225,29,72,0.4)] hover:bg-rose-500 transition-all hover:scale-110 active:scale-95 border-4 border-[#0B1525]"
                              title="Eliminar Polígono"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </foreignObject>
                      )}
                    </g>
                  );
                })}

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
              </g>
            </svg>

            {/* Controles flotantes para mejorar navegabilidad tactil */}
            <div className={`absolute z-30 flex flex-col gap-2 transition-all duration-300
              ${isMobile ? 'bottom-20 right-4' : 'bottom-24 right-6'}
            `}>
              <button
                onClick={zoomIn}
                className="w-10 h-10 flex items-center justify-center bg-black/60 hover:bg-black/80 backdrop-blur-xl rounded-xl border border-white/10 text-white hover:text-blue-400 active:scale-95 hover:scale-105 transition-all shadow-2xl"
                title="Acercar mapa"
              >
                <span className="text-xl font-bold">+</span>
              </button>
              <button
                onClick={zoomOut}
                className="w-10 h-10 flex items-center justify-center bg-black/60 hover:bg-black/80 backdrop-blur-xl rounded-xl border border-white/10 text-white hover:text-blue-400 active:scale-95 hover:scale-105 transition-all shadow-2xl"
                title="Alejar mapa"
              >
                <span className="text-xl font-bold">−</span>
              </button>
              <button
                onClick={resetZoom}
                className="w-10 h-10 flex items-center justify-center bg-black/60 hover:bg-black/80 backdrop-blur-xl rounded-xl border border-white/10 text-white hover:text-blue-400 active:scale-95 hover:scale-105 transition-all shadow-2xl text-[10px] font-black uppercase tracking-tighter"
                title="Restablecer vista"
              >
                Reset
              </button>
            </div>
          </div>
          
          <AnimatePresence>
            {hoveredMunicipio && (() => {
              const poly = customPolygons.find(p => p.id === hoveredMunicipio);
              const eje = poly ? (ejes.find(e => e.id === poly.ejeId) || activeEje) : activeEje;
              const realData = territorialData[eje.id];
              
              return (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`absolute shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-50 pointer-events-none
                    ${isMobile ? 'bottom-16 left-4 right-4' : 'top-[35%] left-[50%] -translate-x-1/2'}
                  `}
                >
                  <div className="bg-[#0A111E]/95 backdrop-blur-xl border border-white/20 p-4 sm:p-5 rounded-[2rem] flex flex-col gap-2 min-w-[200px]">
                     <div className="flex items-center gap-4">
                        <div className="w-3.5 h-3.5 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.4)] animate-pulse" style={{ backgroundColor: eje.color }}></div>
                        <span className="text-[12px] sm:text-[14px] font-black text-white uppercase tracking-[0.25em]">{eje.name}</span>
                     </div>
                     
                     <AnimatePresence>
                       {realData && (
                         <motion.div 
                           initial={{ opacity: 0, height: 0 }}
                           animate={{ opacity: 1, height: 'auto' }}
                           className="pt-2 border-t border-white/10 mt-1"
                         >
                            <div className="flex justify-between items-end mb-1">
                               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Estado Real</span>
                               <span className="text-[14px] font-black text-blue-400">{realData.valor_principal}%</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${realData.valor_principal}%` }}
                                 className="h-full bg-blue-500"
                               />
                            </div>
                            <p className="text-[7px] text-slate-400 uppercase tracking-tighter mt-2 mt-2 font-mono">
                               Sincronizado: {new Date(realData.updated_at).toLocaleTimeString()}
                            </p>
                         </motion.div>
                       )}
                     </AnimatePresence>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>

        <div className={`flex justify-between items-center border-t border-white/5 opacity-40
          ${isMobile ? 'px-3 py-2 text-[7px]' : 'px-6 pt-6 text-[8px]'}
        `}>
          <div className="flex gap-1 sm:gap-1.5 flex-wrap">
            {['METRO', 'ALTOS', 'TUY', 'G-G', 'BARLO'].map(m => (
              <div key={m} className="px-1.5 py-0.5 border border-white/10 rounded-sm text-[6px] sm:text-[8px] font-black text-slate-600">{m}</div>
            ))}
          </div>
          {!isMobile && (
            <div className="flex items-center gap-4 sm:gap-6">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Capa: {activeEje.url.substring(0, 30)}...</span>
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">v2.8.0_MOBILE</span>
            </div>
          )}
        </div>
      </main>

      {isAdminMode && (
        <div 
          className={`bg-[#0A111E] border-t border-white/10 shrink-0 z-[60] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 ease-in-out relative
            ${isConsoleMinimized ? 'h-10' : 'h-auto max-h-[50vh] p-2 sm:p-4 overflow-y-auto'}
          `}>
            <button 
              onClick={() => setIsConsoleMinimized(!isConsoleMinimized)}
              className={`absolute -top-10 bg-[#0A111E] border border-white/10 border-b-0 rounded-t-xl px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-2 text-slate-400 hover:text-white transition-all shadow-2xl
                ${isMobile ? 'right-2' : 'right-10'}
              `}
            >
              {isConsoleMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">
                {isConsoleMinimized ? 'Herramientas' : 'Minimizar'}
              </span>
            </button>
            <div className={`flex flex-col gap-2 sm:gap-4 overflow-hidden ${isConsoleMinimized ? 'hidden' : 'flex'}`}>
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-blue-400" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">HERRAMIENTAS SIG</span>
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                    <div className={`w-2 h-2 rounded-full ${dbStatus === 'ok' ? 'bg-green-500' : 'bg-rose-500'} animate-pulse`}></div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">{dbStatus === 'ok' ? 'OK' : 'ERROR'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={runConnectionTest} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                    <RefreshCw size={12} className={dbStatus === 'testing' ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={() => saveMapConfig()}
                    disabled={isSaving}
                    className="py-1.5 px-6 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
                  >
                    {isSaving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                    Guardar
                  </button>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-6 overflow-x-auto pb-2 custom-scrollbar flex-nowrap">
                <div className="flex flex-col gap-2 sm:gap-3 bg-white/5 p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 min-w-[200px] sm:min-w-[280px]">
                  <div className="flex items-center gap-2">
                    <MousePointer2 size={12} className="text-blue-400" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Dibujo</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {!isDrawingMode ? (
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => {
                            setIsDrawingMode(true);
                            setIsConsoleMinimized(true);
                          }} 
                          className="w-full py-4 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
                        >
                          <Play size={12} /> NUEVO DIBUJO
                        </button>
                        {customPolygons.length > 0 && (
                          <button 
                            onClick={async () => {
                              if (confirm('¿ELIMINAR TODAS LAS CAPAS?')) {
                                setCustomPolygons([]);
                                if (supabase) {
                                  try {
                                    for (const p of customPolygons) {
                                      await supabase.from('mapa_poligonos').delete().eq('id', p.id);
                                    }
                                    notify('Mapa limpiado');
                                  } catch (e) { notify('Error', 'error'); }
                                }
                              }
                            }}
                            className="w-full py-2 bg-rose-500/10 text-rose-500 rounded-xl text-[8px] font-black uppercase border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2"
                          >
                            <Trash2 size={10} /> BORRAR TODO
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={finishPolygon} 
                          className="w-full py-4 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase animate-pulse flex items-center justify-center gap-2"
                        >
                          <Save size={12} /> GUARDAR ({currentPoints.length})
                        </button>
                        <div className="flex gap-2">
                          <button onClick={clearCurrentPoints} className="flex-1 py-2 bg-white/10 text-slate-300 rounded-lg text-[8px] font-black uppercase">Limpiar</button>
                          <button onClick={() => { setIsDrawingMode(false); clearCurrentPoints(); setIsConsoleMinimized(false); }} className="flex-1 py-2 bg-rose-500/10 text-rose-500 rounded-lg text-[8px] font-black uppercase">Cancelar</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 min-w-[250px] sm:min-w-[320px] bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <Layout size={12} className="text-emerald-400" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Capas</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                      {ejes.map((eje) => (
                        <button
                          key={eje.id}
                          onClick={() => setActiveEje(eje)}
                          className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all border-2 ${
                            activeEje.id === eje.id ? 'border-white scale-110' : 'border-transparent opacity-40 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: eje.color }}
                          title={eje.name}
                        >
                          {React.cloneElement(eje.icon as React.ReactElement, { size: 16 })}
                        </button>
                      ))}
                    </div>
                    <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                      <span className="text-[10px] font-black text-blue-400 uppercase">{activeEje.name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-56 sm:w-72 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <Database size={12} className="text-amber-400" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Fondo</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="URL Imagen"
                        value={bgUrlInput}
                        onChange={(e) => setBgUrlInput(e.target.value)}
                        onBlur={handleUrlUpdate}
                        className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-[9px] font-bold text-white focus:border-blue-500/50 outline-none"
                      />
                      <label className="w-10 h-10 flex items-center justify-center bg-white/10 border border-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-all">
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        <Upload size={14} className="text-slate-300" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        #interactive-svg-map {
          cursor: ${isDrawingMode ? 'crosshair' : 'default'};
          touch-action: ${isDrawingMode ? 'none' : 'auto'};
        }
        @media screen and (max-width: 768px) {
          input, select, textarea { font-size: 16px !important; }
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