import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
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

const ASICS_DATA = [
  { code: "ES-9001", label: "ES-9001 - ASIC Carrizal" },
  { code: "ES-9002", label: "ES-9002 - ASIC Llano Alto" },
  { code: "ES-9004", label: "ES-9004 - ASIC Francisco de Miranda" },
  { code: "ES-9006", label: "ES-9006 - ASIC Paracotos" },
  { code: "ES-9009", label: "ES-9009 - ASIC Los Helechos" }
];

const splitFullname = (fullName: string) => {
  const clean = (fullName || '').trim();
  if (!clean) return { nombre: '', apellido: '' };
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return { nombre: parts[0], apellido: parts[0] };
  if (parts.length === 2) return { nombre: parts[0], apellido: parts[1] };
  if (parts.length === 3) return { nombre: parts[0], apellido: parts.slice(1).join(' ') };
  return { nombre: parts.slice(0, 2).join(' '), apellido: parts.slice(2).join(' ') };
};

export default function NominalFormWindow() {
  const params = new URLSearchParams(window.location.search);
  const formType = params.get('type');
  const activeForm = (formType === 'OBSTETRICIA' ? 'OBSTETRICIA' : formType === 'DEFUNCION' ? 'DEFUNCION' : 'QUIRURGICA') as 'QUIRURGICA' | 'OBSTETRICIA' | 'DEFUNCION';
  const operatorEmail = params.get('email') || 'nominal@mirandasalud.com';
  const [loadedCenters, setLoadedCenters] = useState<{ code: string; label: string }[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(false);

  // Estados de bloqueo de inputs (ReadOnly)
  const [patientReadOnly, setPatientReadOnly] = useState(false);
  const [medicoReadOnly, setMedicoReadOnly] = useState(false);

  // Estados de búsqueda por formulario para evitar colisiones visuales
  const [patientSearchStatus, setPatientSearchStatus] = useState<'idle' | 'searching' | 'found' | 'new' | 'error'>('idle');
  const [medicoSearchStatus, setMedicoSearchStatus] = useState<'idle' | 'searching' | 'found' | 'new' | 'error'>('idle');

  const [comunes, setComunes] = useState({
    n: '',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'Miranda',
    centro_salud: ''
  });

  const [quirurgica, setQuirurgica] = useState({
    cedula_paciente: '', nombre: '', apellido: '', edad: '', sexo: 'M', telefono: '',
    especialidad_quirurgica: '', tipo_intervencion_quirurgica: '', urgente_electiva: 'ELECTIVA',
    cantidad_intervencion_especialidad: '1', nombre_medico: '', apellido_medico: '', cedula_medico: '', telefono_medico: ''
  });

  const [obstetricia, setObstetricia] = useState({
    cedula_madre: '', nombre_madre: '', apellido_madre: '', edad_madre: '', telefono: '',
    nombre_infante_nacido: '', sexo: 'M', tipo_parto: 'EUTÓCICO', tipo_intervencion: 'NATURAL',
    nombre_medico: '', apellido_medico: '', cedula_medico: '', telefono_medico: ''
  });

  const [defuncion, setDefuncion] = useState({
    cedula: '', nombre: '', apellido: '', edad: '', sexo: 'M', hora_fallecimiento: '', patologia: '', observacion: ''
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const generateUniqueId = (type: string) => {
    const prefix = type === 'QUIRURGICA' ? 'QUIR' : type === 'OBSTETRICIA' ? 'OBST' : 'DEFU';
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${dateStr}-${randomPart}`;
  };

  useEffect(() => {
    setComunes(prev => ({ ...prev, n: generateUniqueId(activeForm) }));
  }, [activeForm]);

  useEffect(() => {
    const fetchCenters = async () => {
      setLoadingCenters(true);
      try {
        let tasicData: any[] = [];
        const { data: tas1, error: err1 } = await supabase.from('tasic').select('*');
        if (!err1 && tas1) tasicData = tas1;
        else {
          const { data: tas2, error: err2 } = await supabase.from('TASIC').select('*');
          if (!err2 && tas2) tasicData = tas2;
        }

        if (tasicData && tasicData.length > 0) {
          const formatted = tasicData.map((asic: any) => {
            const finalCode = asic.cod_asic || asic.id || asic.Cod_ASIC || '';
            const rawName = asic.nombre || asic.nombre_asic || '';
            return { code: finalCode, label: `ASIC ${rawName || finalCode}` };
          }).filter(c => c.code);
          
          setLoadedCenters(formatted);
          if (formatted.length > 0) setComunes(prev => ({ ...prev, centro_salud: formatted[0].code }));
        } else {
          setLoadedCenters(ASICS_DATA);
          setComunes(prev => ({ ...prev, centro_salud: ASICS_DATA[0].code }));
        }
      } catch (e) {
        console.error("Error centros:", e);
        setLoadedCenters(ASICS_DATA);
      } finally {
        setLoadingCenters(false);
      }
    };
    fetchCenters();
  }, []);

  // 🔍 BUSCADOR UNIVERSAL DE PACIENTES (Apunta a tu tabla real: ppacientes)
  const searchPatientByCedula = async (cedulaValue: string) => {
    const cleanCedula = cedulaValue.toUpperCase().trim();
    if (!cleanCedula || cleanCedula.length <= 4) return;

    const numCed = parseInt(cleanCedula.replace(/\D/g, ''), 10);
    setPatientSearchStatus('searching');

    try {
      const { data, error } = await supabase
        .from('ppacientes')
        .select('*')
        .eq('cedula', isNaN(numCed) ? cleanCedula : numCed)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPatientSearchStatus('found');
        const fullName = data['Nombre y Apellido'] || data.Nombre_y_Apellido || data.nombre_completo || `${data.nombre || ''} ${data.apellido || ''}`;
        const { nombre: parsedNombre, apellido: parsedApellido } = splitFullname(fullName);
        const movil = data.Movil01 || data.movil01 || data.telefono || '';
        const edad = data.Edad !== undefined ? data.Edad : (data.edad !== undefined ? data.edad : '');
        const sexo = data.Sexo || data.sexo || 'M';

        if (activeForm === 'QUIRURGICA') {
          setQuirurgica(prev => ({ ...prev, nombre: parsedNombre, apellido: parsedApellido, edad: String(edad || ''), sexo: sexo || 'M', telefono: String(movil || '') }));
        } else if (activeForm === 'OBSTETRICIA') {
          setObstetricia(prev => ({ ...prev, nombre_madre: parsedNombre, apellido_madre: parsedApellido, edad_madre: String(edad || ''), telefono: String(movil || '') }));
        } else if (activeForm === 'DEFUNCION') {
          setDefuncion(prev => ({ ...prev, nombre: parsedNombre, apellido: parsedApellido, edad: String(edad || ''), sexo: sexo || 'M' }));
        }
        setPatientReadOnly(true);
      } else {
        setPatientSearchStatus('new');
        setPatientReadOnly(false);
        // Limpiar campos de texto del nombre/apellido para carga manual libre
        if (activeForm === 'QUIRURGICA') {
          setQuirurgica(prev => ({ ...prev, nombre: '', apellido: '', edad: '', telefono: '' }));
        } else if (activeForm === 'OBSTETRICIA') {
          setObstetricia(prev => ({ ...prev, nombre_madre: '', apellido_madre: '', edad_madre: '', telefono: '' }));
        } else if (activeForm === 'DEFUNCION') {
          setDefuncion(prev => ({ ...prev, nombre: '', apellido: '', edad: '' }));
        }
      }
    } catch (err) {
      console.error('Error en ppacientes:', err);
      setPatientSearchStatus('error');
    }
  };

  // 🔍 BUSCADOR UNIVERSAL DE MEDICOS (Apunta a tu tabla real: ppersonal)
  const searchMedicoByCedula = async (cedulaValue: string) => {
    const cleanCedula = cedulaValue.toUpperCase().trim();
    if (!cleanCedula || cleanCedula.length <= 4) return;

    const numCed = parseInt(cleanCedula.replace(/\D/g, ''), 10);
    setMedicoSearchStatus('searching');

    try {
      const { data, error } = await supabase
        .from('ppersonal')
        .select('*')
        .eq('cedula', isNaN(numCed) ? cleanCedula : numCed)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setMedicoSearchStatus('found');
        const fullName = data['Nombre y Apellido'] || data.Nombre_y_Apellido || `${data.nombre || ''} ${data.apellido || ''}`;
        const { nombre: parsedNombre, apellido: parsedApellido } = splitFullname(fullName);
        const movil = data.Movil01 || data.movil01 || data.telefono || '';

        if (activeForm === 'QUIRURGICA') {
          setQuirurgica(prev => ({ ...prev, nombre_medico: parsedNombre, apellido_medico: parsedApellido, telefono_medico: String(movil || '') }));
        } else if (activeForm === 'OBSTETRICIA') {
          setObstetricia(prev => ({ ...prev, nombre_medico: parsedNombre, apellido_medico: parsedApellido, telefono_medico: String(movil || '') }));
        }
        setMedicoReadOnly(true);
      } else {
        setMedicoSearchStatus('new');
        setMedicoReadOnly(false);
        // Limpiar campos de texto de médicos para carga manual libre
        if (activeForm === 'QUIRURGICA') {
          setQuirurgica(prev => ({ ...prev, nombre_medico: '', apellido_medico: '', telefono_medico: '' }));
        } else if (activeForm === 'OBSTETRICIA') {
          setObstetricia(prev => ({ ...prev, nombre_medico: '', apellido_medico: '', telefono_medico: '' }));
        }
      }
    } catch (err) {
      console.error('Error en ppersonal:', err);
      setMedicoSearchStatus('error');
    }
  };

  const handleConfirmAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSyncSuccess(false);

    if (!comunes.centro_salud) {
      setErrorMsg('Por favor seleccione un Centro de Salud válido antes de continuar.');
      return;
    }

    let formEspecifico: any = {};
    if (activeForm === 'QUIRURGICA') formEspecifico = quirurgica;
    else if (activeForm === 'OBSTETRICIA') formEspecifico = obstetricia;
    else if (activeForm === 'DEFUNCION') formEspecifico = defuncion;

    setIsSyncing(true);

    try {
      if (activeForm === 'QUIRURGICA') {
        const pacCed = parseInt(quirurgica.cedula_paciente.replace(/\D/g, ''), 10);
        if (!isNaN(pacCed)) {
          await supabase.from('ppacientes').upsert({
            cedula: pacCed,
            "Nombre y Apellido": `${quirurgica.nombre} ${quirurgica.apellido}`.toUpperCase().trim(),
            Sexo: quirurgica.sexo,
            Edad: parseInt(quirurgica.edad) || null,
            Movil01: (quirurgica.telefono || '').trim()
          }, { onConflict: 'cedula' });
        }
        const medCed = parseInt(quirurgica.cedula_medico.replace(/\D/g, ''), 10);
        if (!isNaN(medCed)) {
          await supabase.from('ppersonal').upsert({
            cedula: medCed,
            "Nombre y Apellido": `${quirurgica.nombre_medico} ${quirurgica.apellido_medico}`.toUpperCase().trim(),
            Movil01: (quirurgica.telefono_medico || '').trim()
          }, { onConflict: 'cedula' });
        }

        // Paso 2: Grabar en la tabla de transacciones de quirofano
        await supabase.from('pregistros_quirurgicos').insert({
          fecha: comunes.fecha,
          estado: comunes.estado,
          centro_salud: comunes.centro_salud,
          cedula: isNaN(pacCed) ? null : pacCed,
          cedula_personal: isNaN(medCed) ? null : medCed,
          cantidad_intervencion: parseInt(quirurgica.cantidad_intervencion_especialidad) || 1,
          nombre_paciente: (quirurgica.nombre || '').toUpperCase().trim(),
          apellido_paciente: (quirurgica.apellido || '').toUpperCase().trim(),
          edad_paciente: parseInt(quirurgica.edad) || null,
          sexo_paciente: quirurgica.sexo,
          telefono_paciente: (quirurgica.telefono || '').trim(),
          especialidad_quirurgica: (quirurgica.especialidad_quirurgica || '').toUpperCase().trim(),
          tipo_intervencion: (quirurgica.tipo_intervencion_quirurgica || '').toUpperCase().trim(),
          urgente_electiva: quirurgica.urgente_electiva,
          nombre_medico: (quirurgica.nombre_medico || '').toUpperCase().trim(),
          apellido_medico: (quirurgica.apellido_medico || '').toUpperCase().trim(),
          telefono_medico: (quirurgica.telefono_medico || '').trim()
        });

      } else if (activeForm === 'OBSTETRICIA') {
        const madCed = parseInt(obstetricia.cedula_madre.replace(/\D/g, ''), 10);
        if (!isNaN(madCed)) {
          await supabase.from('ppacientes').upsert({
            cedula: madCed,
            "Nombre y Apellido": `${obstetricia.nombre_madre} ${obstetricia.apellido_madre}`.toUpperCase().trim(),
            Sexo: 'F',
            Edad: parseInt(obstetricia.edad_madre) || null,
            Movil01: (obstetricia.telefono || '').trim()
          }, { onConflict: 'cedula' });
        }
        const medCed = parseInt(obstetricia.cedula_medico.replace(/\D/g, ''), 10);
        if (!isNaN(medCed)) {
          await supabase.from('ppersonal').upsert({
            cedula: medCed,
            "Nombre y Apellido": `${obstetricia.nombre_medico} ${obstetricia.apellido_medico}`.toUpperCase().trim(),
            Movil01: (obstetricia.telefono_medico || '').trim()
          }, { onConflict: 'cedula' });
        }

        // Paso 2: Grabar en la tabla de transacciones de obstetricia
        await supabase.from('pregistros_obstetricos').insert({
          fecha: comunes.fecha,
          estado: comunes.estado,
          centro_salud: comunes.centro_salud,
          cedula: isNaN(madCed) ? null : madCed,
          cedula_personal: isNaN(medCed) ? null : medCed,
          nombre_madre: (obstetricia.nombre_madre || '').toUpperCase().trim(),
          apellido_madre: (obstetricia.apellido_madre || '').toUpperCase().trim(),
          edad_madre: parseInt(obstetricia.edad_madre) || null,
          telefono_madre: (obstetricia.telefono || '').trim(),
          nombre_infante: (obstetricia.nombre_infante_nacido || '').toUpperCase().trim(),
          sexo_infante: obstetricia.sexo,
          tipo_parto: obstetricia.tipo_parto,
          tipo_intervencion: obstetricia.tipo_intervencion,
          nombre_medico: (obstetricia.nombre_medico || '').toUpperCase().trim(),
          apellido_medico: (obstetricia.apellido_medico || '').toUpperCase().trim(),
          telefono_medico: (obstetricia.telefono_medico || '').trim()
        });

      } else if (activeForm === 'DEFUNCION') {
        const defCed = parseInt(defuncion.cedula.replace(/\D/g, ''), 10);
        if (!isNaN(defCed)) {
          await supabase.from('ppacientes').upsert({
            cedula: defCed,
            "Nombre y Apellido": `${defuncion.nombre} ${defuncion.apellido}`.toUpperCase().trim(),
            Sexo: defuncion.sexo,
            Edad: parseInt(defuncion.edad) || null,
            Movil01: null
          }, { onConflict: 'cedula' });
        }

        // Paso 2: Grabar en la tabla de transacciones de defuncion
        await supabase.from('pregistros_defunciones').insert({
          fecha: comunes.fecha,
          estado: comunes.estado,
          centro_salud: comunes.centro_salud,
          cedula: isNaN(defCed) ? null : defCed,
          cedula_personal: null,
          nombre_fallecido: (defuncion.nombre || '').toUpperCase().trim(),
          apellido_fallecido: (defuncion.apellido || '').toUpperCase().trim(),
          edad_fallecido: parseInt(defuncion.edad) || null,
          sexo_fallecido: defuncion.sexo,
          hora_fallecimiento: defuncion.hora_fallecimiento,
          patologia: (defuncion.patologia || '').toUpperCase().trim(),
          observacion: (defuncion.observacion || '').toUpperCase().trim(),
          nombre_medico: null,
          apellido_medico: null,
          telefono_medico: null
        });
      }
    } catch (dbErr) {
      console.warn("Error Supabase ignorado para envío a tunnel:", dbErr);
    }

    const payload = {
      tipoFormulario: activeForm,
      datos: { ...comunes, registrado_por: operatorEmail, ...formEspecifico }
    };

    try {
      await fetch(GOOGLE_API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setIsSyncing(false);
      setSyncSuccess(true);
      setPatientReadOnly(false);
      setMedicoReadOnly(false);
      setPatientSearchStatus('idle');
      setMedicoSearchStatus('idle');
      
      setComunes(prev => ({ ...prev, n: generateUniqueId(activeForm) }));
      
      if (activeForm === 'QUIRURGICA') {
        setQuirurgica({ cedula_paciente: '', nombre: '', apellido: '', edad: '', sexo: 'M', telefono: '', especialidad_quirurgica: '', tipo_intervencion_quirurgica: '', urgente_electiva: 'ELECTIVA', cantidad_intervencion_especialidad: '1', nombre_medico: '', apellido_medico: '', cedula_medico: '', telefono_medico: '' });
      } else if (activeForm === 'OBSTETRICIA') {
        setObstetricia({ cedula_madre: '', nombre_madre: '', apellido_madre: '', edad_madre: '', telefono: '', nombre_infante_nacido: '', sexo: 'M', tipo_parto: 'EUTÓCICO', tipo_intervencion: 'NATURAL', nombre_medico: '', apellido_medico: '', cedula_medico: '', telefono_medico: '' });
      } else if (activeForm === 'DEFUNCION') {
        setDefuncion({ cedula: '', nombre: '', apellido: '', edad: '', sexo: 'M', hora_fallecimiento: '', patologia: '', observacion: '' });
      }

      setTimeout(() => setSyncSuccess(false), 3500);
    } catch (err) {
      console.error(err);
      setErrorMsg('Fallo en la comunicación de red externa.');
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800 flex flex-col justify-between selection:bg-blue-500/10 font-sans">
      
      {/* Cintillo Institucional */}
      <div className="h-1.5 w-full flex shrink-0">
        <div className="flex-1 bg-[#FFD700]"></div>
        <div className="flex-1 bg-[#002F6C]"></div>
        <div className="flex-1 bg-[#CF0921]"></div>
        <div className="flex-1 bg-[#008751]"></div>
      </div>

      {/* Cabecera limpia */}
      <header className="bg-white border-b border-neutral-200 py-4 px-6 md:px-8">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-600">
              <Database size={18} />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tight text-neutral-800 flex items-center gap-2 flex-wrap">
                Consola Fiel de Transcripción
                {activeForm === 'QUIRURGICA' && (
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-extrabold text-[9px] tracking-wider uppercase leading-none">
                    Quirúrgica
                  </span>
                )}
                {activeForm === 'OBSTETRICIA' && (
                  <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-extrabold text-[9px] tracking-wider uppercase leading-none">
                    Obstetricia
                  </span>
                )}
                {activeForm === 'DEFUNCION' && (
                  <span className="px-2.5 py-0.5 bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-md font-extrabold text-[9px] tracking-wider uppercase leading-none">
                    Defunción
                  </span>
                )}
              </h1>
              <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">
                Entorno de Carga Reactivo y Optimizado
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => window.close()}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-all bg-white px-3.5 py-2 rounded-xl border border-neutral-200 cursor-pointer"
          >
            <ArrowLeft size={12} /> Cerrar
          </button>
        </div>
      </header>

      {/* Main Form Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 space-y-6">
        <form onSubmit={handleConfirmAndRegister} className="space-y-6">
          
          {/* BLOQUE A: CAMPOS COMUNES */}
          <div className="bg-white border border-neutral-200 p-6 rounded-[1.5rem] shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">ID Reporte</label>
              <div className="w-full bg-neutral-50 border border-neutral-200 text-xs font-mono font-bold text-neutral-600 rounded-xl px-3.5 py-2.5">
                {comunes.n}
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Fecha Reporte</label>
              <input 
                type="date" 
                value={comunes.fecha}
                onChange={e => setComunes(prev => ({ ...prev, fecha: e.target.value }))}
                className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Estado Fiscal</label>
              <input type="text" value={comunes.estado} disabled className="w-full bg-neutral-50 border border-neutral-200 text-xs text-neutral-400 rounded-xl px-3.5 py-2" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Centro de Salud (ASIC)</label>
              <select
                value={comunes.centro_salud}
                onChange={e => setComunes(prev => ({ ...prev, centro_salud: e.target.value }))}
                className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              >
                {loadingCenters ? (
                  <option>Cargando catálogo...</option>
                ) : (
                  loadedCenters.map(center => (
                    <option key={center.code} value={center.code}>{center.label}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* BLOQUE B: CAMPOS DINÁMICOS */}
          <div className="bg-white border border-neutral-200 p-6 rounded-[1.5rem] shadow-sm space-y-6">
            
            {/* 1. SECCIÓN QUIRÚRGICA */}
            {activeForm === 'QUIRURGICA' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-200 pb-3 mb-2">
                  <Activity className="text-neutral-500" size={16} />
                  <h3 className="text-xs font-black uppercase text-neutral-800 tracking-wider">Especificaciones del Acto Quirúrgico</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Cédula Paciente</label>
                    <input 
                      type="text" 
                      placeholder="Ej. 12345678"
                      value={quirurgica.cedula_paciente}
                      onChange={e => { 
                        setQuirurgica(prev => ({ ...prev, cedula_paciente: e.target.value })); 
                        setPatientReadOnly(false); 
                        setPatientSearchStatus('idle'); 
                      }}
                      onBlur={() => {
                        const val = quirurgica.cedula_paciente.trim();
                        if (val.length > 4) {
                          searchPatientByCedula(val);
                        }
                      }}
                      className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required
                    />
                    {patientSearchStatus === 'searching' && <p className="text-[9px] text-amber-600 font-bold mt-1 uppercase animate-pulse">Consultando...</p>}
                    {patientSearchStatus === 'found' && <p className="text-[9px] text-emerald-600 font-bold mt-1 uppercase">✓ Encontrado en ppacientes</p>}
                    {patientSearchStatus === 'new' && <p className="text-[9px] text-blue-600 font-bold mt-1 uppercase">👤 Nuevo (Carga Manual)</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Nombre Paciente</label>
                    <input 
                      type="text" 
                      value={quirurgica.nombre} 
                      onChange={e => setQuirurgica(prev => ({ ...prev, nombre: e.target.value }))} 
                      readOnly={patientReadOnly} 
                      className={`w-full border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${patientReadOnly ? 'bg-neutral-50 text-neutral-500 select-none' : 'bg-white'}`} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Apellido Paciente</label>
                    <input 
                      type="text" 
                      value={quirurgica.apellido} 
                      onChange={e => setQuirurgica(prev => ({ ...prev, apellido: e.target.value }))} 
                      readOnly={patientReadOnly} 
                      className={`w-full border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${patientReadOnly ? 'bg-neutral-50 text-neutral-500 select-none' : 'bg-white'}`} 
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Edad</label>
                    <input 
                      type="number" 
                      value={quirurgica.edad} 
                      onChange={e => setQuirurgica(prev => ({ ...prev, edad: e.target.value }))} 
                      readOnly={patientReadOnly} 
                      className={`w-full border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${patientReadOnly ? 'bg-neutral-50 text-neutral-500' : 'bg-white'}`} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Sexo</label>
                    <select 
                      value={quirurgica.sexo} 
                      onChange={e => setQuirurgica(prev => ({ ...prev, sexo: e.target.value }))} 
                      disabled={patientReadOnly} 
                      className={`w-full border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${patientReadOnly ? 'bg-neutral-50 text-neutral-500' : 'bg-white'}`}
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Teléfono Móvil</label>
                    <input 
                      type="text" 
                      value={quirurgica.telefono} 
                      onChange={e => setQuirurgica(prev => ({ ...prev, telefono: e.target.value }))} 
                      className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Especialidad</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Traumatología" 
                      value={quirurgica.especialidad_quirurgica} 
                      onChange={e => setQuirurgica(prev => ({ ...prev, especialidad_quirurgica: e.target.value }))} 
                      className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-neutral-100 pt-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Intervención</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Hernioplastia" 
                      value={quirurgica.tipo_intervencion_quirurgica} 
                      onChange={e => setQuirurgica(prev => ({ ...prev, tipo_intervencion_quirurgica: e.target.value }))} 
                      className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Prioridad</label>
                    <select 
                      value={quirurgica.urgente_electiva} 
                      onChange={e => setQuirurgica(prev => ({ ...prev, urgente_electiva: e.target.value }))} 
                      className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="ELECTIVA">Electiva</option>
                      <option value="EMERGENCIA">Emergencia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Cantidad</label>
                    <input 
                      type="number" 
                      value={quirurgica.cantidad_intervencion_especialidad} 
                      onChange={e => setQuirurgica(prev => ({ ...prev, cantidad_intervencion_especialidad: e.target.value }))} 
                      className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-neutral-100 pt-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Cédula Médico</label>
                    <input 
                      type="text" 
                      placeholder="Ej. 12345678"
                      value={quirurgica.cedula_medico}
                      onChange={e => { 
                        setQuirurgica(prev => ({ ...prev, cedula_medico: e.target.value })); 
                        setMedicoReadOnly(false); 
                        setMedicoSearchStatus('idle'); 
                      }}
                      onBlur={() => {
                        const val = quirurgica.cedula_medico.trim();
                        if (val.length > 4) {
                          searchMedicoByCedula(val);
                        }
                      }}
                      className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required
                    />
                    {medicoSearchStatus === 'searching' && <p className="text-[9px] text-amber-600 font-bold mt-1 uppercase">Consultando...</p>}
                    {medicoSearchStatus === 'found' && <p className="text-[9px] text-emerald-600 font-bold mt-1 uppercase">✓ Encontrado en ppersonal</p>}
                    {medicoSearchStatus === 'new' && <p className="text-[9px] text-blue-600 font-bold mt-1 uppercase">👤 Médico Nuevo</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Nombre Médico</label>
                    <input 
                      type="text" 
                      value={quirurgica.nombre_medico} 
                      onChange={e => setQuirurgica(prev => ({ ...prev, nombre_medico: e.target.value }))} 
                      readOnly={medicoReadOnly} 
                      className={`w-full border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${medicoReadOnly ? 'bg-neutral-50 text-neutral-500' : 'bg-white'}`} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Apellido Médico</label>
                    <input 
                      type="text" 
                      value={quirurgica.apellido_medico} 
                      onChange={e => setQuirurgica(prev => ({ ...prev, apellido_medico: e.target.value }))} 
                      readOnly={medicoReadOnly} 
                      className={`w-full border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${medicoReadOnly ? 'bg-neutral-50 text-neutral-500' : 'bg-white'}`} 
                      required 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. SECCIÓN OBSTETRICIA */}
            {activeForm === 'OBSTETRICIA' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-200 pb-3 mb-2">
                  <HeartPulse className="text-neutral-500" size={16} />
                  <h3 className="text-xs font-black uppercase text-neutral-800 tracking-wider">Registro de Evento Obstétrico</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Cédula de la Madre</label>
                    <input 
                      type="text" 
                      placeholder="Ej. 12345678"
                      value={obstetricia.cedula_madre}
                      onChange={e => { 
                        setObstetricia(prev => ({ ...prev, cedula_madre: e.target.value })); 
                        setPatientReadOnly(false); 
                        setPatientSearchStatus('idle'); 
                      }}
                      onBlur={() => {
                        const val = obstetricia.cedula_madre.trim();
                        if (val.length > 4) {
                          searchPatientByCedula(val);
                        }
                      }}
                      className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required
                    />
                    {patientSearchStatus === 'searching' && <p className="text-[9px] text-amber-600 font-bold mt-1 uppercase animate-pulse">Consultando...</p>}
                    {patientSearchStatus === 'found' && <p className="text-[9px] text-emerald-600 font-bold mt-1 uppercase">✓ Encontrada en ppacientes</p>}
                    {patientSearchStatus === 'new' && <p className="text-[9px] text-blue-600 font-bold mt-1 uppercase">👤 Madre Nueva (Carga Manual)</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Nombre Madre</label>
                    <input 
                      type="text" 
                      value={obstetricia.nombre_madre} 
                      onChange={e => setObstetricia(prev => ({ ...prev, nombre_madre: e.target.value }))} 
                      readOnly={patientReadOnly} 
                      className={`w-full border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${patientReadOnly ? 'bg-neutral-50 text-neutral-500 select-none' : 'bg-white'}`} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Apellido Madre</label>
                    <input 
                      type="text" 
                      value={obstetricia.apellido_madre} 
                      onChange={e => setObstetricia(prev => ({ ...prev, apellido_madre: e.target.value }))} 
                      readOnly={patientReadOnly} 
                      className={`w-full border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${patientReadOnly ? 'bg-neutral-50 text-neutral-500 select-none' : 'bg-white'}`} 
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Edad Madre</label>
                    <input 
                      type="number" 
                      value={obstetricia.edad_madre} 
                      onChange={e => setObstetricia(prev => ({ ...prev, edad_madre: e.target.value }))} 
                      className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Teléfono</label>
                    <input 
                      type="text" 
                      value={obstetricia.telefono} 
                      onChange={e => setObstetricia(prev => ({ ...prev, telefono: e.target.value }))} 
                      className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Nombre Infante</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Neonato de..." 
                      value={obstetricia.nombre_infante_nacido} 
                      onChange={e => setObstetricia(prev => ({ ...prev, nombre_infante_nacido: e.target.value }))} 
                      className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-neutral-100 pt-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Sexo Neonato</label>
                    <select 
                      value={obstetricia.sexo} 
                      onChange={e => setObstetricia(prev => ({ ...prev, sexo: e.target.value }))} 
                      className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Tipo de Parto</label>
                    <select 
                      value={obstetricia.tipo_parto} 
                      onChange={e => setObstetricia(prev => ({ ...prev, tipo_parto: e.target.value }))} 
                      className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="EUTÓCICO">Eutócico (Normal)</option>
                      <option value="DISTÓCICO">Distócico</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Tipo Intervención</label>
                    <select 
                      value={obstetricia.tipo_intervencion} 
                      onChange={e => setObstetricia(prev => ({ ...prev, tipo_intervencion: e.target.value }))} 
                      className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="NATURAL">Vaginal Natural</option>
                      <option value="CESÁREA">Cesárea Quirúrgica</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-neutral-100 pt-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Cédula Médico</label>
                    <input 
                      type="text" 
                      placeholder="Ej. 12345678"
                      value={obstetricia.cedula_medico}
                      onChange={e => { 
                        setObstetricia(prev => ({ ...prev, cedula_medico: e.target.value })); 
                        setMedicoReadOnly(false); 
                        setMedicoSearchStatus('idle'); 
                      }}
                      onBlur={() => {
                        const val = obstetricia.cedula_medico.trim();
                        if (val.length > 4) {
                          searchMedicoByCedula(val);
                        }
                      }}
                      className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required
                    />
                    {medicoSearchStatus === 'searching' && <p className="text-[9px] text-amber-600 font-bold mt-1 uppercase">Consultando...</p>}
                    {medicoSearchStatus === 'found' && <p className="text-[9px] text-emerald-600 font-bold mt-1 uppercase">✓ Encontrado en ppersonal</p>}
                    {medicoSearchStatus === 'new' && <p className="text-[9px] text-blue-600 font-bold mt-1 uppercase">👤 Médico Nuevo</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Nombre Médico</label>
                    <input 
                      type="text" 
                      value={obstetricia.nombre_medico} 
                      onChange={e => setObstetricia(prev => ({ ...prev, nombre_medico: e.target.value }))} 
                      readOnly={medicoReadOnly} 
                      className={`w-full border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${medicoReadOnly ? 'bg-neutral-50 text-neutral-500' : 'bg-white'}`} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Apellido Médico</label>
                    <input 
                      type="text" 
                      value={obstetricia.apellido_medico} 
                      onChange={e => setObstetricia(prev => ({ ...prev, apellido_medico: e.target.value }))} 
                      readOnly={medicoReadOnly} 
                      className={`w-full border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${medicoReadOnly ? 'bg-neutral-50 text-neutral-500' : 'bg-white'}`} 
                      required 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. SECCIÓN DEFUNCIÓN */}
            {activeForm === 'DEFUNCION' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-200 pb-3 mb-2">
                  <UserCheck className="text-neutral-505" size={16} />
                  <h3 className="text-xs font-black uppercase text-neutral-800 tracking-wider">Carga de Reporte Epidemiológico de Defunción</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Cédula del Fallecido</label>
                    <input 
                      type="text" 
                      placeholder="Ej. 12345678"
                      value={defuncion.cedula}
                      onChange={e => { 
                        setDefuncion(prev => ({ ...prev, cedula: e.target.value })); 
                        setPatientReadOnly(false); 
                        setPatientSearchStatus('idle'); 
                      }}
                      onBlur={() => {
                        const val = defuncion.cedula.trim();
                        if (val.length > 4) {
                          searchPatientByCedula(val);
                        }
                      }}
                      className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required
                    />
                    {patientSearchStatus === 'searching' && <p className="text-[9px] text-amber-600 font-bold mt-1 uppercase animate-pulse">Consultando...</p>}
                    {patientSearchStatus === 'found' && <p className="text-[9px] text-emerald-600 font-bold mt-1 uppercase">✓ Encontrado en ppacientes</p>}
                    {patientSearchStatus === 'new' && <p className="text-[9px] text-blue-600 font-bold mt-1 uppercase">👤 Finado Nuevo (Carga Manual)</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Nombre</label>
                    <input 
                      type="text" 
                      value={defuncion.nombre} 
                      onChange={e => setDefuncion(prev => ({ ...prev, nombre: e.target.value }))} 
                      readOnly={patientReadOnly} 
                      className={`w-full border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${patientReadOnly ? 'bg-neutral-50 text-neutral-500 select-none' : 'bg-white'}`} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Apellido</label>
                    <input 
                      type="text" 
                      value={defuncion.apellido} 
                      onChange={e => setDefuncion(prev => ({ ...prev, apellido: e.target.value }))} 
                      readOnly={patientReadOnly} 
                      className={`w-full border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${patientReadOnly ? 'bg-neutral-50 text-neutral-500 select-none' : 'bg-white'}`} 
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Edad al Fallecer</label>
                    <input 
                      type="number" 
                      value={defuncion.edad} 
                      onChange={e => setDefuncion(prev => ({ ...prev, edad: e.target.value }))} 
                      className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Sexo</label>
                    <select 
                      value={defuncion.sexo} 
                      onChange={e => setDefuncion(prev => ({ ...prev, sexo: e.target.value }))} 
                      className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500"
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Hora del Deceso</label>
                    <input 
                      type="time" 
                      value={defuncion.hora_fallecimiento} 
                      onChange={e => setDefuncion(prev => ({ ...prev, hora_fallecimiento: e.target.value }))} 
                      className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500" 
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-neutral-200 pt-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Patología / Causa de Muerte</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Paro cardiorrespiratorio" 
                      value={defuncion.patologia} 
                      onChange={e => setDefuncion(prev => ({ ...prev, patologia: e.target.value }))} 
                      className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-500 mb-1.5">Observaciones</label>
                    <input 
                      type="text" 
                      placeholder="Diagnósticos secundarios o notas clínicas" 
                      value={defuncion.observacion} 
                      onChange={e => setDefuncion(prev => ({ ...prev, observacion: e.target.value }))} 
                      className="w-full bg-white border border-neutral-200 text-xs text-neutral-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Diagnósticos de Notificaciones */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }} 
                  className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-xs text-red-700 font-bold uppercase tracking-wide"
                >
                  <AlertCircle size={16} /> {errorMsg}
                </motion.div>
              )}
              {syncSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }} 
                  className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3 text-xs text-emerald-800 font-bold uppercase tracking-wide"
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

    </div>
  );
}
