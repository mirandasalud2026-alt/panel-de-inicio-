import React, { useState, useEffect, useMemo } from 'react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  MapPin, 
  Clock, 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  ShieldCheck, 
  LayoutGrid,
  TrendingUp,
  MapIcon,
  Users
} from 'lucide-react';

interface MinimalistDashboardProps {
  ejes?: any[];
  selectedEje?: any;
  onEjeSelect?: (eje: any) => void;
}

export default function MinimalistDashboard({}: MinimalistDashboardProps) {
  // Jalamos los datos actualizados del contexto global de Miranda Salud
  const { 
    reportes, 
    isLoading, 
    isSyncing, 
    stats, 
    lastUpdate, 
    syncSheets 
  } = useDashboardData();

  const [searchQuery, setSearchQuery] = useState('');
  const hasActiveSearch = searchQuery.trim() !== '';
  const [openEjes, setOpenEjes] = useState<Record<string, boolean>>({
    'ALTOS MIRANDINOS': true,
    'VALLES DEL TUY': true,
    'GUARENAS-GUATIRE': true,
    'BARLOVENTO': true,
    'METROPOLITANO': true
  });
  const [openAsics, setOpenAsics] = useState<Record<string, boolean>>({});
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [systemTime, setSystemTime] = useState(new Date());

  // Reloj situacional de la sala de control
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Definición estética y poblacional oficial de los 5 Ejes de Salud Miranda
  const MIRANDA_EJES = useMemo(() => [
    { name: 'ALTOS MIRANDINOS', code: 'AMI', population: 485000, color: 'border-l-indigo-600 text-indigo-700 bg-indigo-50/10' },
    { name: 'VALLES DEL TUY', code: 'VTY', population: 852000, color: 'border-l-sky-600 text-sky-700 bg-sky-50/10' },
    { name: 'GUARENAS-GUATIRE', code: 'GGU', population: 518050, color: 'border-l-emerald-650 text-emerald-700 bg-emerald-50/10' },
    { name: 'BARLOVENTO', code: 'BAR', population: 391200, color: 'border-l-rose-600 text-rose-700 bg-rose-50/10' },
    { name: 'METROPOLITANO', code: 'MET', population: 764400, color: 'border-l-amber-600 text-amber-700 bg-amber-50/10' }
  ], []);

  // Normalizador robusto de nombres de ejes geográficos
  const normalizeEjeName = (eje: string): string => {
    const norm = (eje || '').toUpperCase().trim();
    if (norm.includes('ALTOS') || norm === 'AMI') return 'ALTOS MIRANDINOS';
    if (norm.includes('TUY') || norm === 'VTY') return 'VALLES DEL TUY';
    if (norm.includes('GUARENAS') || norm.includes('GUATIRE') || norm === 'GGU') return 'GUARENAS-GUATIRE';
    if (norm.includes('BARLOVENTO') || norm === 'BAR') return 'BARLOVENTO';
    if (norm.includes('METROPOLITANO') || norm === 'MET') return 'METROPOLITANO';
    return 'METROPOLITANO'; // Fallback seguro
  };

  // Función de filtro de búsqueda
  const matchesSearch = (item: any, queryStr: string) => {
    const q = queryStr.toLowerCase().trim();
    if (!q) return true;
    return (
      item.nombre_centro.toLowerCase().includes(q) ||
      (item.asic || '').toLowerCase().includes(q) ||
      (item.id_centro || '').toLowerCase().includes(q) ||
      (item.eje_geografico || '').toLowerCase().includes(q)
    );
  };

  // Construcción jerárquica de 3 niveles dinámica (Eje -> ASIC -> Centros) basados en reportes actualizados
  const ejesCalculados = useMemo(() => {
    // Clasificar reportes bajo los 5 ejes estándar
    const ejeReportsMap: Record<string, typeof reportes> = {};
    MIRANDA_EJES.forEach(eje => {
      ejeReportsMap[eje.name] = [];
    });

    reportes.forEach(report => {
      const normalized = normalizeEjeName(report.eje_geografico);
      if (ejeReportsMap[normalized]) {
        ejeReportsMap[normalized].push(report);
      } else {
        ejeReportsMap['METROPOLITANO'].push(report);
      }
    });

    return MIRANDA_EJES.map(eje => {
      const reports = ejeReportsMap[eje.name] || [];
      const totalCentros = reports.length;
      const verdes = reports.filter(r => r.estado_semaforo === 'Verde').length;
      const amarillos = reports.filter(r => r.estado_semaforo === 'Amarillo').length;
      const rojos = reports.filter(r => r.estado_semaforo === 'Rojo').length;

      // Porcentaje de cumplimiento del eje territorial
      const cumplimiento = totalCentros > 0 ? Math.round((verdes / totalCentros) * 100) : 100;

      // Agrupamiento por ASIC
      const asicMap: Record<string, typeof reportes> = {};
      reports.forEach(r => {
        const asicKey = (r.asic || 'Sin ASIC').toUpperCase().trim();
        if (!asicMap[asicKey]) {
          asicMap[asicKey] = [];
        }
        asicMap[asicKey].push(r);
      });

      const asicsCalculados = Object.entries(asicMap).map(([asicName, centers]) => {
        const totalA = centers.length;
        const verdesA = centers.filter(c => c.estado_semaforo === 'Verde').length;
        const cumplimientoA = totalA > 0 ? Math.round((verdesA / totalA) * 100) : 100;

        return {
          name: asicName,
          centers: centers.sort((a, b) => a.nombre_centro.localeCompare(b.nombre_centro)),
          totalCentros: totalA,
          cumplimiento: cumplimientoA,
          verdes: verdesA,
          amarillos: centers.filter(c => c.estado_semaforo === 'Amarillo').length,
          rojos: centers.filter(c => c.estado_semaforo === 'Rojo').length
        };
      }).sort((a, b) => b.cumplimiento - a.cumplimiento || a.name.localeCompare(b.name));

      return {
        ...eje,
        reports,
        totalCentros,
        verdes,
        amarillos,
        rojos,
        cumplimiento,
        asics: asicsCalculados
      };
    });
  }, [reportes, MIRANDA_EJES]);

  // Expandir jerarquías automáticamente cuando la query de búsqueda cambia
  useEffect(() => {
    if (searchQuery.trim() !== '') {
      const nextOpenEjes: Record<string, boolean> = {};
      const nextOpenAsics: Record<string, boolean> = {};

      ejesCalculados.forEach(eje => {
        let ejeHasMatch = false;
        eje.asics.forEach(asic => {
          const centersMatch = asic.centers.some(c => matchesSearch(c, searchQuery));
          const asicMatch = asic.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
          if (centersMatch || asicMatch) {
            nextOpenAsics[eje.name + '_' + asic.name] = true;
            ejeHasMatch = true;
          }
        });
        if (ejeHasMatch || eje.name.toLowerCase().includes(searchQuery.toLowerCase().trim())) {
          nextOpenEjes[eje.name] = true;
        }
      });

      setOpenEjes(nextOpenEjes);
      setOpenAsics(nextOpenAsics);
    }
  }, [searchQuery, ejesCalculados]);

  // Auto-expandir todos los ASICs por defecto al cargar para visualización directiva inmediata
  useEffect(() => {
    if (ejesCalculados && ejesCalculados.length > 0 && !hasAutoOpened && !isLoading) {
      const nextOpenAsics: Record<string, boolean> = {};
      ejesCalculados.forEach(eje => {
        eje.asics.forEach(asic => {
          nextOpenAsics[eje.name + '_' + asic.name] = true;
        });
      });
      setOpenAsics(nextOpenAsics);
      setHasAutoOpened(true);
    }
  }, [ejesCalculados, hasAutoOpened, isLoading]);

  // Manejo fluido de expansión por clicks
  const toggleEje = (ejeName: string) => {
    setOpenEjes(prev => ({
      ...prev,
      [ejeName]: !prev[ejeName]
    }));
  };

  const toggleAsic = (ejeName: string, asicName: string) => {
    const key = `${ejeName}_${asicName}`;
    setOpenAsics(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const formatearFecha = (fechaObj: Date) => {
    return fechaObj.toLocaleTimeString('es-VE', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  // Spinner de carga inicial de Supabase
  if (isLoading && reportes.length === 0) {
    return (
      <div className="bg-slate-50 min-h-[60vh] flex flex-col justify-center items-center p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="relative mb-6">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-slate-100 border-t-[#0B3D5C]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="text-[#0B3D5C]/35 animate-pulse" size={18} />
          </div>
        </div>
        <h4 className="text-[11px] font-black text-[#0B3D5C] uppercase tracking-[0.25em] mb-1">
          Cargando Monitoreo de Semáforo
        </h4>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Sincronizando Fichas Territoriales...
        </p>
      </div>
    );
  }

  // Contadores y promedios globales reales
  const totalClinicasSemaforo = reportes.length;
  const clinicasVerdes = reportes.filter(r => r.estado_semaforo === 'Verde').length;
  const clinicasAmarillas = reportes.filter(r => r.estado_semaforo === 'Amarillo').length;
  const clinicasRojas = reportes.filter(r => r.estado_semaforo === 'Rojo').length;
  const cumplimientoGlobalReal = totalClinicasSemaforo > 0 
    ? Math.round((clinicasVerdes / totalClinicasSemaforo) * 100) 
    : 100;

  return (
    <div className="space-y-8">
      {/* Cabecera & Título Directivo */}
      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[8.5px] font-black uppercase text-[#0B3D5C] bg-[#0B3D5C]/10 border border-[#0B3D5C]/20 px-3 py-1 rounded-full tracking-wider flex items-center gap-1.5 leading-none">
              <ShieldCheck size={10} className="text-[#0B3D5C]" /> Sala Situacional • Mando Directivo
            </span>
            <span className="text-[8.5px] font-black uppercase text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full tracking-wider flex items-center gap-1 leading-none">
              ● En Vivo
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-[#0B3D5C] uppercase tracking-tight leading-none">
            Consolidado Territorial Clínico
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            Monitoreo en tiempo real de tránsito y estatus epidemiológico en el Estado Bolivariano de Miranda
          </p>
        </div>

        {/* Reloj y Sincronizador Activo */}
        <div className="flex flex-col xs:flex-row md:flex-col lg:flex-row items-stretch xs:items-center gap-4 bg-slate-50 border border-slate-100 p-3.5 rounded-3xl self-start md:self-auto shrink-0">
          <div className="flex items-center gap-2.5 px-3">
            <div className="p-2 bg-[#0B3D5C] text-white rounded-xl shadow-xs">
              <Clock size={16} />
            </div>
            <div>
              <span className="text-[8px] font-black uppercase text-slate-400 block tracking-widest">Hora Situacional</span>
              <span className="text-xs font-black text-slate-700 font-mono tracking-tight leading-none mt-1 block">
                {formatearFecha(systemTime)}
              </span>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-slate-200 hidden xs:block md:hidden lg:block" />

          <button
            onClick={syncSheets}
            disabled={isSyncing}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#0B3D5C] hover:bg-[#072437] disabled:opacity-50 text-white rounded-2xl text-[9px] font-black uppercase tracking-wider transition-all shadow-xs hover:shadow-sm cursor-pointer shrink-0"
          >
            <RefreshCw className={`shrink-0 ${isSyncing ? 'animate-spin' : ''}`} size={12} />
            {isSyncing ? 'Consolidando...' : 'Actualizar Datos'}
          </button>
        </div>
      </div>

      {/* Bento Grid de Estadísticas de Tránsito */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Cumplimiento General */}
        <div className="bg-white rounded-[2.2rem] border border-slate-150 p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-widest block">
              Cumplimiento General
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800 tracking-tight">
              {cumplimientoGlobalReal}%
            </span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Metas de Carga</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
              style={{ width: `${cumplimientoGlobalReal}%` }}
            />
          </div>
        </div>

        {/* Centros Activos / Al Día */}
        <div className="bg-white rounded-[2.2rem] border border-slate-150 p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-widest block">
              Centros Al Día (Verde)
            </span>
            <div className="p-1.5 bg-green-5 border border-green-150 text-green-700 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-[#008751] inline-block animate-pulse" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#008751] tracking-tight">
              {clinicasVerdes}
            </span>
            <span className="text-xs text-slate-450 font-bold">/ {totalClinicasSemaforo} Clínicas</span>
          </div>
          <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider leading-none">
            Reportando sin demoras críticas
          </p>
        </div>

        {/* Retrasos Moderados (Amarillo) */}
        <div className="bg-white rounded-[2.2rem] border border-slate-150 p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-widest block">
              Retraso Moderado
            </span>
            <div className="p-1.5 bg-amber-5 border border-amber-100 text-amber-605 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFD700] inline-block" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600 tracking-tight">
              {clinicasAmarillas}
            </span>
            <span className="text-xs text-slate-450 font-bold">Clínicas</span>
          </div>
          <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider leading-none">
            Alertas preventivas de tránsito
          </p>
        </div>

        {/* Críticos / Inactivos (Rojo) */}
        <div className="bg-white rounded-[2.2rem] border border-slate-150 p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-widest block">
              Inactivos / Críticos
            </span>
            <div className="p-1.5 bg-rose-5 border border-rose-100 text-rose-650 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-[#CF0921] inline-block shadow-xs shadow-rose-500 animate-pulse" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#CF0921] tracking-tight">
              {clinicasRojas}
            </span>
            <span className="text-xs text-slate-450 font-bold">Clínicas</span>
          </div>
          <p className="text-[9px] text-[#CF0921]/80 uppercase font-black tracking-wider leading-none">
            Se requiere intervención directiva
          </p>
        </div>
      </div>

      {/* Contenedor Principal de Fichas (5 Ejes Territoriales) */}
      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-150 shadow-sm space-y-6">
        
        {/* Filtro & Buscador integrado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-[#0B3D5C] uppercase tracking-tight">
              Buscador Dinámico Territorial
            </h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
              Ubica de inmediato centros clínicos, ASICs o estatus regionales
            </p>
          </div>

          <div className="relative w-full sm:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Buscar clínica, CDI, ASIC o municipio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#0B3D5C] transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Listado de 5 Ejes Territoriales */}
        <div className="space-y-4">
          {ejesCalculados.map((eje) => {
            const isEjeExpanded = !!openEjes[eje.name];
            
            // Si hay búsqueda, verificar si este eje tiene ASICs/Centros que coincidan
            const matchingAsics = eje.asics.map(asic => {
              const matchedCenters = asic.centers.filter(c => matchesSearch(c, searchQuery));
              const asicNameMatches = asic.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
              return {
                ...asic,
                matchedCenters,
                hasMatch: matchedCenters.length > 0 || asicNameMatches
              };
            }).filter(a => a.hasMatch);

            // Saltar eje si tiene búsqueda activa y nada coincide
            if (hasActiveSearch && matchingAsics.length === 0 && !eje.name.toLowerCase().includes(searchQuery.toLowerCase().trim())) {
              return null;
            }

            const asicsToShow = hasActiveSearch ? matchingAsics : eje.asics;

            return (
              <div 
                key={eje.name} 
                className="bg-slate-50/50 border border-slate-200/80 rounded-[2rem] overflow-hidden shadow-xs hover:shadow-xs transition-shadow"
              >
                {/* Cabecera del Eje (Nivel 1) */}
                <div 
                  onClick={() => toggleEje(eje.name)}
                  className={`px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors select-none border-l-4 ${eje.color}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-150 flex items-center justify-center text-slate-600 shadow-xxs">
                      <MapIcon size={16} />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <h4 className="text-[12.5px] font-black text-[#0B3D5C] uppercase tracking-tight">
                          EJE {eje.name}
                        </h4>
                        <span className="text-[8.5px] font-mono font-bold text-slate-400 uppercase">
                          [{eje.code}]
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                        <Users size={9} className="inline mr-1" />
                        Población: {eje.population.toLocaleString('es-VE')} hab
                      </span>
                    </div>
                  </div>

                  {/* Estado Semáforos y Cumplimiento del Eje */}
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Alertas semáforos */}
                    <div className="flex gap-2.5">
                      <span className="px-2.5 py-1 bg-green-50 border border-green-100 rounded-full text-[8.5px] font-black text-[#008751] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#008751]" /> {eje.verdes}
                      </span>
                      <span className="px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-full text-[8.5px] font-black text-amber-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" /> {eje.amarillos}
                      </span>
                      <span className="px-2.5 py-1 bg-rose-50 border border-rose-100 rounded-full text-[8.5px] font-black text-[#CF0921] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#CF0921]" /> {eje.rojos}
                      </span>
                    </div>

                    {/* Barra de progreso */}
                    <div className="flex items-center gap-2.5 py-1 px-3 bg-white border border-slate-200 rounded-2xl min-w-[130px] justify-between">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cumplimiento</span>
                      <span className="text-xs font-black text-slate-700">{eje.cumplimiento}%</span>
                    </div>

                    {/* Botón expandir */}
                    <button className="text-slate-400 hover:text-slate-650 p-1.5 bg-white rounded-xl border border-slate-150 cursor-pointer shadow-xxs">
                      {isEjeExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Listado de ASICs (Nivel 2) */}
                <AnimatePresence initial={false}>
                  {isEjeExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="border-t border-slate-200 overflow-hidden"
                    >
                      <div className="p-4 sm:p-5 space-y-3.5 bg-white">
                        {asicsToShow.length === 0 ? (
                          <p className="text-[10px] text-slate-405 font-bold uppercase tracking-wider text-center py-6">
                            No se encontraron Áreas de Salud de Cobertura Integral en este eje.
                          </p>
                        ) : (
                          asicsToShow.map((asic) => {
                            const asicUniqueKey = `${eje.name}_${asic.name}`;
                            const isAsicExpanded = !!openAsics[asicUniqueKey];
                            const centersToShow = hasActiveSearch ? asic.matchedCenters : asic.centers;

                            return (
                              <div 
                                key={asic.name} 
                                className="bg-slate-50 border border-slate-150 rounded-[1.5rem] overflow-hidden"
                              >
                                {/* Botón de Cabecera ASIC */}
                                <div 
                                  onClick={() => toggleAsic(eje.name, asic.name)}
                                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/55 transition-colors select-none"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="p-1 px-2.5 bg-[#0B3D5C]/10 text-[#0B3D5C] rounded-lg text-xxs font-black tracking-widest uppercase">
                                      ASIC
                                    </div>
                                    <h5 className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
                                      {asic.name}
                                    </h5>
                                  </div>

                                  <div className="flex items-center gap-4">
                                    {/* Indicadores de Salud semáforos */}
                                    <div className="flex gap-2">
                                      <span className="w-2.5 h-2.5 rounded-full bg-[#008751] inline-block" title={`${asic.verdes} Al día`} />
                                      {asic.amarillos > 0 && <span className="w-2.5 h-2.5 rounded-full bg-[#FFD700] inline-block" title={`${asic.amarillos} Con retraso`} />}
                                      {asic.rojos > 0 && <span className="w-2.5 h-2.5 rounded-full bg-[#CF0921] inline-block animate-pulse" title={`${asic.rojos} Críticos`} />}
                                    </div>

                                    {/* Cumplimiento ASIC con mini barra */}
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden hidden xs:block">
                                        <div 
                                          className={`h-full rounded-full ${
                                            asic.cumplimiento > 75 ? 'bg-[#008751]' : asic.cumplimiento > 40 ? 'bg-[#FFD700]' : 'bg-[#CF0921]'
                                          }`} 
                                          style={{ width: `${asic.cumplimiento}%` }} 
                                        />
                                      </div>
                                      <span className="text-[10px] font-mono font-black text-slate-500">
                                        {asic.cumplimiento}%
                                      </span>
                                    </div>

                                    <button className="text-slate-400 hover:text-slate-600 p-1 bg-white rounded-lg border border-slate-200 shadow-xxs">
                                      {isAsicExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                    </button>
                                  </div>
                                </div>

                                {/* Listado de Centros Médicos (Nivel 3) */}
                                <AnimatePresence initial={false}>
                                  {isAsicExpanded && (
                                    <motion.div
                                      initial={{ height: 0 }}
                                      animate={{ height: 'auto' }}
                                      exit={{ height: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="border-t border-slate-150 overflow-hidden"
                                    >
                                      <div className="p-3 bg-white divide-y divide-slate-100">
                                        {centersToShow.length === 0 ? (
                                          <p className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider text-center py-4">
                                            No hay centros asignados a esta ASIC.
                                          </p>
                                        ) : (
                                          centersToShow.map((centro) => {
                                            const lagHours = centro.horas_retraso || 0;
                                            
                                            // Asignación de clases del estado del semáforo
                                            const colorSemaforo = 
                                              centro.estado_semaforo === 'Verde' 
                                                ? 'bg-emerald-500 shadow-emerald-500/30' 
                                                : centro.estado_semaforo === 'Amarillo' 
                                                  ? 'bg-amber-400 shadow-amber-400/30' 
                                                  : 'bg-rose-500 shadow-rose-500/30 animate-pulse';

                                            const textSemaforo = 
                                              centro.estado_semaforo === 'Verde' 
                                                ? 'A TIEMPO' 
                                                : centro.estado_semaforo === 'Amarillo' 
                                                  ? 'DEMORADO' 
                                                  : 'INACTIVO / CRÍTICO';

                                            const textSemaforoColor = 
                                              centro.estado_semaforo === 'Verde' 
                                                ? 'text-[#008751] bg-[#008751]/10 border-[#008751]/20' 
                                                : centro.estado_semaforo === 'Amarillo' 
                                                  ? 'text-amber-700 bg-amber-50 border-amber-100' 
                                                  : 'text-rose-700 bg-rose-50 border-rose-100';

                                            return (
                                              <div 
                                                key={centro.id_centro}
                                                className="py-3 px-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/55 rounded-xl transition-colors"
                                              >
                                                {/* Detalle Clínico */}
                                                <div className="flex items-center gap-3">
                                                  <span className={`w-3 h-3 rounded-full shrink-0 shadow-sm ${colorSemaforo}`} />
                                                  <div>
                                                    <div className="flex flex-wrap items-baseline gap-1.5">
                                                      <span className="text-[10px] font-black text-slate-700 uppercase">
                                                        {centro.nombre_centro}
                                                      </span>
                                                      <span className="text-[8px] font-mono font-bold text-slate-400">
                                                        {centro.id_centro}
                                                      </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">
                                                        {centro.asic}
                                                      </span>
                                                      {centro.municipio && (
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                                                          <MapPin size={8} className="mr-0.5" /> {centro.municipio}
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Métricas e Historial */}
                                                <div className="flex flex-wrap items-center gap-3.5 md:gap-6 self-start md:self-auto pl-6 md:pl-0">
                                                  {/* Badge Estado Semáforo Completo */}
                                                  <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border leading-none ${textSemaforoColor}`}>
                                                    {textSemaforo}
                                                  </span>

                                                  {/* Horas de retraso */}
                                                  <div className="flex items-center gap-1.5 text-[9.5px]">
                                                    <Clock size={12} className={lagHours > 0 ? "text-amber-550" : "text-emerald-500"} />
                                                    <span className={`font-black uppercase tracking-wider ${lagHours > 0 ? "text-amber-600 font-bold" : "text-emerald-600"}`}>
                                                      {lagHours === 0 ? 'Sin demoras' : `${lagHours} hrs retraso`}
                                                    </span>
                                                  </div>

                                                  {/* ÚItimo informe */}
                                                  <div className="flex items-center gap-1.5 text-[9.5px] text-slate-405">
                                                    <Calendar size={12} />
                                                    <span className="font-bold">
                                                      Reporte: {centro.ultimo_reporte ? new Date(centro.ultimo_reporte).toLocaleDateString('es-VE') : 'N/A'}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Sin resultados de búsqueda */}
        {hasActiveSearch && !ejesCalculados.some(eje => 
          eje.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
          eje.asics.some(asic => 
            asic.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
            asic.centers.some(c => matchesSearch(c, searchQuery))
          )
        ) && (
          <div className="p-10 text-center border border-dashed border-slate-200 rounded-3xl">
            <p className="text-sm font-black text-slate-400 uppercase tracking-wider">
              No se encontraron coincidencias para "{searchQuery}"
            </p>
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-3 text-xs font-black uppercase text-[#0B3D5C] hover:underline"
            >
              Borrar búsqueda y reestablecer vista general
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
