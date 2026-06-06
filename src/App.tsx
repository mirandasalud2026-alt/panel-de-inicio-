import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';   // <-- ESTA ES LA LÍNEA QUE FALTA
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import InformativoPage from './pages/InformativoPage';
import AdminDashboard from './pages/AdminDashboard';
import NominalDashboard from './components/ui/NominalDashboard';
import NominalFormWindow from './components/ui/NominalFormWindow';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { DashboardProvider } from './contexts/DashboardContext';

function AppRoutes() {
  const { user, profile, loading, fetchingProfile, fetchError, retryFetchProfile } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center">Cargando sesión...</div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/sitio-informativo" element={<InformativoPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (fetchingProfile) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center">Cargando perfil...</div>;
  }

  if (fetchError && !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <p>Error de conexión: {fetchError}</p>
        <button onClick={retryFetchProfile} className="px-4 py-2 bg-blue-600 rounded">Reintentar</button>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/sitio-informativo" element={<InformativoPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/nominal" element={<NominalDashboard />} />
      <Route path="/nominal-form" element={<NominalFormWindow />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo({ top: 0, behavior: 'instant' }), [pathname]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardProvider>
        <Router>
          <ScrollToTop />
          <AppRoutes />
        </Router>
      </DashboardProvider>
    </AuthProvider>
  );
}