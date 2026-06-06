import { Link, useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* ... todo el diseño ... */}
      <div className="flex gap-4">
        <Link to="/sitio-informativo" className="px-6 py-2 bg-blue-600 text-white rounded">REPORTE DE ATENCIONES</Link>
        <button onClick={() => navigate('/login')} className="px-6 py-2 bg-green-600 text-white rounded">ACCESO SIM</button>
      </div>
      {/* ... */}
    </div>
  );
}