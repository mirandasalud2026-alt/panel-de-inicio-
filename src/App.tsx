import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import InformativoPage from './pages/InformativoPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';

/**
 * SIM Miranda - App Principal
 * Arquitectura PWA con autenticación basada en roles.
 */
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/sitio-informativo" element={<InformativoPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}
