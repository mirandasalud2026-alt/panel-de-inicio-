import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import InformativoPage from './pages/InformativoPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import NominalDashboard from './components/ui/NominalDashboard';
import NominalFormWindow from './components/ui/NominalFormWindow';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, AlertTriangle, RefreshCw, ServerOff } from 'lucide-react';
import { DashboardProvider } from './contexts/DashboardContext';
import { supabase } from './lib/supabase'; // Aseguramos el cliente real

function checkIsLocked(): boolean {
  // Opción de forzar bloqueo solo para pruebas explícitas vía URL (?test_lock=true)
  if (new URLSearchParams(window.location.search).get('test_lock') === 'true') {
    return true;
  }

  const now = new Date();
  const day = now.getDay(); // 4 = Jueves, 5 = Viernes
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // Jueves de 11:50 PM (23:50) en adelante
  if (day === 4 && hours === 23 && minutes >= 50) {
    return true;
  }

  // Viernes desde la medianoche hasta las 6:00 AM
  if (day === 5 && hours < 6) {
    return true;
  }

  // CUALQUIER OTRO DÍA (Incluyendo hoy lunes): LIBRE ACCESO REAL
  return false;
}

function getSecondsRemaining(): number {
  const now = new Date();
  const day = now.getDay();
  
  let target = new Date(now);
  target.setHours(6, 0, 0, 0);

  if (day === 4) {
    target.setDate(target.getDate() + 1);
  } else if (day === 5) {
    // Es viernes, el objetivo es hoy a las 6:00 AM
  } else {
    // Si no estamos en rango de bloqueo, el contador real debe ser 0
    return 0;
  }

  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / 1000));
}

function LockScreen({ onCheckStatus }: { onCheckStatus: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(getSecondsRemaining());
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    // Si no hay tiempo de bloqueo, liberar la pantalla de inmediato
    if (secondsLeft <= 0) {
      onCheckStatus();
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onCheckStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft, onCheckStatus]);

  const formatTime = (secs: number) => {
    if (secs <= 0) return "Abriendo...";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      // Verificación real de latencia contra Supabase para descartar caídas del servidor
      const start = performance.now();
      const { error } = await supabase.from('TEjes').select('cod_eje').limit(1);
      const end = performance.now();
      
      if (error) throw error;

      alert(`📡 Conexión exitosa con Supabase de Producción.\nLatencia del nodo: ${(end - start).toFixed(0)}ms.\n\nEl sistema web está listo. Sin embargo, la ventana de mantenimiento por resguardo epidemiológico sigue activa hasta el Viernes a las 6:00 AM.`);
    } catch (err: any) {
      alert(`⚠️ Error de conexión con el backend: ${err.message || 'Servidor inaccesible'}`);
    } finally {
      setVerifying(false);
      onCheckStatus();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-red-500/20 relative">
      <div className="h-2 w-full flex relative z-20">
        <div className="flex-1 bg-[#FFD700]"></div>
        <div className="flex-1 bg-[#002F6C]"></div>
        <div className="flex-1 bg-[#CF0921]"></div>
        <div className="flex-1 bg-[#008751]"></div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[500px] h-[350px] md:h-[500px] bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md"
        >
          <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-red-500/10 to-transparent"></div>

          <div className="space-y-8 relative z-10">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-[1.5rem] flex items-center justify-center text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-pulse">
                <ServerOff size={28} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-red-400 tracking-[0.2em]">SALA SITUACIONAL RESTRINGIDA</span>
                <h1 className="text-xl md:text-2xl font-black text-white mt-1 uppercase tracking-tight">Mantenimiento de Datos</h1>
              </div>
            </div>

            <div className="bg-slate-950/85 border border-slate-800 p-5 rounded-3xl space-y-2">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertTriangle size={16} className="shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider">Mantenimiento Semanal Obligatorio</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Para garantizar la consistencia de los reportes territoriales, la plataforma Miranda Salud restringe el acceso los jueves desde las 11:50 PM hasta los viernes a las 6:00 AM.
              </p>
              <div className="text-[10px] font-mono text-slate-500 border-t border-slate-800/60 pt-2 flex justify-between">
                <span>Rango obligatorio:</span>
                <span className="text-slate-300 font-bold">Jueves 23:50 ⇆ Viernes 06:00</span>
              </div>
            </div>

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

            <div className="flex gap-4">
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="w-full bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 font-black text-xs uppercase tracking-widest py-4 rounded-2xl transition-all duration-200 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} className={verifying ? "animate-spin" : ""} />
                {verifying ? "Verificando Servidor..." : "Probar Conexión en Tiempo Real"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

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

export default function App() {
  const [locked, setLocked] = useState(checkIsLocked());

  const handleRefreshLockState = () => {
    setLocked(checkIsLocked());
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLocked(checkIsLocked());
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  if (locked) {
    return <LockScreen onCheckStatus={handleRefreshLockState} />;
  }

  return (
    <DashboardProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/sitio-informativo" element={<InformativoPage />} />
          <Route path="/login" element={<LandingPage />} />
          <Route path="/nominal" element={<NominalDashboard />} />
          <Route path="/nominal-form" element={<NominalFormWindow />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </DashboardProvider>
  );
}