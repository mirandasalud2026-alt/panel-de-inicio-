import { Link } from 'react-router-dom';
import { Activity, HeartPulse, FileSpreadsheet, ShieldCheck, MapPin, Calendar, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Bandera institucional */}
      <div className="h-2 w-full flex">
        <div className="flex-1 bg-[#FFD700]"></div>
        <div className="flex-1 bg-[#002F6C]"></div>
        <div className="flex-1 bg-[#CF0921]"></div>
        <div className="flex-1 bg-[#008751]"></div>
      </div>

      {/* Hero */}
      <header className="bg-[#0B3D5C] text-white py-12 px-6 text-center">
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Miranda Salud</h1>
        <p className="text-sm md:text-base text-slate-300 mt-2 max-w-2xl mx-auto">
          Sistema Integrado de Información en Salud – Sala Situacional y Registro Nominal
        </p>
        <div className="mt-6 flex gap-4 justify-center flex-wrap">
          <Link to="/sitio-informativo" className="bg-white text-[#0B3D5C] px-6 py-2 rounded-xl font-bold text-sm">Ver informativo</Link>
          <Link to="/login" className="bg-amber-500 text-[#0B3D5C] px-6 py-2 rounded-xl font-bold text-sm">Acceso al sistema</Link>
        </div>
      </header>

      {/* Tarjetas de funcionalidades */}
      <section className="max-w-6xl mx-auto py-16 px-6 grid md:grid-cols-3 gap-8">
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Activity className="text-blue-700" size={24} />
          </div>
          <h3 className="font-black text-lg uppercase">Nominal Quirúrgica</h3>
          <p className="text-sm text-slate-500 mt-2">Registro de intervenciones quirúrgicas con trazabilidad de pacientes y médicos tratantes.</p>
        </div>
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center">
          <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <HeartPulse className="text-pink-700" size={24} />
          </div>
          <h3 className="font-black text-lg uppercase">Nómina Obstétrica</h3>
          <p className="text-sm text-slate-500 mt-2">Control de partos, nacimientos y seguimiento materno-infantil.</p>
        </div>
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center">
          <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="text-stone-700" size={24} />
          </div>
          <h3 className="font-black text-lg uppercase">Defunciones</h3>
          <p className="text-sm text-slate-500 mt-2">Certificación de defunciones y análisis de causas de mortalidad.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-100 py-6 text-center text-xs text-slate-400 uppercase tracking-wider">
        Gobierno Bolivariano de Miranda – Dirección Estadal de Salud – SIM Miranda 2026
      </footer>
    </div>
  );
}