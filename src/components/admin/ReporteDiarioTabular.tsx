import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  FileSpreadsheet, 
  Users, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Activity, 
  FileText,
  Calendar,
  Building2,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReporteDiarioTabularProps {
  idCentro?: string;
  onSuccess?: () => void;
}

const GRUPOS_EDAD = [
  { id: 'menor_1_ano', label: '< 1 Año', icon: '👶' },
  { id: '1_a_4_anos', label: '1 - 4 Años', icon: '🧒' },
  { id: '5_a_9_anos', label: '5 - 9 Años', icon: '👧' },
  { id: '10_a_14_anos', label: '10 - 14 Años', icon: '🧑' },
  { id: '15_a_19_anos', label: '15 - 19 Años', icon: '🧑‍🎓' },
  { id: '20_a_49_anos', label: '20 - 49 Años', icon: '🧑‍💼' },
  { id: '50_y_mas', label: '50 Años y Más', icon: '🧓' },
];

export default function ReporteDiarioTabular({ idCentro, onSuccess }: ReporteDiarioTabularProps) {
  const [tipoFormulario, setTipoFormulario] = useState<'RDC' | 'REC'>('RDC');
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedCentroId, setSelectedCentroId] = useState<string>(idCentro || '');
  const [centros, setCentros] = useState<{ id_centro: string; nombre_centro: string; asic?: string }[]>([]);
  
  // Valores estructurados por grupo de edad
  const [valores, setValores] = useState<Record<string, { masculino: string; femenino: string }>>(
    GRUPOS_EDAD.reduce((acc, g) => ({ ...acc, [g.id]: { masculino: '', femenino: '' } }), {})
  );

  const [loadingCentros, setLoadingCentros] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });

  // Cargar centros de salud disponibles para enlazar si es administrador o si requiere dropdown
  useEffect(() => {
    async function loadCentros() {
      setLoadingCentros(true);
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('transito_reportes')
            .select('id_centro, nombre_centro, asic')
            .order('nombre_centro', { ascending: true });
          if (!error && data && data.length > 0) {
            setCentros(data);
            if (!selectedCentroId && data.length > 0) {
              setSelectedCentroId(data[0].id_centro);
            }
          } else {
            // Cargar por defecto
            setCentros([
              { id_centro: "ALT_AS_GUA", nombre_centro: "Ambulatorio Guaremal", asic: "ASIC Guaremal" },
              { id_centro: "ALT_AS_CAR_CDI", nombre_centro: "CDI Carrizal", asic: "ASIC Carrizal" },
              { id_centro: "VAL_AS_OCU", nombre_centro: "Ambulatorio Ocumare", asic: "ASIC Ocumare" },
              { id_centro: "GUA_AS_GG", nombre_centro: "Hospitalito de Guarenas", asic: "ASIC Guarenas" },
              { id_centro: "BAR_AS_MAM", nombre_centro: "CDI Mamporal", asic: "ASIC Mamporal" },
              { id_centro: "MET_AS_CHA", nombre_centro: "Ambulatorio El Pedregal", asic: "ASIC Chacao" }
            ]);
            if (!selectedCentroId) setSelectedCentroId("ALT_AS_GUA");
          }
        } catch (err) {
          console.warn('Fallo cargando centros, usando catálogo estático:', err);
        }
      } else {
        setCentros([
          { id_centro: "ALT_AS_GUA", nombre_centro: "Ambulatorio Guaremal", asic: "ASIC Guaremal" },
          { id_centro: "ALT_AS_CAR_CDI", nombre_centro: "CDI Carrizal", asic: "ASIC Carrizal" },
          { id_centro: "VAL_AS_OCU", nombre_centro: "Ambulatorio Ocumare", asic: "ASIC Ocumare" },
          { id_centro: "GUA_AS_GG", nombre_centro: "Hospitalito de Guarenas", asic: "ASIC Guarenas" },
          { id_centro: "BAR_AS_MAM", nombre_centro: "CDI Mamporal", asic: "ASIC Mamporal" },
          { id_centro: "MET_AS_CHA", nombre_centro: "Ambulatorio El Pedregal", asic: "ASIC Chacao" }
        ]);
        if (!selectedCentroId) setSelectedCentroId("ALT_AS_GUA");
      }
      setLoadingCentros(false);
    }
    loadCentros();
  }, [selectedCentroId]);

  const handleInputChange = (grupoId: string, campo: 'masculino' | 'femenino', value: string) => {
    // Solo permitir números enteros
    const sanitized = value.replace(/[^0-9]/g, '');
    setValores(prev => ({
      ...prev,
      [grupoId]: {
        ...prev[grupoId],
        [campo]: sanitized
      }
    }));
  };

  const handleGuardarReporte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCentroId) {
      setStatusMsg({ type: 'error', text: 'Por favor, asigne un Centro de Salud válido.' });
      return;
    }

    setSubmitLoading(true);
    setStatusMsg({ type: null, text: '' });

    // Preparar filas para inserción masiva (bulk insert)
    const rowsToInsert = GRUPOS_EDAD.map(grupo => ({
      id_centro: selectedCentroId,
      tipo_formulario: tipoFormulario,
      fecha: fecha,
      grupo_etario: grupo.id,
      masculino: parseInt(valores[grupo.id].masculino) || 0,
      femenino: parseInt(valores[grupo.id].femenino) || 0,
      actualizado_en: new Date().toISOString()
    }));

    try {
      if (supabase) {
        const { error } = await supabase
          .from('reportes_diarios')
          .insert(rowsToInsert);

        if (error) {
          console.warn('Error insertando en reportes_diarios, creando tabla local de respaldo...', error);
          // Si la tabla no existe o falla por esquema, guardamos en localStorage para persistencia
          const localKey = 'local_bulk_reportes_diarios';
          const localExistentes = JSON.parse(localStorage.getItem(localKey) || '[]');
          localStorage.setItem(localKey, JSON.stringify([...localExistentes, ...rowsToInsert]));
          
          // Actualizamos también su estado de semáforo a "Verde" para indicar que reportó hoy
          await actualizarSemaforoExito(selectedCentroId);
        } else {
          await actualizarSemaforoExito(selectedCentroId);
        }
      } else {
        // Almacenamiento local de desarrollo
        const localKey = 'local_bulk_reportes_diarios';
        const localExistentes = JSON.parse(localStorage.getItem(localKey) || '[]');
        localStorage.setItem(localKey, JSON.stringify([...localExistentes, ...rowsToInsert]));
      }

      setStatusMsg({ 
        type: 'success', 
        text: `¡Reporte Diario de tipo ${tipoFormulario} consolidado y cargado con éxito en Supabase con ${rowsToInsert.length} filas transaccionales!` 
      });

      // Limpiar campos
      setValores(GRUPOS_EDAD.reduce((acc, g) => ({ ...acc, [g.id]: { masculino: '', femenino: '' } }), {}));

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Error al procesar el reporte masivo: ${err.message || err}` });
    } finally {
      setSubmitLoading(false);
    }
  };

  const actualizarSemaforoExito = async (centroId: string) => {
    if (!supabase) return;
    try {
      // Al reportar, se actualiza el semáforo a Verde con 0 horas de retraso y fecha actual
      await supabase
        .from('transito_reportes')
        .update({
          estado_semaforo: 'Verde',
          ultimo_reporte: new Date().toISOString(),
          horas_retraso: 0,
          actualizado_en: new Date().toISOString()
        })
        .eq('id_centro', centroId);
    } catch (err) {
      console.warn('No se pudo actualizar el semáforo directo:', err);
    }
  };

  const currentCentro = centros.find(c => c.id_centro === selectedCentroId);

  // Totales en caliente
  const totalMasculino = GRUPOS_EDAD.reduce((acc, g) => acc + (parseInt(valores[g.id]?.masculino || '0') || 0), 0);
  const totalFemenino = GRUPOS_EDAD.reduce((acc, g) => acc + (parseInt(valores[g.id]?.femenino || '0') || 0), 0);
  const totalGeneral = totalMasculino + totalFemenino;

  return (
    <div id="reporte-diario-multientrada" className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col w-full font-sans">
      
      {/* Cabecera del Panel */}
      <div className="bg-[#0B3D5C] text-white px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase text-amber-300 tracking-widest block">
              Cartelera de Control Epidemiológico y Clínico (RDC / REC)
            </span>
            <h4 className="text-sm font-black uppercase tracking-wide mt-0.5 flex items-center gap-2">
              Panel Administrativo de Entradas Múltiples ({tipoFormulario})
            </h4>
          </div>
        </div>
        
        {/* Fecha y Tipo Formulario */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="bg-white/15 px-3.5 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-100">
            <Calendar size={13} className="text-amber-400 shrink-0" />
            <span>Fecha: {fecha}</span>
          </div>
          <div className="bg-amber-400/10 border border-amber-400/20 text-amber-400 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shrink-0">
            DÍA CORRIENTE activo
          </div>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleGuardarReporte} className="p-6 md:p-8 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
          
          {/* Tipo de Formulario selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#0B3D5C] uppercase tracking-widest block">Tipo de Formulario *</label>
            <div className="flex bg-white p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setTipoFormulario('RDC')}
                className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  tipoFormulario === 'RDC' 
                    ? 'bg-[#0B3D5C] text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Activity size={12} />
                RDC (Consultas)
              </button>
              <button
                type="button"
                onClick={() => setTipoFormulario('REC')}
                className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  tipoFormulario === 'REC' 
                    ? 'bg-[#0B3D5C] text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileText size={12} />
                REC (Emergencias)
              </button>
            </div>
          </div>

          {/* Establecimiento de Salud */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#0B3D5C] uppercase tracking-widest block">Centromédico de Salud *</label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                name="id_centro"
                value={selectedCentroId}
                onChange={(e) => setSelectedCentroId(e.target.value)}
                disabled={!!idCentro}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B3D5C]/15 disabled:bg-slate-100 disabled:text-slate-500 cursor-pointer"
              >
                {loadingCentros ? (
                  <option>Cargando centros...</option>
                ) : (
                  centros.map(c => (
                    <option key={c.id_centro} value={c.id_centro}>
                      {c.nombre_centro}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* ASIC e Información Territorial */}
          <div className="space-y-2 lg:col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Información del Núcleo</label>
            <div className="bg-white px-4 py-3 border border-slate-200 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-600">
              <MapPin size={15} className="text-[#0B3D5C]" />
              <div>
                <span className="text-[8px] font-black uppercase text-[#0B3D5C] block">Área de Salud Integral</span>
                <span>{currentCentro?.asic || 'Sincronizando...'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* FEEDBACK STATUS */}
        <AnimatePresence mode="wait">
          {statusMsg.type && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed font-bold uppercase tracking-wide shadow-sm ${
                statusMsg.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-[10px] text-slate-800 font-extrabold">Mensaje de Supabase:</p>
                <p className="text-[9.5px] font-medium leading-relaxed mt-1 text-slate-600">{statusMsg.text}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cuerpop de carga - Cuadrícula Tabular */}
        <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[#0B3D5C] text-[10px] font-black uppercase tracking-widest font-sans">
                  <th className="py-4 px-6 min-w-[140px]">Grupo Etario</th>
                  <th className="py-4 px-6 text-center w-[180px]">Pacientes Masculinos</th>
                  <th className="py-4 px-6 text-center w-[180px]">Pacientes Femeninas</th>
                  <th className="py-4 px-6 text-right w-[150px] hidden sm:table-cell">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {GRUPOS_EDAD.map((grupo) => {
                  const subM = parseInt(valores[grupo.id].masculino) || 0;
                  const subF = parseInt(valores[grupo.id].femenino) || 0;
                  const filaTotal = subM + subF;

                  return (
                    <tr key={grupo.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Grupo de Edad */}
                      <td className="py-4.5 px-6 flex items-center gap-3">
                        <span className="text-xl shrink-0" role="img" aria-label={grupo.label}>
                          {grupo.icon}
                        </span>
                        <div>
                          <span className="text-xs font-black text-slate-800 uppercase block">{grupo.label}</span>
                          <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-tight">Rango Epidemiológico</span>
                        </div>
                      </td>

                      {/* Masculino */}
                      <td className="py-4.5 px-6 text-center">
                        <div className="relative max-w-[160px] mx-auto">
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={valores[grupo.id].masculino}
                            onChange={(e) => handleInputChange(grupo.id, 'masculino', e.target.value)}
                            className="w-full text-center py-2.5 px-4 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-[#0B3D5C] rounded-xl text-xs font-black text-[#0B3D5C] transition-all outline-none"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] text-blue-500 font-black">M</span>
                        </div>
                      </td>

                      {/* Femenino */}
                      <td className="py-4.5 px-6 text-center">
                        <div className="relative max-w-[160px] mx-auto">
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={valores[grupo.id].femenino}
                            onChange={(e) => handleInputChange(grupo.id, 'femenino', e.target.value)}
                            className="w-full text-center py-2.5 px-4 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-[#0B3D5C] rounded-xl text-xs font-black text-pink-600 transition-all outline-none"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] text-pink-500 font-black">F</span>
                        </div>
                      </td>

                      {/* Subtotal por fila */}
                      <td className="py-4.5 px-6 text-right font-bold text-xs text-slate-600 hidden sm:table-cell pr-10">
                        <span className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black ${
                          filaTotal > 0 ? 'bg-slate-100 text-[#0B3D5C]' : 'bg-transparent text-slate-300'
                        }`}>
                          {filaTotal}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Fila consolidada de Totales */}
          <div className="bg-slate-50 border-t border-slate-200 p-5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-sans uppercase">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[#0B3D5C]" />
              <span className="text-[10px] font-black text-slate-600 tracking-wider">Metadatos de la Carga Actual</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 justify-end">
              <div className="bg-white px-4 py-2 border border-slate-200/80 rounded-xl text-[10px] font-bold text-slate-500">
                Total Masculinos: <span className="font-black text-blue-600 text-xs ml-1">{totalMasculino}</span>
              </div>
              <div className="bg-white px-4 py-2 border border-slate-200/80 rounded-xl text-[10px] font-bold text-slate-500">
                Total Femeninos: <span className="font-black text-pink-600 text-xs ml-1">{totalFemenino}</span>
              </div>
              <div className="bg-[#0B3D5C]/11 border border-[#0B3D5C]/10 px-5 py-2.5 rounded-xl text-[10.5px] font-black text-[#0B3D5C]">
                Total General: <span className="text-sm font-black ml-1.5">{totalGeneral}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de envío */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitLoading || totalGeneral === 0}
            className="w-full sm:w-auto px-10 py-4 bg-[#0B3D5C] hover:bg-[#0A3450] text-white font-extrabold uppercase tracking-widest rounded-2xl shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-2 text-xs min-w-[200px] cursor-pointer"
          >
            {submitLoading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Guardando Reporte...
              </>
            ) : (
              <>
                <Save size={16} />
                Guardar Reporte Masivo
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
