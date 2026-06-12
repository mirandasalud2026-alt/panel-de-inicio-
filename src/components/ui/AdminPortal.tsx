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
  X
} from 'lucide-react';
import { supabase, UserProfile } from '../../lib/supabase';
import { schemaService } from '../../services/schemaService';

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState<'usuarios' | 'tablas'>('usuarios');

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

  // Cargar datos iniciales de base de datos
  useEffect(() => {
    fetchUsers();
    loadTablesList();
    fetchOnboardingAlerts();
    fetchTerritoryMetadata();
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

        {/* SELECTOR DE PESTAÑAS (Limitado solo a requerimientos reales del usuario) */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'usuarios' 
                ? 'bg-[#0B3D5C] text-white shadow-xs' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users size={13} /> Control de Usuarios
          </button>
          
          <button
            onClick={() => setActiveTab('tablas')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'tablas' 
                ? 'bg-[#0B3D5C] text-white shadow-xs' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Database size={13} /> Datos Nominales
          </button>
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

        {/* TAB 2: EXPLORADOR DE BASE DE DATOS ACTIVA */}
        {activeTab === 'tablas' && (
          <motion.div 
            key="tablas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
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
                                    onClick={() => alert(`Detalle Integral de la Fila:\n\n${JSON.stringify(rec, null, 2)}`)}
                                    className="text-blue-600 font-black hover:underline uppercase text-[9px] tracking-wide cursor-pointer"
                                  >
                                    Inspeccionar
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

      </AnimatePresence>
    </div>
  );
}
