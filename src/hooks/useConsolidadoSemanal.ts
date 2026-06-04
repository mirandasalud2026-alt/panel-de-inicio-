import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { AsicAggregationRow, EjeGeograficoAgregado } from '../types/dashboard';

/**
 * Agrupa los registros consolidando ASICs bajo sus respectivos Ejes
 */
function transformarAJerarquia(data: AsicAggregationRow[]): EjeGeograficoAgregado[] {
  const map: Record<string, EjeGeograficoAgregado> = {};

  data.forEach((row) => {
    const ejeKey = row.eje_geografico.toUpperCase().trim();
    
    if (!map[ejeKey]) {
      map[ejeKey] = {
        name: ejeKey,
        total_centros: 0,
        centros_verdes: 0,
        promedio_retraso: 0,
        asics: []
      };
    }

    const eje = map[ejeKey];
    eje.total_centros += row.total_centros;
    eje.centros_verdes += row.centros_verdes;
    
    // Suma ponderada temporal para recalcular promedio de retraso a nivel eje
    eje.promedio_retraso += row.promedio_retraso * row.total_centros;

    eje.asics.push({
      name: row.asic,
      total_centros: row.total_centros,
      centros_verdes: row.centros_verdes,
      centros_amarillos: row.centros_amarillos,
      centros_rojos: row.centros_rojos,
      promedio_retraso: row.promedio_retraso,
      total_atenciones_semanales: row.total_atenciones_semanales
    });
  });

  // Ajustar el promedio ponderado de cada eje
  return Object.values(map).map(eje => {
    if (eje.total_centros > 0) {
      eje.promedio_retraso = Math.round((eje.promedio_retraso / eje.total_centros) * 10) / 10;
    }
    return eje;
  });
}

/**
 * Custom Hook para el Tablero Directivo y de Sala Situacional
 */
export function useConsolidadoSemanal() {
  return useQuery<EjeGeograficoAgregado[]>({
    queryKey: ['monitoreo', 'acumulado-semanal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_acumulado_semanal_agregado')
        .select('*');

      if (error) {
        throw new Error(error.message || 'Error descargando agregados de red.');
      }

      // La agregación jerárquica ahora es instantánea O(N) lineal con baja cardinalidad (ej. 30 ASICs)
      return transformarAJerarquia(data as any[] as AsicAggregationRow[]);
    },
    // Parámetros clave de optimización arquitectónica
    staleTime: 1000 * 60 * 5, // Considerar fresca por 5 minutos (evita repetir consultas en renders rápidos)
    gcTime: 1000 * 60 * 30,    // Retener en caché inactiva por 30 minutos
    refetchOnWindowFocus: false, // Desactivado para evitar parpadeos si se cambia de app de apoyo
  });
}
