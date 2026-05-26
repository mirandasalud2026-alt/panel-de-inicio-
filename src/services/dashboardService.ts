import { supabase } from '../lib/supabase';

export interface TransitoReporte {
  id_centro: string;
  nombre_centro: string;
  asic: string;
  eje_geografico: string;
  ultimo_reporte: string;
  estado_semaforo: 'Verde' | 'Amarillo' | 'Rojo';
  media_horas_retraso?: number;
  horas_retraso: number;
  actualizado_en: string;
}

export interface ResumenAsicDB {
  id: number;
  asic: string;
  eje: string;
  total_centros: number;
  centros_reportaron: number;
  porcentaje_reporte: number;
  actualizado_en?: string;
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

/**
 * Pure helper functions to process the state calculations
 */
export function calculateDashboardState(
  reportes: TransitoReporte[],
  resumenAsicsDb?: ResumenAsicDB[]
): {
  asics: ASICSummary[];
  ejes: EjeSummary[];
  stats: DashboardStats;
} {
  const tieneDatosSemaforo = reportes && reportes.length > 0;
  
  // 1. Group / parse ASIC summaries from DB or calculate from reportes
  let asicSummaries: ASICSummary[] = [];

  if (resumenAsicsDb && resumenAsicsDb.length > 0) {
    asicSummaries = resumenAsicsDb.map(r => ({
      asic: r.asic || "Sin ASIC",
      eje_geografico: r.eje || "Sin Eje",
      total_centros: r.total_centros || 0,
      centros_reportaron: r.centros_reportaron || 0,
      porcentaje: r.porcentaje_reporte || 0
    }));
  } else if (tieneDatosSemaforo) {
    const asicGroups: Record<string, { eje: string; centres: TransitoReporte[] }> = {};
    reportes.forEach(r => {
      const key = (r.asic || "Sin ASIC").toUpperCase().trim();
      if (!asicGroups[key]) {
        asicGroups[key] = { eje: (r.eje_geografico || "Sin Eje").trim(), centres: [] };
      }
      asicGroups[key].centres.push(r);
    });

    asicSummaries = Object.entries(asicGroups).map(([asicName, data]) => {
      const total_centros = data.centres.length;
      const centros_reportaron = data.centres.filter(c => (c.estado_semaforo || '').toLowerCase() === 'verde').length;
      const porcentaje = total_centros > 0 ? (centros_reportaron / total_centros) * 105 : 0;
      return {
        asic: asicName,
        eje_geografico: data.eje,
        total_centros,
        centros_reportaron,
        porcentaje: Math.min(100, parseFloat(porcentaje.toFixed(1)))
      };
    });
  }

  // 2. Group ASICs by Eje
  const ejeGroups: Record<string, { asics: ASICSummary[]; centres: TransitoReporte[] }> = {};
  
  // Initialize with standard Miranda ejes so we don't miss any empty ones
  const DEFAULT_EJES = ['ALTOS MIRANDINOS', 'VALLES DEL TUY', 'GUARENAS GUATIRE', 'GUARENAS-GUATIRE', 'BARLOVENTO', 'METROPOLITANO'];
  DEFAULT_EJES.forEach(eje => {
    ejeGroups[eje] = { asics: [], centres: [] };
  });

  // Distribute reports and asic summaries
  reportes.forEach(r => {
    const ejeKey = (r.eje_geografico || "Sin Eje").toUpperCase().trim();
    if (!ejeGroups[ejeKey]) {
      ejeGroups[ejeKey] = { asics: [], centres: [] };
    }
    ejeGroups[ejeKey].centres.push(r);
  });

  asicSummaries.forEach(asic => {
    const ejeKey = (asic.eje_geografico || "Sin Eje").toUpperCase().trim();
    if (!ejeGroups[ejeKey]) {
      ejeGroups[ejeKey] = { asics: [], centres: [] };
    }
    ejeGroups[ejeKey].asics.push(asic);
  });

  const ejeSummaries: EjeSummary[] = Object.entries(ejeGroups).map(([ejeName, data]) => {
    // Calculo de porcentaje por eje: Promedio de los porcentajes de sus ASICs
    const asicsInEje = data.asics;
    let porcentaje_eje = 0;
    if (asicsInEje.length > 0) {
      const sumPorcentajes = asicsInEje.reduce((sum, item) => sum + item.porcentaje, 0);
      porcentaje_eje = sumPorcentajes / asicsInEje.length;
    }

    const total_centros = asicsInEje.reduce((sum, item) => sum + item.total_centros, 0) || data.centres.length;
    const centros_reportaron = asicsInEje.reduce((sum, item) => sum + item.centros_reportaron, 0) || data.centres.filter(c => c.estado_semaforo === 'Verde').length;

    const verdes = data.centres.filter(c => c.estado_semaforo === 'Verde').length;
    const amarillos = data.centres.filter(c => c.estado_semaforo === 'Amarillo').length;
    const rojos = data.centres.filter(c => c.estado_semaforo === 'Rojo').length;

    return {
      eje_geografico: ejeName,
      asics: asicsInEje,
      porcentaje_eje: parseFloat(porcentaje_eje.toFixed(1)),
      total_centros,
      centros_reportaron,
      verdes,
      amarillos,
      rojos
    };
  });

  // 3. Overall compliance calculations
  const total_centros = asicSummaries.reduce((sum, item) => sum + item.total_centros, 0) || reportes.length;
  const centros_reportaron = asicSummaries.reduce((sum, item) => sum + item.centros_reportaron, 0) || reportes.filter(c => c.estado_semaforo === 'Verde').length;
  const total_asics = asicSummaries.length;
  
  // Overall General compliance indicator: Average of all non-empty Eje percentages
  const activeEjes = ejeSummaries.filter(e => e.asics.length > 0);
  const cumplimiento_general = activeEjes.length > 0
    ? parseFloat((activeEjes.reduce((sum, e) => sum + e.porcentaje_eje, 0) / activeEjes.length).toFixed(1))
    : 0;

  // Ejes al dia: an Eje is "al dia" (compliant) if its averaged porcentaje_eje is >= 80% (or let's say all of its ASICs are green/greenish, or simply percentage >= 75%)
  // Let's count Ejes with compliance percentage >= 75% as 'al dia'
  const ejes_al_dia = ejeSummaries.filter(e => e.asics.length > 0 && e.porcentaje_eje >= 75).length;
  const total_ejes = ejeSummaries.filter(e => e.asics.length > 0).length || DEFAULT_EJES.length;

  const stats: DashboardStats = {
    cumplimiento_general,
    total_centros,
    centros_reportaron,
    total_asics,
    ejes_al_dia,
    total_ejes
  };

  return {
    asics: asicSummaries,
    ejes: ejeSummaries,
    stats
  };
}

/**
 * Dispatches google sheets apps script and returns completion state
 */
export async function triggerGoogleSheetsSync(): Promise<boolean> {
  try {
    const customScriptUrl = typeof window !== 'undefined' ? localStorage.getItem('miranda_apps_script_url') : null;
    const scriptUrl = customScriptUrl || 'https://script.google.com/macros/s/AKfycbzsG72xt9ttRtFB-BzvVkKuVK5WyqVFI6a8S_DzFuGub1EYrDBmaPGex2kp7GQk_d8fgw/exec';

    const response = await fetch('/api/run-script', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'sincronizar',
        scriptUrl: scriptUrl
      })
    });

    if (!response.ok) {
      throw new Error(`Proxy sync returned HTTP ${response.status}`);
    }

    const result = await response.json();
    return result.status === 'success';
  } catch (error) {
    console.error('Trigger sync failure:', error);
    return false;
  }
}
