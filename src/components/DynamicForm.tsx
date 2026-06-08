// src/components/DynamicForm.tsx
import React, { useState } from 'react';
import { ConfiguracionModulo } from '../types/admin';
import { PlusCircle, Info, Calendar, List, AlignLeft, CheckSquare, Hash } from 'lucide-react';

interface DynamicFormProps {
  config: ConfiguracionModulo;
  onSubmit: (data: Record<string, any>) => Promise<void>;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({ config, onSubmit }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (campoId: string, value: any, requerido: boolean) => {
    setFormData(prev => ({ ...prev, [campoId]: value }));
    
    // Validar en tiempo real
    if (requerido && (value === undefined || value === null || value === '')) {
      setErrors(prev => ({ ...prev, [campoId]: 'Este campo es obligatorio e indispensable' }));
    } else {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[campoId];
        return copy;
      });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validar todos los campos requeridos
    const newErrors: Record<string, string> = {};
    config.estructura.forEach(field => {
      const val = formData[field.campo_id];
      if (field.requerido && (val === undefined || val === null || val === '')) {
        newErrors[field.campo_id] = `El campo "${field.etiqueta || field.campo_id}" es obligatorio.`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(formData);
      setFormData({}); // Limpiar formulario
      alert('¡Registro y flujos de respaldo ejecutados con éxito!');
    } catch (err: any) {
      alert(`Error al procesar: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIconForType = (tipo: string) => {
    switch (tipo) {
      case 'number': return <Hash size={12} className="text-slate-400" />;
      case 'date': return <Calendar size={12} className="text-slate-400" />;
      case 'select': return <List size={12} className="text-slate-400" />;
      case 'boolean': return <CheckSquare size={12} className="text-slate-400" />;
      default: return <AlignLeft size={12} className="text-slate-400" />;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden font-sans">
      {/* CABECERA FORMULARIO */}
      <div className="bg-[#0B3D5C] text-white p-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{config.meta_datos.icono || '📋'}</span>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider">
              {config.meta_datos.tabla_nombre}
            </h3>
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-0.5">
              {config.meta_datos.descripcion}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="bg-white/10 text-[9px] uppercase tracking-wide font-mono px-2.5 py-1 rounded-xl">
            Modulo Dinámico
          </span>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
        {/* POLÍTICAS ACTIVAS DEL MÓDULO */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-start gap-2.5">
          <Info size={14} className="text-slate-500 mt-0.5 shrink-0" />
          <div className="text-[9px] text-slate-500 uppercase tracking-wide space-y-0.5 font-bold">
            <p className="text-slate-700">Políticas activas para este reporte:</p>
            <p>• Espejo en Sheets: <strong className={config.politica_respaldo.sincronizar_sheets ? 'text-green-600' : 'text-slate-400'}>{config.politica_respaldo.sincronizar_sheets ? 'HASTA SHEET ACTUADO' : 'NO SINCRONIZADO'}</strong></p>
            <p>• Retención Supabase: <strong className="text-[#0B3D5C]">{config.politica_respaldo.tiempo_retencion_supabase_meses === 0 ? 'ILIMITADA / PERPETUA' : `${config.politica_respaldo.tiempo_retencion_supabase_meses} MESES`}</strong></p>
            <p>• Archivo Muerto: <strong className="text-amber-700">{config.politica_respaldo.destino_archivo_muerto === 'local_server_csv' ? 'EXPORTAR A CSV LOCAL' : 'NINGUNA'}</strong></p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {config.estructura.map(field => {
            const hasError = !!errors[field.campo_id];
            return (
              <div key={field.campo_id} className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    {getIconForType(field.tipo_dato)}
                    {field.etiqueta || field.campo_id}
                  </span>
                  {field.requerido && <span className="text-rose-500 text-[8px] font-extrabold">* obligatorio</span>}
                </label>

                {field.tipo_dato === 'select' ? (
                  <select
                    value={formData[field.campo_id] || ''}
                    onChange={(e) => handleInputChange(field.campo_id, e.target.value, field.requerido)}
                    className={`w-full bg-slate-50 border ${hasError ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-[#0B3D5C]'} rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#0B3D5C]/15`}
                  >
                    <option value="">-- Selecciona una opción --</option>
                    {field.opciones?.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : field.tipo_dato === 'boolean' ? (
                  <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData[field.campo_id]}
                      onChange={(e) => handleInputChange(field.campo_id, e.target.checked, field.requerido)}
                      className="rounded border-slate-200 text-[#0B3D5C] focus:ring-[#0B3D5C]/15"
                    />
                    <span className="text-xs font-bold text-slate-700">Verdadero / Cumple</span>
                  </label>
                ) : (
                  <input
                    type={field.tipo_dato === 'date' ? 'date' : field.tipo_dato === 'number' ? 'number' : 'text'}
                    value={formData[field.campo_id] || ''}
                    onChange={(e) => handleInputChange(field.campo_id, e.target.value, field.requerido)}
                    placeholder={`Ingresa ${field.etiqueta || field.campo_id}...`}
                    className={`w-full bg-slate-50 border ${hasError ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-[#0B3D5C]'} rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#0B3D5C]/15`}
                  />
                )}

                {hasError && (
                  <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest leading-none mt-0.5">
                    {errors[field.campo_id]}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#0B3D5C] hover:bg-[#072437] text-white py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <PlusCircle size={14} />
          {isSubmitting ? 'Procesando tuberías...' : 'Enviar Reporte Dinámico'}
        </button>
      </form>
    </div>
  );
};
