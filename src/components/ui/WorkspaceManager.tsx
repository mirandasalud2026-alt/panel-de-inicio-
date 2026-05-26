import React, { useState, useEffect, useRef } from 'react';
import { 
  FileCode, 
  ExternalLink, 
  RefreshCw, 
  Terminal, 
  Play, 
  Check, 
  Clock, 
  FileText, 
  Copy, 
  Database,
  ArrowRightLeft,
  Settings,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WorkspaceManagerProps {
  onRegisterTriggerHandler?: (handler: () => void) => void;
}

export const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({ onRegisterTriggerHandler }) => {
  const [webAppUrl, setWebAppUrl] = useState<string>(() => {
    return localStorage.getItem('miranda_apps_script_url') || 
      'https://script.google.com/macros/s/AKfycbzsG72xt9ttRtFB-BzvVkKuVK5WyqVFI6a8S_DzFuGub1EYrDBmaPGex2kp7GQk_d8fgw/exec';
  });

  const [savingUrl, setSavingUrl] = useState(false);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [appsScriptStatus, setAppsScriptStatus] = useState<any>(null);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    `[SISTEMA] Gestor de Sincronización v8.0.0 enlazado y listo.`,
    `[INFO] Conexión establecida con las hojas maestras de Miranda Salud.`
  ]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs]);

  useEffect(() => {
    // Intentar consultar el estado en segundo plano al montar
    consultarEstadoBackground();
  }, [webAppUrl]);

  // Exponer manejador externo si se solicita
  useEffect(() => {
    if (onRegisterTriggerHandler) {
      onRegisterTriggerHandler(() => {
        ejecutarAccionWeb('sincronizar', 'Sincronizar Todo (Apps Script)');
      });
    }
  }, [onRegisterTriggerHandler, webAppUrl]);

  const addLog = (text: string) => {
    const time = new Date().toLocaleTimeString('es-VE');
    setConsoleLogs(prev => [...prev, `[${time}] ${text}`]);
  };

  const clearLogs = () => {
    setConsoleLogs([`[SISTEMA] Consola limpia. Esperando nuevos procedimientos...`]);
  };

  const copyLogs = () => {
    const textToCopy = consoleLogs.join('\n');
    navigator.clipboard.writeText(textToCopy);
    addLog(`📋 Historial de registros copiado al portapapeles.`);
  };

  const guardarNuevaUrl = (url: string) => {
    localStorage.setItem('miranda_apps_script_url', url);
    setWebAppUrl(url);
    addLog(`⚙️ Dirección de Web App de Apps Script actualizada a: ${url.substring(0, 50)}...`);
    setSavingUrl(true);
    setTimeout(() => setSavingUrl(false), 800);
  };

  const consultarEstadoBackground = async () => {
    if (!webAppUrl || webAppUrl.trim() === '') return;
    try {
      const response = await fetch('/api/run-script', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: 'estado', scriptUrl: webAppUrl })
      });
      if (response.ok) {
        const result = await response.json();
        const actualData = result.data || result;
        if (actualData && actualData.status === 'ok') {
          setAppsScriptStatus(actualData);
        }
      }
    } catch (e) {}
  };

  const ejecutarAccionWeb = async (actionId: string, actionName: string) => {
    if (runningAction) return;
    setRunningAction(actionId);
    addLog(`⚡ Solicitando ejecución: "${actionName}" (action=${actionId})...`);
    addLog(`📡 Enviando túnel hacia Apps Script de Miranda Salud...`);

    try {
      const response = await fetch('/api/run-script', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionId,
          scriptUrl: webAppUrl
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const actualData = result.data || result;
      
      addLog(`🟢 Macro ejecutada con éxito por Apps Script.`);

      if (actualData && typeof actualData === 'object') {
        if (actualData.status === 'success') {
          addLog(`🎉 [Sincronización v8.0.0 Exitosa]`);
          addLog(`📈 Se procesaron y subieron ${actualData.data?.totalCentros || 0} centros únicos.`);
          addLog(`🏢 Se cargaron ${actualData.data?.totalASICs || 0} ASICs a Supabase.`);
          addLog(`💬 Mensaje de Apps Script: ${actualData.message || 'Completado'}`);
        } else {
          addLog(`[Apps Script] ${JSON.stringify(actualData, null, 2)}`);
        }
      } else {
        addLog(`[Apps Script] ${actualData}`);
      }

      // Volver a consultar estado para refrescar
      await consultarEstadoBackground();
    } catch (err: any) {
      console.error(err);
      addLog(`❌ Error del Web App en Apps Script: ${err.message}`);
      addLog(`⚠️ Asegúrese de haber desplegado su Apps Script como "Aplicación Web", configurado con acceso para "Cualquier persona" (Anyone), y copiado la URL correcta.`);
    } finally {
      setRunningAction(null);
    }
  };

  const APPS_SCRIPT_V8_CODE = `/**
 * MIRANDA SALUD - CON ELIMINACIÓN DE DUPLICADOS + TRIGGER HORARIO
 * Versión: 8.0.0
 */

const EJES_CONFIG = {
  ALTOS_MIRANDINOS: { id: '1amIenrqhZ5yGFnV_qSEklDUkBF-obLeC3U234KxZC18', name: 'ALTOS MIRANDINOS' },
  VALLES_DEL_TUY: { id: '1bFBoYIWGtplX37QypiyUerMIDl_g-MeBNnCKZifZvp0', name: 'VALLES DEL TUY' },
  GUARENAS_GUATIRE: { id: '1DV2rbO771sC5pcKUUf_kr9Ej4VtkF6Oo9uL8oJHSXGQ', name: 'GUARENAS-GUATIRE' },
  BARLOVENTO: { id: '1mwA2Z1ncghe4-w46BkEwbUC8Bdn_7uAWMaUND-3TB3w', name: 'BARLOVENTO' },
  METROPOLITANO: { id: '1n9eFrM_CvbrP_b7uxIEb2Qm42u6X9byrRugIed_ehO0', name: 'METROPOLITANO' }
};

// ⚠️ ACTUALIZA CON EL ID CORRECTO ⚠️
const DASHBOARD_ID = '1zw04RoFnPvxF3P147dRjbg01gfySKJGNn4QUVbcSfig';

const SUPABASE_URL = 'https://tzmhagwihumwiprsnyid.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6bWhhZ3dpaHVtd2lwcnNueWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjU2NDUsImV4cCI6MjA5NDU0MTY0NX0.ofDFZn5JpOrDktK4YSnUk-Qsd2V5Eil1Nl-xf84rr78';

const COL = { ASIC: 0, CENTRO: 1, STATUS: 2, PORCENTAJE: 13, ULTIMO_REPORTE: 14 };

// ============================================
// FUNCIÓN PRINCIPAL - SINCRONIZAR
// ============================================

function sincronizarTodo() {
  console.log('🚀 SINCRONIZANDO SEMAFORO...');
  console.log(\`⏰ \${new Date().toLocaleString()}\`);
  
  const todosLosCentros = [];
  const resumenPorASIC = {};
  
  // ==========================================
  // 1. LEER DATOS
  // ==========================================
  
  for (const [key, config] of Object.entries(EJES_CONFIG)) {
    try {
      console.log(\`\\n📊 \${config.name}\`);
      const spreadsheet = SpreadsheetApp.openById(config.id);
      const sheet = spreadsheet.getSheetByName('Semaforo');
      
      if (!sheet) {
        console.log(\`   ⚠️ No hay hoja Semaforo\`);
        continue;
      }
      
      const data = sheet.getDataRange().getValues();
      console.log(\`   📄 Filas: \${data.length - 1} centros\`);
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const nombreCentro = row[COL.CENTRO];
        if (!nombreCentro || nombreCentro.toString().trim() === '') continue;
        
        const asic = row[COL.ASIC] ? row[COL.ASIC].toString().trim() : config.name;
        let porcentaje = row[COL.PORCENTAJE];
        
        let porcentajeNum = 0;
        if (porcentaje && !isNaN(parseFloat(porcentaje))) {
          porcentajeNum = Math.round(parseFloat(porcentaje) * 100);
        } else if (porcentaje && typeof porcentaje === 'number') {
          porcentajeNum = Math.round(porcentaje);
        }
        
        let estado = 'Rojo';
        if (porcentajeNum >= 80) estado = 'Verde';
        else if (porcentajeNum >= 50) estado = 'Amarillo';
        
        let ultimoReporte = new Date();
        const fechaTexto = row[COL.ULTIMO_REPORTE];
        if (fechaTexto && fechaTexto !== '#N/A' && fechaTexto !== '') {
          try {
            if (typeof fechaTexto === 'string' && !isNaN(Date.parse(fechaTexto))) {
              ultimoReporte = new Date(fechaTexto);
            }
          } catch(e) {}
        }
        
        // ID único por centro + ASIC + eje
        const idUnico = \`\${config.name}_\${asic}_\${nombreCentro}\`.replace(/\\s/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
        
        const centro = {
          id_centro: idUnico,
          nombre_centro: nombreCentro.toString().trim(),
          asic: asic,
          eje_geografico: config.name,
          ultimo_reporte: ultimoReporte.toISOString(),
          estado_semaforo: estado,
          horas_retraso: porcentajeNum === 100 ? 0 : Math.round((100 - porcentajeNum) / 100 * 168),
          actualizado_en: new Date().toISOString()
        };
        
        // Evitar duplicados en la misma ejecución (por si hay filas repetidas)
        const existe = todosLosCentros.some(c => c.id_centro === idUnico);
        if (!existe) {
          todosLosCentros.push(centro);
        }
        
        if (!resumenPorASIC[asic]) {
          resumenPorASIC[asic] = { asic: asic, eje: config.name, total: 0, sumaPorcentajes: 0 };
        }
        resumenPorASIC[asic].total++;
        resumenPorASIC[asic].sumaPorcentajes += porcentajeNum;
      }
      
      console.log(\`   ✅ \${data.length - 1} centros leídos\`);
      
    } catch (error) {
      console.log(\`   ❌ Error: \${error.message}\`);
    }
  }
  
  console.log(\`\\n📊 TOTAL CENTROS ÚNICOS: \${todosLosCentros.length}\`);
  
  if (todosLosCentros.length === 0) {
    console.log('⚠️ No hay datos');
    return { status: 'warning', message: 'No hay datos' };
  }
  
  // ==========================================
  // 2. CALCULAR RESUMEN
  // ==========================================
  
  const resumenFinal = Object.values(resumenPorASIC).map(a => ({
    asic: a.asic,
    eje: a.eje,
    total_centros: a.total,
    porcentaje_reporte: Math.round(a.sumaPorcentajes / a.total),
    centros_reportaron: Math.round((a.sumaPorcentajes / a.total) * a.total / 100),
    actualizado_en: new Date().toISOString()
  }));
  
  console.log(\`📊 TOTAL ASICs: \${resumenFinal.length}\`);
  
  // ==========================================
  // 3. GUARDAR EN DASHBOARD (SIN DUPLICADOS)
  // ==========================================
  
  try {
    const dashboard = SpreadsheetApp.openById(DASHBOARD_ID);
    console.log(\`\\n📝 Guardando en Dashboard...\`);
    
    // Guardar transito_reportes (limpia toda la hoja primero)
    let sheet = dashboard.getSheetByName('transito_reportes');
    if (sheet) dashboard.deleteSheet(sheet);
    sheet = dashboard.insertSheet('transito_reportes');
    
    const headers = ['id_centro', 'nombre_centro', 'asic', 'eje_geografico', 'ultimo_reporte', 'estado_semaforo', 'horas_retraso', 'actualizado_en'];
    const datos = [headers];
    todosLosCentros.forEach(c => datos.push([c.id_centro, c.nombre_centro, c.asic, c.eje_geografico, c.ultimo_reporte, c.estado_semaforo, c.horas_retraso, c.actualizado_en]));
    sheet.getRange(1, 1, datos.length, headers.length).setValues(datos);
    console.log(\`   ✅ transito_reportes: \${todosLosCentros.length} registros (sin duplicados)\`);
    
    // Guardar resumen_asic
    sheet = dashboard.getSheetByName('resumen_asic');
    if (sheet) dashboard.deleteSheet(sheet);
    sheet = dashboard.insertSheet('resumen_asic');
    
    const headers2 = ['asic', 'eje', 'total_centros', 'centros_reportaron', 'porcentaje_reporte', 'actualizado_en'];
    const datos2 = [headers2];
    resumenFinal.forEach(r => datos2.push([r.asic, r.eje, r.total_centros, r.centros_reportaron, r.porcentaje_reporte, r.actualizado_en]));
    sheet.getRange(1, 1, datos2.length, headers2.length).setValues(datos2);
    console.log(\`   ✅ resumen_asic: \${resumenFinal.length} ASICs\`);
    
  } catch (error) {
    console.log(\`   ❌ Error Dashboard: \${error.message}\`);
  }
  
  // ==========================================
  // 4. ENVIAR A SUPABASE (CON UPSERT)
  // ==========================================
  
  console.log(\`\\n☁️ Enviando a Supabase (eliminando duplicados)...\`);
  
  // Limpiar tablas completamente antes de insertar
  try {
    UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/transito_reportes?select=id_centro', {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY },
      muteHttpExceptions: true
    });
    console.log(\`   🗑️ transito_reportes limpiada\`);
  } catch(e) {}
  
  try {
    UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/resumen_asic?select=asic', {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY },
      muteHttpExceptions: true
    });
    console.log(\`   🗑️ resumen_asic limpiada\`);
  } catch(e) {}
  
  // Insertar nuevos datos
  let insertadosCentros = 0;
  for (let i = 0; i < todosLosCentros.length; i++) {
    try {
      const res = UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/transito_reportes', {
        method: 'POST', contentType: 'application/json',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY },
        payload: JSON.stringify(todosLosCentros[i]),
        muteHttpExceptions: true
      });
      if (res.getResponseCode() === 201 || res.getResponseCode() === 200) insertadosCentros++;
    } catch(e) {}
  }
  console.log(\`   ✅ transito_reportes: \sind_centros_count/\${todosLosCentros.length} -> \${insertadosCentros}/\${todosLosCentros.length}\`);
  
  let insertadosResumen = 0;
  for (let i = 0; i < resumenFinal.length; i++) {
    try {
      const res = UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/resumen_asic', {
        method: 'POST', contentType: 'application/json',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY },
        payload: JSON.stringify(resumenFinal[i]),
        muteHttpExceptions: true
      });
      if (res.getResponseCode() === 201 || res.getResponseCode() === 200) insertadosResumen++;
    } catch(e) {}
  }
  console.log(\`   ✅ resumen_asic: \${insertadosResumen}/\${resumenFinal.length}\`);
  
  // ==========================================
  // 5. FINAL
  // ==========================================
  
  console.log(\`\\n🎉 SINCRONIZACIÓN COMPLETADA!\`);
  console.log(\`   ⏰ \${new Date().toLocaleString()}\`);
  console.log(\`   Centros únicos: \${todosLosCentros.length}\`);
  console.log(\`   ASICs procesados: \${resumenFinal.length}\`);
  
  return {
    status: 'success',
    timestamp: new Date().toISOString(),
    message: \`\${todosLosCentros.length} centros, \${resumenFinal.length} ASICs\`,
    data: { totalCentros: todosLosCentros.length, totalASICs: resumenFinal.length }
  };
}

// ============================================
// CONFIGURAR TRIGGER CADA HORA
// ============================================

function configurarTriggerHorario() {
  // Eliminar triggers existentes
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'sincronizarTodo') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  // Crear nuevo trigger cada hora
  ScriptApp.newTrigger('sincronizarTodo')
    .timeBased()
    .everyHours(1)
    .create();
  
  console.log('✅ Trigger cada hora configurado correctamente');
  console.log('   La función sincronizarTodo() se ejecutará automáticamente cada hora');
}

// ============================================
// ELIMINAR TRIGGER
// ============================================

function eliminarTriggerHorario() {
  const triggers = ScriptApp.getProjectTriggers();
  let eliminados = 0;
  
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'sincronizarTodo') {
      ScriptApp.deleteTrigger(triggers[i]);
      eliminados++;
    }
  }
  
  console.log(\`🗑️ \${eliminados} triggers eliminados\`);
}

// ============================================
// VER TRIGGERS ACTIVOS
// ============================================

function verTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  console.log(\`📋 Triggers activos (\${triggers.length}):\`);
  for (let i = 0; i < triggers.length; i++) {
    console.log(\`   - \${triggers[i].getHandlerFunction()} | Tipo: \${triggers[i].getEventType()}\`);
  }
}

// ============================================
// RESPUESTA WEB
// ============================================

function doGet(e) {
  const action = e?.parameter?.action || '';
  
  if (action === 'sincronizar') {
    const resultado = sincronizarTodo();
    return ContentService.createTextOutput(JSON.stringify(resultado)).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'estado') {
    const triggers = ScriptApp.getProjectTriggers();
    const triggerActivo = triggers.some(t => t.getHandlerFunction() === 'sincronizarTodo');
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ok',
      trigger_activo: triggerActivo,
      proxima_ejecucion: triggerActivo ? 'Cada hora' : 'No configurado',
      ultima_sincronizacion: PropertiesService.getScriptProperties().getProperty('ultima_sincronizacion') || 'Nunca'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ready',
    acciones: ['?action=sincronizar', '?action=estado'],
    configurar_trigger: 'Ejecuta la función configurarTriggerHorario() en Apps Script'
  })).setMimeType(ContentService.MimeType.JSON);
}`;

  const copiarCodigoAlPortapapeles = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_V8_CODE);
    setCopiedCode(true);
    addLog("📋 Código completo de Apps Script v8.0.0 copiado al portapapeles.");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <section className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-gray-100 mt-6 overflow-hidden">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
            Gestor de Sincronización Real v8.0.0
          </h3>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider mt-1 font-semibold">
            Orquestación y control del tránsito de reportes epidemiológicos hacia Supabase
          </p>
        </div>

        {/* ESTATUS DEL DISPARADOR */}
        <div className="flex items-center gap-2">
          {appsScriptStatus ? (
            <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
              appsScriptStatus.trigger_activo 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                : 'bg-amber-50 text-amber-700 border border-amber-100'
            }`}>
              <Clock size={11} className={appsScriptStatus.trigger_activo ? 'animate-pulse' : ''} />
              Trigger Horario: {appsScriptStatus.trigger_activo ? 'Activo (1h)' : 'Sin Configurar'}
            </div>
          ) : (
            <div className="px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <RefreshCw size={11} className="animate-spin" /> Escaneando estado...
            </div>
          )}
        </div>
      </div>

      {/* CONFIGURACIÓN DE URL DE DEPLOYMENT */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black text-[#0B3D5C] uppercase tracking-wider flex items-center gap-1.5">
            <Settings size={13} /> Dirección Web de Apps Script (Deployment)
          </label>
          <a
            href="https://script.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-black text-slate-500 hover:text-[#0B3D5C] uppercase tracking-wider flex items-center gap-1"
          >
            Abrir Apps Script Console <ExternalLink size={10} />
          </a>
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={webAppUrl}
            onChange={(e) => guardarNuevaUrl(e.target.value)}
            placeholder="Pegue la URL terminada en /exec"
            className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[11px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B3D5C]/15 font-mono"
          />
          {savingUrl && (
            <span className="px-3 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center shrink-0 border border-emerald-100 animate-pulse">
              Guardado
            </span>
          )}
        </div>
        <p className="text-[9px] text-gray-400 font-medium leading-relaxed uppercase tracking-wide">
          💡 La dirección web se guarda automáticamente en los metadatos de su navegador local (LocalStorage). Esto evita tener que volver a ingresar la URL de despliegue.
        </p>
      </div>

      {/* REORGANIZACIÓN TOTAL EN 2 COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PANEL IZQUIERDO DE ACCIONES Y CONSOLA */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
              Comandos y Funciones del Apps Script
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Botón sincronizarTodo() */}
              <button
                type="button"
                onClick={() => ejecutarAccionWeb('sincronizar', 'sincronizarTodo()')}
                disabled={runningAction !== null}
                className="p-4 rounded-xl border border-emerald-500/20 hover:border-emerald-500 bg-emerald-50/10 hover:bg-emerald-50/25 text-left transition-all relative overflow-hidden flex flex-col justify-between h-24 cursor-pointer"
              >
                <div className="flex justify-between items-start w-full">
                  <span className="p-1 bg-white text-emerald-600 rounded-lg shadow-sm border border-emerald-100 shrink-0">
                    <Play size={14} />
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                    Principal
                  </span>
                </div>
                <div>
                  <h5 className="text-[11px] font-black text-slate-850 uppercase tracking-tight">
                    sincronizarTodo()
                  </h5>
                  <p className="text-[9px] text-gray-400 leading-tight font-medium mt-0.5 max-w-xs">
                    Lee 5 hojas de ejes, calcula porcentajes y actualiza Supabase.
                  </p>
                </div>
                {runningAction === 'sincronizar' && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
                    <RefreshCw size={14} className="animate-spin text-emerald-600" />
                  </div>
                )}
              </button>

              {/* Botón verTriggers() / consultarEstado */}
              <button
                type="button"
                onClick={() => ejecutarAccionWeb('estado', 'verTriggers() / estado')}
                disabled={runningAction !== null}
                className="p-4 rounded-xl border border-blue-500/20 hover:border-blue-500 bg-blue-50/10 hover:bg-blue-50/25 text-left transition-all relative overflow-hidden flex flex-col justify-between h-24 cursor-pointer"
              >
                <div className="flex justify-between items-start w-full">
                  <span className="p-1 bg-white text-blue-600 rounded-lg shadow-sm border border-blue-100 shrink-0">
                    <RefreshCw size={14} />
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                    Estado
                  </span>
                </div>
                <div>
                  <h5 className="text-[11px] font-black text-slate-850 uppercase tracking-tight">
                    verTriggers()
                  </h5>
                  <p className="text-[9px] text-gray-400 leading-tight font-medium mt-0.5 max-w-xs">
                    Consulta el estado de ejecución automática del cron en Apps Script.
                  </p>
                </div>
                {runningAction === 'estado' && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
                    <RefreshCw size={14} className="animate-spin text-blue-600" />
                  </div>
                )}
              </button>

            </div>

            {/* TABLA DE AYUDA DE OTROS METODOS CRON */}
            <div className="mt-4 p-3 bg-amber-50/40 rounded-xl border border-amber-100/50 space-y-2">
              <span className="block text-[9px] font-black text-amber-850 uppercase tracking-wider">
                ⏰ Automatizaciones Horarias en Google Apps Script
              </span>
              <p className="text-[9px] text-gray-500 font-semibold leading-relaxed">
                Para automatizar que los datos se actualicen sin que tengas que presionar un botón, debes configurar el cron ejecutando <span className="font-bold text-amber-850">configurarTriggerHorario()</span> directamente en el panel de Apps Script. O correr <span className="font-bold text-amber-850">eliminarTriggerHorario()</span> para detenerlo. Esto peinará de forma autónoma los 5 libros sanitarios cada hora.
              </p>
            </div>
          </div>

          {/* TERMINAL LOG RETRO */}
          <div className="bg-[#0b0f19] border border-[#1e293b] rounded-2xl p-5 shadow-inner">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest font-bold flex items-center gap-1">
                  <Terminal size={11} /> Consola de Sincronización
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={copyLogs}
                  className="p-1 px-3 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black text-gray-300 hover:bg-white/10 transition-colors uppercase tracking-widest flex items-center gap-1"
                >
                  <Copy size={9} /> Copiar
                </button>
                <button 
                  onClick={clearLogs}
                  className="p-1 px-3 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black text-gray-300 hover:bg-white/10 transition-colors uppercase tracking-widest"
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div className="max-h-40 overflow-y-auto font-mono text-[10px] text-emerald-400 leading-relaxed p-1 custom-scrollbar space-y-1">
              {consoleLogs.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap truncate">
                  {log}
                </div>
              ))}
              <div ref={consoleEndRef} />
            </div>
          </div>

        </div>

        {/* PANEL DERECHO DE COPIAR CÓDIGO */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-slate-900 border border-slate-950 rounded-2xl overflow-hidden flex flex-col flex-1 h-[320px] lg:h-auto">
            
            {/* CABECERA CÓDIGO */}
            <div className="p-3 bg-slate-950 border-b border-slate-850 flex items-center justify-between">
              <span className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <FileCode size={11} className="text-blue-400" /> Código Apps Script v8.0.0 (Completo)
              </span>
              <button
                type="button"
                onClick={copiarCodigoAlPortapapeles}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/15 text-white text-[8px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-1 shrink-0"
              >
                {copiedCode ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                {copiedCode ? 'Copiado!' : 'Copiar'}
              </button>
            </div>

            {/* PRE-VISUALIZACIÓN DE CÓDIGO */}
            <div className="p-3 overflow-y-auto flex-1 font-mono text-[9px] text-slate-350 bg-slate-900 custom-scrollbar whitespace-pre leading-relaxed">
              {APPS_SCRIPT_V8_CODE}
            </div>

            {/* FOOTER DEL COPIADOR */}
            <div className="p-2.5 bg-slate-950 text-[8px] text-slate-500 font-bold uppercase tracking-wider text-center border-t border-slate-850">
              Instala en apps script con conexión directa a su base de datos
            </div>

          </div>
        </div>

      </div>

    </section>
  );
};
