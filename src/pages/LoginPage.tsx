import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Mail, Lock, ShieldCheck, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);

  // If already logged in, redirect accordingly
  React.useEffect(() => {
    if (profile) {
      if (profile.rol === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/nominal');
      }
    }
  }, [profile, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorStatus(null);
    setSuccessStatus(null);

    const targetEmail = email.trim();
    const targetPassword = password;

    try {
      // 1. Try real Supabase auth
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password: targetPassword,
        });

        if (error) {
          // If user doesn't exist, try transparent sign up for seamless flow
          if (error.message.includes('Invalid login credentials') || error.message.includes('not found')) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: targetEmail,
              password: targetPassword,
            });

            if (!signUpError && signUpData?.user) {
              // Now sign in
              const { error: secondSignInError } = await supabase.auth.signInWithPassword({
                email: targetEmail,
                password: targetPassword,
              });

              if (!secondSignInError) {
                setSuccessStatus('¡Acceso autorizado vía Supabase!');
                setTimeout(() => {
                  window.location.href = targetEmail.toLowerCase() === 'miranda.salud2026@gmail.com' ? '/admin/dashboard' : '/nominal';
                }, 1000);
                return;
              }
            }
          }
          
          // Let's check if they entered the specific credentials requested: nominal@mirandasalud.com with nominal2026
          if (targetEmail.toLowerCase() === 'nominal@mirandasalud.com' && targetPassword === 'nominal2026') {
            console.log('Utilizando acceso local seguro para rol nominal...');
            localStorage.setItem('sim_demo_nominal', 'true');
            setSuccessStatus('¡Acceso nominal de emergencia autorizado (Local)!');
            setTimeout(() => {
              window.location.href = '/nominal';
            }, 1000);
            return;
          }

          throw new Error(error.message);
        } else if (data?.user) {
          setSuccessStatus('Sesión iniciada con éxito.');
          setTimeout(() => {
            window.location.href = targetEmail.toLowerCase() === 'miranda.salud2026@gmail.com' ? '/admin/dashboard' : '/nominal';
          }, 1000);
          return;
        }
      } else {
        throw new Error('Supabase no está disponible');
      }
    } catch (err: any) {
      // Offline fallback check for requested credentials
      const virtualUsersStr = localStorage.getItem('s_admin_virtual_users');
      const virtualUsers = virtualUsersStr ? JSON.parse(virtualUsersStr) : [];
      const matchedVirtual = virtualUsers.find((vu: any) => vu.email.toLowerCase() === targetEmail.toLowerCase());

      if (targetEmail.toLowerCase() === 'nominal@mirandasalud.com' && targetPassword === 'nominal2026') {
        localStorage.setItem('sim_demo_nominal', 'true');
        localStorage.setItem('sim_logged_user_email', 'nominal@mirandasalud.com');
        localStorage.setItem('sim_logged_user_name', 'OPERADOR NOMINAL');
        localStorage.setItem('sim_logged_user_role', 'nominal');
        setSuccessStatus('¡Acceso nominal autorizado (Modo Desconectado)!');
        setTimeout(() => {
          window.location.href = '/nominal';
        }, 1000);
      } else if (targetEmail.toLowerCase() === 'miranda.salud2026@gmail.com' && targetPassword === 'admin2026') {
        localStorage.setItem('sim_demo_admin', 'true');
        setSuccessStatus('¡Acceso admin autorizado (Modo Desconectado)!');
        setTimeout(() => {
          window.location.href = '/admin/dashboard';
        }, 1000);
      } else if (matchedVirtual && targetPassword === 'nominal2026') {
        if (matchedVirtual.rol === 'admin') {
          localStorage.setItem('sim_demo_admin', 'true');
          setSuccessStatus(`¡Acceso admin autorizado para ${matchedVirtual.nombre}!`);
          setTimeout(() => {
            window.location.href = '/admin/dashboard';
          }, 1000);
        } else {
          localStorage.setItem('sim_demo_nominal', 'true');
          localStorage.setItem('sim_logged_user_email', matchedVirtual.email);
          localStorage.setItem('sim_logged_user_name', matchedVirtual.nombre);
          localStorage.setItem('sim_logged_user_role', matchedVirtual.rol);
          setSuccessStatus(`¡Acceso nominal autorizado para ${matchedVirtual.nombre}!`);
          setTimeout(() => {
            window.location.href = '/nominal';
          }, 1000);
        }
      } else {
        setErrorStatus(err.message || 'Error al autenticar credenciales.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickNominalLogin = () => {
    setEmail('nominal@mirandasalud.com');
    setPassword('nominal2026');
    setErrorStatus(null);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex flex-col justify-between relative">
      
      {/* Bandera institucional (amarilla, azul y roja ensanchadas, verde eliminada) */}
      <div className="h-4 w-full flex shrink-0">
        <div className="flex-1 bg-[#FFD700]"></div>
        <div className="flex-1 bg-[#002F6C]"></div>
        <div className="flex-1 bg-[#CF0921]"></div>
      </div>

      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center space-y-1">
            <button 
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-[#0B3D5C] text-xs font-black uppercase tracking-wider transition-colors mb-2"
              id="btn-login-back"
            >
              <ArrowLeft size={14} /> Volver al inicio
            </button>
            <div className="flex justify-center">
              <span className="text-2xl p-2 bg-[#0B3D5C] rounded-2xl text-white shadow-md">🏥</span>
            </div>
            <h1 className="text-xl font-black font-display text-slate-900 uppercase tracking-tight">
              Miranda <span className="text-amber-500">Salud</span>
            </h1>
            <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">
              DIRECCIÓN ESTADAL DE SALUD • REPORTES NOMINALES 2026
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xl space-y-4"
          >
            <h2 className="text-xs font-black text-[#0B3D5C] uppercase tracking-wider text-center font-display border-b border-slate-100 pb-2">
              Ingreso Controlado de Operadores
            </h2>

            {/* Credenciales de Prueba Rápida */}
            <div className="bg-amber-50/50 border border-amber-500/20 rounded-2xl p-3 text-center space-y-1.5">
              <p className="text-[8.5px] font-black text-amber-800 uppercase tracking-wider">
                Credencial Operador Nominal Autorizado
              </p>
              <div className="flex flex-col xs:flex-row items-center justify-center gap-1 font-mono text-[9px] text-slate-600">
                <span>Usuario: <strong className="text-slate-800">nominal@mirandasalud.com</strong></span>
                <span className="hidden xs:inline">•</span>
                <span>Contraseña: <strong className="text-slate-800">nominal2026</strong></span>
              </div>
              <button
                type="button"
                onClick={handleQuickNominalLogin}
                className="mt-1 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-[#062438] text-[8px] font-black uppercase tracking-wider rounded-lg transition-all"
                id="btn-quick-fill-nominal"
              >
                Cargar Credenciales Automáticamente
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <Mail size={13} />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="Ej: nominal@mirandasalud.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                    id="input-login-email"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">
                  Contraseña de Seguridad
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <Lock size={13} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-10 py-1.5 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                    id="input-login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {errorStatus && (
                <div className="p-2 bg-rose-50 border border-rose-100 rounded-xl text-[9px] font-bold text-rose-800 flex items-center gap-1.5">
                  <AlertCircle size={13} className="text-rose-600 shrink-0" />
                  <span>{errorStatus}</span>
                </div>
              )}

              {successStatus && (
                <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-[9px] font-bold text-emerald-800 flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                  <span>{successStatus}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0B3D5C] hover:bg-[#072B41] text-white py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                id="btn-login-submit"
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Autenticando...
                  </>
                ) : (
                  'Ingresar al Sistema'
                )}
              </button>
            </form>
          </motion.div>

          <p className="text-center text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
            El acceso inapropiado sin credenciales válidas está penalizado conforme a la ley de delitos informáticos del MPPS.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-100 py-3 text-center text-[8px] text-slate-405 text-slate-400 uppercase tracking-widest shrink-0 border-t border-slate-200">
        Dirección Estadal de Salud – Gobernación del Estado Bolivariano de Miranda
      </footer>
    </div>
  );
}
