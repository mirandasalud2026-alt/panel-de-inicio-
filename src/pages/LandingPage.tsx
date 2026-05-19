import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Lock
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans flex flex-col justify-between">
      {/* Dynamic Flag Accent Ribbon at the very top */}
      <div className="h-2 w-full flex">
        <div className="flex-1 bg-[#FFD700]"></div> {/* Yellow */}
        <div className="flex-1 bg-[#002F6C]"></div> {/* Blue */}
        <div className="flex-1 bg-[#CF0921]"></div> {/* Red */}
        <div className="flex-1 bg-[#008751]"></div> {/* Green */}
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 md:py-24 relative overflow-hidden">
        {/* Soft ambient glow effects */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none"></div>

        {/* HERO CARD CONTAINER */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-3xl text-center space-y-8"
        >
          {/* Hospital Symbol - "su hospital como antes" */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/10 rounded-[2.5rem] blur-xl"></div>
              <div className="relative w-24 h-24 bg-white border border-gray-150 rounded-[2.5rem] flex items-center justify-center shadow-xl">
                <span className="text-5xl">🏥</span>
              </div>
            </div>
          </div>

          {/* State & Office Typography Section */}
          <div className="space-y-4">
            <h4 className="text-[10px] md:text-xs font-black tracking-[0.3em] text-[#0B3D5C]/70 uppercase leading-none">
              GOBERNACIÓN DEL ESTADO BOLIVARIANO DE MIRANDA
            </h4>
            
            <div className="space-y-2">
              <h1 className="text-4xl md:text-6xl font-black text-[#0B3D5C] tracking-tighter uppercase">
                MIRANDA SALUD
              </h1>
              <h2 className="text-lg md:text-2xl font-bold text-gray-600 tracking-tight">
                Dirección Estadal de Salud
              </h2>
            </div>

            <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-[#0B3D5C]/30 to-transparent mx-auto mt-4"></div>

            <p className="text-gray-500 text-xs md:text-sm max-w-xl mx-auto font-medium leading-relaxed">
              Sistema de Información en Salud (SIM) para el monitoreo estratégico, 
              control epidemiológico y toma de decisiones en tiempo real.
            </p>
          </div>

          {/* CALLS TO ACTION (CTAs) */}
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center w-full max-w-lg mx-auto pt-4">
            <Link 
              to="/sitio-informativo"
              className="w-full sm:flex-1 bg-[#0B3D5C] hover:bg-[#154E75] text-white px-8 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 duration-200"
            >
              <BookOpen size={18} /> Reporte de Atenciones
            </Link>
            <Link 
              to="/login"
              className="w-full sm:flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-[#0B3D5C] px-8 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all active:scale-95 duration-200"
            >
              <Lock size={18} /> Acceso SIM
            </Link>
          </div>
        </motion.div>
      </div>

      {/* FOOTER */}
      <footer className="py-6 border-t border-gray-250 text-center mt-auto bg-gray-50/50">
        <p className="text-[9px] text-gray-500 font-extrabold uppercase tracking-[0.25em]">
          GOBIERNO DE MIRANDA • DIRECCIÓN ESTADAL DE SALUD • SIM 2026
        </p>
      </footer>
    </div>
  );
}
