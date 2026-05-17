import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Lock, 
  Activity, 
  Building2, 
  ClipboardCheck, 
  Bell, 
  Calendar, 
  Download, 
  MapPin, 
  BarChart3, 
  FileText, 
  TrendingUp,
  ChevronRight,
  Stethoscope,
  Baby,
  Syringe
} from 'lucide-react';

export default function LandingPage() {
  const mostrarToast = (mensaje: string) => {
    // In a real app, this would use a toast library or state
    console.log(mensaje);
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] font-sans pb-10 overflow-x-hidden">
      {/* HERO HEADER */}
      <header className="relative bg-gradient-to-br from-[#0B3D5C] via-[#0d4a6e] to-[#1A5F7A] text-white px-5 py-8 md:px-10 md:py-12 overflow-hidden shadow-xl">
        {/* Decorative elements */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl border border-white/25">
              🏥
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-none">SIM Miranda</h1>
              <span className="text-xs opacity-80 uppercase tracking-widest font-medium">Sistema de Información en Salud</span>
            </div>
          </div>
          <div className="bg-[#E8A838] text-[#0B3D5C] px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse self-end md:self-auto">
            🟢 En línea
          </div>
        </div>

        {/* Stats RÃ¡pidas */}
        <div className="relative z-10 grid grid-cols-3 gap-3 md:gap-6 mb-8 max-w-4xl">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-xl md:text-3xl font-black">2,847</div>
            <div className="text-[10px] md:text-xs opacity-70 uppercase tracking-widest mt-1">Establecimientos</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-xl md:text-3xl font-black">47</div>
            <div className="text-[10px] md:text-xs opacity-70 uppercase tracking-widest mt-1">ASICs Activos</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-xl md:text-3xl font-black">89.3%</div>
            <div className="text-[10px] md:text-xs opacity-70 uppercase tracking-widest mt-1">Cobertura</div>
          </div>
        </div>

        {/* CTAs */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-4 max-w-lg">
          <a 
            href="https://sites.google.com/view/saludmiranda04" 
            target="_blank" 
            rel="noreferrer"
            className="flex-1 bg-white text-[#0B3D5C] px-6 py-4 rounded-3xl font-bold text-sm flex items-center justify-center gap-3 shadow-2xl hover:bg-gray-50 transition-all hover:-translate-y-1"
          >
            <BookOpen size={20} /> Entrar al Sitio Informativo
          </a>
          <Link 
            to="/login"
            className="flex-1 bg-white/10 border border-white/20 backdrop-blur-md text-white px-6 py-4 rounded-3xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-white/20 transition-all"
          >
            <Lock size={20} /> Acceso Personal
          </Link>
        </div>
      </header>

      {/* WAVE DECORATOR */}
      <div className="h-8 bg-[#F0F4F8] relative -mt-1 overflow-hidden">
        <svg viewBox="0 0 1440 30" preserveAspectRatio="none" className="absolute bottom-full w-full h-[30px]">
          <path d="M0,15 C360,30 720,0 1080,15 C1260,22 1380,8 1440,10 L1440,30 L0,30 Z" fill="#F0F4F8" />
        </svg>
      </div>

      <main className="max-w-5xl mx-auto px-5 py-2">
        
        {/* NOTICIAS */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
              <span className="text-2xl">📰</span> Noticias Destacadas
            </h2>
            <Link to="#" className="text-sm font-semibold text-[#0B3D5C] hover:underline">Ver todas →</Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x">
            {/* Noticia Urgente */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="min-w-[300px] md:min-w-[350px] bg-white rounded-3xl p-6 shadow-sm border-l-4 border-red-500 snap-start shrink-0 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Bell size={60} />
              </div>
              <span className="inline-block px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3">
                🔴 Urgente
              </span>
              <h3 className="font-bold text-lg text-gray-800 leading-tight mb-3">Alerta Epidemiológica: Dengue en Valles del Tuy</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">Reforzar medidas de prevención y control vectorial en los municipios afectados.</p>
              <div className="flex justify-between items-center text-[10px] text-gray-400 font-medium">
                <span className="flex items-center gap-1"><Calendar size={12} /> Hace 2 horas</span>
                <span>Salud Miranda</span>
              </div>
            </motion.div>

            {/* Noticia 2 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="min-w-[300px] md:min-w-[350px] bg-white rounded-3xl p-6 shadow-sm border-l-4 border-amber-400 snap-start shrink-0"
            >
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3">
                ⭐ Destacada
              </span>
              <h3 className="font-bold text-lg text-gray-800 leading-tight mb-3">Jornada integral llega a Altos Mirandinos</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">Más de 15 especialidades médicas disponibles este fin de semana.</p>
              <div className="flex justify-between items-center text-[10px] text-gray-400 font-medium">
                <span className="flex items-center gap-1"><Calendar size={12} /> Ayer</span>
                <span>Coordinación ASIC</span>
              </div>
            </motion.div>

            {/* Noticia 3 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="min-w-[300px] md:min-w-[350px] bg-white rounded-3xl p-6 shadow-sm border-l-4 border-blue-500 snap-start shrink-0"
            >
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3">
                📘 Informativa
              </span>
              <h3 className="font-bold text-lg text-gray-800 leading-tight mb-3">Nuevo sistema de reporte semanal digital</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">A partir de junio todos los ASICs deben migrar al nuevo formato.</p>
              <div className="flex justify-between items-center text-[10px] text-gray-400 font-medium">
                <span className="flex items-center gap-1"><Calendar size={12} /> 15 May</span>
                <span>Dirección General</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* BALANCE DE GESTIÓN */}
        <section className="bg-gradient-to-br from-gray-50 to-gray-200/50 rounded-[2.5rem] p-8 mb-10 shadow-sm border border-white/50">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#0B3D5C] rounded-xl flex items-center justify-center text-white">
              <BarChart3 size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Balance de Gestión – Mayo 2026</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Establecimientos', value: '2,847', icon: <Building2 className="text-blue-500" /> },
              { label: 'Vacunas', value: '48,320', icon: <Syringe className="text-emerald-500" /> },
              { label: 'Partos', value: '1,245', icon: <Baby className="text-amber-500" /> },
              { label: 'Consultas', value: '127,890', icon: <Stethoscope className="text-rose-500" /> },
            ].map((st, i) => (
              <div key={i} className="bg-white p-5 rounded-3xl shadow-sm text-center">
                <div className="flex justify-center mb-3">
                  {st.icon}
                </div>
                <div className="text-xl font-black text-[#0B3D5C]">{st.value}</div>
                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">{st.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="flex justify-between text-sm font-bold text-gray-700 mb-3">
              <span>Meta de cobertura de reporte semanal</span>
              <span className="text-[#0B3D5C]">89.3%</span>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: '89.3%' }}
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"
              ></motion.div>
            </div>
            <p className="text-[10px] text-gray-400 font-bold mt-3 flex items-center gap-1.5 uppercase tracking-widest">
              <ClipboardCheck size={12} /> 42 de 47 ASICs han reportado esta semana
            </p>
          </div>
        </section>

        {/* BOLETINES */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
              <span className="text-2xl">📋</span> Boletines y Descargas
            </h2>
          </div>

          <div className="grid gap-3">
            {[
              { name: 'Boletín Epidemiológico Semanal N° 20', desc: 'Semana 20 – 11 al 17 de Mayo 2026', type: 'pdf', color: 'bg-rose-50 text-rose-600' },
              { name: 'Reporte Mensual de Cobertura – Abril 2026', desc: 'Consolidado por ASIC y municipio', type: 'excel', color: 'bg-emerald-50 text-emerald-600' },
              { name: 'Plan Operativo Anual 2026', desc: 'Documento rector de gestión en salud', type: 'doc', color: 'bg-blue-50 text-blue-600' }
            ].map((doc, i) => (
              <motion.div 
                key={i}
                whileTap={{ scale: 0.98 }}
                onClick={() => mostrarToast(`Descargando ${doc.name}...`)}
                className="bg-white p-5 rounded-3xl shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 ${doc.color} rounded-2xl flex items-center justify-center text-xl shrink-0`}>
                  <FileText size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-gray-800">{doc.name}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{doc.desc}</p>
                </div>
                <div className="w-10 h-10 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center hover:bg-[#0B3D5C] hover:text-white transition-colors shrink-0">
                  <Download size={18} />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ACCESOS RÁPIDOS */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Directorio', desc: 'Contactos oficiales', icon: '📞', to: '#' },
            { label: 'Jornadas', desc: 'Calendario de salud', icon: '📅', to: '#' },
            { label: 'Ejes Salud', desc: 'Mapa de ASICs', icon: '📍', to: '#' },
            { label: 'Estadísticas', desc: 'Open Data Miranda', icon: '📈', to: '#' },
          ].map((acc, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -3 }}
              className="bg-white p-6 rounded-3xl shadow-sm text-center cursor-pointer border border-transparent hover:border-[#0B3D5C]/10"
            >
              <span className="text-3xl block mb-3">{acc.icon}</span>
              <h4 className="font-bold text-sm text-gray-800">{acc.label}</h4>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">{acc.desc}</p>
            </motion.div>
          ))}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="max-w-5xl mx-auto px-5 pt-10 border-t border-gray-200">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex gap-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <Link to="#" className="hover:text-[#0B3D5C]">Sobre SIM</Link>
            <Link to="#" className="hover:text-[#0B3D5C]">Privacidad</Link>
            <Link to="#" className="hover:text-[#0B3D5C]">Contacto</Link>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">© 2026 SIM Miranda – Sistema de Información en Salud</p>
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Dirección General de Salud · Estado Miranda</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
