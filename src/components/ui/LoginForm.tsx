'use client';
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Chrome } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setError('');
    setLoading(true);
    
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (authError) throw authError;
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError('Credenciales incorrectas.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setError('Configuración de Supabase faltante.');
      return;
    }
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/admin/dashboard' }
      });
      if (authError) throw authError;
    } catch (err: any) {
      setError('Error con Google.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleManualLogin} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Institucional</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm"
              placeholder="usuario@miranda.gob.ve"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[#0B3D5C] text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {loading ? 'Validando...' : <><LogIn size={18} /> INGRESAR AL PANEL</>}
        </button>
      </form>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
        <div className="relative flex justify-center text-[10px]"><span className="bg-white px-2 text-gray-300 font-bold uppercase tracking-widest">O entrar con</span></div>
      </div>

      <button
        onClick={handleGoogleLogin}
        className="w-full py-4 bg-white border border-gray-100 text-gray-600 font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
      >
        <Chrome size={18} /> GOOGLE WORKSPACE
      </button>

      {error && <motion.p initial={{opacity:0}} animate={{opacity:1}} className="text-red-500 text-xs text-center font-bold bg-red-50 p-3 rounded-xl border border-red-100">{error}</motion.p>}
    </div>
  );
}
