import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { nominalService } from '../../services/nominalService';
import { 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle, 
  Send,
  Database,
  Search,
  HeartPulse,
  Activity,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// URL de la API en Google Apps Script
const GOOGLE_API_URL = "https://script.google.com/macros/s/AKfycbzEbs37sq8l16OxQqG7JGPfYcfjauzblhSASY9TMwqNdEd0ly7rZlkW7V8V7mExaL9d/exec";

// Catálogo nominal unificado de respaldo absoluto
const CATALOGO_RESPALDO = [
  { code: "CLÍNICA POPULAR PARACOTOS", label: "CLÍNICA POPULAR PARACOTOS" },
  { code: "CDI DOCTOR JOSÉ GREGORIO HERNÁNDEZ", label: "CDI DOCTOR JOSÉ GREGORIO HERNÁNDEZ" },
  { code: "AMBULATORIO PRADO DE MARÍA", label: "AMBULATORIO PRADO DE MARÍA" }
];

const splitFullname = (fullName: string) => {
  const clean = (fullName || '').trim();
  if (!clean) return { nombre: '', apellido: '' };
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return { nombre: parts[0], apellido: '' };
  if (parts.length === 2) return { nombre: parts[0], apellido: parts[1] };
  if (parts.length === 3) return { nombre: parts[0], apellido: `${parts[1]} ${parts[2]}` };
  const medio = Math.ceil(parts.length / 2);
  return {
    nombre: parts.slice(0, medio).join(' '),
    apellido: parts.slice(medio).join(' ')
  };
};

interface NominalFormWindowProps {
  type?: 'QUIRURGICA' | 'OBSTETRICA' | 'DEFUNCION';
  userEmail?: string;
  onClose?: () => void;
}

export default function NominalFormWindow({ type: propType, userEmail: propUserEmail, onClose: propOnClose }: NominalFormWindowProps = {}) {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const urlType = params.get('type') || '';
  const type = (propType || (urlType === 'OBSTETRICIA' || urlType === 'OBSTETRICA' ? 'OBSTETRICA' : urlType === 'DEFUNCION' ? 'DEFUNCION' : 'QUIRURGICA')) as 'QUIRURGICA' | 'OBSTETRICA' | 'DEFUNCION';
  const userEmail = propUserEmail || params.get('email') || 'nominal@mirandasalud.com';

  const onClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      try {
        window.close();
      } catch (e) {
        window.history.back();
      }
    }
  };
  // 1. ESTADO DE CONTROL DE CARGA DE CENTROS
  const [loadedCenters, setLoadedCenters] = useState<{ code: string; label: string }[]>([]);
  const [loadingCenters, setLoadingCenters] = useState<boolean>(false);

  // Estados Operacionales de Sincronización
  const [isSearchingCedula, setIsSearchingCedula] = useState(false);
  const [isSearchingMedico, setIsSearchingMedico] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Form Data Maestro Unificado
  const [formData, setFormData] = useState({
    id_reporte: '',
    fecha_reporte: new Date().toISOString().split('T')[0],
    estado_fiscal: 'Miranda',
    centro_salud: '',
    
    // Datos del Paciente / Evento
    cedula_paciente: '',
    nombre_paciente: '',
    apellido_paciente: '',
    edad: '',
    sexo: 'Masculino',
    telefono_movil: '',
    
    // Variables dinámicas según el tipo de formulario
    intervencion: '',
    prioridad: 'Electiva',
    cantidad: '1',
    cedula_medico: '',
    nombre_medico: '',
    apellido_medico: '',
    especialidad: '',
    
    embarazo_controlado: 'SI',
    semanas_gestacion: '',
    tipo_parto: 'Vaginal',
    condicion_nacimiento: 'Vivo',
    complicaciones: 'Ninguna',
    
    causa_defuncion: '',
    lugar_defuncion: 'Hospitalario',
    certificado_defuncion: ''
  });

  // Función formateadora y saneadora en caliente interna
  const obtenerNombreEstablecimientoLegible = (nombreSucio: string, codigoAsic?: string): string => {
    const norm = (nombreSucio || '').toUpperCase().trim();
    const asicNorm = (codigoAsic || '').toUpperCase().trim();

    if (!norm || norm.startsWith('ASIC') || norm.includes('ES-90')) {
      if (norm.includes('9006') || norm.includes('9001') || asicNorm.includes('9006') || asicNorm.includes('9001')) {
        return "CLÍNICA POPULAR PARACOTOS";
      }
      return `CDI / AMBULATORIO (${asicNorm || norm || 'S/A'})`;
    }
    return norm;
  };

  // Generador Automático de ID Correlativo
  useEffect(() => {
    const prefix = type === 'QUIRURGICA' ? 'QUIR' : type === 'OBSTETRICA' ? 'OBST' : 'DEFU';
    const rand = Math.random().toString(16).substring(2, 6).toUpperCase();
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    setFormData(prev => ({ ...prev, id_reporte: `${prefix}-${dateStr}-${rand}` }));
  }, [type]);

  // Efecto de carga limpia de establecimientos nominales desde Supabase
  useEffect(() => {
    const fetchCenters = async () => {
      setLoadingCenters(true);
      try {
        const { data, error } = await supabase
          .from('TClinicas_populares')
          .select('nombre_establecimiento, asic')
          .order('nombre_establecimiento', { ascending: true });

        if (!error && data && data.length > 0) {
          const formatted = data.map((item: any) => {
            const rawName = item.nombre_establecimiento || '';
            const cleanLabel = obtenerNombreEstablecimientoLegible(rawName, item.asic);
            return {
              code: cleanLabel,
              label: cleanLabel
            };
          });

          setLoadedCenters(formatted);
          
          if (formatted.length > 0 && !formData.centro_salud) {
            setFormData(prev => ({ ...prev, centro_salud: formatted[0].code }));
          }
        } else {
          console.warn("Estructura vacía o error de permisos, aplicando respaldo local.");
          setLoadedCenters(CATALOGO_RESPALDO);
          if (!formData.centro_salud) {
            setFormData(prev => ({ ...prev, centro_salud: CATALOGO_RESPALDO[0].code }));
          }
        }
      } catch (e) {
        console.warn("Fallo de red crítico, aplicando contingencia nominal:", e);
        setLoadedCenters(CATALOGO_RESPALDO);
        if (!formData.centro_salud) {
          setFormData(prev => ({ ...prev, centro_salud: CATALOGO_RESPALDO[0].code }));
        }
      } finally {
        setLoadingCenters(false);
      }
    };

    fetchCenters();
  }, []);

  // Búsqueda inteligente de paciente por Cédula (Vía Supabase y Google Apps Script)
  const handleBuscarCedula = async () => {
    if (!formData.cedula_paciente) return;
    setIsSearchingCedula(true);
    try {
      // 1. Intentar buscar en Supabase primero
      const p = await nominalService.buscarPaciente(formData.cedula_paciente);
      if (p) {
        setFormData(prev => ({
          ...prev,
          nombre_paciente: p.nombre,
          apellido_paciente: p.apellido,
          edad: p.edad ? p.edad.toString() : prev.edad,
          sexo: p.sexo ? (p.sexo.toUpperCase() === 'MASCULINO' ? 'Masculino' : 'Femenino') : prev.sexo,
          telefono_movil: p.telefono || prev.telefono_movil
        }));
        setIsSearchingCedula(false);
        return;
      }

      // 2. Si no, buscar en Apps Script
      const resp = await fetch(`${GOOGLE_API_URL}?action=searchCedula&cedula=${formData.cedula_paciente}`);
      const resData = await resp.json();
      if (resData.success && resData.data) {
        const pSheet = resData.data;
        const mapped = splitFullname(pSheet.nombre_completo || pSheet.nombre);
        setFormData(prev => ({
          ...prev,
          nombre_paciente: mapped.nombre,
          apellido_paciente: mapped.apellido,
          edad: pSheet.edad ? pSheet.edad.toString() : prev.edad,
          sexo: pSheet.sexo ? (pSheet.sexo.toUpperCase() === 'MASCULINO' ? 'Masculino' : 'Femenino') : prev.sexo,
          telefono_movil: pSheet.telefono || prev.telefono_movil
        }));
      }
    } catch (e) {
      console.error("Error en motor de búsqueda de cédulas:", e);
    } finally {
      setIsSearchingCedula(false);
    }
  };

  // Búsqueda inteligente de médico por Cédula (Vía Supabase)
  const handleBuscarMedicoCedula = async () => {
    if (!formData.cedula_medico) return;
    setIsSearchingMedico(true);
    try {
      const m = await nominalService.buscarMedico(formData.cedula_medico);
      if (m) {
        setFormData(prev => ({
          ...prev,
          nombre_medico: m.nombre,
          apellido_medico: m.apellido
        }));
      }
    } catch (e) {
      console.error("Error en motor de búsqueda de médicos:", e);
    } finally {
      setIsSearchingMedico(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    setSyncError(null);
    setSyncSuccess(false);

    try {
      // 1. Guardar o actualizar Paciente en Supabase/Local
      if (formData.cedula_paciente) {
        await nominalService.asegurarPaciente({
          cedula: formData.cedula_paciente,
          nombre: formData.nombre_paciente,
          apellido: formData.apellido_paciente,
          edad: parseInt(formData.edad) || 0,
          sexo: (formData.sexo || 'FEMENINO').toUpperCase(),
          telefono: formData.telefono_movil || ''
        });
      }

      // 2. Guardar o actualizar Médico en Supabase/Local si hay datos
      if (formData.cedula_medico) {
        await nominalService.asegurarMedico({
          cedula: formData.cedula_medico,
          nombre: formData.nombre_medico,
          apellido: formData.apellido_medico,
          telefono: ''
        });
      }

      // 3. Insertar / Transmitir en Sheets (Google Apps Script)
      const payload = {
        action: "insertNominal",
        tipo_formulario: type,
        operador_email: userEmail,
        ...formData
      };

      const response = await fetch(GOOGLE_API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setSyncSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error: any) {
      setSyncError(error.message || "Error de comunicación en pasarela de red.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex flex-col justify-end sm:justify-center p-0 sm:p-4 overflow-hidden"
    >
      <main className="w-full max-w-4xl mx-auto bg-neutral-50 sm:rounded-2xl shadow-2xl flex flex-col max-h-[100vh] sm:max-h-[90vh] overflow-hidden border border-neutral-200">
        
        {/* Cabecera Técnica */}
        <header className="bg-white px-6 py-4 border-b border-neutral-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center text-white shadow-sm">
              <Database size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black uppercase tracking-wider text-neutral-800">Consola Fiel de Transcripción</h1>
                <span className="text-[9px] px-2 py-0.5 font-black uppercase rounded-md bg-emerald-100 text-emerald-800 tracking-wider">
                  {type}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest mt-0.5">Entorno de Carga Reactivo y Optimizado</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900 font-black text-[10px] uppercase tracking-wider border border-neutral-200 hover:border-neutral-300 rounded-xl px-4 py-2 bg-white transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft size={12} /> Cerrar
          </button>
        </header>

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4 shadow-sm">
            
            {/* Fila Metadatos */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">ID Reporte</label>
                <input
                  type="text"
                  name="id_reporte"
                  value={formData.id_reporte}
                  disabled
                  className="w-full bg-neutral-100 border border-neutral-200 text-xs text-neutral-700 font-extrabold rounded-xl px-3.5 py-2 uppercase"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Fecha Reporte</label>
                <input
                  type="date"
                  name="fecha_reporte"
                  value={formData.fecha_reporte}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 font-extrabold rounded-xl px-3.5 py-2 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Estado Fiscal</label>
                <input
                  type="text"
                  name="estado_fiscal"
                  value={formData.estado_fiscal}
                  disabled
                  className="w-full bg-neutral-100 border border-neutral-200 text-xs text-neutral-400 font-extrabold rounded-xl px-3.5 py-2 uppercase"
                />
              </div>
              
              {/* SELECTOR CRÍTICO DE CENTROS REPARADO */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">
                  Centro de Salud (Establecimiento Nominal)
                </label>
                <select
                  name="centro_salud"
                  value={formData.centro_salud || ''}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 font-extrabold rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase"
                  required
                >
                  <option value="" className="text-slate-900 bg-white">SELECCIONE UN CENTRO DE SALUD</option>
                  {loadingCenters ? (
                    <option className="text-slate-900 bg-white font-bold" disabled>CARGANDO CATÁLOGO...</option>
                  ) : (
                    loadedCenters.map(center => (
                      <option 
                        key={center.code} 
                        value={center.code} 
                        className="text-slate-900 bg-white font-bold"
                      >
                        {center.label}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <hr className="border-neutral-100" />

            {/* Fila Identificación del Paciente */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5 flex items-center gap-1">
                  <UserCheck size={11} /> Cédula Paciente
                </label>
                <div className="relative flex">
                  <input
                    type="text"
                    name="cedula_paciente"
                    placeholder="Ej. 12345678"
                    value={formData.cedula_paciente}
                    onChange={handleInputChange}
                    onBlur={handleBuscarCedula}
                    required
                    className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 font-extrabold rounded-xl pl-3.5 pr-10 py-2 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleBuscarCedula}
                    disabled={isSearchingCedula || !formData.cedula_paciente}
                    className="absolute right-1 top-1 bottom-1 px-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer"
                  >
                    {isSearchingCedula ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    ) : (
                      <Search size={12} />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Nombre Paciente</label>
                <input
                  type="text"
                  name="nombre_paciente"
                  value={formData.nombre_paciente}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 font-extrabold rounded-xl px-3.5 py-2 focus:outline-none uppercase"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Apellido Paciente</label>
                <input
                  type="text"
                  name="apellido_paciente"
                  value={formData.apellido_paciente}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 font-extrabold rounded-xl px-3.5 py-2 focus:outline-none uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Edad</label>
                  <input
                    type="number"
                    name="edad"
                    placeholder="Años"
                    value={formData.edad}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 font-extrabold rounded-xl px-3.5 py-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Sexo</label>
                  <select
                    name="sexo"
                    value={formData.sexo}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 font-extrabold rounded-xl px-3.5 py-2 focus:outline-none"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Teléfono Móvil</label>
                <input
                  type="text"
                  name="telefono_movil"
                  placeholder="Ej. 04121234567"
                  value={formData.telefono_movil}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 font-extrabold rounded-xl px-3.5 py-2 focus:outline-none"
                />
              </div>
            </div>

          </div>

          {/* Bloques Condicionales según Especialidad */}
          {type === 'QUIRURGICA' && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <Activity size={14} className="text-neutral-500" />
                <h2 className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Especificaciones del Acto Quirúrgico</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Intervención / Procedimiento</label>
                  <input
                    type="text"
                    name="intervencion"
                    placeholder="Ej. Hernioplastia Inguinal"
                    value={formData.intervencion}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 font-extrabold rounded-xl px-3.5 py-2 focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Prioridad</label>
                  <select
                    name="prioridad"
                    value={formData.prioridad}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 font-extrabold rounded-xl px-3.5 py-2 focus:outline-none"
                  >
                    <option value="Electiva">Electiva</option>
                    <option value="Urgencia">Urgencia</option>
                    <option value="Emergencia">Emergencia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Cantidad</label>
                  <input
                    type="number"
                    name="cantidad"
                    value={formData.cantidad}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 font-extrabold rounded-xl px-3.5 py-2 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Cédula Médico</label>
                  <div className="relative flex">
                    <input
                      type="text"
                      name="cedula_medico"
                      value={formData.cedula_medico}
                      onChange={handleInputChange}
                      onBlur={handleBuscarMedicoCedula}
                      className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 font-extrabold rounded-xl pl-3.5 pr-10 py-2 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleBuscarMedicoCedula}
                      disabled={isSearchingMedico || !formData.cedula_medico}
                      className="absolute right-1 top-1 bottom-1 px-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer"
                    >
                      {isSearchingMedico ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      ) : (
                        <Search size={12} />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Nombre Médico</label>
                  <input
                    type="text"
                    name="nombre_medico"
                    value={formData.nombre_medico}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 font-extrabold rounded-xl px-3.5 py-2 focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Apellido Médico</label>
                  <input
                    type="text"
                    name="apellido_medico"
                    value={formData.apellido_medico}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 font-extrabold rounded-xl px-3.5 py-2 focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Especialidad</label>
                  <input
                    type="text"
                    name="especialidad"
                    placeholder="Ej. Traumatología"
                    value={formData.especialidad}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 font-extrabold rounded-xl px-3.5 py-2 focus:outline-none uppercase"
                  />
                </div>
              </div>
            </div>
          )}

          {type === 'OBSTETRICA' && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <HeartPulse size={14} className="text-neutral-500" />
                <h2 className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Ficha de Caracterización Obstétrica</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Embarazo Controlado</label>
                  <select
                    name="embarazo_controlado"
                    value={formData.embarazo_controlado}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 font-extrabold rounded-xl px-3.5 py-2 focus:outline-none"
                  >
                    <option value="SI">SI</option>
                    <option value="NO">NO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Semanas de Gestación</label>
                  <input
                    type="number"
                    name="semanas_gestacion"
                    placeholder="Ej. 39"
                    value={formData.semanas_gestacion}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 font-extrabold rounded-xl px-3.5 py-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Tipo de Parto</label>
                  <select
                    name="tipo_parto"
                    value={formData.tipo_parto}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 font-extrabold rounded-xl px-3.5 py-2 focus:outline-none"
                  >
                    <option value="Vaginal">Vaginal</option>
                    <option value="Cesárea">Cesárea</option>
                    <option value="Instrumentado">Instrumentado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Condición de Nacimiento</label>
                  <select
                    name="condicion_nacimiento"
                    value={formData.condicion_nacimiento}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 font-extrabold rounded-xl px-3.5 py-2 focus:outline-none"
                  >
                    <option value="Vivo">Vivo</option>
                    <option value="Mortinato">Mortinato (Fetal)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Complicaciones Presentadas</label>
                <input
                  type="text"
                  name="complicaciones"
                  placeholder="Ej. Preeclampsia leve / Ninguna"
                  value={formData.complicaciones}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 font-extrabold rounded-xl px-3.5 py-2 focus:outline-none uppercase"
                />
              </div>
            </div>
          )}

          {type === 'DEFUNCION' && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <AlertCircle size={14} className="text-neutral-500" />
                <h2 className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Declaración Jurada de Defunción</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Causa de la Defunción (Diagnóstico)</label>
                  <input
                    type="text"
                    name="causa_defuncion"
                    placeholder="Ej. Infarto agudo al miocardio"
                    value={formData.causa_defuncion}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 font-extrabold rounded-xl px-3.5 py-2 focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Lugar del Deceso</label>
                  <select
                    name="lugar_defuncion"
                    value={formData.lugar_defuncion}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 font-extrabold rounded-xl px-3.5 py-2 focus:outline-none"
                  >
                    <option value="Hospitalario">Hospitalario / Clínica</option>
                    <option value="Domiciliario">Domiciliario (Hogar)</option>
                    <option value="Vía Pública">Vía Pública</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Nº Certificado de Defunción (EV-14)</label>
                  <input
                    type="text"
                    name="certificado_defuncion"
                    placeholder="Ej. A-1234567"
                    value={formData.certificado_defuncion}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 font-extrabold rounded-xl px-3.5 py-2 focus:outline-none uppercase"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bloque Informativo / Avisos */}
          <div className="p-4 rounded-xl bg-neutral-100 border border-neutral-200 flex gap-3 text-[11px] text-neutral-600 font-medium">
            <AlertCircle size={16} className="text-neutral-500 shrink-0 mt-0.5" />
            <p>
              Al confirmar esta transacción, la información nominal será transmitida en tiempo real mediante cifrado SSL hacia el repositorio central federado del Ministerio y replicada en la Sala de Mando del Semáforo ASIC.
            </p>
          </div>

          {/* Consola de Estado y Sincronización */}
          <div className="space-y-3">
            <AnimatePresence mode="wait">
              {syncError && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-xs text-red-800 font-bold uppercase tracking-wide"
                >
                  <AlertCircle size={16} /> Error: {syncError}
                </motion.div>
              )}
              {syncSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-800 font-bold uppercase tracking-wide"
                >
                  <CheckCircle size={16} /> ¡Transmisión Completada! Sincronizado correctamente.
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botón de Envío */}
            <div className="flex justify-end pt-2 border-t border-neutral-100">
              <button
                type="submit"
                disabled={isSyncing}
                className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider px-8 py-3.5 rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSyncing ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                    Sincronizando Red...
                  </>
                ) : (
                  <>
                    <Send size={14} /> Confirmar y Cargar Reporte
                  </>
                )}
              </button>
            </div>

          </div>
        </form>
      </main>

      {/* Pie limpio */}
      <footer className="py-6 bg-white text-center text-[9px] text-neutral-400 font-bold uppercase tracking-widest border-t border-neutral-200 shrink-0">
        GOBIERNO DE MIRANDA • DIRECCIÓN ESTADAL DE SALUD • SIM Miranda {new Date().getFullYear()}
      </footer>
    </motion.div>
  );
}