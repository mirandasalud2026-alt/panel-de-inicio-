import React, { useState, useEffect } from 'react';
import { nominalService } from '../../services/nominalService';
import { Save, UserCheck, ShieldAlert, Check, Search, Calendar, Landmark, Activity, Sparkles, UserCog, HeartIcon, Skull } from 'lucide-react';

const obtenerNombreLegible = (centro: any): string => {
  if (!centro) return '';
  const nombre = typeof centro === 'object' ? (centro.nombre_establecimiento || centro.nombre || '') : String(centro);
  const nombreUpper = nombre.toUpperCase().trim();

  // Si por alguna razón empieza por "ASIC" o coincide con códigos de asic
  if (nombreUpper.startsWith('ASIC') || nombreUpper.includes('ES-900') || nombreUpper === 'ES-9001' || nombreUpper === 'ASIC ES-9001') {
    // Si detectamos la asic correspondiente a Paracotos, devolvemos el nombre descriptivo comercial
    if (nombreUpper.includes('900') || nombreUpper.includes('ES-9001') || nombreUpper.includes('PARACOTOS')) {
      return "CLÍNICA POPULAR PARACOTOS";
    }
    // Si es otra ASIC y queremos un formato prolijo
    return `CDI / AMBULATORIO (${nombreUpper})`;
  }

  return nombreUpper;
};

interface DefuncionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function DefuncionForm({ onSuccess, onCancel }: DefuncionFormProps) {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    estado: 'MIRANDA',
    centro_salud: '',
    cedula_fallecido: '',
    nombre_fallecido: '',
    apellido_fallecido: '',
    edad_fallecido: '',
    sexo_fallecido: 'FEMENINO',
    hora_fallecimiento: '',
    patologia: '',
    observacion: '',
    cedula_medico: '',
    nombre_medico: '',
    apellido_medico: '',
    telefono_medico: ''
  });

  const [loadingFallecido, setLoadingFallecido] = useState(false);
  const [fallecidoEncontrado, setFallecidoEncontrado] = useState<boolean | null>(null);
  const [loadingMedico, setLoadingMedico] = useState(false);
  const [medicoEncontrado, setMedicoEncontrado] = useState<boolean | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sincronización real con Supabase
  const [centros, setCentros] = useState<string[]>([]);
  const [loadingCentros, setLoadingCentros] = useState(true);

  useEffect(() => {
    async function cargarCentros() {
      try {
        setLoadingCentros(true);
        const lista = await nominalService.obtenerCentrosSalud();
        setCentros(lista);
      } catch (err) {
        console.error("Error cargando centros:", err);
      } finally {
        setLoadingCentros(false);
      }
    }
    cargarCentros();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
  };

  const manejarBuscarFallecido = async () => {
    if (!formData.cedula_fallecido) return;
    setLoadingFallecido(true);
    setFallecidoEncontrado(null);
    try {
      const p = await nominalService.buscarPaciente(formData.cedula_fallecido);
      if (p) {
        setFormData(prev => ({
          ...prev,
          nombre_fallecido: p.nombre,
          apellido_fallecido: p.apellido,
          edad_fallecido: p.edad.toString(),
          sexo_fallecido: p.sexo
        }));
        setFallecidoEncontrado(true);
      } else {
        setFallecidoEncontrado(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFallecido(false);
    }
  };

  const manejarBuscarMedico = async () => {
    if (!formData.cedula_medico) return;
    setLoadingMedico(true);
    setMedicoEncontrado(null);
    try {
      const m = await nominalService.buscarMedico(formData.cedula_medico);
      if (m) {
        setFormData(prev => ({
          ...prev,
          nombre_medico: m.nombre,
          apellido_medico: m.apellido,
          telefono_medico: m.telefono
        }));
        setMedicoEncontrado(true);
      } else {
        setMedicoEncontrado(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMedico(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitLoading(true);
    try {
      await nominalService.guardarDefuncion(formData);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error guardando acta de defunción');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-slate-700 font-sans max-h-[80vh] overflow-y-auto px-1">
      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-200 text-[10.5px] font-bold flex items-center gap-2">
          <ShieldAlert size={14} /> {errorMsg}
        </div>
      )}

      {/* ESTABLECIMIENTO */}
      <div className="bg-slate-50/70 border border-slate-100 p-3.5 rounded-2xl space-y-3">
        <h4 className="text-[10px] font-black tracking-wider text-[#0B3D5C] uppercase flex items-center gap-1.5 border-b border-slate-200 pb-1.5 mb-2">
          <Landmark size={12} /> Datos del Establecimiento y Fecha
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">Fecha del Deceso *</label>
            <div className="relative">
              <input type="date" name="fecha" required value={formData.fecha} onChange={handleInputChange} className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold" />
              <Calendar size={13} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">Estado Territorial *</label>
            <input type="text" name="estado" readOnly value={formData.estado} className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase cursor-not-allowed" />
          </div>
          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5 flex items-center gap-1">
              <Activity size={11} /> Centro de Salud *
            </label>
            <select
              name="centro_salud"
              required
              disabled={loadingCentros}
              value={formData.centro_salud}
              onChange={handleInputChange}
              className={`w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold text-slate-900 uppercase focus:outline-none focus:border-blue-500 ${loadingCentros ? 'animate-pulse bg-slate-50' : ''}`}
            >
              <option value="" disabled className="text-slate-900 bg-white">
                {loadingCentros ? "SINCRONIZANDO..." : "SELECCIONE ESTABLECIMIENTO..."}
              </option>
              {centros.map((centro) => {
                const nombreFormateado = obtenerNombreLegible(centro);
                return (
                  <option key={nombreFormateado} value={nombreFormateado} className="text-slate-900 bg-white">
                    {nombreFormateado}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* FALLECIDO */}
      <div className="bg-slate-50/70 border border-slate-100 p-3.5 rounded-2xl space-y-3">
        <h4 className="text-[10px] font-black tracking-wider text-[#0B3D5C] uppercase flex items-center gap-1.5 border-b border-slate-200 pb-1.5 mb-2">
          <Skull size={12} /> Datos de la Persona Fallecida
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">Cédula (Opcional)</label>
            <div className="flex gap-1.5">
              <input type="text" name="cedula_fallecido" placeholder="V-00000000" value={formData.cedula_fallecido} onChange={handleInputChange} className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold" />
              <button type="button" onClick={manejarBuscarFallecido} disabled={loadingFallecido} className="px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl flex items-center justify-center cursor-pointer">
                {loadingFallecido ? <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-600 border-t-transparent animate-spin"></span> : <Search size={13} />}
              </button>
            </div>
            {fallecidoEncontrado === true && <span className="text-[8.5px] text-emerald-600 font-bold flex items-center gap-1 mt-1"><Check size={10}/> Datos hallados</span>}
            {fallecidoEncontrado === false && <span className="text-[8.5px] text-amber-600 font-bold flex items-center gap-1 mt-1"><Sparkles size={10}/> Nuevo expediente</span>}
          </div>
          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">Nombre(s) *</label>
            <input type="text" name="nombre_fallecido" required value={formData.nombre_fallecido} onChange={handleInputChange} className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase" />
          </div>
          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">Apellido(s) *</label>
            <input type="text" name="apellido_fallecido" required value={formData.apellido_fallecido} onChange={handleInputChange} className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">Edad al Fallecer *</label>
            <input type="number" name="edad_fallecido" required value={formData.edad_fallecido} onChange={handleInputChange} className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold" />
          </div>
          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">Sexo *</label>
            <select name="sexo_fallecido" required value={formData.sexo_fallecido} onChange={handleInputChange} className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold text-slate-700">
              <option value="FEMENINO">FEMENINO</option>
              <option value="MASCULINO">MASCULINO</option>
            </select>
          </div>
          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">Hora del Deceso *</label>
            <input type="time" name="hora_fallecimiento" required value={formData.hora_fallecimiento} onChange={handleInputChange} className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold" />
          </div>
        </div>
      </div>

      {/* DIAGNÓSTICO */}
      <div className="bg-slate-50/70 border border-slate-100 p-3.5 rounded-2xl space-y-3">
        <h4 className="text-[10px] font-black tracking-wider text-[#0B3D5C] uppercase flex items-center gap-1.5 border-b border-slate-200 pb-1.5 mb-2">
          <HeartIcon size={12} /> Diagnósticos y Patologías
        </h4>
        <div className="space-y-3">
          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">Causa de la Muerte *</label>
            <input type="text" name="patologia" placeholder="Causa básica o diagnóstico de defunción" required value={formData.patologia} onChange={handleInputChange} className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase" />
          </div>
          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">Observaciones Adicionales</label>
            <input type="text" name="observacion" placeholder="Detalles clínicos relevantes" value={formData.observacion} onChange={handleInputChange} className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase" />
          </div>
        </div>
      </div>

      {/* MÉDICO */}
      <div className="bg-slate-50/70 border border-slate-100 p-3.5 rounded-2xl space-y-3">
        <h4 className="text-[10px] font-black tracking-wider text-[#0B3D5C] uppercase flex items-center gap-1.5 border-b border-slate-200 pb-1.5 mb-2">
          <UserCog size={12} /> Datos del Médico Certificante
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">Cédula del Médico *</label>
            <div className="flex gap-1.5">
              <input type="text" name="cedula_medico" placeholder="V-00000000" required value={formData.cedula_medico} onChange={handleInputChange} className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold" />
              <button type="button" onClick={manejarBuscarMedico} disabled={loadingMedico} className="px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl flex items-center justify-center cursor-pointer">
                {loadingMedico ? <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-600 border-t-transparent animate-spin"></span> : <Search size={13} />}
              </button>
            </div>
            {medicoEncontrado === true && <span className="text-[8.5px] text-emerald-600 font-bold flex items-center gap-1 mt-1"><UserCheck size={10}/> Médico registrado</span>}
            {medicoEncontrado === false && <span className="text-[8.5px] text-amber-600 font-bold flex items-center gap-1 mt-1"><Sparkles size={10}/> Nuevo Médico</span>}
          </div>
          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">Nombre Médico *</label>
            <input type="text" name="nombre_medico" required value={formData.nombre_medico} onChange={handleInputChange} className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">Apellido Médico *</label>
            <input type="text" name="apellido_medico" required value={formData.apellido_medico} onChange={handleInputChange} className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase" />
          </div>
          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">Teléfono Médico</label>
            <input type="text" name="telefono_medico" placeholder="04xx-xxxxxxx" value={formData.telefono_medico} onChange={handleInputChange} className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold" />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-100 justify-end">
        <button type="button" onClick={onCancel} className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer">Cancelar</button>
        <button type="submit" disabled={submitLoading} className="flex items-center gap-2 px-6 py-3 bg-[#0B3D5C] hover:bg-[#082E47] text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md cursor-pointer">
          {submitLoading ? <span className="w-3.5 h-3.5 rounded-full border border-white border-t-transparent animate-spin block"></span> : <Save size={13} />} Guardar Nominal
        </button>
      </div>
    </form>
  );
}