import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  MapPin, 
  Users, 
  Phone, 
  Map as MapIcon, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  FileText,
  Building,
  TrendingUp,
  Activity
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface EjeDisplayData {
  cod_eje: string;
  nombre_eje: string;
  responsable?: string;
  poblacion_estimada?: number;
  url_imagen_mapa?: string;
  descripcion_texto: string;
  contacto_emergencia?: string;
}

const FALLBACK_EJES_DATA: Record<string, { nombre: string; meta: { responsable: string; poblacion_estimada: number; url_imagen_mapa: string; descripcion_texto: string; contacto_emergencia: string } }> = {
  altos_mirandinos: {
    nombre: 'Altos Mirandinos',
    meta: {
      responsable: 'Dra. María Alejandra Benítez',
      poblacion_estimada: 450000,
      url_imagen_mapa: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80',
      descripcion_texto: 'Eje que concentra la mayor capacidad de respuesta materno-infantil en los municipios Guaicaipuro, Carrizal y Los Salias. Cuenta con el Hospital Materno Infantil Francisco de Miranda, el Hospital Victorino Santaella, y una densa red de ambulatorios y centros de diagnóstico integral (CDI). Prioridades: reducción de retraso de reportes de arbovirosis y control obstétrico.',
      contacto_emergencia: '+58-412-5550101'
    }
  },
  valles_del_tuy: {
    nombre: 'Valles del Tuy',
    meta: {
      responsable: 'Dr. Jean Carlos Mendoza',
      poblacion_estimada: 1200000,
      url_imagen_mapa: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&w=800&q=80',
      descripcion_texto: 'Eje de gran magnitud demográfica que abarca 6 municipios. Posee una alta frecuencia epidemiológica en vectores transmisibles e infecciones respiratorias. Cuenta con múltiples hospitales generales and CDI. Prioridades: optimización de la inmunización, control de natalidad asistida, y reporte semanal a tiempo en zonas rurales.',
      contacto_emergencia: '+58-412-5550102'
    }
  },
  guarenas_guatire: {
    nombre: 'Guarenas - Guatire',
    meta: {
      responsable: 'Dra. Carmen Teresa Ruiz',
      poblacion_estimada: 680000,
      url_imagen_mapa: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=800&q=80',
      descripcion_texto: 'Eje industrial y residencial estratégico formado por los municipios Plaza y Zamora. Alberga centros clínicos de alta complejidad y una red de atención ambulatoria integrada. Enfocado en la vigilancia de enfermedades no transmisibles (hipertensión, diabetes) y la respuesta rápida ante brotes diarréicos estacionales.',
      contacto_emergencia: '+58-412-5550103'
    }
  },
  barlovento: {
    nombre: 'Barlovento',
    meta: {
      responsable: 'Dr. Andrés Eloy Blanco',
      poblacion_estimada: 380000,
      url_imagen_mapa: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
      descripcion_texto: 'Eje costero expuesto a dinámicas de salud tropicales específicas (paludismo, dengue estacional, y emergencias por inmersión). Comprende 6 municipios. Cuenta con centros rurales especiales e infraestructuras hospitalarias estratégicas. Prioridad: enlace satelital de reportes de tránsito y jornadas de vacunación de campo directo.',
      contacto_emergencia: '+58-412-5550104'
    }
  },
  metropolitano: {
    nombre: 'Metropolitano',
    meta: {
      responsable: 'Dra. Sofía Delgado Castro',
      poblacion_estimada: 1850000,
      url_imagen_mapa: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80',
      descripcion_texto: 'Eje urbano de densa movilidad inter-municipal (Chacao, Baruta, Sucre, El Hatillo). Co-participa activamente con clínicas privadas y centros sanitarios de alta rotación asistencial. Prioridades: vigilancia epidemiológica de alta velocidad, telesalud integrada, e interoperabilidad de fichas nominales quirúrgicas.',
      contacto_emergencia: '+58-412-5550105'
    }
  }
};

export default function EjesManager() {
  const [ejes, setEjes] = useState<EjeDisplayData[]>([]);
  const [selectedCod, setSelectedCod] = useState<string>('altos_mirandinos');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Campos del formulario
  const [nombreEje, setNombreEje] = useState('');
  const [responsable, setResponsable] = useState('');
  const [poblacion, setPoblacion] = useState<number>(0);
  const [contacto, setContacto] = useState('');
  const [mapaUrl, setMapaUrl] = useState('');
  const [descTexto, setDescTexto] = useState('');

  useEffect(() => {
    fetchEjes();
  }, []);

  const fetchEjes = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        // Usar fallbacks si no hay Supabase
        const mockEjesList = Object.entries(FALLBACK_EJES_DATA).map(([cod, item]) => ({
          cod_eje: cod,
          nombre_eje: item.nombre,
          responsable: item.meta.responsable,
          poblacion_estimada: item.meta.poblacion_estimada,
          url_imagen_mapa: item.meta.url_imagen_mapa,
          descripcion_texto: item.meta.descripcion_texto,
          contacto_emergencia: item.meta.contacto_emergencia
        }));
        setEjes(mockEjesList);
        cargarFormulario(mockEjesList.find(e => e.cod_eje === selectedCod) || mockEjesList[0]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('TEjes')
        .select('*');

      if (error) throw error;

      let fetchedList: EjeDisplayData[] = [];

      // Mapear lo obtenido e inyectar fallbacks si faltan o no tienen JSON válido
      const keys = Object.keys(FALLBACK_EJES_DATA);
      
      keys.forEach(key => {
        const dbRecord = data?.find(r => r.cod_eje === key || r.cod_eje?.toLowerCase() === key);
        
        let nombreVal = FALLBACK_EJES_DATA[key].nombre;
        let responsableVal = FALLBACK_EJES_DATA[key].meta.responsable;
        let poblacionVal = FALLBACK_EJES_DATA[key].meta.poblacion_estimada;
        let mapaUrlVal = FALLBACK_EJES_DATA[key].meta.url_imagen_mapa;
        let descTextoVal = FALLBACK_EJES_DATA[key].meta.descripcion_texto;
        let contactoVal = FALLBACK_EJES_DATA[key].meta.contacto_emergencia;

        if (dbRecord) {
          // Si tiene valores directos en las nuevas columnas de la base de datos
          if (dbRecord.Eje) {
            nombreVal = dbRecord.Eje;
          } else if (dbRecord.nombre_eje) {
            nombreVal = dbRecord.nombre_eje;
          }

          if (dbRecord.responsable !== undefined && dbRecord.responsable !== null) {
            responsableVal = dbRecord.responsable;
          }
          if (dbRecord.poblacion_estimada !== undefined && dbRecord.poblacion_estimada !== null) {
            poblacionVal = Number(dbRecord.poblacion_estimada);
          }
          if (dbRecord.url_imagen_mapa !== undefined && dbRecord.url_imagen_mapa !== null) {
            mapaUrlVal = dbRecord.url_imagen_mapa;
          }
          if (dbRecord.descripcion_texto !== undefined && dbRecord.descripcion_texto !== null) {
            descTextoVal = dbRecord.descripcion_texto;
          }
          if (dbRecord.contacto_emergencia !== undefined && dbRecord.contacto_emergencia !== null) {
            contactoVal = dbRecord.contacto_emergencia;
          }

          // Si las columnas directas estuvieran vacías pero tuviera el JSON antiguo serializado en descripción
          if (!descTextoVal && dbRecord.descripcion) {
            try {
              const metaVal = JSON.parse(dbRecord.descripcion);
              if (metaVal.responsable) responsableVal = metaVal.responsable;
              if (metaVal.poblacion_estimada) poblacionVal = Number(metaVal.poblacion_estimada);
              if (metaVal.url_imagen_mapa) mapaUrlVal = metaVal.url_imagen_mapa;
              if (metaVal.descripcion_texto) descTextoVal = metaVal.descripcion_texto;
              if (metaVal.contacto_emergencia) contactoVal = metaVal.contacto_emergencia;
            } catch {
              // si no es JSON, considerarla como el texto descriptivo
              descTextoVal = dbRecord.descripcion;
            }
          }
        }

        fetchedList.push({
          cod_eje: key,
          nombre_eje: nombreVal,
          responsable: responsableVal,
          poblacion_estimada: poblacionVal,
          url_imagen_mapa: mapaUrlVal,
          descripcion_texto: descTextoVal,
          contacto_emergencia: contactoVal
        });
      });

      setEjes(fetchedList);
      
      const activeEje = fetchedList.find(e => e.cod_eje === selectedCod) || fetchedList[0];
      if (activeEje) {
        cargarFormulario(activeEje);
      }
    } catch (err: any) {
      console.error('Error fetching TEjes:', err);
      // Usar fallbacks completos
      const fallbackList = Object.entries(FALLBACK_EJES_DATA).map(([cod, item]) => ({
        cod_eje: cod,
        nombre_eje: item.nombre,
        responsable: item.meta.responsable,
        poblacion_estimada: item.meta.poblacion_estimada,
        url_imagen_mapa: item.meta.url_imagen_mapa,
        descripcion_texto: item.meta.descripcion_texto,
        contacto_emergencia: item.meta.contacto_emergencia
      }));
      setEjes(fallbackList);
      cargarFormulario(fallbackList.find(e => e.cod_eje === selectedCod) || fallbackList[0]);
    } finally {
      setLoading(false);
    }
  };

  const cargarFormulario = (eje: EjeDisplayData) => {
    setNombreEje(eje.nombre_eje);
    setResponsable(eje.responsable || '');
    setPoblacion(eje.poblacion_estimada || 0);
    setContacto(eje.contacto_emergencia || '');
    setMapaUrl(eje.url_imagen_mapa || '');
    setDescTexto(eje.descripcion_texto || '');
  };

  const alternarEje = (cod: string) => {
    setSelectedCod(cod);
    const found = ejes.find(e => e.cod_eje === cod);
    if (found) {
      cargarFormulario(found);
    }
  };

  const guardarCambios = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCod) return;

    setSaving(true);
    setMessage(null);

    const payload = {
      cod_eje: selectedCod,
      nombre_eje: nombreEje.trim(),
      Eje: nombreEje.trim(), // Soportar la columna "Eje" nativa requerida en tu base de datos
      responsable: responsable.trim(),
      poblacion_estimada: Number(poblacion),
      url_imagen_mapa: mapaUrl.trim(),
      descripcion_texto: descTexto.trim(),
      contacto_emergencia: contacto.trim(),
      descripcion: descTexto.trim() // Retrocompatibilidad para mantener la columna descripcion llena
    };

    try {
      if (supabase) {
        // Hacemos el upsert en la tabla TEjes
        const { error } = await supabase
          .from('TEjes')
          .upsert(payload, { onConflict: 'cod_eje' });

        if (error) throw error;
      }

      // Actualizar estado local inmediato
      setEjes(prev => prev.map(item => {
        if (item.cod_eje === selectedCod) {
          return {
            ...item,
            nombre_eje: nombreEje.trim(),
            responsable: responsable.trim(),
            poblacion_estimada: Number(poblacion),
            url_imagen_mapa: mapaUrl.trim(),
            descripcion_texto: descTexto.trim(),
            contacto_emergencia: contacto.trim()
          };
        }
        return item;
      }));

      setMessage({ type: 'success', text: `¡Ficha de eje "${nombreEje}" guardada correctamente en Supabase!` });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: `Error al guardar ficha en base de datos: ${err.message || 'Error desconocido'}` });
    } finally {
      setSaving(false);
    }
  };

  const activeEjeObject = ejes.find(e => e.cod_eje === selectedCod);

  return (
    <div className="space-y-6">
      
      {/* CABECERA ESTILO PREMIUM */}
      <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-[#0B3D5C]/10 text-[#0B3D5C] rounded-lg text-[9px] font-black uppercase tracking-wider">
              Módulo de Referencia Geográfica
            </span>
          </div>
          <h2 className="text-base font-black text-gray-800 uppercase tracking-tight mt-1 flex items-center gap-1.5">
            <Database size={16} className="text-[#0B3D5C]" /> Directorio de Fichas Sanitarias por Eje
          </h2>
          <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mt-0.5 leading-tight">
            Administración central de liderazgos, demografía y fichas técnicas descriptivas de los 5 distritos de salud
          </p>
        </div>

        <button
          onClick={fetchEjes}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#0B3D5C] hover:bg-slate-50 border border-gray-200 bg-white rounded-xl font-bold uppercase transition-all"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refrescar Datos
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100">
          <RefreshCw size={28} className="animate-spin text-[#0B3D5C]" />
          <p className="text-[10px] uppercase font-black tracking-widest text-[#0B3D5C] mt-3 animate-pulse">
            Sincronizando con Supabase public.TEjes...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* MENÚ LATERAL ACCIONES DE LOS 5 EJES */}
          <div className="lg:col-span-4 space-y-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider px-2">
              Seleccione Distrito de Salud
            </p>
            <div className="space-y-2">
              {ejes.map((eje) => {
                const isActive = eje.cod_eje === selectedCod;
                return (
                  <button
                    key={eje.cod_eje}
                    onClick={() => alternarEje(eje.cod_eje)}
                    className={`w-full text-left p-4 rounded-2xl transition-all border flex flex-col justify-between ${
                      isActive 
                        ? 'bg-[#0B3D5C] border-[#0B3D5C] text-white shadow-md shadow-[#0B3D5C]/10 translate-x-2' 
                        : 'bg-white border-gray-150 text-gray-700 hover:border-gray-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {eje.cod_eje.replace('_', ' ').toUpperCase()}
                      </span>
                      <MapPin size={13} className={isActive ? 'text-white' : 'text-gray-400'} />
                    </div>

                    <h4 className="text-xs font-black uppercase mt-1">
                      {eje.nombre_eje}
                    </h4>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-[8px] font-medium uppercase tracking-wider">
                      <div className={`p-1.5 rounded-lg border ${isActive ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                        <p className={isActive ? 'text-white/50' : 'text-gray-400'}>Población</p>
                        <p className="font-bold mt-0.5">{(eje.poblacion_estimada || 0).toLocaleString('es-VE')}</p>
                      </div>
                      <div className={`p-1.5 rounded-lg border ${isActive ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                        <p className={isActive ? 'text-white/50' : 'text-gray-400'}>Responsable</p>
                        <p className="font-bold mt-0.5 truncate">{eje.responsable?.split(' ').pop() || 'ND'}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* EDITOR PRINCIPALES DATOS DE FICHA */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {activeEjeObject && (
                <motion.form
                  key={activeEjeObject.cod_eje}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={guardarCambios}
                  className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 space-y-6 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-100 pb-5 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-gray-100">
                        COD_EJE: {activeEjeObject.cod_eje}
                      </span>
                      <h3 className="text-sm font-black text-gray-800 uppercase mt-2">
                        Ficha Técnica Oficial: {activeEjeObject.nombre_eje}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-[#0B3D5C] font-black uppercase bg-sky-50 border border-sky-100 px-3 py-1.5 rounded-xl">
                      <ShieldCheck size={13} /> Sincronizado Supabase
                    </div>
                  </div>

                  {/* MENSAJES DE NOTIFICACION */}
                  {message && (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`p-4 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-wider ${
                        message.type === 'success' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                          : 'bg-red-50 text-red-800 border border-red-100'
                      }`}
                    >
                      {message.type === 'success' ? <CheckCircle2 size={14} className="text-emerald-600" /> : <AlertCircle size={14} className="text-red-600" />}
                      <span className="flex-1">{message.text}</span>
                    </motion.div>
                  )}

                  {/* INPUTS DE FORMULARIO */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Nombre */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-[#0B3D5C] flex items-center gap-1">
                        <FileText size={11} /> Nombre Administrativo del Eje
                      </label>
                      <input 
                        type="text"
                        value={nombreEje}
                        onChange={(e) => setNombreEje(e.target.value)}
                        required
                        className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D5C]/15 focus:bg-white transition-all text-gray-800"
                        placeholder="Nombre descriptivo oficial"
                      />
                    </div>

                    {/* Autoridad */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-[#0B3D5C] flex items-center gap-1">
                        <Users size={11} /> Director(a) / Responsable de Salud
                      </label>
                      <input 
                        type="text"
                        value={responsable}
                        onChange={(e) => setResponsable(e.target.value)}
                        required
                        className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D5C]/15 focus:bg-white transition-all text-gray-800"
                        placeholder="Nombre completo y título"
                      />
                    </div>

                    {/* Población */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-[#0B3D5C] flex items-center gap-1">
                        <Users size={11} /> Población Electoral/Demográfica Cobertura
                      </label>
                      <input 
                        type="number"
                        value={poblacion}
                        onChange={(e) => setPoblacion(Number(e.target.value))}
                        required
                        min={0}
                        className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D5C]/15 focus:bg-white transition-all text-gray-800"
                        placeholder="Habitantes del eje"
                      />
                    </div>

                    {/* Contacto */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-[#0B3D5C] flex items-center gap-1">
                        <Phone size={11} /> Teléfono de Contacto Epidemiológico
                      </label>
                      <input 
                        type="text"
                        value={contacto}
                        onChange={(e) => setContacto(e.target.value)}
                        className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D5C]/15 focus:bg-white transition-all text-gray-800"
                        placeholder="+58-4XX-XXXXXXXX"
                      />
                    </div>

                    {/* URL Imagen de portadas/mapas */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[9px] font-black uppercase tracking-wider text-[#0B3D5C] flex items-center gap-1">
                        <MapIcon size={11} /> Dirección Web Imagen de Mapa del Eje (URL)
                      </label>
                      <input 
                        type="text"
                        value={mapaUrl}
                        onChange={(e) => setMapaUrl(e.target.value)}
                        className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D5C]/15 focus:bg-white transition-all text-gray-800 font-mono"
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>

                    {/* Area de descripción técnica */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[9px] font-black uppercase tracking-wider text-[#0B3D5C] flex items-center gap-1">
                        <FileText size={11} /> Información General y Diagnóstico Descriptivo
                      </label>
                      <textarea
                        value={descTexto}
                        onChange={(e) => setDescTexto(e.target.value)}
                        required
                        rows={5}
                        className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D5C]/15 focus:bg-white transition-all text-gray-800 leading-relaxed"
                        placeholder="Describa la infraestructura hospitalaria, CDI, ambulatorios, debilidades epidemiológicas y prioridades..."
                      />
                    </div>

                  </div>

                  {/* CONTENEDOR PRE-VISUALIZACION IMAGEN */}
                  {mapaUrl.trim() && (
                    <div className="border border-gray-150 rounded-2xl overflow-hidden p-2 bg-slate-50">
                      <p className="text-[8px] font-black uppercase tracking-wider text-gray-400 mb-1.5 px-1.5">
                        Vista Previa de la Ficha Gráfica de Eje
                      </p>
                      <img 
                        src={mapaUrl} 
                        alt="Eje Mapa" 
                        referrerPolicy="no-referrer"
                        className="w-full h-32 object-cover rounded-xl"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* FORM ACCIONES SUBMIT */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-3 bg-[#0B3D5C] hover:bg-[#072437] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm hover:shadow active:scale-98 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" /> Guardando...
                        </>
                      ) : (
                        <>
                          <Save size={13} /> Guardar Ficha y Sincronizar
                        </>
                      )}
                    </button>
                  </div>

                </motion.form>
              )}
            </AnimatePresence>
          </div>

        </div>
      )}

    </div>
  );
}
