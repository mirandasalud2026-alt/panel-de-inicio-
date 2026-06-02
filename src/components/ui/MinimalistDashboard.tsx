import React, { useState } from 'react';
import { EjeDisplayData } from '../../types/salud';

interface MinimalistDashboardProps {
  ejes: EjeDisplayData[];
  selectedEje?: EjeDisplayData | null;
  onEjeSelect: (eje: EjeDisplayData) => void;
}

const MinimalistDashboard: React.FC<MinimalistDashboardProps> = ({
  ejes = [], // Defensa 1: Valor por defecto si "ejes" llega nulo o undefined
  selectedEje,
  onEjeSelect
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Defensa 2: Verificación segura antes de filtrar
  const safeEjes = Array.isArray(ejes) ? ejes : [];

  const filteredEjes = safeEjes.filter(eje =>
    eje?.nombre_eje?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eje?.cod_eje?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cálculos estadísticos con protecciones contra arreglos vacíos
  const totalPoblacion = safeEjes.reduce((sum, eje) => sum + (eje.poblacion_estimada || 0), 0);
  const totalASICs = safeEjes.reduce((sum, eje) => sum + (eje.total_asics_oficial || 0), 0);
  const totalCDIs = safeEjes.reduce((sum, eje) => sum + (eje.total_cdis_oficial || 0), 0);
  
  // Defensa 3: Evitar división por cero (NaN%) si no hay datos cargados aún
  const promedioCumplimiento = safeEjes.length > 0 
    ? safeEjes.reduce((sum, eje) => sum + (eje.cumplimiento_global || 0), 0) / safeEjes.length
    : 0;

  // Estado de carga visual integrado si el arreglo está totalmente vacío
  if (safeEjes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mb-4"></div>
        <p className="text-gray-600 font-medium">🔄 Sincronizando datos de tránsito de salud...</p>
        <p className="text-gray-400 text-xs mt-1">Consultando Supabase / Simulación Local</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard Epidemiológico
            </h1>
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="md:hidden bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              {isDrawerOpen ? 'Cerrar' : 'Ejes de Salud'}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Drawer lateral */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
          md:relative md:transform-none md:w-96 md:shadow-md md:rounded-lg
          ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="p-4 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-4 md:hidden">
              <h2 className="text-xl font-bold">Ejes de Salud</h2>
              <button onClick={() => setIsDrawerOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <h2 className="text-xl font-bold mb-4 hidden md:block">Ejes de Salud</h2>
            <input
              type="text"
              placeholder="Buscar eje..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="space-y-2">
              {filteredEjes.map((eje) => (
                <button
                  key={eje.cod_eje}
                  onClick={() => {
                    onEjeSelect(eje);
                    setIsDrawerOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedEje?.cod_eje === eje.cod_eje
                      ? 'bg-green-100 border-l-4 border-green-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="font-semibold">{eje.nombre_eje}</div>
                  <div className="text-sm text-gray-600">Población: {eje.poblacion_estimada?.toLocaleString()} hab.</div>
                  <div className="text-sm text-gray-600">Cumplimiento: {eje.cumplimiento_global}%</div>
                </button>
              ))}
              {filteredEjes.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">No se encontraron ejes.</p>
              )}
            </div>
          </div>
        </div>

        {/* Panel principal */}
        <div className="flex-1">
          {selectedEje ? (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedEje.nombre_eje}</h2>
                <p className="text-gray-600 mb-4">Código: {selectedEje.cod_eje}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-gray-600">Población estimada</div>
                    <div className="text-2xl font-bold">{selectedEje.poblacion_estimada?.toLocaleString()}</div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-gray-600">ASICs oficiales</div>
                    <div className="text-2xl font-bold">{selectedEje.total_asics_oficial}</div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-gray-600">CDIs oficiales</div>
                    <div className="text-2xl font-bold">{selectedEje.total_cdis_oficial}</div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-gray-600">Cumplimiento global</div>
                    <div className="text-2xl font-bold text-green-600">{selectedEje.cumplimiento_global}%</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">Responsable</div>
                  <div className="font-semibold">{selectedEje.responsable}</div>
                  <div className="text-sm text-gray-600 mt-2">Contacto emergencia</div>
                  <div className="font-semibold">{selectedEje.contacto_emergencia}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Selecciona un Eje de Salud</h3>
              <p className="text-gray-500">Elige un eje del panel lateral para ver sus indicadores detallados</p>
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas globales inferiores */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Estadísticas Globales</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><div className="text-sm text-gray-600">Total Población</div><div className="text-xl font-bold">{totalPoblacion.toLocaleString()}</div></div>
            <div><div className="text-sm text-gray-600">Total ASICs</div><div className="text-xl font-bold">{totalASICs}</div></div>
            <div><div className="text-sm text-gray-600">Total CDIs</div><div className="text-xl font-bold">{totalCDIs}</div></div>
            <div><div className="text-sm text-gray-600">Cumplimiento Promedio</div><div className="text-xl font-bold text-green-600">{promedioCumplimiento.toFixed(1)}%</div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinimalistDashboard;