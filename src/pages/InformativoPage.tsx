import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, MapPin, Globe, LayoutDashboard, Share2 } from 'lucide-react';
import InteractiveMirandaMap from '../components/InteractiveMirandaMap';

export default function InformativoPage() {
  const navigate = useNavigate();

  const territorialLinks = [
    { name: 'Altos Mirandinos', url: 'https://sites.google.com/view/saludmiranda04/eje-altos-mirandinos', icon: '🏔️' },
    { name: 'Valles del Tuy', url: 'https://sites.google.com/view/saludmiranda04/eje-valles-del-tuy', icon: '🏞️' },
    { name: 'Barlovento', url: 'https://sites.google.com/view/saludmiranda04/eje-barlovento', icon: '🌊' },
    { name: 'Área Metropolitana', url: 'https://sites.google.com/view/saludmiranda04/eje-metropolitano', icon: '🏙️' },
    { name: 'Guarenas-Guatire', url: 'https://sites.google.com/view/saludmiranda04/eje-guarenas-guatire', icon: '⛰️' },
  ];

  return (
    <div className="min-h-screen bg-[#050B15] font-sans">
      {/* Header Compacto Profesional */}
      <header className="bg-[#0A192F] text-white px-6 py-4 border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none text-white">SALA SITUACIONAL SIM</h1>
            <p className="text-[9px] text-blue-400 font-bold uppercase tracking-[0.2em] mt-1">Monitoreo Regional Miranda</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-green-500/10 rounded-full border border-green-500/20">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">Sincronización Activa</span>
           </div>
           
           <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
           
           <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest">
              <Share2 size={14} /> Compartir Vista
           </button>
        </div>
      </header>

      <main className="p-4 lg:p-8 max-w-[1600px] mx-auto">
        {/* Intro Hero */}
        <div className="mb-8">
           <h2 className="text-3xl font-black text-white tracking-tighter">Panel de Gestión Territorial</h2>
           <p className="text-slate-400 text-sm mt-2 max-w-2xl font-medium">
             Consola central de mando para la supervisión de los 5 ejes estratégicos de salud. Intervenga el mapa para obtener detalles por municipio o utilice la configuración lateral para redireccionar los flujos de datos.
           </p>
        </div>

        {/* MAPA INTERACTIVO (Principal) */}
        <section className="w-full h-[700px] lg:h-[800px] mb-12">
           <InteractiveMirandaMap />
        </section>

        <footer className="mt-8 py-6 border-t border-white/5 flex justify-between items-center">
           <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">SISTEMA INTEGRADO DE INFORMACIÓN EN SALUD · MIRANDA 2026</p>
           <div className="flex gap-4">
              <div className="w-2 h-2 rounded-full bg-blue-500/20"></div>
              <div className="w-2 h-2 rounded-full bg-blue-500/20"></div>
              <div className="w-2 h-2 rounded-full bg-blue-500/20"></div>
           </div>
        </footer>
      </main>
    </div>
  );
}

function ExternalLink({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
  );
}

