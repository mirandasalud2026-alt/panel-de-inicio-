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
