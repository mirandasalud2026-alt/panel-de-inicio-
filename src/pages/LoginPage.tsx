import LoginForm from '../components/ui/LoginForm';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans flex flex-col justify-between">
      {/* Dynamic Flag Accent Ribbon at the very top */}
      <div className="h-2 w-full flex shrink-0">
        <div className="flex-1 bg-[#FFD700]"></div> {/* Yellow */}
        <div className="flex-1 bg-[#002F6C]"></div> {/* Blue */}
        <div className="flex-1 bg-[#CF0921]"></div> {/* Red */}
        <div className="flex-1 bg-[#008751]"></div> {/* Green */}
      </div>

      <main className="flex-1 flex items-center justify-center px-6 relative overflow-hidden py-12">
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
      </main>

      {/* FOOTER */}
      <footer className="py-6 border-t border-gray-200 text-center bg-gray-50/50">
        <p className="text-[9px] text-gray-500 font-extrabold uppercase tracking-[0.25em]">
          GOBIERNO DE MIRANDA • DIRECCIÓN ESTADAL DE SALUD • SIM 2026
        </p>
      </footer>
    </div>
  );
}
