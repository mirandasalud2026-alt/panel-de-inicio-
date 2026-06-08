// src/components/ui/AnalyticsEngine.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Filter, 
  Users, 
  Layers, 
  Compass, 
  Plus, 
  Trash2, 
  Activity, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Sliders,
  Calendar,
  Lock,
  Globe,
  UserCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  Award,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { DashboardAssignment } from '../../types/dashboard';

// --- DATA STRUCTURES FOR WEBHOOK DATA & ANALYTICS ---
interface NominalRecord {
  id: string;
  fecha: string;
  nombre: string;
  cedula: string;
  edad: number;
  genero: 'MASCULINO' | 'FEMENINO';
  eje_geografico: string;
  asic: string;
  centro_salud: string;
  tipo_planilla: 'QUIRURGICA' | 'OBSTETRICA' | 'DEFUNCION';
  diagnostico: string;
}

interface ConsolidadoEje {
  eje_geografico: string;
  meta_semanal: number;
  registros_reales: number;
  tasa_cumplimiento: number;
  asics: {
    nombre: string;
    centros_activos: number;
    atenciones_registradas: number;
  }[];
}

// Default Presets for Users
const PRESET_DASHBOARDS: DashboardAssignment[] = [
  {
    id: 'dash-quir-global',
    nombre: 'Sala Analítica Quirúrgica Global',
    descripcion: 'Análisis de especialidades quirúrgicas, distribución demográfica e intervenciones prioritarias de la Gobernación.',
    roles_permitidos: ['admin', 'directivo', 'oficina'],
    usuarios_permitidos: ['miranda.salud2026@gmail.com'],
    eje_geografico: 'Todos',
    meta_semanal: 150,
    fecha_creacion: '2026-06-01T12:00:00Z',
    activo: true
  },
  {
    id: 'dash-valles-obst',
    nombre: 'Monitor Obstétrico Valles del Tuy',
    descripcion: 'Seguimiento nominal de partos, cesáreas y cobertura neonatal en el Eje Geográfico de mayor tasa natal.',
    roles_permitidos: ['admin', 'nominal', 'oficina', 'directivo'],
    usuarios_permitidos: ['nominal@mirandasalud.com', 'miranda.salud2026@gmail.com'],
    eje_geografico: 'Valles del Tuy',
    meta_semanal: 80,
    fecha_creacion: '2026-06-03T14:30:00Z',
    activo: true
  },
  {
    id: 'dash-metrop-general',
    nombre: 'Control Epidemiológico Metropolitana',
    descripcion: 'Atención nominal, morbilidades registradas y defunciones certificadas en los distritos metropolitanos.',
    roles_permitidos: ['admin', 'directivo'],
    usuarios_permitidos: ['miranda.salud2026@gmail.com'],
    eje_geografico: 'Metropolitano',
    meta_semanal: 200,
    fecha_creacion: '2026-06-05T09:12:00Z',
    activo: true
  }
];

// High-quality mock data generator in case endpoints are slow, blocked, or in sandbox environments.
const GENERATE_FALLBACK_NOMINALS = (): NominalRecord[] => {
  const ejes = ['Valles del Tuy', 'Metropolitano', 'Altos Mirandinos', 'Guarenas-Guatire', 'Barlovento', 'Plaza-Zamora'];
  const asicsPorEje: Record<string, string[]> = {
    'Valles del Tuy': ['ASIC Charallave', 'ASIC Santa Teresa', 'ASIC Ocumare del Tuy', 'ASIC Cúa'],
    'Metropolitano': ['ASIC Chacao', 'ASIC Baruta', 'ASIC El Hatillo', 'ASIC Petare'],
    'Altos Mirandinos': ['ASIC Los Teques', 'ASIC San Antonio', 'ASIC Carrizal'],
    'Guarenas-Guatire': ['ASIC Guarenas', 'ASIC Guatire', 'ASIC Araira'],
    'Barlovento': ['ASIC Higuerote', 'ASIC San José de Barlovento', 'ASIC Río Chico'],
    'Plaza-Zamora': ['ASIC Guarenas Centro', 'ASIC Guatire Valle']
  };
  const nombresF = ['MARIA DELGADO', 'ANA ALVAREZ', 'JUANA GOMEZ', 'CARMEN SANOJA', 'YOLANDA BLANCO', 'YRAIMA PAEZ', 'ADRIANA PEREZ', 'GABRIELA SILVA'];
  const nombresM = ['JOEL RANGEL', 'ALEJANDRO CASTILLO', 'CARLOS MONTOYA', 'EMILIO AZUAJE', 'WINSTON CONTRERAS', 'PEDRO BRICEÑO', 'JULIO RIVERO', 'GREGORIO NAVAS'];
  const planillas: ('QUIRURGICA' | 'OBSTETRICA' | 'DEFUNCION')[] = ['QUIRURGICA', 'OBSTETRICA', 'DEFUNCION'];
  const diagnosticos = ['Hernia Inguinal', 'Apendicitis Aguda', 'Cesárea Segmentaria', 'Parto Eutócico Simple', 'Colecistitis Alitiásica', 'Infarto Agudo', 'Traumatismo Cerrado', 'Insuficiencia Respiratoria'];

  const list: NominalRecord[] = [];
  
  // Generar 180 registros con distribución matemática controlada
  for (let i = 1; i <= 180; i++) {
    const eje = ejes[Math.floor(Math.random() * ejes.length)];
    const asicsDisponibles = asicsPorEje[eje] || ['ASIC Central'];
    const asic = asicsDisponibles[Math.floor(Math.random() * asicsDisponibles.length)];
    
    let planilla = planillas[Math.floor(Math.random() * planillas.length)];
    let genero: 'MASCULINO' | 'FEMENINO' = Math.random() > 0.45 ? 'FEMENINO' : 'MASCULINO';
    
    // El reporte obstétrico es únicamente para femeninos
    if (planilla === 'OBSTETRICA') {
      genero = 'FEMENINO';
    }

    const nombre = genero === 'FEMENINO' 
      ? nombresF[Math.floor(Math.random() * nombresF.length)] + ' ' + (Math.random() > 0.5 ? 'DE RODRIGUEZ' : 'MEDINA')
      : nombresM[Math.floor(Math.random() * nombresM.length)] + ' ' + (Math.random() > 0.5 ? 'VARGAS' : 'LEON');
    
    const edad = planilla === 'OBSTETRICA' 
      ? Math.floor(Math.random() * (45 - 15) + 15) // Edad de madres
      : Math.random() > 0.7 
        ? Math.floor(Math.random() * (95 - 65) + 65) // Adulto Mayor
        : Math.random() > 0.2
          ? Math.floor(Math.random() * (64 - 18) + 18) // Adulto
          : Math.floor(Math.random() * 17 + 1); // Pediatría

    list.push({
      id: `nom-${1000 + i}`,
      fecha: new Date(Date.now() - Math.floor(Math.random() * 6 * 24 * 3600 * 1000)).toISOString().split('T')[0],
      nombre,
      cedula: `${Math.random() > 0.5 ? 'V' : 'E'}-${Math.floor(Math.random() * (28000000 - 8000000) + 8000000)}`,
      edad,
      genero,
      eje_geografico: eje,
      asic,
      centro_salud: `CDI ${asic.replace('ASIC ', '')}`,
      tipo_planilla: planilla,
      diagnostico: diagnosticos[Math.floor(Math.random() * diagnosticos.length)]
    });
  }
  return list;
};

export default function AnalyticsEngine() {
  const { profile } = useAuth();
  
  const [customWebhookUrl, setCustomWebhookUrl] = useState<string>(() => localStorage.getItem('VITE_GOOGLE_SCRIPT_URL') || '');
  const [emulateData, setEmulateData] = useState<boolean>(() => localStorage.getItem('EMULATE_NOMINAL_DATA') !== 'false');
  const [showIntegrationGuide, setShowIntegrationGuide] = useState<boolean>(false);

  // --- STATES ---
  const [dashboards, setDashboards] = useState<DashboardAssignment[]>([]);
  const [selectedDashboardId, setSelectedDashboardId] = useState<string>('');
  
  // Data State
  const [nominalData, setNominalData] = useState<NominalRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [useSimulatedData, setUseSimulatedData] = useState<boolean>(true);
  const [webhookLogs, setWebhookLogs] = useState<{ url: string; timestamp: string; status: 'success' | 'error' }[]>([]);

  // Interactive filters
  const [filterAgeGroup, setFilterAgeGroup] = useState<'Todos' | 'Pediatría' | 'Adulto' | 'Adulto Mayor'>('Todos');
  const [filterGender, setFilterGender] = useState<'Todos' | 'MASCULINO' | 'FEMENINO'>('Todos');
  const [filterEje, setFilterEje] = useState<string>('Todos');
  const [filterAsic, setFilterAsic] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [interactiveWeeklyMeta, setInteractiveWeeklyMeta] = useState<number>(100);

  // Admin states for dashboard generator
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newDashboard, setNewDashboard] = useState({
    nombre: '',
    descripcion: '',
    roles: [] as string[],
    usuarios: '',
    eje_geografico: 'Todos',
    meta_semanal: 100
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // --- COMPONENT INITIALIZATION ---
  useEffect(() => {
    // 1. Cargar Dashboards desde local storage o presets
    const savedDashboardsStr = localStorage.getItem('s_admin_dynamic_dashboards');
    let loadedDashboards: DashboardAssignment[] = [];
    if (savedDashboardsStr) {
      try {
        loadedDashboards = JSON.parse(savedDashboardsStr);
      } catch (e) {
        loadedDashboards = PRESET_DASHBOARDS;
      }
    } else {
      loadedDashboards = PRESET_DASHBOARDS;
      localStorage.setItem('s_admin_dynamic_dashboards', JSON.stringify(PRESET_DASHBOARDS));
    }

    // 2. Filtrar Dashboards asignados según el Rol y Correo del Usuario actual
    const userRole = profile?.rol || 'nominal';
    const userEmail = profile?.email || 'nominal@mirandasalud.com';

    const assigned = loadedDashboards.filter(dash => {
      if (userRole === 'admin') return true; // Administrador global ve todo
      const roleMatch = dash.roles_permitidos.map(r => r.toLowerCase()).includes(userRole.toLowerCase());
      const emailMatch = dash.usuarios_permitidos.map(e => e.toLowerCase().trim()).includes(userEmail.toLowerCase().trim());
      return roleMatch || emailMatch;
    });

    setDashboards(assigned);

    if (assigned.length > 0) {
      // Intentar seleccionar por defecto el primero
      setSelectedDashboardId(assigned[0].id);
      setInteractiveWeeklyMeta(assigned[0].meta_semanal);
      setFilterEje(assigned[0].eje_geografico || 'Todos');
    }
  }, [profile]);

  useEffect(() => {
    // Generar / Obtener datos nominales cada vez que cambien los estados de emulación u origen
    fetchNominalData();
  }, [profile, emulateData, customWebhookUrl]);

  // Actualizar meta interactiva cuando cambia de dashboard
  useEffect(() => {
    const activeDash = dashboards.find(d => d.id === selectedDashboardId);
    if (activeDash) {
      setInteractiveWeeklyMeta(activeDash.meta_semanal);
      if (activeDash.eje_geografico && activeDash.eje_geografico !== 'Todos') {
        setFilterEje(activeDash.eje_geografico);
      } else {
        setFilterEje('Todos');
      }
      setFilterAsic('Todos');
    }
  }, [selectedDashboardId, dashboards]);

  // --- WEBHOOK DATA COUPLING ---
  const fetchNominalData = async () => {
    setIsLoading(true);
    let success = false;
    
    // Obtener webhook personalizado de local storage o usar el preestablecido
    const savedWebhook = localStorage.getItem('VITE_GOOGLE_SCRIPT_URL') || '';
    const nominalWebhook = savedWebhook || 'https://script.google.com/macros/s/AKfycbzEbs37sq8l16OxQqG7JGPfYcfjauzblhSASY9TMwqNdEd0ly7rZlkW7V8V7mExaL9d/exec';
    
    // Si emulación está activa por elección del operador
    if (emulateData) {
      const simulated = GENERATE_FALLBACK_NOMINALS();
      setNominalData(simulated);
      setUseSimulatedData(true);
      setIsLoading(false);
      setNotification({ type: 'info', text: 'Visualizando con Tubería Nominal Local de Resguardo (Modo Simulado / Demostración)' });
      return;
    }

    try {
      // Intentamos llamar al proxy /api/run-script con la URL configurada
      const res = await fetch(`/api/run-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getNominalesDataset',
          scriptUrl: nominalWebhook
        })
      });
      
      const payload = await res.json();
      
      if (payload.status === 'success' && Array.isArray(payload.data)) {
        // Formatear columnas del webhook al modelo local
        const formatted: NominalRecord[] = payload.data.map((item: any, i: number) => ({
          id: item.id || `web-${i}`,
          fecha: item.fecha_registro || item.fecha || new Date().toISOString().split('T')[0],
          nombre: `${item.nombre_paciente || item.nombre_madre || item.nombre_fallecido || 'PACIENTE'} ${item.apellido_paciente || item.apellido_madre || item.apellido_fallecido || ''}`.toUpperCase().trim(),
          cedula: item.cedula_paciente || item.cedula_madre || item.cedula_fallecido || 'S/CI',
          edad: parseInt(item.edad_paciente || item.edad_madre || item.edad_fallecido || item.edad) || 30,
          genero: (item.sexo_paciente || item.sexo_fallecido || item.sexo || (item.cedula_madre ? 'FEMENINO' : 'FEMENINO')).toUpperCase() === 'MASCULINO' ? 'MASCULINO' : 'FEMENINO',
          eje_geografico: item.eje_geografico || detectEjeByAsic(item.asic || item.centro_salud),
          asic: item.asic || 'ASIC CENTRAL',
          centro_salud: item.centro_salud || 'CDI CENTRAL',
          tipo_planilla: item.tipo_registro ? item.tipo_registro.toUpperCase() : 'QUIRURGICA',
          diagnostico: item.patologia || item.especialidad_quirurgica || item.tipo_parto || 'Evaluación médica de rutina'
        }));
        
        setNominalData(formatted);
        setUseSimulatedData(false);
        success = true;
        logWebhookCall(nominalWebhook, 'success');
        setNotification({ type: 'success', text: '¡Datos nominales en tiempo real cargados exitosamente de su Webhook de Google Sheets!' });
      }
    } catch (e) {
      console.warn('Fallo al conectar con el webhook nominal de GAS:', e);
      logWebhookCall(nominalWebhook, 'error');
    }

    // Nivel 2 de recuperación: Cargar de la base de datos Supabase real en la nube si está vacía la hoja
    if (!success) {
      if (supabase) {
        try {
          const { data, error } = await supabase.from('nominales').select('*').limit(200);
          if (!error && data && data.length > 0) {
            const formatted: NominalRecord[] = data.map((item: any, i: number) => {
              const d = item.datos || {};
              return {
                id: item.id || `db-${i}`,
                fecha: d.fecha || item.fecha_creacion?.split('T')[0] || new Date().toISOString().split('T')[0],
                nombre: `${d.nombre_paciente || d.nombre_madre || d.nombre_fallecido || 'PACIENTE'} ${d.apellido_paciente || d.apellido_madre || d.apellido_fallecido || ''}`.toUpperCase().trim(),
                cedula: d.cedula_paciente || d.cedula_madre || d.cedula_fallecido || item.cedula_principal || 'S/CI',
                edad: parseInt(d.edad_paciente || d.edad_madre || d.edad_fallecido || d.edad) || 30,
                genero: (d.sexo_paciente || d.sexo_fallecido || d.sexo || (d.cedula_madre ? 'FEMENINO' : 'FEMENINO')).toUpperCase() === 'MASCULINO' ? 'MASCULINO' : 'FEMENINO',
                eje_geografico: item.eje_geografico || detectEjeByAsic(item.centro_salud || d.centro_salud),
                asic: d.asic || 'ASIC CENTRAL',
                centro_salud: item.centro_salud || d.centro_salud || 'CDI CENTRAL',
                tipo_planilla: (item.tipo_registro || 'quirurgica').toUpperCase(),
                diagnostico: d.patologia || d.especialidad_quirurgica || d.tipo_parto || 'Evaluación médica registrada'
              };
            });
            setNominalData(formatted);
            setUseSimulatedData(false);
            success = true;
            setNotification({ type: 'success', text: '¡Se cargaron registros nominales en tiempo real desde la plataforma Supabase!' });
          }
        } catch (dbErr) {
          console.warn('Fallo al conectar con la base de datos Supabase:', dbErr);
        }
      }
    }

    if (!success) {
      const simulated = GENERATE_FALLBACK_NOMINALS();
      setNominalData(simulated);
      setUseSimulatedData(true);
      setNotification({ type: 'info', text: 'No se dectectaron registros en la hoja de Google Sheets. Visualizando en modo local.' });
    }
    setIsLoading(false);
  };

  const detectEjeByAsic = (name: string): string => {
    const query = name.toLowerCase();
    if (query.includes('chacao') || query.includes('baruta') || query.includes('hatillo') || query.includes('petare') || query.includes('metrop')) {
      return 'Metropolitano';
    }
    if (query.includes('teques') || query.includes('carrizal') || query.includes('antonio') || query.includes('altos')) {
      return 'Altos Mirandinos';
    }
    if (query.includes('cúa') || query.includes('cua') || query.includes('charallave') || query.includes('teresa') || query.includes('ocumare') || query.includes('valles')) {
      return 'Valles del Tuy';
    }
    if (query.includes('higuerote') || query.includes('barlovento') || query.includes('río chico')) {
      return 'Barlovento';
    }
    return 'Guarenas-Guatire';
  };

  const logWebhookCall = (url: string, status: 'success' | 'error') => {
    setWebhookLogs(prev => [
      { url, timestamp: new Date().toLocaleTimeString(), status },
      ...prev.slice(0, 10)
    ]);
  };

  // --- DYNAMIC CALCULATOR LOGIC (MATHEMATICAL ENGINE) ---
  const filteredData = nominalData.filter(item => {
    // 1. Filtrar por Eje Geográfico del Dashboard (si no es 'Todos')
    const activeDash = dashboards.find(d => d.id === selectedDashboardId);
    if (activeDash && activeDash.eje_geografico && activeDash.eje_geografico !== 'Todos') {
      if (item.eje_geografico !== activeDash.eje_geografico) return false;
    }

    // 2. Control interactivo de Edad
    if (filterAgeGroup === 'Pediatría' && item.edad >= 18) return false;
    if (filterAgeGroup === 'Adulto' && (item.edad < 18 || item.edad >= 65)) return false;
    if (filterAgeGroup === 'Adulto Mayor' && item.edad < 65) return false;

    // 3. Control interactivo de Género
    if (filterGender !== 'Todos' && item.genero !== filterGender) return false;

    // 4. Control interactivo de Eje Territorial
    if (filterEje !== 'Todos' && item.eje_geografico !== filterEje) return false;

    // 5. Control interactivo de ASIC
    if (filterAsic !== 'Todos' && item.asic !== filterAsic) return false;

    // 6. Buscador textual
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.nombre.toLowerCase().includes(q) ||
        item.cedula.toLowerCase().includes(q) ||
        item.asic.toLowerCase().includes(q) ||
        item.diagnostico.toLowerCase().includes(q) ||
        item.centro_salud.toLowerCase().includes(q)
      );
    }

    return true;
  });

  // --- COMPILE METRICS DIRECTLY ---
  const totalRecordsCount = filteredData.length;
  
  // Dist género
  const femCount = filteredData.filter(i => i.genero === 'FEMENINO').length;
  const mascCount = filteredData.filter(i => i.genero === 'MASCULINO').length;
  const femPercentage = totalRecordsCount ? Math.round((femCount / totalRecordsCount) * 100) : 0;
  const mascPercentage = totalRecordsCount ? Math.round((mascCount / totalRecordsCount) * 100) : 0;

  // Dist Edades
  const pediCount = filteredData.filter(i => i.edad < 18).length;
  const adultCount = filteredData.filter(i => i.edad >= 18 && i.edad < 65).length;
  const seniorCount = filteredData.filter(i => i.edad >= 65).length;

  const pediPercentage = totalRecordsCount ? Math.round((pediCount / totalRecordsCount) * 100) : 0;
  const adultPercentage = totalRecordsCount ? Math.round((adultCount / totalRecordsCount) * 100) : 0;
  const seniorPercentage = totalRecordsCount ? Math.round((seniorCount / totalRecordsCount) * 100) : 0;

  // Tasa de cumplimiento
  const complianceRate = Math.min(Math.round((totalRecordsCount / interactiveWeeklyMeta) * 100), 100);

  // Agrupación por ASIC para la tabla geométrica de cumplimiento
  const countsPerAsic: Record<string, { total: number; asic: string; eje: string; quirurgica: number; obstetrica: number; defuncion: number }> = {};
  filteredData.forEach(item => {
    if (!countsPerAsic[item.asic]) {
      countsPerAsic[item.asic] = { total: 0, asic: item.asic, eje: item.eje_geografico, quirurgica: 0, obstetrica: 0, defuncion: 0 };
    }
    countsPerAsic[item.asic].total++;
    if (item.tipo_planilla === 'QUIRURGICA') countsPerAsic[item.asic].quirurgica++;
    else if (item.tipo_planilla === 'OBSTETRICA') countsPerAsic[item.asic].obstetrica++;
    else if (item.tipo_planilla === 'DEFUNCION') countsPerAsic[item.asic].defuncion++;
  });

  const sortedAsicMetrics = Object.values(countsPerAsic).sort((a, b) => b.total - a.total);

  // --- NEW DASHBOARD SUBMIT ---
  const handleCreateDashboard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDashboard.nombre) return;

    const emailList = newDashboard.usuarios
      ? newDashboard.usuarios.split(',').map(email => email.trim().toLowerCase()).filter(Boolean)
      : [];

    const createdDash: DashboardAssignment = {
      id: `dash-dyn-${Math.random().toString(36).substr(2, 9)}`,
      nombre: newDashboard.nombre.trim(),
      descripcion: newDashboard.descripcion.trim() || 'Dashboard Analítico Personalizado',
      roles_permitidos: newDashboard.roles.length > 0 ? newDashboard.roles : ['admin', 'directivo'],
      usuarios_permitidos: emailList.length > 0 ? emailList : ['miranda.salud2026@gmail.com'],
      eje_geografico: newDashboard.eje_geografico,
      meta_semanal: parseInt(String(newDashboard.meta_semanal)) || 100,
      fecha_creacion: new Date().toISOString(),
      activo: true
    };

    // Agregar a la cadena de persistence
    const savedDashboardsStr = localStorage.getItem('s_admin_dynamic_dashboards');
    const list: DashboardAssignment[] = savedDashboardsStr ? JSON.parse(savedDashboardsStr) : PRESET_DASHBOARDS;
    list.push(createdDash);
    localStorage.setItem('s_admin_dynamic_dashboards', JSON.stringify(list));

    // Re-filtrar para el usuario actual
    const userRole = profile?.rol || 'nominal';
    const userEmail = profile?.email || '';
    const filteredDashboards = list.filter(dash => {
      if (userRole === 'admin') return true;
      const roleMatch = dash.roles_permitidos.map(r => r.toLowerCase()).includes(userRole.toLowerCase());
      const emailMatch = dash.usuarios_permitidos.map(e => e.toLowerCase().trim()).includes(userEmail.toLowerCase().trim());
      return roleMatch || emailMatch;
    });

    setDashboards(filteredDashboards);
    setSelectedDashboardId(createdDash.id);
    setShowCreateModal(false);
    setNewDashboard({
      nombre: '',
      descripcion: '',
      roles: [],
      usuarios: '',
      eje_geografico: 'Todos',
      meta_semanal: 100
    });

    setNotification({ type: 'success', text: `Dashboard "${createdDash.nombre}" creado y asignado exitosamente.` });
  };

  const toggleRoleInNewDashboard = (role: string) => {
    setNewDashboard(prev => {
      const exists = prev.roles.includes(role);
      const roles = exists ? prev.roles.filter(r => r !== role) : [...prev.roles, role];
      return { ...prev, roles };
    });
  };

  const handleDeleteDashboard = (id: string) => {
    if (!confirm('¿Desea eliminar definitivamente este dashboard personalizado? Los usuarios asignados ya no podrán verlo.')) return;
    
    const saved = localStorage.getItem('s_admin_dynamic_dashboards');
    if (saved) {
      const list: DashboardAssignment[] = JSON.parse(saved);
      const updated = list.filter(d => d.id !== id);
      localStorage.setItem('s_admin_dynamic_dashboards', JSON.stringify(updated));

      // Re-filtrar
      const userRole = profile?.rol || 'nominal';
      const userEmail = profile?.email || '';
      const filtered = updated.filter(dash => {
        if (userRole === 'admin') return true;
        const roleMatch = dash.roles_permitidos.map(r => r.toLowerCase()).includes(userRole.toLowerCase());
        const emailMatch = dash.usuarios_permitidos.map(e => e.toLowerCase().trim()).includes(userEmail.toLowerCase().trim());
        return roleMatch || emailMatch;
      });

      setDashboards(filtered);
      if (filtered.length > 0) {
        setSelectedDashboardId(filtered[0].id);
      } else {
        setSelectedDashboardId('');
      }

      setNotification({ type: 'success', text: 'Dashboard purgado con éxito de la base de seguridad.' });
    }
  };

  // Metadatos del dashboard activo para indicadores contextuales
  const activeDashboard = dashboards.find(d => d.id === selectedDashboardId);

  // Ejes y ASICs únicos para los selectores de filtros interactivos
  const uniqueEjes = Array.from(new Set(nominalData.map(d => d.eje_geografico))).filter(Boolean);
  const uniqueAsics = Array.from(new Set(nominalData
    .filter(d => filterEje === 'Todos' || d.eje_geografico === filterEje)
    .map(d => d.asic)
  )).filter(Boolean);

  return (
    <div className="space-y-6">
      
      {/* NOTIFICATION HUD */}
      {notification && (
        <div className={`p-3 rounded-2xl flex items-center justify-between text-xs font-bold leading-relaxed border ${
          notification.type === 'success' ? 'bg-slate-900 border-slate-800 text-white' :
          notification.type === 'error' ? 'bg-red-950 border-red-900 text-red-200' : 
          'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="shrink-0 text-amber-400" />
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-[10px] uppercase font-bold hover:underline ml-4">
            Entendido
          </button>
        </div>
      )}

      {/* SUB-HEADER CON CONTROLES DEL DASHBOARD */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-blue-600">
            <BarChart3 size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest font-mono">Sala de Análisis Independiente</span>
          </div>
          
          <div className="flex items-center gap-2">
            {dashboards.length > 0 ? (
              <select
                value={selectedDashboardId}
                onChange={e => setSelectedDashboardId(e.target.value)}
                className="text-lg font-black uppercase text-slate-800 tracking-tight leading-none bg-transparent hover:bg-slate-50 border-b border-dashed border-slate-300 py-0.5 focus:outline-none focus:border-slate-800 cursor-pointer max-w-[280px] sm:max-w-md lg:max-w-xl truncate"
              >
                {dashboards.map(d => (
                  <option key={d.id} value={d.id}>{d.nombre}</option>
                ))}
              </select>
            ) : (
              <h2 className="text-lg font-black uppercase text-slate-800 tracking-tight leading-none">
                Sin Dashboards Asignados
              </h2>
            )}
          </div>
          
          {activeDashboard && (
            <p className="text-[10.5px] text-slate-450 text-slate-400 max-w-xl leading-relaxed">
              {activeDashboard.descripcion}
            </p>
          )}
        </div>

        {/* ACCIONES DEL DOCK */}
        <div className="flex items-center gap-2 self-stretch lg:self-auto shrink-0 animate-fade-in">
          <button
            onClick={() => setShowIntegrationGuide(!showIntegrationGuide)}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-[9.5px] font-black uppercase tracking-wider cursor-pointer transition h-[38px] ${
              emulateData
                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-800 border-emerald-250 hover:bg-emerald-100'
            }`}
            title="Sincronización o Simulación de Datos"
          >
            <FileSpreadsheet size={13} />
            {emulateData ? 'Ver Modo Simulado' : 'Ver Datos Reales'}
          </button>

          <button
            onClick={fetchNominalData}
            title="Sincronizar Webhooks"
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-xl transition cursor-pointer flex items-center justify-center h-[38px] w-[38px]"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>

          {profile?.rol === 'admin' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 text-[9.5px] font-black uppercase tracking-wider rounded-xl cursor-pointer transition shadow-xs hover:shadow-sm h-[38px]"
            >
              <Plus size={14} /> Crear Nuevo Dashboard
            </button>
          )}

          {profile?.rol === 'admin' && activeDashboard && (
            <button
              onClick={() => handleDeleteDashboard(activeDashboard.id)}
              title="Eliminar Dashboard Permanente"
              className="p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-xl transition cursor-pointer flex items-center justify-center h-[38px] w-[38px]"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* PANEL DE INTEGRACIÓN CON GOOGLE SHEETS / SUPABASE REAL */}
      <AnimatePresence>
        {showIntegrationGuide && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 font-sans"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="p-1 bg-[#0B3D5C] text-white rounded-md text-[10px]">REAL</span>
                  Enlace y Acoplamiento de Datos Reales (Google Sheets)
                </h3>
                <p className="text-[10px] text-slate-450 text-slate-400 mt-1">
                  Configure su Google Web App URL para sincronizar registros en vivo desde sus planillas SSPA / GAS.
                </p>
              </div>
              
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Activar Simulación:</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !emulateData;
                    setEmulateData(nextVal);
                    localStorage.setItem('EMULATE_NOMINAL_DATA', String(nextVal));
                  }}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${emulateData ? 'bg-amber-500' : 'bg-slate-200'}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${emulateData ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PROCEDIMIENTO */}
              <div className="space-y-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Instrucciones de Despliegue Real</span>
                <div className="space-y-2 text-[10px] text-slate-600 leading-relaxed font-semibold">
                  <div className="flex gap-2">
                    <span className="text-[#0B3D5C] font-black">1.</span>
                    <p>Abra el panel de Google Apps Script en <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">script.google.com</a>.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[#0B3D5C] font-black">2.</span>
                    <p>Copie el código fuente consolidado provisto en el archivo <code className="bg-slate-100 text-[#092F47] px-1 py-0.5 rounded font-mono text-[9px]">google_apps_script_code.gs</code>.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[#0B3D5C] font-black">3.</span>
                    <p>Cree una nueva implementación tipo <strong className="text-slate-800">"Aplicación Web"</strong> y dé acceso a <strong className="text-slate-800">"Cualquier Persona" (Anyone)</strong>.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[#0B3D5C] font-black">4.</span>
                    <p>Pegue la URL obtenida en el campo de la derecha, guarde el acoplamiento y desactive "Activar Simulación" para ver datos reales.</p>
                  </div>
                </div>
              </div>

              {/* ENTRADA DE CONFIGURACIÓN */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                <div className="space-y-1.5 col-span-1">
                  <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest block">Dirección URL del Webhook Real (GAS Web App)</span>
                  <input
                    type="text"
                    value={customWebhookUrl}
                    onChange={(e) => setCustomWebhookUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-slate-800 placeholder-slate-400 font-mono"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wide">
                    {useSimulatedData ? '⚠️ Visualizando Modo Simulado' : '⚡ Conectado con Datos Reales'}
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem('VITE_GOOGLE_SCRIPT_URL', customWebhookUrl);
                        fetchNominalData();
                        setNotification({ type: 'success', text: 'Sincronizador Google Webhook actualizado.' });
                      }}
                      className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer transition"
                    >
                      Guardar URL
                    </button>
                    {customWebhookUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomWebhookUrl('');
                          localStorage.removeItem('VITE_GOOGLE_SCRIPT_URL');
                          setNotification({ type: 'info', text: 'Reiniciado al Webhook por defecto.' });
                        }}
                        className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer transition"
                      >
                        Reiniciar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* PANEL DE CONTROL INTERACTIVO (CONTROL LATERAL JUGABLE) */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-5 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold uppercase tracking-wide text-xs">
              <Filter size={14} />
              <span>Plataforma de Cruces</span>
            </div>
            
            <button
              onClick={() => {
                setFilterAgeGroup('Todos');
                setFilterGender('Todos');
                setFilterEje('Todos');
                setFilterAsic('Todos');
                setSearchQuery('');
                if (activeDashboard) setInteractiveWeeklyMeta(activeDashboard.meta_semanal);
              }}
              className="text-[9px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest cursor-pointer"
            >
              Resetear
            </button>
          </div>

          {/* Buscador Integrado */}
          <div className="space-y-1">
            <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Buscar Registro</span>
            <div className="relative">
              <input
                type="text"
                placeholder="Nombre, cédula, CDI..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-705 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white transition"
              />
              <Search size={12} className="absolute left-3 top-3 text-slate-400" />
            </div>
          </div>

          {/* RANGOS ETARIOS */}
          <div className="space-y-2">
            <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Rango Etario</span>
            <div className="flex flex-col gap-1.5">
              {(['Todos', 'Pediatría', 'Adulto', 'Adulto Mayor'] as const).map(age => (
                <button
                  key={age}
                  onClick={() => setFilterAgeGroup(age)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                    filterAgeGroup === age 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{age}</span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${filterAgeGroup === age ? 'bg-white/15 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {age === 'Todos' ? nominalData.length :
                     age === 'Pediatría' ? nominalData.filter(i => i.edad < 18).length :
                     age === 'Adulto' ? nominalData.filter(i => i.edad >= 18 && i.edad < 65).length :
                     nominalData.filter(i => i.edad >= 65).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* GÉNEROS */}
          <div className="space-y-2">
            <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Sexo Biológico</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Todos', 'MASCULINO', 'FEMENINO'] as const).map(g => (
                <button
                  key={g}
                  onClick={() => setFilterGender(g)}
                  className={`px-2 py-2 rounded-xl text-[9px] font-black uppercase text-center transition cursor-pointer ${
                    filterGender === g 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {g === 'Todos' ? 'Ambos' : g === 'MASCULINO' ? 'M' : 'F'}
                </button>
              ))}
            </div>
          </div>

          {/* EJES TECTONICOS TERRITORIALES */}
          <div className="space-y-1">
            <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Eje Geográfico</span>
            <select
              value={filterEje}
              onChange={e => {
                setFilterEje(e.target.value);
                setFilterAsic('Todos');
              }}
              disabled={activeDashboard && activeDashboard.eje_geografico !== 'Todos'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <option value="Todos">Todos los Ejes</option>
              {uniqueEjes.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {/* ASICS ESPECÍFICOS */}
          <div className="space-y-1">
            <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">ASIC Clínico</span>
            <select
              value={filterAsic}
              onChange={e => setFilterAsic(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-slate-800 cursor-pointer"
            >
              <option value="Todos">Todos los ASIC</option>
              {uniqueAsics.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* TASAS DE CUMPLIMIENTO INTERACTIVAS (WEEK META) */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">Meta Semanal</span>
              <span className="font-mono text-[10.5px] text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{interactiveWeeklyMeta} reg.</span>
            </div>
            
            <input
              type="range"
              min="10"
              max="300"
              step="5"
              value={interactiveWeeklyMeta}
              onChange={e => setInteractiveWeeklyMeta(parseInt(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer"
            />
            
            <p className="text-[8.5px] text-slate-400 leading-normal">
              Ajuste la barra de metas semanales para recalcular instantáneamente la tasa de cumplimiento del eje seleccionado en base a los datos.
            </p>
          </div>
        </div>

        {/* SALA DE ANÁLISIS RENDIMIENTO VISUAL (MÉTRICAS MATEMÁTICAS PURE GEOMETRY) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* MATRIZ DE RITMO Y METAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* CARD 1: CUMPLIMIENTO CRUZADO */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col justify-between h-[180px]">
              <div className="flex justify-between items-start">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tasa de Cumplimiento</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                  complianceRate >= 90 ? 'bg-slate-900 text-white' :
                  complianceRate >= 75 ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-400'
                }`}>
                  Semanal SSPA
                </span>
              </div>
              
              <div className="my-auto flex items-end gap-3">
                <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none">
                  {complianceRate}%
                </h3>
                <div className="text-[9.5px] text-slate-405 leading-none pb-1 font-bold">
                  <span className="text-slate-800">{totalRecordsCount}</span> de {interactiveWeeklyMeta} envíos
                </div>
              </div>

              {/* Geometric Minimal Progress Ring inside horizontal container */}
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-slate-900 h-full transition-all duration-500" 
                  style={{ width: `${complianceRate}%` }}
                />
              </div>
            </div>

            {/* CARD 2: GÉNERO Y BRECHAS */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col justify-between h-[180px]">
              <div className="flex justify-between items-start">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Distribución de Sexo</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Proporción</span>
              </div>

              <div className="space-y-2 my-auto">
                {/* Horizontal simple block */}
                <div className="flex justify-between items-end text-xs font-bold">
                  <span className="text-[#0B3D5C] uppercase text-[10px]">Femenino ({femCount})</span>
                  <span className="text-slate-900 font-mono">{femPercentage}%</span>
                </div>
                
                <div className="flex justify-between items-end text-xs font-bold">
                  <span className="text-slate-500 uppercase text-[10px]">Masculino ({mascCount})</span>
                  <span className="text-slate-400 font-mono">{mascPercentage}%</span>
                </div>

                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="bg-[#0B3D5C] h-full" style={{ width: `${femPercentage}%` }}></div>
                  <div className="bg-slate-400 h-full flex-grow"></div>
                </div>
              </div>

              <span className="text-[8.5px] text-slate-400 font-mono uppercase tracking-wide">
                Fórmula: [Registros por Sexo / Total]
              </span>
            </div>

            {/* CARD 3: AUDITORÍA DE EDAD */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col justify-between h-[180px]">
              <div className="flex justify-between items-start">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pirámide Etaria</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Envíos Cruzados</span>
              </div>

              <div className="my-auto space-y-1.5">
                {/* Micro bars */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-16 text-[9.5px] text-slate-500 uppercase font-bold text-right">Pediátrico</span>
                  <div className="flex-grow bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-slate-800 h-full" style={{ width: `${pediPercentage}%` }}></div>
                  </div>
                  <span className="w-8 font-mono text-[9px] text-right text-slate-650">{pediPercentage}%</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-16 text-[9.5px] text-slate-500 uppercase font-bold text-right">Adulto</span>
                  <div className="flex-grow bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-slate-800 h-full" style={{ width: `${adultPercentage}%` }}></div>
                  </div>
                  <span className="w-8 font-mono text-[9px] text-right text-slate-650">{adultPercentage}%</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="w-16 text-[9.5px] text-slate-500 uppercase font-bold text-right">M. Mayor</span>
                  <div className="flex-grow bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-slate-800 h-full" style={{ width: `${seniorPercentage}%` }}></div>
                  </div>
                  <span className="w-8 font-mono text-[9px] text-right text-slate-650">{seniorPercentage}%</span>
                </div>
              </div>

              <p className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider">
                Total Pacientes: <span className="font-mono text-slate-600">{totalRecordsCount}</span>
              </p>
            </div>

          </div>

          {/* TABLAS GEOMÉTRICAS RESUMEN POR ASIC */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Resumen de Matrícula por ASIC Clínico
                </h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  Detección nominal de envíos en base de datos para el eje: <span className="text-blue-600">{filterEje}</span>
                </p>
              </div>

              <span className="text-[8.5px] font-mono font-black uppercase tracking-widest bg-slate-150 p-1.5 bg-slate-100 rounded text-slate-600">
                Total ASICs Activas: {sortedAsicMetrics.length}
              </span>
            </div>

            {sortedAsicMetrics.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">No hay envíos que califiquen para los filtros seleccionados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[8.5px] font-black text-slate-405 text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="px-4 py-3">Área Integral Comunitaria (ASIC)</th>
                      <th className="px-4 py-3">Eje Territorial</th>
                      <th className="px-4 py-3 text-center">Quirúrgicos</th>
                      <th className="px-4 py-3 text-center">Obstétricos</th>
                      <th className="px-4 py-3 text-center">Defunciones</th>
                      <th className="px-4 py-3 text-right">Envios Totales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedAsicMetrics.map((val, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-800 uppercase tracking-tight text-[11px]">
                          {val.asic}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-medium text-[10px] uppercase">
                          {val.eje}
                        </td>
                        <td className="px-4 py-3 text-center text-[11px] font-semibold text-blue-700">
                          {val.quirurgica || '-'}
                        </td>
                        <td className="px-4 py-3 text-center text-[11px] font-semibold text-pink-700">
                          {val.obstetrica || '-'}
                        </td>
                        <td className="px-4 py-3 text-center text-[11px] font-semibold text-slate-600">
                          {val.defuncion || '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-slate-900 font-mono text-[11px]">
                          {val.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* HISTORIAL RECIENTE NOMINAL FILTRADO */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Inspección Nominal Filtrada v2.0
                </h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  Verificación de auditoría demográfica en tiempo real
                </p>
              </div>

              <span className="text-[9px] font-black uppercase text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-555 bg-emerald-500 rounded-full animate-pulse inline-block"></span>
                Mostrando: {filteredData.length} pacientes
              </span>
            </div>

            {filteredData.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-10 text-center">Ningún registro coincide con los filtros especificados en la barra de control.</p>
            ) : (
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-left font-sans text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 text-[8px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="px-3 py-2">Cédula</th>
                      <th className="px-3 py-2">Nombre Completo</th>
                      <th className="px-3 py-2 text-center">Edad</th>
                      <th className="px-3 py-2 text-center">Sexo</th>
                      <th className="px-3 py-2">CDI / Centro Salud</th>
                      <th className="px-3 py-2">Documento</th>
                      <th className="px-3 py-2 text-right">Patología / Tipo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[9.5px]">
                    {filteredData.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-3 py-2 font-mono font-bold text-slate-500 uppercase">{item.cedula}</td>
                        <td className="px-3 py-2 font-bold text-slate-800 uppercase max-w-[150px] truncate">{item.nombre}</td>
                        <td className="px-3 py-2 text-center font-bold text-slate-600">{item.edad} añ.</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                            item.genero === 'FEMENINO' ? 'bg-pink-50 text-pink-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {item.genero === 'FEMENINO' ? 'F' : 'M'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-500 uppercase max-w-[120px] truncate">{item.centro_salud}</td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                            item.tipo_planilla === 'QUIRURGICA' ? 'bg-blue-900 text-white' :
                            item.tipo_planilla === 'OBSTETRICA' ? 'bg-pink-900 text-white' : 'bg-slate-900 text-white'
                          } uppercase`}>
                            {item.tipo_planilla}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-slate-705 text-slate-700 font-medium uppercase font-sans max-w-[150px] truncate">{item.diagnostico}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* MODAL: CREAR CONFIGURACIÓN DE DASHBOARD (ADMINISTRADOR) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Diseñador y Asignador de Dashboard</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Defina permisos, alcance geográfico y metas de control</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-800 font-extrabold text-base"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateDashboard} className="space-y-4">
              
              {/* Nombre */}
              <div className="space-y-1">
                <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Nombre del Dashboard</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sala de Maternidad Central"
                  value={newDashboard.nombre}
                  onChange={e => setNewDashboard(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-slate-800 focus:bg-white transition"
                />
              </div>

              {/* Descripcion */}
              <div className="space-y-1">
                <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Objetivo o Descripción</label>
                <textarea
                  placeholder="Explique qué métricas cruzará este tablero..."
                  value={newDashboard.descripcion}
                  onChange={e => setNewDashboard(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full h-16 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-slate-800 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Meta Semanal */}
                <div className="space-y-1">
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Meta Envios Semanal</label>
                  <input
                    type="number"
                    required
                    min="10"
                    value={newDashboard.meta_semanal}
                    onChange={e => setNewDashboard(prev => ({ ...prev, meta_semanal: parseInt(e.target.value) || 100 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-750 focus:outline-none focus:border-slate-800 focus:bg-white transition"
                  />
                </div>

                {/* Eje Territorial Filtro predeterminado */}
                <div className="space-y-1">
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Restringir a Eje</label>
                  <select
                    value={newDashboard.eje_geografico}
                    onChange={e => setNewDashboard(prev => ({ ...prev, eje_geografico: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-slate-800 focus:bg-white transition cursor-pointer"
                  >
                    <option value="Todos">Todos (Sin Restricción)</option>
                    <option value="Valles del Tuy">Valles del Tuy</option>
                    <option value="Metropolitano">Metropolitano</option>
                    <option value="Altos Mirandinos">Altos Mirandinos</option>
                    <option value="Guarenas-Guatire">Guarenas-Guatire</option>
                    <option value="Barlovento">Barlovento</option>
                  </select>
                </div>
              </div>

              {/* Roles asignados */}
              <div className="space-y-1.5">
                <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Asignar por Roles de Carga</span>
                <div className="flex flex-wrap gap-2">
                  {['admin', 'directivo', 'oficina', 'nominal'].map(role => {
                    const active = newDashboard.roles.includes(role);
                    return (
                      <button
                        type="button"
                        key={role}
                        onClick={() => toggleRoleInNewDashboard(role)}
                        className={`px-3 py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-wide border cursor-pointer transition ${
                          active 
                            ? 'bg-[#0B3D5C] text-white border-transparent' 
                            : 'bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Correos asignados */}
              <div className="space-y-1">
                <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Asignar por Correo de Operador (Emails separados por comas)</label>
                <input
                  type="text"
                  placeholder="ej: nominal@mirandasalud.com, director@gmail.com"
                  value={newDashboard.usuarios}
                  onChange={e => setNewDashboard(prev => ({ ...prev, usuarios: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-slate-800 focus:bg-white transition"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#0B3D5C] hover:bg-[#072437] text-white font-black uppercase text-xs tracking-wider py-3 rounded-2xl transition shadow-xs"
                >
                  ⚡ Registrar y Sincronizar Permisos SSPA
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
