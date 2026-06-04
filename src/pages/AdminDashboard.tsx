import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import AdminPortal from '../components/ui/AdminPortal';
import NominalDashboard from '../components/ui/NominalDashboard';
import { LogOut, AlertTriangle, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const { profile, loading, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [tookTooLong, setTookTooLong] = useState(false);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setTookTooLong(true);
      }, 4500);
      return () => clearTimeout(timer);
    } else {
      setTookTooLong(false);
    }
  }, [loading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const { data, error } = await supabase!.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;
      
      if (data.session) {
        // Recargar la página para que useAuth detecte la sesión
        window.location.reload();
      }
    } catch (err: any) {
      setLoginError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl text-center space-y-6">
          <div className="relative mx-auto w-16 h-16">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-100 border-t-[#0B3D5C]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl">🏥</span>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-black tracking-[0.25em] text-slate-400 uppercase">
              SALA SITUACIONAL SIM
            </h4>
            <h3 className="text-lg font-black text-[#0B3D5C] uppercase tracking-tight">
              Verificando Credenciales de Red
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Autenticando sesión y descargando perfil territorial de salud...
            </p>
          </div>

          {tookTooLong && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-3.5 mt-2">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-black justify-center">
                <AlertTriangle size={14} className="shrink-0 text-amber-650" />
                <span>¿CONEXIÓN LENTA O INESTABLE?</span>
              </div>
              <p className="text-[10px] text-amber-700/90 font-semibold leading-relaxed">
                La comprobación con Supabase está tomando más de lo previsto.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={11} /> Reintentar Conexión en Vivo
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Si no hay perfil, mostrar formulario de login
  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B3D5C] to-[#072437] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#0B3D5C] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">🏥</span>
            </div>
            <h1 className="text-2xl font-black text-gray-800">Miranda Salud</h1>
            <p className="text-sm text-gray-500 mt-1">Inicie sesión para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {loginError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-xs text-red-700">{loginError}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B3D5C]"
                placeholder="usuario@ejemplo.com"
                required
                disabled={isLoggingIn}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B3D5C]"
                placeholder="••••••••"
                required
                disabled={isLoggingIn}
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-[#0B3D5C] hover:bg-[#072437] text-white font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {isLoggingIn ? 'Iniciando sesión...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">
              ¿No tienes cuenta? Contacta al administrador
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleLogoutClick = async () => {
    await signOut();
    window.location.href = '/';
  };

  // Usuario autenticado correctamente
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      {/* Main content wrapper */}
      <div className="flex-grow w-full">
        {/* Render a premium top header bar for roles other than nominal (as nominal has its own specialized header) */}
        {profile.rol !== 'nominal' && (
          <div className="w-full shrink-0">
            {/* National ribbons top bar */}
            <div className="h-1.5 w-full flex">
              <div className="flex-1 bg-[#FFD700]"></div>
              <div className="flex-1 bg-[#002F6C]"></div>
              <div className="flex-1 bg-[#CF0921]"></div>
              <div className="flex-1 bg-[#008751]"></div>
            </div>

            {/* Main Header Container */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              {/* Brand and Logo */}
              <div className="flex items-center gap-3">
                <span className="text-2xl animate-pulse">🏥</span>
                <div>
                  <h1 className="text-sm font-black text-[#0B3D5C] uppercase tracking-wider leading-none">
                    SALA SITUACIONAL SIM
                  </h1>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.16em] mt-1">
                    Dirección Estadal de Salud • Miranda
                  </p>
                </div>
              </div>

              {/* Central system status */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Nodos en Línea Directa</span>
              </div>

              {/* User Session status and Logout button */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2.5 text-right font-sans">
                  <div className="text-right">
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Identidad Activa</span>
                    <span className="block text-[11px] font-bold text-slate-700 font-mono truncate max-w-[180px]">
                      {profile.email}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-wider rounded-lg border border-blue-100">
                    {profile.rol === 'admin' ? 'Administrador' : 'Operador Nominal'}
                  </span>
                </div>

                <div className="h-6 w-[1px] bg-slate-200"></div>

                {/* Logout Trigger */}
                <button
                  onClick={handleLogoutClick}
                  className="px-4 py-2 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-650 rounded-xl border border-slate-200 hover:border-red-100 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer shadow-sm active:scale-98"
                  title="Cerrar la sesión de usuario"
                >
                  <LogOut size={12} />
                  <span>Salir</span>
                </button>
              </div>
            </header>
          </div>
        )}

        {/* Dynamic child workspace rendering */}
        <div className={profile.rol === 'nominal' ? "" : "p-4 max-w-[1600px] w-full mx-auto"}>
          {profile.rol === 'admin' && <AdminPortal />}
          {profile.rol === 'nominal' && <NominalDashboard />}
        </div>
      </div>

      {/* Footer Area for Admin views */}
      {profile.rol !== 'nominal' && (
        <footer className="py-4 border-t border-slate-150 text-center bg-white shrink-0">
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.25em]">
            GOBIERNO DE MIRANDA • DIRECCIÓN ESTADAL DE SALUD • SIM © 2026
          </p>
        </footer>
      )}
    </div>
  );
}