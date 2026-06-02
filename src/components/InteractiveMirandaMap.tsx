import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  Activity, 
  ShieldCheck, 
  Package, 
  Users, 
  Building2,
  Mountain,
  Palmtree,
  Save,
  RefreshCw,
  Image as ImageIcon,
  Edit2,
  Sliders
} from 'lucide-react';

interface EjeTerritorial {
  id: string;
  name: string;
  url: string;
  bgImage: string;
  description: string;
}

const INITIAL_TERRITORIALES: EjeTerritorial[] = [
  { 
    id: 'altos_mirandinos', 
    name: 'Eje Altos Mirandinos', 
    url: 'https://sites.google.com/view/saludmiranda04/eje-altos-mirandinos',
    bgImage: 'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?auto=format&fit=crop&q=80&w=600',
    description: 'Eje Territorial 01'
  },
  { 
    id: 'valles_del_tuy', 
    name: 'Eje Valles del Tuy', 
    url: 'https://sites.google.com/view/saludmiranda04/eje-valles-del-tuy',
    bgImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600',
    description: 'Eje Territorial 02'
  },
  { 
    id: 'barlovento', 
    name: 'Eje Barlovento', 
    url: 'https://sites.google.com/view/saludmiranda04/eje-barlovento',
    bgImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=600',
    description: 'Eje Territorial 04'
  },
  { 
    id: 'guarenas_guatire', 
    name: 'Eje Guarenas-Guatire', 
    url: 'https://sites.google.com/view/saludmiranda04/eje-guarenas-guatire',
    bgImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600',
    description: 'Eje Territorial 03'
  },
  { 
    id: 'metropolitano', 
    name: 'Eje Metropolitano', 
    url: 'https://sites.google.com/view/saludmiranda04/eje-metropolitano',
    bgImage: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=600',
    description: 'Eje Territorial 05'
  },
];

export default function InteractiveMirandaCards({ isAdminMode = false }) {
  const [ejes, setEjes] = useState<EjeTerritorial[]>(INITIAL_TERRITORIALES);
  const [transitoReportes, setTransitoReportes] = useState<any[]>([]);
  const [editingEje, setEditingEje] = useState<EjeTerritorial | null>(null);
  const [editName, setEditName] = useState('');
  const [editBg, setEditBg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!supabase) return;
      
      const { data: reportes } = await supabase.from('transito_reportes').select('*');
      if (reportes) setTransitoReportes(reportes);

      const { data: config } = await supabase.from('mapa_config').select('*').eq('id', 'fichas_territoriales').maybeSingle();
      if (config?.ejes_data) {
        setEjes(config.ejes_data);
      }
    };

    loadInitialData();

    const channel = supabase
      ?.channel('fichas_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transito_reportes' }, () => {
        supabase.from('transito_reportes').select('*').then(({ data }) => {
          if (data) setTransitoReportes(data);
        });
      })
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const getReportCountForEje = (ejeId: string) => {
    return transitoReportes.filter(r => {
      const geo = (r.eje_geografico || '').toLowerCase().trim();
      if (ejeId === 'altos_mirandinos') return geo.includes('altos') || geo.includes('guaicaipuro') || geo.includes('los teques') || geo.includes('carrizal') || geo.includes('salias');
      if (ejeId === 'valles_del_tuy') return geo.includes('tuy') || geo.includes('ocumare') || geo.includes('charallave') || geo.includes('yare');
      if (ejeId === 'barlovento') return geo.includes('barlovento') || geo.includes('higuerote') || geo.includes('mamporal');
      if (ejeId === 'guarenas_guatire') return geo.includes('guarenas') || geo.includes('guatire') || geo.includes('plaza') || geo.includes('zamora');
      if (ejeId === 'metropolitano') return geo.includes('metropolitano') || geo.includes('chacao') || geo.includes('petare') || geo.includes('sucre');
      return false;
    }).length;
  };

  const getFillPercentage = (ejeId: string) => {
    if (transitoReportes.length === 0) return 0;
    const counts = ejes.map(e => getReportCountForEje(e.id));
    const maxCount = Math.max(...counts, 1);
    const currentCount = getReportCountForEje(ejeId);
    return (currentCount / maxCount) * 100;
  };

  const handleSaveEjeConfig = async () => {
    if (!editingEje || !supabase) return;
    setIsSaving(true);

    const updatedEjes = ejes.map(e => 
      e.id === editingEje.id ? { ...e, name: editName, bgImage: editBg } : e
    );

    try {
      await supabase.from('mapa_config').upsert({
        id: 'fichas_territoriales',
        ejes_data: updatedEjes,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      setEjes(updatedEjes);
      setEditingEje(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    /* Cambio 1: Fondo general blanco/gris muy suave limpio */
    <div className="w-full h-full bg-[#F8FAFC] p-6 text-slate-800 flex flex-col justify-between overflow-y-auto select-none">
      
      {/* Encabezado Principal */}
      <div className="mb-6 flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
            <Sliders size={20} className="text-emerald-600 animate-pulse" /> Ejes de Atencion
          </h2>
          <p className="text-xs text-slate-500 font-medium">Reporte en tiempo real.</p>
        </div>
        {/* Badge estilizado para fondo claro */}
        <div className="px-4 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-700 shadow-sm">
          En vivo: {transitoReportes.length} Reportes Totales
        </div>
      </div>

      {/* Rejilla de Fichas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1 items-center">
        {ejes.map((eje) => {
          const reportCount = getReportCountForEje(eje.id);
          const fillPercent = getFillPercentage(eje.id);

          return (
            /* Cambio 2: Fichas blancas con sombra limpia y bordes suaves */
            <div 
              key={eje.id}
              className="relative h-64 w-full rounded-2xl border border-slate-200/80 overflow-hidden bg-white group shadow-md hover:shadow-xl flex flex-col justify-between p-4 transition-all duration-300 hover:border-emerald-500/40"
            >
              {/* Cambio 3: Imágenes vivas a color (sin mix-blend-luminosity) pero manteniendo opacidad equilibrada */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-45 transition-opacity duration-300 pointer-events-none"
                style={{ backgroundImage: `url(${eje.bgImage})` }}
              />

              {/* Cambio 4: Sombra verde un poco más intensa/viva pero transparente para el fondo claro */}
              <motion.div 
                className="absolute bottom-0 left-0 right-0 bg-emerald-500/15 border-t border-emerald-500/25 pointer-events-none"
                initial={{ height: 0 }}
                animate={{ height: `${fillPercent}%` }}
                transition={{ type: 'spring', stiffness: 40, damping: 15 }}
              />

              {/* Contenido Superior */}
              <div className="relative z-10 flex justify-between items-start w-full">
                <span className="text-[10px] font-black tracking-widest bg-emerald-600 text-white px-2.5 py-1 rounded-md shadow-sm">
                  {reportCount} {reportCount === 1 ? 'REPORTE' : 'REPORTES'}
                </span>

                {isAdminMode && (
                  <button 
                    onClick={() => {
                      setEditingEje(eje);
                      setEditName(eje.name);
                      setEditBg(eje.bgImage);
                    }}
                    className="p-1.5 bg-slate-100 hover:bg-slate-900 text-slate-500 hover:text-white rounded-lg transition-colors border border-slate-200 shadow-sm"
                  >
                    <Edit2 size={12} />
                  </button>
                )}
              </div>

              {/* Contenido Inferior: Textos oscuros de alta legibilidad */}
              <div className="relative z-10 w-full pt-8">
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-wide mb-3 group-hover:text-emerald-700 transition-colors">
                  {eje.name}
                </h3>
                
                {/* Botón adaptado a la estética clara */}
                <a 
                  href={eje.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full py-2 bg-slate-50 group-hover:bg-emerald-600 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl text-[10px] font-black uppercase tracking-widest text-center block text-slate-700 group-hover:text-white border border-slate-200 group-hover:border-transparent shadow-sm"
                >
                  Ver Sala Virtual
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal del Administrador Adaptado */}
      <AnimatePresence>
        {editingEje && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white border border-slate-200 p-6 rounded-3xl w-full max-w-md shadow-2xl"
            >
              <h3 className="text-sm font-black uppercase text-slate-900 tracking-widest mb-4 flex items-center gap-2">
                <ImageIcon className="text-emerald-600" size={16} /> Configurar Ficha Geométrica
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Nombre del Eje</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 transition-colors font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">URL Imagen de Fondo</label>
                  <input 
                    type="text" 
                    value={editBg}
                    onChange={(e) => setEditBg(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 transition-colors font-mono"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-2 mt-6">
                <button 
                  onClick={() => setEditingEje(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border border-slate-200"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveEjeConfig}
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-600/10"
                >
                  {isSaving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />} 
                  {isSaving ? 'Guardando...' : 'Guardar Ficha'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}