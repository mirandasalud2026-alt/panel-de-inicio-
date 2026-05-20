import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Users, 
  MapPin, 
  Calendar as CalendarIcon, 
  Filter, 
  ChevronDown, 
  ArrowUpRight, 
  Clock,
  Activity,
  FileText,
  RefreshCw,
  Baby,
  Smile,
  Heart,
  Home,
  Check,
  X,
  ExternalLink,
  Table,
  Info
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { googleSignIn, initAuth, logout } from '../../lib/firebaseAuth';
import { googleWorkspaceService } from '../../services/googleWorkspaceService';
import MinimalistDashboard from './MinimalistDashboard';

// Medical Report Interface matching the spreadsheet columns exactly
interface MedicalReport {
  timestamp: Date;
  timestampString: string;
  eje: string;
  pacientesFemeninos: number;
  pacientesMasculinos: number;
  consultasPediatria: number;
  adultosAtendidos: number;
  adultoMayor: number;
  emergenciaPediatria: number;
  emergenciaAdulto: number;
  vacunasColocadas: number;
  nuevosHipertensos: number;
  nuevosDiabeticos: number;
  infeccionRespiratoria: number;
  pacientesDengue: number;
  gestantesCaptadas: number;
  partosEutocicos: number;
  cesarea: number;
  muerteMaterna: number;
  partosDistocicos: number;
  medicinaGeneral: number;
  odontologia: number;
  consultaGinecologia: number;
  oftalmologia: number;
  psicologia: number;
  comunidadesVisitadas: number;
  casasVisitadas: number;
  centrosEducativos: number;
  sesionesEducativas: number;
}

// Normalized matching helper to make spelling/accents robust
function findColumnIndex(headers: string[], possibleNames: string[]): number {
  const normPossible = possibleNames.map(n => n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
  for (let i = 0; i < headers.length; i++) {
    const normHeader = headers[i].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const p of normPossible) {
      if (normHeader.includes(p) || p.includes(normHeader)) {
        return i;
      }
    }
  }
  return -1;
}

function parseTimestamp(cellValue: string): Date {
  if (!cellValue) return new Date();
  
  const clean = cellValue.trim();
  
  if (clean.includes('-')) {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) return d;
  }
  
  if (clean.includes('/')) {
    const parts = clean.split(' ');
    const datePart = parts[0];
    const dateSegments = datePart.split('/');
    if (dateSegments.length === 3) {
      const segment0 = parseInt(dateSegments[0], 10);
      const segment1 = parseInt(dateSegments[1], 10);
      const segment2 = parseInt(dateSegments[2], 10);
      
      let day = segment0;
      let month = segment1 - 1; 
      let year = segment2;
      
      if (segment1 > 12) {
        day = segment1;
        month = segment0 - 1;
      }
      
      if (year < 100) {
        year += 2000;
      }
      
      const timePart = parts[1] || '00:00:00';
      const timeSegments = timePart.split(':');
      const hours = parseInt(timeSegments[0] || '0', 10);
      const minutes = parseInt(timeSegments[1] || '0', 10);
      const seconds = parseInt(timeSegments[2] || '0', 10);
      
      const d = new Date(year, month, day, hours, minutes, seconds);
      if (!isNaN(d.getTime())) return d;
    }
  }
  
  const d = new Date(clean);
  return isNaN(d.getTime()) ? new Date() : d;
}

// Seed-based stable random reports generator for off-line/default high-fidelity values
function createStableMockData(): MedicalReport[] {
  const data: MedicalReport[] = [];
  const ejes = ["Altos Mirandinos", "Valles del Tuy", "Metropolitana", "Guarenas-Guatire", "Barlovento"];
  
  let seed = 98765;
  const rnd = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  
  // Generate daily records from May 01, 2026 to May 19, 2026
  for (let day = 1; day <= 19; day++) {
    const dateStr = `2026-05-${day.toString().padStart(2, '0')}`;
    const formattedTimestamp = `${day}/5/2026 12:00:00`;
    
    // Most axes report daily with minor variations
    const reportingAxes = [...ejes];
    for (const eje of reportingAxes) {
      const isWeekend = (day % 7 === 2 || day % 7 === 3); // simulated weekends
      const activityScale = isWeekend ? 0.3 : 1.0;
      
      let multiplier = 1.0;
      if (eje === "Metropolitana") multiplier = 1.5;
      else if (eje === "Valles del Tuy") multiplier = 1.3;
      else if (eje === "Altos Mirandinos") multiplier = 1.1;
      else if (eje === "Guarenas-Guatire") multiplier = 0.9;
      else if (eje === "Barlovento") multiplier = 0.7;
      
      multiplier *= activityScale;
      
      // Total pacientes
      const f_pat = Math.floor((100 + rnd() * 180) * multiplier);
      const m_pat = Math.floor((80 + rnd() * 140) * multiplier);
      
      // Consultas
      const ped_con = Math.floor((25 + rnd() * 65) * multiplier);
      const ad_con = Math.floor((60 + rnd() * 120) * multiplier);
      const ger_con = Math.floor((15 + rnd() * 45) * multiplier);
      
      // Emergencias
      const em_ped = Math.floor((8 + rnd() * 24) * multiplier);
      const em_ad = Math.floor((14 + rnd() * 32) * multiplier);
      
      const vacs = Math.floor((30 + rnd() * 90) * multiplier);
      
      // Morbidity
      const cr_ht = Math.floor((12 + rnd() * 26) * multiplier);
      const cr_db = Math.floor((6 + rnd() * 19) * multiplier);
      const inf_resp = Math.floor((25 + rnd() * 70) * multiplier);
      const deng = Math.floor((1 + rnd() * 10) * multiplier);
      
      // Materno-Infantil
      const gest = Math.floor((4 + rnd() * 16) * multiplier);
      const part_eut = Math.floor((6 + rnd() * 22) * multiplier);
      const cesar = Math.floor((3 + rnd() * 14) * multiplier);
      const part_dist = Math.floor((0 + rnd() * 6) * multiplier);
      const m_mat = (rnd() > 0.98 && eje === "Barlovento" && day === 12) ? 1 : 0; // single maternal death in Barlovento
      
      // Medical Service specialties
      const med_gen = Math.floor((50 + rnd() * 110) * multiplier);
      const odont = Math.floor((15 + rnd() * 30) * multiplier);
      const ginec = Math.floor((20 + rnd() * 40) * multiplier);
      const oftal = Math.floor((8 + rnd() * 20) * multiplier);
      const psic = Math.floor((5 + rnd() * 18) * multiplier);
      
      // Communities
      const com_vis = Math.floor((8 + rnd() * 16) * multiplier);
      const cas_vis = Math.floor((90 + rnd() * 280) * multiplier);
      const ed_vis = Math.floor((2 + rnd() * 9) * multiplier);
      const ses_ed = Math.floor((4 + rnd() * 12) * multiplier);
      
      data.push({
        timestamp: new Date(`${dateStr}T12:00:00Z`),
        timestampString: formattedTimestamp,
        eje,
        pacientesFemeninos: f_pat,
        pacientesMasculinos: m_pat,
        consultasPediatria: ped_con,
        adultosAtendidos: ad_con,
        adultoMayor: ger_con,
        emergenciaPediatria: em_ped,
        emergenciaAdulto: em_ad,
        vacunasColocadas: vacs,
        nuevosHipertensos: cr_ht,
        nuevosDiabeticos: cr_db,
        infeccionRespiratoria: inf_resp,
        pacientesDengue: deng,
        gestantesCaptadas: gest,
        partosEutocicos: part_eut,
        cesarea: cesar,
        muerteMaterna: m_mat,
        partosDistocicos: part_dist,
        medicinaGeneral: med_gen,
        odontologia: odont,
        consultaGinecologia: ginec,
        oftalmologia: oftal,
        psicologia: psic,
        comunidadesVisitadas: com_vis,
        casasVisitadas: cas_vis,
        centrosEducativos: ed_vis,
        sesionesEducativas: ses_ed
      });
    }
  }
  
  return data;
}

export default function DirectorDashboard() {
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isLoaderActive, setIsLoaderActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchedSuccessfully, setFetchedSuccessfully] = useState(false);
  const [isMinimalistMode, setIsMinimalistMode] = useState(true); // Default to clean minimalist 2026 mode!
  
  // Base raw records state
  const [rawRecords, setRawRecords] = useState<MedicalReport[]>([]);
  
  // Mounted status to prevent Recharts rendering collisions
  const [isMounted, setIsMounted] = useState(false);

  // General Filters Configuration
  const [dateFilterPreset, setDateFilterPreset] = useState<string>('semana_pasada');
  const [selectedEjesList, setSelectedEjesList] = useState<string[]>(['Todos']);

  const SPREADSHEET_ID = '1iu3UpCktHPDhUJOVWhwL0-zCZ523aJelWIPgHaLE-20';
  const SHEET_NAME = 'Compilado';
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit?usp=sharing`;

  // Initialize and load default reports on mount
  useEffect(() => {
    setIsMounted(true);
    // Primary pre-loading of high-fidelity simulated database rows matching Compilado sheet specs
    const mockDb = createStableMockData();
    setRawRecords(mockDb);

    // Dynamic Google OAuth Listener
    const unsubscribe = initAuth(
      (u, token) => {
        setGoogleUser(u);
        setGoogleToken(token);
        // Automatically attempt to fetch the actual spreadsheet data if we have an active auth session
        loadRealSpreadsheetData(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const loadRealSpreadsheetData = async (token: string) => {
    setIsLoaderActive(true);
    setErrorMessage(null);
    try {
      // Pull columns A to ZZ up to 800 rows for proper historical depth
      const res = await googleWorkspaceService.getSheetData(token, SPREADSHEET_ID, `${SHEET_NAME}!A1:ZZ800`);
      if (res && res.values && res.values.length > 1) {
        const parsed = parseImportedSheetData(res.values);
        if (parsed.length > 0) {
          setRawRecords(parsed);
          setFetchedSuccessfully(true);
        } else {
          throw new Error('La estructura de cabeceras de la hoja no devolvió registros compatibles.');
        }
      } else {
        throw new Error('No se encontraron filas con datos en la pestaña "Compilado".');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`No se pudo sincronizar en vivo: ${err.message}. Retornando a datos simulados.`);
      // Restore default mock database
      setRawRecords(createStableMockData());
      setFetchedSuccessfully(false);
    } finally {
      setIsLoaderActive(false);
    }
  };

  const triggerGoogleLogin = async () => {
    setErrorMessage(null);
    setIsLoaderActive(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
        await loadRealSpreadsheetData(result.accessToken);
      }
    } catch (err: any) {
      setErrorMessage(`Autenticación declinada o fallida: ${err.message}`);
      setIsLoaderActive(false);
    }
  };

  const triggerDisconnect = async () => {
    await logout();
    setGoogleUser(null);
    setGoogleToken(null);
    setFetchedSuccessfully(false);
    setRawRecords(createStableMockData());
  };

  function parseImportedSheetData(values: string[][]): MedicalReport[] {
    if (!values || values.length < 2) return [];
    
    const headers = values[0];
    const reports: MedicalReport[] = [];
    
    // Find precise indexes with flexible normalization helper
    const colTimestamp = findColumnIndex(headers, ["Marca temporal", "timestamp", "fecha"]);
    const colEje = findColumnIndex(headers, ["Eje", "territorio", "subregion"]);
    
    const colFem = findColumnIndex(headers, ["TOTAL DE PACIENTES FEMENINOS", "femenino", "femeninas"]);
    const colMasc = findColumnIndex(headers, ["TOTAL DE PACIENTES MASCULINOS", "masculino", "masculinos"]);
    
    const colPedCon = findColumnIndex(headers, ["CONSULTAS EN PEDIATRÍA", "consulta pediatria", "consultas pediatria"]);
    const colAdCon = findColumnIndex(headers, ["ADULTOS ATENDIDOS", "adultos atendidos", "consulta consulta de adultos"]);
    const colGerCon = findColumnIndex(headers, ["ADULTO MAYOR (CONSULTA DE GERIATRIA)", "geriatria", "adulto mayor"]);
    
    const colPedEm = findColumnIndex(headers, ["EMERGENCIA PEDIÁTRICAS", "emergencia pediatrica", "emergencias pediatricas"]);
    const colAdEm = findColumnIndex(headers, ["EMERGENCIAS ADULTO", "emergencia adulto", "emergencias adultos"]);
    
    const colVac = findColumnIndex(headers, ["VACUNAS COLOCADAS", "vacuna", "vacunacion"]);
    
    const colHt = findColumnIndex(headers, ["Nª NUEVOS HIPERTENSOS (AS)", "Nº NUEVOS HIPERTENSOS (AS)", "hipertenso", "hipertensos"]);
    const colDb = findColumnIndex(headers, ["Nª NUEVOS DIABETICOS (AS)", "Nº NUEVOS DIABETICOS (AS)", "diabetico", "diabeticos"]);
    const colIra = findColumnIndex(headers, ["PACIENTES CON INFECCIÓN RESPIRATORIA AGUDA", "infeccion respiratoria", "ira"]);
    const colDeng = findColumnIndex(headers, ["PACIENTES CON DENGUE", "dengue"]);
    
    const colGest = findColumnIndex(headers, ["GESTANTES CAPTADAS", "gestantes", "embarazadas"]);
    const colPartEut = findColumnIndex(headers, ["PARTOS EUTÓCICO", "eutocico", "eutocicos"]);
    const colCesar = findColumnIndex(headers, ["CESÁREA", "cesareas", "cesarea"]);
    const colPartDist = findColumnIndex(headers, ["PARTOS DISTÓCICO", "distocico", "distocicos"]);
    const colMuerMat = findColumnIndex(headers, ["MUERTE MATERNA", "muerte materna"]);
    
    const colMedGen = findColumnIndex(headers, ["MEDICINA GENERAL", "medicina general"]);
    const colOdont = findColumnIndex(headers, ["ODONTOLOGÍA", "odontologia"]);
    const colGinec = findColumnIndex(headers, ["CONSULTA GINECOLOGÍA", "consulta ginecologia", "ginecologia"]);
    const colOftal = findColumnIndex(headers, ["OFTALMOLOGÍA", "oftalmologia"]);
    const colPsic = findColumnIndex(headers, ["PSICOLOGÍA", "psicologia"]);
    
    const colComVis = findColumnIndex(headers, ["COMUNIDADES VISITADAS", "comunidades visitadas"]);
    const colCasVis = findColumnIndex(headers, ["TOTAL DE CASAS VISITADAS", "casas visitadas", "viviendas visitadas"]);
    const colEdVis = findColumnIndex(headers, ["CENTROS EDUCATIVOS VISITADOS", "centros educativos"]);
    const colSesEd = findColumnIndex(headers, ["SESIONES EDUCATIVAS", "sesiones educativas"]);

    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      if (!row || row.length === 0) continue;
      
      // Filter out raw rows which are completely blank spaces
      if (row.filter(cell => cell && cell.trim() !== "").length === 0) continue;
      
      const timestampStr = colTimestamp !== -1 ? row[colTimestamp] : "";
      const ejeVal = colEje !== -1 ? row[colEje] : "Desconocido";
      
      // Clean and normalize Eje names
      let parsedEje = "Otros";
      const lowEje = ejeVal?.toLowerCase() || "";
      if (lowEje.includes("alto")) parsedEje = "Altos Mirandinos";
      else if (lowEje.includes("tuy")) parsedEje = "Valles del Tuy";
      else if (lowEje.includes("metro")) parsedEje = "Metropolitana";
      else if (lowEje.includes("guarenas") || lowEje.includes("guatire")) parsedEje = "Guarenas-Guatire";
      else if (lowEje.includes("barlovento")) parsedEje = "Barlovento";
      else if (ejeVal && ejeVal.trim() !== "") parsedEje = ejeVal.trim();

      const parseNum = (idx: number) => {
        if (idx === -1 || idx >= row.length) return 0;
        const val = row[idx];
        if (!val) return 0;
        const num = parseFloat(val.replace(/[^\d.-]/g, ""));
        return isNaN(num) ? 0 : num;
      };
      
      reports.push({
        timestamp: parseTimestamp(timestampStr),
        timestampString: timestampStr,
        eje: parsedEje,
        pacientesFemeninos: parseNum(colFem),
        pacientesMasculinos: parseNum(colMasc),
        consultasPediatria: parseNum(colPedCon),
        adultosAtendidos: parseNum(colAdCon),
        adultoMayor: parseNum(colGerCon),
        emergenciaPediatria: parseNum(colPedEm),
        emergenciaAdulto: parseNum(colAdEm),
        vacunasColocadas: parseNum(colVac),
        nuevosHipertensos: parseNum(colHt),
        nuevosDiabeticos: parseNum(colDb),
        infeccionRespiratoria: parseNum(colIra),
        pacientesDengue: parseNum(colDeng),
        gestantesCaptadas: parseNum(colGest),
        partosEutocicos: parseNum(colPartEut),
        cesarea: parseNum(colCesar),
        muerteMaterna: parseNum(colMuerMat),
        partosDistocicos: parseNum(colPartDist),
        medicinaGeneral: parseNum(colMedGen),
        odontologia: parseNum(colOdont),
        consultaGinecologia: parseNum(colGinec),
        oftalmologia: parseNum(colOftal),
        psicologia: parseNum(colPsic),
        comunidadesVisitadas: parseNum(colComVis),
        casasVisitadas: parseNum(colCasVis),
        centrosEducativos: parseNum(colEdVis),
        sesionesEducativas: parseNum(colSesEd)
      });
    }
    
    return reports;
  }

  // Harvest all unique ejes present in active records for dynamic multi-selection options
  const availableEjesList = useMemo(() => {
    const list = new Set<string>();
    rawRecords.forEach(r => {
      if (r.eje && r.eje !== "Desconocido" && r.eje !== "Otros") {
        list.add(r.eje);
      }
    });
    return Array.from(list).sort();
  }, [rawRecords]);

  // Handle multi-ejes toggle
  const toggleEjeFilter = (ejeName: string) => {
    setSelectedEjesList(prev => {
      if (ejeName === 'Todos') {
        return ['Todos'];
      }
      
      // If we currently select 'Todos', remove it and add this Eje
      const cleaned = prev.filter(e => e !== 'Todos');
      
      if (cleaned.includes(ejeName)) {
        const next = cleaned.filter(e => e !== ejeName);
        return next.length === 0 ? ['Todos'] : next;
      } else {
        return [...cleaned, ejeName];
      }
    });
  };

  // Check if Eje selection is actively filtering this category
  const isEjeSelected = (ejeName: string) => {
    if (ejeName === 'Todos') {
      return selectedEjesList.includes('Todos') || selectedEjesList.length === 0;
    }
    return !selectedEjesList.includes('Todos') && selectedEjesList.includes(ejeName);
  };

  // Date constraints (reference is May 19, 2026)
  // "Semana pasada" (Default): May 11, 2026 to May 17, 2026
  // "Esta semana": May 18, 2026 to May 24, 2026
  // "Últimos 30 días": April 19, 2026 to May 19, 2026
  // "Todo el registro": All entries
  const filteredRecords = useMemo(() => {
    return rawRecords.filter(record => {
      // 1. Date Filter
      const recTime = record.timestamp.getTime();
      let dateMatch = true;
      
      if (dateFilterPreset === 'semana_pasada') {
        const start = new Date('2026-05-11T00:00:00Z').getTime();
        const end = new Date('2026-05-17T23:59:59Z').getTime();
        dateMatch = recTime >= start && recTime <= end;
      } else if (dateFilterPreset === 'esta_semana') {
        const start = new Date('2026-05-18T00:00:00Z').getTime();
        const end = new Date('2026-05-24T23:59:59Z').getTime();
        dateMatch = recTime >= start && recTime <= end;
      } else if (dateFilterPreset === 'ultimos_30') {
        const start = new Date('2026-04-19T00:00:00Z').getTime();
        const end = new Date('2026-05-19T23:59:59Z').getTime();
        dateMatch = recTime >= start && recTime <= end;
      }

      if (!dateMatch) return false;

      // 2. Eje Filter
      if (selectedEjesList.includes('Todos') || selectedEjesList.length === 0) {
        return true;
      }
      return selectedEjesList.includes(record.eje);
    });
  }, [rawRecords, dateFilterPreset, selectedEjesList]);

  // SECTION 1: Resumen General Semanal (KPI's) Calculations
  const kpis = useMemo(() => {
    let totalPacientesAtendidos = 0;
    let totalConsultas = 0;
    let totalEmergencias = 0;
    let totalVacunas = 0;

    filteredRecords.forEach(r => {
      totalPacientesAtendidos += (r.pacientesFemeninos + r.pacientesMasculinos);
      totalConsultas += (r.consultasPediatria + r.adultosAtendidos + r.adultoMayor);
      totalEmergencias += (r.emergenciaPediatria + r.emergenciaAdulto);
      totalVacunas += r.vacunasColocadas;
    });

    return {
      pacientes: totalPacientesAtendidos,
      consultas: totalConsultas,
      emergencias: totalEmergencias,
      vacunas: totalVacunas
    };
  }, [filteredRecords]);

  // Section 1 Chart Data: Atenciones por Eje
  const axedAtencionesData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach(r => {
      const sum = r.pacientesFemeninos + r.pacientesMasculinos;
      map[r.eje] = (map[r.eje] || 0) + sum;
    });

    return Object.keys(map).map(eje => ({
      name: eje,
      pacientes: map[eje]
    })).sort((a, b) => b.pacientes - a.pacientes);
  }, [filteredRecords]);

  // SECTION 2: Morbilidad y Enfermedades Calculations
  const morbidityKeyMetrics = useMemo(() => {
    let nuevosHipertensos = 0;
    let nuevosDiabeticos = 0;
    let infeccionRespiratoria = 0;
    let pacientesDengue = 0;

    filteredRecords.forEach(r => {
      nuevosHipertensos += r.nuevosHipertensos;
      nuevosDiabeticos += r.nuevosDiabeticos;
      infeccionRespiratoria += r.infeccionRespiratoria;
      pacientesDengue += r.pacientesDengue;
    });

    return {
      hipertensos: nuevosHipertensos,
      diabeticos: nuevosDiabeticos,
      ira: infeccionRespiratoria,
      dengue: pacientesDengue
    };
  }, [filteredRecords]);

  // Section 2 Chart: Nuevos Casos de Enfermedades Crónicas por Eje
  const chronicDiseasesByEje = useMemo(() => {
    const map: Record<string, { hipertension: number; diabetes: number }> = {};
    filteredRecords.forEach(r => {
      if (!map[r.eje]) {
        map[r.eje] = { hipertension: 0, diabetes: 0 };
      }
      map[r.eje].hipertension += r.nuevosHipertensos;
      map[r.eje].diabetes += r.nuevosDiabeticos;
    });

    return Object.keys(map).map(eje => ({
      name: eje,
      HTA: map[eje].hipertension,
      Diabetes: map[eje].diabetes
    }));
  }, [filteredRecords]);

  // SECTION 3: Salud Materno – Infantil Calculations
  const maternalKeyMetrics = useMemo(() => {
    let gestantes = 0;
    let partosEutocicos = 0;
    let cesaraes = 0;
    let muerteMaterna = 0;

    filteredRecords.forEach(r => {
      gestantes += r.gestantesCaptadas;
      partosEutocicos += r.partosEutocicos;
      cesaraes += r.cesarea;
      muerteMaterna += r.muerteMaterna;
    });

    return {
      gestantes,
      partosEutocicos,
      cesaraes,
      muerteMaterna
    };
  }, [filteredRecords]);

  // Section 3 Chart (Doughnut): Distribución de Partos
  const partosDistributionData = useMemo(() => {
    let eutocicos = 0;
    let distocicos = 0;
    let cesareas = 0;

    filteredRecords.forEach(r => {
      eutocicos += r.partosEutocicos;
      distocicos += r.partosDistocicos;
      cesareas += r.cesarea;
    });

    const total = eutocicos + distocicos + cesareas;

    return [
      { name: 'Partos Eutócicos', value: eutocicos, color: '#EC4899', pct: total > 0 ? ((eutocicos/total)*100).toFixed(1) : '0' },
      { name: 'Partos Distócicos', value: distocicos, color: '#F59E0B', pct: total > 0 ? ((distocicos/total)*100).toFixed(1) : '0' },
      { name: 'Cesáreas', value: cesareas, color: '#6366F1', pct: total > 0 ? ((cesareas/total)*100).toFixed(1) : '0' }
    ].filter(p => p.value > 0);
  }, [filteredRecords]);

  // SECTION 4: Productividad por Servicio Table & Chart Calculation
  const productivityData = useMemo(() => {
    let medGen = 0;
    let odontologia = 0;
    let ginecologia = 0;
    let oftalmologia = 0;
    let psicologia = 0;

    filteredRecords.forEach(r => {
      medGen += r.medicinaGeneral;
      odontologia += r.odontologia;
      ginecologia += r.consultaGinecologia;
      oftalmologia += r.oftalmologia;
      psicologia += r.psicologia;
    });

    return [
      { name: 'Medicina General', value: medGen, color: '#3B82F6' },
      { name: 'Odontología', value: odontologia, color: '#10B981' },
      { name: 'Ginecología', value: ginecologia, color: '#8B5CF6' },
      { name: 'Oftalmología', value: oftalmologia, color: '#06B6D4' },
      { name: 'Psicología', value: psicologia, color: '#F43F5E' }
    ];
  }, [filteredRecords]);

  // SECTION 5: Cobertura Comunitaria Graph
  const communityCoverageData = useMemo(() => {
    let comunidades = 0;
    let casas = 0;
    let escuelas = 0;
    let sesiones = 0;

    filteredRecords.forEach(r => {
      comunidades += r.comunidadesVisitadas;
      casas += r.casasVisitadas;
      escuelas += r.centrosEducativos;
      sesiones += r.sesionesEducativas;
    });

    return [
      { name: 'Comunidades Visitadas', total: comunidades },
      { name: 'Casas Visitadas', total: casas },
      { name: 'Colegios Visitados', total: escuelas },
      { name: 'Sesiones Educativas', total: sesiones }
    ];
  }, [filteredRecords]);

  // Interactive Chart Node Click Event Filter
  const handleChartCategoryClick = (data: any) => {
    if (data && data.activeLabel) {
      const clickedCategory = data.activeLabel;
      // Check if it matches an Eje name to restrict filters
      const allPossibleEjes = ["Altos Mirandinos", "Valles del Tuy", "Metropolitana", "Guarenas-Guatire", "Barlovento", ...availableEjesList];
      if (allPossibleEjes.includes(clickedCategory)) {
        toggleEjeFilter(clickedCategory);
      }
    } else if (data && data.name) {
      const allPossibleEjes = ["Altos Mirandinos", "Valles del Tuy", "Metropolitana", "Guarenas-Guatire", "Barlovento", ...availableEjesList];
      if (allPossibleEjes.includes(data.name)) {
        toggleEjeFilter(data.name);
      }
    }
  };

  if (isMinimalistMode) {
    return (
      <div className="space-y-2 bg-[#FFFFFF]">
        <div className="max-w-4xl mx-auto px-6 pt-6 flex justify-end">
          <button
            onClick={() => setIsMinimalistMode(false)}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 hover:scale-[1.02] transition-all flex items-center gap-1.5 shadow-sm"
          >
            📊 <span className="text-gray-300 font-bold">Cambiar a:</span> Analítica Tradicional
          </button>
        </div>
        <MinimalistDashboard />
      </div>
    );
  }

  return (
    <div id="executive-director-dashboard" className="space-y-12 animate-in fade-in duration-700">
      
      {/* INTEGRATION SOURCE BADGE */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2.5xl border border-blue-100 flex items-center justify-center">
            <FileText size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-black text-gray-800 uppercase tracking-tight">Fuente: Datos Respaldados (Compilado)</h4>
              <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                fetchedSuccessfully ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-100 text-gray-500'
              }`}>
                {fetchedSuccessfully ? 'Sincronizado Google Sheets ✔' : 'Modo Demostración'}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-semibold mt-1 max-w-xl leading-relaxed">
              Origen: Google Sheets • Documento Compilado Consolidador Regional • 
              <a 
                href={SHEET_URL} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-500 inline-flex items-center gap-1 ml-1 hover:underline font-extrabold"
              >
                Ver Hoja Original <ExternalLink size={10} />
              </a>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto self-stretch md:self-auto">
          <button
            onClick={() => setIsMinimalistMode(true)}
            className="px-4 py-3 bg-slate-50 border border-gray-200 hover:bg-slate-100 rounded-xl text-[10px] font-extrabold uppercase tracking-widest text-[#0B3D5C] flex items-center justify-center gap-2 transition-all"
          >
            ✨ Vista Minimalista 2026
          </button>
          {!googleToken ? (
            <button
              onClick={triggerGoogleLogin}
              className="w-full md:w-auto px-5 py-3 bg-[#0B3D5C] hover:bg-[#154E75] text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
              <RefreshCw size={13} className={isLoaderActive ? 'animate-spin' : ''} />
              Conectar Google Sheets
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-[9px] font-black uppercase text-gray-400 mr-2 line-clamp-1 hidden lg:block">
                Conectado como {googleUser?.email}
              </span>
              <button
                onClick={() => loadRealSpreadsheetData(googleToken)}
                disabled={isLoaderActive}
                className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-2 transition-all"
              >
                <RefreshCw size={12} className={isLoaderActive ? 'animate-spin' : ''} />
                Actualizar
              </button>
              <button
                onClick={triggerDisconnect}
                className="px-4 py-3 bg-gray-50 border border-gray-200 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all"
              >
                Desconectar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ERROR PANEL */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-150 rounded-2xl text-rose-700 text-xs font-bold leading-relaxed flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold">Alerta:</span> {errorMessage}
          </div>
          <button onClick={() => setErrorMessage(null)} className="p-1 hover:bg-rose-100 rounded-lg">
            <X size={14} />
          </button>
        </div>
      )}

      {/* STRATEGIC CONTROL FILTERS BANNER */}
      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-md border border-gray-100 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-[#0B3D5C]" />
            <h4 className="text-xs font-black text-[#0B3D5C] uppercase tracking-widest">
              Filtros Generales Consolidados
            </h4>
          </div>
          {(!selectedEjesList.includes('Todos') || dateFilterPreset !== 'semana_pasada') && (
            <button
              onClick={() => {
                setSelectedEjesList(['Todos']);
                setDateFilterPreset('semana_pasada');
              }}
              className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap"
            >
              <X size={12} /> Limpiar Filtros Especiales
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* DATE SELECTOR presets for "Marca temporal" */}
          <div className="col-span-12 md:col-span-4 space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
              Selector de Período (Marca temporal)
            </label>
            <div className="relative">
              <select
                value={dateFilterPreset}
                onChange={(e) => setDateFilterPreset(e.target.value)}
                className="w-full appearance-none bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-2xl px-5 py-3.5 pr-12 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B3D5C]/15 transition-all cursor-pointer"
              >
                <option value="semana_pasada">Semana Pasada (11 May - 17 May, 2026) ⭐</option>
                <option value="esta_semana">Esta Semana (18 May - 24 May, 2026)</option>
                <option value="ultimos_30">Últimos 30 días de registro</option>
                <option value="todos">Todo el registro histórico</option>
              </select>
              <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-[9px] text-gray-400 font-semibold italic">
              Configurado por defecto en "Semana pasada" según requerimiento.
            </p>
          </div>

          {/* EJES SELECTOR (uno, varios o 'Todos los ejes') with interactives checkboxes pills */}
          <div className="col-span-12 md:col-span-8 space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
              Selector de Ejes Territoriales
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedEjesList(['Todos'])}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  isEjeSelected('Todos')
                    ? 'bg-[#0B3D5C] text-white border-transparent shadow-md'
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-150'
                }`}
              >
                Todos los ejes {isEjeSelected('Todos') && '✓'}
              </button>

              {availableEjesList.map(eje => (
                <button
                  key={eje}
                  type="button"
                  onClick={() => toggleEjeFilter(eje)}
                  className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-1 ${
                    isEjeSelected(eje)
                      ? 'bg-blue-600 text-white border-transparent shadow-md'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-150'
                  }`}
                >
                  {eje} {isEjeSelected(eje) && '✓'}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-gray-400 font-semibold">
              Permite marcar múltiples subregiones simultáneamente para un análisis consolidado dinámico.
            </p>
          </div>
        </div>

        {/* ACTIVE GRID FILTER INDICATOR */}
        {!selectedEjesList.includes('Todos') && (
          <div className="bg-blue-50/70 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider px-4 py-2.5 rounded-xl border border-blue-100 flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="shrink-0" />
              Filtrado activo por subregión: {selectedEjesList.join(', ')}
            </span>
            <button
              onClick={() => setSelectedEjesList(['Todos'])}
              className="text-blue-500 underline hover:text-blue-600 uppercase font-black tracking-widest"
            >
              Restablecer
            </button>
          </div>
        )}
      </div>

      {/* SECTION 1: RESUMEN GENERAL SEMANAL (KPI'S) */}
      <section className="space-y-6">
        <div className="border-l-4 border-[#0B3D5C] pl-4">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block">Sección 1</span>
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Resumen General Semanal</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Pacientes" 
            label="Total Pacientes Atendidos"
            value={kpis.pacientes.toLocaleString()}
            subValue="Mujeres + Hombres"
            icon={Users} 
            color="bg-[#0B3D5C]" 
          />
          <StatCard 
            title="Consultas" 
            label="Total Consultas Médicas"
            value={kpis.consultas.toLocaleString()}
            subValue="Pediatría + Adultos + Adulto Mayor"
            icon={Activity} 
            color="bg-white" 
          />
          <StatCard 
            title="Emergencias" 
            label="Atención de Emergencias"
            value={kpis.emergencias.toLocaleString()}
            subValue="Pediátricas + Adulto"
            icon={Clock} 
            color="bg-white" 
          />
          <StatCard 
            title="Vacunación" 
            label="Total Vacunas Colocadas"
            value={kpis.vacunas.toLocaleString()}
            subValue="Inmunizaciones registradas"
            icon={Smile} 
            color="bg-white" 
          />
        </div>

        {/* PACIENTES BY EJE WORKLOAD CHART */}
        <div className="bg-white rounded-[3rem] p-6 lg:p-8 shadow-md border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h4 className="font-bold text-gray-800 text-base">Pacientes Atendidos por Eje</h4>
              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-black">
                Distribución absoluta territorial • Haga clic en una barra para filtrar
              </p>
            </div>
            {!selectedEjesList.includes('Todos') && (
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100">
                Filtrado Relativo Activo
              </span>
            )}
          </div>

          <div className="h-64 w-full">
            {isMounted && axedAtencionesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={axedAtencionesData} 
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                  onClick={handleChartCategoryClick}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 800, fill: '#6B7280' }} 
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 700, fill: '#9CA3AF' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(11,61,92,0.04)' }}
                    contentStyle={{ borderRadius: '15px', border: '1px solid #E5E7EB', fontSize: '11px', fontWeight: 'bold' }}
                    formatter={(value: any) => [`${value} Pacientes`, 'Atendidos']}
                  />
                  <Bar dataKey="pacientes" fill="#0B3D5C" radius={[8, 8, 0, 0]} maxBarSize={50}>
                    {axedAtencionesData.map((entry, index) => {
                      const isActive = selectedEjesList.includes(entry.name);
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={selectedEjesList.includes('Todos') || isActive ? '#0B3D5C' : '#0B3D5C30'} 
                          className="cursor-pointer transition-all hover:opacity-90"
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <NoDataPlaceholder />
            )}
          </div>
        </div>
      </section>

      {/* SECTION 2: MORBILIDAD Y ENFERMEDADES */}
      <section className="space-y-6">
        <div className="border-l-4 border-amber-500 pl-4">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block">Sección 2</span>
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Morbilidad y Enfermedades</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Hipertensores" 
            label="Nuevos Hipertensos(as)"
            value={morbidityKeyMetrics.hipertensos.toLocaleString()}
            subValue="Registros del período"
            icon={Heart} 
            themeColor="rose"
            color="bg-white" 
          />
          <StatCard 
            title="Diabéticos" 
            label="Nuevos Diabéticos(as)"
            value={morbidityKeyMetrics.diabeticos.toLocaleString()}
            subValue="Estadística de captados"
            icon={Activity} 
            themeColor="amber"
            color="bg-white" 
          />
          <StatCard 
            title="Respiratorios" 
            label="Pacientes IRA"
            value={morbidityKeyMetrics.ira.toLocaleString()}
            subValue="Infección Respiratoria Aguda"
            icon={Users} 
            themeColor="emerald"
            color="bg-white" 
          />
          <StatCard 
            title="Vectores" 
            label="Casos de Dengue"
            value={morbidityKeyMetrics.dengue.toLocaleString()}
            subValue="Monitoreo epidemiológico"
            icon={MapPin} 
            themeColor="indigo"
            color="bg-white" 
          />
        </div>

        {/* CHRONIC DISEASES BAR CHAT (HTA vs Diabetes with Red and Yellow colors) */}
        <div className="bg-white rounded-[3rem] p-6 lg:p-8 shadow-md border border-gray-100">
          <div>
            <h4 className="font-bold text-gray-800 text-base">Nuevos Casos de Enfermedades Crónicas</h4>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-black">
              Comparativa de Hipertensión (Rojo) y Diabetes (Amarillo) por Territorialidad
            </p>
          </div>

          <div className="h-64 w-full mt-6">
            {isMounted && chronicDiseasesByEje.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chronicDiseasesByEje} 
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                  onClick={handleChartCategoryClick}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 800, fill: '#6B7280' }} 
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 700, fill: '#9CA3AF' }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '15px', border: '1px solid #E5E7EB', fontSize: '11px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="HTA" fill="#EF4444" radius={[6, 6, 0, 0]} name="HTA (Hipertensión)" maxBarSize={30} />
                  <Bar dataKey="Diabetes" fill="#F59E0B" radius={[6, 6, 0, 0]} name="Diabetes" maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <NoDataPlaceholder />
            )}
          </div>
        </div>
      </section>

      {/* SECTION 3: SALUD MATERNO – INFANTIL */}
      <section className="space-y-6">
        <div className="border-l-4 border-pink-500 pl-4">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block">Sección 3</span>
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Salud Materno – Infantil</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Embarazadas" 
            label="Gestantes Captadas"
            value={maternalKeyMetrics.gestantes.toLocaleString()}
            subValue="Control prenatal temprano"
            icon={Baby} 
            themeColor="pink"
            color="bg-white" 
          />
          <StatCard 
            title="Eutócicos" 
            label="Partos Eutócicos"
            value={maternalKeyMetrics.partosEutocicos.toLocaleString()}
            subValue="Partos naturales asistidos"
            icon={Smile} 
            themeColor="emerald"
            color="bg-white" 
          />
          <StatCard 
            title="Quirúrgicos" 
            label="Cesáreas"
            value={maternalKeyMetrics.cesaraes.toLocaleString()}
            subValue="Resolución quirúrgica"
            icon={Activity} 
            themeColor="indigo"
            color="bg-white" 
          />
          <StatCard 
            title="Morfología" 
            label="Muerte Materna"
            value={maternalKeyMetrics.muerteMaterna.toString()}
            subValue="Objetivo de Calidad: 0"
            icon={Heart} 
            themeColor="indigo"
            color={maternalKeyMetrics.muerteMaterna > 0 ? "bg-rose-50 border-rose-200 text-rose-900" : "bg-white"} 
          />
        </div>

        {/* DOUGHNUT PIE CHART FOR DELIVERY TYPES */}
        <div className="bg-white rounded-[3rem] p-6 lg:p-8 shadow-md border border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="col-span-12 md:col-span-6 space-y-4">
            <div>
              <h4 className="font-bold text-gray-800 text-base">Distribución de Partos</h4>
              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-black">
                Comparativo porcentual de resoluciones obstétricas
              </p>
            </div>

            <div className="space-y-4 pt-4">
              {partosDistributionData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-bold text-gray-600">{item.name}</span>
                  </div>
                  <div className="text-right flex items-baseline gap-2">
                    <span className="text-sm font-black text-[#0B3D5C]">{item.value.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-gray-400">({item.pct}%)</span>
                  </div>
                </div>
              ))}
              {partosDistributionData.length === 0 && (
                <p className="text-xs font-bold text-gray-400">Sin registros de partos en el rango activo.</p>
              )}
            </div>
          </div>

          <div className="col-span-12 md:col-span-6 h-56 flex justify-center items-center">
            {isMounted && partosDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={partosDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    className="outline-none"
                  >
                    {partosDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value} Partos`, 'Volumen']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <NoDataPlaceholder />
            )}
          </div>
        </div>
      </section>

      {/* SECTION 4: PRODUCTIVIDAD POR SERVICIO */}
      <section className="space-y-6">
        <div className="border-l-4 border-indigo-600 pl-4">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block">Sección 4</span>
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Productividad por Servicio</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* CONSULTING SPECIALTIES TABLE */}
          <div className="lg:col-span-6 bg-white rounded-[3rem] p-6 lg:p-8 shadow-md border border-gray-100 flex flex-col justify-between">
            <div className="mb-6">
              <h4 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <Table className="text-indigo-600 shrink-0" size={18} /> Resumen de Actividad
              </h4>
              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-black">
                Consultas consolidadas por especialidad médica
              </p>
            </div>

            <div className="overflow-x-auto my-auto py-2">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                    <th className="pb-3 px-2">Especialidad</th>
                    <th className="pb-3 px-2 text-right">Total de Consultas</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-bold text-gray-700">
                  {productivityData.map((row, i) => (
                    <tr key={i} className="border-t border-gray-50/70 hover:bg-gray-50/40 transition-colors">
                      <td className="py-4 px-2 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                        {row.name}
                      </td>
                      <td className="py-4 px-2 text-right font-black text-gray-900">
                        {row.value.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-150">
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider block">
                Total Acumulado de Consultas Específicas: {productivityData.reduce((acc, r) => acc + r.value, 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* CONSULTING BAR CHART */}
          <div className="lg:col-span-6 bg-white rounded-[3rem] p-6 lg:p-8 shadow-md border border-gray-100">
            <div>
              <h4 className="font-bold text-gray-800 text-base">Rendimiento Técnico de Especialidades</h4>
              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-black">
                Análisis comparativo de consultas brindadas
              </p>
            </div>

            <div className="h-64 w-full mt-6">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={productivityData} 
                    layout="vertical"
                    margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                    <XAxis 
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fontWeight: 700, fill: '#9CA3AF' }}
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fontWeight: 800, fill: '#6B7280' }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '15px', border: '1px solid #E5E7EB', fontSize: '11px', fontWeight: 'bold' }}
                      formatter={(value: any) => [`${value} Consultas`, 'Atendidas']}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={25}>
                      {productivityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoDataPlaceholder />
              )}
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 5: COBERTURA COMUNITARIA */}
      <section className="space-y-6">
        <div className="border-l-4 border-emerald-600 pl-4">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block">Sección 5</span>
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Cobertura Comunitaria</h3>
        </div>

        <div className="bg-white rounded-[3rem] p-6 lg:p-8 shadow-md border border-gray-100">
          <div className="mb-6">
            <h4 className="font-bold text-gray-800 text-base">Alcance de Actividades Comunitarias Preventivas</h4>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-black">
              Impacto y presencia territorial de abordajes (Visualizado en Verde Salud Miranda)
            </p>
          </div>

          <div className="h-72 w-full">
            {isMounted && communityCoverageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={communityCoverageData} 
                  margin={{ top: 15, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 800, fill: '#6B7280' }} 
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 700, fill: '#9CA3AF' }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '15px', border: '1px solid #E5E7EB', fontSize: '11px', fontWeight: 'bold' }}
                    formatter={(value: any) => [`${value} Abordajes`, 'Volumen']}
                  />
                  <Bar dataKey="total" fill="#10B981" radius={[8, 8, 0, 0]} maxBarSize={60}>
                    {communityCoverageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#10B981" className="hover:opacity-90 transition-all cursor-pointer" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <NoDataPlaceholder />
            )}
          </div>
        </div>
      </section>

      {/* FOOTER DIRECTED TEXT */}
      <footer className="pt-8 border-t border-gray-200/80 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">
          Datos actualizados semanalmente desde la hoja "Compilado".
        </p>
        <span className="text-[9px] font-bold text-gray-400 bg-gray-50 border border-gray-150 px-3.5 py-1.5 rounded-full flex items-center gap-2">
          <Info size={11} className="text-[#0B3D5C]" /> 
          Miranda Salud • Dirección Estadal de Salud
        </span>
      </footer>

    </div>
  );
}

// Stats Card Component for Dashboard KPIs
interface StatCardProps {
  title: string;
  label: string;
  value: string;
  subValue?: string;
  icon: any;
  trend?: string;
  color?: string;
  themeColor?: 'blue' | 'rose' | 'amber' | 'emerald' | 'indigo' | 'pink';
}

function StatCard({ 
  title, 
  label, 
  value, 
  subValue, 
  icon: Icon, 
  color = 'bg-white', 
  themeColor = 'blue' 
}: StatCardProps) {
  const isDark = color === 'bg-[#0B3D5C]';

  const iconClasses = useMemo(() => {
    if (isDark) return 'bg-white/10 text-white';
    switch (themeColor) {
      case 'rose': return 'bg-rose-50 text-rose-500 border border-rose-100';
      case 'amber': return 'bg-amber-50 text-amber-500 border border-amber-100';
      case 'emerald': return 'bg-emerald-50 text-emerald-500 border border-emerald-100';
      case 'indigo': return 'bg-indigo-50 text-indigo-500 border border-indigo-100';
      case 'pink': return 'bg-pink-50 text-pink-500 border border-pink-100';
      default: return 'bg-blue-50 text-blue-600 border border-blue-100';
    }
  }, [themeColor, isDark]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${
        isDark ? 'bg-[#0B3D5C] text-white shadow-xl shadow-[#0B3D5C]/15' : 'bg-white text-gray-900 border border-gray-100 shadow-sm'
      } p-6 rounded-[2.5rem] flex flex-col justify-between h-52 transition-all hover:scale-[1.01] hover:shadow-md`}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className={`${isDark ? 'text-white/60' : 'text-gray-400'} text-[10px] font-black uppercase tracking-[0.2em] block`}>
            {title}
          </span>
          <h4 className="text-xs font-bold leading-normal text-gray-500 opacity-90 max-w-[150px]">{label}</h4>
        </div>
        <div className={`p-3 rounded-2xl shrink-0 ${iconClasses}`}>
          <Icon size={18} />
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <h3 className="text-3xl font-black tracking-tighter text-[#0B3D5C] dark:text-white leading-none">
          {value}
        </h3>
        {subValue && (
          <p className={`${isDark ? 'text-white/45' : 'text-gray-400'} text-[9px] font-extrabold uppercase tracking-widest`}>
            {subValue}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function NoDataPlaceholder() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-center py-8">
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
        Sin datos disponibles
      </p>
      <p className="text-[10px] text-gray-400 font-semibold">
        Modifique sus filtros de período o de territorio
      </p>
    </div>
  );
}
