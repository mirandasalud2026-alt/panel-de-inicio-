'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Baby, 
  Skull, 
  Search, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  Building,
  User,
  ShieldAlert,
  Phone
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Inicializar cliente Supabase del lado del cliente
const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, anonKey);
};

interface HealthCenter {
  Cod_TES: string;
  Nombre_TES: string;
}

interface NominalProps {
  onRecordSaved?: (tipo: 'quirurgica' | 'obstetrica' | 'defuncion') => void;
  activeTab?: 'quirurgica' | 'obstetrica' | 'defuncion';
  onTabChange?: (tab: 'quirurgica' | 'obstetrica' | 'defuncion') => void;
}

export default function NominalForms({ onRecordSaved, activeTab: externalTab, onTabChange }: NominalProps = {}) {
  const [internalTab, setInternalTab] = useState<'quirurgica' | 'obstetrica' | 'defuncion'>('quirurgica');
  const activeTab = externalTab !== undefined ? externalTab : internalTab;
  const setActiveTab = (tab: 'quirurgica' | 'obstetrica' | 'defuncion') => {
    if (onTabChange) onTabChange(tab);
    setInternalTab(tab);
  };

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Estados para indicadores de búsqueda rápida por Cédula
  const [pacienteStatus, setPacienteStatus] = useState<string>('');
  const [medicoStatus, setMedicoStatus] = useState<string>('');

  // Estructura de estado unificada para todos los formularios
  const [formData, setFormData] = useState({
    // Cabecera General
    fecha: new Date().toISOString().split('T')[0],
    estado: 'MIRANDA',
    centro_salud: '',

    // Paciente / Madre / Fallecido
    cedula_principal: '',
    nombre_principal: '',
    apellido_principal: '',
    edad_principal: '',
    sexo_principal: 'FEMENINO',
    telefono_principal: '',

    // Quirúrgico Específico
    especialidad_quirurgica: '',
    tipo_intervencion_q: '',
    urgente_electiva: 'ELECTIVA',
    cantidad_intervencion_q: '1',

    // Obstétrico Específico
    nombre_infante: '',
    sexo_infante: 'FEMENINO',
    tipo_parto: 'EUTÓCICO',
    tipo_intervencion_o: 'NATURAL',

    // Defunción Específico
    hora_fallecimiento: '',
    patologia_fallecimiento: '',
    observacion_defuncion: '',

    // Médico Tratante
    cedula_medico: '',
    nombre_medico: '',
    apellido_medico: '',
    telefono_medico: '',
    especialidad_medico: 'MEDICINA GENERAL'
  });

  // Limpiar estados locales al cambiar de pestaña
  useEffect(() => {
    setStatusMsg(null);
    setPacienteStatus('');
    setMedicoStatus('');
  }, [activeTab]);

  const [healthCenters, setHealthCenters] = useState<HealthCenter[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(false);

  // Cargar centros de salud desde Supabase
  useEffect(() => {
    const fetchHealthCenters = async () => {
      setLoadingCenters(true);
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('TTipoES')
          .select('Cod_TES, Nombre_TES')
          .order('Nombre_TES', { ascending: true });

        if (error) {
          console.error('Error cargando centros de salud (TTipoES) de Supabase:', error);
        } else if (data) {
          setHealthCenters(data);
          // Pre-seleccionar el primer elemento cargado si aún no hay pre-selección
          if (data.length > 0) {
            setFormData(prev => {
              if (!prev.centro_salud) {
                return { ...prev, centro_salud: data[0].Cod_TES };
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.error('Error de conexión cargando centros de salud:', err);
      } finally {
        setLoadingCenters(false);
      }
    };
    fetchHealthCenters();
  }, []);

  // Manejador común de Inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // BUSCADOR EN SUPABASE: PACIENTE / MADRE / FALLECIDOS (tabla: pacientes)
  const buscarPaciente = async (cedula: string) => {
    const cleanCedula = cedula.toUpperCase().trim();
    if (!cleanCedula) return;

    setPacienteStatus('Buscando...');
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('Cedula', cleanCedula)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setPacienteStatus('Nuevo: Se creará ficha al guardar');
        } else {
          setPacienteStatus('Error buscando en Supabase');
          console.error(error);
        }
        return;
      }

      if (data) {
        setPacienteStatus('✓ Encontrado en base de datos');
        
        // Separar "Nombre y Apellido" para asignarlos en formulario (o colocar el nombre completo)
        const nombreCompleto = data['Nombre y Apellido'] || '';
        const parts = nombreCompleto.split(' ');
        const nombre = parts[0] || '';
        const apellido = parts.slice(1).join(' ') || '';

        setFormData(prev => ({
          ...prev,
          nombre_principal: nombre,
          apellido_principal: apellido,
          sexo_principal: data.Sexo || prev.sexo_principal,
          edad_principal: data.Edad || '',
          telefono_principal: data.Movil01 || ''
        }));
      }
    } catch (err) {
      setPacienteStatus('Error en conexión');
      console.error(err);
    }
  };

  // BUSCADOR EN SUPABASE: MÉDICOS TRATANTES (tabla: DATOS_DEL_MEDICO_TRATANTE)
  const buscarMedico = async (cedula: string) => {
    const cleanCedula = cedula.toUpperCase().trim();
    if (!cleanCedula) return;

    setMedicoStatus('Buscando...');
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('DATOS_DEL_MEDICO_TRATANTE')
        .select('*')
        .eq('Cedula', cleanCedula)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setMedicoStatus('Nuevo: Colegial nuevo para guardar');
        } else {
          setMedicoStatus('Error local de consulta');
          console.error(error);
        }
        return;
      }

      if (data) {
        setMedicoStatus('✓ Médico Colegiado Registrado');
        const nombreCompleto = data['Nombre y Apellido'] || '';
        const parts = nombreCompleto.split(' ');
        const nombre = parts[0] || '';
        const apellido = parts.slice(1).join(' ') || '';

        setFormData(prev => ({
          ...prev,
          nombre_medico: nombre,
          apellido_medico: apellido,
          telefono_medico: data.Movil01 || '',
          especialidad_medico: data.Especialidad || 'MEDICINA GENERAL'
        }));
      }
    } catch (err) {
      setMedicoStatus('Error consultando médico');
      console.error(err);
    }
  };

  // ENVÍO DE FORMULARIO - TRANSACCIONALIDAD DE GUARDADO
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    try {
      const supabase = getSupabaseClient();
      
      const pacCedula = formData.cedula_principal.toUpperCase().trim();
      const pacNombreCompleto = `${formData.nombre_principal} ${formData.apellido_principal}`.toUpperCase().trim();
      
      const medCedula = formData.cedula_medico.toUpperCase().trim();
      const medNombreCompleto = `${formData.nombre_medico} ${formData.apellido_medico}`.toUpperCase().trim();

      // 1. UPSERT el paciente/madre/fallecido en la tabla `pacientes`
      const { error: pacErr } = await supabase
        .from('pacientes')
        .upsert({
          Cedula: pacCedula,
          "Nombre y Apellido": pacNombreCompleto,
          Sexo: formData.sexo_principal,
          Edad: String(formData.edad_principal),
          Movil01: formData.telefono_principal || null,
          Nacionalidad: 'V'
        }, { onConflict: 'Cedula' });

      if (pacErr) throw new Error(`Fallo guardando datos del Paciente: ${pacErr.message}`);

      // 2. UPSERT el médico tratante en table `DATOS_DEL_MEDICO_TRATANTE` (si se proporcionó cédula)
      if (medCedula) {
        const { error: medErr } = await supabase
          .from('DATOS_DEL_MEDICO_TRATANTE')
          .upsert({
            Cedula: medCedula,
            "Nombre y Apellido": medNombreCompleto,
            Movil01: formData.telefono_medico || null,
            Especialidad: formData.especialidad_medico || 'MEDICINA GENERAL',
            Nacionalidad: 'V',
            Sexo: 'MASCULINO' // Por defecto
          }, { onConflict: 'Cedula' });

        if (medErr) throw new Error(`Fallo guardando credenciales del Médico: ${medErr.message}`);
      }

      // 3. Crear el registro específico de la planilla correspondiente
      let specificPayload: any = {};
      let targetTable = '';

      if (activeTab === 'quirurgica') {
        targetTable = 'registros_quirurgicos';
        specificPayload = {
          fecha: formData.fecha,
          estado: formData.estado,
          centro_salud: formData.centro_salud.toUpperCase().trim(),
          cedula_paciente: pacCedula,
          nombre_paciente: formData.nombre_principal.toUpperCase().trim(),
          apellido_paciente: formData.apellido_principal.toUpperCase().trim(),
          edad_paciente: parseInt(formData.edad_principal) || 0,
          sexo_paciente: formData.sexo_principal,
          telefono_paciente: formData.telefono_principal || null,
          especialidad_quirurgica: formData.especialidad_quirurgica.toUpperCase().trim(),
          tipo_intervencion: formData.tipo_intervencion_q.toUpperCase().trim(),
          urgente_electiva: formData.urgente_electiva,
          cantidad_intervencion: parseInt(formData.cantidad_intervencion_q) || 1,
          cedula_medico: medCedula || null,
          nombre_medico: formData.nombre_medico.toUpperCase().trim(),
          apellido_medico: formData.apellido_medico.toUpperCase().trim(),
          telefono_medico: formData.telefono_medico || null
        };
      } 
      else if (activeTab === 'obstetrica') {
        targetTable = 'registros_obstetricos';
        specificPayload = {
          fecha: formData.fecha,
          estado: formData.estado,
          centro_salud: formData.centro_salud.toUpperCase().trim(),
          cedula_madre: pacCedula,
          nombre_madre: formData.nombre_principal.toUpperCase().trim(),
          apellido_madre: formData.apellido_principal.toUpperCase().trim(),
          edad_madre: parseInt(formData.edad_principal) || 0,
          telefono_madre: formData.telefono_principal || null,
          nombre_infante: formData.nombre_infante.toUpperCase().trim(),
          sexo_infante: formData.sexo_infante,
          tipo_parto: formData.tipo_parto,
          tipo_intervencion: formData.tipo_intervencion_o,
          cedula_medico: medCedula || null,
          nombre_medico: formData.nombre_medico.toUpperCase().trim(),
          apellido_medico: formData.apellido_medico.toUpperCase().trim(),
          telefono_medico: formData.telefono_medico || null
        };
      } 
      else if (activeTab === 'defuncion') {
        targetTable = 'registros_defunciones';
        specificPayload = {
          fecha: formData.fecha,
          estado: formData.estado,
          centro_salud: formData.centro_salud.toUpperCase().trim(),
          cedula_fallecido: pacCedula || null,
          nombre_fallecido: formData.nombre_principal.toUpperCase().trim(),
          apellido_fallecido: formData.apellido_principal.toUpperCase().trim(),
          edad_fallecido: parseInt(formData.edad_principal) || 0,
          sexo_fallecido: formData.sexo_principal,
          hora_fallecimiento: formData.hora_fallecimiento,
          patologia: formData.patologia_fallecimiento.toUpperCase().trim(),
          observacion: formData.observacion_defuncion || null,
          cedula_medico: medCedula || null,
          nombre_medico: formData.nombre_medico.toUpperCase().trim(),
          apellido_medico: formData.apellido_medico.toUpperCase().trim(),
          telefono_medico: formData.telefono_medico || null
        };
      }

      // Grabar registro específico (Supabase) returning row representation
      const { data: specData, error: specErr } = await supabase
        .from(targetTable)
        .insert(specificPayload)
        .select('id')
        .single();

      if (specErr) throw new Error(`Fallo de guardado en la planilla ${activeTab}: ${specErr.message}`);

      // 4. Registrar en bitácora de respaldo temporal ("nominales")
      const { error: nomErr } = await supabase
        .from('nominales')
        .insert({
          tipo_registro: activeTab,
          registro_id: specData?.id || null,
          cedula_principal: pacCedula,
          centro_salud: formData.centro_salud.toUpperCase(),
          datos: specificPayload // Almacenar el dump completo de la transacción
        });

      if (nomErr) {
        console.warn('Registro específico guardado, pero no se pudo generar bitácora nominales:', nomErr);
      }

      // Éxito
      setStatusMsg({
        type: 'success',
        text: `¡REGISTRO DE NÓMINA ${activeTab.toUpperCase()} GUARDADO CORRECTAMENTE (ID REGISTRO: ${specData?.id || 'OK'})!`
      });

      if (onRecordSaved) {
        onRecordSaved(activeTab);
      }

      // Limpieza selectiva
      setFormData(prev => ({
        ...prev,
        cedula_principal: '',
        nombre_principal: '',
        apellido_principal: '',
        edad_principal: '',
        telefono_principal: '',
        especialidad_quirurgica: '',
        tipo_intervencion_q: '',
        nombre_infante: '',
        hora_fallecimiento: '',
        patologia_fallecimiento: '',
        observacion_defuncion: ''
      }));
      setPacienteStatus('');

    } catch (err: any) {
      console.error(err);
      setStatusMsg({
        type: 'error',
        text: err.message || 'Ocurrió un error inesperado al interactuar con Supabase.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* BOTONERA NAVEGACIÓN ENTRE PLANILLAS */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('quirurgica')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'quirurgica'
              ? 'bg-[#0B3D5C] text-white shadow-md'
              : 'bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity size={16} />
          Quirúrgica
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('obstetrica')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'obstetrica'
              ? 'bg-[#0B3D5C] text-white shadow-md'
              : 'bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Baby size={16} />
          Obstétrica
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('defuncion')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'defuncion'
              ? 'bg-[#0B3D5C] text-white shadow-md'
              : 'bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Skull size={16} />
          Defunción
        </button>
      </div>

      {/* RECUADRO BANNER DE ESTATUS */}
      {statusMsg && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs font-bold leading-relaxed uppercase tracking-wider ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
            : 'bg-rose-50 text-rose-800 border-rose-100'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" /> : <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* INICIO DE FORMULARIO MAESTRO */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-sm rounded-3xl z-40 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#0B3D5C] animate-spin" />
            <span className="text-[10px] font-black uppercase text-[#0B3D5C] tracking-widest">Sincronizando con Supabase...</span>
          </div>
        )}

        {/* PARTE A: DATOS GEOCLÍNICOS (CABECERA OBLIGATORIA) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div>
            <label className="text-[9px] font-black text-[#0B3D5C] uppercase tracking-widest block mb-1.5">
              <Calendar className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> Fecha Reporte *
            </label>
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              required
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-[#0B3D5C] uppercase tracking-widest block mb-1.5">
              <MapPin className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> Estado Territorial (Fijo)
            </label>
            <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-500 h-[38px] flex items-center select-none">
              MIRANDA
            </div>
            <input type="hidden" name="estado" value="MIRANDA" />
          </div>

          <div>
            <label className="text-[9px] font-black text-[#0B3D5C] uppercase tracking-widest block mb-1.5 flex items-center justify-between">
              <span>
                <Building className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> Establecimiento de Salud *
              </span>
              {loadingCenters && <span className="text-[7.5px] font-black text-amber-500 uppercase tracking-widest animate-pulse">Cargando...</span>}
            </label>
            <select
              name="centro_salud"
              value={formData.centro_salud}
              onChange={handleChange}
              required
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase focus:outline-none focus:border-[#0B3D5C]"
            >
              {healthCenters.length === 0 ? (
                <option value="">{loadingCenters ? "Cargando establecimientos..." : "No hay establecimientos"}</option>
              ) : (
                healthCenters.map(center => (
                  <option key={center.Cod_TES} value={center.Cod_TES}>
                    {center.Nombre_TES}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* PARTE B: BLOQUE DINÁMICO SEGÚN ROL DE FORMULARIO */}
        
        {/* ================= FORMULARIO QUIRÚRGICO ================= */}
        {activeTab === 'quirurgica' && (
          <div className="space-y-6">
            {/* Paciente */}
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-150 space-y-4">
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <span className="px-2 py-0.5 rounded text-[8.5px] font-black bg-emerald-600 text-white">PACIENTE</span>
                <h3 className="text-[10px] font-black text-[#0B3D5C] uppercase tracking-wider">Identificación del Suceso</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Cédula Identidad *</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="cedula_principal"
                      value={formData.cedula_principal}
                      onChange={handleChange}
                      onBlur={() => buscarPaciente(formData.cedula_principal)}
                      required
                      placeholder="V-12345678"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-xs font-bold uppercase focus:outline-none focus:border-[#0B3D5C]"
                    />
                    <button
                      type="button"
                      onClick={() => buscarPaciente(formData.cedula_principal)}
                      className="absolute right-2 top-2 text-[#0B3D5C]"
                    >
                      <Search size={14} />
                    </button>
                  </div>
                  {pacienteStatus && (
                    <span className={`text-[8px] font-black uppercase mt-1 block ${
                      pacienteStatus.includes('✓') ? 'text-emerald-600' : 'text-amber-500'
                    }`}>{pacienteStatus}</span>
                  )}
                </div>

                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Nombre(s) *</label>
                  <input
                    type="text"
                    name="nombre_principal"
                    value={formData.nombre_principal}
                    onChange={handleChange}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase focus:outline-none focus:border-[#0B3D5C]"
                  />
                </div>

                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Apellido(s) *</label>
                  <input
                    type="text"
                    name="apellido_principal"
                    value={formData.apellido_principal}
                    onChange={handleChange}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase focus:outline-none focus:border-[#0B3D5C]"
                  />
                </div>

                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Teléfono Móvil</label>
                  <input
                    type="text"
                    name="telefono_principal"
                    value={formData.telefono_principal}
                    onChange={handleChange}
                    placeholder="0412-0000000"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                  />
                </div>

                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Edad Paciente *</label>
                  <input
                    type="number"
                    name="edad_principal"
                    value={formData.edad_principal}
                    onChange={handleChange}
                    required
                    min="0"
                    max="120"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                  />
                </div>

                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Sexo Biológico *</label>
                  <select
                    name="sexo_principal"
                    value={formData.sexo_principal}
                    onChange={handleChange}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                  >
                    <option value="FEMENINO">FEMENINO</option>
                    <option value="MASCULINO">MASCULINO</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Criterios de Intervención */}
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-150 space-y-4">
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <span class="px-2 py-0.5 rounded text-[8.5px] font-black bg-[#0B3D5C] text-white">INTERVENCIÓN</span>
                <h3 className="text-[10px] font-black text-[#0B3D5C] uppercase tracking-wider">Criterios Quirúrgicos</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Especialidad Quirúrgica *</label>
                  <input
                    type="text"
                    name="especialidad_quirurgica"
                    value={formData.especialidad_quirurgica}
                    onChange={handleChange}
                    required
                    placeholder="E.g., TRAUMATOLOGÍA"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase focus:outline-none focus:border-[#0B3D5C]"
                  />
                </div>

                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Tipo de Operación *</label>
                  <input
                    type="text"
                    name="tipo_intervencion_q"
                    value={formData.tipo_intervencion_q}
                    onChange={handleChange}
                    required
                    placeholder="E.g., COLECISTECTOMÍA LAPAROSCÓPICA"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase focus:outline-none focus:border-[#0B3D5C]"
                  />
                </div>

                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Prioridad Operativa *</label>
                  <select
                    name="urgente_electiva"
                    value={formData.urgente_electiva}
                    onChange={handleChange}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                  >
                    <option value="ELECTIVA">ELECTIVA</option>
                    <option value="URGENTE">URGENTE / EMERGENCIA</option>
                  </select>
                </div>

                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Intervenciones Registradas *</label>
                  <input
                    type="number"
                    name="cantidad_intervencion_q"
                    value={formData.cantidad_intervencion_q}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= FORMULARIO OBSTÉTRICO ================= */}
        {activeTab === 'obstetrica' && (
          <div className="space-y-6">
            {/* Madre */}
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-150 space-y-4">
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <span className="px-2 py-0.5 rounded text-[8.5px] font-black bg-pink-600 text-white">MADRE</span>
                <h3 className="text-[10px] font-black text-[#0B3D5C] uppercase tracking-wider">Identificación de la Madre</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Cédula Madre *</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="cedula_principal"
                      value={formData.cedula_principal}
                      onChange={handleChange}
                      onBlur={() => buscarPaciente(formData.cedula_principal)}
                      required
                      placeholder="V-12345678"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-xs font-bold uppercase focus:outline-none focus:border-[#0B3D5C]"
                    />
                    <button
                      type="button"
                      onClick={() => buscarPaciente(formData.cedula_principal)}
                      className="absolute right-2 top-2 text-[#0B3D5C]"
                    >
                      <Search size={14} />
                    </button>
                  </div>
                  {pacienteStatus && (
                    <span className={`text-[8px] font-black uppercase mt-1 block ${
                      pacienteStatus.includes('✓') ? 'text-emerald-600' : 'text-amber-500'
                    }`}>{pacienteStatus}</span>
                  )}
                </div>

                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Nombre Madre *</label>
                  <input
                    type="text"
                    name="nombre_principal"
                    value={formData.nombre_principal}
                    onChange={handleChange}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase focus:outline-none focus:border-[#0B3D5C]"
                  />
                </div>

                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Apellido Madre *</label>
                  <input
                    type="text"
                    name="apellido_principal"
                    value={formData.apellido_principal}
                    onChange={handleChange}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase focus:outline-none focus:border-[#0B3D5C]"
                  />
                </div>

                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Teléfono Contacto</label>
                  <input
                    type="text"
                    name="telefono_principal"
                    value={formData.telefono_principal}
                    onChange={handleChange}
                    placeholder="0412-0000000"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                  />
                </div>

                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Edad Madre *</label>
                  <input
                    type="number"
                    name="edad_principal"
                    value={formData.edad_principal}
                    onChange={handleChange}
                    required
                    min="10"
                    max="65"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                  />
                </div>
              </div>
            </div>

            {/* Nacimiento */}
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-150 space-y-4">
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <span className="px-2 py-0.5 rounded text-[8.5px] font-black bg-rose-600 text-white">NEONATO</span>
                <h3 className="text-[10px] font-black text-[#0B3D5C] uppercase tracking-wider">Historial del Infante</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Nombre del Infante *</label>
                  <input
                    type="text"
                    name="nombre_infante"
                    value={formData.nombre_infante}
                    onChange={handleChange}
                    required
                    placeholder="E.g., MATEO DE JESÚS"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase focus:outline-none focus:border-[#0B3D5C]"
                  />
                </div>

                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Sexo Infante Nacido *</label>
                  <select
                    name="sexo_infante"
                    value={formData.sexo_infante}
                    onChange={handleChange}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                  >
                    <option value="FEMENINO">FEMENINO</option>
                    <option value="MASCULINO">MASCULINO</option>
                  </select>
                </div>

                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Tipo de Parto *</label>
                  <select
                    name="tipo_parto"
                    value={formData.tipo_parto}
                    onChange={handleChange}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                  >
                    <option value="EUTÓCICO">EUTÓCICO (NATURAL)</option>
                    <option value="DISTÓCICO">DISTÓCICO</option>
                  </select>
                </div>

                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Tipo de Intervención *</label>
                  <select
                    name="tipo_intervencion_o"
                    value={formData.tipo_intervencion_o}
                    onChange={handleChange}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                  >
                    <option value="NATURAL">NATURAL (VAGINAL)</option>
                    <option value="CESÁREA">CESÁREA / QUIRÚRGICA</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= FORMULARIO DE DEFUNCIÓN ================= */}
        {activeTab === 'defuncion' && (
          <div className="space-y-6">
            {/* Fallecido */}
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-150 space-y-4">
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <span className="px-2 py-0.5 rounded text-[8.5px] font-black bg-stone-700 text-white">FALLECIDO</span>
                <h3 className="text-[10px] font-black text-[#0B3D5C] uppercase tracking-wider">Identificación del Fallecido</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Cédula Fallecido</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="cedula_principal"
                      value={formData.cedula_principal}
                      onChange={handleChange}
                      onBlur={() => buscarPaciente(formData.cedula_principal)}
                      placeholder="V-12345678 (Opcional)"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-xs font-bold uppercase focus:outline-none focus:border-[#0B3D5C]"
                    />
                    <button
                      type="button"
                      onClick={() => buscarPaciente(formData.cedula_principal)}
                      className="absolute right-2 top-2 text-[#0B3D5C]"
                    >
                      <Search size={14} />
                    </button>
                  </div>
                  {pacienteStatus && (
                    <span className={`text-[8px] font-black uppercase mt-1 block ${
                      pacienteStatus.includes('✓') ? 'text-emerald-600' : 'text-amber-500'
                    }`}>{pacienteStatus}</span>
                  )}
                </div>

                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Nombre(s) *</label>
                  <input
                    type="text"
                    name="nombre_principal"
                    value={formData.nombre_principal}
                    onChange={handleChange}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase focus:outline-none focus:border-[#0B3D5C]"
                  />
                </div>

                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Apellido(s) *</label>
                  <input
                    type="text"
                    name="apellido_principal"
                    value={formData.apellido_principal}
                    onChange={handleChange}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase focus:outline-none focus:border-[#0B3D5C]"
                  />
                </div>

                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Edad *</label>
                  <input
                    type="number"
                    name="edad_principal"
                    value={formData.edad_principal}
                    onChange={handleChange}
                    required
                    min="0"
                    max="122"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                  />
                </div>

                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Sexo *</label>
                  <select
                    name="sexo_principal"
                    value={formData.sexo_principal}
                    onChange={handleChange}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                  >
                    <option value="FEMENINO">FEMENINO</option>
                    <option value="MASCULINO">MASCULINO</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Certificación de Defunción */}
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-150 space-y-4">
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <span className="px-2 py-0.5 rounded text-[8.5px] font-black bg-[#cf0921] text-white">CERTIFICACIÓN</span>
                <h3 className="text-[10px] font-black text-rose-800 uppercase tracking-wider">Causa Fisiológica</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Hora Fallecimiento *</label>
                  <input
                    type="time"
                    name="hora_fallecimiento"
                    value={formData.hora_fallecimiento}
                    onChange={handleChange}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Diagnóstico / Patología *</label>
                  <input
                    type="text"
                    name="patologia_fallecimiento"
                    value={formData.patologia_fallecimiento}
                    onChange={handleChange}
                    required
                    placeholder="E.g., PARO CARDIORESPIRATORIO SECUNDARIO A IAM"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase focus:outline-none focus:border-[#0B3D5C]"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Observaciones Forenses</label>
                  <textarea
                    name="observacion_defuncion"
                    value={formData.observacion_defuncion}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Agregue información diagnóstica o comentarios forenses obligatorios..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-[#0B3D5C]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}


        {/* PARTE C: DATOS DEL CLÍNICO / MÉDICO TRATANTE  (COMÚN EN LOS TRES) */}
        <div className="bg-indigo-50/20 p-5 rounded-2xl border border-indigo-100 space-y-4">
          <div className="flex items-center gap-1.5 border-b border-indigo-100 pb-2">
            <span className="px-2 py-0.5 rounded text-[8.5px] font-black bg-indigo-900 text-white">MÉDICO</span>
            <h3 className="text-[10px] font-black text-[#0B3D5C] uppercase tracking-wider">Profesional Certificante / Tratante</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Cédula del Médico *</label>
              <div class="relative">
                <input
                  type="text"
                  name="cedula_medico"
                  value={formData.cedula_medico}
                  onChange={handleChange}
                  onBlur={() => buscarMedico(formData.cedula_medico)}
                  required
                  placeholder="V-23456789"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-xs font-bold uppercase focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => buscarMedico(formData.cedula_medico)}
                  className="absolute right-2 top-2 text-[#0B3D5C]"
                >
                  <Search size={14} />
                </button>
              </div>
              {medicoStatus && (
                <span className={`text-[8.5px] font-black uppercase mt-1 block ${
                  medicoStatus.includes('✓') ? 'text-emerald-600' : 'text-indigo-500'
                }`}>{medicoStatus}</span>
              )}
            </div>

            <div>
              <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Primer Nombre *</label>
              <input
                type="text"
                name="nombre_medico"
                value={formData.nombre_medico}
                onChange={handleChange}
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Primer Apellido *</label>
              <input
                type="text"
                name="apellido_medico"
                value={formData.apellido_medico}
                onChange={handleChange}
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Móvil Médico</label>
              <input
                type="text"
                name="telefono_medico"
                value={formData.telefono_medico}
                onChange={handleChange}
                placeholder="0424-9999999"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* ACCIÓN GUARDAR */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                cedula_principal: '',
                nombre_principal: '',
                apellido_principal: '',
                edad_principal: '',
                telefono_principal: '',
                especialidad_quirurgica: '',
                tipo_intervencion_q: '',
                nombre_infante: '',
                hora_fallecimiento: '',
                patologia_fallecimiento: '',
                observacion_defuncion: '',
                cedula_medico: '',
                nombre_medico: '',
                apellido_medico: '',
                telefono_medico: ''
              }));
              setPacienteStatus('');
              setMedicoStatus('');
              setStatusMsg(null);
            }}
            className="px-5 py-3 border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            Limpiar Planilla
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-[#0B3D5C] hover:bg-[#072436] text-white font-black text-[10px] uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Save size={16} />
            {loading ? 'Sincronizando...' : `Guardar Ficha ${activeTab.toUpperCase()}`}
          </button>
        </div>
      </form>
    </div>
  );
}
