import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, HeartPulse, FileSpreadsheet, ShieldCheck, MapPin, Calendar, Users, RefreshCw } from 'lucide-react';
import OnboardingModal from '../components/ui/OnboardingModal';

export default function LandingPage() {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex flex-col justify-between relative">
      {/* Bandera institucional (amarilla, azul y roja ensanchadas, verde eliminada) */}
      <div className="h-4 w-full flex shrink-0">
        <div className="flex-1 bg-[#FFD700]"></div>
        <div className="flex-1 bg-[#002F6C]"></div>
        <div className="flex-1 bg-[#CF0921]"></div>
      </div>

      {/* Hero en formato centrado vertical estático */}
      <header className="relative flex-grow flex items-center justify-center bg-radial from-[#13496C] via-[#0B3D5C] to-[#062438] text-white py-12 px-6 text-center shadow-lg overflow-hidden">
        {/* Abstract background grids or lights */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 blur-3xl rounded-full"></div>
 
        <div className="relative max-w-4xl mx-auto z-10 space-y-6">
          {/* Institutional crest header block - Moved to the very top */}
          <div className="flex flex-col items-center justify-center gap-1.5">
            <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[#FFD700] max-w-lg leading-relaxed">
              GOBERNACIÓN DEL ESTADO BOLIVARIANO DE MIRANDA
            </p>
            <p className="text-[9px] md:text-[10px] font-bold text-slate-350 text-slate-300 uppercase tracking-widest -mt-0.5">
              Dirección Estadal de Salud • SIM Miranda 2026
            </p>
          </div>
 
          <div className="space-y-3 pt-2">
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight font-display text-white drop-shadow-md">
              Miranda <span className="text-amber-400 font-black">Salud</span>
            </h1>
          </div>
 
          <div className="pt-4 flex flex-col items-center gap-3">
            {/* Fila de los dos botones principales */}
            <div className="flex gap-4 justify-center flex-wrap">
              <Link 
                to="/sitio-informativo" 
                className="bg-transparent hover:bg-white/10 text-white border-2 border-white/20 px-5 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-sm"
                id="btn-ver-informativo"
              >
                Ver Informativo
              </Link>
              <Link 
                to="/login" 
                className="bg-[#FFD700] hover:bg-[#ffe234] text-[#062438] hover:scale-[1.02] px-5 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-md"
                id="btn-acceso-sistema"
              >
                Acceso al Sistema
              </Link>
            </div>

            {/* Nuevo botón de Actualización de Datos de Personal - colocado debajo de los dos botones */}
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="mt-2 bg-emerald-600 hover:bg-emerald-550 hover:bg-opacity-90 hover:scale-[1.02] active:scale-95 text-white font-black text-[10px] uppercase tracking-wider px-6 py-2.5 rounded-xl transition duration-305 transition-all shadow-md flex items-center gap-2 cursor-pointer border border-emerald-500/20"
              id="btn-actualizacion-datos"
            >
              <RefreshCw size={12} className="animate-spin-slow animate-spin" style={{ animationDuration: '4s' }} /> Actualización de Datos de Personal (Onboarding)
            </button>
          </div>
        </div>
      </header>
 
      {/* Footer */}
      <footer className="bg-slate-100 py-4 text-center text-[10px] text-slate-400 uppercase tracking-wider shrink-0 border-t border-slate-200">
        Gobierno Bolivariano de Miranda – Dirección Estadal de Salud – SIM Miranda 2026
      </footer>

      {/* Modal de Onboarding y Actualización */}
      <OnboardingModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />
    </div>
  );
}