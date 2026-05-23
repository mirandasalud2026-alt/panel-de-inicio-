import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  Activity, 
  Sparkles,
  ChevronDown,
  Filter,
  BarChart3,
  TrendingUp,
  Zap,
  Shield,
  MapPin,
  RefreshCw,
  Search,
  X
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

export interface SemaforoData {
  fecha: Date;
  fechaString: string;
  eje: string;
  estado: string;
  horasRetraso: number;
  ultimoReporte: Date;
}

export interface ResumenASICData {
  eje: string;
  asic?: string;
  totalEstablecimientos: number;
  totalActivos: number;
  totalInactivos: number;
  totalClausurados: number;
  reportaron: number;
  porcentajeReporte: number;
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
  },
  {
    id_centro: "ALT_AS_SAN",
    nombre_centro: "CDI San Diego",
    asic: "ASIC SAN DIEGO",
    eje_geografico: "ALTOS MIRANDINOS",
    ultimo_reporte: new Date(Date.now() - 15 * 3600 * 1000).toISOString(),
    estado_semaforo: "Verde",
    horas_retraso: 0,
    actualizado_en: new Date().toISOString()
  },
  {
    id_centro: "VAL_AS_CHA",
    nombre_centro: "Ambulatorio Charallave",
    asic: "ASIC CHARALLAVE",
    eje_geografico: "VALLES DEL TUY",
    ultimo_reporte: new Date(Date.now() - 45 * 3600 * 1000).toISOString(),
    estado_semaforo: "Amarillo",
    horas_retraso: 45,
    actualizado_en: new Date().toISOString()
  }
];

// Datos de semilla para Resumen ASIC
const SEMILLA_RESUMEN_ASIC: ResumenASICData[] = [
  { eje: 'Altos Mirandinos', totalEstablecimientos: 45, totalActivos: 38, totalInactivos: 5, totalClausurados: 2, reportaron: 35, porcentajeReporte: 77.8 },
  { eje: 'Valles del Tuy', totalEstablecimientos: 52, totalActivos: 42, totalInactivos: 8, totalClausurados: 2, reportaron: 40, porcentajeReporte: 76.9 },
  { eje: 'Guarenas-Guatire', totalEstablecimientos: 38, totalActivos: 30, totalInactivos: 6, totalClausurados: 2, reportaron: 28, porcentajeReporte: 73.7 },
  { eje: 'Barlovento', totalEstablecimientos: 29, totalActivos: 24, totalInactivos: 4, totalClausurados: 1, reportaron: 22, porcentajeReporte: 75.9 },
  { eje: 'Metropolitano', totalEstablecimientos: 68, totalActivos: 58, totalInactivos: 8, totalClausurados: 2, reportaron: 55, porcentajeReporte: 80.9 }
];

// Datos de semilla para Semáforo
const SEMILLA_SEMAFORO: SemaforoData[] = [
  { fecha: new Date(), fechaString: new Date().toISOString(), eje: 'Altos Mirandinos', estado: 'verde', horasRetraso: 12, ultimoReporte: new Date() },
  { fecha: new Date(Date.now() - 30 * 60 * 60 * 1000), fechaString: '', eje: 'Valles del Tuy', estado: 'amarillo', horasRetraso: 30, ultimoReporte: new Date(Date.now() - 30 * 60 * 60 * 1000) },
  { fecha: new Date(Date.now() - 60 * 60 * 60 * 1000), fechaString: '', eje: 'Guarenas-Guatire', estado: 'naranja', horasRetraso: 60, ultimoReporte: new Date(Date.now() - 60 * 60 * 60 * 1000) },
  { fecha: new Date(Date.now() - 80 * 60 * 60 * 1000), fechaString: '', eje: 'Barlovento', estado: 'rojo', horasRetraso: 80, ultimoReporte: new Date(Date.now() - 80 * 60 * 60 * 1000) },
  { fecha: new Date(Date.now() - 20 * 60 * 60 * 1000), fechaString: '', eje: 'Metropolitano', estado: 'verde', horasRetraso: 20, ultimoReporte: new Date(Date.now() - 20 * 60 * 60 * 1000) }
];

// ==========================================
// COMPONENTE DE GRÁFICO SEMÁFORO (Minimalista)
// ==========================================

function SemaforoChartMinimal({ data, onEjeClick, isLoading }: { data: SemaforoData[]; onEjeClick?: (eje: string) => void; isLoading?: boolean }) {
  const resumenPorEje = useMemo(() => {
    const resumen: Record<string, { estado: string; horasRetraso: number }> = {};
    for (const item of data) {
      if (!resumen[item.eje] || item.horasRetraso > resumen[item.eje].horasRetraso) {
        resumen[item.eje] = { estado: item.estado, horasRetraso: item.horasRetraso };
      }
    }
    return Object.entries(resumen).map(([eje, info]) => ({ eje, ...info }));
  }, [data]);

  const getColor = (estado: string) => {
    switch (estado) {
      case 'verde': return 'bg-emerald-500';
      case 'amarillo': return 'bg-amber-500';
      case 'naranja': return 'bg-orange-500';
      case 'rojo': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getBgLight = (estado: string) => {
    switch (estado) {
      case 'verde': return 'bg-emerald-50 border-emerald-200';
      case 'amarillo': return 'bg-amber-50 border-amber-200';
      case 'naranja': return 'bg-orange-50 border-orange-200';
      case 'rojo': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-12 flex items-center justify-center">
        <RefreshCw size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-50 rounded-xl">
            <Zap size={14} className="text-cyan-600" />
          </div>
          <h3 className="text-xs font-black text-gray-800 uppercase tracking-tight">Semáforo de Cumplimiento</h3>
        </div>
        <div className="flex gap-2 text-[7px] font-black">
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Verde</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Amarillo</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>Naranja</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>Rojo</span>
        </div>
      </div>

      <div className="space-y-2">
        {resumenPorEje.map((item) => (
          <button
            key={item.eje}
            onClick={() => onEjeClick?.(item.eje)}
            className={`w-full p-2.5 rounded-xl border transition-all hover:scale-[1.01] text-left ${getBgLight(item.estado)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getColor(item.estado)} ${item.estado !== 'verde' ? 'animate-pulse' : ''}`} />
                <span className="text-[9px] font-black text-gray-700">{item.eje}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={9} className="text-gray-400" />
                <span className="text-[8px] font-bold text-gray-500">{Math.round(item.horasRetraso)}h</span>
              </div>
            </div>
            <div className="mt-1.5">
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${getColor(item.estado)}`}
                  style={{ width: `${Math.min(100, (item.horasRetraso / 72) * 100)}%` }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE DE GRÁFICO RESUMEN ASIC (Minimalista)
// ==========================================

function ResumenASICChartMinimal({ data, onEjeClick, isLoading }: { data: ResumenASICData[]; onEjeClick?: (eje: string) => void; isLoading?: boolean }) {
  const promedio = useMemo(() => {
    if (data.length === 0) return 0;
    return Math.round(data.reduce((acc, d) => acc + d.porcentajeReporte, 0) / data.length);
  }, [data]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-12 flex items-center justify-center">
        <RefreshCw size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-50 rounded-xl">
            <BarChart3 size={14} className="text-emerald-600" />
          </div>
          <h3 className="text-xs font-black text-gray-800 uppercase tracking-tight">Resumen ASIC</h3>
        </div>
        <div className="px-2 py-0.5 bg-gray-50 rounded-full">
          <span className="text-[8px] font-black text-gray-500">Promedio: {promedio}%</span>
        </div>
      </div>

      <div className="space-y-3">
        {data.map((item) => {
          const itemKey = item.asic ? `${item.eje}-${item.asic}` : item.eje;
          const label = item.asic ? `${item.asic} (${item.eje})` : item.eje;
          return (
            <button
              key={itemKey}
              onClick={() => onEjeClick?.(item.eje)}
              className="w-full hover:bg-gray-50 transition-colors rounded-lg p-1.5"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-black text-gray-600 truncate max-w-[200px]" title={label}>
                  {label}
                </span>
                <span className={`text-[8px] font-black ${item.porcentajeReporte >= 80 ? 'text-emerald-600' : item.porcentajeReporte >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                  {Math.round(item.porcentajeReporte)}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${item.porcentajeReporte >= 80 ? 'bg-emerald-500' : item.porcentajeReporte >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${item.porcentajeReporte}%` }}
                />
              </div>
              <div className="flex justify-between mt-0.5 text-[7px] text-gray-400">
                <span>Activos: {item.totalActivos}</span>
                <span>Total: {item.totalEstablecimientos}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE DE TRÁNSITO COMPACTO
// ==========================================

function TransitoCompacto({ data, onEjeClick, isLoading }: { data: TransitoReporte[]; onEjeClick?: (eje: string) => void; isLoading?: boolean }) {
  const getColorClass = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'verde': return 'border-emerald-200 bg-emerald-50/30';
      case 'amarillo': return 'border-amber-200 bg-amber-50/30';
      case 'rojo': return 'border-red-200 bg-red-50/30';
      default: return 'border-gray-100 bg-gray-50/30';
    }
  };

  const getBadgeClass = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'verde': return 'bg-emerald-100 text-emerald-700';
      case 'amarillo': return 'bg-amber-100 text-amber-700';
      case 'rojo': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-12 flex items-center justify-center">
        <RefreshCw size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 rounded-xl">
            <Activity size={14} className="text-indigo-600" />
          </div>
          <h3 className="text-xs font-black text-gray-800 uppercase tracking-tight">Tránsito ASIC</h3>
        </div>
        <div className="text-[7px] font-black text-gray-400">
          {data.length} centros
        </div>
      </div>

      <div className="max-h-[360px] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-2">
          {data.map((item) => {
            const horas = item.horas_retraso;
            let statusText = '';
            if (horas === 0) statusText = 'Al día';
            else if (horas < 24) statusText = `${horas}h`;
            else if (horas < 48) statusText = `${Math.floor(horas / 24)}d ${horas % 24}h`;
            else statusText = `${Math.floor(horas / 24)}d`;

            return (
              <button
                key={item.id_centro}
                onClick={() => onEjeClick?.(item.eje_geografico)}
                className={`p-2 rounded-xl border text-left transition-all hover:scale-[1.02] ${getColorClass(item.estado_semaforo)}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black text-gray-700 truncate max-w-[100px]">
                    {item.nombre_centro.split(' ').slice(0, 2).join(' ')}
                  </span>
                  <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full ${getBadgeClass(item.estado_semaforo)}`}>
                    {item.estado_semaforo}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Clock size={8} className="text-gray-400" />
                  <span className="text-[7px] font-semibold text-gray-500">
                    {statusText}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {data.length > 0 && (
        <div className="mt-3 text-center text-[7px] text-gray-400 font-bold uppercase tracking-wider">
          Desliza para explorar la lista completa • {data.length} centros en total
        </div>
      )}
    </div>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export interface MinimalistDashboardProps {
  externalSemaforoData?: SemaforoData[];
  externalResumenASICData?: ResumenASICData[];
  googleToken?: string | null;
  googleUser?: any;
  onConnectGoogle?: () => void;
  onDisconnectGoogle?: () => void;
}

export default function MinimalistDashboard({
  externalSemaforoData,
  externalResumenASICData,
  googleToken,
  googleUser,
  onConnectGoogle,
  onDisconnectGoogle
}: MinimalistDashboardProps = {}) {
  const [reportes, setReportes] = useState<TransitoReporte[]>(SEMILLA_REPORTES);
  const [semaforoData, setSemaforoData] = useState<SemaforoData[]>(SEMILLA_SEMAFORO);
  const [resumenASICData, setResumenASICData] = useState<ResumenASICData[]>(SEMILLA_RESUMEN_ASIC);
  const [ejeFiltro, setEjeFiltro] = useState<string>('TODO');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'transito' | 'semaforo' | 'resumen'>('semaforo');

  // Sincronizar con los datos reales de Google Sheets tan pronto como cambien en el componente padre
  useEffect(() => {
    if (externalSemaforoData && externalSemaforoData.length > 0) {
      setSemaforoData(externalSemaforoData);
    }
  }, [externalSemaforoData]);

  useEffect(() => {
    if (externalResumenASICData && externalResumenASICData.length > 0) {
      setResumenASICData(externalResumenASICData);
    }
  }, [externalResumenASICData]);

  // Cargar datos reales de Supabase automáticamente al montar
  useEffect(() => {
    buscarDatosReales();
  }, []);

  const [morbilidad] = useState<IndicadoresSalud>({
    infecciones_ira: 34,
    dengue: 0,
    hipertension: 19,
    diabetes: 8
  });

  const [especialidades] = useState<EspecialidadData[]>([
    { nombre: 'Medicina General', consultas: 142 },
    { nombre: 'Pediatría', consultas: 89 },
    { nombre: 'Ginecología', consultas: 41 },
    { nombre: 'Odontología', consultas: 0 },
    { nombre: 'Oftalmología', consultas: 0 },
    { nombre: 'Psicología', consultas: 0 }
  ]);

  // Función para buscar datos reales desde Supabase
  const buscarDatosReales = async () => {
    if (!supabase) {
      console.warn("Supabase no está configurado");
      return;
    }
    
    setIsSearching(true);
    try {
      // Buscar datos de tránsito
      const { data: transitoData, error: transitoError } = await supabase
        .from('transito_reportes')
        .select('*')
        .order('actualizado_en', { ascending: false });

      if (!transitoError && transitoData && transitoData.length > 0) {
        setReportes(transitoData);
      }

      // Buscar datos de resumen ASIC (desde una tabla o vista)
      const { data: resumenData, error: resumenError } = await supabase
        .from('resumen_asic')
        .select('*');

      if (!resumenError && resumenData && resumenData.length > 0) {
        setResumenASICData(resumenData);
      }

      setLastUpdate(new Date());
      
      // Mostrar notificación sutil
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-emerald-500 text-white text-xs font-black px-4 py-2 rounded-full shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2';
      notification.textContent = '✅ Datos actualizados desde Supabase';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
      
    } catch (error) {
      console.error("Error al buscar datos:", error);
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-red-500 text-white text-xs font-black px-4 py-2 rounded-full shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2';
      notification.textContent = '❌ Error al buscar datos reales';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    } finally {
      setIsSearching(false);
    }
  };

  // Filtrar reportes por eje
  const reportesFiltrados = useMemo(() => {
    if (ejeFiltro === 'TODO') return reportes;
    return reportes.filter(r => r.eje_geografico.toUpperCase() === ejeFiltro.toUpperCase());
  }, [reportes, ejeFiltro]);

  // Filtrar resumen ASIC por eje
  const resumenASICFiltrados = useMemo(() => {
    if (ejeFiltro === 'TODO') return resumenASICData;
    return resumenASICData.filter(r => r.eje.toUpperCase() === ejeFiltro.toUpperCase());
  }, [resumenASICData, ejeFiltro]);

  // Métrica de cumplimiento
  const metricaCumplimiento = useMemo(() => {
    const total = reportesFiltrados.length;
    if (total === 0) return 100;
    const conformes = reportesFiltrados.filter(r => r.estado_semaforo.toLowerCase() === 'verde').length;
    return Math.round((conformes / total) * 100);
  }, [reportesFiltrados]);

  // Especialidades agrupadas
  const especialidadesAgrupadas = useMemo(() => {
    const activas = especialidades.filter(e => e.consultas > 0);
    const inactivas = especialidades.filter(e => e.consultas === 0);
    return {
      activas: activas.sort((a, b) => b.consultas - a.consultas),
      otrosCount: inactivas.length,
      otrosSuma: inactivas.reduce((acc, curr) => acc + curr.consultas, 0)
    };
  }, [especialidades]);

  // Manejar click en gráficos para filtrar
  const handleEjeClick = (eje: string) => {
    const ejeUpper = eje.toUpperCase();
    if (ejeFiltro === ejeUpper) {
      setEjeFiltro('TODO');
    } else {
      setEjeFiltro(ejeUpper);
    }
  };

  return (
    <div className="bg-[#FFFFFF] text-[#1A1A1A] min-h-screen font-sans antialiased overflow-x-hidden">
      {/* CABECERA */}
      <header className="max-w-4xl mx-auto px-4 pt-8 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>
            <span className="text-[8px] font-black uppercase text-gray-400 tracking-[0.25em]">SALA SITUACIONAL 2026</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-gray-900 mt-0.5 uppercase">Miranda Salud</h1>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
          {onConnectGoogle && (
            <div className="flex items-center gap-2">
              {!googleToken ? (
                <button
                  onClick={onConnectGoogle}
                  className="px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[8.5px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-all shadow-xs"
                >
                  🟢 Conectar Google Sheets
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-emerald-50/50 border border-emerald-100 px-3 py-1.5 rounded-full">
                  <span className="text-[8px] font-black text-emerald-800 max-w-[120px] truncate uppercase tracking-widest">
                    {googleUser?.email ? googleUser.email.split('@')[0] : 'Sincronizado'}
                  </span>
                  <button
                    onClick={onDisconnectGoogle}
                    className="px-2 py-1 bg-white border border-gray-200 text-[7px] text-gray-500 font-extrabold rounded-full hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
                  >
                    Salir
                  </button>
                </div>
              )}
            </div>
          )}
          
          <div className="relative flex-1 md:w-48">
            <select 
              value={ejeFiltro}
              onChange={(e) => setEjeFiltro(e.target.value)}
              className="appearance-none bg-gray-50 hover:bg-gray-100 border border-transparent rounded-full px-3 py-2 text-[9px] font-black text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer pr-7 w-full"
            >
              <option value="TODO">TODOS LOS EJES</option>
              <option value="ALTOS MIRANDINOS">ALTOS MIRANDINOS</option>
              <option value="VALLES DEL TUY">VALLES DEL TUY</option>
              <option value="GUARENAS-GUATIRE">GUARENAS-GUATIRE</option>
              <option value="BARLOVENTO">BARLOVENTO</option>
              <option value="METROPOLITANO">METROPOLITANO</option>
            </select>
            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          
          <button
            onClick={buscarDatosReales}
            disabled={isSearching}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#0B3D5C] text-white rounded-full text-[8px] font-black uppercase tracking-wider hover:bg-[#1a4d6e] transition-all disabled:opacity-50"
          >
            {isSearching ? (
              <RefreshCw size={10} className="animate-spin" />
            ) : (
              <Search size={10} />
            )}
            Buscar datos
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        
        {/* KPI de cumplimiento compacto */}
        <div className="bg-gradient-to-r from-[#0B3D5C] to-[#1a5a7e] rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[8px] font-black uppercase tracking-wider opacity-70">Cumplimiento General</p>
              <p className="text-2xl font-black">{metricaCumplimiento}%</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black uppercase tracking-wider opacity-70">Última actualización</p>
              <p className="text-[9px] font-bold">{lastUpdate.toLocaleTimeString()}</p>
            </div>
          </div>
          <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-400 rounded-full"
              style={{ width: `${metricaCumplimiento}%` }}
            />
          </div>
        </div>

        {/* TABS DE NAVEGACIÓN */}
        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
          <button
            onClick={() => setActiveTab('transito')}
            className={`flex-1 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'transito' ? 'bg-white text-[#0B3D5C] shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            🚦 Tránsito
          </button>
          <button
            onClick={() => setActiveTab('semaforo')}
            className={`flex-1 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'semaforo' ? 'bg-white text-[#0B3D5C] shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            📊 Semáforo
          </button>
          <button
            onClick={() => setActiveTab('resumen')}
            className={`flex-1 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'resumen' ? 'bg-white text-[#0B3D5C] shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            📈 Resumen
          </button>
        </div>

        {/* CONTENIDO DE TABS */}
        <AnimatePresence mode="wait">
          {activeTab === 'transito' && (
            <motion.div
              key="transito"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TransitoCompacto 
                data={reportesFiltrados} 
                onEjeClick={handleEjeClick}
                isLoading={isSearching}
              />
            </motion.div>
          )}

          {activeTab === 'semaforo' && (
            <motion.div
              key="semaforo"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <SemaforoChartMinimal 
                data={semaforoData} 
                onEjeClick={handleEjeClick}
                isLoading={isSearching}
              />
            </motion.div>
          )}

          {activeTab === 'resumen' && (
            <motion.div
              key="resumen"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ResumenASICChartMinimal 
                data={resumenASICFiltrados} 
                onEjeClick={handleEjeClick}
                isLoading={isSearching}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* BLOQUE DE MORBILIDAD (Compacto) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-rose-400 rounded-full"></div>
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Alertas Epidemiológicas</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {morbilidad.infecciones_ira > 0 && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 flex items-center gap-2">
                <div className="p-1.5 bg-slate-900 rounded-lg">
                  <Activity size={10} className="text-white" />
                </div>
                <div>
                  <p className="text-[7px] font-black text-gray-400 uppercase">IRA</p>
                  <p className="text-sm font-black text-gray-800">{morbilidad.infecciones_ira}</p>
                </div>
              </div>
            )}

            {morbilidad.hipertension > 0 && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 flex items-center gap-2">
                <div className="p-1.5 bg-red-100 rounded-lg">
                  <span className="text-[8px] font-black text-red-500">HTA</span>
                </div>
                <div>
                  <p className="text-[7px] font-black text-gray-400 uppercase">Hipertensos</p>
                  <p className="text-sm font-black text-gray-800">{morbilidad.hipertension}</p>
                </div>
              </div>
            )}

            {morbilidad.diabetes > 0 && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <span className="text-[8px] font-black text-blue-500">DB</span>
                </div>
                <div>
                  <p className="text-[7px] font-black text-gray-400 uppercase">Diabéticos</p>
                  <p className="text-sm font-black text-gray-800">{morbilidad.diabetes}</p>
                </div>
              </div>
            )}
          </div>

          {morbilidad.dengue === 0 && (
            <div className="text-[7px] text-gray-400 flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-full w-fit">
              <span>Dengue: 0 casos</span>
              <span className="text-emerald-500">✓</span>
            </div>
          )}
        </section>

        {/* BLOQUE DE PRODUCTIVIDAD (Compacto) */}
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-emerald-400 rounded-full"></div>
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Consultas Activas</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {especialidadesAgrupadas.activas.map((esp) => (
              <div key={esp.nombre} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                <p className="text-[8px] font-black text-gray-500">{esp.nombre}</p>
                <p className="text-sm font-black text-gray-800">{esp.consultas.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {especialidadesAgrupadas.otrosCount > 0 && (
            <p className="text-[7px] text-gray-400">
              +{especialidadesAgrupadas.otrosCount} servicios sin registros
            </p>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#F8F9FA] border-t border-gray-100 mt-8 py-6 text-center">
        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
          DIRECCIÓN GENERAL DE SALUD - MIRANDA 2026
        </p>
      </footer>
    </div>
  );
}