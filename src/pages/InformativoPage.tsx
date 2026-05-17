import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function InformativoPage() {
  const navigate = useNavigate();
  const googleSiteUrl = 'https://sites.google.com/view/saludmiranda04/p%C3%A1gina-principal';
  const tiempoEspera = 1500;
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // Intentar redirección automática
    const timer = setTimeout(() => {
      try {
        window.location.replace(googleSiteUrl);
        // Si después de un tiempo seguimos aquí, mostrar el botón de fallback
        setTimeout(() => setShowFallback(true), 1000);
      } catch (e) {
        setShowFallback(true);
      }
    }, tiempoEspera);

    return () => clearTimeout(timer);
  }, [googleSiteUrl]);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#0B3D5C] to-[#1A5F7A] z-50 flex flex-col items-center justify-center font-sans px-6">
      <div className="text-center space-y-8 max-w-sm">
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
          <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight leading-tight">
            Accediendo al Portal
          </h2>
          <p className="text-white/60 text-xs font-bold uppercase tracking-[0.2em]">
            Sincronizando información...
          </p>
        </motion.div>

        {!showFallback ? (
          <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mx-auto border border-white/5">
            <div className="h-full bg-white rounded-full animate-loading-bar" />
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <p className="text-[10px] text-white/50 italic leading-relaxed">
              * Si la redirección automática es bloqueada por su navegador:
            </p>
            <a
              href={googleSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-white text-[#0B3D5C] font-bold rounded-2xl text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
            >
              Abrir en Nueva Pestaña ↗
            </a>
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => navigate('/')}
          className="px-8 py-3 border border-white/20 text-white/70 rounded-2xl text-[10px] font-extrabold uppercase tracking-widest hover:bg-white/5 active:scale-95 transition-all"
        >
          ← Regresar al menú
        </motion.button>
      </div>
      
      <div className="absolute bottom-10 opacity-20">
        <p className="text-[10px] text-white font-extrabold uppercase tracking-[0.4em]">
          Standalone Redirect Mode
        </p>
      </div>
    </div>
  );
}
