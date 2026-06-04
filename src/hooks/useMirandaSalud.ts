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
      const [resumenRes, transitoRes] = await Promise.all([
        supabase
          .from('resumen_asic')
          .select('*'),
        supabase
          .from('transito_reportes')
          .select('*')
          .order('actualizado_en', { ascending: false })
      ]);

      if (resumenRes.error) throw new Error(`Error en resumen_asic: ${resumenRes.error.message}`);
      if (transitoRes.error) throw new Error(`Error en transito_reportes: ${transitoRes.error.message}`);

      const fetchedResumen = resumenRes.data || [];
      const fetchedTransito = transitoRes.data || [];

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
      setError(err.message || 'Error de comunicación directa con Supabase.');
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
