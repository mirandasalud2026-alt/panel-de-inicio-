// components/ui/NominalFormWindow.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft, Save, RefreshCw, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

type FormType = 'QUIRURGICA' | 'OBSTETRICA' | 'DEFUNCION';

export default function NominalFormWindow() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const type = (params.get('type') === 'OBSTETRICA' ? 'OBSTETRICA' : params.get('type') === 'DEFUNCION' ? 'DEFUNCION' : 'QUIRURGICA') as FormType;
  const userEmail = params.get('email') || '';
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    estado: 'MIRANDA',
    centro_salud: '',
    cedula_paciente: '',
    nombre_paciente: '',
    apellido_paciente: '',
    edad: '',
    sexo: 'FEMENINO',
    telefono: '',
    especialidad: '',
    intervencion: '',
    prioridad: 'ELECTIVA',
    cantidad: '1',
    cedula_medico: '',
    nombre_medico: '',
    apellido_medico: '',
    // obstetricia
    nombre_infante: '',
    sexo_infante: 'FEMENINO',
    tipo_parto: 'EUTÓCICO',
    tipo_intervencion_o: 'NATURAL',
    // defuncion
    hora_fallecimiento: '',
    patologia: '',
    observacion: '',
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pacienteStatus, setPacienteStatus] = useState('');
  const [medicoStatus, setMedicoStatus] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const buscarPaciente = async () => {
    if (!formData.cedula_paciente) return;
    setPacienteStatus('Buscando...');
    const { data, error } = await supabase.from('pacientes').select('*').eq('cedula', formData.cedula_paciente.trim()).maybeSingle();
    if (data) {
      setFormData(prev => ({
        ...prev,
        nombre_paciente: data.nombre,
        apellido_paciente: data.apellido,
        edad: data.edad.toString(),
        sexo: data.sexo,
        telefono: data.telefono || '',
      }));
      setPacienteStatus('✓ Encontrado');
    } else {
      setPacienteStatus('Nuevo paciente');
    }
  };

  const buscarMedico = async () => {
    if (!formData.cedula_medico) return;
    setMedicoStatus('Buscando...');
    const { data, error } = await supabase.from('medicos').select('*').eq('cedula', formData.cedula_medico.trim()).maybeSingle();
    if (data) {
      setFormData(prev => ({
        ...prev,
        nombre_medico: data.nombre,
        apellido_medico: data.apellido,
      }));
      setMedicoStatus('✓ Encontrado');
    } else {
      setMedicoStatus('Nuevo médico');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      // 1. Upsert paciente
      if (formData.cedula_paciente) {
        await supabase.from('pacientes').upsert({
          cedula: formData.cedula_paciente.trim(),
          nombre: formData.nombre_paciente.trim().toUpperCase(),
          apellido: formData.apellido_paciente.trim().toUpperCase(),
          edad: parseInt(formData.edad) || 0,
          sexo: formData.sexo,
          telefono: formData.telefono,
        }, { onConflict: 'cedula' });
      }

      // 2. Upsert médico
      if (formData.cedula_medico) {
        await supabase.from('medicos').upsert({
          cedula: formData.cedula_medico.trim(),
          nombre: formData.nombre_medico.trim().toUpperCase(),
          apellido: formData.apellido_medico.trim().toUpperCase(),
        }, { onConflict: 'cedula' });
      }

      // 3. Insertar en tabla específica
      let table = '';
      let payload: any = {};

      if (type === 'QUIRURGICA') {
        table = 'registros_quirurgicos';
        payload = {
          fecha: formData.fecha,
          estado: formData.estado,
          centro_salud: formData.centro_salud,
          cedula_paciente: formData.cedula_paciente,
          nombre_paciente: formData.nombre_paciente,
          apellido_paciente: formData.apellido_paciente,
          edad_paciente: parseInt(formData.edad) || 0,
          sexo_paciente: formData.sexo,
          telefono_paciente: formData.telefono,
          especialidad_quirurgica: formData.especialidad,
          tipo_intervencion: formData.intervencion,
          urgente_electiva: formData.prioridad,
          cantidad_intervencion: parseInt(formData.cantidad) || 1,
          cedula_medico: formData.cedula_medico,
          nombre_medico: formData.nombre_medico,
          apellido_medico: formData.apellido_medico,
        };
      } else if (type === 'OBSTETRICA') {
        table = 'registros_obstetricos';
        payload = {
          fecha: formData.fecha,
          estado: formData.estado,
          centro_salud: formData.centro_salud,
          cedula_madre: formData.cedula_paciente,
          nombre_madre: formData.nombre_paciente,
          apellido_madre: formData.apellido_paciente,
          edad_madre: parseInt(formData.edad) || 0,
          telefono_madre: formData.telefono,
          nombre_infante: formData.nombre_infante,
          sexo_infante: formData.sexo_infante,
          tipo_parto: formData.tipo_parto,
          tipo_intervencion: formData.tipo_intervencion_o,
          cedula_medico: formData.cedula_medico,
          nombre_medico: formData.nombre_medico,
          apellido_medico: formData.apellido_medico,
        };
      } else {
        table = 'registros_defunciones';
        payload = {
          fecha: formData.fecha,
          estado: formData.estado,
          centro_salud: formData.centro_salud,
          cedula_fallecido: formData.cedula_paciente,
          nombre_fallecido: formData.nombre_paciente,
          apellido_fallecido: formData.apellido_paciente,
          edad_fallecido: parseInt(formData.edad) || 0,
          sexo_fallecido: formData.sexo,
          hora_fallecimiento: formData.hora_fallecimiento,
          patologia: formData.patologia,
          observacion: formData.observacion,
          cedula_medico: formData.cedula_medico,
          nombre_medico: formData.nombre_medico,
          apellido_medico: formData.apellido_medico,
        };
      }

      const { data: inserted, error: insertError } = await supabase.from(table).insert(payload).select('id').single();
      if (insertError) throw insertError;

      // 4. Guardar en nominales (bitácora)
      await supabase.from('nominales').insert({
        tipo_registro: type.toLowerCase(),
        registro_id: inserted.id,
        cedula_principal: formData.cedula_paciente || 'S/C',
        centro_salud: formData.centro_salud,
        datos: payload,
      });

      setStatus({ type: 'success', text: `Registro guardado correctamente (ID: ${inserted.id})` });
      setTimeout(() => window.close(), 2000);
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* CABECERA PRINCIPAL ESTADO MIRANDA */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-200 pb-5 mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0B3D5C] text-white rounded-2xl shadow-md">
              <span className="font-display font-black text-xl">M</span>
            </div>
            <div>
              <h1 className="text-base font-black uppercase text-[#0B3D5C] tracking-tight leading-none mb-1 font-display">
                Gobernación del Estado Bolivariano de Miranda
              </h1>
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                Dirección Estadal de Salud • Sistema de Reporte Clínico
              </h2>
            </div>
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-100 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Conectado a Supabase
            </span>
          </div>
        </div>

        {/* CONTENEDOR DE FORMULARIO */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl relative">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div className="space-y-1">
              <span className="px-2 py-0.5 rounded text-[8.5px] font-black bg-[#0B3D5C] text-white uppercase tracking-wider">
                PLANILLA DE REGISTRO
              </span>
              <h2 className="text-xl font-black text-[#0B3D5C] uppercase tracking-tight font-display">
                Nómina Nominal: {type}
              </h2>
            </div>
            <button 
              onClick={() => navigate(-1)} 
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Volver
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* SECCIÓN 0: FECHA Y UBICACIÓN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <label className="text-[8.5px] font-black tracking-widest text-[#0B3D5C] uppercase block mb-1.5">
                  Fecha Real *
                </label>
                <input 
                  type="date" 
                  name="fecha" 
                  value={formData.fecha} 
                  onChange={handleChange}
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-bold focus:outline-none focus:border-[#0B3D5C]"
                />
              </div>
              <div>
                <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
                  Estado Territorial
                </label>
                <input 
                  type="text" 
                  name="estado" 
                  value={formData.estado} 
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase text-slate-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[8.5px] font-black tracking-widest text-[#0B3D5C] uppercase block mb-1.5">
                  Centro de Salud *
                </label>
                <input 
                  type="text" 
                  name="centro_salud" 
                  value={formData.centro_salud} 
                  onChange={handleChange}
                  required 
                  placeholder="Ej: Hosp Victorino Santaella"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase placeholder:text-slate-300 focus:outline-none focus:border-[#0B3D5C]"
                />
              </div>
            </div>

            {/* SECCIÓN 1: DATOS GENERALES DEL PACIENTE/MADRE/FALLECIDO */}
            <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-[8.5px] font-black text-white uppercase tracking-wider ${
                  type === 'OBSTETRICA' ? 'bg-pink-600' : type === 'DEFUNCION' ? 'bg-rose-700' : 'bg-emerald-600'
                }`}>
                  {type === 'OBSTETRICA' ? 'MADRE' : type === 'DEFUNCION' ? 'FALLECIDO' : 'PACIENTE'}
                </span>
                <h3 className="text-[10px] font-black text-[#0B3D5C] uppercase tracking-wider font-display">
                  {type === 'OBSTETRICA' ? 'Identificación de la Madre' : type === 'DEFUNCION' ? 'Identificación del Fallecido' : 'Identificación del Paciente'}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
                    Cédula {type === 'OBSTETRICA' ? 'Madre' : type === 'DEFUNCION' ? 'Fallecido (Opc)' : 'Paciente'} *
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      name="cedula_paciente" 
                      value={formData.cedula_paciente} 
                      onChange={handleChange}
                      onBlur={buscarPaciente}
                      placeholder="Ej: V-12345678"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-[10.5px] font-bold uppercase focus:outline-none focus:border-[#0B3D5C]"
                    />
                    <button 
                      type="button" 
                      onClick={buscarPaciente} 
                      className="absolute right-2 top-2 text-[#0B3D5C] hover:scale-110 transition-transform"
                    >
                      <Search size={14} />
                    </button>
                  </div>
                  {pacienteStatus && (
                    <span className={`text-[7.5px] font-black uppercase mt-1 block ${
                      pacienteStatus.includes('✓') ? 'text-emerald-600' : 'text-amber-600'
                    }`}>{pacienteStatus}</span>
                  )}
                </div>

                <div>
                  <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
                    Nombre(s) *
                  </label>
                  <input 
                    type="text" 
                    name="nombre_paciente" 
                    value={formData.nombre_paciente} 
                    onChange={handleChange}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase focus:outline-none focus:border-[#0B3D5C]"
                  />
                </div>

                <div>
                  <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
                    Apellido(s) *
                  </label>
                  <input 
                    type="text" 
                    name="apellido_paciente" 
                    value={formData.apellido_paciente} 
                    onChange={handleChange}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase focus:outline-none focus:border-[#0B3D5C]"
                  />
                </div>

                <div>
                  <label className="text-[8.5px] font-black tracking-widest text-slate-440 text-slate-400 uppercase block mb-1.5">
                    Teléfono Contacto
                  </label>
                  <input 
                    type="text" 
                    name="telefono" 
                    value={formData.telefono} 
                    onChange={handleChange}
                    placeholder="04xx-xxxxxxx"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-bold focus:outline-none focus:border-[#0B3D5C]"
                  />
                </div>

                <div>
                  <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
                    Edad *
                  </label>
                  <input 
                    type="number" 
                    name="edad" 
                    value={formData.edad} 
                    onChange={handleChange}
                    required
                    min="0"
                    max="125"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-bold focus:outline-none focus:border-[#0B3D5C]"
                  />
                </div>

                {type !== 'OBSTETRICA' && (
                  <div>
                    <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5 font-display">
                      Sexo *
                    </label>
                    <select 
                      name="sexo" 
                      value={formData.sexo} 
                      onChange={handleChange}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-bold focus:outline-none focus:border-[#0B3D5C]"
                    >
                      <option value="FEMENINO">FEMENINO</option>
                      <option value="MASCULINO">MASCULINO</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN 2: CAMPOS ESPECÍFICOS SEGÚN EL TIPO DE REGISTRO */}
            {type === 'QUIRURGICA' && (
              <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[8.5px] font-black bg-indigo-650 bg-indigo-600 text-white uppercase tracking-wider">
                    INTERVENCIÓN
                  </span>
                  <h3 className="text-[10px] font-black text-[#0B3D5C] uppercase tracking-wider font-display">
                    Criterio Quirúrgico MPPS
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
                      Especialidad Quirúrgica *
                    </label>
                    <input 
                      type="text" 
                      name="especialidad" 
                      value={formData.especialidad} 
                      onChange={handleChange}
                      required
                      placeholder="Ej: Traumatología"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase focus:outline-none focus:border-[#0B3D5C]"
                    />
                  </div>

                  <div>
                    <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5 font-display">
                      Tipo de Intervención *
                    </label>
                    <input 
                      type="text" 
                      name="intervencion" 
                      value={formData.intervencion} 
                      onChange={handleChange}
                      required
                      placeholder="Ej: Hernioplastia Inguinal"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase focus:outline-none focus:border-[#0B3D5C]"
                    />
                  </div>

                  <div>
                    <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
                      Prioridad *
                    </label>
                    <select 
                      name="prioridad" 
                      value={formData.prioridad} 
                      onChange={handleChange}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-bold focus:outline-none focus:border-[#0B3D5C]"
                    >
                      <option value="ELECTIVA">ELECTIVA</option>
                      <option value="URGENTE">URGENTE / DE EMERGENCIA</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5 font-display">
                      Cantidad de Intervención *
                    </label>
                    <input 
                      type="number" 
                      name="cantidad" 
                      value={formData.cantidad} 
                      onChange={handleChange}
                      required
                      min="1"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-bold focus:outline-none focus:border-[#0B3D5C]"
                    />
                  </div>
                </div>
              </div>
            )}

            {type === 'OBSTETRICA' && (
              <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[8.5px] font-black bg-rose-600 text-white uppercase tracking-wider">
                    NEONATO
                  </span>
                  <h3 className="text-[10px] font-black text-[#0B3D5C] uppercase tracking-wider font-display">
                    Detalles del Nacimiento
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
                      Nombre Infante Nacido *
                    </label>
                    <input 
                      type="text" 
                      name="nombre_infante" 
                      value={formData.nombre_infante} 
                      onChange={handleChange}
                      required
                      placeholder="Ej: Thiago José"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase focus:outline-none focus:border-[#0B3D5C]"
                    />
                  </div>

                  <div>
                    <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
                      Sexo Infante *
                    </label>
                    <select 
                      name="sexo_infante" 
                      value={formData.sexo_infante} 
                      onChange={handleChange}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-bold focus:outline-none focus:border-[#0B3D5C]"
                    >
                      <option value="FEMENINO">FEMENINO</option>
                      <option value="MASCULINO">MASCULINO</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
                      Tipo de Parto *
                    </label>
                    <select 
                      name="tipo_parto" 
                      value={formData.tipo_parto} 
                      onChange={handleChange}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-bold focus:outline-none focus:border-[#0B3D5C]"
                    >
                      <option value="EUTÓCICO">EUTÓCICO (NATURAL)</option>
                      <option value="DISTÓCICO">DISTÓCICO (DIFICULTOSO)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
                      Tipo de Intervención *
                    </label>
                    <select 
                      name="tipo_intervencion_o" 
                      value={formData.tipo_intervencion_o} 
                      onChange={handleChange}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-bold focus:outline-none focus:border-[#0B3D5C]"
                    >
                      <option value="NATURAL">NATURAL (VAGINAL)</option>
                      <option value="CESÁREA">CESÁREA / QUIRÚRGICA</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {type === 'DEFUNCION' && (
              <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[8.5px] font-black bg-stone-750 bg-stone-800 text-white uppercase tracking-wider">
                    FISIOPATOLOGÍA
                  </span>
                  <h3 className="text-[10px] font-black text-[#0B3D5C] uppercase tracking-wider font-display">
                    Certificación de Defunción
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
                      Hora Fallecimiento
                    </label>
                    <input 
                      type="time" 
                      name="hora_fallecimiento" 
                      value={formData.hora_fallecimiento} 
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-bold focus:outline-none focus:border-[#0B3D5C]"
                    />
                  </div>

                  <div>
                    <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
                      Patología Principal *
                    </label>
                    <input 
                      type="text" 
                      name="patologia" 
                      value={formData.patologia} 
                      onChange={handleChange}
                      required
                      placeholder="Ej: Paro Cardio-Respiratorio"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase focus:outline-none focus:border-[#0B3D5C]"
                    />
                  </div>

                  <div>
                    <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
                      Observación / Otros
                    </label>
                    <input 
                      type="text" 
                      name="observacion" 
                      value={formData.observacion} 
                      onChange={handleChange}
                      placeholder="Ej: Ninguna"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase focus:outline-none focus:border-[#0B3D5C]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN 3: DATOS DEL MÉDICO TRATANTE / CERTIFICANTE */}
            <div className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-100 space-y-4">
              <div className="flex items-center gap-1.5 border-b border-indigo-100 pb-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[8.5px] font-black bg-indigo-950 text-white uppercase tracking-wider">
                  MÉDICO
                </span>
                <h3 className="text-[10px] font-black text-[#0B3D5C] uppercase tracking-wider font-display">
                  Identificación del Clínico Tratante
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[8.5px] font-black tracking-widest text-indigo-900/60 uppercase block mb-1.5 col-span-1">
                    Cédula Médico *
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      name="cedula_medico" 
                      value={formData.cedula_medico} 
                      onChange={handleChange}
                      onBlur={buscarMedico}
                      required 
                      placeholder="Ej: V-87654321"
                      className="w-full bg-white border border-indigo-100 rounded-xl pl-3 pr-10 py-2 text-[10.5px] font-bold uppercase focus:outline-none focus:border-indigo-600"
                    />
                    <button 
                      type="button" 
                      onClick={buscarMedico} 
                      className="absolute right-2 top-2 text-[#0B3D5C] hover:scale-110 transition-transform"
                    >
                      <Search size={14} />
                    </button>
                  </div>
                  {medicoStatus && (
                    <span className={`text-[7.5px] font-black uppercase mt-1 block ${
                      medicoStatus.includes('✓') ? 'text-emerald-600' : 'text-indigo-600'
                    }`}>{medicoStatus}</span>
                  )}
                </div>

                <div>
                  <label className="text-[8.5px] font-black tracking-widest text-indigo-900/60 uppercase block mb-1.5">
                    Nombre(s) *
                  </label>
                  <input 
                    type="text" 
                    name="nombre_medico" 
                    value={formData.nombre_medico} 
                    onChange={handleChange}
                    required
                    className="w-full bg-white border border-indigo-100 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="text-[8.5px] font-black tracking-widest text-indigo-900/60 uppercase block mb-1.5">
                    Apellido(s) *
                  </label>
                  <input 
                    type="text" 
                    name="apellido_medico" 
                    value={formData.apellido_medico} 
                    onChange={handleChange}
                    required
                    className="w-full bg-white border border-indigo-100 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>

            {/* BOTONERA ACCIÓN DE GUARDADO */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => navigate(-1)} 
                className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-400 font-black text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Cancelar y Salir
              </button>
              
              <button 
                type="submit" 
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-[#0B3D5C] hover:bg-[#072B41] text-white font-black text-[9px] uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                {loading ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />} 
                Guardar Reporte Nominal
              </button>
            </div>

            {/* FEEDBACK STATUS DE CARGA */}
            {status && (
              <div className={`p-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
              }`}>
                {status.type === 'success' ? <CheckCircle size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-rose-600" />}
                <span>{status.text}</span>
              </div>
            )}
          </form>
        </div>

        {/* DOCUMENTACIÓN DE PIE DE PÁGINA */}
        <div className="bg-[#0B3D5C]/5 p-4 rounded-2xl border border-[#0B3D5C]/10 flex gap-3 text-slate-500 text-[9px] font-bold uppercase leading-relaxed tracking-wide">
          <span className="text-emerald-700 text-lg">🛡️</span>
          <div>
            <p>
              Este formulario se conecta de manera encriptada con la red central de salud Miranda. Los datos aquí guardados quedan cubiertos por el secreto médico y se sincronizan con las nóminas de resguardo temporal (Criterio de Autodestrucción en 7 días) y respaldados automáticamente en Google Drive cada Domingo a las 23:55.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}