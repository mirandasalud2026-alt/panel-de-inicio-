import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Users, Trash2, RefreshCw, Database, ShieldAlert, CheckCircle, AlertCircle } from 'lucide-react';
import FloatingBackButton from '../components/ui/FloatingBackButton';

interface UserRecord {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  estado: string;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile?.rol !== 'admin') {
      window.location.href = '/';
      return;
    }
    fetchUsers();
  }, [profile]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('usuarios').select('*').order('nombre');
    if (!error && data) setUsers(data);
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await supabase.from('usuarios').update({ rol: newRole }).eq('id', userId);
    if (error) showMessage('error', error.message);
    else { showMessage('success', 'Rol actualizado'); fetchUsers(); }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    const { error } = await supabase.from('usuarios').update({ estado: newStatus }).eq('id', userId);
    if (error) showMessage('error', error.message);
    else { showMessage('success', 'Estado actualizado'); fetchUsers(); }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Eliminar permanentemente este usuario?')) return;
    const { error } = await supabase.from('usuarios').delete().eq('id', userId);
    if (error) showMessage('error', error.message);
    else { showMessage('success', 'Usuario eliminado'); fetchUsers(); }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  if (profile?.rol !== 'admin') return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-[#0B3D5C] text-white p-6">
        <h1 className="text-2xl font-black">Panel de Administración</h1>
        <p className="text-sm text-slate-300">Gestión de usuarios, roles y auditoría</p>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {message && (
          <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />} {message.text}
          </div>
        )}

        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-black flex items-center gap-2"><Users size={18} /> Usuarios registrados</h2>
            <button onClick={fetchUsers} className="p-2 bg-slate-100 rounded-xl"><RefreshCw size={16} /></button>
          </div>
          {loading ? (
            <div className="p-8 text-center">Cargando...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr><th className="p-3 text-left">Nombre</th><th className="p-3 text-left">Email</th><th className="p-3 text-left">Rol</th><th className="p-3 text-left">Estado</th><th className="p-3 text-right">Acciones</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t">
                      <td className="p-3 font-medium">{u.nombre}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">
                        <select value={u.rol} onChange={e => handleRoleChange(u.id, e.target.value)} className="border rounded p-1 text-xs">
                          <option value="admin">Admin</option><option value="directivo">Directivo</option><option value="oficina">Oficina</option><option value="nominal">Nominal</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <select value={u.estado} onChange={e => handleStatusChange(u.id, e.target.value)} className="border rounded p-1 text-xs">
                          <option value="aprobado">Aprobado</option><option value="pendiente">Pendiente</option><option value="rechazado">Rechazado</option>
                        </select>
                      </td>
                      <td className="p-3 text-right">
                        <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 bg-white rounded-2xl border p-4">
          <h3 className="font-black flex items-center gap-2"><Database size={18} /> Herramientas de sistema</h3>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <button onClick={() => alert('Backup manual no implementado aún')} className="bg-slate-800 text-white p-3 rounded-xl text-sm font-bold">Respaldar datos a Google Drive</button>
            <button onClick={() => alert('Purgar nominales antiguos (7 días)')} className="bg-rose-600 text-white p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"><ShieldAlert size={16} /> Purgar bitácora {">"}7 días</button>
          </div>
        </div>
      </div>
      <FloatingBackButton />
    </div>
  );
}