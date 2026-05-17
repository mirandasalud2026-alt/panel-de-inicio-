import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <main className="relative flex flex-col items-center justify-between h-screen bg-[#0B3D5C] px-8 py-10 text-white overflow-hidden font-sans">
      
      {/* Barra de estado simulada */}
      <div className="w-full flex justify-between items-center opacity-60 text-white text-[10px] uppercase tracking-widest px-2">
        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <div className="flex gap-1.5">
          <div className="w-3.5 h-3.5 border border-white rounded-full"></div>
          <div className="w-3.5 h-3.5 bg-white rounded-full"></div>
        </div>
      </div>

      {/* Cabecera */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center z-10"
      >
        <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center mb-6 shadow-2xl border border-white/10">
          <span className="text-5xl">🏥</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none mb-2">SIM Miranda</h1>
        <p className="text-sm text-white/70 font-medium uppercase tracking-tighter">Sistema de Información en Salud</p>
      </motion.div>

      {/* Acciones principales */}
      <div className="w-full max-w-sm space-y-4 mb-8 z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Link
            to="/sitio-informativo"
            className="w-full py-5 bg-white text-[#0B3D5C] font-bold rounded-2xl text-center shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-gray-50"
          >
            📖 SITIO INFORMATIVO
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Link
            to="/login"
            className="w-full py-5 bg-[#1A5F7A] text-white border border-white/20 font-bold rounded-2xl text-center flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-[#154E64]"
          >
            🔐 ACCESO PERSONAL
          </Link>
        </motion.div>

        <p className="text-center text-[10px] text-white/40 uppercase tracking-widest pt-4">
          Versión 1.2.0 Build 2024
        </p>
      </div>

      {/* Home indicator bar (iOS Style) */}
      <div className="w-32 h-1.5 bg-white/30 rounded-full mb-2"></div>
    </main>
  );
}
