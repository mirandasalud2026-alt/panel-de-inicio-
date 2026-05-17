import { motion } from 'motion/react';
import { Users, UserPlus, Shield, Trash2 } from 'lucide-react';

export default function AdminPortal() {
  const users = [
    { nombre: 'Dr. Sanchez', email: 'sanchez@gob.ve', rol: 'directivo' },
    { nombre: 'Oficina Central', email: 'oficina@gob.ve', rol: 'oficina' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800">Control de Usuarios</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Gestión de Accesos Institucionales</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-[#0B3D5C] text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-[#1A5F7A] transition-colors">
            <UserPlus size={16} /> Crear Acceso Dir.
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Nombre / Email</th>
                <th className="px-8 py-5 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Rol</th>
                <th className="px-8 py-5 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Acción</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
                  <td className="px-8 py-6">
                    <p className="font-bold text-gray-800 text-sm">{u.nombre}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                      u.rol === 'directivo' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      <Shield size={10} /> {u.rol}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <button className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-[#0B3D5C] text-white p-8 rounded-[2.5rem] shadow-xl space-y-6">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <UserPlus size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Registro de Directivos</h3>
            <p className="text-xs text-white/60 mt-1">Como administrador, defina el acceso inicial para el personal directivo.</p>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Paso 1</p>
              <p className="text-xs font-medium">Crear usuario en Supabase Auth con la clave deseada.</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Paso 2</p>
              <p className="text-xs font-medium">El sistema asignará el perfil automáticamente vía el Trigger SQL.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] flex items-start gap-4">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
          <Shield size={20} />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-amber-900">Seguridad del Panel</h4>
          <p className="text-xs text-amber-800/70 font-medium leading-relaxed">
            Como Administrador, usted tiene la potestad de restablecer claves y revocar accesos. Recuerde que el rol "Admin" es el único que puede ver esta sección de control.
          </p>
        </div>
      </div>
    </div>
  );
}
