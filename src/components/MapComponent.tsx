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
    bgImage: 'https://i.ibb.co/svcKtdbS/Gemini-Generated-Image-95oee595oee595oe.png',
    description: 'Eje Territorial 01'
  },
  { 
    id: 'valles_del_tuy', 
    name: 'Eje Valles del Tuy', 
    url: 'https://sites.google.com/view/saludmiranda04/eje-valles-del-tuy',
    bgImage: 'https://i.ibb.co/7xfYH05m/Gemini-Generated-Image-vcj0crvcj0crvcj0.jpg',
    description: 'Eje Territorial 02'
  },
  { 
    id: 'barlovento', 
    name: 'Eje Barlovento', 
    url: 'https://sites.google.com/view/saludmiranda04/eje-barlovento',
    bgImage: 'https://i.ibb.co/pjwVPVD6/Gemini-Generated-Image-z4tz9jz4tz9jz4tz.png',
    description: 'Eje Territorial 04'
  },
  { 
    id: 'guarenas_guatire', 
    name: 'Eje Guarenas-Guatire', 
    url: 'https://sites.google.com/view/saludmiranda04/eje-guarenas-guatire',
    bgImage: 'https://i.ibb.co/zWmj0sc9/Gemini-Generated-Image-8idfu28idfu28idf.png',
    description: 'Eje Territorial 03'
  },
  { 
    id: 'metropolitano', 
    name: 'Eje Metropolitano', 
    url: 'https://sites.google.com/view/saludmiranda04/eje-metropolitano',
    bgImage: 'https://i.ibb.co/gMVshdvb/Gemini-Generated-Image-x4hjhlx4hjhlx4hj.png',
    description: 'Eje Territorial 05'
  },
];

export default function InteractiveMirandaCards({ isAdminMode = false }) {
  const [ejes, setEjes] = useState<EjeTerritorial[]>(INITIAL_TERRITORIALES);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [editingEje, setEditingEje] = useState<EjeTerritorial | null>(null);
  const [editName, setEditName] = useState('');
  const [editBg, setEditBg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchTotales = async () => {
    if (!supabase) return;
    const { data } = await supabase.rpc('get_resumen_totales');
    if (data) {
      const mappedStats = data.reduce((acc: any, curr: any) => {
        acc[curr.eje_nombre.toUpperCase().trim()] = curr.total_reportes;
        return acc;
      }, {});
      setStats(mappedStats);
    }
  };

  useEffect(() => {
    const loadConfig = async () => {
      const { data: config } = await supabase.from('mapa_config').select('*').eq('id', 'fichas_territoriales').maybeSingle();
      if (config?.ejes_data) setEjes(config.ejes_data);
    };

    loadConfig();
    fetchTotales();

    const channel = supabase.channel('realtime_resumen')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resumen_asic' }, fetchTotales)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const getReportCountForEje = (ejeName: string) => stats[ejeName.toUpperCase().trim()] || 0;
  
  const getTotalGlobalReportes = () => (Object.values(stats) as number[]).reduce((acc: number, curr: number) => acc + curr, 0);
  
  const getFillPercentage = (ejeName: string) => {
    const values = Object.values(stats) as number[];
    const max = Math.max(...values, 1);
    return (getReportCountForEje(ejeName) / max) * 100;
  };

  const handleSaveEjeConfig = async () => {
    if (!editingEje || !supabase) return;
    setIsSaving(true);
    const updatedEjes = ejes.map(e => e.id === editingEje.id ? { ...e, name: editName, bgImage: editBg } : e);
    try {
      await supabase.from('mapa_config').upsert({ id: 'fichas_territoriales', ejes_data: updatedEjes }, { onConflict: 'id' });
      setEjes(updatedEjes);
      setEditingEje(null);
    } finally { setIsSaving(false); }
  };

  return (
    <div className="w-full h-full bg-[#F8FAFC] p-4 text-slate-800 flex flex-col overflow-y-auto">
      <div className="mb-4 flex justify-between items-center border-b border-slate-200/60 pb-2">
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-emerald-600" />
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">Monitoreo Regional</h2>
        </div>
        <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[9px] font-black uppercase text-emerald-700">
          Total: {getTotalGlobalReportes()} Reportes
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 flex-1">
        {ejes.map((eje) => (
          <div key={eje.id} className="relative min-h-[185px] w-full rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between p-4 transition-all hover:border-emerald-500/40">
            <div className="absolute inset-0 bg-cover bg-center opacity-25 pointer-events-none" style={{ backgroundImage: `url(${eje.bgImage})` }} />
            <motion.div className="absolute bottom-0 left-0 right-0 bg-emerald-500/10" initial={{ height: 0 }} animate={{ height: `${getFillPercentage(eje.name)}%` }} />
            
            <div className="relative z-10 flex justify-between items-start">
              <span className="text-[9px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-md">{getReportCountForEje(eje.name)} REPORTES</span>
              {isAdminMode && (
                <button onClick={() => { setEditingEje(eje); setEditName(eje.name); setEditBg(eje.bgImage); }} className="p-1 bg-slate-100 rounded-md"><Edit2 size={10} /></button>
              )}
            </div>

            <div className="relative z-10">
              <h3 className="text-xs font-black uppercase text-slate-900 mb-2">{eje.name}</h3>
              <a href={eje.url} target="_blank" rel="noreferrer" className="w-full py-2 bg-slate-50 hover:bg-emerald-600 hover:text-white transition-all rounded-lg text-[9px] font-black uppercase text-center block text-slate-700 border">Ir al Formulario</a>
            </div>
          </div>
        ))}
      </div>
      {/* ... (Modal de edición igual que tenías) */}
    </div>
  );
}