// contexts/DashboardContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { calculateDashboardState, triggerGoogleSheetsSync, TransitoReporte, ASICSummary, EjeSummary, DashboardStats } from '../services/dashboardService';

const FALLBACK_REPORTES: TransitoReporte[] = [
  { id_centro: "demo-1", nombre_centro: "CDI Carrizal", asic: "AMI-01", eje_geografico: "ALTOS MIRANDINOS", ultimo_reporte: new Date().toISOString(), estado_semaforo: "Verde", horas_retraso: 2, actualizado_en: new Date().toISOString() },
  { id_centro: "demo-2", nombre_centro: "CDI Ocumare", asic: "VTY-01", eje_geografico: "VALLES DEL TUY", ultimo_reporte: new Date().toISOString(), estado_semaforo: "Amarillo", horas_retraso: 48, actualizado_en: new Date().toISOString() },
];

interface DashboardContextType {
  reportes: TransitoReporte[];
  asics: ASICSummary[];
  ejes: EjeSummary[];
  stats: DashboardStats;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  lastUpdate: Date | null;
  selectedEje: string;
  selectedTab: string;
  setSelectedEje: (eje: string) => void;
  setSelectedTab: (tab: string) => void;
  fetchData: (silent?: boolean) => Promise<void>;
  syncSheets: () => Promise<void>;
  fetchConsolidado: () => Promise<TransitoReporte[]>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [reportes, setReportes] = useState<TransitoReporte[]>([]);
  const [resumenAsicsDb, setResumenAsicsDb] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedEje, setSelectedEje] = useState<string>('TODO');
  const [selectedTab, setSelectedTab] = useState<string>('semaforo');

  const fetchConsolidado = useCallback(async (): Promise<TransitoReporte[]> => {
    if (!supabase) return FALLBACK_REPORTES;
    try {
      const { data, error } = await supabase.from('transito_reportes').select('*');
      if (error) throw error;
      if (!data || data.length === 0) return FALLBACK_REPORTES;
      return data.map((row: any) => ({
        id_centro: row.id_centro,
        nombre_centro: row.nombre_centro,
        asic: row.asic,
        eje_geografico: row.eje_geografico.toUpperCase(),
        ultimo_reporte: row.ultimo_reporte,
        estado_semaforo: row.estado_semaforo,
        horas_retraso: row.horas_retraso,
        actualizado_en: row.actualizado_en,
      }));
    } catch (e: any) {
      console.warn('Error cargando transito_reportes:', e);
      return FALLBACK_REPORTES;
    }
  }, []);

  const fetchResumenAsics = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('resumen_asic').select('*').order('eje', { ascending: true });
      if (!error && data) setResumenAsicsDb(data);
    } catch (err) { console.warn(err); }
  }, []);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const consolidado = await fetchConsolidado();
      setReportes(consolidado);
      setLastUpdate(new Date());
      await fetchResumenAsics();
    } catch (err: any) {
      setError(err.message);
      if (reportes.length === 0) setReportes(FALLBACK_REPORTES);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [fetchConsolidado, fetchResumenAsics, reportes.length]);

  const syncSheets = useCallback(async () => {
    setIsSyncing(true);
    try {
      await triggerGoogleSheetsSync();
      await fetchData(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSyncing(false);
    }
  }, [fetchData]);

  useEffect(() => { fetchData(); }, []);

  const { profile } = useAuth();
  const filteredReportes = useMemo(() => {
    let result = reportes;
    if (profile?.cod_eje) {
      const ejeUsuario = profile.cod_eje.toUpperCase();
      result = result.filter(r => r.eje_geografico === ejeUsuario);
    }
    if (selectedEje !== 'TODO') {
      result = result.filter(r => r.eje_geografico === selectedEje);
    }
    return result;
  }, [reportes, profile?.cod_eje, selectedEje]);

  const { asics, ejes, stats } = useMemo(() => calculateDashboardState(filteredReportes, resumenAsicsDb), [filteredReportes, resumenAsicsDb]);

  const value = { reportes: filteredReportes, asics, ejes, stats, isLoading, isSyncing, error, lastUpdate, selectedEje, selectedTab, setSelectedEje, setSelectedTab, fetchData, syncSheets, fetchConsolidado };
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}