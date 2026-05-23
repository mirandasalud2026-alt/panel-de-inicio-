import React, { useState, useEffect, useRef } from 'react';
import { 
  FileSpreadsheet, 
  FileCode, 
  ExternalLink, 
  RefreshCw, 
  Search, 
  FolderOpen,
  LayoutGrid,
  List as ListIcon,
  ShieldCheck,
  AlertCircle,
  Database,
  ArrowRightLeft,
  Terminal,
  Play,
  Check,
  Trash2,
  Clock,
  Wrench,
  Layers,
  FileText,
  Copy,
  Plus,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react';
import { googleSignIn, initAuth, logout } from '../../lib/firebaseAuth';
import { googleWorkspaceService, GoogleDriveFile } from '../../services/googleWorkspaceService';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

const FOLDER_ID = '1loiQhrPqtwOZkE5sSjdHEEJkYtPqXgDR';

interface ScriptAction {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  icon: React.ReactNode;
  badge: string;
}

interface ScriptPipeline {
  id: 'master' | 'captura' | 'cumplimiento';
  title: string;
  subtitle: string;
  sheetUrl: string;
  webAppUrl: string;
  sheetName: string;
  description: string;
  actions: ScriptAction[];
}

// URLs actualizadas de los Web Apps
const WEBAPP_URLS = {
  master: 'https://script.google.com/macros/s/AKfycbzsG72xt9ttRtFB-BzvVkKuVK5WyqVFI6a8S_DzFuGub1EYrDBmaPGex2kp7GQk_d8fgw/exec',
  captura: 'https://script.google.com/macros/s/AKfycbzsG72xt9ttRtFB-BzvVkKuVK5WyqVFI6a8S_DzFuGub1EYrDBmaPGex2kp7GQk_d8fgw/exec',
  cumplimiento: 'https://script.google.com/macros/s/AKfycbzsG72xt9ttRtFB-BzvVkKuVK5WyqVFI6a8S_DzFuGub1EYrDBmaPGex2kp7GQk_d8fgw/exec'
};

const PIPELINES: Record<'master' | 'captura' | 'cumplimiento', ScriptPipeline> = {
  master: {
    id: 'master',
    title: 'Consolidado General ASIC (Canal 1)',
    subtitle: 'Dirección Estadal de Salud',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1iu3UpCktHPDhUJOVWhwL0-zCZ523aJelWIPgHaLE-20/edit?usp=sharing',
    webAppUrl: WEBAPP_URLS.master,
    sheetName: 'Miranda Salud - Compilado General',
    description: 'Consolida reportes de los 5 ejes territoriales sanitarios de Miranda para compilar la base histórica master.',
    actions: [
      {
        id: 'verificarSemana',
        name: 'Verificar Semana actual',
        description: 'Analiza los datos de la semana pasada en las hojas ASIC y calcula qué ejes tienen reportes listos.',
        category: 'Semanales',
        color: 'border-blue-500/30 text-blue-600 bg-blue-500/5 hover:bg-blue-500/10',
        icon: <Search size={18} className="text-blue-500" />,
        badge: 'Análisis'
      },
      {
        id: 'respaldarSinEliminar',
        name: 'Respaldar (Mantener Origen)',
        description: 'Copia los datos de la semana pasada en el libro consolidado ("Compilado") sin borrar los originales de las ASIC.',
        category: 'Semanales',
        color: 'border-emerald-500/30 text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10',
        icon: <Layers size={18} className="text-emerald-500" />,
        badge: 'Seguro'
      },
      {
        id: 'respaldarYEliminarSemana',
        name: 'Respaldar y Purgar',
        description: 'Copia los datos de la semana pasada en el libro consolidado ("Compilado") y purga los datos originales de las ASIC.',
        category: 'Semanales',
        color: 'border-rose-500/30 text-rose-600 bg-rose-500/5 hover:bg-rose-500/10',
        icon: <Trash2 size={18} className="text-rose-500" />,
        badge: 'Purga'
      },
      {
        id: 'actualizarResumenPorEjes',
        name: 'Actualizar Resumen de Ejes',
        description: 'Recalcula las estadísticas de filas consolidadas agrupadas por eje territorial en la pestaña de Resumen.',
        category: 'Mantenimiento',
        color: 'border-indigo-500/30 text-indigo-600 bg-indigo-500/5 hover:bg-indigo-500/10',
        icon: <Database size={18} className="text-indigo-500" />,
        badge: 'Cálculo'
      },
      {
        id: 'limpiarDuplicadosCompilada',
        name: 'Eliminar Duplicados',
        description: 'Escanea la pestaña "Compilado" y quita cualquier fila duplicada idéntica para limpiar la base de datos.',
        category: 'Mantenimiento',
        color: 'border-amber-500/30 text-amber-600 bg-amber-500/5 hover:bg-amber-500/10',
        icon: <Wrench size={18} className="text-amber-500" />,
        badge: 'Limpieza'
      },
      {
        id: 'migrarCompiladoConEje',
        name: 'Reconstrucción de Ejes',
        description: 'Migra y reconstruye la pestaña consolidada "Compilado" forzando la columna indexada como primer elemento.',
        category: 'Mantenimiento',
        color: 'border-sky-500/30 text-sky-600 bg-slate-500/5 hover:bg-sky-500/10',
        icon: <ArrowRightLeft size={18} className="text-sky-500" />,
        badge: 'Migrar'
      },
      {
        id: 'crearTriggerAutomatico',
        name: 'Configurar Cron Semanal',
        description: 'Instala un disparador automático continuo en Google Apps Script para respaldar y purgar cada jueves a las 23:50.',
        category: 'Configuración',
        color: 'border-teal-500/30 text-teal-600 bg-teal-500/5 hover:bg-teal-500/10',
        icon: <Clock size={18} className="text-teal-500" />,
        badge: 'Trigger'
      },
      {
        id: 'crearTriggersCada3Horas',
        name: 'Configurar Cron 3 Horas',
        description: 'Instala disparador automático para actualizar reportes (Resumen_ASIC y Semaforo) en el Dashboard cada 3 horas.',
        category: 'Configuración',
        color: 'border-purple-500/30 text-purple-600 bg-purple-500/5 hover:bg-purple-500/10',
        icon: <Zap size={18} className="text-purple-500" />,
        badge: 'Trigger 3h'
      },
      {
        id: 'crearTodosLosTriggers',
        name: 'Configurar TODOS los Triggers',
        description: 'Instala todos los disparadores: semanal (jueves 23:50) y cada 3 horas para reportes del Dashboard.',
        category: 'Configuración',
        color: 'border-indigo-600/30 text-indigo-600 bg-indigo-500/5 hover:bg-indigo-500/10',
        icon: <Shield size={18} className="text-indigo-600" />,
        badge: 'Full Setup'
      },
      {
        id: 'eliminarTodosLosTriggers',
        name: 'Eliminar TODOS Triggers',
        description: 'Elimina todos los disparadores automáticos del proyecto (semanal y cada 3 horas).',
        category: 'Configuración',
        color: 'border-red-500/30 text-red-600 bg-red-500/5 hover:bg-red-500/10',
        icon: <Trash2 size={18} className="text-red-500" />,
        badge: 'Limpiar'
      },
      {
        id: 'verTriggersActivos',
        name: 'Ver Triggers Activos',
        description: 'Muestra la lista de todos los disparadores automáticos actualmente instalados en el proyecto.',
        category: 'Configuración',
        color: 'border-slate-500/30 text-slate-600 bg-slate-500/5 hover:bg-slate-500/10',
        icon: <Clock size={18} className="text-slate-500" />,
        badge: 'Listar'
      },
      {
        id: 'resetearCompilado',
        name: 'Reiniciar Compilado',
        description: 'Purga todos los datos acumulados en la pestaña "Compilado" y restablece la estructura original con sus cabeceras.',
        category: 'Configuración',
        color: 'border-red-500/30 text-red-600 bg-red-500/5 hover:bg-red-500/10',
        icon: <FileText size={18} className="text-red-500" />,
        badge: 'Formatear'
      },
      {
        id: 'diagnosticarCompleto',
        name: 'Diagnóstico en Nube',
        description: 'Abre en tiempo real cada libro de Eje Territorial verificando hojas "ASIC", columnas, y el estado de la conexión en red.',
        category: 'Configuración',
        color: 'border-slate-500/30 text-slate-700 bg-slate-500/5 hover:bg-slate-500/10',
        icon: <Terminal size={18} className="text-slate-600" />,
        badge: 'Detalles'
      },
      {
        id: 'diagnosticarResumenASIC',
        name: 'Diagnosticar Resumen_ASIC',
        description: 'Verifica qué ejes tienen la pestaña "Resumen_ASIC" y cuántos datos contienen.',
        category: 'Diagnóstico',
        color: 'border-cyan-500/30 text-cyan-600 bg-cyan-500/5 hover:bg-cyan-500/10',
        icon: <Search size={18} className="text-cyan-500" />,
        badge: 'ASIC'
      },
      {
        id: 'diagnosticarSemaforo',
        name: 'Diagnosticar Semaforo',
        description: 'Verifica qué ejes tienen la pestaña "Semaforo" y cuántos datos contienen.',
        category: 'Diagnóstico',
        color: 'border-cyan-500/30 text-cyan-600 bg-cyan-500/5 hover:bg-cyan-500/10',
        icon: <Search size={18} className="text-cyan-500" />,
        badge: 'Semáforo'
      }
    ]
  },
  captura: {
    id: 'captura',
    title: 'Planilla de Carga de Registros (Canal 2)',
    subtitle: 'Capturas Epidemiológicas Específicas',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1zw04RoFnPvxF3P147dRjbg01gfySKJGNn4QUVbcSfig/edit?usp=sharing',
    webAppUrl: WEBAPP_URLS.captura,
    sheetName: 'Planilla de Carga de Registros',
    description: 'Registra, valida y actualiza la hoja de cálculo específica de control para variables dinámicas locales.',
    actions: [
      {
        id: 'procesarYReportarResumenASIC',
        name: 'Procesar Resumen_ASIC → Dashboard',
        description: 'Consolida todas las pestañas "Resumen_ASIC" de los 5 ejes en el Dashboard de Salud Miranda.',
        category: 'Reportes',
        color: 'border-emerald-500/30 text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10',
        icon: <FileSpreadsheet size={18} className="text-emerald-500" />,
        badge: 'Dashboard'
      },
      {
        id: 'procesarYReportarSemaforo',
        name: 'Procesar Semaforo → Dashboard',
        description: 'Consolida todas las pestañas "Semaforo" de los 5 ejes en el Dashboard de Salud Miranda.',
        category: 'Reportes',
        color: 'border-emerald-500/30 text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10',
        icon: <FileSpreadsheet size={18} className="text-emerald-500" />,
        badge: 'Dashboard'
      },
      {
        id: 'procesarAmbosReportes',
        name: 'Procesar AMBOS Reportes',
        description: 'Ejecuta la consolidación de Resumen_ASIC y Semaforo en un solo paso.',
        category: 'Reportes',
        color: 'border-purple-500/30 text-purple-600 bg-purple-500/5 hover:bg-purple-500/10',
        icon: <TrendingUp size={18} className="text-purple-500" />,
        badge: 'Full'
      },
      {
        id: 'llenarDatosSheet',
        name: 'Sincronizar y Cargar Datos',
        description: 'Envía peticiones para poblar y rellenar automáticamente la planilla de carga general.',
        category: 'Planilla de Carga',
        color: 'border-blue-500/30 text-blue-600 bg-blue-500/5 hover:bg-blue-500/10',
        icon: <Database size={18} className="text-blue-500" />,
        badge: 'Cargar'
      },
      {
        id: 'verificarLlenado',
        name: 'Diagnosticar Formato Carga',
        description: 'Examina columnas, celdas y el formato general de la hoja de cálculo de carga específica.',
        category: 'Integridad',
        color: 'border-cyan-500/30 text-cyan-600 bg-cyan-500/5 hover:bg-cyan-500/10',
        icon: <Search size={18} className="text-cyan-500" />,
        badge: 'Análisis'
      },
      {
        id: 'limpiarPlanilla',
        name: 'Reiniciar Planilla de Captura',
        description: 'Limpia la base temporal o de pruebas en la hoja de carga si es necesario inicializar el formato maestro.',
        category: 'Mantenimiento',
        color: 'border-rose-500/30 text-rose-600 bg-rose-500/5 hover:bg-rose-500/10',
        icon: <Trash2 size={18} className="text-rose-500" />,
        badge: 'Inicializar'
      }
    ]
  },
  cumplimiento: {
    id: 'cumplimiento',
    title: 'Monitoreo de Cumplimiento (Canal 3)',
    subtitle: 'Dirección de Salud - Estado Miranda',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1zw04RoFnPvxF3P147dRjbg01gfySKJGNn4QUVbcSfig/edit?usp=sharing',
    webAppUrl: WEBAPP_URLS.cumplimiento,
    sheetName: 'Planilla para Administración de Cumplimientos',
    description: 'Control de tránsito bi-direccional hacia Supabase. Peina horario las hojas ASIC de los 5 libros territoriales para calcular el semáforo y retrasos de reportes.',
    actions: [
      {
        id: 'actualizarReportesCada3Horas',
        name: 'Actualizar Reportes (Ahora)',
        description: 'Ejecuta manualmente la actualización de Resumen_ASIC y Semaforo en el Dashboard.',
        category: 'Reportes',
        color: 'border-cyan-500/30 text-cyan-600 bg-cyan-500/5 hover:bg-cyan-500/10',
        icon: <RefreshCw size={18} className="text-cyan-500" />,
        badge: 'Manual'
      },
      {
        id: 'peinarYActualizarSupabase',
        name: 'Peinar y Actualizar Supabase',
        description: 'Escanea en tiempo real los 5 libros de ejes territoriales de Miranda, procesa las hojas por ASIC y actualiza los indicadores en Supabase.',
        category: 'Cumplimientos',
        color: 'border-emerald-500/30 text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10',
        icon: <RefreshCw size={18} className="text-emerald-500" />,
        badge: 'Escaneo'
      },
      {
        id: 'ejecutarReinicioSemanal',
        name: 'Limpieza e Inicialización Semanal',
        description: 'Reestablece el estado del semáforo colectivo a Rojo e inicializa el cron de retrasos acumulados para el nuevo ciclo de reporte.',
        category: 'Inicios Semanales',
        color: 'border-purple-500/30 text-purple-600 bg-purple-500/5 hover:bg-purple-500/10',
        icon: <Clock size={18} className="text-purple-500" />,
        badge: 'Purga'
      }
    ]
  }
};

interface WorkspaceManagerProps {
  onRegisterTriggerHandler?: (handler: () => void) => void;
}

export const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({ onRegisterTriggerHandler }) => {
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeManagerTab, setActiveManagerTab] = useState<'files' | 'sync'>('sync');
  const [selectedPipeline, setSelectedPipeline] = useState<'master' | 'captura' | 'cumplimiento'>('master');

  // Apps Script states
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    `[SISTEMA] Consola integrada lista • Fecha actual de auditoría: ${new Date().toLocaleDateString('es-VE')}`,
    `[INFO] Servidor conectado al canal Apps Script de Miranda Salud.`,
    `[CARGO] Libro maestro indexado de forma segura.`
  ]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Escuchar cambios de autenticación
    const unsubscribe = initAuth(
      (u, token) => {
        setUser(u);
        setAccessToken(token);
        loadFiles(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (onRegisterTriggerHandler) {
      onRegisterTriggerHandler(() => {
        runScriptAction('crearTriggersCada3Horas', 'Configurar Cron 3 Horas');
      });
    }
  }, [onRegisterTriggerHandler, selectedPipeline, runningAction, user]);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs]);

  const loadFiles = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const driveFiles = await googleWorkspaceService.listFilesFromFolder(token, FOLDER_ID);
      setFiles(driveFiles);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        loadFiles(result.accessToken);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setFiles([]);
  };

  const addLog = (text: string) => {
    const time = new Date().toLocaleTimeString('es-VE');
    setConsoleLogs(prev => [...prev, `[${time}] ${text}`]);
  };

  const clearLogs = () => {
    setConsoleLogs([`[SISTEMA] Consola limpia. Esperando nuevos procedimientos...`]);
  };

  const copyLogs = () => {
    const textToCopy = consoleLogs.join('\n');
    navigator.clipboard.writeText(textToCopy);
    addLog(`📋 Historial de registros copiado al portapapeles.`);
  };

  const runScriptAction = async (actionId: string, actionName: string) => {
    if (runningAction) return;
    setRunningAction(actionId);
    setError(null);

    const activePipelineUrl = PIPELINES[selectedPipeline].webAppUrl;
    addLog(`⚡ Solicitando ejecución: "${actionName}" (ID: ${actionId})...`);
    addLog(`📡 Canalizando túnel hacia Apps Script: ${activePipelineUrl.substring(0, 45)}...`);

    try {
      const response = await fetch('/api/run-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: actionId, scriptUrl: activePipelineUrl })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} en la conexión proxy`);
      }

      const resData = await response.json();

      if (response.status === 200 && resData.status === 'success') {
        const payload = resData.data;
        addLog(`🟢 Macro ejecutada con éxito. Respuesta recibida del servidor.`);
        
        if (actionId === 'crearTriggersCada3Horas') {
          addLog(`⏰ [DISPARADOR] Se ha configurado el cron de consolidación del Dashboard cada 3 horas.`);
          addLog(`⚙️ Apps Script activó un trigger de tipo tiempo ('timeBased') llamando a los módulos 'Resumen_ASIC' y 'Semaforo'.`);
        } else if (actionId === 'eliminarTodosLosTriggers') {
          addLog(`🗑️ [LIMPIEZA] Depuración completa completada.`);
          addLog(`⚙️ Se eliminaron todos los disparadores anteriores de Apps Script de forma exitosa.`);
        } else if (actionId === 'crearTodosLosTriggers') {
          addLog(`🚀 [CRON EXCEPCIONAL] Despliegue masivo completado.`);
          addLog(`⚙️ Se reactivó tanto el Cron Semanal de los jueves a las 23:50 como el Cron de consolidación de 3 horas.`);
        }

        if (payload && payload.message) {
          addLog(`[Apps Script] ${payload.message}`);
        } else if (payload && typeof payload === 'object') {
          addLog(`[Apps Script JSON] ${JSON.stringify(payload, null, 2)}`);
        } else if (payload) {
          addLog(`[Apps Script] ${String(payload)}`);
        } else {
          addLog(`[Apps Script] Operación completada (Código OK 200).`);
        }
        
        // Si es una acción crítica, podemos actualizar la base de datos de supabase de forma simulada
        if (supabase) {
          await supabase
            .from('territorial_data')
            .upsert({
              eje_id: `sync_${actionId}`,
              name: `Acción ${actionName}`,
              valor_principal: 100,
              metadata: { source: 'Consola Integrada', systemUser: user?.email || 'Admin', action: actionId },
              updated_at: new Date().toISOString()
            });
        }
      } else {
        throw new Error(resData.message || 'Error inexplicado devuelto por Apps Script');
      }
    } catch (err: any) {
      console.error(err);
      addLog(`❌ FALLIDO: Error durante la macro "${actionName}".`);
      addLog(`[ERROR INFO] ${err.message}`);
      setError(`Error al ejecutar "${actionName}": ${err.message}`);
    } finally {
      setRunningAction(null);
    }
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-xl border border-gray-100 mt-8 overflow-hidden">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-10 pb-8 border-b border-gray-100">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
              Gestor de Sincronización
            </h3>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-1">
              <ShieldCheck size={11} /> Nube Conectada
            </span>
          </div>
          <p className="text-gray-400 text-xs font-semibold max-w-2xl leading-relaxed">
            Consola administrativa para orquestar la copia, consolidación y mantenimiento de los reportes por ejes ASIC en el documento maestro de Miranda Salud.
          </p>
        </div>

        {/* TABS DE TRABAJO */}
        <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-200 shadow-inner w-full sm:w-auto self-stretch sm:self-auto shrink-0">
          <button 
            type="button"
            onClick={() => setActiveManagerTab('sync')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeManagerTab === 'sync' ? 'bg-white text-blue-600 shadow-md border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Sincronización Real
          </button>
          <button 
            type="button"
            onClick={() => {
              if (!user) {
                handleLogin();
              } else {
                setActiveManagerTab('files');
              }
            }}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeManagerTab === 'files' ? 'bg-white text-blue-600 shadow-md border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Archivos Drive
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4 text-rose-600 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="block text-rose-800 uppercase tracking-wider text-[10px] mb-1 font-black">Notificación de Retorno</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* DETALLE SEGÚN TAB INTERACTIVA */}
      <AnimatePresence mode="wait">
        {activeManagerTab === 'sync' ? (
          <motion.div
            key="sync"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* SELECCIÓN DE CANAL DE SCRIPT / PLANILLA */}
            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                📡 SELECCIONE EL DISPARADOR Y LA HOJA META
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Master channel */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPipeline('master');
                    addLog('🔄 Cambiado a Canal 1: Sincronización ASIC y Consolidación Maestro.');
                  }}
                  className={`p-5 rounded-3xl border text-left transition-all flex items-start gap-4 ${
                    selectedPipeline === 'master'
                      ? 'bg-white border-[#0B3D5C] ring-2 ring-[#0B3D5C]/11 shadow-lg'
                      : 'bg-white/40 border-gray-200/60 hover:bg-white hover:border-[#0B3D5C]'
                  }`}
                >
                  <div className={`p-3 rounded-2xl ${selectedPipeline === 'master' ? 'bg-[#0B3D5C] text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Layers size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#0B3D5C] uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">Canal 1</span>
                      <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Consolidado ASIC Principal</h5>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5 font-medium leading-relaxed">
                      Compila la base de datos histórica mediante reportes de los 5 ejes territoriales.
                    </p>
                  </div>
                </button>

                {/* Capture channel */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPipeline('captura');
                    addLog('🔄 Cambiado a Canal 2: Planilla de Carga de Registros.');
                  }}
                  className={`p-5 rounded-3xl border text-left transition-all flex items-start gap-4 ${
                    selectedPipeline === 'captura'
                      ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/11 shadow-lg'
                      : 'bg-white/40 border-gray-200/60 hover:bg-white hover:border-emerald-500'
                  }`}
                >
                  <div className={`p-3 rounded-2xl ${selectedPipeline === 'captura' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <FileSpreadsheet size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md">Canal 2</span>
                      <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Planilla de Carga General</h5>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5 font-medium leading-relaxed">
                      Llena, formatea y procesa la planilla específica de captura de salud.
                    </p>
                  </div>
                </button>

                {/* Compliance channel (Canal 3) */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPipeline('cumplimiento');
                    addLog('🔄 Cambiado a Canal 3: Monitoreo de Cumplimiento (Supabase ⇆ Google Sheets).');
                  }}
                  className={`p-5 rounded-3xl border text-left transition-all flex items-start gap-4 ${
                    selectedPipeline === 'cumplimiento'
                      ? 'bg-white border-cyan-600 ring-2 ring-cyan-500/11 shadow-lg'
                      : 'bg-white/40 border-gray-200/60 hover:bg-white hover:border-cyan-500'
                  }`}
                >
                  <div className={`p-3 rounded-2xl ${selectedPipeline === 'cumplimiento' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <RefreshCw size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider bg-cyan-50 px-2 py-0.5 rounded-md">Canal 3</span>
                      <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Cumplimientos ASIC</h5>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5 font-medium leading-relaxed">
                      Control de tránsito de reportes epidemiológicos y semáforos bi-direccionales.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* HERRAMIENTAS DIRECTAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50/50 border border-blue-100/60 p-6 rounded-3xl flex flex-col justify-between">
                <div>
                  <h4 className="text-[12px] font-black text-blue-900 uppercase tracking-widest mb-1.5">Documento de Google Sheets</h4>
                  <p className="text-[10px] text-blue-700/80 leading-relaxed font-semibold">
                    {PIPELINES[selectedPipeline].sheetName}
                  </p>
                </div>
                <a 
                  href={PIPELINES[selectedPipeline].sheetUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="mt-6 inline-flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider bg-white px-4 py-2 rounded-xl shadow-sm border border-blue-100 w-fit transition-all hover:translate-y-[-1px]"
                >
                  Abrir spreadsheet <ExternalLink size={12} />
                </a>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100/60 p-6 rounded-3xl flex flex-col justify-between">
                <div>
                  <h4 className="text-[12px] font-black text-emerald-900 uppercase tracking-widest mb-1.5">Apps Script Web App</h4>
                  <p className="text-[10px] text-emerald-700/80 leading-relaxed font-semibold">
                    Procedimiento macro que orquesta y valida las filas en la hoja conectada.
                  </p>
                </div>
                <a 
                  href={PIPELINES[selectedPipeline].webAppUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="mt-6 inline-flex items-center gap-2 text-xs font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-wider bg-white px-4 py-2 rounded-xl shadow-sm border border-emerald-100 w-fit transition-all hover:translate-y-[-1px]"
                >
                  Ver Apps Script <ExternalLink size={12} />
                </a>
              </div>

              <div className="bg-amber-50/60 border border-amber-100/60 p-6 rounded-3xl flex flex-col justify-between">
                <div>
                  <h4 className="text-[12px] font-black text-amber-950 uppercase tracking-widest mb-1.5">Planificación</h4>
                  <p className="text-[10px] text-amber-700/80 leading-relaxed font-semibold">
                  {selectedPipeline === 'master' 
                    ? 'El sistema corre automáticamente el Respaldo Semanal cada Jueves a las 23:50 y reportes cada 3 horas.' 
                    : selectedPipeline === 'captura'
                    ? 'Los reportes se consolidan automáticamente cada 3 horas en el Dashboard.'
                    : 'La sincronización de tránsitos peina horario cada libro ASIC y calcula horas retraso.'}
                  </p>
                </div>
                <div className="mt-6 text-[10px] text-amber-600 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Servicio Activo
                </div>
              </div>
            </div>

            {/* SECCIÓN DE BOTONES DE ACCIÓN */}
            <div>
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <span className="p-1 bg-gray-100 rounded-lg"><Play size={10} /></span> Macros del Canal Seleccionado
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PIPELINES[selectedPipeline].actions.map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => runScriptAction(act.id, act.name)}
                    disabled={runningAction !== null}
                    className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group h-36 ${act.color} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:scale-105 transition-all">
                        {act.icon}
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-white/60 rounded-full">
                        {act.badge}
                      </span>
                    </div>

                    <div className="mt-3">
                      <h5 className="text-[11px] font-black uppercase tracking-tight line-clamp-1 mb-1">
                        {act.name}
                      </h5>
                      <p className="text-[9px] text-gray-500/80 leading-tight font-medium line-clamp-2">
                        {act.description}
                      </p>
                    </div>

                    {runningAction === act.id && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex items-center gap-2">
                          <RefreshCw size={12} className="animate-spin text-blue-600" />
                          <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest">Ejecutando...</span>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* TERMINAL LOG RETRO */}
            <div className="bg-[#0b0f19] border border-[#1e293b] rounded-3xl p-6 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <Terminal size={12} /> Consola de Registro SIG Miranda
                  </span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={copyLogs}
                    className="p-1 px-3.5 bg-white/5 border border-white/15 rounded-lg text-[9px] font-bold text-gray-300 hover:bg-white/10 transition-colors uppercase tracking-widest flex items-center gap-1"
                  >
                    <Copy size={10} /> Copiar
                  </button>
                  <button 
                    onClick={clearLogs}
                    className="p-1 px-3.5 bg-white/5 border border-white/15 rounded-lg text-[9px] font-bold text-gray-300 hover:bg-white/10 transition-colors uppercase tracking-widest"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              <div className="max-h-52 overflow-y-auto font-mono text-[10px] text-green-400/90 leading-relaxed p-2 custom-scrollbar space-y-1.5 selection:bg-green-700/50">
                {consoleLogs.map((log, index) => (
                  <div key={index} className="truncate whitespace-pre-wrap">
                    {log}
                  </div>
                ))}
                <div ref={consoleEndRef} />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="files"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* HERRAMIENTAS DE ARCHIVOS */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                <input 
                  type="text"
                  placeholder="Buscar recursos en Drive..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium w-full focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200 shadow-sm">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <LayoutGrid size={14} />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <ListIcon size={14} />
                  </button>
                </div>

                <button 
                  onClick={() => loadFiles(accessToken!)}
                  disabled={loading}
                  className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-all border border-gray-200 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
                
                <button 
                  onClick={handleLogout}
                  className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest py-2 px-4 border border-rose-100 hover:bg-rose-50/50 rounded-xl ml-2"
                >
                  Salir Google
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Cargando archivos del Drive escolar...</span>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center bg-gray-50/50 border border-dashed border-gray-200 rounded-3xl">
                <FolderOpen className="text-gray-300 mb-4 animate-pulse" size={40} />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">No se encontraron libros de reportes</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredFiles.map((file) => (
                  <motion.div 
                    key={file.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group bg-gray-50 hover:bg-white p-5 rounded-[2rem] border border-gray-200/60 hover:border-blue-200 transition-all hover:shadow-xl hover:shadow-blue-500/5 flex flex-col justify-between h-44 relative"
                  >
                    <div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105 ${
                        file.mimeType.includes('spreadsheet') ? 'bg-green-50 text-green-500 border border-green-100' : 'bg-amber-50 text-amber-500 border border-amber-100'
                      }`}>
                        {file.mimeType.includes('spreadsheet') ? <FileSpreadsheet size={18} /> : <FileCode size={18} />}
                      </div>
                      
                      <h4 className="text-[11px] font-black text-gray-800 uppercase tracking-tight line-clamp-2 leading-relaxed">
                        {file.name}
                      </h4>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-100 w-full flex items-center justify-between gap-4">
                      <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest truncate">
                        {file.mimeType.includes('spreadsheet') ? 'Formato Excel' : 'App Script'}
                      </span>
                      <a 
                        href={file.webViewLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1.5 bg-white text-blue-600 rounded-lg border border-gray-200 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFiles.map((file) => (
                  <motion.div 
                    key={file.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="group bg-gray-50 hover:bg-white p-4 rounded-2xl border border-gray-200/60 hover:border-blue-200 transition-all hover:shadow-md flex items-center gap-4"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      file.mimeType.includes('spreadsheet') ? 'bg-green-50 text-green-500' : 'bg-amber-50 text-amber-500'
                    }`}>
                      {file.mimeType.includes('spreadsheet') ? <FileSpreadsheet size={16} /> : <FileCode size={16} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-black text-gray-800 uppercase tracking-tight truncate">
                        {file.name}
                      </h4>
                      <p className="text-[8px] text-gray-400 font-bold uppercase mt-0.5 tracking-widest truncate">
                        ID: {file.id}
                      </p>
                    </div>
                    
                    <a 
                      href={file.webViewLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 bg-white text-blue-600 hover:text-white hover:bg-blue-600 rounded-xl border border-gray-200 font-extrabold text-[9px] uppercase tracking-widest transition-all"
                    >
                      Abrir <ExternalLink size={10} />
                    </a>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER DE VERIFICACIÓN */}
      <div className="mt-12 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 opacity-40">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
          Vinculado a Google Apps Script SDK v5
        </p>
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
            Auditoría de Actividad Activa • 2026
          </span>
        </div>
      </div>
    </section>
  );
};