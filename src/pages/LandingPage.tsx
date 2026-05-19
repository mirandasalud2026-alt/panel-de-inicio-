import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Lock
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F0F4F8] font-sans overflow-hidden flex flex-col">
      {/* HERO HEADER */}
      <header className="relative flex-1 bg-gradient-to-br from-[#0B3D5C] via-[#0d4a6e] to-[#1A5F7A] text-white px-5 py-20 md:px-10 flex flex-col items-center justify-center text-center overflow-hidden shadow-xl">
        {/* Decorative elements */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>

        {/* CTAs */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-6 w-full max-w-xl">
          <Link 
            to="/sitio-informativo"
            className="flex-1 bg-white text-[#0B3D5C] px-8 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl hover:bg-gray-50 transition-all hover:-translate-y-1"
          >
            <BookOpen size={20} /> Reporte de Atenciones
          </Link>
          <Link 
            to="/login"
            className="flex-1 bg-white/10 border border-white/20 backdrop-blur-md text-white px-8 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/20 transition-all shadow-xl"
          >
            <Lock size={20} /> Acceso SIM
          </Link>
        </div>

      </header>
    </div>
  );
}
