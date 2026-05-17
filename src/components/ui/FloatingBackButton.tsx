import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function FloatingBackButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/')}
      id="floating-back-btn"
      className="fixed bottom-6 left-6 z-50 w-12 h-12 bg-[#0B3D5C] text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
      aria-label="Regresar al menú principal"
    >
      <ArrowLeft size={24} />
    </button>
  );
}
