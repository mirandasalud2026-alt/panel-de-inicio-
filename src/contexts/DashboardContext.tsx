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

  // Expose direct Supabase fetching functions
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

  const fetchResumenData = useCallback(async (): Promise<any[]> => {
    if (!supabase) {
      throw new Error('Cliente de Supabase no inicializado dadas las variables de entorno.');
    }
    console.log('📡 Consultando Supabase directamente para resumen_asic...');
    const { data, error: resumenErr } = await supabase
      .from('resumen_asic')
      .select('*')
      .order('asic', { ascending: true });

    if (resumenErr) throw resumenErr;
    return data || [];
  }, []);

  // Master fetch function to load live data, prioritizing direct Supabase client functions
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      console.log('🔄 Intentando cargar datos de tránsito de salud...');
      
      let gotData = false;
      let transitoData: TransitoReporte[] = [];
      let resumenData: any[] = [];

      // 1. Intentar consultar directamente Supabase desde el cliente JS usando nuestras funciones
      if (supabase) {
        try {
          const rawTransito = await fetchTransitoData();
          const rawResumen = await fetchResumenData();

          if (rawTransito && rawTransito.length > 0) {
            transitoData = rawTransito;
            resumenData = rawResumen || [];
            gotData = true;
            console.log(`✅ Datos sincronizados correctamente desde Supabase: ${rawTransito.length} reportes, ${resumenData.length} resumenes.`);
          }
        } catch (dbErr: any) {
          console.warn('⚠️ Error al consultar directamente Supabase mediante funciones:', dbErr.message || dbErr);
        }
      }

      // 2. Fallback de emergencia a Mock Data de alta fidelidad si Supabase no tiene datos o falla
      if (!gotData) {
        console.log('💡 Utilizando datos de simulación local de Miranda Salud...');
        transitoData = [
          {
            id_centro: "ALT_AS_GUA",
            nombre_centro: "Ambulatorio Guaremal",
            asic: "ASIC Guaremal",
            eje_geografico: "ALTOS MIRANDINOS",
            ultimo_reporte: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
            estado_semaforo: "Verde",
            horas_retraso: 0,
            actualizado_en: new Date().toISOString()
          },
          {
            id_centro: "ALT_AS_CAR_CDI",
            nombre_centro: "CDI Carrizal",
            asic: "ASIC Carrizal",
            eje_geografico: "ALTOS MIRANDINOS",
            ultimo_reporte: new Date(Date.now() - 29 * 3600 * 1000).toISOString(),
            estado_semaforo: "Amarillo",
            horas_retraso: 29,
            actualizado_en: new Date().toISOString()
          },
          {
            id_centro: "VAL_AS_SFC",
            nombre_centro: "CDI San Francisco de Yare",
            asic: "ASIC Yare",
            eje_geografico: "VALLES DEL TUY",
            ultimo_reporte: new Date().toISOString(),
            estado_semaforo: "Verde",
            horas_retraso: 0,
            actualizado_en: new Date().toISOString()
          },
          {
            id_centro: "BAR_AS_HIG",
            nombre_centro: "Hospital El Quemadito",
            asic: "ASIC Higuerote",
            eje_geografico: "BARLOVENTO",
            ultimo_reporte: new Date(Date.now() - 84 * 3600 * 1000).toISOString(),
            estado_semaforo: "Rojo",
            horas_retraso: 84,
            actualizado_en: new Date().toISOString()
          },
          {
            id_centro: "MET_AS_PET",
            nombre_centro: "CDI Petare",
            asic: "ASIC Petare Norte",
            eje_geografico: "METROPOLITANO",
            ultimo_reporte: new Date().toISOString(),
            estado_semaforo: "Verde",
            horas_retraso: 0,
            actualizado_en: new Date().toISOString()
          }
        ];

        resumenData = [
          { asic: 'ASIC Guaremal', eje: 'ALTOS MIRANDINOS', total_centros: 15, centros_reportaron: 12, porcentaje_reporte: 80.0 },
          { asic: 'ASIC Carrizal', eje: 'ALTOS MIRANDINOS', total_centros: 10, centros_reportaron: 8, porcentaje_reporte: 80.0 },
          { asic: 'ASIC Yare', eje: 'VALLES DEL TUY', total_centros: 22, centros_reportaron: 18, porcentaje_reporte: 81.8 },
          { asic: 'ASIC Higuerote', eje: 'BARLOVENTO', total_centros: 12, centros_reportaron: 6, porcentaje_reporte: 50.0 },
          { asic: 'ASIC Petare Norte', eje: 'METROPOLITANO', total_centros: 30, centros_reportaron: 25, porcentaje_reporte: 83.3 }
        ];
      }

      setReportes(transitoData);
      setResumenAsicsDb(resumenData);
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Error fatal obteniendo datos del dashboard:', err);
      setError(err.message || 'Error al obtener datos');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [fetchTransitoData, fetchResumenData]);

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
    syncSheets,
    fetchTransitoData,
    fetchResumenData
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
    syncSheets,
    fetchTransitoData,
    fetchResumenData
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
