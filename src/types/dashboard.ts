export interface AsicAggregationRow {
  asic: string;
  eje_geografico: string;
  total_centros: number;
  centros_verdes: number;
  centros_amarillos: number;
  centros_rojos: number;
  promedio_retraso: number;
  total_atenciones_semanales: number;
}

export interface AsicAgregado {
  name: string;
  total_centros: number;
  centros_verdes: number;
  centros_amarillos: number;
  centros_rojos: number;
  promedio_retraso: number;
  total_atenciones_semanales: number;
}

export interface EjeGeograficoAgregado {
  name: string;
  total_centros: number;
  centros_verdes: number;
  promedio_retraso: number;
  asics: AsicAgregado[];
}

export interface DashboardAssignment {
  id: string;
  nombre: string;
  descripcion?: string;
  roles_permitidos: string[]; // e.g. ['admin', 'nominal', 'oficina', 'directivo']
  usuarios_permitidos: string[]; // e.g. ['miranda.salud2026@gmail.com', 'nominal@mirandasalud.com']
  eje_geografico?: string; // Filtro predeterminado de eje territorial (ej: 'Valles del Tuy' o 'Todos')
  meta_semanal: number; // Meta de registros semanal
  fecha_creacion: string;
  activo: boolean;
}

