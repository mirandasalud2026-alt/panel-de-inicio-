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
  const [editingEje, setEditingEje] = useState<EjeTerritorial | null>(null);
  const [editName, setEditName] = useState('');
  const [editBg, setEditBg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!supabase) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      
      try {
        const { data: config } = await supabase
          .from('mapa_config')
          .select('*')
          .eq('id', 'fichas_territoriales')
          .maybeSingle();
          
        if (config?.ejes_data) {
          setEjes(config.ejes_data);
        }
      } catch (err) {
        console.error('Error loading config:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

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

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-emerald-600" size={24} />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando ejes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#F8FAFC] p-4 text-slate-800 flex flex-col justify-start overflow-y-auto select-none">
      
      <div className="mb-4 flex justify-between items-center border-b border-slate-200/60 pb-2">
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-emerald-600" />
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">
            Monitoreo Regional de Ejes
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 flex-1 items-stretch pb-2">
        {ejes.map((eje) => {
          return (
            <div 
              key={eje.id}
              className="relative min-h-[160px] md:h-full w-full rounded-xl border border-slate-200 overflow-hidden bg-white group shadow-sm hover:shadow-lg flex flex-col justify-between p-4 transition-all duration-300 hover:border-emerald-500/40"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-25 group-hover:opacity-45 transition-opacity duration-300 pointer-events-none"
                style={{ backgroundImage: `url(${eje.bgImage})` }}
              />

              <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                <div className="flex justify-between items-start w-full">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                      {eje.description || 'EJE TERRITORIAL'}
                    </span>
                  </div>

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

                <div className="mt-auto">
                  <h3 className="text-[12px] font-black uppercase text-slate-900 tracking-wide mb-3 group-hover:text-emerald-700 transition-colors">
                    {eje.name}
                  </h3>
                  
                  <a 
                    href={eje.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full py-2 bg-slate-50 group-hover:bg-emerald-600 hover:scale-[1.01] active:scale-[0.99] transition-all rounded-lg text-[9px] font-black uppercase tracking-widest text-center block text-slate-700 group-hover:text-white border border-slate-200 group-hover:border-transparent shadow-sm"
                  >
                    Ir al Formulario
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

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