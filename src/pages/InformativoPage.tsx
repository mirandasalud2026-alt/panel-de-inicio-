import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
import MapComponent from '../components/MapComponent';

export default function InformativoPage() {
  const navigate = useNavigate();

  return (
    /* h-screen y overflow-hidden para congelar el viewport sin scrolls raros */
    <div className="h-screen bg-[#F3F4F6] font-sans flex flex-col justify-between overflow-hidden">
      
      {/* Dynamic Flag Accent Ribbon at the very top */}
      <div className="h-1.5 w-full flex shrink-0">
        <div className="flex-1 bg-[#FFD700]"></div> {/* Yellow */}
        <div className="flex-1 bg-[#002F6C]"></div> {/* Blue */}
        <div className="flex-1 bg-[#CF0921]"></div> {/* Red */}
      </div>

      {/* Header Compacto Profesional */}
      <header className="bg-white text-gray-800 px-6 py-3 border-b border-gray-200 flex justify-between items-center shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-800"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xl">🏥</span>
            <div>
              <h1 className="text-base font-black tracking-tight leading-none text-[#0B3D5C]">SALA SITUACIONAL SIM</h1>
              <p className="text-[8px] text-[#0B3D5C]/60 font-bold uppercase tracking-[0.2em] mt-1">Monitoreo Regional Miranda</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Ativo</span>
           </div>
           
           <div className="h-6 w-[1px] bg-gray-200 mx-1"></div>
           
           <button className="flex items-center gap-2 text-[9px] font-black text-gray-500 hover:text-[#0B3D5C] transition-all uppercase tracking-widest">
              <Share2 size={12} /> Compartir 
           </button>
        </div>
      </header>

      {/* Main ajustado: Sin títulos muertos, padding minimizado (p-3) y flex para estirar el mapa */}
      <main className="flex-1 p-3 max-w-[1600px] w-full mx-auto flex flex-col justify-start overflow-hidden">
        
         {/* MAPA INTERACTIVO Y FICHAS (Ocupa el 100% del espacio útil) */}
         <section className="w-full flex-1 bg-white rounded-2xl p-3 shadow-md border border-gray-100 overflow-hidden min-h-0 flex flex-col">
            <MapComponent />
         </section>

      </main>

      {/* FOOTER compacto */}
      <footer className="py-3 border-t border-gray-200 text-center bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center px-6 md:px-12 gap-2 shrink-0">
         <p className="text-[8px] text-gray-500 font-extrabold uppercase tracking-[0.25em]">
           GOBIERNO DE MIRANDA • DIRECCIÓN ESTADAL DE SALUD • SIM 2026
         </p>
         <div className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-[#FFD700]/60"></div>
            <div className="w-2 h-2 rounded-full bg-[#002F6C]/60"></div>
            <div className="w-2 h-2 rounded-full bg-[#CF0921]/60"></div>
         </div>
      </footer>
    </div>
  );
}
