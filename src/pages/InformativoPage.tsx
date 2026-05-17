import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function InformativoPage() {
  const navigate = useNavigate();
  const googleSiteUrl = 'https://sites.google.com/view/saludmiranda04/p%C3%A1gina-principal';
  const tiempoEspera = 1200; // ms para mostrar la pantalla puente y asegurar transicion

  useEffect(() => {
    const timer = setTimeout(() => {
      // replace() evita que esta página quede en el historial
      window.location.replace(googleSiteUrl);
    }, tiempoEspera);

    return () => clearTimeout(timer);
  }, [googleSiteUrl]);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#0B3D5C] to-[#1A5F7A] z-50 flex flex-col items-center justify-center font-sans">
      {/* Animación de carga */}
      <div className="text-center space-y-8 px-8 max-w-sm">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-white/20 backdrop-blur-lg rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl border border-white/10"
        >
          <span className="text-5xl">📖</span>
        </motion.div>
        
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
            Sitio Informativo
          </h2>
          <p className="text-white/60 text-xs font-bold uppercase tracking-[0.2em]">
            Sincronizando portal...
          </p>
        </motion.div>

        {/* Barra de progreso animada */}
        <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mx-auto border border-white/5">
          <div className="h-full bg-white rounded-full animate-loading-bar" />
        </div>

        {/* Botón de cancelar/regresar */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => navigate('/')}
          className="mt-8 px-8 py-3 border border-white/20 text-white/70 rounded-2xl text-[10px] font-extrabold uppercase tracking-widest hover:bg-white/5 active:scale-95 transition-all"
        >
          ← Regresar al menú
        </motion.button>
      </div>
      
      <div className="absolute bottom-10 opacity-20">
        <p className="text-[10px] text-white font-extrabold uppercase tracking-[0.4em]">
          TWA Optimized
        </p>
      </div>
    </div>
  );
}
