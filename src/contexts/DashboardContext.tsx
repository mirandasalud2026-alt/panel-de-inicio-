import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  calculateDashboardState, 
  triggerGoogleSheetsSync, 
  TransitoReporte, 
  ASICSummary, 
  EjeSummary, 
  DashboardStats 
} from '../services/dashboardService';

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

  // Master fetch function
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      if (!supabase) {
        throw new Error('El cliente de Supabase no está inicializado.');
      }
      const { data, error: fetchErr } = await supabase
        .from('transito_reportes')
        .select('*')
        .order('actualizado_en', { ascending: false });

      if (fetchErr) throw fetchErr;

      const { data: resumenData, error: resumenErr } = await supabase
        .from('resumen_asic')
        .select('*')
        .order('asic', { ascending: true });

      if (resumenErr) {
        console.warn('Error fetching resumen_asic directly, using calculated fallback:', resumenErr);
      }

      setReportes(data || []);
      setResumenAsicsDb(resumenData || []);
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Error fetching dashboard statistics:', err);
      setError(err.message || 'Error al obtener datos');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  // Sync function
  const syncSheets = useCallback(async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const success = await triggerGoogleSheetsSync();
      if (!success) {
        throw new Error('La sincronización remota devolvió error.');
      }
      
      // Delay briefly then reload
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

  // Hook real-time changes
  useEffect(() => {
    fetchData();

    if (!supabase) return;

    const realTimeChannel1 = supabase
      .channel('dashboard_db_changes_raw')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transito_reportes' },
        () => {
          fetchData(true);
        }
      )
      .subscribe();

    const realTimeChannel2 = supabase
      .channel('dashboard_db_changes_summary')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'resumen_asic' },
        () => {
          fetchData(true);
        }
      )
      .subscribe();

    // Polling de seguridad de 15 segundos para garantizar datos siempre actualizados
    const intervalId = setInterval(() => {
      fetchData(true);
    }, 15000);

    return () => {
      supabase.removeChannel(realTimeChannel1);
      supabase.removeChannel(realTimeChannel2);
      clearInterval(intervalId);
    };
  }, [fetchData]);

  // Derive consolidated dashboards state
  const { asics, ejes, stats } = useMemo(() => {
    return calculateDashboardState(reportes, resumenAsicsDb);
  }, [reportes, resumenAsicsDb]);

  const value = useMemo(() => ({
    reportes,
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
    syncSheets
  }), [
    reportes, 
    asics, 
    ejes, 
    stats, 
    isLoading, 
    isSyncing, 
    error, 
    lastUpdate, 
    selectedEje, 
    selectedTab, 
    fetchData, 
    syncSheets
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
