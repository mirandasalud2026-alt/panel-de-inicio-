// src/components/ui/AdminPortal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Database, 
  RefreshCw, 
  Trash2, 
  UserPlus, 
  Download, 
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Building,
  MapPin,
  Clock,
  Check,
  X,
  Scissors,
  Baby,
  HeartOff,
  Search,
  FileText,
  Phone,
  FileSpreadsheet,
  ExternalLink
} from 'lucide-react';
import { supabase, UserProfile } from '../../lib/supabase';
import { schemaService } from '../../services/schemaService';
import { nominalService } from '../../services/nominalService';
import DashboardSummaryWidget from '../dashboard/DashboardSummaryWidget';

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState<'usuarios' | 'tablas' | 'pacientes'>('usuarios');

  // Tab 3: Buscador de Pacientes por Datos (Cédula, Nombre, Apellido, Teléfono)
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<any[]>([]);
  const [isPatientSearching, setIsPatientSearching] = useState(false);
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState<any | null>(null);
  const [selectedPatientHistory, setSelectedPatientHistory] = useState<{
    quirurgicos: any[];
    obstetricos: any[];
    defunciones: any[];
  }>({ quirurgicos: [], obstetricos: [], defunciones: [] });
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const handlePatientSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!patientSearchQuery.trim()) return;
    setIsPatientSearching(true);
    try {
      const results = await nominalService.buscarPacientesMultiples(patientSearchQuery);
      setPatientSearchResults(results);
      setSelectedPatientForHistory(null); // Reiniciar visualización de historial al buscar de nuevo
    } catch (err) {
      console.error('Error al realizar búsqueda de pacientes:', err);
    } finally {
      setIsPatientSearching(false);
    }
  };

  const loadPatientHistory = async (patient: any) => {
    setSelectedPatientForHistory(patient);
    setIsHistoryLoading(true);
    let quirurgicEvents: any[] = [];
    let obstetricEvents: any[] = [];
    let defuncionEvents: any[] = [];

    try {
      if (supabase) {
        // Buscar eventos quirúrgicos
        const { data: qData } = await supabase
          .from('CL_quirurgicos_eventos')
          .select('*')
          .eq('paciente_id', patient.cedula);
        if (qData) quirurgicEvents = qData;

        // Buscar eventos obstétricos
        const { data: oData } = await supabase
          .from('CL_obstetricos_eventos')
          .select('*')
          .eq('paciente_id', patient.cedula);
        if (oData) obstetricEvents = oData;

        // Buscar defunciones
        const { data: dData } = await supabase
          .from('CL_defunciones_eventos')
          .select('*')
          .eq('paciente_id', patient.cedula);
        if (dData) defuncionEvents = dData;
      } else {
        // Fallback simulación local
        const localQ = JSON.parse(localStorage.getItem('nominal_sim_quirurgica') || '[]');
        quirurgicEvents = localQ.filter((r: any) => r.cedula_paciente === patient.cedula);

        const localO = JSON.parse(localStorage.getItem('nominal_sim_obstetrica') || '[]');
        obstetricEvents = localO.filter((r: any) => r.cedula_madre === patient.cedula);

        const localD = JSON.parse(localStorage.getItem('nominal_sim_defuncion') || '[]');
        defuncionEvents = localD.filter((r: any) => r.cedula_fallecido === patient.cedula);
      }
    } catch (err) {
      console.warn('Error cargando historial del paciente:', err);
    }

    setSelectedPatientHistory({
      quirurgicos: quirurgicEvents,
      obstetricos: obstetricEvents,
      defunciones: defuncionEvents
    });
    setIsHistoryLoading(false);
  };

  // Tab 1: Usuarios
  const [systemUsers, setSystemUsers] = useState<UserProfile[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    nombre: '',
    email: '',
    rol: 'nominal',
    estado: 'aprobado',
    id_centro: '',
    cod_eje: '',
    password: ''
  });

  // Tab 2: Explorador de Base de Datos
  const [listaTablas, setListaTablas] = useState<string[]>([]);
  const [tablaSeleccionada, setTablaSeleccionada] = useState<string>('nominales');
  const [selectedTableSchema, setSelectedTableSchema] = useState<{ descripcion: string; columnas: { name: string; type: string; label: string }[] } | null>(null);
  const [selectedTableRecords, setSelectedTableRecords] = useState<any[]>([]);
  const [isRecordsLoading, setIsRecordsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'supabase' | 'simulado'>('simulado');
  const [selectedInspectRecord, setSelectedInspectRecord] = useState<any | null>(null);

  // Sistema de Alertas de Onboarding Reciente
  const [onboardingAlerts, setOnboardingAlerts] = useState<any[]>([]);
  const [quickAssignData, setQuickAssignData] = useState<Record<string, { cod_eje: string; id_centro: string }>>({});

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'err'; text: string } | null>(null);

  // Listas de referencia de territorio cargados desde la base de datos con fallbacks
  const [ejesList, setEjesList] = useState<{ cod_eje: string; nombre_eje: string }[]>([
    { cod_eje: 'MET', nombre_eje: 'Metropolitano' },
    { cod_eje: 'AMI', nombre_eje: 'Altos Mirandinos' },
    { cod_eje: 'VTY', nombre_eje: 'Valles del Tuy' },
    { cod_eje: 'GGU', nombre_eje: 'Guarenas Guatire' },
    { cod_eje: 'BAR', nombre_eje: 'Barlovento' }
  ]);
  
  const [centrosList, setCentrosList] = useState<{ nombre_establecimiento: string; cod_asic: string; cod_eje: string }[]>([
    { nombre_establecimiento: 'CLÍNICA POPULAR PARACOTOS', cod_asic: 'AMI-01', cod_eje: 'AMI' },
    { nombre_establecimiento: 'CDI DOCTOR JOSÉ GREGORIO HERNÁNDEZ', cod_asic: 'AMI-01', cod_eje: 'AMI' },
    { nombre_establecimiento: 'AMBULATORIO PRADO DE MARÍA', cod_asic: 'AMI-02', cod_eje: 'AMI' },
    { nombre_establecimiento: 'CDI CONTEXTO MIRANDINO', cod_asic: 'AMI-03', cod_eje: 'AMI' },
    { nombre_establecimiento: 'CLÍNICA POPULAR HUGO CHÁVEZ', cod_asic: 'VTY-01', cod_eje: 'VTY' },
    { nombre_establecimiento: 'CDI CARTANAL', cod_asic: 'VTY-03', cod_eje: 'VTY' },
    { nombre_establecimiento: 'CLÍNICA POPULAR VALLES DEL TUY', cod_asic: 'VTY-02', cod_eje: 'VTY' },
    { nombre_establecimiento: 'HOSPITAL GENERAL DE GUARENAS', cod_asic: 'GGU-01', cod_eje: 'GGU' },
    { nombre_establecimiento: 'CDI EL QUEMADO', cod_asic: 'GGU-02', cod_eje: 'GGU' },
    { nombre_establecimiento: 'HOSPITAL HIGUEROTE', cod_asic: 'BAR-01', cod_eje: 'BAR' },
    { nombre_establecimiento: 'CLÍNICA POPULAR RIO CHICO', cod_asic: 'BAR-02', cod_eje: 'BAR' },
    { nombre_establecimiento: 'HOSPITAL ANA FRANCISCA PEREZ DE LEON II', cod_asic: 'MET-01', cod_eje: 'MET' },
    { nombre_establecimiento: 'AMBULATORIO CHACAO', cod_asic: 'MET-02', cod_eje: 'MET' },
    { nombre_establecimiento: 'HOSPITAL DOMINGO LUCIANI', cod_asic: 'MET-01', cod_eje: 'MET' }
  ]);

  // Estados para conteos en tiempo real de planillas nominales
  const [counts, setCounts] = useState({
    quirurgicos: 0,
    obstetricos: 0,
    defunciones: 0,
  });
  const [countsLoading, setCountsLoading] = useState(false);

  const fetchNominalCounts = async () => {
    setCountsLoading(true);
    let qCount = 0;
    let oCount = 0;
    let dCount = 0;

    // 1. Cargar datos locales de localStorage como contingencia
    try {
      const localQ = localStorage.getItem('nominal_sim_quirurgica');
      if (localQ) {
        qCount = JSON.parse(localQ).length;
      } else {
        qCount = 2; // Default mock records
      }

      const localO = localStorage.getItem('nominal_sim_obstetrica');
      if (localO) {
        oCount = JSON.parse(localO).length;
      } else {
        oCount = 1; // Default mock records
      }

      const localD = localStorage.getItem('nominal_sim_defuncion');
      if (localD) {
        dCount = JSON.parse(localD).length;
      } else {
        dCount = 1; // Default mock records
      }
    } catch (e) {
      console.warn('Error al mapear fallbacks en widgets nominales:', e);
    }

    // 2. Cargar en tiempo real desde Supabase si existe conexión activa
    if (supabase) {
      try {
        const { count: sCount, error: sErr } = await supabase
          .from('CL_quirurgicos_eventos')
          .select('*', { count: 'exact', head: true });
        if (!sErr && sCount !== null) {
          qCount = sCount;
        }

        const { count: mCount, error: mErr } = await supabase
          .from('CL_obstetricos_eventos')
          .select('*', { count: 'exact', head: true });
        if (!mErr && mCount !== null) {
          oCount = mCount;
        }

        const { count: dfCount, error: dfErr } = await supabase
          .from('CL_defunciones_eventos')
          .select('*', { count: 'exact', head: true });
        if (!dfErr && dfCount !== null) {
          dCount = dfCount;
        }
      } catch (dbErr) {
        console.warn('Fallo consulta count de Supabase, usando contingencia local:', dbErr);
      }
    }

    setCounts({
      quirurgicos: qCount,
      obstetricos: oCount,
      defunciones: dCount
    });
    setCountsLoading(false);
  };

  const handleWidgetClick = (tableName: string) => {
    setActiveTab('tablas');
    setTablaSeleccionada(tableName);
    
    // Auto Scroll suave al panel de control de bases de datos
    setTimeout(() => {
      const el = document.getElementById('explorador-clinico-tablas');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  // Cargar datos iniciales de base de datos
  useEffect(() => {
    fetchUsers();
    loadTablesList();
    fetchOnboardingAlerts();
    fetchTerritoryMetadata();
    fetchNominalCounts();
  }, []);

  const fetchTerritoryMetadata = async () => {
    if (!supabase) return;
    try {
      // Query DG_ejes
      const { data: ejesData, error: ejesErr } = await supabase
        .from('DG_ejes')
        .select('*');
      let finalEjes = [
        { cod_eje: 'MET', nombre_eje: 'Metropolitano' },
        { cod_eje: 'AMI', nombre_eje: 'Altos Mirandinos' },
        { cod_eje: 'VTY', nombre_eje: 'Valles del Tuy' },
        { cod_eje: 'GGU', nombre_eje: 'Guarenas Guatire' },
        { cod_eje: 'BAR', nombre_eje: 'Barlovento' }
      ];

      if (!ejesErr && ejesData && ejesData.length > 0) {
        finalEjes = ejesData.map((item: any) => ({
          cod_eje: String(item.cod_eje || item.Cod_Eje || ''),
          nombre_eje: String(item.nombre_eje || item.eje || item.cod_eje || '')
        })).filter(e => e.cod_eje);
        setEjesList(finalEjes);
      }

      // Query TASIC to map ASIC to Eje Geografico
      const { data: asicsData } = await supabase.from('TASIC').select('*');
      const asicToEjeMap: Record<string, string> = {};
      if (asicsData) {
        asicsData.forEach((item: any) => {
          const rawAsic = item.Cod_ASIC || item.cod_asic || '';
          const rawEje = item.Cod_Eje || item.cod_eje || '';
          if (rawAsic && rawEje) {
            asicToEjeMap[rawAsic.toUpperCase()] = rawEje.toUpperCase();
          }
        });
      }

      // Query TClinicas_populares
      const { data: clinicasData, error: clinicasErr } = await supabase
        .from('TClinicas_populares')
        .select('*')
        .order('nombre_establecimiento', { ascending: true });

      if (!clinicasErr && clinicasData && clinicasData.length > 0) {
        const finalCentros = clinicasData.map((item: any) => {
          const tempAsic = String(item.cod_asic || '').toUpperCase();
          let tempEje = 'MET';
          if (asicToEjeMap[tempAsic]) {
            tempEje = asicToEjeMap[tempAsic];
          } else if (tempAsic.startsWith('AMI')) {
            tempEje = 'AMI';
          } else if (tempAsic.startsWith('VTY')) {
            tempEje = 'VTY';
          } else if (tempAsic.startsWith('GGU')) {
            tempEje = 'GGU';
          } else if (tempAsic.startsWith('BAR')) {
            tempEje = 'BAR';
          }
          return {
            nombre_establecimiento: String(item.nombre_establecimiento || ''),
            cod_asic: tempAsic,
            cod_eje: tempEje
          };
        });
        setCentrosList(finalCentros);
      }
    } catch (err) {
      console.warn('Error loading territory data maps in Admin:', err);
    }
  };

  useEffect(() => {
    if (tablaSeleccionada) {
      loadTableData(tablaSeleccionada);
    }
  }, [tablaSeleccionada]);

  const loadTablesList = async () => {
    // Filtrar para mostrar solo las tablas maestras reales del sistema nominal requeridas por el usuario
    const masterTables = ['nominales', 'pacientes', 'registros_quirurgicos', 'registros_obstetricos', 'registros_defunciones', 'usuarios'];
    setListaTablas(masterTables);
  };

  const fetchOnboardingAlerts = () => {
    const alertsStr = localStorage.getItem('s_admin_onboarding_alerts') || '[]';
    const parsedAlerts = JSON.parse(alertsStr);
    // Filtrar las que no han sido atendidas aún
    const pending = parsedAlerts.filter((a: any) => !a.atendida);
    setOnboardingAlerts(pending);
    
    // Inicializar datos para asignación rápida
    const initialConfig: Record<string, { cod_eje: string; id_centro: string }> = {};
    pending.forEach((alert: any) => {
      initialConfig[alert.id] = { cod_eje: 'MET', id_centro: '' };
    });
    setQuickAssignData(prev => ({ ...prev, ...initialConfig }));
  };

  // Cargar usuarios de Supabase + Virtuales locales
  const fetchUsers = async () => {
    setIsUsersLoading(true);
    let dbUsers: UserProfile[] = [];
    
    try {
      if (supabase) {
        const { data, error } = await supabase.from('usuarios').select('*').order('nombre');
        if (!error && data) {
          dbUsers = data;
        }
      }
    } catch (err) {
      console.warn('Error al cargar usuarios de Supabase, utilizando modo contingencia:', err);
    }

    const localVirtualUsers = localStorage.getItem('s_admin_virtual_users');
    const parsedVirtuals = localVirtualUsers ? JSON.parse(localVirtualUsers) : [];
    
    const merged = [...dbUsers];
    parsedVirtuals.forEach((vu: UserProfile) => {
      if (!merged.some(u => u.email.toLowerCase() === vu.email.toLowerCase())) {
        merged.push(vu);
      }
    });

    if (merged.length === 0) {
      const presets = schemaService.getSimulatedRecords('usuarios');
      setSystemUsers(presets);
    } else {
      setSystemUsers(merged);
    }
    setIsUsersLoading(false);
  };

  // Crear nuevo usuario
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.nombre || !newUser.email) return;

    const emailClean = newUser.email.trim().toLowerCase();
    const isMainAdmin = emailClean === 'miranda.salud2026@gmail.com';
    const finalUserId = `user-${Math.random().toString(36).substr(2, 9)}`;

    const created: UserProfile = {
      id: finalUserId,
      nombre: newUser.nombre.trim().toUpperCase(),
      email: emailClean,
      rol: isMainAdmin ? 'admin' : (newUser.rol as any),
      estado: newUser.estado as any,
      id_centro: newUser.id_centro ? newUser.id_centro.toUpperCase() : null,
      cod_eje: newUser.cod_eje ? newUser.cod_eje.toUpperCase() : null
    };

    try {
      if (supabase) {
        await supabase.from('usuarios').insert(created);
      }
    } catch (err) {
      console.warn('Sincronización online fallida al crear el usuario. Se almacenará en la bitácora local.', err);
    }

    const localVirtualUsers = localStorage.getItem('s_admin_virtual_users');
    const list = localVirtualUsers ? JSON.parse(localVirtualUsers) : [];
    list.unshift(created);
    localStorage.setItem('s_admin_virtual_users', JSON.stringify(list));

    // Clave es su cédula o password proveída (por defecto nominal2026)
    localStorage.setItem(`sim_pass_${emailClean}`, newUser.password || 'nominal2026');

    addAuditLog('CREAR_USUARIO', 'usuarios', created.id);

    setNewUser({ nombre: '', email: '', rol: 'nominal', estado: 'aprobado', id_centro: '', cod_eje: '', password: '' });
    setShowCreateUserForm(false);
    showNotification('Usuario creado exitosamente. Puede ingresar usando su correo y clave asignada.');
    fetchUsers();
  };

  // Modificar rol de usuario
  const handleUserRoleChange = async (userId: string, newRole: any) => {
    setSystemUsers(prev => prev.map(u => u.id === userId ? { ...u, rol: newRole } : u));
    
    try {
      if (supabase) {
        await supabase.from('usuarios').update({ rol: newRole }).eq('id', userId);
      }
    } catch (e) {
      console.warn('Error al guardar el rol en la nube:', e);
    }

    const localVirtualUsers = localStorage.getItem('s_admin_virtual_users');
    if (localVirtualUsers) {
      const list = JSON.parse(localVirtualUsers);
      const updated = list.map((u: any) => u.id === userId ? { ...u, rol: newRole } : u);
      localStorage.setItem('s_admin_virtual_users', JSON.stringify(updated));
    }

    addAuditLog('MODIFICAR_ROL', 'usuarios', userId);
    showNotification('Rol de usuario actualizado');
  };

  // Modificar estado de aprobación del usuario
  const handleUserStatusChange = async (userId: string, newStatus: any) => {
    setSystemUsers(prev => prev.map(u => u.id === userId ? { ...u, estado: newStatus } : u));
    
    try {
      if (supabase) {
        await supabase.from('usuarios').update({ estado: newStatus }).eq('id', userId);
      }
    } catch (e) {
      console.warn('Error al guardar estado de aprobación en la nube:', e);
    }

    const localVirtualUsers = localStorage.getItem('s_admin_virtual_users');
    if (localVirtualUsers) {
      const list = JSON.parse(localVirtualUsers);
      const updated = list.map((u: any) => u.id === userId ? { ...u, estado: newStatus } : u);
      localStorage.setItem('s_admin_virtual_users', JSON.stringify(updated));
    }

    addAuditLog('APROBAR_CUENTA', 'usuarios', userId);
    showNotification('Estado de cuenta actualizado');
  };

  // Modificar adscripción física (eje y centro) del usuario
  const handleUserAdscriptionChange = async (userId: string, newEje: string, newCentro: string) => {
    setSystemUsers(prev => prev.map(u => u.id === userId ? { ...u, cod_eje: newEje, id_centro: newCentro } : u));
    
    try {
      if (supabase) {
        await supabase.from('usuarios').update({ cod_eje: newEje, id_centro: newCentro }).eq('id', userId);
      }
    } catch (e) {
      console.warn('Error al guardar adscripción territorial en la nube:', e);
    }

    const localVirtualUsers = localStorage.getItem('s_admin_virtual_users');
    if (localVirtualUsers) {
      const list = JSON.parse(localVirtualUsers);
      const updated = list.map((u: any) => u.id === userId ? { ...u, cod_eje: newEje, id_centro: newCentro } : u);
      localStorage.setItem('s_admin_virtual_users', JSON.stringify(updated));
    }

    addAuditLog('MODIFICAR_ADSCRIPCION', 'usuarios', userId);
    showNotification('Adscripción territorial del operador actualizada.');
  };

  // Eliminar usuario
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Deseas desvincular definitivamente este usuario del sistema?')) return;

    try {
      if (supabase) {
        await supabase.from('usuarios').delete().eq('id', userId);
      }
    } catch (e) {
      console.warn('Error al borrar usuario de Supabase. Removiendo de la sesión local.');
    }

    const localVirtualUsers = localStorage.getItem('s_admin_virtual_users');
    if (localVirtualUsers) {
      const list = JSON.parse(localVirtualUsers);
      const updated = list.filter((u: any) => u.id !== userId);
      localStorage.setItem('s_admin_virtual_users', JSON.stringify(updated));
    }

    setSystemUsers(prev => prev.filter(u => u.id !== userId));
    addAuditLog('ELIMINAR_USUARIO', 'usuarios', userId);
    showNotification('Usuario removido del sistema');
  };

  // Cargar datos del Explorador de base de datos
  const loadTableData = async (tableName: string) => {
    setIsRecordsLoading(true);
    try {
      const metadataSchema = schemaService.getTableSchema(tableName);
      setSelectedTableSchema(metadataSchema);

      let records: any[] = [];
      let fetchedFromSupabase = false;
      try {
        if (supabase) {
          const { data, error } = await supabase.from(tableName).select('*').limit(100);
          if (!error && data) {
            records = data;
            fetchedFromSupabase = true;
            setDataSource('supabase');
          }
        }
      } catch (dbErr) {
        console.warn('Fallo consulta de Supabase, recurriendo a simulación:', dbErr);
      }

      if (!fetchedFromSupabase) {
        records = schemaService.getSimulatedRecords(tableName);
        setDataSource('simulado');
      }
      setSelectedTableRecords(records);
    } catch (err) {
      console.error('Error al analizar registros:', err);
    } finally {
      setIsRecordsLoading(false);
    }
  };

  // Atender alerta de onboarding (Aprobación rápida de personal)
  const handleApproveOnboarding = (alertId: string, alertData: any) => {
    const config = quickAssignData[alertId] || { cod_eje: 'MET-01', id_centro: 'CDI-01' };
    
    if (!config.id_centro) {
      alert('Por favor especifique o asigne el Establecimiento / Centro de adscripción departamental.');
      return;
    }

    setIsUsersLoading(true);

    setTimeout(async () => {
      try {
        const cleanEmail = alertData.email.toLowerCase();
        
        // 1. Buscar el usuario virtual y colocarlo en estado aprobado con eje y centro
        const localVirtualUsers = localStorage.getItem('s_admin_virtual_users');
        let list = localVirtualUsers ? JSON.parse(localVirtualUsers) : [];
        
        list = list.map((u: any) => {
          if (u.email.toLowerCase() === cleanEmail) {
            return {
              ...u,
              estado: 'aprobado',
              id_centro: config.id_centro.toUpperCase(),
              cod_eje: config.cod_eje.toUpperCase()
            };
          }
          return u;
        });
        localStorage.setItem('s_admin_virtual_users', JSON.stringify(list));

        // Actualizar en Supabase si está disponible
        if (supabase) {
          try {
            await supabase
              .from('usuarios')
              .update({
                estado: 'aprobado',
                id_centro: config.id_centro.toUpperCase(),
                cod_eje: config.cod_eje.toUpperCase()
              })
              .eq('email', cleanEmail);
          } catch (e) {
            console.warn('Sincronización Supabase omitida:', e);
          }
        }

        // 2. Marcar la alerta como atendida en el listado histórico de alertas
        const alertsStr = localStorage.getItem('s_admin_onboarding_alerts') || '[]';
        const parsedAlerts = JSON.parse(alertsStr);
        const updatedAlerts = parsedAlerts.map((a: any) => {
          if (a.id === alertId) {
            return { ...a, atendida: true };
          }
          return a;
        });
        localStorage.setItem('s_admin_onboarding_alerts', JSON.stringify(updatedAlerts));

        // Auditoría
        addAuditLog('APROBAR_ONBOARDING', 'usuarios', alertData.cedula);

        showNotification(`Onboarding aprobado para ${alertData.nombre}. Cuenta activa asignada a ${config.id_centro}.`);
        fetchUsers();
        fetchOnboardingAlerts();
      } catch (err) {
        console.error(err);
      } finally {
        setIsUsersLoading(false);
      }
    }, 600);
  };

  const handleDenyOnboarding = (alertId: string, alertData: any) => {
    if (!confirm(`¿Desea denegar el acceso a la solicitud de ${alertData.nombre}?`)) return;

    setIsUsersLoading(true);

    setTimeout(() => {
      const cleanEmail = alertData.email.toLowerCase();
      
      // Colocar usuario en rechazado o eliminarlo
      const localVirtualUsers = localStorage.getItem('s_admin_virtual_users');
      let list = localVirtualUsers ? JSON.parse(localVirtualUsers) : [];
      list = list.map((u: any) => {
        if (u.email.toLowerCase() === cleanEmail) {
          return { ...u, estado: 'rechazado' };
        }
        return u;
      });
      localStorage.setItem('s_admin_virtual_users', JSON.stringify(list));

      // Marcar alerta como atendida
      const alertsStr = localStorage.getItem('s_admin_onboarding_alerts') || '[]';
      const parsedAlerts = JSON.parse(alertsStr);
      const updatedAlerts = parsedAlerts.map((a: any) => {
        if (a.id === alertId) {
          return { ...a, atendida: true };
        }
        return a;
      });
      localStorage.setItem('s_admin_onboarding_alerts', JSON.stringify(updatedAlerts));

      addAuditLog('RECHAZAR_ONBOARDING', 'usuarios', alertData.cedula);
      showNotification(`Acceso denegado para ${alertData.nombre}.`);
      fetchUsers();
      fetchOnboardingAlerts();
      setIsUsersLoading(false);
    }, 400);
  };

  // Agregar registro sim en auditoría local
  const addAuditLog = (accion: string, tabla: string, registroId: string) => {
    const logs = localStorage.getItem('s_admin_audit_logs') || '[]';
    const list = JSON.parse(logs);
    list.unshift({
      id: Math.random().toString(36).substr(2, 5).toUpperCase(),
      usuario_email: 'miranda.salud2026@gmail.com',
      accion,
      tabla_afectada: tabla,
      registro_id: registroId,
      fecha: new Date().toISOString()
    });
    localStorage.setItem('s_admin_audit_logs', JSON.stringify(list));
  };

  const handleExportCSV = (tableName: string) => {
    if (selectedTableRecords.length === 0) {
      alert('No hay registros en esta vista para descargar.');
      return;
    }
    
    const headers = Object.keys(selectedTableRecords[0]).join(',');
    const rows = selectedTableRecords.map(row => 
      Object.values(row)
        .map(val => {
          const stringVal = typeof val === 'object' ? JSON.stringify(val) : String(val === null || val === undefined ? '' : val);
          return `"${stringVal.replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `miranda_salud_${tableName}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addAuditLog('EXPORTAR_CSV', tableName, 'CSV_DOWNLOAD');
    showNotification('Archivo CSV exportado exitosamente.');
  };

  const showNotification = (message: string) => {
    setFeedbackMsg({ type: 'success', text: message });
    setTimeout(() => setFeedbackMsg(null), 4500);
  };

  return (
    <div className="space-y-6">
      
      {/* SECCIÓN CABECERA */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-1.5 text-blue-600">
            <Sparkles size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest font-mono">Consola Administrativa Depurada</span>
          </div>
          <h2 className="text-xl font-black uppercase text-slate-800 tracking-tight leading-none mt-1">
            Plataforma SSPA Miranda v2.0
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            Control de Acceso Operativo • Datos Nominales y Fidedignos
          </p>
        </div>

      </div>

      {feedbackMsg && (
        <div className={`p-3 rounded-2xl flex items-center gap-2 text-xs font-bold border ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          <CheckCircle size={14} className="shrink-0" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* ÁREA EN PANTALLA DINÁMICA */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: CONTROL DE USUARIOS Y ALERTAS DE ONBOARDING */}
        {activeTab === 'usuarios' && (
          <motion.div 
            key="usuarios" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* PANEL DE ALERTAS DE ONBOARDING ACTIVO */}
            {onboardingAlerts.length > 0 && (
              <div className="bg-amber-50 border border-amber-250 border-amber-200 rounded-3xl p-5 space-y-4 shadow-sm animate-pulse-slow">
                <div className="flex items-center gap-2 border-b border-amber-200/60 pb-2">
                  <span className="p-1.5 bg-amber-200 text-amber-900 rounded-lg animate-bounce">
                    <AlertTriangle size={15} />
                  </span>
                  <div>
                    <h3 className="text-xs font-black uppercase text-amber-900 tracking-wider">🚨 Alertas de Nuevos Registros de Personal (Onboarding en Espera)</h3>
                    <p className="text-[8.5px] text-amber-700 font-bold uppercase tracking-widest mt-0.5">Se han detectado {onboardingAlerts.length} nuevos operadores registrados sin asignación departamental.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {onboardingAlerts.map(alert => (
                    <div key={alert.id} className="bg-white p-4 rounded-2xl border border-amber-200/50 shadow-inner space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-black text-slate-800 uppercase font-display">{alert.nombre}</p>
                          <p className="text-[9.5px] font-mono text-slate-500 font-bold mt-0.5">{alert.email}</p>
                          <p className="text-[8.5px] text-slate-400 font-mono mt-1 uppercase">Cédula: {alert.cedula}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-yellow-105 bg-yellow-100 text-yellow-800 text-[8px] font-black uppercase rounded border border-yellow-200/50">Por Aprobar</span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block">Eje Geográfico</label>
                          <select
                            value={quickAssignData[alert.id]?.cod_eje || (ejesList[0]?.cod_eje || 'MET')}
                            onChange={e => {
                              const selectedEje = e.target.value;
                              const firstCenter = centrosList.find(c => c.cod_eje === selectedEje)?.nombre_establecimiento || '';
                              setQuickAssignData(prev => ({
                                ...prev,
                                [alert.id]: { cod_eje: selectedEje, id_centro: firstCenter }
                              }));
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[9px] font-bold focus:outline-none"
                          >
                            {ejesList.map(e => (
                              <option key={e.cod_eje} value={e.cod_eje}>{e.nombre_eje || e.cod_eje}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block">Centro de Salud</label>
                          <select
                            value={quickAssignData[alert.id]?.id_centro || ''}
                            onChange={e => setQuickAssignData(prev => ({
                              ...prev,
                              [alert.id]: { ...(prev[alert.id] || { cod_eje: ejesList[0]?.cod_eje || 'MET', id_centro: '' }), id_centro: e.target.value }
                            }))}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[9px] font-bold focus:outline-none"
                          >
                            <option value="">-- SELECCIONE CENTRO --</option>
                            {centrosList
                              .filter(c => c.cod_eje === (quickAssignData[alert.id]?.cod_eje || ejesList[0]?.cod_eje || 'MET'))
                              .map(c => (
                                <option key={c.nombre_establecimiento} value={c.nombre_establecimiento}>
                                  {c.nombre_establecimiento}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => handleDenyOnboarding(alert.id, alert)}
                          className="flex items-center justify-center gap-1 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-black uppercase text-[8.5px] tracking-wider rounded-lg cursor-pointer transition-colors"
                        >
                          <X size={11} /> Denegar
                        </button>
                        <button
                          onClick={() => handleApproveOnboarding(alert.id, alert)}
                          className="flex items-center justify-center gap-1 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 font-black uppercase text-[8.5px] tracking-wider rounded-lg cursor-pointer transition-colors"
                        >
                          <Check size={11} /> Aprobar y Asignar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CREADOR DE USUARIO */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-black text-[#0B3D5C] uppercase tracking-wider">Directiva y Control de Cuentas</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Registre o modifique credenciales y adscripción a centros de salud</p>
                </div>
                <button 
                  onClick={() => setShowCreateUserForm(!showCreateUserForm)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#0B3D5C] text-white hover:bg-[#072437] transition text-[9px] font-black uppercase tracking-widest rounded-xl"
                >
                  <UserPlus size={12} /> {showCreateUserForm ? 'Ocultar Creador' : 'Crear Operador'}
                </button>
              </div>

              {showCreateUserForm && (
                <form onSubmit={handleCreateUserSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Nombre Completo</label>
                    <input 
                      type="text" required placeholder="Ej: Dr. Alejandro Rangel"
                      value={newUser.nombre} onChange={e => setNewUser(prev => ({ ...prev, nombre: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Correo Electrónico (Login)</label>
                    <input 
                      type="email" required placeholder="Ej: ale.salud2026@gmail.com"
                      value={newUser.email} onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Rol Institucional</label>
                    <select
                      value={newUser.rol} onChange={e => setNewUser(prev => ({ ...prev, rol: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                    >
                      <option value="nominal">Operador Nominal (Carga)</option>
                      <option value="oficina">Inspector de Oficina</option>
                      <option value="directivo">Directivo del Estado</option>
                      <option value="admin">Administrador Global</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Código de Eje Geográfico</label>
                    <select
                      value={newUser.cod_eje || 'MET'}
                      onChange={e => {
                        const selectedEje = e.target.value;
                        const firstCenter = centrosList.find(c => c.cod_eje === selectedEje)?.nombre_establecimiento || '';
                        setNewUser(prev => ({ ...prev, cod_eje: selectedEje, id_centro: firstCenter }));
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                    >
                      {ejesList.map(e => (
                        <option key={e.cod_eje} value={e.cod_eje}>{e.nombre_eje || e.cod_eje}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Centro de Salud</label>
                    <select
                      value={newUser.id_centro}
                      onChange={e => setNewUser(prev => ({ ...prev, id_centro: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                    >
                      <option value="">-- SELECCIONE CENTRO --</option>
                      {centrosList
                        .filter(c => c.cod_eje === (newUser.cod_eje || 'MET'))
                        .map(c => (
                          <option key={c.nombre_establecimiento} value={c.nombre_establecimiento}>
                            {c.nombre_establecimiento}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Contraseña / Cédula</label>
                    <input 
                      type="text" placeholder="Asigne clave o Cédula"
                      value={newUser.password || ''} onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                    />
                  </div>
                  <div className="space-y-1 flex items-end col-span-1 md:col-span-3">
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-wide p-2.5 rounded-xl transition cursor-pointer">
                      ⚡ Registrar Cuenta Operativa
                    </button>
                  </div>
                </form>
              )}

              {/* LISTADO DE USUARIOS Y DIRECTIVAS DE ACCESO */}
              <div className="overflow-x-auto">
                {isUsersLoading ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-black uppercase tracking-widest">
                    Cargando nómina de operadores...
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                        <th className="px-4 py-3">Operador Institucional</th>
                        <th className="px-4 py-3">Rol Carga</th>
                        <th className="px-4 py-3">Adscripción Eje / Centro</th>
                        <th className="px-4 py-3">Estado Cuenta</th>
                        <th className="px-4 py-3 text-right">Mantenimiento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {systemUsers.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-[#0B3D5C]/15 flex items-center justify-center text-[11px] font-black text-[#0B3D5C]">
                                {u.nombre ? u.nombre.charAt(0) : 'U'}
                              </div>
                              <div>
                                <p className="text-[11px] font-black text-slate-800 uppercase leading-none">{u.nombre || 'Sin nombre'}</p>
                                <p className="text-[9px] text-slate-450 text-slate-500 font-mono mt-1">
                                  {u.email} • <span className="text-emerald-700 font-black bg-emerald-50 border border-emerald-100 px-1 py-0.5 rounded text-[8.5px]">Clave: {localStorage.getItem(`sim_pass_${u.email.toLowerCase()}`) || 'nominal2026'}</span>
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select 
                              value={u.rol} onChange={e => handleUserRoleChange(u.id, e.target.value)}
                              className="text-[9px] font-black px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                            >
                              <option value="admin">Administrador</option>
                              <option value="directivo">Directivo SSPA</option>
                              <option value="oficina">Inspector Oficina</option>
                              <option value="nominal">Operador Carga Nominal</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] font-black uppercase text-slate-400 w-8 inline-block">Eje:</span>
                              <select 
                                value={u.cod_eje || ''} 
                                onChange={async (e) => {
                                  const newEje = e.target.value;
                                  // Update Axis in Supabase & local simulated state
                                  const firstCenterOfEje = centrosList.find(c => c.cod_eje === newEje)?.nombre_establecimiento || '';
                                  await handleUserAdscriptionChange(u.id, newEje, firstCenterOfEje);
                                }}
                                className="text-[9px] font-black px-1 py-0.5 rounded border border-slate-200 bg-white"
                              >
                                <option value="">SIN ASIGNAR</option>
                                {ejesList.map(e => (
                                  <option key={e.cod_eje} value={e.cod_eje}>{e.cod_eje}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] font-black uppercase text-slate-400 w-8 inline-block">Centro:</span>
                              <select 
                                value={u.id_centro || ''} 
                                onChange={async (e) => {
                                  const newCentro = e.target.value;
                                  const matchedEje = centrosList.find(c => c.nombre_establecimiento === newCentro)?.cod_eje || u.cod_eje || 'MET';
                                  await handleUserAdscriptionChange(u.id, matchedEje, newCentro);
                                }}
                                className="text-[9px] font-bold px-1 py-0.5 rounded border border-slate-200 bg-white max-w-[140px] truncate"
                              >
                                <option value="">SIN CENTRO</option>
                                {centrosList
                                  .filter(c => !u.cod_eje || c.cod_eje === u.cod_eje)
                                  .map(c => (
                                    <option key={c.nombre_establecimiento} value={c.nombre_establecimiento}>
                                      {c.nombre_establecimiento}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select 
                              value={u.estado || 'aprobado'} onChange={e => handleUserStatusChange(u.id, e.target.value)}
                              className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider focus:outline-none ${
                                u.estado === 'aprobado' ? 'bg-green-50 text-green-700 border border-green-200' :
                                u.estado === 'rechazado' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              <option value="aprobado">Aprobado</option>
                              <option value="pendiente">Pendiente</option>
                              <option value="rechazado">Rechazado</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button 
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: EXPLORADOR DE BASE DE DATOS ACTIVA - CON ENLACES DIRECTOS A LOS LIBROS NOMINALES EN GOOGLE SHEETS */}
        {false && (
          <motion.div 
            key="tablas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* SECCIÓN PRINCIPAL: ECOSISTEMA DE HOJAS DE CÁLCULO GUBERNAMENTALES (GOOGLE SHEETS) */}
            <div className="bg-gradient-to-r from-[#072437] to-[#0B3D5C] text-white p-6 rounded-3xl border border-slate-200/10 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-[#FFD700]">
                    <FileSpreadsheet size={16} />
                    Ecosistema de Libros de Cálculo Gubernamentales (Google Sheets)
                  </h3>
                  <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-1">
                    Acceda en vivo a las hojas de cálculo individuales asignadas a cada eje y a los libros consolidados del estado.
                  </p>
                </div>
                <span className="bg-emerald-500 text-slate-950 text-[8.5px] font-black px-2.5 py-1 rounded-full uppercase font-mono tracking-wider">
                  En Vivo Sincronizado
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {/* Consolidado Semanal */}
                <a 
                  href="https://docs.google.com/spreadsheets/d/1iu3UpCktHPDhUJOVWhwL0-zCZ523aJelWIPgHaLE-20/edit" 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/25 rounded-2xl p-4 transition-all hover:-translate-y-0.5 flex flex-col justify-between h-[115px] group select-none decoration-transparent text-white"
                >
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-[7.5px] font-black uppercase text-yellow-300 bg-yellow-400/10 px-2 py-0.5 rounded">Consolidación</span>
                      <ExternalLink size={12} className="text-white/40 group-hover:text-white" />
                    </div>
                    <h4 className="text-xs font-black uppercase mt-2 font-display text-white">Consolidado Semanal</h4>
                    <p className="text-[9px] text-slate-300 font-bold leading-normal mt-0.5">Libro Maestro Semanal de ASIC por Ejes.</p>
                  </div>
                  <span className="text-[8.5px] font-mono text-yellow-300 uppercase tracking-widest font-black">Abrir Documento →</span>
                </a>

                {/* Histórico Permanente */}
                <a 
                  href="https://docs.google.com/spreadsheets/d/1zhkYo7kzcb-2r07Becb-wLEFzYEmb-LYxVgl07Njk-g/edit" 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/25 rounded-2xl p-4 transition-all hover:-translate-y-0.5 flex flex-col justify-between h-[115px] group select-none decoration-transparent text-white"
                >
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-[7.5px] font-black uppercase text-emerald-300 bg-emerald-400/10 px-2 py-0.5 rounded">Resguardo</span>
                      <ExternalLink size={12} className="text-white/40 group-hover:text-white" />
                    </div>
                    <h4 className="text-xs font-black uppercase mt-2 font-display text-white">Histórico Permanente</h4>
                    <p className="text-[9px] text-slate-300 font-bold leading-normal mt-0.5">Acumulado permanente de todos los períodos.</p>
                  </div>
                  <span className="text-[8.5px] font-mono text-emerald-300 uppercase tracking-widest font-black">Abrir Documento →</span>
                </a>

                {/* Carpeta de Respaldos ZIP */}
                <a 
                  href="https://drive.google.com/drive/folders/19RTGSwQuisCSr1YLZrZX6ezngQ_69Mhv" 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/25 rounded-2xl p-4 transition-all hover:-translate-y-0.5 flex flex-col justify-between h-[115px] group select-none decoration-transparent text-white"
                >
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-[7.5px] font-black uppercase text-blue-305 text-blue-300 bg-blue-400/10 px-2 py-0.5 rounded">Google Drive</span>
                      <ExternalLink size={12} className="text-white/40 group-hover:text-white" />
                    </div>
                    <h4 className="text-xs font-black uppercase mt-2 font-display text-white">Respaldos ZIP</h4>
                    <p className="text-[9px] text-slate-300 font-bold leading-normal mt-0.5">Respaldos estructurados automatizados en Drive.</p>
                  </div>
                  <span className="text-[8.5px] font-mono text-blue-300 uppercase tracking-widest font-black">Ver Carpeta →</span>
                </a>

                {/* Buscador Rápido de Ejes */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-[115px]">
                  <div>
                    <span className="text-[7.5px] font-black uppercase text-purple-300 bg-purple-450/20 bg-purple-400/10 px-2 py-0.5 rounded w-fit block">Ejes Territoriales</span>
                    <h4 className="text-xs font-black uppercase mt-1.5 font-display text-slate-200">Libros por Eje</h4>
                    <p className="text-[8px] text-slate-300 font-bold leading-tight mt-0.5">Seleccione un eje para abrir su hoja individual en vivo.</p>
                  </div>
                  <select 
                    onChange={(e) => {
                      if (e.target.value) {
                        window.open(e.target.value, '_blank');
                        e.target.value = ''; // Reset
                      }
                    }}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-1.5 px-2 text-[9px] font-black text-white focus:outline-none focus:bg-[#072437] cursor-pointer"
                  >
                    <option value="" className="text-slate-800 font-bold">-- ABRIR HOJA DE EJE --</option>
                    <option value="https://docs.google.com/spreadsheets/d/1amIenrqhZ5yGFnV_qSEklDUkBF-obLeC3U234KxZC18/edit" className="text-slate-800 font-bold">Altos Mirandinos (Eje)</option>
                    <option value="https://docs.google.com/spreadsheets/d/1bFBoYIWGtplX37QypiyUerMIDl_g-MeBNnCKZifZvp0/edit" className="text-slate-800 font-bold">Valles del Tuy (Eje)</option>
                    <option value="https://docs.google.com/spreadsheets/d/1DV2rbO771sC5pcKUUf_kr9Ej4VtkF6Oo9uL8oJHSXGQ/edit" className="text-slate-800 font-bold">Guarenas-Guatire (Eje)</option>
                    <option value="https://docs.google.com/spreadsheets/d/1mwA2Z1ncghe4-w46BkEwbUC8Bdn_7uAWMaUND-3TB3w/edit" className="text-slate-800 font-bold">Barlovento (Eje)</option>
                    <option value="https://docs.google.com/spreadsheets/d/1n9eFrM_CvbrP_b7uxIEb2Qm42u6X9byrRugIed_ehO0/edit" className="text-slate-800 font-bold">Metropolitano (Eje)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* WIDGET DE ACCESO DIRECTO INDEPENDIENTE A LAS HOJAS NOMINALES */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-[#0B3D5C] flex items-center gap-2">
                  <FileSpreadsheet size={15} className="text-[#0B3D5C]" />
                  Acceso Directo e Independiente por Nómina (Cargas Activas en Vivo)
                </h3>
                <p className="text-[10px] text-slate-405 text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  Abra directamente cada hoja de cálculo individual de Google Sheets o asigne registros nominales de forma unificada.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Quirúrgica */}
                <div className="border border-blue-100 bg-blue-50/15 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[8px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded uppercase tracking-wider font-mono">Pestaña: Nominas Quirurgicas</span>
                    <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5 mt-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Planilla Quirúrgica
                    </h4>
                    <p className="text-[9.5px] text-slate-500 font-bold uppercase tracking-tight mt-1 leading-normal text-left">
                      Intervenciones quirúrgicas programadas, cirujanos certificantes y centros de salud activos en todo el estado.
                    </p>
                  </div>
                  <a 
                    href="https://docs.google.com/spreadsheets/d/1WeJ4q40PcNrIi6e2Odi_LtiOq4LWx4qdYRwdE1RGTL0/edit" 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full text-center py-2.5 bg-[#0B3D5C] hover:bg-[#072437] text-white rounded-xl text-[9.5px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-xs decoration-transparent"
                  >
                    Abrir Nómina Quirúrgica <ExternalLink size={11} />
                  </a>
                </div>

                {/* Materna/Obstétrica */}
                <div className="border border-purple-100 bg-purple-50/15 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[8px] font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded uppercase tracking-wider font-mono">Pestaña: Nominas Obstetricas</span>
                    <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5 mt-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      Carga Obstétrica / Materna
                    </h4>
                    <p className="text-[9.5px] text-slate-500 font-bold uppercase tracking-tight mt-1 leading-normal text-left">
                      Plan materno regional: partos, cesáreas registradas y datos de niños nacidos vivos o fallecidos.
                    </p>
                  </div>
                  <a 
                    href="https://docs.google.com/spreadsheets/d/1WeJ4q40PcNrIi6e2Odi_LtiOq4LWx4qdYRwdE1RGTL0/edit" 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full text-center py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[9.5px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-xs decoration-transparent"
                  >
                    Abrir Nómina Obstétrica <ExternalLink size={11} />
                  </a>
                </div>

                {/* Defunciones */}
                <div className="border border-rose-100 bg-rose-50/15 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[8px] font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded uppercase tracking-wider font-mono">Pestaña: Nominas Defunciones</span>
                    <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5 mt-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      Registro de Defunciones
                    </h4>
                    <p className="text-[9.5px] text-slate-500 font-bold uppercase tracking-tight mt-1 leading-normal text-left">
                      Casos de mortalidad intrahospitalarios, etiologías patológicas y certificaciones médicas asociadas.
                    </p>
                  </div>
                  <a 
                    href="https://docs.google.com/spreadsheets/d/1WeJ4q40PcNrIi6e2Odi_LtiOq4LWx4qdYRwdE1RGTL0/edit" 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full text-center py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[9.5px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-xs decoration-transparent"
                  >
                    Abrir Nómina de Defunciones <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            </div>

            <div id="explorador-clinico-tablas" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-black text-[#0B3D5C] uppercase tracking-wider">Explorador Clínico de Reportes Nominales</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Audite las planillas de atenciones cargadas por los operadores regionales.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-grow max-w-md space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Seleccionar Estructura o Planilla de Datos</label>
                  <select 
                    value={tablaSeleccionada}
                    onChange={(e) => setTablaSeleccionada(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-xs font-bold focus:outline-none focus:border-[#0B3D5C] shadow-xs"
                  >
                    {listaTablas.map(tabla => (
                      <option key={tabla} value={tabla}>
                        📋 [Planilla] {tabla.toUpperCase().replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {tablaSeleccionada && (
                  <button 
                    onClick={() => loadTableData(tablaSeleccionada)}
                    className="p-2.5 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 rounded-xl transition cursor-pointer flex items-center justify-center h-[38px] w-[38px]"
                    title="Recargar datos"
                  >
                    <RefreshCw size={14} className={isRecordsLoading ? 'animate-spin' : ''} />
                  </button>
                )}

                {tablaSeleccionada && selectedTableRecords.length > 0 && (
                  <button 
                    onClick={() => handleExportCSV(tablaSeleccionada)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0B3D5C] text-white hover:bg-slate-800 rounded-xl font-black text-[9.5px] uppercase tracking-wider transition cursor-pointer h-[38px]"
                  >
                    <Download size={12} /> Exportar como CSV
                  </button>
                )}
              </div>
            </div>

            {tablaSeleccionada && selectedTableSchema && (
              <div className="space-y-6">
                {/* INDICADOR DE CONDUCTO DE PERSISTENCIA */}
                {dataSource === 'supabase' ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 flex items-start gap-3 shadow-xs">
                    <div className="p-2 bg-emerald-650 bg-emerald-600 text-white rounded-2xl flex-shrink-0">
                      <Database size={16} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">🔌 Conducto Conectado a la Base de Datos Histórica</h4>
                      <p className="text-[9.5px] text-emerald-700 font-bold mt-1 leading-normal uppercase">
                        La planilla <span className="font-mono bg-emerald-100/50 px-1.5 py-0.5 rounded text-emerald-950 font-black">{tablaSeleccionada}</span> está sincronizada con Supabase de manera persistente e inmutable.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-3xl p-4 flex items-start gap-3 shadow-xs">
                    <div className="p-2 bg-blue-600 text-white rounded-2xl flex-shrink-0">
                      <Clock size={16} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-widest">📦 Conducto de Resguardo Desconectado Activo</h4>
                      <p className="text-[9.5px] text-blue-700 font-bold mt-1 leading-normal uppercase">
                        La planilla <span className="font-mono bg-blue-100 px-1.5 py-0.5 rounded text-blue-950 font-black">{tablaSeleccionada}</span> está resolviendo registros a través de la tubería local de resguardo SIM Miranda.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* LADO IZQUIERDO: METADATOS Y COLUMNAS */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 lg:col-span-1">
                    <div>
                      <h4 className="text-xs font-black text-[#0B3D5C] uppercase tracking-wider">Esquema Reflexivo</h4>
                      <p className="text-[9.5px] text-slate-400 mt-1 uppercase font-bold tracking-wide">{selectedTableSchema.descripcion}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Columnas estructuradas</span>
                      <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                        {selectedTableSchema.columnas.map(col => (
                          <div key={col.name} className="py-2 flex items-center justify-between text-xs font-medium">
                            <span className="font-mono text-blue-650 text-blue-600 font-bold text-[10.5px]">{col.name}</span>
                            <div className="text-right">
                              <span className="text-slate-800 block text-[10px] font-bold">{col.label}</span>
                              <span className="text-[8px] font-mono text-slate-400 bg-slate-50 border px-1 rounded uppercase tracking-wide">{col.type}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* LADO DERECHO: REGISTROS CARGADOS */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 lg:col-span-2">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h4 className="text-xs font-black text-[#0B3D5C] uppercase tracking-wider">
                        Registros de la tabla: <span className="font-mono text-blue-600 lowercase">{tablaSeleccionada}</span>
                      </h4>
                      <span className="bg-[#0B3D5C]/10 text-[#0B3D5C] text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                        Muestra: {selectedTableRecords.length} filas
                      </span>
                    </div>

                    {isRecordsLoading ? (
                      <div className="py-16 text-center text-slate-400 text-xs font-black uppercase tracking-widest">
                        Consultando registros...
                      </div>
                    ) : selectedTableRecords.length === 0 ? (
                      <div className="py-16 text-center text-slate-400 text-xs italic font-medium">
                        Esta planilla no contiene atenciones cargadas aún.
                      </div>
                    ) : (
                      <div className="overflow-x-auto max-h-[480px]">
                        <table className="w-full text-left font-sans text-[10px]">
                          <thead>
                            <tr className="bg-slate-50 text-[8.5px] font-black text-slate-400 uppercase border-b border-slate-100">
                              {selectedTableSchema.columnas.slice(0, 5).map(col => (
                                <th key={col.name} className="px-3 py-2.5">{col.label}</th>
                              ))}
                              <th className="px-3 py-2.5 text-right">Detalle</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedTableRecords.map((rec, rIdx) => (
                              <tr key={rec.id || rec.cedula || rIdx} className="hover:bg-slate-50/50 transition-colors">
                                {selectedTableSchema.columnas.slice(0, 5).map(col => {
                                  const val = rec[col.name];
                                  const stringVal = typeof val === 'object' ? JSON.stringify(val) : String(val === undefined || val === null ? '' : val);
                                  return (
                                    <td key={col.name} className="px-3 py-2 font-semibold text-slate-700 max-w-[150px] truncate uppercase">
                                      {stringVal}
                                    </td>
                                  );
                                })}
                                <td className="px-3 py-2 text-right">
                                  <button 
                                    onClick={() => setSelectedInspectRecord(rec)}
                                    className="text-blue-600 font-black hover:underline uppercase text-[9px] tracking-wide cursor-pointer"
                                  >
                                    🔬 Inspeccionar
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3: BUSCADOR INTEGRAL DE EXPEDIENTES DE PACIENTES */}
        {false && (
          <motion.div 
            key="pacientes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Buscador de Entrada */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-black text-[#0B3D5C] uppercase tracking-wider">Buscador Unificado de Expedientes y Fichas de Pacientes</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  Ingrese cualquier atributo identificativo (Cédula, Nombres, Apellidos o Teléfono) para traer de inmediato su expediente consolidado.
                </p>
              </div>

              <form onSubmit={handlePatientSearchSubmit} className="flex gap-3">
                <div className="relative flex-grow">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <Search size={15} />
                  </span>
                  <input
                    type="text"
                    value={patientSearchQuery}
                    onChange={(e) => setPatientSearchQuery(e.target.value)}
                    placeholder="Escriba Cédula, Nombre, Apellido o Teléfono del Paciente... (Ej: Pedro, V-14234567, 0414)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0B3D5C] focus:bg-white transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPatientSearching || !patientSearchQuery.trim()}
                  className="px-6 py-3 bg-[#0B3D5C] hover:bg-[#072437] disabled:bg-slate-300 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap animate-none"
                >
                  {isPatientSearching ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
                  Traer Datos Paciente
                </button>
              </form>
            </div>

            {/* Panel de Dos Columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* Columna Izquierda: Resultados de Búsqueda (Cédula, Nombre, Apellido, Teléfono) */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 lg:col-span-2">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-black text-[#0B3D5C] uppercase tracking-wider">Hojas de Expedientes Coincidentes</h4>
                  <span className="bg-blue-50 text-blue-700 text-[8.5px] font-black px-2.5 py-1 rounded-full uppercase font-mono">
                    Encontrados: {patientSearchResults.length}
                  </span>
                </div>

                {isPatientSearching ? (
                  <div className="py-24 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest space-y-2">
                    <RefreshCw size={20} className="animate-spin mx-auto text-[#0B3D5C]" />
                    <p>Trayendo registros desde el conducto...</p>
                  </div>
                ) : patientSearchResults.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs italic font-medium">
                    {patientSearchQuery.trim() 
                      ? 'No se encontraron pacientes que coincidan con la consulta de búsqueda.' 
                      : 'Escriba un patrón arriba y presione "Traer Datos Paciente".'}
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {patientSearchResults.map((patient) => {
                      const isSelected = selectedPatientForHistory?.cedula === patient.cedula;
                      return (
                        <div
                          key={patient.cedula}
                          onClick={() => loadPatientHistory(patient)}
                          className={`p-4 border rounded-2xl cursor-pointer transition relative overflow-hidden group select-none text-left ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50/40 shadow-xs' 
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-mono text-[9px] font-black text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100/50 inline-block uppercase">
                                {patient.cedula}
                              </p>
                              <h5 className="font-black text-slate-800 text-[11px] uppercase tracking-tight mt-1.5 leading-none">
                                {patient.nombre} {patient.apellido}
                              </h5>
                            </div>
                            <span className="text-[8.5px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                              {patient.sexo || 'Femenino'} • {patient.edad || 0} años
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-3 text-[9.5px] text-slate-500 font-bold border-t border-slate-100/60 pt-2">
                            <Phone size={10} className="text-slate-400" />
                            <span>Teléfono: <span className="font-mono text-slate-700">{patient.telefono || 'No registrado'}</span></span>
                          </div>

                          {isSelected && (
                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Columna Derecha: Detalle y Historial Clínico Exhaustivo del Paciente */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 lg:col-span-3">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-black text-[#0B3D5C] uppercase tracking-wider">Historial Clínico Consolidado</h4>
                  <p className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase tracking-widest">Procedimientos quirúrgicos, obstétricos o egresos vitales asociados.</p>
                </div>

                {!selectedPatientForHistory ? (
                  <div className="py-24 text-center text-slate-400 text-xs italic font-semibold max-w-sm mx-auto">
                    Seleccione una ficha de paciente de la columna izquierda para inspeccionar sus atenciones y auditoría retrospectiva.
                  </div>
                ) : isHistoryLoading ? (
                  <div className="py-24 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest space-y-2">
                    <RefreshCw size={20} className="animate-spin mx-auto text-[#0B3D5C]" />
                    <p>Estructurando línea de tiempo clínica...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Tarjeta Detallada con Copiado Rápido */}
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black bg-[#0B3D5C] text-white px-2.5 py-1 rounded-full uppercase tracking-wider">Expediente Activo</span>
                        <button
                          onClick={() => {
                            const clipText = `Paciente: ${selectedPatientForHistory.nombre} ${selectedPatientForHistory.apellido}\nCédula: ${selectedPatientForHistory.cedula}\nEdad: ${selectedPatientForHistory.edad}\nSexo: ${selectedPatientForHistory.sexo}\nTeléfono: ${selectedPatientForHistory.telefono}`;
                            navigator.clipboard.writeText(clipText);
                            showNotification("Datos generales copiados al portapapeles");
                          }}
                          className="text-[9px] text-blue-600 font-black uppercase hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          📋 Copiar Ficha de Texto
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs font-bold p-1">
                        <div>
                          <span className="text-[8px] text-slate-400 uppercase tracking-widest block">Nombres y Apellidos</span>
                          <span className="text-slate-800 uppercase text-[11px] font-black">{selectedPatientForHistory.nombre} {selectedPatientForHistory.apellido}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 uppercase tracking-widest block">Cédula de Identidad</span>
                          <span className="text-slate-800 font-mono text-[11px] font-black">{selectedPatientForHistory.cedula}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 uppercase tracking-widest block">Edad / Sexo Biológico</span>
                          <span className="text-slate-800 uppercase text-[10px]">{selectedPatientForHistory.edad || 0} años • {selectedPatientForHistory.sexo || 'Indefinido'}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-400 uppercase tracking-widest block">Teléfono de Contacto</span>
                          <span className="text-slate-800 font-mono text-[10px]">{selectedPatientForHistory.telefono || 'S/N Registrado'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Línea de Tiempo de Eventos Clínicos */}
                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Línea de Vida y Cargas Clínicas Asociadas</h5>
                      
                      {/* Eventos Quirúrgicos */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          <span className="text-[9.5px] font-black text-slate-600 uppercase tracking-wider">Eventos Quirúrgicos ({selectedPatientHistory.quirurgicos.length})</span>
                        </div>
                        {selectedPatientHistory.quirurgicos.length === 0 ? (
                          <p className="text-[9.5px] text-slate-400 italic font-semibold pl-3.5">No registra procedimientos quirúrgicos.</p>
                        ) : (
                          <div className="space-y-2 pl-3.5 border-l-2 border-emerald-100">
                            {selectedPatientHistory.quirurgicos.map((ev: any) => (
                              <div key={ev.id} className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-2xl space-y-1.5 text-[10px] font-semibold text-slate-700">
                                <div className="flex justify-between items-center">
                                  <span className="text-emerald-800 font-black uppercase text-[9px] bg-emerald-100 px-2 py-0.5 rounded-md">
                                    {ev.tipo_intervencion || 'Operación'}
                                  </span>
                                  <span className="font-mono text-slate-400 text-[8.5px]">{new Date(ev.fecha || ev.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-[9.5px] font-medium uppercase mt-1">Especialidad: <span className="font-bold text-slate-800">{ev.especialidad_quirurgica}</span></p>
                                <p className="text-[9.5px] font-medium uppercase col-span-2">Médico Cirujano: <span className="font-bold text-slate-800">{ev.nombre_medico}</span></p>
                                <p className="text-[9.5px] font-medium uppercase mt-0.5">Establecimiento: <span className="font-bold text-[#0B3D5C]">{ev.centro_salud}</span></p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Eventos Obstétricos */}
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                          <span className="text-[9.5px] font-black text-slate-600 uppercase tracking-wider">Atención Gineco-Obstétrica ({selectedPatientHistory.obstetricos.length})</span>
                        </div>
                        {selectedPatientHistory.obstetricos.length === 0 ? (
                          <p className="text-[9.5px] text-slate-400 italic font-semibold pl-3.5">No registra ingresos gineco-obstétricos.</p>
                        ) : (
                          <div className="space-y-2 pl-3.5 border-l-2 border-purple-100">
                            {selectedPatientHistory.obstetricos.map((ev: any) => (
                              <div key={ev.id} className="bg-purple-50/50 border border-purple-100 p-3 rounded-2xl space-y-1.5 text-[10px] font-semibold text-slate-700">
                                <div className="flex justify-between items-center">
                                  <span className="text-purple-800 font-black uppercase text-[9px] bg-purple-100 px-2 py-0.5 rounded-md">
                                    Parto: {ev.tipo_parto || 'Ginecológico'}
                                  </span>
                                  <span className="font-mono text-slate-400 text-[8.5px]">{new Date(ev.fecha || ev.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-[9.5px] font-medium uppercase mt-1">Nacidos Vivos: <span className="font-bold text-slate-800">{ev.vivos}</span> • Muertos: <span className="font-bold text-slate-800">{ev.muertos}</span></p>
                                <p className="text-[9.5px] font-medium uppercase">Obstetra Certificador: <span className="font-bold text-slate-800">{ev.nombre_medico}</span></p>
                                <p className="text-[9.5px] font-medium uppercase">Establecimiento: <span className="font-bold text-[#0B3D5C]">{ev.centro_salud}</span></p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Eventos de Defunción */}
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                          <span className="text-[9.5px] font-black text-slate-600 uppercase tracking-wider">Egresos por Fallecimiento ({selectedPatientHistory.defunciones.length})</span>
                        </div>
                        {selectedPatientHistory.defunciones.length === 0 ? (
                          <p className="text-[9.5px] text-slate-400 italic font-semibold pl-3.5">No constan defunciones médicas en bitácora.</p>
                        ) : (
                          <div className="space-y-2 pl-3.5 border-l-2 border-rose-100">
                            {selectedPatientHistory.defunciones.map((ev: any) => (
                              <div key={ev.id} className="bg-rose-50/50 border border-rose-100 p-3 rounded-2xl space-y-1.5 text-[10px] font-semibold text-slate-700">
                                <div className="flex justify-between items-center">
                                  <span className="text-rose-800 font-black uppercase text-[9px] bg-rose-100 px-2 py-0.5 rounded-md">
                                    Defunción Certificada
                                  </span>
                                  <span className="font-mono text-slate-400 text-[8.5px]">{new Date(ev.fecha || ev.created_at).toLocaleDateString()} {ev.hora_fallecimiento}</span>
                                </div>
                                <p className="text-[9.5px] font-medium uppercase mt-1">Causa de muerte: <span className="font-bold text-rose-700">{ev.patologia}</span></p>
                                <p className="text-[9.5px] font-medium col-span-2">Observaciones: <span className="text-slate-600 font-normal">{ev.observacion || 'Ninguna'}</span></p>
                                <p className="text-[9.5px] font-medium uppercase">Médico Certificador: <span className="font-bold text-slate-800">{ev.nombre_medico}</span></p>
                                <p className="text-[9.5px] font-medium uppercase">Establecimiento: <span className="font-bold text-[#0B3D5C]">{ev.centro_salud}</span></p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* MODAL DETALLADO REFLEXIVO PARA INSPECCIONAR FILAS NOMINALES */}
      <AnimatePresence>
        {selectedInspectRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedInspectRecord(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-[#0B3D5C] text-white p-5 flex items-center justify-between">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#FFD700] bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                    Ficha de Auditoría Coherente
                  </span>
                  <h3 className="text-sm font-black uppercase text-white mt-2 tracking-tight font-display">Detalle Integral de la Fila</h3>
                </div>
                <button
                  onClick={() => setSelectedInspectRecord(null)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition duration-150 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Contenido Clave-Valor Elegante */}
              <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                <div className="bg-slate-50 border border-slate-150/80 rounded-2xl p-4 divide-y divide-slate-200">
                  {Object.entries(selectedInspectRecord).map(([key, value]) => {
                    const matchedColumnDesc = selectedTableSchema?.columnas.find(c => c.name === key);
                    const labelText = matchedColumnDesc ? matchedColumnDesc.label : key.replace(/_/g, ' ').toUpperCase();
                    const stringifiedValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value === null || value === undefined ? '—' : value);

                    return (
                      <div key={key} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black text-[#0B3D5C] uppercase block tracking-wide">
                            {labelText}
                          </span>
                          <span className="text-[8px] font-mono text-slate-400 block uppercase">
                            Identificador: {key}
                          </span>
                        </div>
                        <div className="font-mono text-[10px] font-bold text-slate-800 bg-white border border-slate-200 px-2 py-1 rounded-lg uppercase shadow-3xs max-w-[245px] truncate text-right">
                          {stringifiedValue}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 border-t border-slate-100 p-4 flex gap-3 justify-end items-center">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedInspectRecord, null, 2));
                    showNotification("Fila copiada al portapapeles como JSON");
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  📋 Copiar JSON
                </button>
                <button
                  onClick={() => setSelectedInspectRecord(null)}
                  className="px-5 py-2 bg-[#0B3D5C] text-white hover:bg-slate-800 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
