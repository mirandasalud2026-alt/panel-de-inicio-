// components/ui/NominalFormWindow.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft, Save, RefreshCw, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type FormType = 'QUIRURGICA' | 'OBSTETRICA' | 'DEFUNCION';

export default function NominalFormWindow() {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-[#0B3D5C] text-white p-4 flex justify-between">
          <h2 className="font-bold">Formulario {type}</h2>
          <button onClick={() => window.close()} className="text-white"><ArrowLeft size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Fecha, estado, centro_salud */}
          <div className="grid grid-cols-3 gap-4">
            <div><label>Fecha</label><input type="date" name="fecha" value={formData.fecha} onChange={handleChange} className="border p-2 w-full" /></div>
            <div><label>Estado</label><input type="text" name="estado" value={formData.estado} disabled className="border p-2 w-full bg-gray-100" /></div>
            <div><label>Centro de Salud</label><input type="text" name="centro_salud" required onChange={handleChange} className="border p-2 w-full" /></div>
          </div>
          {/* Datos del paciente */}
          <div className="border-t pt-4">
            <h3 className="font-bold mb-2">Datos del paciente</h3>
            <div className="grid grid-cols-4 gap-4">
              <div><label>Cédula</label><div className="flex"><input name="cedula_paciente" onBlur={buscarPaciente} onChange={handleChange} className="border p-2 flex-1" /><button type="button" onClick={buscarPaciente}><Search size={16} /></button></div><span className="text-xs">{pacienteStatus}</span></div>
              <div><label>Nombre</label><input name="nombre_paciente" onChange={handleChange} className="border p-2 w-full" /></div>
              <div><label>Apellido</label><input name="apellido_paciente" onChange={handleChange} className="border p-2 w-full" /></div>
              <div><label>Edad</label><input name="edad" type="number" onChange={handleChange} className="border p-2 w-full" /></div>
              <div><label>Sexo</label><select name="sexo" onChange={handleChange}><option>FEMENINO</option><option>MASCULINO</option></select></div>
              <div><label>Teléfono</label><input name="telefono" onChange={handleChange} className="border p-2 w-full" /></div>
            </div>
          </div>
          {/* Campos específicos según tipo... (acortado por legibilidad) */}
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => window.close()} className="px-4 py-2 border rounded">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-[#0B3D5C] text-white rounded flex items-center gap-2">
              {loading ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />} Guardar
            </button>
          </div>
          {status && <div className={`p-2 rounded ${status.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>{status.text}</div>}
        </form>
      </div>
    </div>
  );
}