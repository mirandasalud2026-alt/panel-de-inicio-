import React, { useState } from 'react';
import { nominalService, Paciente, Medico } from '../../services/nominalService';
import { Save, User, UserCheck, ShieldAlert, Check, Search, Calendar, Landmark, Activity, Sparkles, UserCog, HeartIcon, Skull } from 'lucide-react';

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
  const [successMsg, setSuccessMsg] = useState('');

  // Sincronizar búsqueda del fallecido (se busca en la tabla pacientes)
  const buscarFallecido = async (cedula: string) => {
    if (!cedula.trim()) return;
    setLoadingFallecido(true);
    setErrorMsg('');
    try {
      const res = await nominalService.buscarPaciente(cedula);
      if (res) {
        setFormData(prev => ({
          ...prev,
          nombre_fallecido: res.nombre,
          apellido_fallecido: res.apellido,
          edad_fallecido: res.edad.toString(),
          sexo_fallecido: res.sexo
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.centro_salud || !formData.nombre_fallecido || !formData.apellido_fallecido || !formData.cedula_medico || !formData.nombre_medico || !formData.patologia) {
      setErrorMsg('Por favor complete todos los campos obligatorios (*)');
      return;
    }

    setSubmitLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await nominalService.guardarDefuncion({
        ...formData,
        edad_fallecido: parseInt(formData.edad_fallecido) || 0
      });
      setSuccessMsg('¡Nómina de Defunción cargada correctamente y archivada para purga semanal!');
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
            <Calendar size={11} /> Fecha de Defunción *
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
            placeholder="Ej: HOSPITAL VICTORINO SANTAELLA"
            value={formData.centro_salud}
            onChange={handleInputChange}
            className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold placeholder:text-gray-300 uppercase"
          />
        </div>
      </div>

      {/* BLOQUE DE DATOS DEL FALLEcido */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-1">
          <span className="p-1 px-1.5 rounded-lg bg-slate-900 text-white font-black text-[9px] uppercase">
            FALLECIDO
          </span>
          <h4 className="text-[10px] font-black uppercase text-[#0B3D5C] tracking-wide">Ficha del Fallecido</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
              Cédula Fallecido
            </label>
            <div className="relative">
              <input
                type="text"
                name="cedula_fallecido"
                placeholder="Ej: V-12345678 (Opcional)"
                value={formData.cedula_fallecido}
                onBlur={() => buscarFallecido(formData.cedula_fallecido)}
                onChange={handleInputChange}
                className="w-full bg-white border border-slate-205 rounded-xl pl-3 pr-10 py-2 text-[10.5px] font-bold uppercase"
              />
              <button
                type="button"
                onClick={() => buscarFallecido(formData.cedula_fallecido)}
                disabled={loadingFallecido}
                className="absolute right-2 top-1.5 text-slate-500"
              >
                {loadingFallecido ? (
                  <span className="w-4 h-4 rounded-full border border-slate-500 border-t-transparent animate-spin block" />
                ) : (
                  <Search size={14} />
                )}
              </button>
            </div>
            {fallecidoEncontrado === true && (
              <span className="text-[7.5px] text-emerald-600 font-extrabold uppercase mt-1 flex items-center gap-0.5 animate-pulse">
                <UserCheck size={10} /> Precargado de Base de Datos
              </span>
            )}
            {fallecidoEncontrado === false && (
              <span className="text-[7.5px] text-amber-600 font-extrabold uppercase mt-1 flex items-center gap-0.5 animate-pulse">
                <Sparkles size={10} /> Nuevo - Se guardará como paciente
              </span>
            )}
          </div>

          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
              Nombre Fallecido *
            </label>
            <input
              type="text"
              name="nombre_fallecido"
              required
              value={formData.nombre_fallecido}
              onChange={handleInputChange}
              className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase"
            />
          </div>

          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
              Apellido Fallecido *
            </label>
            <input
              type="text"
              name="apellido_fallecido"
              required
              value={formData.apellido_fallecido}
              onChange={handleInputChange}
              className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase"
            />
          </div>

          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
              Edad al Fallecer *
            </label>
            <input
              type="number"
              name="edad_fallecido"
              required
              min="0"
              max="130"
              value={formData.edad_fallecido}
              onChange={handleInputChange}
              className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold"
            />
          </div>

          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
              Sexo *
            </label>
            <select
              name="sexo_fallecido"
              required
              value={formData.sexo_fallecido}
              onChange={handleInputChange}
              className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold"
            >
              <option value="FEMENINO">FEMENINO</option>
              <option value="MASCULINO">MASCULINO</option>
            </select>
          </div>
        </div>
      </div>

      {/* DETALLES DE DEFUNCIÓN */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-1">
          <span className="p-1 px-1.5 rounded-lg bg-rose-50 text-rose-700 font-black text-[9px] uppercase">
            CERTIFICACIÓN CLÍNICA
          </span>
          <h4 className="text-[10px] font-black uppercase text-[#0B3D5C] tracking-wide">Fisiopatología y Hora</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
              Hora de Fallecimiento *
            </label>
            <input
              type="text"
              name="hora_fallecimiento"
              required
              placeholder="Ej: 14:35"
              value={formData.hora_fallecimiento}
              onChange={handleInputChange}
              className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold"
            />
          </div>

          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
              Patología / Causa de Muerte *
            </label>
            <input
              type="text"
              name="patologia"
              required
              placeholder="Ej: INFARTO AGUDO AL MIOCARDIO"
              value={formData.patologia}
              onChange={handleInputChange}
              className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
              Observaciones del Diagnóstico
            </label>
            <textarea
              name="observacion"
              rows={2}
              placeholder="Ingrese notas clínicas adicionales relevantes..."
              value={formData.observacion}
              onChange={handleInputChange}
              className="w-full bg-white border border-slate-205 rounded-xl p-3 text-[10.5px] font-bold placeholder:text-gray-300"
            />
          </div>
        </div>
      </div>

      {/* BLOQUE MEDICO CERTIFICANTE */}
      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-4">
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-1">
          <span className="p-1 px-1.5 rounded-lg bg-indigo-50 text-indigo-705 font-black text-[9px] uppercase">
            MÉDICO
          </span>
          <h4 className="text-[10px] font-black uppercase text-[#0B3D5C] tracking-wide">Ficha del Facultativo que Certifica</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block mb-1.5">
              Cédula Médico Certificante *
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
                  <span className="w-4 h-4 rounded-full border border-indigo-600 border-t-transparent animate-spin block" />
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
          <span>Guardar Registro de Defunción</span>
        </button>
      </div>
    </form>
  );
}
