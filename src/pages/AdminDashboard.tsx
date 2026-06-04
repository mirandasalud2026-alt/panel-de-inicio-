import { useAuth } from '../hooks/useAuth';
import MinimalistDashboard from '../components/ui/MinimalistDashboard';
import OficinaDashboard from '../components/ui/OficinaDashboard';
import AdminPortal from '../components/ui/AdminPortal';
import NominalDashboard from '../components/ui/NominalDashboard';
// ... otros imports

export default function AdminDashboard() {
  const { profile, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  // Depuración rápida: si el perfil es null, el usuario no está en la tabla 'usuarios'
  if (!profile) {
    return <div className="p-10 text-center text-red-500">Error: No se encontró perfil para este usuario.</div>;
  }

  return (
    <div className="w-full">
      {/* Depuración visual del rol actual */}
      <div className="bg-yellow-100 p-2 text-center text-xs">Rol detectado: {profile.rol}</div>

      {profile.rol === 'admin' && <AdminPortal />}
      {profile.rol === 'directivo' && <MinimalistDashboard />}
      {profile.rol === 'oficina' && <OficinaDashboard />}
      {profile.rol === 'nominal' && <NominalDashboard />}
    </div>
  );
}