import LoginForm from '../components/ui/LoginForm';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#F3F4F6] flex items-center justify-center px-6 relative overflow-hidden font-sans">
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white p-10 rounded-[2.5rem] shadow-2xl relative z-10 border border-gray-100"
      >
        <Link to="/" className="inline-flex items-center gap-2 text-[#0B3D5C] font-bold text-[10px] mb-8 uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
          <ArrowLeft size={14} /> Regresar
        </Link>

        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-gray-100">
            <span className="text-4xl">🏥</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#0B3D5C] tracking-tight leading-none">Acceso SIM</h1>
          <p className="text-[10px] text-gray-400 mt-2 font-black uppercase tracking-widest">Gobierno del Estado Miranda</p>
          <div className="mt-3 inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">
            Portal Oficial de Salud
          </div>
        </div>

        <LoginForm />
      </motion.div>
      
      <div className="absolute bottom-8 text-center w-full opacity-20">
        <p className="text-[10px] text-[#0B3D5C] font-extrabold uppercase tracking-[0.3em]">
          Miranda • Salud • 2026
        </p>
      </div>
    </main>
  );
}
