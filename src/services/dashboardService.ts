// services/dashboardService.ts
export interface TransitoReporte {
  id_centro: string;
  nombre_centro: string;
  asic: string;
  eje_geografico: string;
  ultimo_reporte: string;
  estado_semaforo: 'Verde' | 'Amarillo' | 'Rojo';
  horas_retraso: number;
  actualizado_en: string;
}

export interface ASICSummary {
  asic: string;
  eje_geografico: string;
  total_centros: number;
  centros_reportaron: number;
  porcentaje: number;
}

export interface EjeSummary {
  eje_geografico: string;
  asics: ASICSummary[];
  porcentaje_eje: number;
  total_centros: number;
  centros_reportaron: number;
  verdes: number;
  amarillos: number;
  rojos: number;
}

export interface DashboardStats {
  cumplimiento_general: number;
  total_centros: number;
  centros_reportaron: number;
  total_asics: number;
  ejes_al_dia: number;
  total_ejes: number;
}

export function calculateDashboardState(
  reportes: TransitoReporte[],
  resumenAsicsDb?: any[]
): { asics: ASICSummary[]; ejes: EjeSummary[]; stats: DashboardStats } {
  // Agrupar por ASIC
  const asicMap = new Map<string, { eje: string; centros: number; reportaron: number }>();
  reportes.forEach(r => {
    const asic = r.asic;
    if (!asicMap.has(asic)) {
      asicMap.set(asic, { eje: r.eje_geografico, centros: 0, reportaron: 0 });
    }
    const entry = asicMap.get(asic)!;
    entry.centros++;
    if (r.estado_semaforo === 'Verde') entry.reportaron++;
  });
  const asics: ASICSummary[] = Array.from(asicMap.entries()).map(([asic, data]) => ({
    asic,
    eje_geografico: data.eje,
    total_centros: data.centros,
    centros_reportaron: data.reportaron,
    porcentaje: data.centros ? (data.reportaron / data.centros) * 100 : 0,
  }));

  // Agrupar por Eje
  const ejeMap = new Map<string, { asics: ASICSummary[]; centros: number; verdes: number; amarillos: number; rojos: number }>();
  asics.forEach(a => {
    const eje = a.eje_geografico;
    if (!ejeMap.has(eje)) ejeMap.set(eje, { asics: [], centros: 0, verdes: 0, amarillos: 0, rojos: 0 });
    ejeMap.get(eje)!.asics.push(a);
  });
  reportes.forEach(r => {
    const eje = r.eje_geografico;
    if (!ejeMap.has(eje)) ejeMap.set(eje, { asics: [], centros: 0, verdes: 0, amarillos: 0, rojos: 0 });
    const entry = ejeMap.get(eje)!;
    entry.centros++;
    if (r.estado_semaforo === 'Verde') entry.verdes++;
    else if (r.estado_semaforo === 'Amarillo') entry.amarillos++;
    else entry.rojos++;
  });

  const ejes: EjeSummary[] = Array.from(ejeMap.entries()).map(([eje, data]) => {
    const total_centros = data.centros;
    const centros_reportaron = data.verdes;
    const porcentaje_eje = total_centros ? (centros_reportaron / total_centros) * 100 : 0;
    return {
      eje_geografico: eje,
      asics: data.asics,
      porcentaje_eje,
      total_centros,
      centros_reportaron,
      verdes: data.verdes,
      amarillos: data.amarillos,
      rojos: data.rojos,
    };
  });

  const total_centros = asics.reduce((s, a) => s + a.total_centros, 0);
  const centros_reportaron = asics.reduce((s, a) => s + a.centros_reportaron, 0);
  const total_asics = asics.length;
  const total_ejes = ejes.length;
  const ejes_al_dia = ejes.filter(e => e.porcentaje_eje >= 75).length;
  const cumplimiento_general = ejes.length ? ejes.reduce((s, e) => s + e.porcentaje_eje, 0) / ejes.length : 0;

  const stats: DashboardStats = { cumplimiento_general, total_centros, centros_reportaron, total_asics, ejes_al_dia, total_ejes };
  return { asics, ejes, stats };
}

export async function triggerGoogleSheetsSync(): Promise<boolean> {
  try {
    const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';
    const response = await fetch('/api/run-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'procesarAmbosReportes', scriptUrl }),
    });
    const result = await response.json();
    return result.status === 'success';
  } catch (error) {
    console.error(error);
    return false;
  }
}