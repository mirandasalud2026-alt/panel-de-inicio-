import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import MinimalistDashboard from '../components/ui/MinimalistDashboard';
import OficinaDashboard from '../components/ui/OficinaDashboard';
import AdminPortal from '../components/ui/AdminPortal';
import NominalDashboard from '../components/ui/NominalDashboard';

export default function AdminDashboard() {
  const { profile, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B3D5C] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
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

  // Usuario autenticado correctamente
  return (
    <div className="w-full">
      <div className="bg-green-100 p-2 text-center text-xs text-green-800">
        ✅ Usuario: {profile.email} | Rol: {profile.rol}
      </div>

      {profile.rol === 'admin' && <AdminPortal />}
      {profile.rol === 'directivo' && <MinimalistDashboard />}
      {profile.rol === 'oficina' && <OficinaDashboard />}
      {profile.rol === 'nominal' && <NominalDashboard />}
    </div>
  );
}