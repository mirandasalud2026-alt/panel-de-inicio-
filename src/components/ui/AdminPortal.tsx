import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Trash2, 
  RefreshCw,
  Layers
} from 'lucide-react';
import { supabase, UserProfile } from '../../lib/supabase';
import NominalesManager from '../admin/NominalesManager';

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState<'nominales' | 'usuarios'>('nominales');
  const [systemUsers, setSystemUsers] = useState<UserProfile[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    if (!supabase) return;
    setIsDbLoading(true);
    try {
      const { data, error } = await supabase.from('usuarios').select('*').order('nombre', { ascending: true });
      if (!error && data) {
        setSystemUsers(data);
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
    } finally {
      setIsDbLoading(false);
    }
  };

  const handleUserStatus = async (userId: string, newStatus: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('usuarios').update({ estado: newStatus }).eq('id', userId);
      if (error) throw error;
      fetchUsers();
    } catch (err: any) {
      alert(`Error al actualizar estado: ${err.message}`);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('usuarios').update({ rol: newRole }).eq('id', userId);
      if (error) throw error;
      fetchUsers();
    } catch (err: any) {
      alert(`Error al actualizar rol: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar permanentemente este usuario?')) return;
    if (!supabase) return;
    try {
      const { error } = await supabase.from('usuarios').delete().eq('id', userId);
      if (error) throw error;
      fetchUsers();
    } catch (err: any) {
      alert(`Error al eliminar usuario: ${err.message}`);
    }
  };

  const tabs = [
    { id: 'nominales', label: 'Reportes Nominales', icon: <Layers size={14} /> },
    { id: 'usuarios', label: 'Control de Usuarios', icon: <Users size={14} /> },
  ] as const;

  return (
    <div className="space-y-6 font-sans">
      {/* SECCIÓN CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-lg font-black uppercase text-slate-800 tracking-wider">
            Portal Administrativo Central
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Gestión de Carga de Atenciones Nominales y Acceso del Personal
          </p>
        </div>

        {/* TABS COMPACTOS */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-[#0B3D5C] text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-650 hover:bg-slate-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'nominales' && (
          <motion.div 
            key="nominales" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }} 
            className="space-y-4"
          >
            <NominalesManager />
          </motion.div>
        )}

        {activeTab === 'usuarios' && (
          <motion.div 
            key="usuarios" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }} 
            className="space-y-4"
          >
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Usuarios Registrados en el Sistema</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Control de credenciales, roles de acceso y aprobación de cuentas</p>
                </div>
                <button 
                  onClick={fetchUsers} 
                  className="p-2.5 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                >
                  <RefreshCw size={14} className={isDbLoading ? 'animate-spin' : ''} />
                </button>
              </div>

              {systemUsers.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-black uppercase tracking-widest">
                  {isDbLoading ? 'Cargando directivas de usuarios...' : 'No hay usuarios registrados'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase">
                        <th className="px-4 py-3">Nombre / Identidad</th>
                        <th className="px-4 py-3">Rol del Sistema</th>
                        <th className="px-4 py-3 text-center">Estado</th>
                        <th className="px-4 py-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {systemUsers.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-[#0B3D5C]/10 flex items-center justify-center text-[11px] font-black text-[#0B3D5C]">
                                {u.nombre.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-slate-800 uppercase">{u.nombre}</p>
                                <p className="text-[9px] text-slate-400 font-mono tracking-tight mt-0.5">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select 
                              value={u.rol}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="text-[9px] font-black px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white shadow-xs focus:outline-none focus:border-[#0B3D5C]"
                            >
                              <option value="admin">Administrador</option>
                              <option value="nominal">Operador Nominal</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="inline-flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                u.estado === 'aprobado' ? 'bg-green-500' : 
                                u.estado === 'rechazado' ? 'bg-red-500' : 'bg-amber-500'
                              }`} />
                              <select 
                                value={u.estado || 'pendiente'}
                                onChange={(e) => handleUserStatus(u.id, e.target.value)}
                                className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider focus:outline-none ${
                                  u.estado === 'aprobado' ? 'bg-green-50 text-green-700 border-green-200' :
                                  u.estado === 'rechazado' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                <option value="aprobado">Aprobado</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="rechazado">Rechazado</option>
                              </select>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button 
                              onClick={() => handleDeleteUser(u.id)} 
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar usuario permanentemente"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
