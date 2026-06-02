import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  Settings, 
  Activity, 
  ShieldCheck, 
  Package, 
  Users, 
  Building2,
  X,
  MousePointer2,
  Layout,
  Upload,
  RefreshCw,
  Mountain,
  Palmtree,
  Terminal,
  Play,
  Loader2,
  Save,
  Trash2,
  Database,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  Move
} from 'lucide-react';

interface Eje {
  id: string;
  name: string;
  color: string;
  icon: React.ReactNode;
  url: string;
  description: string;
}

// ============================================================
// INTERFACES Y PARÁMETROS DEL MAPA
// ============================================================
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

// ============================================================
// CONFIGURACIÓN INICIAL DE EJES (MAPEADO REDIRECCIÓN REAL)
// ============================================================
const INITIAL_EJES: Eje[] = [
  { 
    id: 'epidemiologico', 
    name: 'Eje Epidemiológico', 
    color: '#3B82F6',
    icon: <Activity size={18} />, 
    url: 'https://sites.google.com/view/saludmiranda04/eje-altos-mirandinos',
    description: 'Enlace Matriz: Altos Mirandinos'
  },
  { 
    id: 'inmunizacion', 
    name: 'Eje de Inmunización', 
    color: '#10B981',
    icon: <ShieldCheck size={18} />, 
    url: 'https://sites.google.com/view/saludmiranda04/eje-altos-mirandinos',
    description: 'Enlace Matriz: Altos Mirandinos'
  },
  { 
    id: 'suministros', 
    name: 'Eje de Suministros', 
    color: '#F59E0B',
    icon: <Package size={18} />, 
    url: 'https://sites.google.com/view/saludmiranda04/eje-altos-mirandinos',
    description: 'Enlace Matriz: Altos Mirandinos'
  },
  { 
    id: 'personal', 
    name: 'Eje de Personal', 
    color: '#8B5CF6',
    icon: <Users size={18} />, 
    url: 'https://sites.google.com/view/saludmiranda04/eje-altos-mirandinos',
    description: 'Enlace Matriz: Altos Mirandinos'
  },
  { 
    id: 'infraestructura', 
    name: 'Eje de Infraestructura', 
    color: '#EF4444',
    icon: <Building2 size={18} />, 
    url: 'https://sites.google.com/view/saludmiranda04/eje-altos-mirandinos',
    description: 'Enlace Matriz: Altos Mirandinos'
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
const getImageDimensions = (src: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });
};

const CLINIC_COORDS_MAPPINGS: Record<string, { pX: number, pY: number }> = {
  "ALT_AS_GUA": { pX: 0.35, pY: 0.40 },
  "ALT_AS_CAR_CDI": { pX: 0.38, pY: 0.45 },
  "VAL_AS_OCU": { pX: 0.45, pY: 0.70 },
  "GUA_AS_GG": { pX: 0.60, pY: 0.35 },
  "BAR_AS_MAM": { pX: 0.78, pY: 0.48 },
  "MET_AS_CHA": { pX: 0.50, pY: 0.25 }
};

function mapCodEjeToEjeGeografico(cod: string): string {
  const norm = cod.toLowerCase().trim();
  if (norm === 'altos_mirandinos') return 'ALTOS MIRANDINOS';
  if (norm === 'valles_del_tuy') return 'VALLES DEL TUY';
  if (norm === 'guarenas_guatire' || norm === 'guarenas-guatire') return 'GUARENAS-GUATIRE';
  if (norm === 'barlovento') return 'BARLOVENTO';
  if (norm === 'metropolitano') return 'METROPOLITANO';
  return cod.toUpperCase().replace('_', ' ');
}

export default function InteractiveMirandaMap({ isAdminMode = false }: InteractiveMirandaMapProps) {
  const [activeEje, setActiveEje] = useState<Eje>(INITIAL_EJES[0]);
  const [ejes, setEjes] = useState<Eje[]>(INITIAL_EJES);
  const [backgroundImage, setBackgroundImage] = useState<string | null>('https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?auto=format&fit=crop&q=80&w=2000');
  const [bgUrlInput, setBgUrlInput] = useState('https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?auto=format&fit=crop&q=80&w=2000');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number, y: number }[]>([]);
  const [customPolygons, setCustomPolygons] = useState<{ points: { x: number, y: number }[], ejeId: string, id: string }[]>([]);
  const [hoveredMunicipio, setHoveredMunicipio] = useState<string | null>(null);
  const [selectedPolygonId, setSelectedPolygonId] = useState<string | null>(null);
  const [isConsoleMinimized, setIsConsoleMinimized] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<'testing' | 'ok' | 'error' | 'disconnected'>('ok');
  const [, setLastAction] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
  const [noticias, setNoticias] = useState<any[]>([]);
  const [territorialData, setTerritorialData] = useState<Record<string, any>>({});
  const [showSqlRepair, setShowSqlRepair] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapDimensions, setMapDimensions] = useState({ width: 800, height: 500 });

  const { profile } = useAuth();
  const [transitoReportes, setTransitoReportes] = useState<any[]>([]);
  const [hoveredCentro, setHoveredCentro] = useState<any | null>(null);
  
  const [selectedCentroEdit, setSelectedCentroEdit] = useState<any | null>(null);
  const [isClinicAdminCollapsed, setIsClinicAdminCollapsed] = useState(true);
  const [isReallocatingPin, setIsReallocatingPin] = useState<string | null>(null);
  const [clinicCoordsOverrides, setClinicCoordsOverrides] = useState<Record<string, { pX: number, pY: number }>>({});
  const [savingClinicChanges, setSavingClinicChanges] = useState(false);
  const [isDragModeActive, setIsDragModeActive] = useState(false);
  const [draggingPinId, setDraggingPinId] = useState<string | null>(null);
  const [savingDragCoords, setSavingDragCoords] = useState(false);
  const [recentlyUpdatedCentros, setRecentlyUpdatedCentros] = useState<Record<string, boolean>>({});
  const [, setFeedEvents] = useState<string[]>([]);

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;`;

  const handleSaveAllCoords = async () => {
    if (!supabase) return;
    setSavingDragCoords(true);
    try {
      const { error } = await supabase
        .from('mapa_config')
        .upsert({
          id: 'coords_overrides',
          ejes_data: clinicCoordsOverrides,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      if (error) throw error;
      notify('¡Ubicaciones guardadas en la nube!', 'success');
      setIsDragModeActive(false);
    } catch (err: any) {
      notify(err.message || 'Error al guardar las ubicaciones', 'error');
    } finally {
      setSavingDragCoords(false);
    }
  };

  const getClinicCoords = (pin: any) => {
    const id = pin.id_centro;
    if (clinicCoordsOverrides[id]) return clinicCoordsOverrides[id];
    if (CLINIC_COORDS_MAPPINGS[id]) return CLINIC_COORDS_MAPPINGS[id];
    
    let sum = 0;
    for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
    const offsetRefX = (sum % 20) / 320 - 0.03;
    const offsetRefY = ((sum >> 2) % 20) / 320 - 0.03;

    const ejeNormal = (pin.eje_geografico || '').toUpperCase().trim();
    if (ejeNormal.includes('ALT') || id.toUpperCase().includes('ALT') || id.toUpperCase().includes('GUA_AS_GUA') || id.toUpperCase().includes('CARRIZAL') || id.toUpperCase().includes('LOS_TEQUES')) {
      return { pX: 0.36 + offsetRefX, pY: 0.42 + offsetRefY };
    } else if (ejeNormal.includes('VAL') || id.toUpperCase().includes('VAL') || id.toUpperCase().includes('OCU') || id.toUpperCase().includes('YARE') || id.toUpperCase().includes('CHARALLAVE')) {
      return { pX: 0.45 + offsetRefX, pY: 0.68 + offsetRefY };
    } else if (ejeNormal.includes('GUA') || id.toUpperCase().includes('GUA') || id.toUpperCase().includes('GG') || id.toUpperCase().includes('GUARENAS') || id.toUpperCase().includes('GUATIRE')) {
      return { pX: 0.59 + offsetRefX, pY: 0.34 + offsetRefY };
    } else if (ejeNormal.includes('BAR') || id.toUpperCase().includes('BAR') || id.toUpperCase().includes('MAM') || id.toUpperCase().includes('HIG') || id.toUpperCase().includes('HIGUEROTE')) {
      return { pX: 0.77 + offsetRefX, pY: 0.46 + offsetRefY };
    } else if (ejeNormal.includes('MET') || id.toUpperCase().includes('MET') || id.toUpperCase().includes('CHA') || id.toUpperCase().includes('PET') || id.toUpperCase().includes('PETARE')) {
      return { pX: 0.49 + offsetRefX, pY: 0.24 + offsetRefY };
    }
    return { pX: 0.5 + offsetRefX * 2, pY: 0.5 + offsetRefY * 2 };
  };

  const handleUpdateClinicEje = async (idCentro: string, newEje: string) => {
    if (!supabase) return;
    setSavingClinicChanges(true);
    try {
      const { error } = await supabase
        .from('transito_reportes')
        .update({ eje_geografico: newEje })
        .eq('id_centro', idCentro);
      if (error) throw error;
      
      setTransitoReportes(prev => prev.map(r => r.id_centro === idCentro ? { ...r, eje_geografico: newEje } : r));
      if (selectedCentroEdit?.id_centro === idCentro) {
        setSelectedCentroEdit(prev => prev ? { ...prev, eje_geografico: newEje } : null);
      }
      notify('Eje Geográfico actualizado correctamente');
    } catch (err: any) {
      notify(err.message || 'Error al actualizar eje', 'error');
    } finally {
      setSavingClinicChanges(false);
    }
  };

  const handleResetClinicCoords = async (idCentro: string) => {
    const updatedOverrides = { ...clinicCoordsOverrides };
    delete updatedOverrides[idCentro];
    setClinicCoordsOverrides(updatedOverrides);
    notify('Ubicación predeterminada restaurada');
    if (supabase) {
      try {
        await supabase
          .from('mapa_config')
          .upsert({
            id: 'coords_overrides',
            ejes_data: updatedOverrides,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
      } catch (err) {
        console.error(err);
      }
    }
  };

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

  useEffect(() => {
    const loadReportes = async () => {
      if (!supabase) return;
      const { data, error } = await supabase.from('transito_reportes').select('*');
      if (!error && data) setTransitoReportes(data);
    };
    loadReportes();

    if (!supabase) return;
    const channel = supabase
      .channel('map_realtime_semaforo')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transito_reportes' }, (payload) => {
        let updated: any = null;
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          updated = payload.new as any;
        }
        if (updated && updated.id_centro) {
          setTransitoReportes(prev => {
            const exists = prev.some(r => r.id_centro === updated.id_centro);
            return exists ? prev.map(r => r.id_centro === updated.id_centro ? { ...r, ...updated } : r) : [updated, ...prev];
          });
          setRecentlyUpdatedCentros(prev => ({ ...prev, [updated.id_centro]: true }));
          setTimeout(() => setRecentlyUpdatedCentros(prev => ({ ...prev, [updated.id_centro]: false })), 6000);
          
          const msg = `El centro ${updated.nombre_centro} actualizó a Semáforo ${updated.estado_semaforo}.`;
          setFeedEvents(prev => [msg, ...prev.slice(0, 19)]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (profile?.cod_asic) {
      let pX = 0.38, pY = 0.45;
      if (profile.cod_asic.toUpperCase().includes('PARACOTOS')) { pX = 0.33; pY = 0.58; }
      else if (profile.cod_asic.toUpperCase().includes('GUA')) { pX = 0.35; pY = 0.40; }

      const targetX = pX * mapDimensions.width;
      const targetY = pY * mapDimensions.height;
      const newZoom = 2.8;
      setZoom(newZoom);
      setPan({ x: (mapDimensions.width / 2) - targetX * newZoom, y: (mapDimensions.height / 2) - targetY * newZoom });
    }
  }, [profile?.cod_asic, mapDimensions.width, mapDimensions.height]);

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
    setLastAction({ msg, type });
  };

  const runConnectionTest = async () => {
    if (!supabase) { setDbStatus('disconnected'); return false; }
    setDbStatus('testing');
    try {
      await supabase.from('mapa_config').select('id').eq('id', 'default').maybeSingle();
      setDbStatus('ok');
      return true;
    } catch {
      setDbStatus('error');
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchMapData = async () => {
      setIsLoading(true);
      const hasConnection = await runConnectionTest();
      if (!mounted || !hasConnection || !supabase) { setIsLoading(false); return; }
      try {
        const configRes: any = await supabase.from('mapa_config').select('*').eq('id', 'default').maybeSingle();
        if (configRes.data && mounted) {
          setBackgroundImage(configRes.data.background_image);
          setBgUrlInput(configRes.data.background_image || '');
          if (configRes.data.background_image) {
            const dims = await getImageDimensions(configRes.data.background_image);
            if (mounted) setMapDimensions({ width: dims.width, height: dims.height });
          }
        }
        
        const coordsRes: any = await supabase.from('mapa_config').select('*').eq('id', 'coords_overrides').maybeSingle();
        if (coordsRes.data?.ejes_data && mounted) setClinicCoordsOverrides(coordsRes.data.ejes_data);

        const polyRes: any = await supabase.from('mapa_poligonos').select('*');
        if (polyRes.data && mounted) {
          setCustomPolygons(polyRes.data.map((p: any) => ({ id: p.id, ejeId: p.eje_id, points: p.points })));
        }

        const newsRes: any = await supabase.from('noticias').select('*').limit(5);
        if (newsRes.data && mounted) setNoticias(newsRes.data);

        const terriRes: any = await supabase.from('territorial_data').select('*');
        if (terriRes.data && mounted) {
          setTerritorialData(terriRes.data.reduce((acc: any, curr: any) => ({ ...acc, [curr.eje_id]: curr }), {}));
        }
      } catch (err) {
        console.error(err);
      } finally { if (mounted) setIsLoading(false); }
    };
    fetchMapData();
    return () => { mounted = false; };
  }, []);

  const saveMapConfig = async (currentBg?: string | null) => {
    if (!supabase || !isAdminMode) return;
    setIsSaving(true);
    try {
      const ejesToSave = ejes.map(e => ({ id: e.id, name: e.name, color: e.color, url: e.url, description: e.description }));
      await supabase.from('mapa_config').upsert({ id: 'default', background_image: currentBg !== undefined ? currentBg : backgroundImage, ejes_data: ejesToSave, updated_at: new Date().toISOString() });
      setDbStatus('ok');
    } catch { setDbStatus('error'); } finally { setIsSaving(false); }
  };

  const savePolygon = async (poly: any) => {
     if (!supabase || !isAdminMode) return;
     try { await supabase.from('mapa_poligonos').upsert({ id: poly.id, eje_id: poly.ejeId, points: poly.points }); } catch {}
  };

  const deletePolygon = async (id: string) => {
    if (!isAdminMode) return;
    setCustomPolygons(prev => prev.filter(p => p.id !== id));
    if (selectedPolygonId === id) setSelectedPolygonId(null);
    if (supabase) await supabase.from('mapa_poligonos').delete().eq('id', id);
  };

  const updatePolygonEje = async (polyId: string, newEjeId: string) => {
    if (!isAdminMode || !supabase) return;
    setCustomPolygons(prev => prev.map(p => p.id === polyId ? { ...p, ejeId: newEjeId } : p));
    await supabase.from('mapa_poligonos').update({ eje_id: newEjeId }).eq('id', polyId);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        setBackgroundImage(result);
        const dims = await getImageDimensions(result);
        setMapDimensions({ width: dims.width, height: dims.height });
        await saveMapConfig(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getMappedCoordsFromEvent = (clientX: number, clientY: number, svgElement: SVGSVGElement) => {
    const pt = svgElement.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const target = svgElement.querySelector('#zoom-pan-container') || svgElement;
    const ctm = (target as any).getScreenCTM();
    if (!ctm) return null;
    const svgP = pt.matrixTransform(ctm.inverse());
    return svgP ? { pX: svgP.x / mapDimensions.width, pY: svgP.y / mapDimensions.height, x: svgP.x, y: svgP.y } : null;
  };

  // Unificación de Clic: Maneja pincel, reubicación y dibujo de forma orgánica y precisa
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const coords = getMappedCoordsFromEvent(e.clientX, e.clientY, e.currentTarget);
    if (!coords) return;

    if (isReallocatingPin) {
      const idCentro = isReallocatingPin;
      const updatedOverrides = { ...clinicCoordsOverrides, [idCentro]: { pX: coords.pX, pY: coords.pY } };
      setClinicCoordsOverrides(updatedOverrides);
      setIsReallocatingPin(null);
      if (supabase) {
        supabase.from('mapa_config').upsert({ id: 'coords_overrides', ejes_data: updatedOverrides, updated_at: new Date().toISOString() }).then(() => {
          if (selectedCentroEdit?.id_centro === idCentro) setSelectedCentroEdit(prev => prev ? { ...prev } : null);
          notify('Ubicación sincronizada');
        });
      }
      return;
    }

    if (isDrawingMode) {
      setCurrentPoints(prev => [...prev, { x: coords.x, y: coords.y }]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDrawingMode || draggingPinId || e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDrawingMode) return;
    if (draggingPinId) {
      const coords = getMappedCoordsFromEvent(e.clientX, e.clientY, e.currentTarget);
      if (coords) setClinicCoordsOverrides(prev => ({ ...prev, [draggingPinId]: { pX: coords.pX, pY: coords.pY } }));
      return;
    }
    if (isDragging) setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    if (draggingPinId) { setDraggingPinId(null); notify('Ajuste temporal listo. Guarde cambios.'); }
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    if (isDrawingMode) return;
    e.preventDefault();
    const zoomFactor = 1.1;
    const newZoom = e.deltaY < 0 ? Math.min(zoom * zoomFactor, 10) : Math.max(zoom / zoomFactor, 0.5);
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setPan({ x: mouseX - ((mouseX - pan.x) / zoom) * newZoom, y: mouseY - ((mouseY - pan.y) / zoom) * newZoom });
    setZoom(newZoom);
  };

  const finishPolygon = async () => {
    if (currentPoints.length < 3) return;
    const newPolygon = { id: Math.random().toString(36).substr(2, 9), points: currentPoints, ejeId: activeEje.id };
    setCustomPolygons([...customPolygons, newPolygon]);
    setCurrentPoints([]);
    setIsDrawingMode(false);
    setIsConsoleMinimized(false);
    await savePolygon(newPolygon);
  };

  return (
    <div className="flex flex-col w-full h-full bg-[#0B1525] text-slate-200 overflow-hidden relative" style={{ maxWidth: '100vw', maxHeight: '100dvh' }}>
      {isMobile && (
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <button onClick={toggleFullscreen} className="p-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 text-white shadow-2xl">
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 z-[100] bg-[#0B1525]/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center">
           {!showSqlRepair ? (
             <>
               <div className="relative mb-8">
                  <div className="w-20 h-20 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center"><Database className="text-blue-500" size={24} /></div>
               </div>
               <h3 className="text-lg font-black text-white uppercase tracking-[0.3em] mb-2">Miranda Salud SIG</h3>
               <div className="flex gap-3 justify-center mt-4">
                  <button onClick={() => setIsLoading(false)} className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase">Modo Local</button>
                  <button onClick={runConnectionTest} className="px-6 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-[10px] font-black uppercase">Reintentar</button>
               </div>
             </>
           ) : (
             <div className="max-w-2xl bg-[#0A111E] border border-white/10 p-8 rounded-[2rem] text-left">
                <pre className="bg-black/40 p-4 rounded-xl text-[10px] font-mono text-blue-300 overflow-x-auto">{sqlCode}</pre>
                <button onClick={() => { setShowSqlRepair(false); runConnectionTest(); }} className="w-full mt-4 py-3 bg-white text-black rounded-xl text-xs font-black uppercase">Listo, Reintentar</button>
             </div>
           )}
        </div>
      )}

      <main className="flex-1 relative flex flex-col overflow-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#112035] to-[#0A111E]">
        <div className="flex-1 flex flex-col items-center justify-center relative p-4">
          <svg 
            viewBox={`0 0 ${mapDimensions.width} ${mapDimensions.height}`}
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-auto max-w-full transform-gpu transition-transform duration-300"
            style={{ maxHeight: '100%', maxWidth: '100%', cursor: isDrawingMode ? 'crosshair' : (isDragging ? 'grabbing' : 'grab'), touchAction: 'none' }}
            onClick={handleSvgClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <rect width={mapDimensions.width} height={mapDimensions.height} fill="transparent" />
            <g id="zoom-pan-container" transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {backgroundImage && <image href={backgroundImage} x="0" y="0" width={mapDimensions.width} height={mapDimensions.height} className="opacity-90 pointer-events-none" />}

              {customPolygons.map((poly) => {
                const eje = ejes.find(e => e.id === poly.ejeId) || activeEje;
                const isSelected = selectedPolygonId === poly.id;
                return (
                  <g key={poly.id} className="cursor-pointer">
                    <polygon 
                      points={poly.points.map(p => `${p.x},${p.y}`).join(' ')}
                      fill={isSelected ? `${eje.color}90` : (hoveredMunicipio === poly.id ? eje.color : `${eje.color}60`)}
                      stroke={isSelected ? '#FFFFFF' : eje.color}
                      strokeWidth={isSelected ? "4" : "3"}
                      onMouseEnter={() => setHoveredMunicipio(poly.id)}
                      onMouseLeave={() => setHoveredMunicipio(null)}
                      onClick={(e) => { e.stopPropagation(); isAdminMode ? setSelectedPolygonId(isSelected ? null : poly.id) : window.open(eje.url, '_blank'); }}
                    />
                    {isAdminMode && isSelected && (
                      <foreignObject x={poly.points[0].x - 40} y={poly.points[0].y - 80} width="120" height="120" className="overflow-visible">
                        <div className="flex flex-col items-center gap-2 bg-[#0B1525]/90 p-2 rounded-xl border border-white/20">
                          <button onClick={(ev) => { ev.stopPropagation(); deletePolygon(poly.id); }} className="p-2 bg-rose-600 text-white rounded-full"><Trash2 size={14} /></button>
                        </div>
                      </foreignObject>
                    )}
                  </g>
                );
              })}

              {currentPoints.length > 0 && (
                <g>
                  <polyline points={currentPoints.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={activeEje.color} strokeWidth="3" className="animate-pulse" />
                  {currentPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="5" fill="white" stroke={activeEje.color} strokeWidth="2" />)}
                </g>
              )}

              {transitoReportes.filter(r => profile?.cod_asic ? (r.asic || '').toUpperCase() === profile.cod_asic.toUpperCase() : true).map((pin) => {
                const coords = getClinicCoords(pin);
                const markerColor = pin.estado_semaforo === 'Verde' ? '#10B981' : pin.estado_semaforo === 'Amarillo' ? '#F59E0B' : pin.estado_semaforo === 'Rojo' ? '#EF4444' : '#94A3B8';
                return (
                  <g 
                    key={pin.id_centro} 
                    transform={`translate(${coords.pX * mapDimensions.width}, ${coords.pY * mapDimensions.height})`}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredCentro(pin)}
                    onMouseLeave={() => setHoveredCentro(null)}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedCentroEdit(pin); }}
                    onMouseDown={(e) => { if (isDragModeActive) { e.stopPropagation(); setDraggingPinId(pin.id_centro); } }}
                  >
                    {recentlyUpdatedCentros[pin.id_centro] && <circle r="18" fill="none" stroke="#F59E0B" strokeWidth="3" className="animate-ping" />}
                    <circle r="10" fill={markerColor} stroke={selectedCentroEdit?.id_centro === pin.id_centro ? '#00E5FF' : '#FFFFFF'} strokeWidth="2.5" />
                    <circle r="3.5" fill="#FFFFFF" />
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Ficha Flotante del Centro */}
          <AnimatePresence>
            {selectedCentroEdit && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-5 right-5 z-[45] w-80 bg-slate-900/98 border border-white/20 p-5 rounded-3xl shadow-2xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-cyan-400 uppercase">Ficha ASIC</span>
                  <button onClick={() => setSelectedCentroEdit(null)} className="text-xs text-slate-400 hover:text-white uppercase font-bold">Cerrar</button>
                </div>
                <h4 className="text-sm font-black uppercase text-white">{selectedCentroEdit.nombre_centro}</h4>
                <p className="text-[10px] text-slate-400 font-bold mb-4">{selectedCentroEdit.asic}</p>

                {(isAdminMode || profile?.rol === 'admin') && (
                  <div className="space-y-3 border-t border-white/10 pt-3">
                    <button onClick={() => setIsClinicAdminCollapsed(!isClinicAdminCollapsed)} className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase text-amber-400 flex justify-between">
                      <span>Herramientas de Coordenadas</span>
                      <span>{isClinicAdminCollapsed ? 'Ver' : 'Ocultar'}</span>
                    </button>
                    {!isClinicAdminCollapsed && (
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => { setIsReallocatingPin(selectedCentroEdit.id_centro); notify('Haz clic en el mapa para posicionar'); }} className="flex-1 py-2 bg-amber-500 text-slate-950 font-black text-[9px] uppercase rounded-lg">Un Clic</button>
                        <button onClick={() => { setIsDragModeActive(!isDragModeActive); }} className={`flex-1 py-2 font-black text-[9px] uppercase rounded-lg ${isDragModeActive ? 'bg-emerald-500 text-slate-950' : 'bg-indigo-600 text-white'}`}>Arrastrar</button>
                        {clinicCoordsOverrides[selectedCentroEdit.id_centro] && (
                          <button onClick={() => handleResetClinicCoords(selectedCentroEdit.id_centro)} className="p-2 bg-red-600/20 text-red-400 rounded-lg"><Trash2 size={12} /></button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Diálogo de Arrastre Activo */}
          <AnimatePresence>
            {isDragModeActive && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-6 left-1/2 -translate-x-1/2 z-[48] bg-slate-900 border border-blue-500/40 p-4 rounded-2xl flex items-center gap-4 shadow-2xl">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Modo Arrastre Activo</span>
                <button onClick={handleSaveAllCoords} disabled={savingDragCoords} className="px-4 py-1.5 bg-emerald-500 text-emerald-950 text-[9px] font-black uppercase rounded-lg flex items-center gap-1">
                  {savingDragCoords ? <RefreshCw size={10} className="animate-spin" /> : <Save size={10} />} Guardar Capa
                </button>
                <button onClick={() => setIsDragModeActive(false)} className="text-[9px] font-bold text-slate-400 uppercase">Salir</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Consola SIG Inferior */}
      {isAdminMode && (
        <div className={`bg-[#0A111E] border-t border-white/10 shrink-0 z-[60] transition-all duration-300 relative ${isConsoleMinimized ? 'h-10' : 'p-4'}`}>
          <button onClick={() => setIsConsoleMinimized(!isConsoleMinimized)} className="absolute -top-8 right-4 bg-[#0A111E] border border-white/10 border-b-0 rounded-t-lg px-4 py-1 flex items-center gap-2 text-slate-400 text-[9px] font-black uppercase">
            {isConsoleMinimized ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Control
          </button>
          {!isConsoleMinimized && (
            <div className="flex gap-4 overflow-x-auto py-2">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 min-w-[240px]">
                <span className="text-[9px] font-black text-slate-400 block mb-2 uppercase">Dibujo Vectorial</span>
                {!isDrawingMode ? (
                  <button onClick={() => { setIsDrawingMode(true); setIsConsoleMinimized(true); }} className="w-full py-2 bg-blue-600 text-white font-black text-[10px] uppercase rounded-lg">Nuevo Polígono</button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={finishPolygon} className="flex-1 py-2 bg-green-600 text-white font-black text-[10px] uppercase rounded-lg">Guardar ({currentPoints.length})</button>
                    <button onClick={() => { setIsDrawingMode(false); setCurrentPoints([]); }} className="py-2 px-3 bg-white/10 text-slate-400 text-[10px] uppercase rounded-lg">X</button>
                  </div>
                )}
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 min-w-[200px] flex flex-col justify-between">
                <span className="text-[9px] font-black text-slate-400 block uppercase">Capa Activa</span>
                <select value={activeEje.id} onChange={(e) => setActiveEje(ejes.find(ej => ej.id === e.target.value) || ejes[0])} className="bg-black/40 text-white text-[10px] p-2 rounded-lg border border-white/10 outline-none font-bold">
                  {ejes.map(ej => <option key={ej.id} value={ej.id}>{ej.name}</option>)}
                </select>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 min-w-[240px]">
                <span className="text-[9px] font-black text-slate-400 block mb-2 uppercase">Fondo del Mapa</span>
                <div className="flex gap-2">
                  <input type="text" value={bgUrlInput} onChange={(e) => setBgUrlInput(e.target.value)} onBlur={() => { setBackgroundImage(bgUrlInput); saveMapConfig(bgUrlInput); }} className="flex-1 bg-black/60 border border-white/10 rounded-lg px-2 text-[10px] text-white outline-none" />
                  <label className="p-2 bg-white/10 rounded-lg cursor-pointer"><Upload size={14} /><input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} /></label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}