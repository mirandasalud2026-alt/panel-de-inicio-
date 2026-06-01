import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useDashboardData } from '../../hooks/useDashboardData';
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldAlert, 
  Edit3, 
  Save, 
  CheckCircle2, 
  Activity, 
  Search, 
  AlertTriangle, 
  X,
  Map,
  Layers,
  HeartPulse,
  Sparkles
} from 'lucide-react';

// Estructura para registrar datos fijos en la visualización
interface AsicDbData {
  Cod_ASIC: string;
  nombre_asic: string;
  Cod_Eje: string;
  responsable?: string;
  poblacion_estimada?: number;
  telefono_contacto?: string;
  correo_contacto?: string;
  numero_centros?: number;
}

interface EjeMeta {
  cod_eje: string;
  nombre: string;
  responsable: string;
  poblacion_estimada: number;
  url_imagen_mapa: string;
  descripcion_texto: string;
  contacto_emergencia: string;
}

const STATIC_EJES_META: Record<string, EjeMeta> = {
  altos_mirandinos: {
    cod_eje: 'altos_mirandinos',
    nombre: 'Altos Mirandinos',
    responsable: 'Dra. María Alejandra Benítez',
    poblacion_estimada: 450000,
    url_imagen_mapa: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?auto=format&fit=crop&w=800&q=80',
    descripcion_texto: 'Eje que concentra la capacidad de respuesta materno-infantil en los municipios Guaicaipuro, Carrizal y Los Salias. Centrado en la red de ambulatorios, CDI y hospitales zonales.',
    contacto_emergencia: '+58-412-5550101'
  },
  valles_del_tuy: {
    cod_eje: 'valles_del_tuy',
    nombre: 'Valles del Tuy',
    responsable: 'Dr. Jean Carlos Mendoza',
    poblacion_estimada: 1200000,
    url_imagen_mapa: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
    descripcion_texto: 'Eje de gran magnitud demográfica que abarca 6 municipios. Monitoreo constante de frecuencia epidemiológica en vectores transmisibles e inmunizaciones en zonas agrícolas y urbanas.',
    contacto_emergencia: '+58-412-5550102'
  },
  guarenas_guatire: {
    cod_eje: 'guarenas_guatire',
    nombre: 'Guarenas - Guatire',
    responsable: 'Dra. Carmen Teresa Ruiz',
    poblacion_estimada: 680000,
    url_imagen_mapa: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    descripcion_texto: 'Eje estratégico formado por los municipios Plaza y Zamora. Enfoque prioritario en vigilancia epidemiológica de enfermedades crónicas no transmisibles y respuesta oportuna.',
    contacto_emergencia: '+58-412-5550103'
  },
  barlovento: {
    cod_eje: 'barlovento',
    nombre: 'Barlovento',
    responsable: 'Dr. Andrés Eloy Blanco',
    poblacion_estimada: 380000,
    url_imagen_mapa: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80',
    descripcion_texto: 'Eje costero y tropical expuesto a dinámicas de salud específicas del territorio. Prioridad en coberturas de jornadas de vacunación de campo y atención primaria.',
    contacto_emergencia: '+58-412-5550104'
  },
  metropolitano: {
    cod_eje: 'metropolitano',
    nombre: 'Metropolitano',
    responsable: 'Dra. Sofía Delgado Castro',
    poblacion_estimada: 1850000,
    url_imagen_mapa: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
    descripcion_texto: 'Eje urbano de densa movilidad que comprende los municipios Sucre, Baruta, Chacao y El Hatillo. Monitoreo de alta velocidad e interoperabilidad del flujo nominal.',
    contacto_emergencia: '+58-412-5550105'
  }
};

export default function MinimalistDashboard() {
  const { reportes } = useDashboardData();
  
  // Niveles de navegación: 1 = Selector de Eje, 2 = Listado de ASIC, 3 = Ficha Técnica de ASIC
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [selectedEjeKey, setSelectedEjeKey] = useState<string>('');
  const [selectedAsicCod, setSelectedAsicCod] = useState<string>('');
  
  // Datos dinámicos cargados de Supabase
  const [dbEjes, setDbEjes] = useState<EjeMeta[]>([]);
  const [dbAsics, setDbAsics] = useState<AsicDbData[]>([]);
  const [vRedesData, setVRedesData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Estado de edición en Nivel 3
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editResponsable, setEditResponsable] = useState<string>('');
  const [editPoblacion, setEditPoblacion] = useState<number>(0);
  const [editCentros, setEditCentros] = useState<number>(0);
  const [editTelefono, setEditTelefono] = useState<string>('');
  const [editCorreo, setEditCorreo] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  
  // Filtro de búsqueda para ASICs en Nivel 2
  const [asicSearch, setAsicSearch] = useState<string>('');

  // Cargar datos de la BD (con retrocompatibilidad y cargando de v_redes_comunales_2026)
  const cargarValores = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        // Fallback a simulación si no hay Supabase en el ambiente
        setDbEjes(Object.values(STATIC_EJES_META));
        setVRedesData([]);
        setLoading(false);
        return;
      }

      // 1. Obtener Ejes reales con metadatos de la tabla 'TEjes'
      const { data: ejesData, error: ejesError } = await supabase
        .from('TEjes')
        .select('*');

      // 2. Obtener ASICs reales con metadatos de la tabla 'TASIC'
      const { data: asicsData, error: asicsError } = await supabase
        .from('TASIC')
        .select('*');

      if (!asicsError && asicsData) {
        setDbAsics(asicsData);
      } else {
        console.warn('No se pudo leer la tabla TASIC de Supabase.', asicsError);
      }

      // 3. Obtener Data Digerida de la Vista v_redes_comunales_2026_mayus
      const { data: redesData, error: redesError } = await supabase
        .from('v_redes_comunales_2026_mayus')
        .select('*');

      if (!redesError && redesData) {
        setVRedesData(redesData);
      } else {
        console.warn('No se pudo cargar la vista v_redes_comunales_2026_mayus:', redesError);
        setVRedesData([]);
      }

      // 4. Mapear y agrupar ejes combinando v_redes_comunales_2026_mayus, TEjes y fallbacks
      const mergedEjesList = Object.entries(STATIC_EJES_META).map(([key, item]) => {
        const keyLower = key.toLowerCase().trim();
        
        // Registro correspondiente de TEjes
        const dbRecord = ejesData?.find((r: any) => String(r.cod_eje || '').toLowerCase().trim() === keyLower);

        // Registro de la vista de redes agrupado/emparejado por cod_eje
        const redesMatch = redesData?.find((r: any) => String(r.cod_eje || '').toLowerCase().trim() === keyLower);

        return {
          cod_eje: key,
          nombre: redesMatch?.nombre_eje || dbRecord?.nombre_eje || dbRecord?.Eje || dbRecord?.eje || item.nombre,
          responsable: redesMatch?.responsable || redesMatch?.responsable_eje || dbRecord?.responsable || item.responsable,
          poblacion_estimada: Number(redesMatch?.poblacion_estimada || dbRecord?.poblacion_estimada || item.poblacion_estimada),
          url_imagen_mapa: redesMatch?.url_imagen_mapa || dbRecord?.url_imagen_mapa || item.url_imagen_mapa,
          descripcion_texto: dbRecord?.descripcion_texto || dbRecord?.descripcion || item.descripcion_texto,
          contacto_emergencia: dbRecord?.contacto_emergencia || item.contacto_emergencia
        };
      });
      setDbEjes(mergedEjesList);

    } catch (err) {
      console.error('Error cargando iniciales en panel directivo:', err);
      setDbEjes(Object.values(STATIC_EJES_META));
      setVRedesData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarValores();
  }, []);

  // Determinar datos del Eje seleccionado actualmente
  const selectedEje = useMemo(() => {
    return dbEjes.find(e => e.cod_eje === selectedEjeKey) || STATIC_EJES_META[selectedEjeKey] || null;
  }, [selectedEjeKey, dbEjes]);

  // Filtrar y calcular ASICs para el Eje seleccionado actual
  const asicsDelEje = useMemo(() => {
    if (!selectedEjeKey) return [];
    
    // Normalizar el código del eje para un emparejamiento estricto o aproximado
    const rawEjeKey = selectedEjeKey.toLowerCase().replace('_', '').replace('-', '');
    
    // Obtener nombres de ASICs detectados en los reportes que pertenecen a este eje
    const asicsEnReportes = reportes.filter(r => {
      const normReportEje = (r.eje_geografico || '').toLowerCase().replace('_', '').replace('-', '').replace(' ', '');
      const normTargetEje = rawEjeKey.replace(' ', '');
      return normReportEje === normTargetEje || normReportEje.includes(normTargetEje) || normTargetEje.includes(normReportEje);
    });

    const matchingRedesRows = vRedesData.filter(row => {
      const rowEje = String(row.cod_eje || row.Cod_Eje || '').toLowerCase().trim();
      return rowEje === selectedEjeKey.toLowerCase().trim();
    });
    
    // Obtener súper keys únicas de ASICs
    const allAsicIdentifiers = Array.from(new Set([
      ...matchingRedesRows.map(row => String(row.cod_asic || row.Cod_ASIC || '').trim().toLowerCase()),
      ...matchingRedesRows.map(row => String(row.nombre_asic || row['Nombre ASIC'] || '').trim().toLowerCase()),
      ...asicsEnReportes.map(r => String(r.asic || '').trim().toLowerCase())
    ])).filter(Boolean);

    return allAsicIdentifiers.map((identifier) => {
      // Buscar coincidencia en vRedesData
      const redesMatch = matchingRedesRows.find(r => 
        String(r.cod_asic || r.Cod_ASIC || '').toLowerCase().trim() === identifier ||
        String(r.nombre_asic || r['Nombre ASIC'] || '').toLowerCase().trim() === identifier
      );

      // Buscar coincidencia en dbAsics
      const dbMatch = dbAsics.find(a => 
        String(a.cod_asic || a.Cod_ASIC || '').toLowerCase().trim() === identifier ||
        String(a.nombre_asic || a['Nombre ASIC'] || '').toLowerCase().trim() === identifier
      );

      const asicName = redesMatch?.nombre_asic || redesMatch?.['Nombre ASIC'] || dbMatch?.nombre_asic || dbMatch?.['Nombre ASIC'] || identifier.toUpperCase();
      const asicCode = redesMatch?.cod_asic || redesMatch?.Cod_ASIC || dbMatch?.cod_asic || dbMatch?.Cod_ASIC || identifier;

      // Filtrar reportes del ASIC
      const reportsOfAsic = asicsEnReportes.filter((r: any) => 
        String(r.asic || '').trim().toLowerCase() === identifier ||
        String(r.asic || '').trim().toLowerCase() === String(asicCode).trim().toLowerCase() ||
        String(r.asic || '').trim().toLowerCase() === String(asicName).trim().toLowerCase()
      );
      
      const totalCentrosCalculado = reportsOfAsic.length;
      const reportaronHoy = reportsOfAsic.filter((c: any) => c.estado_semaforo === 'Verde').length;

      // Calcular semáforo del ASIC en el momento real
      let semaforo: 'Verde' | 'Amarillo' | 'Rojo' = 'Verde';
      const porcentaje = totalCentrosCalculado > 0 ? (reportaronHoy / totalCentrosCalculado) * 100 : 0;
      
      if (totalCentrosCalculado === 0) {
        semaforo = 'Rojo';
      } else if (reportsOfAsic.some((c: any) => c.estado_semaforo === 'Rojo')) {
        semaforo = porcentaje >= 70 ? 'Amarillo' : 'Rojo';
      } else if (porcentaje >= 80) {
        semaforo = 'Verde';
      } else if (porcentaje >= 40) {
        semaforo = 'Amarillo';
      } else {
        semaforo = 'Rojo';
      }

      return {
        cod_asic: asicCode,
        nombre_asic: asicName,
        nombre_municipio: redesMatch?.nombre_municipio || dbMatch?.nombre_municipio || 'Municipio de Miranda',
        responsable: redesMatch?.responsable_eje || dbMatch?.responsable || 'Sin Asignar',
        poblacion_estimada: redesMatch?.poblacion_estimada || dbMatch?.poblacion_estimada || 0,
        telefono_contacto: dbMatch?.telefono_contacto || 'No registrado',
        correo_contacto: dbMatch?.correo_contacto || 'No registrado',
        numero_centros: redesMatch?.numero_centros || dbMatch?.numero_centros || totalCentrosCalculado || 0,
        porcentaje_reporte: totalCentrosCalculado > 0 ? Math.round(porcentaje) : 0,
        semaforo,
        centrosTotal: totalCentrosCalculado,
        reportaronTotal: reportaronHoy,
        centrosDetalles: reportsOfAsic,
        total_infantiles_0_5: redesMatch?.total_infantiles_0_5 || redesMatch?.Total_infantiles_0_5 || redesMatch?.['total_infantiles_0_5'] || 0,
        total_infantiles_6_11: redesMatch?.total_infantiles_6_11 || redesMatch?.Total_infantiles_6_11 || redesMatch?.['total_infantiles_6_11'] || 0,
        total_adolescentes: redesMatch?.total_adolescentes || redesMatch?.Total_adolescentes || redesMatch?.['total_adolescentes'] || 0,
        total_adultos: redesMatch?.total_adultos || redesMatch?.Total_adultos || redesMatch?.['total_adultos'] || 0,
        total_adulto_mayor: redesMatch?.total_adulto_mayor || redesMatch?.Total_adulto_mayor || redesMatch?.['total_adulto_mayor'] || 0
      };
    }).filter((a: any) => {
      const matchSearch = !asicSearch.trim() || 
        String(a.nombre_asic || '').toLowerCase().includes(asicSearch.toLowerCase()) ||
        String(a.nombre_municipio || '').toLowerCase().includes(asicSearch.toLowerCase());
      return matchSearch;
    });
  }, [selectedEjeKey, reportes, dbAsics, vRedesData, asicSearch]);

  // Agrupar ASICs por municipio para desglosar ordenadamente (Drill-down)
  const asicsByMunicipio = useMemo(() => {
    const agrupados: Record<string, any[]> = {};
    asicsDelEje.forEach(a => {
      const muni = a.nombre_municipio || 'Otros Municipios';
      if (!agrupados[muni]) {
        agrupados[muni] = [];
      }
      agrupados[muni].push(a);
    });
    return agrupados;
  }, [asicsDelEje]);

  // ASIC seleccionado en el tercer nivel
  const selectedAsic = useMemo(() => {
    return asicsDelEje.find(a => a.cod_asic === selectedAsicCod) || null;
  }, [selectedAsicCod, asicsDelEje]);

  // Cargar formulario al entrar a la edición del tercer nivel
  useEffect(() => {
    if (selectedAsic) {
      setEditResponsable(selectedAsic.responsable || '');
      setEditPoblacion(selectedAsic.poblacion_estimada || 0);
      setEditCentros(selectedAsic.numero_centros || 0);
      setEditTelefono(selectedAsic.telefono_contacto || '');
      setEditCorreo(selectedAsic.correo_contacto || '');
      setIsEditing(false);
      setSaveStatus(null);
    }
  }, [selectedAsic]);

  // Guardar la Ficha Técnica editada en Supabase
  const guardarFichaTecnica = async () => {
    if (!selectedAsic) return;
    setSaving(true);
    setSaveStatus(null);
    
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado en las variables de entorno.');
      }

      // Armamos los datos correspondientes para la tabla TASIC
      const payload = {
        "Cod_ASIC": selectedAsic.cod_asic,
        "Nombre ASIC": selectedAsic.nombre_asic,
        "Cod_Eje": selectedEjeKey,
        responsable: editResponsable.trim(),
        poblacion_estimada: Number(editPoblacion),
        telefono_contacto: editTelefono.trim(),
        correo_contacto: editCorreo.trim(),
        numero_centros: Number(editCentros),
        cod_asic: selectedAsic.cod_asic,
        nombre_asic: selectedAsic.nombre_asic,
        cod_eje: selectedEjeKey
      };

      const { error } = await supabase
        .from('TASIC')
        .upsert(payload, { onConflict: 'Cod_ASIC' });

      if (error) throw error;

      setSaveStatus('success');
      setIsEditing(false);
      // Recargar de la BD
      await cargarValores();
    } catch (err: any) {
      console.error('Error al guardar la Ficha Técnica:', err);
      // Fallback amigable
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const formatearNumero = (num: number) => {
    return num.toLocaleString('es-VE');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-1 py-4 font-sans text-slate-700 min-h-[80vh]">
      
      {/* HEADER DE BIENVENIDA */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-150 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#0B3D5C] font-black text-xs uppercase tracking-[0.2em] mb-1">
            <HeartPulse size={14} className="text-emerald-500 animate-pulse" />
            <span>Sistema Territorial de Salud Pública</span>
            <Sparkles size={11} className="text-amber-500" />
          </div>
          <h1 className="text-2xl font-black text-[#0B3D5C] uppercase tracking-tight flex items-center gap-2">
            Sala Situacional Central de Miranda
          </h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mt-1">
            Consolidado de cumplimiento en tránsito de libros médicos e información de ASICs
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => cargarValores()}
            className="px-4 py-2 bg-white text-[10px] font-black uppercase text-[#0B3D5C] border border-gray-250 hover:bg-gray-50 transition-all rounded-xl shadow-xs"
          >
            Actualizar Datos
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-150 border-t-[#0B3D5C] mx-auto mb-4"></div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-black">Cargando base estructural territorial...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          
          {/* ==================== NIVEL 1: 5 BOTONES-FICHA DE EJES ==================== */}
          {level === 1 && (
            <motion.div
              key="nivel1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="bg-[#0B3D5C] text-white p-6 rounded-[2rem] shadow-sm relative overflow-hidden mb-1">
                <div className="absolute right-[-20px] top-[-20px] opacity-10 blur-sm">
                  <Map size={240} className="text-white" />
                </div>
                <div className="relative z-10 max-w-xl">
                  <span className="text-[9px] font-black text-amber-400 uppercase tracking-[0.3em] bg-white/10 px-3 py-1 rounded-full border border-white/5">
                    Monitoreo de 5 Ejes
                  </span>
                  <h2 className="text-xl font-extrabold mt-3 uppercase tracking-tight">Geografía Sanitaria de Miranda</h2>
                  <p className="text-xs mt-2 text-slate-200 font-semibold leading-relaxed">
                    Seleccione un Eje de Gestión Territorial para auditar su porcentaje de reporte hoy, revisar las ASICs activas, o gestionar sus respectivas fichas de información técnico-médica.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
                {dbEjes.map((eje) => {
                  // Calcular indicadores agregados del eje actual usando useMemo
                  const rawEjeKey = eje.cod_eje.toLowerCase().replace('_', '').replace('-', '');
                  const asicsEje = reportes.filter(r => {
                    const normReportEje = (r.eje_geografico || '').toLowerCase().replace('_', '').replace('-', '').replace(' ', '');
                    return normReportEje === rawEjeKey || normReportEje.includes(rawEjeKey) || rawEjeKey.includes(normReportEje);
                  });
                  const asicNamesUnicos = Array.from(new Set(asicsEje.map(r => r.asic?.trim()).filter(Boolean)));
                  const correctos = asicsEje.filter(c => c.estado_semaforo === 'Verde').length;
                  const total = asicsEje.length;
                  const compliancePercent = total > 0 ? Math.round((correctos / total) * 100) : 100;

                  return (
                    <motion.button
                      key={eje.cod_eje}
                      whileHover={{ y: -3, scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setSelectedEjeKey(eje.cod_eje);
                        setAsicSearch('');
                        setLevel(2);
                      }}
                      className="group flex flex-col bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-xs hover:shadow-lg transition-all text-left h-full cursor-pointer"
                    >
                      {/* Imagen con fallback */}
                      <div className="h-28 w-full bg-slate-100 overflow-hidden relative">
                        <img 
                          src={eje.url_imagen_mapa} 
                          alt={eje.nombre} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3">
                          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            {asicNamesUnicos.length} ASICs
                          </span>
                        </div>
                      </div>

                      {/* Info del Eje */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-1">
                          <h3 className="text-sm font-black text-[#0B3D5C] group-hover:text-amber-500 transition-colors uppercase tracking-tight">
                            {eje.nombre}
                          </h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase truncate">
                            {eje.responsable || 'Sin director asignado'}
                          </p>
                        </div>

                        {/* Progreso del Eje */}
                        <div className="space-y-1.5 bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                          <div className="flex items-center justify-between text-[8px] font-black uppercase text-gray-400 tracking-wider">
                            <span>Sincronizados</span>
                            <span className={compliancePercent >= 80 ? 'text-emerald-600' : 'text-amber-500'}>
                              {compliancePercent}% Calificado
                            </span>
                          </div>
                          
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                compliancePercent >= 80 ? 'bg-emerald-500' :
                                compliancePercent >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${compliancePercent}%` }}
                            />
                          </div>
                          
                          <p className="text-[8px] text-gray-400 font-bold uppercase">
                            {correctos} de {total} centros reportaron hoy
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ==================== NIVEL 2: PANTALLA DEL EJE (LISTADO DE ASICs) ==================== */}
          {level === 2 && selectedEje && (
            <motion.div
              key="nivel2"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* BACK BUTTON */}
              <button
                onClick={() => setLevel(1)}
                className="flex items-center gap-2 text-slate-500 hover:text-[#0B3D5C] font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} /> Regresar a Ejes Territoriales
              </button>

              {/* DETALLES DE ENCABEZADO DEL EJE */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-gray-150 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-sm">
                <div className="space-y-2 col-span-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black text-[#0B3D5C] tracking-[0.22em] bg-blue-50 px-2.5 py-1 rounded-full uppercase border border-blue-150">
                      Datos Generales del Eje
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-[#0B3D5C] uppercase tracking-tight">
                    Eje Geográfico {selectedEje.nombre}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-xl">
                    {selectedEje.descripcion_texto}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 flex flex-col justify-center space-y-2 text-xs">
                  <div>
                    <span className="text-[8px] font-black text-gray-400 uppercase block tracking-wider">Director de Gestión</span>
                    <strong className="text-slate-700 font-black uppercase text-[10px]">{selectedEje.responsable}</strong>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-gray-400 uppercase block tracking-wider">Población Estimada</span>
                    <strong className="text-slate-700 font-black text-[10px]">{formatearNumero(selectedEje.poblacion_estimada)} Habitantes</strong>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-gray-400 uppercase block tracking-wider">Urgencias e Higiene</span>
                    <strong className="text-emerald-600 font-black text-[10px]">{selectedEje.contacto_emergencia || 'No registrado'}</strong>
                  </div>
                </div>
              </div>

              {/* SEARCH & TITLE CONTAINER */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-150 pb-4">
                <div>
                  <h3 className="text-sm font-black text-[#0B3D5C] uppercase tracking-wider">
                    Áreas de Salud Integral Comunitaria (ASICs)
                  </h3>
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider">
                    Reporte de {asicsDelEje.length} ASICs mapeadas en {selectedEje.nombre}
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar ASIC..."
                    value={asicSearch}
                    onChange={(e) => setAsicSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-250 rounded-xl text-xs placeholder-gray-400 font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#0B3D5C] transition-all"
                  />
                </div>
              </div>

              {/* LIST OF ASICS GROUPED BY MUNICIPIO */}
              <div className="space-y-8">
                {Object.entries(asicsByMunicipio).map(([municipioName, value]) => {
                  const items = value as any[];
                  return (
                    <div key={municipioName} className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-gray-150 pb-2">
                        <MapPin size={15} className="text-[#0B3D5C]" />
                        <h4 className="text-xs font-black text-[#0B3D5C] uppercase tracking-wider">
                          Municipio: {municipioName}
                        </h4>
                        <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {items.length} ASIC{items.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {items.map((asic) => {
                          // Determinar color de semáforo interactivo
                          const colorMap = {
                            Verde: {
                              bg: 'bg-white border-gray-150 hover:border-emerald-300',
                              badge: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
                              dot: 'bg-emerald-400',
                              text: 'text-[#0B3D5C]',
                              desc: 'Reportes al día'
                            },
                            Amarillo: {
                              bg: 'bg-amber-50/20 border-amber-150 hover:border-amber-300',
                              badge: 'bg-amber-50 text-amber-700 border border-amber-100',
                              dot: 'bg-amber-400',
                              text: 'text-amber-950',
                              desc: 'Rezagado'
                            },
                            Rojo: {
                              bg: 'bg-rose-50/20 border-rose-150 hover:border-rose-300',
                              badge: 'bg-rose-50 text-rose-700 border border-rose-100',
                              dot: 'bg-rose-400',
                              text: 'text-rose-950',
                              desc: 'Sin reportes recientes'
                            }
                          }[asic.semaforo] || {
                            bg: 'bg-white border-gray-150',
                            badge: 'bg-slate-50 text-slate-700 border border-slate-100',
                            dot: 'bg-slate-400',
                            text: 'text-slate-700',
                            desc: 'Sin datos'
                          };

                          return (
                            <motion.div
                              key={asic.cod_asic}
                              whileHover={{ y: -2, scale: 1.01 }}
                              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 shadow-sm ${colorMap.bg}`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${colorMap.badge}`}>
                                    ASIC {asic.cod_asic}
                                  </span>
                                  <span className="text-[10px] font-black text-gray-400 uppercase">
                                    {asic.centrosTotal || asic.numero_centros || 0} Centros
                                  </span>
                                </div>
                                
                                <h4 className="text-xs font-black text-[#0B3D5C] uppercase tracking-tight pt-1">
                                  {asic.nombre_asic}
                                </h4>
                                <p className="text-[9px] text-gray-450 font-bold uppercase truncate">
                                  Director: {asic.responsable || 'Por Asignar'}
                                </p>
                              </div>

                              {/* INDICADORES DEMOGRÁFICOS SQL DIGERIDOS */}
                              <div className="bg-gray-50/60 p-3 rounded-2xl border border-gray-100 space-y-2">
                                <span className="text-[8px] font-black uppercase text-gray-450 tracking-wider block border-b border-gray-200 pb-1 leading-none">
                                  Carga Demográfica Estimada
                                </span>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] font-medium text-slate-600">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400 font-bold uppercase text-[8px]">0-5 años:</span>
                                    <strong className="text-slate-700 font-extrabold">{formatearNumero(asic.total_infantiles_0_5)}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-405 font-bold uppercase text-[8px]">6-11 años:</span>
                                    <strong className="text-slate-700 font-extrabold">{formatearNumero(asic.total_infantiles_6_11)}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-405 font-bold uppercase text-[8px]">Adolescentes:</span>
                                    <strong className="text-slate-700 font-extrabold">{formatearNumero(asic.total_adolescentes)}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-405 font-bold uppercase text-[8px]">Adultos:</span>
                                    <strong className="text-slate-700 font-extrabold">{formatearNumero(asic.total_adultos)}</strong>
                                  </div>
                                  <div className="flex justify-between col-span-2 border-t border-dashed border-gray-200 pt-1 mt-1 font-bold">
                                    <span className="text-rose-500 font-black uppercase text-[8px]">Adulto Mayor (60+):</span>
                                    <strong className="text-rose-600 font-black">{formatearNumero(asic.total_adulto_mayor)}</strong>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="border-t border-dashed border-gray-200/50 pt-2 flex items-center justify-between text-[10px]">
                                  <div>
                                    <span className="text-[8px] font-bold text-gray-450 uppercase block leading-none">Tránsito Semanal</span>
                                    <span className={`font-black uppercase text-[9px] ${colorMap.text}`}>
                                      {asic.reportaronTotal} de {asic.centrosTotal || asic.numero_centros || 1} Reportado
                                    </span>
                                  </div>
                                  
                                  <span className={`font-black text-xs ${colorMap.text}`}>
                                    {asic.porcentaje_reporte}%
                                  </span>
                                </div>

                                <button
                                  onClick={() => {
                                    setSelectedAsicCod(asic.cod_asic);
                                    setLevel(3);
                                  }}
                                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0B3D5C] hover:bg-[#072437] text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer text-center shadow-xs"
                                >
                                  <Building2 size={11} /> Ficha Técnica & Más
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

                {asicsDelEje.length === 0 && (
                  <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-200 rounded-[2rem]">
                    <AlertTriangle size={32} className="text-amber-500 mx-auto mb-3 animate-bounce" />
                    <h4 className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider">No se encontraron ASICs</h4>
                    <p className="text-[10px] text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
                      No se han registrado reportes de salud para esta geografía en los libros del sistema.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ==================== NIVEL 3: FICHA TÉCNICA Y EDICIÓN DE ASIC ==================== */}
          {level === 3 && selectedAsic && selectedEje && (
            <motion.div
              key="nivel3"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* BACK BUTTON */}
              <button
                onClick={() => setLevel(2)}
                className="flex items-center gap-2 text-slate-500 hover:text-[#0B3D5C] font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} /> Regresar a ASICs de {selectedEje.nombre}
              </button>

              {/* BENTO GRID DE LA ASIC */}
              <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-gray-150 shadow-sm space-y-6">
                
                {/* CABECERA DE LA FICHA */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-150 pb-5">
                  <div>
                    <span className="text-[8px] font-black text-emerald-700 tracking-[0.25em] bg-emerald-50 px-3 py-1 rounded-full uppercase border border-emerald-150">
                      Ficha Técnica Territorial N° {selectedAsic.cod_asic}
                    </span>
                    <h2 className="text-xl font-black text-[#0B3D5C] uppercase tracking-tight mt-2 flex items-center gap-2">
                      {selectedAsic.nombre_asic}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => setIsEditing(false)}
                          disabled={saving}
                          className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-250 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={guardarFichaTecnica}
                          disabled={saving}
                          className="flex items-center gap-1.5 px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                        >
                          {saving ? 'Guardando...' : <Save size={12} />} Guardar Ficha
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1.5 px-4.5 py-2.5 bg-[#0B3D5C] hover:bg-[#072437] text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                      >
                        <Edit3 size={12} /> Editar Datos
                      </button>
                    )}
                  </div>
                </div>

                {/* NOTIFICADORES DE STATUS */}
                {saveStatus === 'success' && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-250 rounded-2xl flex items-center gap-2 text-emerald-800 text-[10px] font-black uppercase tracking-wide">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>¡La Ficha Técnica se actualizó exitosamente en la base de datos central!</span>
                  </div>
                )}

                {saveStatus === 'error' && (
                  <div className="p-3.5 bg-rose-50 border border-rose-250 rounded-2xl flex items-center gap-2 text-rose-800 text-[10px] font-black uppercase tracking-wide">
                    <X size={14} className="text-rose-600" />
                    <span>Error al guardar los campos. Verifique la conexión o intente nuevamente.</span>
                  </div>
                )}

                {/* BENTO CORE SECTIONS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* SECCIÓN 1: CAPACIDAD HUMANA Y SOCIAL */}
                  <div className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100 flex flex-col justify-between min-h-[140px]">
                    <div className="space-y-1">
                      <div className="p-2 bg-[#0B3D5C]/5 text-[#0B3D5C] rounded-xl w-fit">
                        <Users size={16} />
                      </div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pt-1">
                        Capacidad Humana
                      </h4>
                    </div>

                    <div className="mt-3 space-y-4">
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase block">Director / Responsable</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editResponsable}
                            onChange={(e) => setEditResponsable(e.target.value)}
                            placeholder="Nombre del Médico"
                            className="w-full mt-1 px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs font-semibold focus:outline-hidden"
                          />
                        ) : (
                          <span className="text-xs font-black text-[#0B3D5C] uppercase block pt-0.5">
                            {selectedAsic.responsable || 'Sin Asignar'}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase block">Población de Cobertura</span>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editPoblacion}
                            onChange={(e) => setEditPoblacion(Number(e.target.value))}
                            placeholder="Ej. 12000"
                            className="w-full mt-1 px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs font-semibold focus:outline-hidden"
                          />
                        ) : (
                          <span className="text-xs font-black text-[#0B3D5C] block pt-0.5">
                            {formatearNumero(selectedAsic.poblacion_estimada || 0)} Habitantes estimables
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 2: INFRAESTRUCTURA */}
                  <div className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100 flex flex-col justify-between min-h-[140px]">
                    <div className="space-y-1">
                      <div className="p-2 bg-[#0B3D5C]/5 text-[#0B3D5C] rounded-xl w-fit">
                        <Building2 size={16} />
                      </div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pt-1">
                        Establecimientos Físicos
                      </h4>
                    </div>

                    <div className="mt-3 space-y-4">
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase block">Establecimientos Censados</span>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editCentros}
                            onChange={(e) => setEditCentros(Number(e.target.value))}
                            placeholder="Ej. 8"
                            className="w-full mt-1 px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs font-semibold focus:outline-hidden"
                          />
                        ) : (
                          <span className="text-xs font-black text-[#0B3D5C] block pt-0.5">
                            {selectedAsic.numero_centros || 0} Centros de Salud (CDI, SRI, etc.)
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase block">Eje Gubernamental</span>
                        <span className="text-xs font-black text-emerald-700 uppercase tracking-wide block pt-0.5">
                          {selectedEje.nombre}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 3: COMUNICACIÓN DIRECTA */}
                  <div className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100 flex flex-col justify-between min-h-[140px]">
                    <div className="space-y-1">
                      <div className="p-2 bg-[#0B3D5C]/5 text-[#0B3D5C] rounded-xl w-fit">
                        <Phone size={16} />
                      </div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pt-1">
                        Contacto y Reporte
                      </h4>
                    </div>

                    <div className="mt-3 space-y-4">
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase block">Teléfono Móvil</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editTelefono}
                            onChange={(e) => setEditTelefono(e.target.value)}
                            placeholder="Ej. +58-412-5550000"
                            className="w-full mt-1 px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs font-semibold focus:outline-hidden"
                          />
                        ) : (
                          <span className="text-xs font-black text-[#0B3D5C] block pt-0.5">
                            {selectedAsic.telefono_contacto || 'No registrado'}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase block">Correo Electrónico</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editCorreo}
                            onChange={(e) => setEditCorreo(e.target.value)}
                            placeholder="Ej. correo-asic@gmail.com"
                            className="w-full mt-1 px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs font-semibold focus:outline-hidden"
                          />
                        ) : (
                          <span className="text-xs font-black text-[#0B3D5C] block pt-0.5 truncate">
                            {selectedAsic.correo_contacto || 'No registrado'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* HISTORIAL / LISTADO DE ESTABLECIMIENTOS ASOCIADOS */}
                <div className="border-t border-gray-150 pt-6">
                  <h3 className="text-xs font-black text-[#0B3D5C] uppercase tracking-wider mb-4 flex items-center gap-1.5 animate-pulse">
                    <Activity size={13} className="text-emerald-500" />
                    Condición Actual de Establecimientos en el ASIC ({selectedAsic.centrosTotal})
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedAsic.centrosDetalles?.map((centro) => {
                      const semValue = (centro.estado_semaforo || 'Verde').toLowerCase();
                      const semColor = 
                        semValue === 'verde' ? 'bg-emerald-500' :
                        semValue === 'amarillo' ? 'bg-amber-500' : 'bg-rose-500';

                      return (
                        <div 
                          key={centro.id_centro} 
                          className="bg-white p-4 rounded-2xl border border-gray-150 flex items-center justify-between shadow-xs"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <span className="text-[9px] text-gray-400 font-bold block uppercase truncate">ID: {centro.id_centro}</span>
                            <span className="text-xs font-bold text-[#0B3D5C] uppercase block truncate">{centro.nombre_centro}</span>
                            {centro.ultimo_reporte && (
                              <span className="text-[8px] text-slate-400 block font-semibold leading-none pt-0.5">
                                Hoy: {new Date(centro.ultimo_reporte).toLocaleTimeString('es-VE')}
                              </span>
                            )}
                          </div>
                          
                          <span 
                            className={`w-3 h-3 rounded-full shrink-0 ml-3 ${semColor}`} 
                            title={`Semaforo: ${centro.estado_semaforo}`}
                          />
                        </div>
                      );
                    })}

                    {(!selectedAsic.centrosDetalles || selectedAsic.centrosDetalles.length === 0) && (
                      <p className="text-[10px] text-gray-400 py-4 italic col-span-full">
                        No hay reportes ni establecimientos asociados a este ASIC sincronizados hoy.
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      )}

    </div>
  );
}
