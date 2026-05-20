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
    <div className="min-h-screen bg-[#F3F4F6] font-sans flex flex-col justify-between">
      {/* Dynamic Flag Accent Ribbon at the very top */}
      <div className="h-2 w-full flex shrink-0">
        <div className="flex-1 bg-[#FFD700]"></div> {/* Yellow */}
        <div className="flex-1 bg-[#002F6C]"></div> {/* Blue */}
        <div className="flex-1 bg-[#CF0921]"></div> {/* Red */}
        <div className="flex-1 bg-[#008751]"></div> {/* Green */}
      </div>

      {/* Header Compacto Profesional */}
      <header className="bg-white text-gray-800 px-6 py-4 border-b border-gray-200 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏥</span>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none text-[#0B3D5C]">SALA SITUACIONAL SIM</h1>
              <p className="text-[9px] text-[#0B3D5C]/60 font-bold uppercase tracking-[0.2em] mt-1">Monitoreo Regional Miranda</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-200">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Sincronización Activa</span>
           </div>
           
           <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>
           
           <button className="flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-[#0B3D5C] transition-all uppercase tracking-widest">
              <Share2 size={14} /> Compartir Vista
           </button>
        </div>
      </header>

      <main className="flex-1 p-4 lg:p-8 max-w-[1600px] w-full mx-auto">
        {/* Intro Hero */}
         <div className="mb-8">
            <h2 className="text-3xl font-black text-[#0B3D5C] tracking-tighter">Panel de Gestión Territorial</h2>
            <p className="text-gray-500 text-sm mt-2 max-w-2xl font-medium">
              Toca tu eje o selecciona tu eje en el mapa interactivo para acceder a su reporte de atenciones y salas situacionales de salud.
            </p>
         </div>

        {/* MAPA INTERACTIVO (Principal) */}
        <section className="w-full h-[700px] lg:h-[800px] bg-white rounded-[2.5rem] p-4 shadow-xl shadow-gray-200/50 border border-gray-100 mb-12 overflow-hidden">
           <InteractiveMirandaMap />
        </section>
      </main>

      {/* FOOTER */}
      <footer className="py-6 border-t border-gray-200 text-center bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center px-6 md:px-12 gap-4">
         <p className="text-[9px] text-gray-500 font-extrabold uppercase tracking-[0.25em]">
           GOBIERNO DE MIRANDA • DIRECCIÓN ESTADAL DE SALUD • SIM 2026
         </p>
         <div className="flex gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFD700]/60"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#002F6C]/60"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#CF0921]/60"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#008751]/60"></div>
         </div>
      </footer>
    </div>
  );
}

function ExternalLink({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
  );
}

