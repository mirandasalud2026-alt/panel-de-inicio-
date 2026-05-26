import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import InformativoPage from './pages/InformativoPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, AlertTriangle, RefreshCw, ServerOff } from 'lucide-react';
import { DashboardProvider } from './contexts/DashboardContext';

function checkIsLocked(): boolean {
  // Option to test it anywhere via URL parameter
  if (new URLSearchParams(window.location.search).get('test_lock') === 'true') {
    return true;
  }

  const now = new Date();
  const day = now.getDay(); // 0 is Sunday, 4 is Thursday, 5 is Friday
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // Thursday 11:50 PM (23:50) to Thursday midnight
  if (day === 4) {
    if (hours === 23 && minutes >= 50) {
      return true;
    }
  }

  // Friday midnight to 6:00 AM
  if (day === 5) {
    if (hours < 6) {
      return true;
    }
  }

  return false;
}

function getSecondsRemaining(): number {
  const now = new Date();
  const day = now.getDay();
  
  let target = new Date(now);
  target.setHours(6, 0, 0, 0);

  if (day === 4) {
    // Tomorrow is Friday
    target.setDate(target.getDate() + 1);
  } else if (day === 5) {
    // Today is Friday, target is today at 6:00 AM
  } else {
    // If we are simulating for testing on other days, simulate a random countdown of 2 hours, 14 min
    return 8040;
  }

  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / 1000));
}

function LockScreen() {
  const [secondsLeft, setSecondsLeft] = useState(getSecondsRemaining());
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          return getSecondsRemaining();
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs: number) => {
    if (secs <= 0) return "Abriendo...";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleVerify = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      alert("📡 Servidor responde: Carga de datos regional en cola activa. Los cálculos territoriales de transitabilidad y semáforos se están consolidando de manera segura con Google Sheets. Vuelva a intentar a las 6:00 AM del Viernes.");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-red-500/20 relative">
      {/* Dynamic Flag Accent Ribbon at the very top */}
      <div className="h-2 w-full flex relative z-20">
        <div className="flex-1 bg-[#FFD700]"></div> {/* Yellow */}
        <div className="flex-1 bg-[#002F6C]"></div> {/* Blue */}
        <div className="flex-1 bg-[#CF0921]"></div> {/* Red */}
        <div className="flex-1 bg-[#008751]"></div> {/* Green */}
      </div>

      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[500px] h-[350px] md:h-[500px] bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md"
        >
          {/* Subtle light effect at top card edge */}
          <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-red-500/10 to-transparent"></div>

          <div className="space-y-8 relative z-10">
            {/* Header Lock Icon & Badge */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-[1.5rem] flex items-center justify-center text-red-550 shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-pulse">
                <ServerOff size={28} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-red-400 tracking-[0.2em]">SALA SITUACIONAL RESTRINGIDA</span>
                <h1 className="text-xl md:text-2xl font-black text-white mt-1 uppercase tracking-tight">Cierre por Carga de Datos</h1>
              </div>
            </div>

            {/* Warning Box */}
            <div className="bg-slate-950/85 border border-slate-800 p-5 rounded-3xl space-y-2">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertTriangle size={16} className="shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider">Mantenimiento Semanal Obligatorio</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Para garantizar la integridad y consistencia epidemiológica de los reportes territoriales, la plataforma Miranda Salud se encuentra en mantenimiento semanal obligatorio todos los jueves desde las 11:50 PM hasta los viernes a las 6:00 AM.
              </p>
              <div className="text-[10px] font-mono text-slate-500 border-t border-slate-800/60 pt-2 flex justify-between">
                <span>Rango obligatorio:</span>
                <span className="text-slate-300 font-bold">Jueves 23:50 ⇆ Viernes 06:00</span>
              </div>
            </div>

            {/* Dynamic Countdown */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 text-center space-y-2 shadow-inner">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center justify-center gap-1.5">
                <Clock size={12} className="text-slate-400" /> Tiempo Restante para la Apertura
              </span>
              <div className="text-4xl md:text-5xl font-black tracking-tighter text-white font-mono select-none">
                {secondsLeft > 0 ? formatTime(secondsLeft) : "00:00:00"}
              </div>
              <span className="inline-block text-[10px] text-zinc-500 font-semibold uppercase bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
                Re-apertura estimada: Viernes 6:00 AM
              </span>
            </div>

            {/* Verification Trigger Button */}
            <div className="flex gap-4">
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="w-full bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 font-black text-xs uppercase tracking-widest py-4 rounded-2xl transition-all duration-200 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} className={verifying ? "animate-spin" : ""} />
                {verifying ? "Verificando..." : "Verificar Estado de Carga"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* FOOTER */}
      <footer className="py-6 border-t border-slate-900 text-center bg-slate-950 relative z-20">
        <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-[0.25em]">
          GOBIERNO DE MIRANDA • DIRECCIÓN ESTADAL DE SALUD • SIM 2026
        </p>
      </footer>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

/**
 * Miranda Salud - App Principal
 * Arquitectura PWA con autenticación basada en roles.
 */
export default function App() {
  const [locked, setLocked] = useState(checkIsLocked());

  useEffect(() => {
    // Check locked state initially and then every 20 seconds
    const interval = setInterval(() => {
      setLocked(checkIsLocked());
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  if (locked) {
    return <LockScreen />;
  }

  return (
    <DashboardProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/sitio-informativo" element={<InformativoPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </DashboardProvider>
  );
}
