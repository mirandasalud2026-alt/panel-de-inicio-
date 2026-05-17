import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

export default function LoginForm() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setError('Configuración de Supabase faltante. Contacte al administrador.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/admin/dashboard'
        }
      });
      
      if (authError) throw authError;

      // Note: In OAuth flows, the redirect happens automatically.
    } catch (err: any) {
      console.error(err);
      setError('Error al iniciar sesión con Google.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-3 bg-[#0B3D5C] text-white font-semibold rounded-xl hover:bg-[#0A3450] disabled:opacity-50 transition-colors shadow-md"
      >
        <LogIn size={20} />
        {loading ? 'Redirigiendo...' : 'Ingresar con Google'}
      </button>
      {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded-lg">{error}</p>}
      <p className="text-xs text-gray-400 text-center uppercase tracking-tight font-bold opacity-60">
        Personal autorizado • Estado Miranda
      </p>
    </div>
  );
}
