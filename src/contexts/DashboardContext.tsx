import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  calculateDashboardState, 
  triggerGoogleSheetsSync, 
  TransitoReporte, 
  ASICSummary, 
  EjeSummary, 
  DashboardStats 
} from '../services/dashboardService';

function mapCodEjeToEjeGeografico(cod: string): string {
  const norm = cod.toLowerCase().trim();
  if (norm === 'altos_mirandinos') return 'ALTOS MIRANDINOS';
  if (norm === 'valles_del_tuy') return 'VALLES DEL TUY';
  if (norm === 'guarenas_guatire' || norm === 'guarenas-guatire') return 'GUARENAS-GUATIRE';
  if (norm === 'barlovento') return 'BARLOVENTO';
  if (norm === 'metropolitano') return 'METROPOLITANO';
  return cod.toUpperCase().replace('_', ' ');
}

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
  fetchTransitoData: () => Promise<TransitoReporte[]>;
  fetchResumenData: () => Promise<any[]>;
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

  // Consulta directa a transito_reportes
  const fetchTransitoData = useCallback(async (): Promise<TransitoReporte[]> => {
    if (!supabase) {
      throw new Error('Cliente de Supabase no inicializado dadas las variables de entorno.');
    }
    console.log('📡 Consultando Supabase directamente para transito_reportes...');
    const { data, error: transitoErr } = await supabase
      .from('transito_reportes')
      .select('*')
      .order('actualizado_en', { ascending: false });

    if (transitoErr) throw transitoErr;
    return data || [];
  }, []);

  // CONSULTA MAESTRA FIX: Removido el .order() problemático para evitar la discrepancia de columnas
  const fetchResumenData = useCallback(async (): Promise<any[]> => {
    if (!supabase) {
      throw new Error('Cliente de Supabase no inicializado dadas las variables de entorno.');
    }
    console.log('📡 Consultando Supabase directamente para la tabla maestra TASIC (Sin ordenamiento)...');
    const { data, error: resumenErr } = await supabase
      .from('TASIC')
      .select('*');

    if (resumenErr) throw resumenErr;
    return data || [];
  }, []);

  // Función de carga unificada sin fallbacks de simulación local
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      console.log('🔄 Sincronizando datos reales de tránsito de salud...');
      
      if (!supabase) {
        throw new Error('Supabase no está disponible. Revisa tus variables VITE_.');
      }

      // Consultas en paralelo para optimizar la carga
      const [rawTransito, rawResumen] = await Promise.all([
        fetchTransitoData(),
        fetchResumenData()
      ]);

      setReportes(rawTransito || []);
      setResumenAsicsDb(rawResumen || []);
      setLastUpdate(new Date());
      console.log(`✅ Datos cargados en vivo: ${rawTransito.length} reportes, ${rawResumen.length} registros ASIC.`);

    } catch (err: any) {
      console.error('❌ Error crítico de base de datos en producción:', err);
      setError(err.message || 'Error de comunicación con el backend de salud.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [fetchTransitoData, fetchResumenData]);

  // Sincronización manual remota con Google Sheets
  const syncSheets = useCallback(async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const success = await triggerGoogleSheetsSync();
      if (!success) {
        throw new Error('La sincronización remota devolvió error.');
      }
      
      setTimeout(async () => {
        await fetchData(true);
        setIsSyncing(false);
      }, 3000);
    } catch (err: any) {
      console.error('Sync failure:', err);
      setError(err.message || 'Error de sincronización con Google Sheets');
      setIsSyncing(false);
    }
  }, [fetchData]);

  // Escucha en tiempo real (Realtime) y Polling de respaldo cada 15 segundos
  useEffect(() => {
    fetchData();

    if (!supabase) return;

    const realTimeChannel1 = supabase
      .channel('dashboard_db_changes_raw')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transito_reportes' },
        () => { fetchData(true); }
      )
      .subscribe();

    const realTimeChannel2 = supabase
      .channel('dashboard_db_changes_summary')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'TASIC' },
        () => { fetchData(true); }
      )
      .subscribe();

    const intervalId = setInterval(() => {
      fetchData(true);
    }, 15000);

    return () => {
      supabase.removeChannel(realTimeChannel1);
      supabase.removeChannel(realTimeChannel2);
      clearInterval(intervalId);
    };
  }, [fetchData]);

  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.cod_eje) {
      setSelectedEje(mapCodEjeToEjeGeografico(profile.cod_eje));
    }
  }, [profile?.cod_eje]);

  const filteredReportes = useMemo(() => {
    let result = reportes;
    if (profile?.cod_eje) {
      const mappedEje = mapCodEjeToEjeGeografico(profile.cod_eje);
      result = result.filter(r => 
        (r.eje_geografico || '').toUpperCase().replace('-', ' ') === mappedEje.toUpperCase().replace('-', ' ')
      );
    }
    if (profile?.cod_asic) {
      result = result.filter(r => 
        (r.asic || '').toUpperCase() === profile.cod_asic.toUpperCase()
      );
    }
    return result;
  }, [reportes, profile?.cod_eje, profile?.cod_asic]);

  const { asics, ejes, stats } = useMemo(() => {
    return calculateDashboardState(filteredReportes, resumenAsicsDb);
  }, [filteredReportes, resumenAsicsDb]);

  const value = useMemo(() => ({
    reportes: filteredReportes,
    asics,
    ejes,
    stats,
    isLoading,
    isSyncing,
    error,
    lastUpdate,
    selectedEje,
    selectedTab,
    setSelectedEje,
    setSelectedTab,
    fetchData,
    syncSheets,
    fetchTransitoData,
    fetchResumenData
  }), [
    filteredReportes, asics, ejes, stats, isLoading, isSyncing, 
    error, lastUpdate, selectedEje, selectedTab, fetchData, syncSheets,
    fetchTransitoData, fetchResumenData
  ]);

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}