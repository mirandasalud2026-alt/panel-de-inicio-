import React, { useEffect, useState } from 'react';
import { EjeDisplayData } from '../../types/salud';
import { supabase as localSupabase } from '../../lib/supabase';

interface EjesManagerProps {
  supabase?: any;
  onEjeSelect?: (codEje: string) => void;
}

const EjesManager: React.FC<EjesManagerProps> = ({ supabase: supabaseProp, onEjeSelect }) => {
  const supabase = supabaseProp || localSupabase;
  const [ejes, setEjes] = useState<EjeDisplayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEjesData();
  }, []);

  const fetchEjesData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('TEjes')
        .select(`
          cod_eje,
          nombre_eje,
          poblacion_estimada,
          total_asics_oficial,
          total_cdis_oficial,
          responsable,
          contacto_emergencia,
          cumplimiento_global
        `);

      if (error) throw error;

      const mappedData: EjeDisplayData[] = data.map((row: any) => ({
        cod_eje: row.cod_eje,
        nombre_eje: row.nombre_eje,
        poblacion_estimada: row.poblacion_estimada || 0,
        responsable: row.responsable || "Sin Asignar",
        contacto_emergencia: row.contacto_emergencia || "Por definir",
        total_asics_oficial: row.total_asics_oficial || 0,
        total_cdis_oficial: row.total_cdis_oficial || 0,
        cumplimiento_global: row.cumplimiento_global || 100
      }));

      setEjes(mappedData);
    } catch (err: any) {
      console.error("Error cargando ejes:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando ejes de salud...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>Error: {error}</p>
        <button 
          onClick={fetchEjesData}
          className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {ejes.map((eje) => (
        <div
          key={eje.cod_eje}
          onClick={() => onEjeSelect && onEjeSelect(eje.cod_eje)}
          className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer overflow-hidden border border-gray-200"
        >
          <div className="bg-gradient-to-r from-green-600 to-green-800 p-4">
            <h3 className="text-xl font-bold text-white">{eje.nombre_eje}</h3>
            <p className="text-green-100 text-sm">Código: {eje.cod_eje}</p>
          </div>
          
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Población:</span>
              <span className="font-semibold">{eje.poblacion_estimada.toLocaleString()} hab.</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ASICs:</span>
              <span className="font-semibold">{eje.total_asics_oficial}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">CDIs:</span>
              <span className="font-semibold">{eje.total_cdis_oficial}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Responsable:</span>
              <span className="font-semibold text-sm">{eje.responsable}</span>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600">Cumplimiento:</span>
                <span className="font-bold text-green-600">{eje.cumplimiento_global}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 rounded-full h-2 transition-all"
                  style={{ width: `${Math.min(eje.cumplimiento_global, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EjesManager;