import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

// Datos realistas de resguardo (fallback) offline para los 5 ejes estándar de Miranda Salud
const FALLBACK_REPORTES: TransitoReporte[] = [
  // ALTOS MIRANDINOS
  {
    id_centro: "centro-am-1",
    nombre_centro: "CDI Carrizal",
    asic: "ES-9001",
    eje_geografico: "ALTOS MIRANDINOS",
    ultimo_reporte: new Date(Date.now() - 3600000 * 2).toISOString(),
    estado_semaforo: "Verde",
    horas_retraso: 2,
    actualizado_en: new Date().toISOString()
  },
  {
    id_centro: "centro-am-2",
    nombre_centro: "CDI Llano Alto",
    asic: "ES-9002",
    eje_geografico: "ALTOS MIRANDINOS",
    ultimo_reporte: new Date(Date.now() - 3600000 * 48).toISOString(),
    estado_semaforo: "Amarillo",
    horas_retraso: 48,
    actualizado_en: new Date().toISOString()
  },
  {
    id_centro: "centro-am-3",
    nombre_centro: "CDI Padre Cabrera",
    asic: "ES-9005",
    eje_geografico: "ALTOS MIRANDINOS",
    ultimo_reporte: new Date(Date.now() - 3600000 * 12).toISOString(),
    estado_semaforo: "Verde",
    horas_retraso: 12,
    actualizado_en: new Date().toISOString()
  },
  
  // VALLES DEL TUY
  {
    id_centro: "centro-vt-1",
    nombre_centro: "CDI Mamera El Tuy",
    asic: "ES-9045",
    eje_geografico: "VALLES DEL TUY",
    ultimo_reporte: new Date(Date.now() - 3600000 * 96).toISOString(),
    estado_semaforo: "Rojo",
    horas_retraso: 96,
    actualizado_en: new Date().toISOString()
  },
  {
    id_centro: "centro-vt-2",
    nombre_centro: "CDI San Francisco de Yare",
    asic: "ES-9046",
    eje_geografico: "VALLES DEL TUY",
    ultimo_reporte: new Date(Date.now() - 3600000 * 10).toISOString(),
    estado_semaforo: "Verde",
    horas_retraso: 10,
    actualizado_en: new Date().toISOString()
  },
  {
    id_centro: "centro-vt-3",
    nombre_centro: "CDI Ocumare del Tuy",
    asic: "ES-9006",
    eje_geografico: "VALLES DEL TUY",
    ultimo_reporte: new Date(Date.now() - 3600000 * 144).toISOString(),
    estado_semaforo: "Rojo",
    horas_retraso: 144,
    actualizado_en: new Date().toISOString()
  },

  // GUARENAS-GUATIRE
  {
    id_centro: "centro-gg-1",
    nombre_centro: "CDI El Ingenio",
    asic: "ES-9004",
    eje_geografico: "GUARENAS-GUATIRE",
    ultimo_reporte: new Date(Date.now() - 3600000 * 3).toISOString(),
    estado_semaforo: "Verde",
    horas_retraso: 3,
    actualizado_en: new Date().toISOString()
  },
  {
    id_centro: "centro-gg-2",
    nombre_centro: "CDI Valle Verde",
    asic: "ES-9003",
    eje_geografico: "GUARENAS-GUATIRE",
    ultimo_reporte: new Date(Date.now() - 3600000 * 36).toISOString(),
    estado_semaforo: "Amarillo",
    horas_retraso: 36,
    actualizado_en: new Date().toISOString()
  },

  // BARLOVENTO
  {
    id_centro: "centro-bv-1",
    nombre_centro: "CDI Rio Chico",
    asic: "ES-9044",
    eje_geografico: "BARLOVENTO",
    ultimo_reporte: new Date(Date.now() - 3600000 * 8).toISOString(),
    estado_semaforo: "Verde",
    horas_retraso: 8,
    actualizado_en: new Date().toISOString()
  },
  {
    id_centro: "centro-bv-2",
    nombre_centro: "CDI Higuerote",
    asic: "ES-9043",
    eje_geografico: "BARLOVENTO",
    ultimo_reporte: new Date(Date.now() - 3600000 * 5).toISOString(),
    estado_semaforo: "Verde",
    horas_retraso: 5,
    actualizado_en: new Date().toISOString()
  },
  {
    id_centro: "centro-bv-3",
    nombre_centro: "CDI San José de Barlovento",
    asic: "ES-9042",
    eje_geografico: "BARLOVENTO",
    ultimo_reporte: new Date(Date.now() - 3600000 * 80).toISOString(),
    estado_semaforo: "Rojo",
    horas_retraso: 80,
    actualizado_en: new Date().toISOString()
  },

  // METROPOLITANO
  {
    id_centro: "centro-me-1",
    nombre_centro: "CDI Petare",
    asic: "ES-9048",
    eje_geografico: "METROPOLITANO",
    ultimo_reporte: new Date(Date.now() - 3600000 * 4).toISOString(),
    estado_semaforo: "Verde",
    horas_retraso: 4,
    actualizado_en: new Date().toISOString()
  },
  {
    id_centro: "centro-me-2",
    nombre_centro: "CDI Chacao",
    asic: "ES-9049",
    eje_geografico: "METROPOLITANO",
    ultimo_reporte: new Date(Date.now() - 3600000 * 120).toISOString(),
    estado_semaforo: "Rojo",
    horas_retraso: 120,
    actualizado_en: new Date().toISOString()
  },
  {
    id_centro: "centro-me-3",
    nombre_centro: "CDI El Hatillo",
    asic: "ES-9050",
    eje_geografico: "METROPOLITANO",
    ultimo_reporte: new Date(Date.now() - 3600000 * 25).toISOString(),
    estado_semaforo: "Amarillo",
    horas_retraso: 25,
    actualizado_en: new Date().toISOString()
  }
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

  const lastFetchTimeRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);

  // Consulta directa a la tabla transito_reportes
  const fetchConsolidado = useCallback(async (): Promise<TransitoReporte[]> => {
    console.log('📡 Consultando tabla transito_reportes directamente...');
    
    if (!supabase) {
      console.warn('⚠️ Cliente de Supabase no disponible. Usando datos de resguardo offline.');
      return FALLBACK_REPORTES;
    }

    try {
      const { data, error: supabaseError } = await supabase
        .from('transito_reportes')
        .select('*');

      if (supabaseError) {
        console.warn('⚠️ Error consultando transito_reportes:', supabaseError.message);
        return FALLBACK_REPORTES;
      }
      
      const rawData = data || [];
      
      if (rawData.length === 0) {
        console.warn('⚠️ transito_reportes está vacío. Usando fallback.');
        return FALLBACK_REPORTES;
      }
      
      console.log(`📊 transito_reportes retornó ${rawData.length} registros.`);
      
      // Mapeo directo de la tabla a la interfaz TransitoReporte
      return rawData.map((row: any) => {
        // Normalizar estado del semáforo
        let estadoSemaforo: 'Verde' | 'Amarillo' | 'Rojo' = 'Rojo';
        const estadoRaw = row.estado_semaforo || row.estado || '';
        if (typeof estadoRaw === 'string') {
          const estadoLower = estadoRaw.toLowerCase();
          if (estadoLower.includes('verde') || estadoLower === 'green') {
            estadoSemaforo = 'Verde';
          } else if (estadoLower.includes('amarillo') || estadoLower === 'yellow') {
            estadoSemaforo = 'Amarillo';
          }
        }
        
        // Normalizar eje geográfico
        let ejeGeografico = row.eje_geografico || row.eje || 'METROPOLITANO';
        if (typeof ejeGeografico === 'string') {
          const ejeUpper = ejeGeografico.toUpperCase();
          if (ejeUpper.includes('ALTOS')) ejeGeografico = 'ALTOS MIRANDINOS';
          else if (ejeUpper.includes('VALLES')) ejeGeografico = 'VALLES DEL TUY';
          else if (ejeUpper.includes('GUARENAS') || ejeUpper.includes('GUATIRE')) ejeGeografico = 'GUARENAS-GUATIRE';
          else if (ejeUpper.includes('BARLOVENTO')) ejeGeografico = 'BARLOVENTO';
          else if (ejeUpper.includes('METROPOLITANO')) ejeGeografico = 'METROPOLITANO';
        }
        
        return {
          id_centro: row.id_centro || `centro-${Math.random().toString(36).substr(2, 6)}`,
          nombre_centro: row.nombre_centro || row.id_centro || 'Centro de Salud',
          asic: row.asic || 'ES-9001',
          eje_geografico: ejeGeografico,
          ultimo_reporte: row.ultimo_reporte || new Date().toISOString(),
          estado_semaforo: estadoSemaforo,
          horas_retraso: typeof row.horas_retraso === 'number' ? row.horas_retraso : Number(row.horas_retraso) || 0,
          actualizado_en: row.actualizado_en || new Date().toISOString()
        };
      });
      
    } catch (e: any) {
      console.warn('⚠️ Excepción consultando transito_reportes:', e.message || e);
      return FALLBACK_REPORTES;
    }
  }, []);

  // Función para cargar resúmenes de ASIC desde la tabla resumen_asic
  const fetchResumenAsics = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('resumen_asic')
        .select('*')
        .order('eje', { ascending: true });
      
      if (!error && data && data.length > 0) {
        setResumenAsicsDb(data);
        console.log(`📊 Cargados ${data.length} registros de resumen_asic`);
      }
    } catch (err) {
      console.warn('Error cargando resumen_asic:', err);
    }
  }, []);

  // Función de carga unificada
  const fetchData = useCallback(async (silent = false) => {
    const now = Date.now();
    
    // Evitar múltiples fetch simultáneos
    if (isFetchingRef.current || (now - lastFetchTimeRef.current < 3000 && !silent)) {
      console.log('⏭️ Fetch ya en curso o muy reciente, omitiendo...');
      return;
    }

    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;

    if (!silent) setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Sincronizando datos desde transito_reportes...');
      const consolidado = await fetchConsolidado();
      
      setReportes(consolidado);
      setLastUpdate(new Date());
      console.log(`✅ Datos cargados exitosamente: ${consolidado.length} registros.`);
      
      // Cargar resúmenes de ASIC en paralelo
      await fetchResumenAsics();
      
    } catch (err: any) {
      console.error('❌ Error crítico de base de datos:', err);
      setError(err.message || 'Error de comunicación con el backend.');
      // En caso de error, intentar usar fallback
      if (reportes.length === 0) {
        console.log('🔄 Aplicando fallback offline por error...');
        setReportes(FALLBACK_REPORTES);
      }
    } finally {
      isFetchingRef.current = false;
      if (!silent) setIsLoading(false);
    }
  }, [fetchConsolidado, fetchResumenAsics, reportes.length]);

  const syncSheets = useCallback(async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const success = await triggerGoogleSheetsSync();
      if (!success) {
        throw new Error('Error en sincronización remota con Google Sheets.');
      }
      // Esperar un momento y luego recargar datos
      setTimeout(async () => { 
        await fetchData(true); 
        setIsSyncing(false); 
      }, 3000);
    } catch (err: any) {
      console.error('Error en syncSheets:', err);
      setError(err.message || 'Error al sincronizar con Google Sheets');
      setIsSyncing(false);
    }
  }, [fetchData]);

  // Carga inicial optimizada esperando la restauración de la sesión de Supabase o cargando en modo demo
  useEffect(() => {
    const init = async () => {
      if (!supabase) {
        await fetchData();
        return;
      }
      
      // Esperar hasta que haya sesión o transcurra máx de 1.5 segundos para evitar flicker del fallback
      const maxWait = 1500;
      const startTime = Date.now();
      let sessionResolved = false;
      let sessionObj: any = null;

      try {
        const { data } = await supabase.auth.getSession();
        sessionObj = data.session;
        sessionResolved = !!sessionObj;
      } catch (e) {
        console.warn('Error resolviendo sesión inicial:', e);
      }

      const isDemo = localStorage.getItem('sim_demo_admin') === 'true';

      if (sessionResolved || isDemo) {
        console.log(isDemo ? '✅ Autenticación de demostración / bypass detectada' : `✅ Sesión restaurada: ${sessionObj?.user?.email}`);
        await fetchData();
      } else {
        // Hacemos una breve espera por si el evento de sesión es tardío
        let checkSessionObj = null;
        for (let i = 0; i < 5; i++) {
          await new Promise(r => setTimeout(r, 150));
          const { data } = await supabase.auth.getSession();
          if (data?.session) {
            checkSessionObj = data.session;
            break;
          }
        }

        if (checkSessionObj) {
          console.log(`✅ Sesión restaurada tras breve espera: ${checkSessionObj?.user?.email}`);
          await fetchData();
        } else {
          console.log('⏳ Sin sesión de Supabase iniciada aún, precargando de todas formas para no comprometer la UI...');
          // Ejecutar carga inicial silenciosa para mostrar el tablero de inmediato (con datos o fallback si no está autenticado en BD)
          await fetchData(true);
          
          // Escuchar por si el usuario se autentica después
          const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
              console.log('✅ Sesión detectada en cambio de estado tardío:', session.user.email);
              await fetchData();
              listener?.subscription.unsubscribe();
            }
          });
        }
      }
    };
    
    init();
  }, [fetchData]);

  // Suscripción para refresco automático (solo si supabase está disponible)
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('realtime_dashboard')
      .on(
        'postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'transito_reportes' 
        }, 
        () => {
          console.log('🔄 Cambio detectado en transito_reportes, recargando...');
          fetchData(true);
        }
      )
      .on(
        'postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'resumen_asic' 
        }, 
        () => {
          console.log('🔄 Cambio detectado en resumen_asic, recargando...');
          fetchResumenAsics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, fetchResumenAsics]);

  const { profile } = useAuth();
  
  // Filtrar reportes según el eje del usuario (RBAC)
  const filteredReportes = useMemo(() => {
    let result = reportes;
    
    if (profile?.cod_eje) {
      const mappedEje = mapCodEjeToEjeGeografico(profile.cod_eje);
      result = result.filter(r => {
        const ejeReporte = (r.eje_geografico || '').toUpperCase().replace('-', ' ');
        const ejeUsuario = mappedEje.toUpperCase().replace('-', ' ');
        return ejeReporte === ejeUsuario;
      });
      console.log(`🔒 Filtrado por eje de usuario: ${mappedEje} → ${result.length} centros`);
    }
    
    // Filtrar adicionalmente por selector de UI si no es 'TODO'
    if (selectedEje !== 'TODO') {
      result = result.filter(r => r.eje_geografico === selectedEje);
    }
    
    return result;
  }, [reportes, profile?.cod_eje, selectedEje]);

  // Calcular estado del dashboard con los datos filtrados
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
    fetchConsolidado
  }), [
    filteredReportes,
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
    fetchConsolidado
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
    throw new Error('useDashboard debe usarse dentro de DashboardProvider');
  }
  return context;
}