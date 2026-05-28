import React, { useState } from 'react';
import { nominalService, Paciente, Medico } from '../../services/nominalService';
import { Save, User, UserCheck, ShieldAlert, Check, Search, Calendar, Landmark, Activity, Sparkles, UserCog, Baby } from 'lucide-react';

interface ObstetricaFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ObstetricaForm({ onSuccess, onCancel }: ObstetricaFormProps) {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    estado: 'MIRANDA',
    centro_salud: '',
    cedula_madre: '',
    nombre_madre: '',
    apellido_madre: '',
    edad_madre: '',
    telefono_madre: '',
    nombre_infante: '',
    sexo_infante: 'FEMENINO',
    tipo_parto: 'EUTÓCICO', // EUTÓCICO/DISTÓCICO
    tipo_intervencion: 'NATURAL', // NATURAL/CESÁREA
    cedula_medico: '',
    nombre_medico: '',
    apellido_medico: '',
    telefono_medico: ''
  });

  const [loadingMadre, setLoadingMadre] = useState(false);
  const [madreEncontrado, setMadreEncontrado] = useState<boolean | null>(null);

  const [loadingMedico, setLoadingMedico] = useState(false);
  const [medicoEncontrado, setMedicoEncontrado] = useState<boolean | null>(null);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sincronizar búsqueda de la madre (paciente)
  const buscarMadre = async (cedula: string) => {
    if (!cedula.trim()) return;
    setLoadingMadre(true);
    setErrorMsg('');
    try {
      const res = await nominalService.buscarPaciente(cedula);
      if (res) {
        setFormData(prev => ({
          ...prev,
          nombre_madre: res.nombre,
          apellido_madre: res.apellido,
          edad_madre: res.edad.toString(),
          telefono_madre: res.telefono || ''
        }));
        setMadreEncontrado(true);
      } else {
        setMadreEncontrado(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMadre(false);
    }
  };

  // Sincronizar búsqueda del médico
  const buscarMedico = async (cedula: string) => {
    if (!cedula.trim()) return;
    setLoadingMedico(true);
    setErrorMsg('');
    try {
      const res = await nominalService.buscarMedico(cedula);
      if (res) {
        setFormData(prev => ({
          ...prev,
          nombre_medico: res.nombre,
          apellido_medico: res.apellido,
          telefono_medico: res.telefono || ''
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.centro_salud || !formData.cedula_madre || !formData.nombre_madre || !formData.cedula_medico || !formData.nombre_medico) {
      setErrorMsg('Por favor complete todos los campos obligatorios (*)');
      return;
    }

    setSubmitLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await nominalService.guardarObstetrica({
        ...formData,
        edad_madre: parseInt(formData.edad_madre) || 0
      });
      setSuccessMsg('¡Nómina Obstétrica guardada con éxito y ledger temporario compilado!');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar el registro');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-sans">
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold uppercase tracking-wider rounded-xl flex items-center gap-2">
          <ShieldAlert size={14} className="shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black uppercase tracking-wider rounded-xl flex items-center gap-2">
          <Check size={14} className="shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-100 font-sans">
        <div>
          <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5 flex items-center gap-1">
            <Calendar size={11} /> Fecha de Parto *
          </label>
          <input
            type="date"
            name="fecha"
            required
            value={formData.fecha}
            onChange={handleInputChange}
            className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold"
          />
        </div>

        <div>
          <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5 flex items-center gap-1">
            <Landmark size={11} /> Estado Territorial
          </label>
          <input
            type="text"
            name="estado"
            disabled
            value={formData.estado}
            className="w-full bg-slate-100/60 border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold text-slate-400 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="text-[8.5px] font-black tracking-widest text-[#0B3D5C] uppercase block mb-1.5 flex items-center gap-1">
            <Activity size={11} /> Centro de Salud *
          </label>
          <input
            type="text"
            name="centro_salud"
            required
            placeholder="Ej: MATERNIDAD DE CARRIZAL"
            value={formData.centro_salud}
            onChange={handleInputChange}
            className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold placeholder:text-gray-300 uppercase animate-pulse"
          />
        </div>
      </div>

      {/* BLOQUE DE DATOS DE LA MADRE */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-1">
          <span className="p-1 px-1.5 rounded-lg bg-[#0B3D5C]/15 text-[#0B3D5C] font-black text-[9px] uppercase">
            MADRE
          </span>
          <h4 className="text-[10px] font-black uppercase text-[#0B3D5C] tracking-wide">Ficha de la Madre Obstétrica</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
              Cédula de la Madre *
            </label>
            <div className="relative">
              <input
                type="text"
                name="cedula_madre"
                required
                placeholder="Ej: V-15987456"
                value={formData.cedula_madre}
                onBlur={() => buscarMadre(formData.cedula_madre)}
                onChange={handleInputChange}
                className="w-full bg-white border border-slate-205 rounded-xl pl-3 pr-10 py-2 text-[10.5px] font-bold uppercase"
              />
              <button
                type="button"
                onClick={() => buscarMadre(formData.cedula_madre)}
                disabled={loadingMadre}
                className="absolute right-2 top-1.5 text-[#0B3D5C]"
              >
                {loadingMadre ? (
                  <span className="w-4 h-4 rounded-full border border-[#0B3D5C] border-t-transparent animate-spin block" />
                ) : (
                  <Search size={14} />
                )}
              </button>
            </div>
            {madreEncontrado === true && (
              <span className="text-[7.5px] text-emerald-600 font-extrabold uppercase mt-1 flex items-center gap-0.5 animate-pulse">
                <UserCheck size={10} /> Precargado de Base de Datos
              </span>
            )}
            {madreEncontrado === false && (
              <span className="text-[7.5px] text-amber-600 font-extrabold uppercase mt-1 flex items-center gap-0.5 animate-pulse">
                <Sparkles size={10} /> Nueva - Se registrará al guardar
              </span>
            )}
          </div>

          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
              Nombre de la Madre *
            </label>
            <input
              type="text"
              name="nombre_madre"
              required
              value={formData.nombre_madre}
              onChange={handleInputChange}
              className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase"
            />
          </div>

          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
              Apellido de la Madre *
            </label>
            <input
              type="text"
              name="apellido_madre"
              required
              value={formData.apellido_madre}
              onChange={handleInputChange}
              className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase"
            />
          </div>

          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
              Edad de la Madre *
            </label>
            <input
              type="number"
              name="edad_madre"
              required
              min="0"
              max="100"
              value={formData.edad_madre}
              onChange={handleInputChange}
              className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold"
            />
          </div>

          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
              Teléfono de Contacto
            </label>
            <input
              type="text"
              name="telefono_madre"
              placeholder="04xx-xxxxxxx"
              value={formData.telefono_madre}
              onChange={handleInputChange}
              className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold"
            />
          </div>
        </div>
      </div>

      {/* BLOQUE ASOCIADO AL INFANTE Y PARTO */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-1">
          <span className="p-1 px-1.5 rounded-lg bg-pink-50 text-pink-700 font-black text-[9px] uppercase">
            PARTO / INFANTE
          </span>
          <h4 className="text-[10px] font-black uppercase text-[#0B3D5C] tracking-wide">Ficha del Recién Nacido</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
              Nombre del Infante Nacido *
            </label>
            <input
              type="text"
              name="nombre_infante"
              required
              placeholder="Ej: NEONATO DE MARÍA GONZÁLEZ"
              value={formData.nombre_infante}
              onChange={handleInputChange}
              className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase"
            />
          </div>

          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
              Sexo del Infante *
            </label>
            <select
              name="sexo_infante"
              required
              value={formData.sexo_infante}
              onChange={handleInputChange}
              className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold"
            >
              <option value="FEMENINO">FEMENINO</option>
              <option value="MASCULINO">MASCULINO</option>
              <option value="INDETERMINADO">INDETERMINADO</option>
            </select>
          </div>

          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
              Tipo de Parto *
            </label>
            <select
              name="tipo_parto"
              required
              value={formData.tipo_parto}
              onChange={handleInputChange}
              className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold"
            >
              <option value="EUTÓCICO">EUTÓCICO (VAGINAL SIMPLE)</option>
              <option value="DISTÓCICO">DISTÓCICO (CON DIFICULTADES)</option>
            </select>
          </div>

          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
              Tipo de Intervención *
            </label>
            <select
              name="tipo_intervencion"
              required
              value={formData.tipo_intervencion}
              onChange={handleInputChange}
              className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold"
            >
              <option value="NATURAL">NATURAL (VAGINAL SIN CIRUGÍA)</option>
              <option value="CESÁREA">CESÁREA (QUIRÚRGICO)</option>
            </select>
          </div>
        </div>
      </div>

      {/* BLOQUE MEDICO */}
      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-4">
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-1">
          <span className="p-1 px-1.5 rounded-lg bg-indigo-50 text-indigo-705 font-black text-[9px] uppercase font-sans">
            MÉDICO
          </span>
          <h4 className="text-[10px] font-black uppercase text-[#0B3D5C] tracking-wide">Ficha del Obstetra de Turno</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
              Cédula Médico Obstetra *
            </label>
            <div className="relative">
              <input
                type="text"
                name="cedula_medico"
                required
                placeholder="Ej: V-22222222"
                value={formData.cedula_medico}
                onBlur={() => buscarMedico(formData.cedula_medico)}
                onChange={handleInputChange}
                className="w-full bg-white border border-slate-205 rounded-xl pl-3 pr-10 py-2 text-[10.5px] font-bold uppercase"
              />
              <button
                type="button"
                onClick={() => buscarMedico(formData.cedula_medico)}
                disabled={loadingMedico}
                className="absolute right-2 top-1.5 text-indigo-600"
              >
                {loadingMedico ? (
                  <span className="w-4 h-4 rounded-full border border-indigo-650 border-t-transparent animate-spin block" />
                ) : (
                  <Search size={14} />
                )}
              </button>
            </div>
            {medicoEncontrado === true && (
              <span className="text-[7.5px] text-emerald-600 font-extrabold uppercase mt-1 flex items-center gap-0.5">
                <UserCheck size={10} /> Precargado de Base de Datos
              </span>
            )}
            {medicoEncontrado === false && (
              <span className="text-[7.5px] text-indigo-600 font-extrabold uppercase mt-1 flex items-center gap-0.5 animate-pulse">
                <UserCog size={10} /> Médico Nuevo - Se registrará al confirmar
              </span>
            )}
          </div>

          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
              Nombre Médico *
            </label>
            <input
              type="text"
              name="nombre_medico"
              required
              value={formData.nombre_medico}
              onChange={handleInputChange}
              className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase"
            />
          </div>

          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
              Apellido Médico *
            </label>
            <input
              type="text"
              name="apellido_medico"
              required
              value={formData.apellido_medico}
              onChange={handleInputChange}
              className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase"
            />
          </div>

          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
              Teléfono Médico
            </label>
            <input
              type="text"
              name="telefono_medico"
              placeholder="04xx-xxxxxxx"
              value={formData.telefono_medico}
              onChange={handleInputChange}
              className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold"
            />
          </div>
        </div>
      </div>

      {/* BOTONERA ACCIÓN */}
      <div className="flex gap-3 pt-4 border-t border-slate-100 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer font-sans"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitLoading}
          className="flex items-center gap-2 px-6 py-3 bg-[#0B3D5C] hover:bg-[#082E47] text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md cursor-pointer font-sans"
        >
          {submitLoading ? (
            <span className="w-3.5 h-3.5 rounded-full border border-white border-t-transparent animate-spin block" />
          ) : (
            <Save size={14} />
          )}
          <span>Guardar Registro Obstétrico</span>
        </button>
      </div>
    </form>
  );
}
