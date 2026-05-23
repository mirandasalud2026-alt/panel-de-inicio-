import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, TrendingUp, AlertTriangle, CheckCircle, Clock as ClockIcon,
  Shield, MapPin, Calendar as CalendarIcon, Filter, ChevronDown, 
  ArrowUpRight, Activity, FileText, RefreshCw, ExternalLink, Info,
  Zap, Users, Heart, Baby, Smile, Table, X
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend, LineChart, Line
} from 'recharts';
import { googleSignIn, initAuth, logout } from '../../lib/firebaseAuth';
import { googleWorkspaceService } from '../../services/googleWorkspaceService';
import MinimalistDashboard from './MinimalistDashboard';

// ================= INTERFACES =================

interface SemaforoData {
  fecha: Date;
  fechaString: string;
  eje: string;
  estado: string;
  horasRetraso: number;
  ultimoReporte: Date;
}

interface ResumenASICData {
  eje: string;
  asic?: string;
  totalEstablecimientos: number;
  totalActivos: number;
  totalInactivos: number;
  totalClausurados: number;
  reportaron: number;
  porcentajeReporte: number;
}

// ================= FUNCIONES DE PROCESAMIENTO =================

function calcularEstadoSemaforo(ultimaFecha: Date | null, hoy: Date = new Date()): { estado: string; horasRetraso: number } {
  if (!ultimaFecha) {
    return { estado: 'rojo', horasRetraso: 999 };
  }
  
  const diffHoras = (hoy.getTime() - ultimaFecha.getTime()) / (1000 * 60 * 60);
  
  if (diffHoras <= 24) {
    return { estado: 'verde', horasRetraso: diffHoras };
  } else if (diffHoras <= 48) {
    return { estado: 'amarillo', horasRetraso: diffHoras };
  } else if (diffHoras <= 72) {
    return { estado: 'naranja', horasRetraso: diffHoras };
  } else {
    return { estado: 'rojo', horasRetraso: diffHoras };
  }
}

function procesarDatosSemaforo(values: string[][]): SemaforoData[] {
  if (!values || values.length < 2) return [];
  
  const headers = values[0];
  const resultados: SemaforoData[] = [];
  
  let colEje = -1;
  let colUltimoReporte = -1;
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i]?.toLowerCase() || '';
    if (header.includes('eje') || header.includes('territorio') || header.includes('asic') || header.includes('municipio') || header.includes('centro') || header.includes('nombre')) colEje = i;
    if (header.includes('fecha') || header.includes('reporte') || header.includes('ultimo') || header.includes('actualizado')) colUltimoReporte = i;
  }
  
  if (colEje === -1) colEje = 0;
  if (colUltimoReporte === -1) colUltimoReporte = 1;
  
  const hoy = new Date();
  
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row || row.length === 0) continue;
    
    const eje = row[colEje] || 'Desconocido';
    const fechaStr = row[colUltimoReporte];
    const ultimaFecha = fechaStr ? new Date(fechaStr) : null;
    const { estado, horasRetraso } = calcularEstadoSemaforo(ultimaFecha, hoy);
    
    resultados.push({
      fecha: ultimaFecha || hoy,
      fechaString: fechaStr || '',
      eje,
      estado,
      horasRetraso,
      ultimoReporte: ultimaFecha || hoy
    });
  }
  
  return resultados;
}

function procesarDatosResumenASIC(values: string[][]): ResumenASICData[] {
  if (!values || values.length < 2) return [];
  
  const headers = values[0];
  const resultados: ResumenASICData[] = [];
  
  let colEje = -1;
  let colAsic = -1;
  let colTotalEst = -1;
  let colActivos = -1;
  let colInactivos = -1;
  let colClausurados = -1;
  let colReportaron = -1;
  let colPorcentaje = -1;
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i]?.toLowerCase() || '';
    
    // Identificar columna Eje
    if (header === 'eje' || (header.includes('eje') && !header.includes('asic'))) {
      colEje = i;
    }
    // Identificar columna ASIC / Nombre
    if (header.includes('asic') || header.includes('nombre') || header.includes('centro') || header.includes('municipio')) {
      colAsic = i;
    }
    
    if (header.includes('tt_est') || header.includes('total establecimientos') || header.includes('total est') || header.includes('establecimientos') || header.includes('est.')) colTotalEst = i;
    if (header.includes('tt_activo') || header.includes('activos') || header.includes('activo')) colActivos = i;
    if (header.includes('tt_inactivo') || header.includes('inactivos') || header.includes('inactivo')) colInactivos = i;
    if (header.includes('tt_clausu') || header.includes('clausurados') || header.includes('clausurado')) colClausurados = i;
    if (header.includes('si_repor') || header.includes('reportaron') || header.includes('reporto') || header.includes('repor')) colReportaron = i;
    if (header.includes('porcrepor') || header.includes('porcentaje') || header.includes('%') || header.includes('cumplimiento') || header.includes('porc')) colPorcentaje = i;
  }
  
  // Caídas de seguridad inteligentes
  if (colEje === -1) colEje = 0;
  if (colAsic === -1) colAsic = 1 < headers.length ? 1 : 0;
  
  // Si coinciden por redundancia, intentar reasignar
  if (colEje === colAsic && headers.length > 1) {
    if (colEje === 0) colAsic = 1;
    else colEje = 0;
  }
  
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row || row.length === 0) continue;
    
    const parseNum = (idx: number) => {
      if (idx === -1 || idx >= row.length) return 0;
      const val = row[idx];
      if (!val) return 0;
      const num = parseFloat(val.toString().replace(/[^\d.-]/g, ''));
      return isNaN(num) ? 0 : num;
    };
    
    const eje = row[colEje] || 'Desconocido';
    const asic = colAsic !== -1 && colAsic < row.length ? row[colAsic] || '' : '';
    const totalEst = parseNum(colTotalEst);
    const activos = parseNum(colActivos);
    const inactivos = parseNum(colInactivos);
    const clausurados = parseNum(colClausurados);
    const reportaron = parseNum(colReportaron);
    let porcentaje = parseNum(colPorcentaje);
    
    if (porcentaje === 0 && totalEst > 0) {
      porcentaje = (reportaron / totalEst) * 100;
    }
    
    resultados.push({
      eje,
      asic,
      totalEstablecimientos: totalEst,
      totalActivos: activos,
      totalInactivos: inactivos,
      totalClausurados: clausurados,
      reportaron,
      porcentajeReporte: porcentaje
    });
  }
  
  return resultados;
}

// ================= COMPONENTE DE GRÁFICO SEMÁFORO =================

interface SemaforoChartProps {
  data: SemaforoData[];
  onEjeClick?: (eje: string) => void;
}

function SemaforoChart({ data, onEjeClick }: SemaforoChartProps) {
  const [selectedEje, setSelectedEje] = useState<string | null>(null);
  
  const resumenPorEje = useMemo(() => {
    const resumen: Record<string, { estado: string; horasRetraso: number; ultimoReporte: Date }> = {};
    
    for (const item of data) {
      if (!resumen[item.eje] || item.fecha > resumen[item.eje].ultimoReporte) {
        resumen[item.eje] = {
          estado: item.estado,
          horasRetraso: item.horasRetraso,
          ultimoReporte: item.ultimoReporte
        };
      }
    }
    
    return Object.entries(resumen).map(([eje, info]) => ({
      eje,
      estado: info.estado,
      horasRetraso: Math.round(info.horasRetraso),
      ultimoReporte: info.ultimoReporte
    }));
  }, [data]);
  
  const getColorForEstado = (estado: string) => {
    switch (estado) {
      case 'verde': return '#22C55E';
      case 'amarillo': return '#EAB308';
      case 'naranja': return '#F97316';
      case 'rojo': return '#EF4444';
      default: return '#6B7280';
    }
  };
  
  const getLabelForEstado = (estado: string, horas: number) => {
    switch (estado) {
      case 'verde': return `✅ Reporte hoy (${horas}h atrás)`;
      case 'amarillo': return `⚠️ Reporte hace ${horas}h`;
      case 'naranja': return `🔶 Reporte hace ${horas}h`;
      case 'rojo': return horas >= 72 ? `🔴 Reporte hace ${horas}h (Crítico)` : `🔴 Reporte hace ${horas}h`;
      default: return 'Sin datos';
    }
  };
  
  const handleBarClick = (eje: string) => {
    setSelectedEje(selectedEje === eje ? null : eje);
    if (onEjeClick) onEjeClick(eje);
  };
  
  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-md border border-gray-100">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-50 rounded-xl">
              <Zap size={18} className="text-cyan-600" />
            </div>
            <h4 className="font-black text-gray-800 text-base">Semáforo de Cumplimiento ASIC</h4>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-black">
            Estado de reporte por eje territorial • Rojo ≥72h | Naranja 48-72h | Amarillo 24-48h | Verde ≤24h
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-[8px] font-black text-gray-400">Verde (≤24h)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-[8px] font-black text-gray-400">Amarillo (24-48h)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-[8px] font-black text-gray-400">Naranja (48-72h)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-[8px] font-black text-gray-400">Rojo (≥72h)</span>
          </div>
        </div>
      </div>
      
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={resumenPorEje}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
            <XAxis 
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fontWeight: 700, fill: '#9CA3AF' }}
              label={{ value: 'Horas desde último reporte', position: 'bottom', fontSize: 9, fill: '#9CA3AF' }}
            />
            <YAxis 
              dataKey="eje" 
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 800, fill: '#374151' }}
              width={120}
            />
            <Tooltip
              contentStyle={{ borderRadius: '16px', border: '1px solid #E5E7EB', fontSize: '10px', fontWeight: 'bold' }}
              formatter={(value: any, name: any, props: any) => {
                const item = props.payload;
                return [`${getLabelForEstado(item.estado, item.horasRetraso)}`, 'Estado'];
              }}
            />
            <Bar 
              dataKey="horasRetraso" 
              radius={[0, 8, 8, 0]}
              maxBarSize={30}
              onClick={(data) => handleBarClick(data.eje)}
            >
              {resumenPorEje.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getColorForEstado(entry.estado)}
                  className="cursor-pointer transition-all hover:opacity-80"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {selectedEje && (
        <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Detalle</p>
              <p className="text-sm font-black text-gray-800">{selectedEje}</p>
            </div>
            {(() => {
              const ejeData = resumenPorEje.find(e => e.eje === selectedEje);
              if (!ejeData) return null;
              return (
                <div className="text-right">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black ${
                    ejeData.estado === 'verde' ? 'bg-green-100 text-green-700' :
                    ejeData.estado === 'amarillo' ? 'bg-yellow-100 text-yellow-700' :
                    ejeData.estado === 'naranja' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      ejeData.estado === 'verde' ? 'bg-green-500' :
                      ejeData.estado === 'amarillo' ? 'bg-yellow-500' :
                      ejeData.estado === 'naranja' ? 'bg-orange-500' :
                      'bg-red-500'
                    }`} />
                    {ejeData.estado.toUpperCase()} · {ejeData.horasRetraso}h
                  </div>
                  <p className="text-[9px] text-gray-400 mt-1">
                    Último reporte: {ejeData.ultimoReporte.toLocaleDateString()} {ejeData.ultimoReporte.toLocaleTimeString()}
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      
      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center flex-wrap gap-2">
        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
          Total ejes evaluados: {resumenPorEje.length}
        </span>
        <div className="flex gap-3 flex-wrap">
          <span className="text-[8px] font-bold text-green-600">✓ Verde: {resumenPorEje.filter(e => e.estado === 'verde').length}</span>
          <span className="text-[8px] font-bold text-yellow-600">⚠ Amarillo: {resumenPorEje.filter(e => e.estado === 'amarillo').length}</span>
          <span className="text-[8px] font-bold text-orange-600">🔶 Naranja: {resumenPorEje.filter(e => e.estado === 'naranja').length}</span>
          <span className="text-[8px] font-bold text-red-600">🔴 Rojo: {resumenPorEje.filter(e => e.estado === 'rojo').length}</span>
        </div>
      </div>
    </div>
  );
}

// ================= COMPONENTE DE GRÁFICO RESUMEN ASIC =================

interface ResumenASICChartProps {
  data: ResumenASICData[];
  onEjeClick?: (eje: string) => void;
}

function ResumenASICChart({ data, onEjeClick }: ResumenASICChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<'porcentaje' | 'activos' | 'inactivos' | 'clausurados'>('porcentaje');
  
  const chartData = useMemo(() => {
    return data.map(item => ({
      eje: item.asic ? `${item.asic} (${item.eje})` : item.eje,
      porcentaje: Math.round(item.porcentajeReporte),
      activos: item.totalActivos,
      subAsic: item.asic || '',
      ejeOrig: item.eje,
      inactivos: item.totalInactivos,
      clausurados: item.totalClausurados,
      total: item.totalEstablecimientos,
      reportaron: item.reportaron
    }));
  }, [data]);
  
  const getMetricLabel = () => {
    switch (selectedMetric) {
      case 'porcentaje': return 'Porcentaje de Reporte (%)';
      case 'activos': return 'Establecimientos Activos';
      case 'inactivos': return 'Establecimientos Inactivos';
      case 'clausurados': return 'Establecimientos Clausurados';
      default: return 'Porcentaje de Reporte (%)';
    }
  };
  
  const getMetricValue = (item: any) => {
    switch (selectedMetric) {
      case 'porcentaje': return item.porcentaje;
      case 'activos': return item.activos;
      case 'inactivos': return item.inactivos;
      case 'clausurados': return item.clausurados;
      default: return item.porcentaje;
    }
  };
  
  const getBarColor = () => {
    switch (selectedMetric) {
      case 'porcentaje': return '#0B3D5C';
      case 'activos': return '#10B981';
      case 'inactivos': return '#F59E0B';
      case 'clausurados': return '#EF4444';
      default: return '#0B3D5C';
    }
  };
  
  const handleBarClick = (eje: string) => {
    if (onEjeClick) onEjeClick(eje);
  };
  
  const promedioGeneral = useMemo(() => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + item.porcentajeReporte, 0);
    return Math.round(sum / data.length);
  }, [data]);
  
  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-md border border-gray-100">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <BarChart3 size={18} className="text-emerald-600" />
            </div>
            <h4 className="font-black text-gray-800 text-base">Resumen de Cumplimiento ASIC</h4>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-black">
            Porcentaje de reporte por eje territorial y métricas de establecimientos
          </p>
        </div>
        
        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
          <button
            onClick={() => setSelectedMetric('porcentaje')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
              selectedMetric === 'porcentaje' ? 'bg-white text-[#0B3D5C] shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            % Reporte
          </button>
          <button
            onClick={() => setSelectedMetric('activos')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
              selectedMetric === 'activos' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setSelectedMetric('inactivos')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
              selectedMetric === 'inactivos' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Inactivos
          </button>
          <button
            onClick={() => setSelectedMetric('clausurados')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
              selectedMetric === 'clausurados' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Clausurados
          </button>
        </div>
      </div>
      
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis 
              dataKey="eje" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fontWeight: 800, fill: '#6B7280' }}
              angle={-15}
              textAnchor="end"
              height={50}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fontWeight: 700, fill: '#9CA3AF' }}
              domain={selectedMetric === 'porcentaje' ? [0, 100] : [0, 'auto']}
            />
            <Tooltip
              contentStyle={{ borderRadius: '16px', border: '1px solid #E5E7EB', fontSize: '10px', fontWeight: 'bold' }}
              formatter={(value: any) => {
                if (selectedMetric === 'porcentaje') return [`${value}%`, getMetricLabel()];
                return [`${value} establecimientos`, getMetricLabel()];
              }}
              labelFormatter={(label) => `${label}`}
            />
            <Bar 
              dataKey={selectedMetric === 'porcentaje' ? 'porcentaje' : selectedMetric} 
              fill={getBarColor()}
              radius={[8, 8, 0, 0]}
              maxBarSize={50}
              onClick={(data) => handleBarClick(data.ejeOrig || data.eje)}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor()}
                  className="cursor-pointer transition-all hover:opacity-80"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Tabla resumen */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[8px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
              <th className="pb-3 px-2">ASIC (Eje Territorial)</th>
              <th className="pb-3 px-2 text-right">Total Est.</th>
              <th className="pb-3 px-2 text-right">Activos</th>
              <th className="pb-3 px-2 text-right">Inactivos</th>
              <th className="pb-3 px-2 text-right">Clausurados</th>
              <th className="pb-3 px-2 text-right">Reportaron</th>
              <th className="pb-3 px-2 text-right">% Reporte</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr 
                key={idx} 
                className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                onClick={() => handleBarClick(item.eje)}
              >
                <td className="py-3 px-2 text-xs font-bold">
                  {item.asic ? `${item.asic} (${item.eje})` : item.eje}
                </td>
                <td className="py-3 px-2 text-right text-xs">{item.totalEstablecimientos}</td>
                <td className="py-3 px-2 text-right text-xs text-emerald-600">{item.totalActivos}</td>
                <td className="py-3 px-2 text-right text-xs text-amber-600">{item.totalInactivos}</td>
                <td className="py-3 px-2 text-right text-xs text-red-600">{item.totalClausurados}</td>
                <td className="py-3 px-2 text-right text-xs font-black">{item.reportaron}</td>
                <td className={`py-3 px-2 text-right text-xs font-black ${
                  item.porcentajeReporte >= 80 ? 'text-green-600' :
                  item.porcentajeReporte >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {Math.round(item.porcentajeReporte)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center flex-wrap gap-2">
        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
          Total ejes evaluados: {data.length}
        </span>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-[8px] font-bold text-gray-500">≥80%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="text-[8px] font-bold text-gray-500">50-79%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-[8px] font-bold text-gray-500">&lt;50%</span>
          </div>
          <div className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full">
            <span className="text-[8px] font-black text-gray-600">Promedio: {promedioGeneral}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ================= COMPONENTE PRINCIPAL =================

export default function DirectorDashboard() {
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isLoaderActive, setIsLoaderActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchedSuccessfully, setFetchedSuccessfully] = useState(false);
  const [isMinimalistMode, setIsMinimalistMode] = useState(true);
  
  const [semaforoData, setSemaforoData] = useState<SemaforoData[]>([]);
  const [resumenASICData, setResumenASICData] = useState<ResumenASICData[]>([]);
  const [isLoadingSemaforo, setIsLoadingSemaforo] = useState(false);
  
  const [rawRecords, setRawRecords] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [dateFilterPreset, setDateFilterPreset] = useState<string>('semana_pasada');
  const [selectedEjesList, setSelectedEjesList] = useState<string[]>(['Todos']);

  const SPREADSHEET_ID = '1iu3UpCktHPDhUJOVWhwL0-zCZ523aJelWIPgHaLE-20';
  const DASHBOARD_ID = '1zw04RoFnPvxF3P147dRjbg01gfySKJGNn4QUVbcSfig';
  const SHEET_NAME = 'Compilado';
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit?usp=sharing`;

  const addLog = (text: string) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${text}`);
  };

  // Detectar dinámicamente las pestañas del libro consolidado
  const detectSheetTabs = async (token: string): Promise<{ semaforo: string; resumen: string }> => {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${DASHBOARD_ID}?fields=sheets(properties(title))`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const titles: string[] = data.sheets?.map((s: any) => s.properties?.title || '') || [];
        addLog(`📋 Pestañas detectadas en Google Sheets: ${titles.filter(Boolean).join(', ')}`);
        
        let semaforoTab = titles.find(t => t.includes('Semaforo_') || t.includes('Semaforo'));
        let resumenTab = titles.find(t => t.includes('Resumen_ASIC_') || t.includes('Resumen_ASIC') || t.includes('Resumen ASIC'));
        
        const now = new Date();
        const fallbackDate = `${now.getMonth() + 1}-${now.getDate()}-${now.getFullYear()}`;
        
        return {
          semaforo: semaforoTab || `Semaforo_${fallbackDate}`,
          resumen: resumenTab || `Resumen_ASIC_${fallbackDate}`
        };
      }
    } catch (e: any) {
      console.error("Error al detectar pestañas:", e);
    }
    const now = new Date();
    const fallbackDate = `${now.getMonth() + 1}-${now.getDate()}-${now.getFullYear()}`;
    return {
      semaforo: `Semaforo_${fallbackDate}`,
      resumen: `Resumen_ASIC_${fallbackDate}`
    };
  };

  // Cargar datos del semáforo
  const loadSemaforoData = async (token: string) => {
    setIsLoadingSemaforo(true);
    try {
      const tabs = await detectSheetTabs(token);
      addLog(`📡 Cargando registros de semáforo desde pestaña dinámica: "${tabs.semaforo}"`);
      const res = await googleWorkspaceService.getSheetData(token, DASHBOARD_ID, `${tabs.semaforo}!A1:ZZ500`);
      
      if (res && res.values && res.values.length > 1) {
        const processed = procesarDatosSemaforo(res.values);
        setSemaforoData(processed);
        addLog(`✅ Datos de Semáforo cargados desde ${tabs.semaforo}: ${processed.length} registros`);
      }
    } catch (err: any) {
      console.error(err);
      addLog(`❌ Error cargando Semáforo: ${err.message}`);
      // Datos mock para demostración de semillero
      const mockData: SemaforoData[] = [
        { fecha: new Date(), fechaString: new Date().toISOString(), eje: 'Altos Mirandinos', estado: 'verde', horasRetraso: 12, ultimoReporte: new Date() },
        { fecha: new Date(Date.now() - 30 * 60 * 60 * 1000), fechaString: '', eje: 'Valles del Tuy', estado: 'amarillo', horasRetraso: 30, ultimoReporte: new Date(Date.now() - 30 * 60 * 60 * 1000) },
        { fecha: new Date(Date.now() - 60 * 60 * 60 * 1000), fechaString: '', eje: 'Guarenas-Guatire', estado: 'naranja', horasRetraso: 60, ultimoReporte: new Date(Date.now() - 60 * 60 * 60 * 1000) },
        { fecha: new Date(Date.now() - 80 * 60 * 60 * 1000), fechaString: '', eje: 'Barlovento', estado: 'rojo', horasRetraso: 80, ultimoReporte: new Date(Date.now() - 80 * 60 * 60 * 1000) },
        { fecha: new Date(Date.now() - 20 * 60 * 60 * 1000), fechaString: '', eje: 'Metropolitano', estado: 'verde', horasRetraso: 20, ultimoReporte: new Date(Date.now() - 20 * 60 * 60 * 1000) }
      ];
      setSemaforoData(mockData);
    } finally {
      setIsLoadingSemaforo(false);
    }
  };

  // Cargar datos del Resumen ASIC
  const loadResumenASICData = async (token: string) => {
    setIsLoadingSemaforo(true);
    try {
      const tabs = await detectSheetTabs(token);
      addLog(`📡 Cargando estadísticas consolidadas desde pestaña dinámica: "${tabs.resumen}"`);
      const res = await googleWorkspaceService.getSheetData(token, DASHBOARD_ID, `${tabs.resumen}!A1:ZZ100`);
      
      if (res && res.values && res.values.length > 1) {
        const processed = procesarDatosResumenASIC(res.values);
        setResumenASICData(processed);
        addLog(`✅ Datos de Resumen ASIC cargados desde ${tabs.resumen}: ${processed.length} ejes`);
      }
    } catch (err: any) {
      console.error(err);
      addLog(`❌ Error cargando Resumen ASIC: ${err.message}`);
      const mockData: ResumenASICData[] = [
        { eje: 'Altos Mirandinos', totalEstablecimientos: 45, totalActivos: 38, totalInactivos: 5, totalClausurados: 2, reportaron: 35, porcentajeReporte: 77.8 },
        { eje: 'Valles del Tuy', totalEstablecimientos: 52, totalActivos: 42, totalInactivos: 8, totalClausurados: 2, reportaron: 40, porcentajeReporte: 76.9 },
        { eje: 'Guarenas-Guatire', totalEstablecimientos: 38, totalActivos: 30, totalInactivos: 6, totalClausurados: 2, reportaron: 28, porcentajeReporte: 73.7 },
        { eje: 'Barlovento', totalEstablecimientos: 29, totalActivos: 24, totalInactivos: 4, totalClausurados: 1, reportaron: 22, porcentajeReporte: 75.9 },
        { eje: 'Metropolitano', totalEstablecimientos: 68, totalActivos: 58, totalInactivos: 8, totalClausurados: 2, reportaron: 55, porcentajeReporte: 80.9 }
      ];
      setResumenASICData(mockData);
    } finally {
      setIsLoadingSemaforo(false);
    }
  };

  const toggleEjeFilter = (ejeName: string) => {
    setSelectedEjesList(prev => {
      if (ejeName === 'Todos') {
        return ['Todos'];
      }
      const cleaned = prev.filter(e => e !== 'Todos');
      if (cleaned.includes(ejeName)) {
        const next = cleaned.filter(e => e !== ejeName);
        return next.length === 0 ? ['Todos'] : next;
      } else {
        return [...cleaned, ejeName];
      }
    });
  };

  // Renderizado simplificado del dashboard
  if (isMinimalistMode) {
    return (
      <div className="space-y-2 bg-[#FFFFFF]">
        <div className="max-w-4xl mx-auto px-6 pt-6 flex justify-end">
          <button
            onClick={() => setIsMinimalistMode(false)}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-sm"
          >
            📊 <span className="text-gray-300 font-bold">Cambiar a:</span> Analítica Tradicional
          </button>
        </div>
        <MinimalistDashboard 
          externalSemaforoData={semaforoData}
          externalResumenASICData={resumenASICData}
          googleToken={googleToken}
          googleUser={googleUser}
          onConnectGoogle={async () => {
            try {
              const result = await googleSignIn();
              if (result) {
                setGoogleUser(result.user);
                setGoogleToken(result.accessToken);
                await loadSemaforoData(result.accessToken);
                await loadResumenASICData(result.accessToken);
              }
            } catch (err: any) {
              setErrorMessage(err.message);
            }
          }}
          onDisconnectGoogle={async () => {
            await logout();
            setGoogleUser(null);
            setGoogleToken(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header con autenticación */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <FileText size={22} />
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-800 uppercase tracking-tight">Fuente: Datos Respaldados (Compilado)</h4>
            <p className="text-[10px] text-gray-400 font-semibold mt-1">
              Origen: Google Sheets • 
              <a href={SHEET_URL} target="_blank" rel="noopener noreferrer" className="text-blue-500 inline-flex items-center gap-1 ml-1 hover:underline">
                Ver Hoja Original <ExternalLink size={10} />
              </a>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMinimalistMode(true)}
            className="px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-[10px] font-extrabold uppercase tracking-widest text-[#0B3D5C]"
          >
            ✨ Vista Minimalista
          </button>
          {!googleToken ? (
            <button
              onClick={async () => {
                try {
                  const result = await googleSignIn();
                  if (result) {
                    setGoogleUser(result.user);
                    setGoogleToken(result.accessToken);
                    await loadSemaforoData(result.accessToken);
                    await loadResumenASICData(result.accessToken);
                  }
                } catch (err: any) {
                  setErrorMessage(err.message);
                }
              }}
              className="px-5 py-3 bg-[#0B3D5C] text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest"
            >
              Conectar Google Sheets
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-400 hidden lg:block">{googleUser?.email}</span>
              <button
                onClick={async () => {
                  await logout();
                  setGoogleUser(null);
                  setGoogleToken(null);
                }}
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-extrabold"
              >
                Desconectar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sección de Gráficos de Cumplimiento */}
      <section className="space-y-6">
        <div className="border-l-4 border-cyan-600 pl-4">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block">Monitoreo de Cumplimiento</span>
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Semáforo y Resumen ASIC</h3>
          <p className="text-[11px] text-gray-500 mt-1">Semaforización de reportes por eje territorial y métricas de establecimientos activos</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gráfico de Semáforo */}
          <div>
            {isLoadingSemaforo ? (
              <div className="bg-white rounded-[2rem] p-12 flex items-center justify-center">
                <RefreshCw size={24} className="animate-spin text-gray-400" />
              </div>
            ) : semaforoData.length > 0 ? (
              <SemaforoChart 
                data={semaforoData} 
                onEjeClick={(eje) => toggleEjeFilter(eje)}
              />
            ) : (
              <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-100">
                <p className="text-xs font-bold text-gray-400">No hay datos de semáforo disponibles</p>
                {googleToken && (
                  <button 
                    onClick={() => loadSemaforoData(googleToken)}
                    className="mt-4 px-4 py-2 bg-cyan-500 text-white rounded-xl text-[10px] font-black"
                  >
                    Intentar cargar
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Gráfico de Resumen ASIC */}
          <div>
            {isLoadingSemaforo ? (
              <div className="bg-white rounded-[2rem] p-12 flex items-center justify-center">
                <RefreshCw size={24} className="animate-spin text-gray-400" />
              </div>
            ) : resumenASICData.length > 0 ? (
              <ResumenASICChart 
                data={resumenASICData}
                onEjeClick={(eje) => toggleEjeFilter(eje)}
              />
            ) : (
              <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-100">
                <p className="text-xs font-bold text-gray-400">No hay datos de Resumen ASIC disponibles</p>
                {googleToken && (
                  <button 
                    onClick={() => loadResumenASICData(googleToken)}
                    className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black"
                  >
                    Intentar cargar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-8 border-t border-gray-200/80 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">
          Datos actualizados semanalmente desde la hoja "Compilado".
        </p>
        <span className="text-[9px] font-bold text-gray-400 bg-gray-50 border border-gray-150 px-3.5 py-1.5 rounded-full flex items-center gap-2">
          <Info size={11} className="text-[#0B3D5C]" /> 
          Miranda Salud • Dirección Estadal de Salud
        </span>
      </footer>
    </div>
  );
}