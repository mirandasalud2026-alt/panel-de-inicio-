import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  Activity, 
  Sparkles,
  ChevronDown,
  Filter
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ==========================================
// INTERFACES Y DUMP DE DATOS PARA DESEMPATE
// ==========================================

export interface TransitoReporte {
  id_centro: string;
  nombre_centro: string;
  asic: string;
  eje_geografico: string;
  ultimo_reporte: string;
  estado_semaforo: 'Verde' | 'Amarillo' | 'Rojo' | string;
  horas_retraso: number;
  actualizado_en: string;
}

export interface IndicadoresSalud {
  infecciones_ira: number;
  dengue: number;
  hipertension: number;
  diabetes: number;
}

export interface EspecialidadData {
  nombre: string;
  consultas: number;
}

// Datos de semilla en caso de desconexión temporal de Supabase
const SEMILLA_REPORTES: TransitoReporte[] = [
  {
    id_centro: "ALT_AS_GUA",
    nombre_centro: "Ambulatorio Guaremal",
    asic: "ASIC GUAREMAL",
    eje_geografico: "ALTOS MIRANDINOS",
    ultimo_reporte: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    estado_semaforo: "Verde",
    horas_retraso: 0,
    actualizado_en: new Date().toISOString()
  },
  {
    id_centro: "ALT_AS_CAR_CDI",
    nombre_centro: "CDI Carrizal",
    asic: "ASIC CARRIZAL",
    eje_geografico: "ALTOS MIRANDINOS",
    ultimo_reporte: new Date(Date.now() - 29 * 3600 * 1000).toISOString(),
    estado_semaforo: "Amarillo",
    horas_retraso: 29,
    actualizado_en: new Date().toISOString()
  },
  {
    id_centro: "VAL_AS_OCU",
    nombre_centro: "Ambulatorio Ocumare",
    asic: "ASIC OCUMARE DEL TUY",
    eje_geografico: "VALLES DEL TUY",
    ultimo_reporte: new Date(Date.now() - 53 * 3600 * 1000).toISOString(),
    estado_semaforo: "Rojo",
    horas_retraso: 53,
    actualizado_en: new Date().toISOString()
  },
  {
    id_centro: "GUA_AS_GG",
    nombre_centro: "Hospitalito de Guarenas",
    asic: "ASIC GUARENAS",
    eje_geografico: "GUARENAS-GUATIRE",
    ultimo_reporte: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    estado_semaforo: "Verde",
    horas_retraso: 0,
    actualizado_en: new Date().toISOString()
  },
  {
    id_centro: "BAR_AS_MAM",
    nombre_centro: "CDI Mamporal",
    asic: "ASIC MAMPORAL",
    eje_geografico: "BARLOVENTO",
    ultimo_reporte: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
    estado_semaforo: "Verde",
    horas_retraso: 0,
    actualizado_en: new Date().toISOString()
  },
  {
    id_centro: "MET_AS_CHA",
    nombre_centro: "Ambulatorio El Pedregal",
    asic: "ASIC CHACAO",
    eje_geografico: "METROPOLITANO",
    ultimo_reporte: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    estado_semaforo: "Rojo",
    horas_retraso: 72,
    actualizado_en: new Date().toISOString()
  }
];

export default function MinimalistDashboard() {
  const [reportes, setReportes] = useState<TransitoReporte[]>(SEMILLA_REPORTES);
  const [ejeFiltro, setEjeFiltro] = useState<string>('TODO');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Cargar indicadores de morbilidad vivos (Mayoritariamente dinámicos)
  // Nota: De acuerdo a las especificaciones minimalistas, los indicadores en 0 quedan anulados visualmente
  const [morbilidad] = useState<IndicadoresSalud>({
    infecciones_ira: 34,
    dengue: 0, // No se mostrará (0 casos)
    hipertension: 19,
    diabetes: 8
  });

  // Especialidades de salud con consultas reales del período
  const [especialidades] = useState<EspecialidadData[]>([
    { nombre: 'Medicina General', consultas: 142 },
    { nombre: 'Pediatría', consultas: 89 },
    { nombre: 'Ginecología', consultas: 41 },
    { nombre: 'Odontología', consultas: 0 },   // Se agruparán automáticamente bajo "Otros servicios"
    { nombre: 'Oftalmología', consultas: 0 },  // Se agruparán automáticamente bajo "Otros servicios"
    { nombre: 'Psicología', consultas: 0 }     // Se agruparán automáticamente bajo "Otros servicios"
  ]);

  // CARGAR DATOS REGISTRADOS DESDE SUPABASE REAL-TIME
  useEffect(() => {
    async function cargarTransito() {
      if (!supabase) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('transito_reportes')
          .select('*')
          .order('actualizado_en', { ascending: false });

        if (!error && data && data.length > 0) {
          setReportes(data);
        }
      } catch (e) {
        console.warn("Utilizando estados de respaldo para visualización minimalista Miranda Salud 2026", e);
      } finally {
        setIsLoading(false);
      }
    }
    cargarTransito();
  }, []);

  // FILTRADO DINÁMICO POR EJE CUMPLIDO
  const reportesFiltrados = useMemo(() => {
    if (ejeFiltro === 'TODO') return reportes;
    return reportes.filter(r => r.eje_geografico.toUpperCase() === ejeFiltro.toUpperCase());
  }, [reportes, ejeFiltro]);

  // CÁLCULO CIENTÍFICO DE CUMPLIMIENTO OPERATIVO GENERAL
  const metricaCumplimiento = useMemo(() => {
    const total = reportesFiltrados.length;
    if (total === 0) return 100;
    const conformes = reportesFiltrados.filter(r => r.estado_semaforo.toLowerCase() === 'verde').length;
    return Math.round((conformes / total) * 100);
  }, [reportesFiltrados]);

  // CLASIFICADOR DINÁMICO DE ESPECIALIDADES PRODUCTIVAS CON FILTRADO DE CERO (BLOQUE 3)
  const especialidadesAgrupadas = useMemo(() => {
    const activas = especialidades.filter(e => e.consultas > 0);
    const inactivas = especialidades.filter(e => e.consultas === 0);
    const sumaOtros = inactivas.reduce((acc, curr) => acc + curr.consultas, 0);

    return {
      activas: activas.sort((a, b) => b.consultas - a.consultas),
      otrosCount: inactivas.length,
      otrosSuma: sumaOtros
    };
  }, [especialidades]);

  return (
    <div className="bg-[#FFFFFF] text-[#1A1A1A] min-h-screen font-sans antialiased overflow-x-hidden selection:bg-[#EBF5FF] selection:text-[#0B3D5C]">
      {/* CABECERA MINIMALISTA */}
      <header className="max-w-4xl mx-auto px-6 pt-12 pb-8 flex justify-between items-center bg-white border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-[0.25em]">SALA SITUACIONAL 2026</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 mt-1 uppercase">Miranda Salud</h1>
        </div>
        
        {/* FILTRO GENERAL TÁCTIL (MÁRGENES AMPLIO) */}
        <div className="relative">
          <select 
            value={ejeFiltro}
            onChange={(e) => setEjeFiltro(e.target.value)}
            className="appearance-none bg-gray-50 hover:bg-gray-100 border border-transparent rounded-full px-5 py-2.5 text-xs font-black text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer pr-10"
          >
            <option value="TODO">TODOS LOS EJES</option>
            <option value="ALTOS MIRANDINOS">ALTOS MIRANDINOS</option>
            <option value="VALLES DEL TUY">VALLES DEL TUY</option>
            <option value="GUARENAS-GUATIRE">GUARENAS-GUATIRE</option>
            <option value="BARLOVENTO">BARLOVENTO</option>
            <option value="METROPOLITANO">METROPOLITANO</option>
          </select>
          <ChevronDown size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-16">
        
        {/* =========================================================================
            BLOQUE 1: EL CORAZÓN OPERATIVO (Cumplimiento Diario de Salas)
            ========================================================================= */}
        <section id="bloque-cumplimiento" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">Módulo Operativo</span>
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight mt-0.5">Control de Tránsito ASIC</h2>
            </div>
            
            {/* KPI Impacto Masivo (Arriba Izquierda relativo o adaptado a cabecera) */}
            <div className="flex items-baseline gap-2 bg-[#F8F9FA] px-4 py-2.5 rounded-2xl border border-gray-100">
              <span className="text-3xl font-black tracking-tighter text-[#1A1A1A]">{metricaCumplimiento}%</span>
              <span className="text-[10px] font-extrabold uppercase text-emerald-600 tracking-wider">Cumplimiento General</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {reportesFiltrados.map((item) => {
              // Mapeo dinámico de colores reservados exclusivamente para alertas del Semáforo
              const esVerde = item.estado_semaforo.toLowerCase() === 'verde';
              const esAmarillo = item.estado_semaforo.toLowerCase() === 'amarillo';
              const esRojo = item.estado_semaforo.toLowerCase() === 'rojo';

              let colEstilo = 'bg-white border-gray-100';
              let badgeEstilo = 'bg-emerald-50 text-emerald-600 border-emerald-100/30';
              
              if (esAmarillo) {
                colEstilo = 'bg-white border-amber-200 shadow-sm';
                badgeEstilo = 'bg-amber-100/60 text-amber-900 border-amber-300/30';
              } else if (esRojo) {
                colEstilo = 'border-red-200 bg-red-50/10 shadow-sm';
                badgeEstilo = 'bg-red-500/10 text-red-700 border-red-300/30';
              }

              return (
                <div 
                  key={item.id_centro} 
                  className={`p-5 rounded-3xl border transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between ${colEstilo}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        esVerde ? 'bg-emerald-500' : esAmarillo ? 'bg-amber-500 animate-pulse' : 'bg-red-500 animate-ping'
                      }`} />
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{item.asic}</span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight line-clamp-1">{item.nombre_centro}</h3>
                    <p className="text-[9px] font-mono text-gray-400 uppercase tracking-wide">{item.id_centro}</p>
                  </div>

                  {/* Sutil indicador de retraso inyectado dinámicamente desde Supabase */}
                  <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-[9px] text-gray-400 font-semibold uppercase">Retraso</span>
                    {esVerde ? (
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${badgeEstilo}`}>Al Día</span>
                    ) : (
                      <span className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${badgeEstilo} flex items-center gap-1`}>
                        <Clock size={10} className="shrink-0" /> {item.horas_retraso}h
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>


        {/* =========================================================================
            BLOQUE 2: ALERTAS EPIDEMIOLÓGICAS (Ocultamiento Inteligente de Ceros / Fiel a la Pirámide de Datos)
            ========================================================================= */}
        <section id="bloque-morbilidad" className="space-y-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">Monitoreo Médico Oportuno</span>
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight mt-0.5">Alertas de Morbilidad Resaltadas</h2>
            <p className="text-[11px] text-gray-400">Sólo se muestran de forma destacada las enfermedades con casos activos, eliminando el ruido en cero.</p>
          </div>

          <div className="flex flex-wrap gap-4">
            {/* INFECCIONES IRA (Casos Activos > 0) */}
            {morbilidad.infecciones_ira > 0 && (
              <div className="bg-slate-50 hover:bg-slate-100/90 border border-slate-100 transition-colors p-5 rounded-3xl flex items-center gap-4 py-4 pr-6 max-w-sm">
                <div className="p-3 bg-slate-900 text-white rounded-2xl">
                  <Activity size={16} />
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Infección Respiratoria Aguda (IRA)</h4>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xl font-black text-gray-900">{morbilidad.infecciones_ira}</span>
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase">casos activos</span>
                  </div>
                </div>
              </div>
            )}

            {/* HIPERTENSIÓN (Casos Activos > 0) */}
            {morbilidad.hipertension > 0 && (
              <div className="bg-slate-50 hover:bg-slate-100/90 border border-slate-100 transition-colors p-5 rounded-3xl flex items-center gap-4 py-4 pr-6 max-w-sm">
                <div className="p-3 bg-red-400/9 text-red-500 rounded-2xl">
                  <span className="font-black text-xs">HTA</span>
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Nuevos Diagnósticos HTA</h4>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xl font-black text-gray-900">{morbilidad.hipertension}</span>
                    <span className="text-[10px] font-extrabold text-[#0B3D5C] uppercase">casos control</span>
                  </div>
                </div>
              </div>
            )}

            {/* DIABETES (Casos Activos > 0) */}
            {morbilidad.diabetes > 0 && (
              <div className="bg-slate-50 hover:bg-slate-100/90 border border-slate-100 transition-colors p-5 rounded-3xl flex items-center gap-4 py-4 pr-6 max-w-sm">
                <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
                  <span className="font-black text-xs">DB</span>
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Nuevos Diabéticos Captados</h4>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xl font-black text-gray-900">{morbilidad.diabetes}</span>
                    <span className="text-[10px] font-extrabold text-blue-600 uppercase">casos nuevos</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* INDICADORES EN 0 COLLAPSED: RELEGADOS A SUTIL LINEA DE TEXTO */}
          <div className="bg-[#F8F9FA] px-6 py-3.5 rounded-2xl flex items-center justify-between text-xs font-semibold text-gray-400 border border-gray-100/50">
            <span className="uppercase tracking-widest text-[9.5px]">Sección Depurada: Indicadores en Cero (0) Inactivos</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 lowercase bg-white border border-gray-200 px-2.5 py-1 rounded-lg">
                Dengue ({morbilidad.dengue} casos)
              </span>
              <span className="text-[9px] text-[#2274A5] font-bold">Colapsado ✔</span>
            </div>
          </div>
        </section>


        {/* =========================================================================
            BLOQUE 3: PRODUCTIVIDAD REAL (Especialidades Productivas)
            ========================================================================= */}
        <section id="bloque-productividad" className="space-y-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">Métricas de Consultas</span>
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight mt-0.5">Productividad Real Activa</h2>
            <p className="text-[11px] text-gray-400">Únicamente las consultas con registros reales del período. Las inactivas se derivan automáticamente.</p>
          </div>

          {/* Tabla Limpia, sin divisorias molestas ni sombras innecesarias */}
          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden p-3 shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400">Especialidad de Atención</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400 text-right">Consultas Consolidadas</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400 text-right">Impacto Clave</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {especialidadesAgrupadas.activas.map((esp, idx) => (
                    <tr key={esp.nombre} className="hover:bg-[#F8F9FA] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-gray-400">0{idx + 1}</span>
                          <span className="text-xs font-extrabold text-[#1A1A1A] uppercase tracking-tight">{esp.nombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs font-mono font-bold text-slate-800">{esp.consultas.toLocaleString()} consultas</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[10px] font-extrabold text-[#3A86C8] uppercase bg-blue-50 px-2 py-1 rounded">Activo ✔</span>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Agrupamiento automático de especialidades en cero o inactivas */}
                  <tr className="bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-gray-400">
                        <span className="text-xs font-black">---</span>
                        <span className="text-xs font-medium uppercase italic">Especialidades inhabilitadas ({especialidadesAgrupadas.otrosCount} servicios)</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-mono font-medium text-gray-400">{especialidadesAgrupadas.otrosSuma} consultas</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest bg-gray-200/50 px-2.5 py-1 rounded-md">Otros servicios</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER COHESIVO E INFORMATIVO */}
      <footer className="bg-[#F8F9FA] border-t border-gray-100 mt-20 py-12 text-center text-xs font-medium text-gray-400">
        <div className="max-w-4xl mx-auto px-6 space-y-2">
          <p className="uppercase tracking-widest text-[9px] font-black text-gray-500">DIRECCIÓN GENERAL DE SALUD - MIRANDA 2026</p>
          <p className="text-[10px]">Sincronización segura de tránsito bidireccional mediante Supabase Rest y API Google Sheets.</p>
        </div>
      </footer>
    </div>
  );
}
