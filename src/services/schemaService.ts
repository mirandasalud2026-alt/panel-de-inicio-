// src/services/schemaService.ts
import { supabase } from '../lib/supabase';
import { ConfiguracionModulo } from '../types/admin';

// Definición de las tablas estáticas del sistema para soporte offline / fallback robusto
const SYSTEM_TABLES_METADATA: Record<string, { descripcion: string; columnas: { name: string; type: string; label: string }[] }> = {
  usuarios: {
    descripcion: 'Control de acceso regional, perfiles, roles y asignación de centros.',
    columnas: [
      { name: 'id', type: 'uuid', label: 'ID Único' },
      { name: 'nombre', type: 'text', label: 'Nombre Completo' },
      { name: 'email', type: 'text', label: 'Correo de Contacto' },
      { name: 'rol', type: 'text', label: 'Rol SSPA' },
      { name: 'estado', type: 'text', label: 'Estado Operativo' },
      { name: 'id_centro', type: 'text', label: 'ID Centro Adscrito' },
      { name: 'cod_eje', type: 'text', label: 'Código Eje Geográfico' },
      { name: 'created_at', type: 'timestamp', label: 'Fecha de Registro' }
    ]
  },
  P_pacientes: {
    descripcion: 'Historial unificado y maestro nominal de pacientes del Estado Miranda (P_pacientes).',
    columnas: [
      { name: 'cedula', type: 'text', label: 'Cédula de Identidad' },
      { name: 'nacionalidad', type: 'text', label: 'Nacionalidad (V/E)' },
      { name: 'nombre_y_apellido', type: 'text', label: 'Nombre y Apellido' },
      { name: 'sexo', type: 'text', label: 'Sexo (M/F)' },
      { name: 'f_nac', type: 'text', label: 'Fecha Nacimiento' },
      { name: 'edad', type: 'number', label: 'Edad Actual' },
      { name: 'movil01', type: 'text', label: 'Teléfono Móvil' },
      { name: 'created_at', type: 'timestamp', label: 'Sincronizado' }
    ]
  },
  nominales: {
    descripcion: 'Bitácora persistente de atenciones médicas ingresadas en la ventana rotatoria de 7 días.',
    columnas: [
      { name: 'id', type: 'number', label: 'Correlativo ID' },
      { name: 'tipo_registro', type: 'text', label: 'Tipo de Carga' },
      { name: 'cedula_principal', type: 'text', label: 'Cédula Paciente' },
      { name: 'nombre_paciente', type: 'text', label: 'Nombre Paciente' },
      { name: 'medico_tratante', type: 'text', label: 'Médico Responsable' },
      { name: 'centro_salud', type: 'text', label: 'Establecimiento Médico' },
      { name: 'fecha_creacion', type: 'timestamp', label: 'Fecha Carga' }
    ]
  },
  registros_quirurgicos: {
    descripcion: 'Estructura nominalizada de intervenciones quirúrgicas electivas y urgentes.',
    columnas: [
      { name: 'id', type: 'number', label: 'ID Registro' },
      { name: 'centro_salud', type: 'text', label: 'Centro de Salud' },
      { name: 'cedula_paciente', type: 'text', label: 'Cédula Paciente' },
      { name: 'nombre_paciente', type: 'text', label: 'Nombre Paciente' },
      { name: 'especialidad_quirurgica', type: 'text', label: 'Especialidad médica' },
      { name: 'tipo_intervencion', type: 'text', label: 'Intervención Aplicada' },
      { name: 'urgente_electiva', type: 'text', label: 'Prioridad' },
      { name: 'cantidad_intervencion', type: 'number', label: 'Cantidad' },
      { name: 'nombre_medico', type: 'text', label: 'Cirujano' }
    ]
  },
  registros_obstetricos: {
    descripcion: 'Ficha nominal de partos, cesáreas y atenciones a madres y neonatos.',
    columnas: [
      { name: 'id', type: 'number', label: 'ID Registro' },
      { name: 'centro_salud', type: 'text', label: 'Centro de Salud' },
      { name: 'cedula_madre', type: 'text', label: 'Cédula de la Madre' },
      { name: 'nombre_madre', type: 'text', label: 'Nombre Madre' },
      { name: 'tipo_parto', type: 'text', label: 'Metodología Parto' },
      { name: 'nombre_infante', type: 'text', label: 'Identificador Infante' },
      { name: 'sexo_infante', type: 'text', label: 'Sexo Neonato' },
      { name: 'nombre_medico', type: 'text', label: 'Médico Obstetra' }
    ]
  },
  registros_defunciones: {
    descripcion: 'Ficha de defunciones hospitalarias, patologías asociadas y causas clínicas.',
    columnas: [
      { name: 'id', type: 'number', label: 'ID Registro' },
      { name: 'centro_salud', type: 'text', label: 'Centro de Salud' },
      { name: 'cedula_fallecido', type: 'text', label: 'Cédula Fallecido' },
      { name: 'nombre_fallecido', type: 'text', label: 'Nombre Fallecido' },
      { name: 'patologia', type: 'text', label: 'Causa Básica Defunción' },
      { name: 'hora_fallecimiento', type: 'text', label: 'Hora' },
      { name: 'nombre_medico', type: 'text', label: 'Médico Certificador' }
    ]
  },
  logs_auditoria: {
    descripcion: 'Auditoría inmutable de sucesos críticos del panel administrativo.',
    columnas: [
      { name: 'id', type: 'number', label: 'ID Log' },
      { name: 'usuario_email', type: 'text', label: 'Operador Ejecutivo' },
      { name: 'accion', type: 'text', label: 'Tipo Operación' },
      { name: 'tabla_afectada', type: 'text', label: 'Módulo S afectado' },
      { name: 'registro_id', type: 'text', label: 'ID Físico Fila' },
      { name: 'fecha', type: 'timestamp', label: 'Sello de Tiempo' }
    ]
  }
};

export const schemaService = {
  // Obtener nombres de todas las tablas disponibles (estáticas + virtuales dinámicas)
  getTables: async (): Promise<string[]> => {
    const staticTables = Object.keys(SYSTEM_TABLES_METADATA);
    
    // Cargar también las tablas/módulos dinámicos creados e inyectados
    const dinamicModules = schemaService.getDynamicModules();
    const dynamicTables = dinamicModules.map(m => m.meta_datos.tabla_nombre);
    
    // Unir sin duplicar
    return Array.from(new Set([...staticTables, ...dynamicTables]));
  },

  // Obtener metadatos y columnas de una tabla seleccionada
  getTableSchema: (tableName: string) => {
    // 1. Revisar si es una tabla estática del sistema
    if (SYSTEM_TABLES_METADATA[tableName]) {
      return SYSTEM_TABLES_METADATA[tableName];
    }

    // 2. Revisar si es un módulo dinámico creado
    const dinamicModules = schemaService.getDynamicModules();
    const dynamicTable = dinamicModules.find(m => m.meta_datos.tabla_nombre === tableName);
    if (dynamicTable) {
      return {
        descripcion: `[Formulario Dinámico] ${dynamicTable.meta_datos.descripcion}`,
        columnas: [
          { name: 'id', type: 'text', label: 'ID Registro' },
          ...dynamicTable.estructura.map(field => ({
            name: field.campo_id,
            type: field.tipo_dato,
            label: field.etiqueta || field.campo_id
          })),
          { name: 'created_at', type: 'timestamp', label: 'Fecha Carga' }
        ]
      };
    }

    return {
      descripcion: 'Tabla personalizada o de extensión externa.',
      columnas: [{ name: 'id', type: 'text', label: 'ID Fila' }]
    };
  },

  // Obtener los registros guardados de cualquier tabla (híbrido Supabase y localStorage)
  getTableRecords: async (tableName: string): Promise<any[]> => {
    // Primero, si es un módulo dinámico virtual, buscaremos sus datos del localStorage
    const dinamicModules = schemaService.getDynamicModules();
    const isDynamic = dinamicModules.some(m => m.meta_datos.tabla_nombre === tableName);

    if (isDynamic) {
      const recordsKey = `dynamic_data_${tableName}`;
      const saved = localStorage.getItem(recordsKey);
      return saved ? JSON.parse(saved) : [];
    }

    // Si es del sistema, intentamos cargar en tiempo real desde Supabase con fallback local de datos simulados
    try {
      if (supabase) {
        const { data, error } = await supabase.from(tableName).select('*').limit(50);
        if (!error && data) {
          return data;
        }
      }
    } catch (err) {
      console.warn(`Error al consultar Supabase para ${tableName}, utilizando simulación local:`, err);
    }

    // Fallback de datos simulados de excelente calidad
    return schemaService.getSimulatedRecords(tableName);
  },

  // Obtener los módulos del localStorage dinámicos
  getDynamicModules: (): ConfiguracionModulo[] => {
    const saved = localStorage.getItem('s_admin_dinamic_modules');
    return saved ? JSON.parse(saved) : [];
  },

  // Guardar un módulo dinámico
  saveDynamicModule: (module: ConfiguracionModulo): void => {
    const modules = schemaService.getDynamicModules();
    // Reemplazar si ya existe o agregar de cero
    const filtered = modules.filter(m => m.id !== module.id && m.meta_datos.tabla_nombre !== module.meta_datos.tabla_nombre);
    
    const newModule = {
      ...module,
      fecha_creacion: module.fecha_creacion || new Date().toISOString()
    };
    
    filtered.push(newModule);
    localStorage.setItem('s_admin_dinamic_modules', JSON.stringify(filtered));
  },

  // Eliminar un módulo dinámico
  deleteDynamicModule: (id: string): void => {
    const modules = schemaService.getDynamicModules();
    const updated = modules.filter(m => m.id !== id);
    localStorage.setItem('s_admin_dinamic_modules', JSON.stringify(updated));
  },

  // Datos de demostración simulados para cuando no hay conexión de internet o Supabase directo
  getSimulatedRecords: (tableName: string): any[] => {
    const now = new Date().toISOString();
    switch (tableName) {
      case 'usuarios':
        return [
          { id: '1', nombre: 'Dra. María Antonieta Albarrán', email: 'coordinacion.salud@miranda.gob.ve', rol: 'admin', estado: 'aprobado', id_centro: 'CLI-01', cod_eje: 'MET-01', created_at: now },
          { id: '2', nombre: 'Inspector Regional de Epidemiología', email: 'inspeccion.salud2026@gmail.com', rol: 'directivo', estado: 'aprobado', id_centro: null, cod_eje: 'AMI-01', created_at: now },
          { id: '3', nombre: 'Operador Nominal CDI Guarenas', email: 'nominal@mirandasalud.com', rol: 'nominal', estado: 'aprobado', id_centro: 'AMI-02', cod_eje: 'GGU-01', created_at: now },
          { id: '4', nombre: 'Enfermera Coordinadora Paracotos', email: 'paracotos.salud@gmail.com', rol: 'nominal', estado: 'pendiente', id_centro: 'AMI-01', cod_eje: 'AMI-01', created_at: now }
        ];
      case 'P_pacientes':
        return [
          { cedula: 'V-14234567', nacionalidad: 'V', nombre_y_apellido: 'PEDRO PÉREZ', edad: 42, sexo: 'M', movil01: '04141112233', f_nac: '1984-05-12', created_at: now },
          { cedula: 'V-18902534', nacionalidad: 'V', nombre_y_apellido: 'YULITZA GÓMEZ', edad: 28, sexo: 'F', movil01: '04125556677', f_nac: '1998-09-20', created_at: now },
          { cedula: 'V-8345129', nacionalidad: 'V', nombre_y_apellido: 'ALEJANDRO RODRÍGUEZ', edad: 67, sexo: 'M', movil01: '04169998822', f_nac: '1959-01-15', created_at: now }
        ];
      case 'nominales':
        return [
          { id: 101, tipo_registro: 'quirurgica', cedula_principal: 'V-14234567', nombre_paciente: 'PEDRO PÉREZ', medico_tratante: 'DR. CARLOS SÁNCHEZ', centro_salud: 'CLÍNICA POPULAR PARACOTOS', fecha_creacion: now },
          { id: 102, tipo_registro: 'obstetrica', cedula_principal: 'V-18902534', nombre_paciente: 'YULITZA GÓMEZ', medico_tratante: 'DRA. JOSEFINA TORRES', centro_salud: 'HOSPITAL ANA FRANCISCA PEREZ DE LEON II', fecha_creacion: now },
          { id: 103, tipo_registro: 'defuncion', cedula_principal: 'V-8345129', nombre_paciente: 'ALEJANDRO RODRÍGUEZ', medico_tratante: 'DR. MANUEL GIMÉNEZ', centro_salud: 'HOSPITAL DOMINGO LUCIANI', fecha_creacion: now }
        ];
      case 'registros_quirurgicos':
        return [
          { id: 1, centro_salud: 'CLÍNICA POPULAR PARACOTOS', cedula_paciente: 'V-14234567', nombre_paciente: 'PEDRO PÉREZ', especialidad_quirurgica: 'Traumatología', tipo_intervencion: 'Osteosíntesis de tibia', urgente_electiva: 'Electiva', cantidad_intervencion: 1, nombre_medico: 'CARLOS SÁNCHEZ' }
        ];
      case 'registros_obstetricos':
        return [
          { id: 1, centro_salud: 'HOSPITAL ANA FRANCISCA PEREZ DE LEON II', cedula_madre: 'V-18902534', nombre_madre: 'YULITZA GÓMEZ', tipo_parto: 'Eutócico', nombre_infante: 'NEONATO GÓMEZ', sexo_infante: 'M', nombre_medico: 'JOSEFINA TORRES' }
        ];
      case 'registros_defunciones':
        return [
          { id: 1, centro_salud: 'HOSPITAL DOMINGO LUCIANI', cedula_fallecido: 'V-8345129', nombre_fallecido: 'ALEJANDRO RODRÍGUEZ', patologia: 'Insuficiencia Respiratoria Aguda', hora_fallecimiento: '03:15 AM', nombre_medico: 'MANUEL GIMÉNEZ' }
        ];
      case 'logs_auditoria':
        return [
          { id: 50, usuario_email: 'miranda.salud2026@gmail.com', accion: 'GESTIÓN_MÓDULO_CREAR', tabla_afectada: 'nominales', registro_id: 'SYSTEM', fecha: now },
          { id: 51, usuario_email: 'miranda.salud2026@gmail.com', accion: 'APROBAR_OPERADOR', tabla_afectada: 'usuarios', registro_id: '3', fecha: now }
        ];
      default:
        return [];
    }
  }
};
