import { useAuth } from '../../hooks/useAuth';
import { Activity, HeartPulse, FileSpreadsheet, LogOut, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function NominalDashboard() {
  const { user, profile, signOut } = useAuth();

  const openForm = (type: 'QUIRURGICA' | 'OBSTETRICA' | 'DEFUNCION') => {
    const emailParam = user?.email ? encodeURIComponent(user.email) : '';
    window.open(`/nominal-form?type=${type}&email=${emailParam}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-[#0B3D5C] text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black">Portal Nominal</h1>
          <p className="text-xs text-slate-300">{profile?.nombre || 'Operador'} • {profile?.rol}</p>
        </div>
        <button onClick={signOut} className="bg-white/10 p-2 rounded-xl"><LogOut size={18} /></button>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid md:grid-cols-3 gap-6">
          <button onClick={() => openForm('QUIRURGICA')} className="bg-white p-6 rounded-2xl shadow-md text-left hover:shadow-lg transition-all border border-slate-200">
            <Activity className="text-blue-600 mb-3" size={32} />
            <h2 className="font-black text-lg">Carga Quirúrgica</h2>
            <p className="text-xs text-slate-500 mt-1">Registro de intervenciones y procedimientos</p>
          </button>
          <button onClick={() => openForm('OBSTETRICA')} className="bg-white p-6 rounded-2xl shadow-md text-left hover:shadow-lg transition-all border border-slate-200">
            <HeartPulse className="text-pink-600 mb-3" size={32} />
            <h2 className="font-black text-lg">Nómina Obstétrica</h2>
            <p className="text-xs text-slate-500 mt-1">Partos, nacimientos y complicaciones</p>
          </button>
          <button onClick={() => openForm('DEFUNCION')} className="bg-white p-6 rounded-2xl shadow-md text-left hover:shadow-lg transition-all border border-slate-200">
            <FileSpreadsheet className="text-stone-600 mb-3" size={32} />
            <h2 className="font-black text-lg">Defunciones</h2>
            <p className="text-xs text-slate-500 mt-1">Certificación y causas de mortalidad</p>
          </button>
        </div>
      </div>
    </div>
  );
}