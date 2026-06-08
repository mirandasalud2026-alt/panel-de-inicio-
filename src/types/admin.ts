// src/types/admin.ts

export interface CampoEstructura {
  campo_id: string;
  tipo_dato: 'text' | 'number' | 'boolean' | 'select' | 'date';
  requerido: boolean;
  opciones?: string[];
  etiqueta?: string;
}

export interface PoliticaRespaldo {
  sincronizar_sheets: boolean;
  tiempo_retencion_supabase_meses: number; // 0 significa indefinido
  destino_archivo_muerto: 'local_server_csv' | 'none';
}

export interface ConfiguracionModulo {
  id: string; // ID único del módulo
  comando: 'CREAR_TABLA' | 'GENERAR_FORMULARIO' | 'CONFIGURAR_RESPALDO';
  meta_datos: {
    tabla_nombre: string;
    descripcion: string;
    icono?: string;
  };
  estructura: CampoEstructura[];
  politica_respaldo: PoliticaRespaldo;
  fecha_creacion?: string;
  asignado_a?: string[]; // IDs de usuarios asignados
}

export interface AsignacionModulo {
  usuario_id: string;
  modulos_en_uso: string[]; // Listado de IDs de modulos_dinamicos
}
