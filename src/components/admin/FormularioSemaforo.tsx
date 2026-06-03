import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Building2, 
  MapPin, 
  Clock, 
  Activity, 
  Save, 
  Calendar, 
  AlertCircle,
  TrendingUp,
  LayoutGrid
} from 'lucide-react';
import { motion } from 'motion/react';

interface FormularioSemaforoProps {
  onSuccess?: () => void;
}

export default function FormularioSemaforo({ onSuccess }: FormularioSemaforoProps) {
  // Estados para las Clínicas Populares desde Supabase
  const [clinicas, setClinicas] = useState<any[]>([]);
  const [loadingClinicas, setLoadingClinicas] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Efecto para buscar los datos al cargar el formulario
  useEffect(() => {
    const cargarClinicas = async () => {
      try {
        setLoadingClinicas(true);
        const { data, error } = await supabase
          .from('clinicas_populares')
          .select('id, nombre_establecimiento, asic, municipio')
          .order('nombre_establecimiento', { ascending: true });

        if (error) throw error;
        if (data) setClinicas(data);
      } catch (err) {
        console.error('Error cargando clínicas:', err);
      } finally {
        setLoadingClinicas(false);
      }
    };

    cargarClinicas();
  }, []);

  // Estado del Formulario
  const [formData, setFormData] = useState({
    id_centro: '',
    nombre_centro: '',
    asic: '',
    municipio: '',
    eje_geografico: 'ALTOS MIRANDINOS',
    estado_semaforo: 'Verde',
    horas_retraso: 0,
    ultimo_reporte: new Date().toISOString().split('T')[0]
  });

  // Manejar el cambio de Centro y rellenar automáticamente Municipio y ASIC
  const handleCentroChange = (centroId: string) => {
    if (!centroId) {
      setFormData(prev => ({
        ...prev,
        id_centro: '',
        nombre_centro: '',
        asic: '',
        municipio: ''
      }));
      return;
    }

    const clinica = clinicas.find(c => String(c.id) === String(centroId));
    
    if (clinica) {
      setFormData(prev => ({
        ...prev,
        id_centro: clinica.nombre_establecimiento || '',
        nombre_centro: clinica.nombre_establecimiento || '',
        asic: clinica.asic || '',           // Auto-rellena la ASIC real
        municipio: clinica.municipio || ''  // Auto-rellena el Municipio real
      }));
    } else {
      setFormData(prev => ({ ...prev, id_centro: centroId }));
    }
  };

  // Manejar cambios en otros campos
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'horas_retraso' ? parseInt(value) || 0 : value
    }));
  };

  // Guardar datos en la tabla transito_reportes de Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id_centro) {
      setStatusMsg({ type: 'error', text: 'Debe seleccionar un centro de salud.' });
      return;
    }

    setIsSaving(true);
    setStatusMsg(null);

    try {
      const payload = {
        id_centro: formData.id_centro,
        nombre_centro: formData.nombre_centro,
        asic: formData.asic,
        eje_geografico: formData.eje_geografico,
        estado_semaforo: formData.estado_semaforo,
        horas_retraso: formData.horas_retraso,
        ultimo_reporte: new Date(formData.ultimo_reporte).toISOString(),
        actualizado_en: new Date().toISOString()
      };

      const { error } = await supabase
        .from('transito_reportes')
        .upsert(payload, { onConflict: 'id_centro' });

      if (error) throw error;

      setStatusMsg({ type: 'success', text: '¡Estatus del Semáforo actualizado correctamente!' });
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error guardando estatus del semáforo:', err);
      setStatusMsg({ type: 'error', text: `Error al guardar: ${err.message || err}` });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 max-w-2xl mx-auto">
      {/* Cabecera del Formulario */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-2.5 bg-[#0B3D5C] text-white rounded-2xl shadow-sm">
          <Activity size={20} className="animate-pulse text-emerald-400" />
        </div>
        <div>
          <h2 className="text-sm font-black uppercase text-[#0B3D5C] tracking-tight leading-none mb-1">
            Formulario de Control de Semáforo
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Actualización Territorial de Tránsito de Reportes Clínicos
          </p>
        </div>
      </div>

      {/* Banner de Estado */}
      {statusMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 border ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
              : 'bg-rose-50 text-rose-800 border-rose-100'
          }`}
        >
          <AlertCircle size={14} className="shrink-0" />
          <span>{statusMsg.text}</span>
        </motion.div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Fila 1: Selector de Clínica / Centro de Salud */}
        <div className="space-y-1.5">
          <label className="text-[8.5px] font-black tracking-widest text-[#0B3D5C] uppercase block">
            <Building2 size={10} className="inline mr-1" /> Centro de Salud *
          </label>
          <select
            name="id_centro"
            value={clinicas.find(c => c.nombre_establecimiento === formData.id_centro)?.id || ''}
            onChange={(e) => handleCentroChange(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-[10.5px] font-bold focus:outline-none focus:border-[#0B3D5C] transition-colors cursor-pointer"
          >
            <option value="">Seleccione una clínica...</option>
            {loadingClinicas ? (
              <option disabled>Cargando establecimientos...</option>
            ) : (
              clinicas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre_establecimiento}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Fila 2: Relleno Automáticos ASIC y Municipio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block">
              <LayoutGrid size={10} className="inline mr-1" /> ASIC (Auto-completado)
            </label>
            <input 
              type="text" 
              name="asic"
              value={formData.asic}
              readOnly
              placeholder="Asignado automáticamente"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase text-slate-500 focus:outline-none select-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[8.5px] font-black tracking-widest text-slate-400 uppercase block">
              <MapPin size={10} className="inline mr-1" /> Municipio (Auto-completado)
            </label>
            <input 
              type="text" 
              name="municipio"
              value={formData.municipio}
              readOnly
              placeholder="Asignado automáticamente"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-bold uppercase text-slate-500 focus:outline-none select-none"
            />
          </div>
        </div>

        {/* Fila 3: Eje Geográfico y Estado del Semáforo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
          <div className="space-y-1.5">
            <label className="text-[8.5px] font-black tracking-widest text-[#0B3D5C] uppercase block">
              <MapPin size={10} className="inline mr-1" /> Eje Geográfico *
            </label>
            <select
              name="eje_geografico"
              value={formData.eje_geografico}
              onChange={handleInputChange}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-bold focus:outline-none focus:border-[#0B3D5C] cursor-pointer"
            >
              <option value="ALTOS MIRANDINOS">ALTOS MIRANDINOS</option>
              <option value="VALLES DEL TUY">VALLES DEL TUY</option>
              <option value="GUARENAS-GUATIRE">GUARENAS-GUATIRE</option>
              <option value="BARLOVENTO">BARLOVENTO</option>
              <option value="METROPOLITANO">METROPOLITANO</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[8.5px] font-black tracking-widest text-[#0B3D5C] uppercase block">
              <Activity size={10} className="inline mr-1" /> Estado del Semáforo *
            </label>
            <select
              name="estado_semaforo"
              value={formData.estado_semaforo}
              onChange={handleInputChange}
              className={`w-full border rounded-xl px-3 py-2 text-[10.5px] font-black uppercase tracking-wider focus:outline-none transition-all cursor-pointer ${
                formData.estado_semaforo === 'Verde' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                formData.estado_semaforo === 'Amarillo' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <option value="Verde">🟢 Verde (Cumple a Tiempo)</option>
              <option value="Amarillo">🟡 Amarillo (Con Retraso)</option>
              <option value="Rojo">🔴 Rojo (Crítico/Inactivo)</option>
            </select>
          </div>
        </div>

        {/* Fila 4: Horas de Retraso y Fecha del Último Reporte */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[8.5px] font-black tracking-widest text-[#0B3D5C] uppercase block">
              <Clock size={10} className="inline mr-1" /> Horas de Retraso
            </label>
            <input 
              type="number" 
              name="horas_retraso"
              value={formData.horas_retraso}
              onChange={handleInputChange}
              min="0"
              disabled={formData.estado_semaforo === 'Verde'}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-bold focus:outline-none focus:border-[#0B3D5C] disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[8.5px] font-black tracking-widest text-[#0B3D5C] uppercase block">
              <Calendar size={10} className="inline mr-1" /> Fecha de Último Reporte
            </label>
            <input 
              type="date" 
              name="ultimo_reporte"
              value={formData.ultimo_reporte}
              onChange={handleInputChange}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-bold focus:outline-none focus:border-[#0B3D5C]"
            />
          </div>
        </div>

        {/* Botonera de Guardar */}
        <div className="border-t border-slate-100 pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving || loadingClinicas}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0B3D5C] hover:bg-[#072437] disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            {isSaving ? (
              <>
                <Clock className="animate-spin" size={12} /> Guardando...
              </>
            ) : (
              <>
                <Save size={12} /> Guardar Estatus de Semáforo
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}