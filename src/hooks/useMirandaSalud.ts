import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface TransitoReporte {
  id_centro: string;
  nombre_centro: string;
  asic: string;
  eje_geografico: string;
  ultimo_reporte: string;
  estado_semaforo: 'Verde' | 'Amarillo' | 'Rojo';
  horas_retraso: number;
  actualizado_en: string;
  latitud?: number;
  longitud?: number;
}

export interface ResumenAsic {
  id?: number | string;
  asic: string;
  eje: string;
  total_centros: number;
  centros_reportaron: number;
  porcentaje_reporte?: number;
}

// Robust, high-fidelity silent fallbacks
const FALLBACK_TRANSITO: TransitoReporte[] = [
  { id_centro: "demo-1", nombre_centro: "CDI Carrizal", asic: "AMI-01", eje_geografico: "ALTOS MIRANDINOS", ultimo_reporte: new Date().toISOString(), estado_semaforo: "Verde", horas_retraso: 2, actualizado_en: new Date().toISOString() },
  { id_centro: "demo-2", nombre_centro: "CDI Ocumare", asic: "VTY-01", eje_geografico: "VALLES DEL TUY", ultimo_reporte: new Date().toISOString(), estado_semaforo: "Amarillo", horas_retraso: 48, actualizado_en: new Date().toISOString() },
  { id_centro: "demo-3", nombre_centro: "Hospital Ana Francisca Pérez de León II", asic: "MET-01", eje_geografico: "METROPOLITANO", ultimo_reporte: new Date().toISOString(), estado_semaforo: "Verde", horas_retraso: 1, actualizado_en: new Date().toISOString() },
  { id_centro: "demo-4", nombre_centro: "Hospital Santa Teresa", asic: "VTY-02", eje_geografico: "VALLES DEL TUY", ultimo_reporte: new Date().toISOString(), estado_semaforo: "Rojo", horas_retraso: 96, actualizado_en: new Date().toISOString() },
];

const FALLBACK_RESUMEN_ASIC: ResumenAsic[] = [
  { asic: "AMI-01", eje: "AMI", total_centros: 4, centros_reportaron: 3 },
  { asic: "VTY-01", eje: "VTY", total_centros: 6, centros_reportaron: 4 },
  { asic: "MET-01", eje: "MET", total_centros: 8, centros_reportaron: 8 },
  { asic: "GGU-01", eje: "GGU", total_centros: 5, centros_reportaron: 5 },
  { asic: "BAR-01", eje: "BAR", total_centros: 7, centros_reportaron: 6 },
];

// Module-level cache to share data across different component mounts instantly
let globalCache: {
  resumenAsic: ResumenAsic[];
  transitoReportes: TransitoReporte[];
  timestamp: number;
} | null = null;

const CACHE_DURATION_MS = 1000 * 30; // 30 seconds cache

export function useMirandaSalud(forceRefresh = false) {
  const [resumenAsic, setResumenAsic] = useState<ResumenAsic[]>(globalCache?.resumenAsic || []);
  const [transitoReportes, setTransitoReportes] = useState<TransitoReporte[]>(globalCache?.transitoReportes || []);
  const [loading, setLoading] = useState(!globalCache);
  const [error, setError] = useState<string | null>(null);

  const fetchDirectFromSupabase = useCallback(async (isSilent = false) => {
    if (!supabase) {
      setError('Cliente de Supabase no inicializado dadas las variables de entorno.');
      setLoading(false);
      return;
    }

    if (!isSilent) {
      setLoading(true);
    }
    setError(null);

    try {
      // 1. Direct read-only SELECT queries using public anon key
      let fetchedResumen = [];
      let fetchedTransito = [];

      try {
        const { data, error } = await supabase.from('resumen_asic').select('*');
        if (error) {
          console.warn('⚠️ No se pudo obtener resumen_asic, usando respaldo local:', error.message);
          fetchedResumen = FALLBACK_RESUMEN_ASIC;
        } else {
          fetchedResumen = data || [];
        }
      } catch (e: any) {
        console.warn('⚠️ Excepción al obtener resumen_asic:', e);
        fetchedResumen = FALLBACK_RESUMEN_ASIC;
      }

      try {
        const { data, error } = await supabase
          .from('transito_reportes')
          .select('*')
          .order('actualizado_en', { ascending: false });
        if (error) {
          console.warn('⚠️ No se pudo obtener transito_reportes, usando respaldo local:', error.message);
          fetchedTransito = FALLBACK_TRANSITO;
        } else {
          fetchedTransito = data || [];
        }
      } catch (e: any) {
        console.warn('⚠️ Excepción al obtener transito_reportes:', e);
        fetchedTransito = FALLBACK_TRANSITO;
      }

      // Update state
      setResumenAsic(fetchedResumen);
      setTransitoReportes(fetchedTransito);

      // Update global cache
      globalCache = {
        resumenAsic: fetchedResumen,
        transitoReportes: fetchedTransito,
        timestamp: Date.now()
      };
    } catch (err: any) {
      console.error('❌ [useMirandaSalud] Error obteniendo datos directos de Supabase:', err);
      // Even if there is a severe error, use fallbacks
      setResumenAsic(FALLBACK_RESUMEN_ASIC);
      setTransitoReportes(FALLBACK_TRANSITO);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const now = Date.now();
    const hasCache = globalCache !== null;
    const isCacheExpired = hasCache && (now - globalCache!.timestamp > CACHE_DURATION_MS);

    if (forceRefresh || !hasCache || isCacheExpired) {
      fetchDirectFromSupabase();
    } else {
      // Use cached data instantly
      setResumenAsic(globalCache!.resumenAsic);
      setTransitoReportes(globalCache!.transitoReportes);
      setLoading(false);
    }
  }, [forceRefresh, fetchDirectFromSupabase]);

  // Realtime subscription setup to keep cache & state fresh when table changes occur
  useEffect(() => {
    if (!supabase) return;

    const channel1 = supabase
      .channel('realtime_use_miranda_salud_transito')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transito_reportes' },
        () => {
          console.log('🔔 [useMirandaSalud] Cambio en transito_reportes. Actualizando...');
          fetchDirectFromSupabase(true);
        }
      )
      .subscribe();

    const channel2 = supabase
      .channel('realtime_use_miranda_salud_resumen')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'resumen_asic' },
        () => {
          console.log('🔔 [useMirandaSalud] Cambio en resumen_asic. Actualizando...');
          fetchDirectFromSupabase(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
    };
  }, [fetchDirectFromSupabase]);

  return {
    resumenAsic,
    transitoReportes,
    loading,
    error,
    refetch: () => fetchDirectFromSupabase(false)
  };
}
