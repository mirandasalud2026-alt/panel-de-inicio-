'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { 
  Shield, 
  Activity, 
  User, 
  Lock, 
  Key, 
  BookOpen, 
  CheckCircle2, 
  LogOut, 
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';

export default function LandingPage() {
  const { profile, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  // Controls whether we are currently viewing the login panel
  const [showLogin, setShowLogin] = useState(false);

  // Active role tab: 'nominal' | 'directivo' | 'admin'
  const [activeRole, setActiveRole] = useState<'nominal' | 'directivo' | 'admin'>('nominal');
  const [email, setEmail] = useState('nominal@mirandasalud.com');
  const [password, setPassword] = useState('nominal2026');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync state & default credentials when switching tabs
  useEffect(() => {
    setError('');
    if (activeRole === 'nominal') {
      setEmail('nominal@mirandasalud.com');
      setPassword('nominal2026');
    } else if (activeRole === 'directivo') {
      setEmail('directivo@miranda.gob.ve');
      setPassword('Directo.26');
    } else {
      setEmail('miranda.salud2026@gmail.com');
      setPassword('Roble.26');
    }
  }, [activeRole]);

  const handleGoToDashboard = () => {
    navigate('/admin/dashboard');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Direct fast bypass for simulated demo workspace
      if (email === 'nominal@mirandasalud.com' && password === 'nominal2026') {
        localStorage.setItem('sim_demo_admin', 'true');
        localStorage.setItem('sim_demo_role', 'nominal');
        localStorage.removeItem('sim_demo_cod_eje');
        localStorage.removeItem('sim_demo_cod_asic');
        localStorage.removeItem('sim_demo_id_centro');
        
        window.location.href = '/admin/dashboard';
        return;
      }

      if (email === 'miranda.salud2026@gmail.com' && password === 'Roble.26') {
        localStorage.setItem('sim_demo_admin', 'true');
        localStorage.setItem('sim_demo_role', 'admin');
        localStorage.removeItem('sim_demo_cod_eje');
        localStorage.removeItem('sim_demo_cod_asic');
        localStorage.removeItem('sim_demo_id_centro');
        
        window.location.href = '/admin/dashboard';
        return;
      }

      if (email === 'directivo@miranda.gob.ve' && password === 'Directo.26') {
        localStorage.setItem('sim_demo_admin', 'true');
        localStorage.setItem('sim_demo_role', 'directivo');
        localStorage.removeItem('sim_demo_cod_eje');
        localStorage.removeItem('sim_demo_cod_asic');
        localStorage.removeItem('sim_demo_id_centro');
        
        window.location.href = '/admin/dashboard';
        return;
      }

      // Supabase connection
      if (!supabase) {
        throw new Error('Servicio de Base de Datos no disponible.');
      }

      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (err) throw err;

      if (data.session) {
        window.location.href = '/admin/dashboard';
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message === 'Invalid login credentials' ? 'Credenciales de acceso incorrectas.' : (err?.message || 'Error de comunicación. Intente más tarde.'));
    } finally {
      setLoading(false);
    }
  };

  const rolesConfig = {
    nominal: {
      title: 'Ficha Nominal',
      badge: 'Carga de Datos',
      description: 'Acceso para el personal médico territorial encargado del registro de partos, cirugías, defunciones y fichas operativas diarias.',
      color: 'border-blue-500 text-blue-600 bg-blue-50/50 hover:bg-blue-100/40',
      activeColor: 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/10'
    },
    directivo: {
      title: 'Ficha Directiva',
      badge: 'Coordinación SIM',
      description: 'Acceso para Directores Estatales, Jefes de Eje y Coordinadores de ASIC para el análisis, consulta y monitoreo del semáforo de cumplimiento.',
      color: 'border-amber-500 text-amber-600 bg-amber-50/50 hover:bg-amber-100/40',
      activeColor: 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-500/10'
    },
    admin: {
      title: 'Administración',
      badge: 'Control Global',
      description: 'Superintendencia de usuarios, gestión del catálogo de establecimientos del estado, edición de ejes territoriales y sincronización API.',
      color: 'border-[#0B3D5C] text-[#0B3D5C] bg-[#0b3d5c]/5 hover:bg-[#0b3d5c]/10',
      activeColor: 'bg-[#0B3D5C] text-white border-[#0B3D5C] shadow-lg shadow-[#0B3D5C]/10'
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col justify-between selection:bg-blue-500/10 relative overflow-x-hidden">
      {/* Top beautiful national ribbon status bar */}
      <div className="h-2 w-full flex shrink-0 relative z-20">
        <div className="flex-1 bg-[#FFD700]"></div> {/* Yellow */}
        <div className="flex-1 bg-[#002F6C]"></div> {/* Blue */}
        <div className="flex-1 bg-[#CF0921]"></div> {/* Red */}
        <div className="flex-1 bg-[#008751]"></div> {/* Green */}
      </div>

      {/* Decorative subtle abstract background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-50/30 to-emerald-50/30 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-gradient-to-br from-amber-50/20 to-blue-50/20 rounded-full blur-2xl pointer-events-none z-0"></div>

      {/* MAIN CONTAINER CONTENT */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 py-12 md:py-16 relative z-10 w-full max-w-5xl mx-auto min-h-0">
        
        <AnimatePresence mode="wait">
          {!showLogin ? (
            // ==========================================
            // VIEW A: MAIN HERO COVER PAGE (PORTADA PRINCIPAL)
            // ==========================================
            <motion.div
              key="main-home-portal"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.45 }}
              className="text-center space-y-8 w-full max-w-3xl"
            >
              {/* Circular Emblem with Hospital Icon */}
              <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-md border border-slate-100 mx-auto hover:scale-105 transition-transform duration-300">
                <span className="text-5xl" id="logo-emblem">🏥</span>
              </div>

              {/* Title Header Blocks */}
              <div className="space-y-3">
                <h4 className="text-[10px] md:text-[11.5px] font-black tracking-[0.25em] text-slate-400 uppercase text-center">
                  GOBERNACIÓN DEL ESTADO BOLIVARIANO DE MIRANDA
                </h4>
                <h1 className="text-5xl md:text-7xl font-black text-[#0B3D5C] tracking-tight text-center leading-none uppercase">
                  MIRANDA SALUD
                </h1>
                <h2 className="text-base md:text-xl font-bold text-slate-500 text-center tracking-wide">
                  Dirección Estadal de Salud
                </h2>
              </div>

              {/* Soft visual blurry separating line */}
              <div className="w-56 h-0.5 bg-gradient-to-r from-transparent via-[#0B3D5C]/25 to-transparent mx-auto"></div>

              {/* Core System Description Text */}
              <p className="text-xs md:text-sm text-slate-500 max-w-xl text-center mx-auto leading-relaxed font-semibold">
                Sistema de Información en Salud (SIM) para el monitoreo estratégico, control epidemiológico y toma de decisiones en tiempo real.
              </p>

              {/* ACTIONS AREA BUTTONS */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto w-full pt-4">
                {/* 1. REPORTE DE ATENCIONES */}
                <button
                  id="btn-reporte-atenciones"
                  onClick={() => navigate('/sitio-informativo')}
                  className="w-full sm:w-auto px-8 py-4.5 bg-[#0B3D5C] hover:bg-[#124b6e] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-900/10 transition-all duration-200 active:scale-98 flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <BookOpen size={15} />
                  REPORTE DE ATENCIONES
                </button>

                {/* 2. ACCESO SIM */}
                <button
                  id="btn-acceso-sim"
                  onClick={() => {
                    // Reset tab to Nominal and open form
                    setActiveRole('nominal');
                    setShowLogin(true);
                  }}
                  className="w-full sm:w-auto px-8 py-4.5 bg-white hover:bg-slate-50 text-[#0B3D5C] font-black text-xs uppercase tracking-widest rounded-2xl shadow-sm border border-slate-200 transition-all duration-200 active:scale-98 flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <Lock size={14} />
                  ACCESO SIM
                </button>
              </div>

              {/* Already Logged In Session Guard Indicator */}
              {profile && (
                <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-2xl max-w-md mx-auto flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                    <div>
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Sesión de Trabajo</span>
                      <span className="block text-[11px] font-black text-emerald-800 truncate max-w-[200px]">{profile.nombre || profile.email}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={handleGoToDashboard}
                      className="px-3.5 py-1.5 bg-[#0B3D5C] hover:bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors cursor-pointer"
                    >
                      Entrar
                    </button>
                    <button
                      onClick={signOut}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-red-50 text-slate-500 hover:text-red-650 hover:border-red-100 text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors cursor-pointer"
                    >
                      Salir
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          ) : (
            // ==========================================
            // VIEW B: UNIFIED LOGIN WORKSPACE (PANEL ÚNICO)
            // ==========================================
            <motion.div
              key="auth-login-workspace"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-md flex flex-col items-center"
            >
              {/* Back button */}
              <button
                id="btn-back-portada"
                onClick={() => setShowLogin(false)}
                className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 font-black text-[10px] uppercase tracking-widest transition-colors mb-6 cursor-pointer self-start"
              >
                <ArrowLeft size={14} /> Regresar a la portada
              </button>

              <div className="w-full bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-150/80 shadow-2xl space-y-8 relative overflow-hidden">
                {/* Accent colorful decorator line */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#0B3D5C] via-[#FFD700] to-emerald-500"></div>

                <div className="text-center">
                  <div className="w-14 h-14 bg-[#0b3d5c]/5 border border-[#0b3d5c]/10 rounded-2xl flex items-center justify-center mx-auto text-2xl mb-3">
                    🏥
                  </div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none">Acceso Unificado SIM</h3>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-2">INGRESO SEGURO DE OPERACIONES</p>
                </div>

                {/* ROLE SELECTION TABS */}
                <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-150 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveRole('nominal')}
                    className={`text-[10px] font-black uppercase py-2.5 rounded-xl transition-all cursor-pointer ${
                      activeRole === 'nominal' 
                        ? 'bg-white text-[#0B3D5C] shadow-sm font-black' 
                        : 'text-slate-400 hover:text-slate-600 font-bold'
                    }`}
                  >
                    Nominal
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRole('directivo')}
                    className={`text-[10px] font-black uppercase py-2.5 rounded-xl transition-all cursor-pointer ${
                      activeRole === 'directivo' 
                        ? 'bg-white text-[#0B3D5C] shadow-sm font-black' 
                        : 'text-slate-400 hover:text-slate-600 font-bold'
                    }`}
                  >
                    Directivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRole('admin')}
                    className={`text-[10px] font-black uppercase py-2.5 rounded-xl transition-all cursor-pointer ${
                      activeRole === 'admin' 
                        ? 'bg-white text-[#0B3D5C] shadow-sm font-black' 
                        : 'text-slate-400 hover:text-slate-600 font-bold'
                    }`}
                  >
                    Admin
                  </button>
                </div>

                {/* ROLE DESCRIPTIVE SUMMARY */}
                <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                      Rango de Operación
                    </span>
                    <span className="text-[9px] font-black px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100 uppercase tracking-widest animate-pulse">
                      {rolesConfig[activeRole].badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    {rolesConfig[activeRole].description}
                  </p>
                </div>

                {/* FORM INPUT BLOCK */}
                <form onSubmit={handleLogin} className="space-y-4">
                  {error && (
                    <div className="p-3.5 bg-red-50 border border-red-150 rounded-2xl text-[10px] font-black text-red-600 uppercase tracking-wider text-center">
                      ⚠️ {error}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Territorial</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-150 rounded-2xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 transition-colors"
                        required
                        placeholder="usuario@miranda.gob.ve"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Contraseña de Control</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-150 rounded-2xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 transition-colors"
                        required
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-[#0B3D5C] hover:bg-[#124b6e] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-900/10 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'INGRESANDO...' : 'INGRESAR AL PANEL'}
                    </button>
                  </div>
                </form>

                {/* FASTRACK ONE-CLICK ACCESS DECORATOR AND BUTTON */}
                <div className="pt-2">
                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-100"></div>
                    <span className="flex-shrink mx-3 text-[8px] font-black text-slate-300 uppercase tracking-widest">Entrada de un clic</span>
                    <div className="flex-grow border-t border-slate-100"></div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setLoading(true);
                      setTimeout(() => {
                        if (activeRole === 'nominal') {
                          localStorage.setItem('sim_demo_admin', 'true');
                          localStorage.setItem('sim_demo_role', 'nominal');
                        } else if (activeRole === 'directivo') {
                          localStorage.setItem('sim_demo_admin', 'true');
                          localStorage.setItem('sim_demo_role', 'directivo');
                        } else {
                          localStorage.setItem('sim_demo_admin', 'true');
                          localStorage.setItem('sim_demo_role', 'admin');
                        }
                        localStorage.removeItem('sim_demo_cod_eje');
                        localStorage.removeItem('sim_demo_cod_asic');
                        localStorage.removeItem('sim_demo_id_centro');
                        window.location.href = '/admin/dashboard';
                      }, 400);
                    }}
                    className="w-full py-3 border border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50/80 text-[#0B3D5C] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Key size={12} /> Acceso Rápido como {rolesConfig[activeRole].title}
                  </button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* FOOTER AREA */}
      <footer className="py-4 border-t border-slate-150 text-center bg-white shrink-0 relative z-20">
        <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.25em]">
          GOBIERNO DE MIRANDA • DIRECCIÓN ESTADAL DE SALUD • SIM © 2026
        </p>
      </footer>
    </div>
  );
}
