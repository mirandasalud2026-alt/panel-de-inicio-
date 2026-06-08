// src/components/ui/AdminPortal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Database, 
  Layers, 
  RefreshCw, 
  PlusCircle, 
  Trash2, 
  Key, 
  UserPlus, 
  Terminal, 
  Clock, 
  FileSpreadsheet, 
  CheckCircle, 
  ShieldAlert, 
  Download, 
  Sparkles,
  Award,
  Sliders,
  CheckSquare,
  BarChart3
} from 'lucide-react';
import { supabase, UserProfile } from '../../lib/supabase';
import { schemaService } from '../../services/schemaService';
import { pipelineService } from '../../services/pipelineService';
import { ConfiguracionModulo, CampoEstructura } from '../../types/admin';
import { DynamicForm } from '../DynamicForm';
import AnalyticsEngine from './AnalyticsEngine';

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState<'usuarios' | 'tablas' | 'generador' | 'respaldos' | 'analisis'>('analisis'); // Defaults to 'analisis' for immediate display of user requested features

  
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
  const [selectedUserForAssign, setSelectedUserForAssign] = useState<UserProfile | null>(null);

  // Tab 2: Explorador de Base de Datos
  const [listaTablas, setListaTablas] = useState<string[]>([]);
  const [tablaSeleccionada, setTablaSeleccionada] = useState<string>('');
  const [selectedTableSchema, setSelectedTableSchema] = useState<{ descripcion: string; columnas: { name: string; type: string; label: string }[] } | null>(null);
  const [selectedTableRecords, setSelectedTableRecords] = useState<any[]>([]);
  const [isRecordsLoading, setIsRecordsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'supabase' | 'simulado' | 'local_dinamico'>('simulado');

  // Tab 3: Generador Inteligente
  const [jsonInput, setJsonInput] = useState<string>('');
  const [moduloPreview, setModuloPreview] = useState<ConfiguracionModulo | null>(null);
  const [availableModules, setAvailableModules] = useState<ConfiguracionModulo[]>([]);

  // Tab 4: Políticas de Resguardo
  const [sheetsSyncLogs, setSheetsSyncLogs] = useState<any[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'err'; text: string } | null>(null);

  // 1. Cargar datos iniciales
  useEffect(() => {
    fetchUsers();
    loadTablesList();
    loadModules();
    loadSheetsLogs();
  }, []);

  useEffect(() => {
    if (tablaSeleccionada) {
      loadTableData(tablaSeleccionada);
    }
  }, [tablaSeleccionada]);

  // Cargar módulos configurados
  const loadModules = () => {
    const modules = schemaService.getDynamicModules();
    setAvailableModules(modules);
  };

  const loadTablesList = async () => {
    const tables = await schemaService.getTables();
    setListaTablas(tables);
  };

  const loadSheetsLogs = () => {
    const logs = localStorage.getItem('s_admin_google_sheets_sync');
    setSheetsSyncLogs(logs ? JSON.parse(logs) : [
      { id: 'sh-1092', tabla: 'registros_quirurgicos', fijo_fecha: new Date().toISOString(), columnas_conteo: 8, estado: 'Exitoso 🟢' },
      { id: 'sh-4055', tabla: 'registros_defunciones', fijo_fecha: new Date().toISOString(), columnas_conteo: 7, estado: 'Exitoso 🟢' }
    ]);
  };

  // Cargar usuarios de Supabase + Virtuales locales
  const fetchUsers = async () => {
    setIsUsersLoading(true);
    let dbUsers: UserProfile[] = [];
    
    // 1. Cargar desde Supabase si está disponible
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

    // 2. Cargar virtuales locales
    const localVirtualUsers = localStorage.getItem('s_admin_virtual_users');
    const parsedVirtuals = localVirtualUsers ? JSON.parse(localVirtualUsers) : [];
    
    // Unir sin duplicar por email
    const merged = [...dbUsers];
    parsedVirtuals.forEach((vu: UserProfile) => {
      if (!merged.some(u => u.email.toLowerCase() === vu.email.toLowerCase())) {
        merged.push(vu);
      }
    });

    // Si no hay ninguno, colocar por defecto
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

    // Registrar en Supabase
    try {
      if (supabase) {
        // Guardar perfil en base de datos
        await supabase.from('usuarios').insert(created);
      }
    } catch (err) {
      console.warn('Sincronización online fallida al crear el usuario. Se almacenará en la bitácora local.', err);
    }

    // Encolar localmente para consistencia garantizada
    const localVirtualUsers = localStorage.getItem('s_admin_virtual_users');
    const list = localVirtualUsers ? JSON.parse(localVirtualUsers) : [];
    list.unshift(created);
    localStorage.setItem('s_admin_virtual_users', JSON.stringify(list));

    // Guardar credenciales de simulación para que puedan hacer Login offline
    localStorage.setItem(`sim_pass_${emailClean}`, newUser.password || 'nominal2026');

    // Auditoría
    addAuditLog('CREAR_USUARIO', 'usuarios', created.id);

    setNewUser({ nombre: '', email: '', rol: 'nominal', estado: 'aprobado', id_centro: '', cod_eje: '', password: '' });
    setShowCreateUserForm(false);
    showNotification('Usuario creado exitosamente. Puede ingresar de forma segura usando su correo y contraseña autorizada');
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

    // Actualizar virtuales si aplica
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

    // Actualizar virtuales si aplica
    const localVirtualUsers = localStorage.getItem('s_admin_virtual_users');
    if (localVirtualUsers) {
      const list = JSON.parse(localVirtualUsers);
      const updated = list.map((u: any) => u.id === userId ? { ...u, estado: newStatus } : u);
      localStorage.setItem('s_admin_virtual_users', JSON.stringify(updated));
    }

    addAuditLog('APROBAR_CUENTA', 'usuarios', userId);
    showNotification('Estado de cuenta actualizado');
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

    // Remover de virtuales
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

  // Asignación de módulos dinámicos a un usuario específico
  const getAssignedModules = (userEmail: string): string[] => {
    const saved = localStorage.getItem(`assigned_modules_user_${userEmail.toLowerCase()}`);
    return saved ? JSON.parse(saved) : [];
  };

  const handleToggleModuleAssignment = (userEmail: string, moduleId: string) => {
    const current = getAssignedModules(userEmail);
    let updated: string[];
    if (current.includes(moduleId)) {
      updated = current.filter(id => id !== moduleId);
    } else {
      updated = [...current, moduleId];
    }
    localStorage.setItem(`assigned_modules_user_${userEmail.toLowerCase()}`, JSON.stringify(updated));
    addAuditLog('ASIGNAR_MODULO', 'usuario_modulos', userEmail);
    // Forzar re-render
    setSelectedUserForAssign(prev => prev ? { ...prev } : null);
  };

  // Cargar datos del Explorador de base de datos
  const loadTableData = async (tableName: string) => {
    setIsRecordsLoading(true);
    try {
      const metadataSchema = schemaService.getTableSchema(tableName);
      setSelectedTableSchema(metadataSchema);

      const dinamicModules = schemaService.getDynamicModules();
      const isDynamic = dinamicModules.some(m => m.meta_datos.tabla_nombre === tableName);

      if (isDynamic) {
        setDataSource('local_dinamico');
        const records = await schemaService.getTableRecords(tableName);
        setSelectedTableRecords(records);
      } else {
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
          console.warn('Fallo consulta directa de Supabase', dbErr);
        }

        if (!fetchedFromSupabase) {
          records = schemaService.getSimulatedRecords(tableName);
          setDataSource('simulado');
        }
        setSelectedTableRecords(records);
      }
    } catch (err) {
      console.error('Error al analizar registros:', err);
    } finally {
      setIsRecordsLoading(false);
    }
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

  // Procesar e Instanciar JSON Cognitivo AI
  const handleCompileJSON = () => {
    try {
      if (!jsonInput.trim()) {
        alert('Por favor ingrese el JSON del Generador Inteligente.');
        return;
      }
      const parsed = JSON.parse(jsonInput) as ConfiguracionModulo;
      
      if (!parsed.comando || !parsed.meta_datos || !parsed.estructura) {
        alert('Estructura JSON inválida para el motor Super-Admin. Faltan propiedades esenciales.');
        return;
      }

      // Colocar un ID único si no viene asignado
      const id = parsed.id || `mod-${parsed.meta_datos.tabla_nombre}`;
      const finalModule: ConfiguracionModulo = {
        ...parsed,
        id
      };

      // Guardar el módulo en la base estructurada local
      schemaService.saveDynamicModule(finalModule);
      setModuloPreview(finalModule);
      
      // Actualizar listado y base de datos de explorador
      loadModules();
      loadTablesList();
      
      addAuditLog('GENERAR_FORMULARIO', finalModule.meta_datos.tabla_nombre, finalModule.id);
      showNotification(`Módulo de Reporte "${finalModule.meta_datos.descripcion}" compilado e instanciado. ¡Formulario activo!`);
    } catch (e: any) {
      alert(`Error de compilación de sintaxis: ${e.message}`);
    }
  };

  // Eliminar módulo dinámico
  const handleDeleteModule = (moduleId: string, tabName: string) => {
    if (!confirm('¿Desea desvincular este módulo dinámico y todas sus plantillas asociadas?')) return;
    schemaService.deleteDynamicModule(moduleId);
    
    // Quitar registros
    localStorage.removeItem(`dynamic_data_${tabName}`);
    
    loadModules();
    loadTablesList();
    if (moduloPreview?.id === moduleId) setModuloPreview(null);
    if (tablaSeleccionada === tabName) setTablaSeleccionada('');
    
    addAuditLog('ELIMINAR_MODULO', tabName, moduleId);
    showNotification('Módulo dinamico purgado');
  };

  // Ejercicio de prueba predeterminado (Cargar JSON Fallas de Agua)
  const handleLoadWaterTemplate = () => {
    const fallbackTemplate: ConfiguracionModulo = {
      id: "mod-monitoreo_agua_asic",
      comando: "CREAR_TABLA",
      meta_datos: {
        tabla_nombre: "monitoreo_agua_asic",
        descripcion: "Reporte de disponibilidad y fallas críticas de suministro de agua potable en los ASIC municipales.",
        icono: "🚰"
      },
      estructura: [
        {
          campo_id: "municipio_nombre",
          tipo_dato: "select",
          requerido: true,
          opciones: ["Chacao", "Baruta", "Sucre", "Guaicaipuro", "Plaza", "Zamora", "Cristóbal Rojas"],
          etiqueta: "Municipio del Estado Miranda"
        },
        {
          campo_id: "asic_reportado",
          tipo_dato: "text",
          requerido: true,
          etiqueta: "Área de Salud Integral Comunitaria (ASIC)"
        },
        {
          campo_id: "disponibilidad_servicio",
          tipo_dato: "select",
          requerido: true,
          opciones: ["Flujo Continuo", "Horario Racionado (Por Guardia)", "Sin Servicio Directo (Suministro Camión)", "Falla Absoluta Crítica"],
          etiqueta: "Estado del Suministro de Agua"
        },
        {
          campo_id: "dias_sin_agua",
          tipo_dato: "number",
          requerido: true,
          etiqueta: "Días de interrupción acumulados"
        },
        {
          campo_id: "afectacion_quirofano",
          tipo_dato: "boolean",
          requerido: false,
          etiqueta: "Inoperancia / Afectación de Quirófanos Activos"
        },
        {
          campo_id: "observacion_tecnica",
          tipo_dato: "text",
          requerido: false,
          etiqueta: "Diagnóstico técnico de falla (Bombas, Hidrológico o Tuberías)"
        }
      ],
      politica_respaldo: {
        sincronizar_sheets: true,
        tiempo_retencion_supabase_meses: 6,
        destino_archivo_muerto: "local_server_csv"
      }
    };
    setJsonInput(JSON.stringify(fallbackTemplate, null, 2));
    showNotification('Fórmula de JSON de carga aplicada con éxito');
  };

  // Ejecutar purga de retención (N-Tiempo)
  const handleTriggerRetentionPurge = (modulo: ConfiguracionModulo) => {
    setIsUsersLoading(true);
    const result = pipelineService.ejecutarPurgaSAdmin(modulo);
    setIsUsersLoading(false);
    
    addAuditLog('PURGAR_RETENCION', modulo.meta_datos.tabla_nombre, modulo.id);
    
    setFeedbackMsg({
      type: 'success',
      text: `Purga N-Tiempo ejecutada de manera exitosa para ${modulo.meta_datos.tabla_nombre}: Se depuraron ${result.filas_borradas} registros históricos que superaban el límite de retención de ${modulo.politica_respaldo.tiempo_retencion_supabase_meses} meses.`
    });
    
    if (tablaSeleccionada === modulo.meta_datos.tabla_nombre) {
      loadTableData(tablaSeleccionada);
    }
    
    setTimeout(() => setFeedbackMsg(null), 8500);
  };

  // Exportar datos a CSV
  const handleExportCSV = (tableName: string) => {
    if (selectedTableRecords.length === 0) {
      alert('No hay registros históricos en esta vista para compilar.');
      return;
    }
    
    // Obtener campos de los registros
    const headers = Object.keys(selectedTableRecords[0]).join(',');
    const rows = selectedTableRecords.map(row => 
      Object.values(row)
        .map(val => {
          const stringVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
          return `"${stringVal.replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `archivo_muerto_miranda_salud_${tableName}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addAuditLog('EXPORTAR_CSV', tableName, 'CSV_DOWNLOAD');
    showNotification('Archivo CSV exportado exitosamente. Descarga iniciada.');
  };

  // Auxiliares de alerta visual
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
            <span className="text-[10px] font-black uppercase tracking-widest font-mono">Panel Inteligente Cognitivo</span>
          </div>
          <h2 className="text-xl font-black uppercase text-slate-800 tracking-tight leading-none mt-1">
            Plataforma Super-Administración v2.0
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            Arquitectura Motorizada por Datos (Data-Driven) • Resguardo Multi-Tubería SSPA
          </p>
        </div>

        {/* SELECTOR DE PESTAÑAS (Mapeado directo a los objetivos del usuario) */}
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'usuarios' 
                ? 'bg-[#0B3D5C] text-white shadow-xs' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users size={12} /> Control de Usuarios
          </button>
          
          <button
            onClick={() => setActiveTab('tablas')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'tablas' 
                ? 'bg-[#0B3D5C] text-white shadow-xs' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Database size={12} /> Explorador de BD
          </button>
          
          <button
            onClick={() => setActiveTab('generador')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'generador' 
                ? 'bg-[#0B3D5C] text-white shadow-xs' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Terminal size={12} /> Generador Inteligente
          </button>
          
          <button
            onClick={() => setActiveTab('respaldos')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'respaldos' 
                ? 'bg-[#0B3D5C] text-white shadow-xs' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Clock size={12} /> Políticas de Resguardo
          </button>

          <button
            onClick={() => setActiveTab('analisis')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'analisis' 
                ? 'bg-[#0B3D5C] text-white shadow-xs' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BarChart3 size={12} /> Sala de Análisis
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`p-3 rounded-2xl flex items-center gap-2 text-xs font-bold leading-relaxed border ${
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
        
        {/* TAB 1: CONTROL DE USUARIOS Y ASIGNACIÓN DE REPORTES COGNITIVOS */}
        {activeTab === 'usuarios' && (
          <motion.div 
            key="usuarios" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* CREADOR DE USUARIO */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-black text-[#0B3D5C] uppercase tracking-wider">Creador y Gestor de Cuenta Operativa</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Invite operadores clínico-nominales o directores de ASIC</p>
                </div>
                <button 
                  onClick={() => setShowCreateUserForm(!showCreateUserForm)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#0B3D5C] text-white hover:bg-[#072437] transition text-[9px] font-black uppercase tracking-widest rounded-xl"
                >
                  <UserPlus size={12} /> {showCreateUserForm ? 'Ocultar Formulario' : 'Nuevo Operador'}
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
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Centro de Salud (id_centro)</label>
                    <input 
                      type="text" placeholder="Ej: CDI-01 o CP-03"
                      value={newUser.id_centro} onChange={e => setNewUser(prev => ({ ...prev, id_centro: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Código de Eje Geográfico</label>
                    <input 
                      type="text" placeholder="Ej: MET-01 (Metropolitano)"
                      value={newUser.cod_eje} onChange={e => setNewUser(prev => ({ ...prev, cod_eje: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Contraseña de la Cuenta</label>
                    <input 
                      type="text" placeholder="Asigne clave (por defecto: nominal2026)"
                      value={newUser.password} onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0B3D5C]"
                    />
                  </div>
                  <div className="space-y-1 flex items-end col-span-1 md:col-span-3">
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-wide p-2.5 rounded-xl transition">
                      ⚡ Registrar Cuenta Operativa
                    </button>
                  </div>
                </form>
              )}

              {/* LISTADO DE USUARIOS Y DIRECTIVAS DE ACCESO */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="px-4 py-3">Operador Institucional</th>
                      <th className="px-4 py-3">Rol Carga</th>
                      <th className="px-4 py-3">Estado Cuenta</th>
                      <th className="px-4 py-3">Reportes Formularios Asignados</th>
                      <th className="px-4 py-3 text-right">Mantenimiento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {systemUsers.map(u => {
                      const userMods = getAssignedModules(u.email);
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-[#0B3D5C]/10 flex items-center justify-center text-[11px] font-black text-[#0B3D5C]">
                                {u.nombre ? u.nombre.charAt(0) : 'U'}
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-slate-800 uppercase leading-none">{u.nombre || 'Sin nombre'}</p>
                                <p className="text-[9px] text-slate-400 font-mono mt-1">
                                  {u.email} • <span className="text-emerald-750 text-emerald-700 font-black bg-emerald-50 border border-emerald-200/50 px-1 py-0.5 rounded text-[8.5px]">Clave: {localStorage.getItem(`sim_pass_${u.email.toLowerCase()}`) || 'nominal2026'}</span>
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select 
                              value={u.rol} onChange={e => handleUserRoleChange(u.id, e.target.value)}
                              className="text-[9px] font-black px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white shadow-xs focus:outline-none-style focus:border-blue-500"
                            >
                              <option value="admin">Administrador</option>
                              <option value="directivo">Directivo SSPA</option>
                              <option value="oficina">Inspector Oficina</option>
                              <option value="nominal">Operador Carga Nominal</option>
                            </select>
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
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1 items-start">
                              <div className="flex flex-wrap gap-1">
                                <span className="bg-slate-100 text-slate-650 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Quirúrgicas</span>
                                <span className="bg-slate-100 text-slate-650 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Obstétricas</span>
                                <span className="bg-slate-100 text-slate-650 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Defunciones</span>
                                {userMods.map(mId => {
                                  const mod = availableModules.find(am => am.id === mId);
                                  return (
                                    <span key={mId} className="bg-blue-50 text-blue-800 text-[8px] font-black px-1.5 py-0.5 rounded border border-blue-100 uppercase">
                                      {mod ? mod.meta_datos.tabla_nombre : mId}
                                    </span>
                                  );
                                })}
                              </div>
                              <button 
                                onClick={() => setSelectedUserForAssign(u)}
                                className="text-[8.5px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest mt-1 cursor-pointer"
                              >
                                ⚙️ Asignar Módulos Dinámicos
                              </button>
                            </div>
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MODAL / SECTOR DE ASIGNACIÓN */}
            {selectedUserForAssign && (
              <div className="bg-blue-50/50 rounded-3xl border border-blue-250 border-blue-100 p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                  <div>
                    <h3 className="text-xs font-black text-[#0B3D5C] uppercase tracking-wide">
                      Asignar Módulos Dinámicos a: <span className="text-blue-700 font-display font-extrabold">{selectedUserForAssign.nombre} ( {selectedUserForAssign.email} )</span>
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Define qué formularios dinámicos podrá reportar y visualizar el operador en su dashboard principal.</p>
                  </div>
                  <button 
                    onClick={() => setSelectedUserForAssign(null)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wider"
                  >
                    cerrar ×
                  </button>
                </div>

                {availableModules.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic">No hay módulos de reporte dinámicos compilados bajo "Generador Inteligente". Compila uno para asignarlo.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {availableModules.map(m => {
                      const isAssigned = getAssignedModules(selectedUserForAssign.email).includes(m.id);
                      return (
                        <div 
                          key={m.id} 
                          onClick={() => handleToggleModuleAssignment(selectedUserForAssign.email, m.id)}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                            isAssigned 
                              ? 'bg-blue-600 border-blue-750 text-white shadow-sm' 
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-lg">{m.meta_datos.icono || '📋'}</span>
                          <div className="flex-grow">
                            <h4 className="text-[10.5px] font-black uppercase tracking-tight line-clamp-1">{m.meta_datos.tabla_nombre}</h4>
                            <p className={`text-[8.5px] leading-tight ${isAssigned ? 'text-blue-105 text-blue-100' : 'text-slate-400'} line-clamp-1`}>{m.meta_datos.descripcion}</p>
                          </div>
                          <div>
                            <input 
                              type="checkbox" checked={isAssigned} readOnly
                              className="rounded border-slate-200 text-blue-600 focus:ring-0" 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
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
                <h3 className="text-sm font-black text-[#0B3D5C] uppercase tracking-wider">Explorador de Tablas del Estado Miranda</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Audite e inspecte en tiempo real las tuberías de persistencia asociadas.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-grow max-w-md space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Seleccionar Estructura o Tabla de Datos</label>
                  <select 
                    value={tablaSeleccionada}
                    onChange={(e) => setTablaSeleccionada(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-xs font-bold focus:outline-none focus:border-[#0B3D5C] shadow-xs"
                  >
                    <option value="">-- Selecciona una Tabla en Supabase --</option>
                    {listaTablas.map(tabla => (
                      <option key={tabla} value={tabla}>
                        {schemaService.getDynamicModules().some(dm => dm.meta_datos.tabla_nombre === tabla) ? `🚰 [Dinámico] ${tabla}` : `📊 [Maestra] ${tabla}`}
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
                    <Download size={12} /> Exportar como CSV (Archivo Muerto)
                  </button>
                )}
              </div>
            </div>

            {tablaSeleccionada && selectedTableSchema && (
              <div className="space-y-6">
                {/* INDICADOR DE CONDUCTO DE PERSISTENCIA REAL-TIME */}
                {dataSource === 'supabase' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 flex items-start gap-3 shadow-xs">
                    <div className="p-2 bg-emerald-650 bg-emerald-600 text-white rounded-2xl flex-shrink-0">
                      <Database size={16} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">🔌 Conducto en Vivo Conectado a Supabase</h4>
                      <p className="text-[9.5px] text-emerald-700 font-bold mt-1 leading-normal uppercase">
                        Esta tabla <span className="font-mono bg-emerald-100/50 px-1.5 py-0.5 rounded text-emerald-950 font-black">{tablaSeleccionada}</span> está resolviendo datos reales y persistidos en tiempo real directamente desde su instancia de la nube de Supabase. Cualquier cambio, adición o inspección es 100% inmutable y fidedigno.
                      </p>
                    </div>
                  </div>
                )}

                {dataSource === 'simulado' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 flex items-start gap-4 shadow-xs">
                    <div className="p-2 bg-amber-550 bg-amber-500 text-white rounded-2xl flex-shrink-0 animate-pulse">
                      <ShieldAlert size={16} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-widest">⚠️ Consola Virtualizada (Modo de Resguardo y Simbiosis local)</h4>
                      <p className="text-[9.5px] text-amber-700 font-bold leading-normal uppercase">
                        La tabla <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-amber-950 font-black">{tablaSeleccionada}</span> aún no existe o no contiene registros en su esquema físico de Supabase o hay un problema de sincronización.
                      </p>
                      <p className="text-[9px] text-amber-600 font-medium leading-relaxed pt-1.5 border-t border-amber-200/50">
                        🔑 <span className="font-black uppercase tracking-wider text-amber-800">Para resolver con sus bases de datos reales:</span> Conéctese a su consola de Supabase y verifique la existencia de la tabla <code className="font-mono font-bold bg-amber-150/40 text-amber-900">{tablaSeleccionada}</code>. Mientras tanto, el sistema ha activado la <span className="font-bold text-amber-800">Tubería de Persistencia Local Automática</span> de resguardo para garantizar la fluidez de su sesión.
                      </p>
                    </div>
                  </div>
                )}

                {dataSource === 'local_dinamico' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-3xl p-4 flex items-start gap-3 shadow-xs">
                    <div className="p-2 bg-blue-600 text-white rounded-2xl flex-shrink-0">
                      <RefreshCw size={16} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-widest">⚙️ Tubería de Formulario Dinámico Activo</h4>
                      <p className="text-[9.5px] text-blue-700 font-bold mt-1 leading-normal uppercase">
                        Esta tabla corresponde a un formulario cognitivo dinámico instanciado localmente. Su persistencia está gobernada por motores locales de resguardo listos para su posterior volcado o migración a base de datos.
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
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Columnas de datos (Detección Auto)</span>
                    <div className="divide-y divide-slate-150 divide-slate-100 max-h-[380px] overflow-y-auto">
                      {selectedTableSchema.columnas.map(col => (
                        <div key={col.name} className="py-2 flex items-center justify-between text-xs font-medium">
                          <span className="font-mono text-blue-600 text-[10.5px]">{col.name}</span>
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
                      Consultando Supabase...
                    </div>
                  ) : selectedTableRecords.length === 0 ? (
                    <div className="py-16 text-center text-slate-450 text-slate-400 text-xs italic font-medium">
                      Esta tabla no contiene registros ni atenciones cargadas aún.
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
                                  onClick={() => alert(`Detallado Completo Fila:\n\n${JSON.stringify(rec, null, 2)}`)}
                                  className="text-blue-600 font-extrabold hover:underline uppercase text-[9px] tracking-wide"
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

        {/* TAB 3: GENERADOR INTELIGENTE (PASTADOR DE JSON Y LIVE PREVIEW) */}
        {activeTab === 'generador' && (
          <motion.div 
            key="generador" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* ENTRADA DEL JSON */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-4">
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-[#0B3D5C] uppercase tracking-wider">Cerebro Cognitivo (Google AI Studio)</h3>
                  <button 
                    onClick={handleLoadWaterTemplate}
                    className="text-[8.5px] font-black text-[#0B3D5C] hover:text-blue-800 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg uppercase tracking-wide cursor-pointer transition-colors"
                  >
                    💡 Cargar Plantilla de Prueba (Servicio Agua)
                  </button>
                </div>
                <p className="text-[9.5px] text-slate-400 mt-1">Pegue el JSON estructurado de políticas y esquemas de resguardo derivado de la instrucción para instanciar la interfaz de inmediato.</p>
              </div>

              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='Pega el JSON estructurado aquí y haz clic en construir...'
                className="w-full flex-1 min-h-[350px] p-4 font-mono text-[10.5px] bg-slate-900 text-emerald-400 rounded-2xl border border-slate-700 shadow-inner focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />

              <button 
                onClick={handleCompileJSON}
                className="w-full bg-[#0B3D5C] hover:bg-[#072437] text-white font-black py-3 rounded-2xl uppercase text-xs tracking-wider transition shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles size={14} /> Construir Formulario Dinámico
              </button>
            </div>

            {/* LIVE PREVIEW */}
            <div className="space-y-6">
              {moduloPreview ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Vista Previa Activa
                    </h4>
                    <button 
                      onClick={() => setModuloPreview(null)}
                      className="text-[9px] font-bold text-slate-400 hover:text-slate-650 uppercase"
                    >
                      Limpiar
                    </button>
                  </div>
                  <DynamicForm 
                    config={moduloPreview} 
                    onSubmit={async (datos) => {
                      const res = await pipelineService.procesarRegistro(moduloPreview, datos);
                      if (res.success) {
                        loadSheetsLogs();
                        if (tablaSeleccionada === moduloPreview.meta_datos.tabla_nombre) {
                          loadTableData(tablaSeleccionada);
                        }
                      }
                    }} 
                  />
                </div>
              ) : (
                <div className="h-full min-h-[440px] flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50/55 p-6 text-center text-slate-400">
                  <span className="text-4xl mb-3">📥</span>
                  <p className="font-black text-slate-800 text-xs uppercase tracking-wider">Esperando estructura del JSON Cognitivo</p>
                  <p className="text-[10px] text-slate-400 max-w-xs mt-1 leading-relaxed">Pega la estructura del ejercicio bajo el cerebro cognitivo o carga el ejemplo del servicio de agua y haz clic en "Construir" para ver el formulario generándose automáticamente.</p>
                </div>
              )}

              {/* LISTADO DE MÓDULOS ACTIVOS */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-black text-[#0B3D5C] uppercase tracking-wider">Módulos Dinámicos Activos</h4>
                {availableModules.length === 0 ? (
                  <p className="text-[9.5px] text-slate-410 text-slate-400 italic">No hay formularios dinámicos cargados en la bitácora activa.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {availableModules.map(m => (
                      <div key={m.id} className="py-2.5 flex items-center justify-between text-xs font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{m.meta_datos.icono || '📋'}</span>
                          <div>
                            <span className="font-bold text-slate-800 block uppercase">{m.meta_datos.tabla_nombre}</span>
                            <span className="text-[8px] text-slate-400 block max-w-[280px] truncate leading-none mt-1">{m.meta_datos.descripcion}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setModuloPreview(m);
                              setJsonInput(JSON.stringify(m, null, 2));
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[8.5px] font-black uppercase px-2 py-1 rounded"
                          >
                            Probar
                          </button>
                          <button 
                            onClick={() => handleDeleteModule(m.id, m.meta_datos.tabla_nombre)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-[8.5px] font-black uppercase px-2 py-1 rounded"
                          >
                            Purgar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: POLÍTICAS DE RESGUARDO Y RETENCIÓN (N-TIEMPO) */}
        {activeTab === 'respaldos' && (
          <motion.div 
            key="respaldos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* DIAGRAMA RETENCIÓN */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-black text-[#0B3D5C] uppercase tracking-wider">Políticas de Retención de Datos (N-Tiempo)</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Controla y audita el ciclo de vida de cada reporte del sistema.</p>
              </div>

              {availableModules.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs italic font-semibold">
                  No hay módulos dinámicos configurados para auditar políticas de tiempo.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                        <th className="px-4 py-3">Estructura / Tabla</th>
                        <th className="px-4 py-3">Espejo Google Sheets</th>
                        <th className="px-4 py-3">Límite de Retención Supabase</th>
                        <th className="px-4 py-3">Destino Archivo Muerto</th>
                        <th className="px-4 py-3 text-right">Ejecutador de Ciclo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {availableModules.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-mono text-blue-600 block">{m.meta_datos.tabla_nombre}</span>
                            <span className="text-[8px] text-slate-400 block uppercase leading-none mt-1">{m.meta_datos.descripcion}</span>
                          </td>
                          <td className="px-4 py-3">
                            {m.politica_respaldo.sincronizar_sheets ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] uppercase font-black">
                                🟢 Activo (Espejo)
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px] uppercase">🔴 Inactivo</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {m.politica_respaldo.tiempo_retencion_supabase_meses === 0 ? (
                              <span className="text-[#0B3D5C] block">ILIMITADO / INDEFINIDO</span>
                            ) : (
                              <span>{m.politica_respaldo.tiempo_retencion_supabase_meses} Meses</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="bg-amber-50 text-amber-800 border border-amber-100 px-2 py-0.5 rounded font-mono text-[9px] uppercase font-black">
                              {m.politica_respaldo.destino_archivo_muerto}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleTriggerRetentionPurge(m)}
                              className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 border border-rose-100 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer"
                            >
                              <ShieldAlert size={12} /> Ejecutar Purga N-Tiempo
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SECCIÓN ESPEJO DE GOOGLE SHEETS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* HISTORIAL SINCRONIZACIÓN SHEETS */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-1.5 text-emerald-700 border-b border-slate-100 pb-3">
                  <FileSpreadsheet size={16} />
                  <h4 className="text-xs font-black uppercase tracking-wider">Historial de Sincronización Google Sheets</h4>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                  {sheetsSyncLogs.map((log, index) => (
                    <div key={index} className="pt-2.5 flex items-center justify-between text-xs font-semibold">
                      <div>
                        <span className="font-mono text-blue-600 block text-[10px]">{log.tabla}</span>
                        <span className="text-[8px] text-slate-400 block font-mono leading-none mt-1">{new Date(log.fijo_fecha).toLocaleTimeString()} • ID: {log.id}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-mono text-slate-500 block">Espejo completo ({log.columnas_conteo} col)</span>
                        <span className="text-[10px] font-extrabold">{log.estado}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AUDITORÍA GENERAL */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-1.5 text-[#0B3D5C] border-b border-slate-100 pb-3">
                  <Terminal size={16} />
                  <h4 className="text-xs font-black uppercase tracking-wider">Logs Históricos de Auditoría SSPA</h4>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                  {(localStorage.getItem('s_admin_audit_logs') ? JSON.parse(localStorage.getItem('s_admin_audit_logs')!) : [
                    { id: 'AU-05', usuario_email: 'miranda.salud2026@gmail.com', accion: 'INSTANCIAR_MODULO', tabla_afectada: 'monitoreo_agua_asic', registro_id: 'SYSTEM', fecha: new Date().toISOString() },
                    { id: 'AU-04', usuario_email: 'miranda.salud2026@gmail.com', accion: 'APROBAR_OPERADOR', tabla_afectada: 'usuarios', registro_id: 'user-900', fecha: new Date().toISOString() }
                  ]).map((aud: any) => (
                    <div key={aud.id} className="pt-2 flex items-center justify-between text-xs font-semibold">
                      <div>
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[8px] font-mono font-black uppercase">{aud.accion}</span>
                        <span className="text-[8px] font-mono text-slate-400 block mt-1">Ref: {aud.tabla_afectada} • ID: {aud.registro_id}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-[#0B3D5C] block font-mono">{aud.usuario_email}</span>
                        <span className="text-[8px] text-slate-400 font-mono mt-0.5 block">{new Date(aud.fecha).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 5: SALA DE ANÁLISIS */}
        {activeTab === 'analisis' && (
          <motion.div 
            key="analisis" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <AnalyticsEngine />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
