import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, MapPin, Phone, Mail, Clock, Info, ShieldCheck } from 'lucide-react';

export default function InformativoPage() {
  const navigate = useNavigate();

  const ejes = [
    { name: 'Altos Mirandinos', icon: '🏔️', description: 'Guaicaipuro, Carrizal, Los Salias' },
    { name: 'Valles del Tuy', icon: '🏞️', description: 'Cristóbal Rojas, Urdaneta, Lander, Paz Castillo, Simón Bolívar, Independencia' },
    { name: 'Barlovento', icon: '🌊', description: 'Brión, Buroz, Andrés Bello, Páez, Pedro Gual' },
    { name: 'Guarenas-Guatire', icon: '⛰️', description: 'Plaza, Zamora' },
    { name: 'Área Metropolitana', icon: '🏙️', description: 'Sucre, Baruta, Chacao, El Hatillo' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
      {/* Header */}
      <header className="bg-[#0B3D5C] text-white px-6 py-8 md:px-12 md:py-12 rounded-b-[3rem] shadow-xl">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/60 text-xs font-bold uppercase tracking-widest mb-8 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Regresar al Inicio
        </button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Portal de Información</h1>
            <p className="text-white/60 font-medium mt-1">Guía institucional para el personal y ciudadanos</p>
          </div>
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl border border-white/20">
            📖
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 mt-10 space-y-10">
        
        {/* Intro */}
        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-center">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shrink-0">
            <Info size={40} />
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Misión de SIM Miranda</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Consolidar un sistema único de información que permita el monitoreo en tiempo real de la situación de salud en todo el estado, 
              optimizando el tiempo de respuesta y la asignación de recursos.
            </p>
          </div>
        </section>

        {/* Ejes Territoriales */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-3 text-gray-800 px-2">
            <MapPin className="text-[#0B3D5C]" /> Distribución por Ejes
          </h2>
          <div className="grid gap-4">
            {ejes.map((eje, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6"
              >
                <div className="text-3xl w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center">{eje.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-800">{eje.name}</h3>
                  <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-tight">{eje.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Contactos */}
        <section className="bg-[#0B3D5C] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10">
            <Phone size={120} />
          </div>
          
          <h2 className="text-2xl font-bold mb-8 relative z-10">Central de Contacto</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><Phone size={18} /></div>
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Atención 24/7</p>
                  <p className="text-sm font-bold">0800-MIRANDA (6472632)</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><Mail size={18} /></div>
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Correo Electrónico</p>
                  <p className="text-sm font-bold">salud@miranda.gob.ve</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><Clock size={18} /></div>
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Horario Administrativo</p>
                  <p className="text-sm font-bold">Lun - Vie: 8:00 AM - 5:00 PM</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><ShieldCheck size={18} /></div>
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Soporte Técnico SIM</p>
                  <p className="text-sm font-bold">soporte.sim@miranda.gob.ve</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="text-center py-10">
          <a 
            href="https://sites.google.com/view/saludmiranda04" 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center gap-3 text-[#0B3D5C] font-bold text-xs uppercase tracking-[0.2em] hover:opacity-70 transition-opacity"
          >
            Visitar Google Site Tradicional <BookOpen size={16} />
          </a>
        </div>
      </main>
    </div>
  );
}
