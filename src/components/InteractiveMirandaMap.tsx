import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { 
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
  const [resumenAsicData, setResumenAsicData] = useState<any[]>([]);
  const [editingEje, setEditingEje] = useState<EjeTerritorial | null>(null);
  const [editName, setEditName] = useState('');
  const [editBg, setEditBg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!supabase) return;
      
      const { data: resumen } = await supabase.from('resumen_asic').select('*');
      if (resumen) setResumenAsicData(resumen);

      const { data: config } = await supabase.from('mapa_config').select('*').eq('id', 'fichas_territoriales').maybeSingle();
      if (config?.ejes_data) {
        setEjes(config.ejes_data);
      }
    };

    loadInitialData();

    const channel = supabase
      ?.channel('resumen_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resumen_asic' }, () => {
        supabase.from('resumen_asic').select('*').then(({ data }) => {
          if (data) setResumenAsicData(data);
        });
      })
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const getReportCountForEje = (ejeId: string) => {
    const filasDelEje = resumenAsicData.filter(r => {
      const ejeReporte = (r.eje || '').toUpperCase().trim();
      if (ejeId === 'altos_mirandinos')  return ejeReporte === 'ALTOS MIRANDINOS';
      if (ejeId === 'valles_del_tuy')    return ejeReporte === 'VALLES DEL TUY';
      if (ejeId === 'barlovento')        return ejeReporte === 'BARLOVENTO';
      if (ejeId === 'guarenas_guatire')  return ejeReporte === 'GUARENAS-GUATIRE' || ejeReporte === 'GUARENAS_GUATIRE';
      if (ejeId === 'metropolitano')     return ejeReporte === 'METROPOLITANO';
      return false;
    });
    return filasDelEje.reduce((acc, curr) => acc + (parseInt(curr.centros_reportaron) || 0), 0);
  };

  const getFillPercentage = (ejeId: string) => {
    const counts = ejes.map(e => getReportCountForEje(e.id));
    const maxCount = Math.max(...counts, 1);
    const currentCount = getReportCountForEje(ejeId);
    return (currentCount / maxCount) * 100;
  };

  const getTotalGlobalReportes = () => {
    return ejes.reduce((acc, curr) => acc + getReportCountForEje(curr.id), 0);
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
    /* Reducción extrema de padding (p-4) y h-screen para encajar perfecto en el viewport */
    <div className="w-full h-screen bg-[#F8FAFC] p-4 text-slate-800 flex flex-col justify-start overflow-hidden select-none">
      
      {/* Encabezado ultra-compactado en una sola línea fina */}
      <div className="mb-4 flex justify-between items-center border-b border-slate-200/60 pb-2">
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-emerald-600" />
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">
            Monitoreo Regional de Ejes
          </h2>
        </div>
        <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-700 shadow-sm">
          Total: {getTotalGlobalReportes()} Reportes
        </div>
      </div>

      {/* Las fichas suben por completo. Se eliminaron los títulos muertos y se usó flex-1 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 flex-1 items-stretch pb-2">
        {ejes.map((eje) => {
          const reportCount = getReportCountForEje(eje.id);
          const fillPercent = getFillPercentage(eje.id);

          return (
            /* Ajuste de h-full para obligar a las tarjetas a estirarse uniformemente llenando la pantalla */
            <div 
              key={eje.id}
              className="relative h-full w-full rounded-xl border border-slate-200 overflow-hidden bg-white group shadow-sm hover:shadow-lg flex flex-col justify-between p-4 transition-all duration-300 hover:border-emerald-500/40"
            >
              {/* Imagen de fondo viva */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-25 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"
                style={{ backgroundImage: `url(${eje.bgImage})` }}
              />

              {/* Sombra de carga verde muy transparente */}
              <motion.div 
                className="absolute bottom-0 left-0 right-0 bg-emerald-500/10 border-t border-emerald-500/20 pointer-events-none"
                initial={{ height: 0 }}
                animate={{ height: `${fillPercent}%` }}
                transition={{ type: 'spring', stiffness: 40, damping: 15 }}
              />

              {/* Superior: Contador */}
              <div className="relative z-10 flex justify-between items-start w-full">
                <span className="text-[9px] font-black tracking-widest bg-emerald-600 text-white px-2.5 py-0.5 rounded-md shadow-sm">
                  {reportCount} {reportCount === 1 ? 'REPORTE' : 'REPORTES'}
                </span>

                {isAdminMode && (
                  <button 
                    onClick={() => {
                      setEditingEje(eje);
                      setEditName(eje.name);
                      setEditBg(eje.bgImage);
                    }}
                    className="p-1 bg-slate-100 hover:bg-slate-900 text-slate-500 hover:text-white rounded-md transition-colors border border-slate-200 shadow-sm"
                  >
                    <Edit2 size={10} />
                  </button>
                )}
              </div>

              {/* Inferior: Nombre y Enlace */}
              <div className="relative z-10 w-full">
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wide mb-2 group-hover:text-emerald-700 transition-colors">
                  {eje.name}
                </h3>
                
                <a 
                  href={eje.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full py-2 bg-slate-50 group-hover:bg-emerald-600 hover:scale-[1.01] active:scale-[0.99] transition-all rounded-lg text-[9px] font-black uppercase tracking-widest text-center block text-slate-700 group-hover:text-white border border-slate-200 group-hover:border-transparent shadow-sm"
                >
                  Ver Sala Virtual
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal del Administrador */}
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
              className="bg-white border border-slate-200 p-5 rounded-2xl w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest mb-3 flex items-center gap-2">
                <ImageIcon className="text-emerald-600" size={14} /> Configurar Ficha
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1">Nombre</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-500 transition-colors font-bold"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1">Imagen URL</label>
                  <input 
                    type="text" 
                    value={editBg}
                    onChange={(e) => setEditBg(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => setEditingEje(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors border border-slate-200"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveEjeConfig}
                  disabled={isSaving}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-md"
                >
                  {isSaving ? <RefreshCw size={10} className="animate-spin" /> : <Save size={10} />} 
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}