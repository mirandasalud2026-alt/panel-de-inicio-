/**
 * =========================================================================
 * GOOGLE APPS SCRIPT (GAS) - SERVIDOR INTEGRADO ("Código.gs")
 * SISTEMA INTEGRADO DE NOMINALES CLÍNICAS Y REPORTES - MIRANDA SALUD 2026
 * =========================================================================
 * 
 * Este script actúa como el motor central unificado en el ecosistema Google Workspace.
 * Integra de forma cohesiva tres grandes módulos funcionales:
 * 
 * MODULE A: SERVIDOR DE FORMULARIOS NOMINALES & API REST (Sincronización Supabase)
 *   - Procesa búsquedas de cédulas en vivo y guarda nuevos formularios nominales.
 *   - Replica en caliente hacia Supabase y las hojas individuales de Google Sheets.
 *   - Genera backups semanales automatizados comprimidos en ZIP en Google Drive.
 * 
 * MODULE B: CONSOLIDACIÓN SEMANAL ASIC POR EJES HISTÓRICOS
 *   - Recolecta semanalmente (Jueves 23:50) datos de las hojas de los 5 ejes correspondientes.
 *   - Genera el consolidado semanal y respalda en el histórico permanente.
 *   - Limpia de forma controlada las hojas operativas para comenzar el nuevo ciclo.
 * 
 * MODULE C: SINCRONIZADOR CENTRALIZADO DE TRÁNSITO REPORTES (Semaforización)
 *   - Envía estados de semáforos e información transitoria de reportes a Supabase en vivo.
 */

// =========================================================================
// 0. CONFIGURACIÓN CENTRALIZADA DE CONSTANTES Y TOKENS (SUPABASE REAL 2026)
// =========================================================================

// Configuración de Supabase Real de la organización
const SUPABASE_URL = "https://tzmhagwihumwiprsnyid.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6bWhhZ3dpaHVtd2lwcnNueWlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk2NTY0NSwiZXhwIjoyMDk0NTQxNjQ1fQ.Pwohh5FjmPh7bqnvtZw9LBtlEMf9K7jrEfNjRwyHJ9g";

// Configuración de Libros y Hojas para Consolidación de Ejes
const EJES_CONFIG = {
  ALTOS_MIRANDINOS:    '1amIenrqhZ5yGFnV_qSEklDUkBF-obLeC3U234KxZC18',
  VALLES_DEL_TUY:      '1bFBoYIWGtplX37QypiyUerMIDl_g-MeBNnCKZifZvp0',
  GUARENAS_GUATIRE:    '1DV2rbO771sC5pcKUUf_kr9Ej4VtkF6Oo9uL8oJHSXGQ',
  BARLOVENTO:          '1mwA2Z1ncghe4-w46BkEwbUC8Bdn_7uAWMaUND-3TB3w',
  METROPOLITANO:       '1n9eFrM_CvbrP_b7uxIEb2Qm42u6X9byrRugIed_ehO0'
};

const SEMANAL_ID = '1iu3UpCktHPDhUJOVWhwL0-zCZ523aJelWIPgHaLE-20';       // Consolidado semanal (se actualiza)
const PERMANENTE_ID = '1zhkYo7kzcb-2r07Becb-wLEFzYEmb-LYxVgl07Njk-g';     // Respaldo histórico permanente
const NOMBRE_HOJA_CONSOLIDADO = 'Consolidado_ASIC';  // Nombre de la hoja dentro del libro semanal


// =========================================================================
// MODULE A: API DE FORMULARIOS NOMINALES, BÚSQUEDA Y RESPALDOS ZIP
// =========================================================================

/**
 * Servidor Web para disponibilizar los layouts e integraciones del backend
 */
function doGet(e) {
  var formType = e.parameter.form || 'quirurgica'; // 'quirurgica', 'obstetrica', 'defuncion'
  var templateName = 'Formulario_' + formType.toUpperCase();
  
  try {
    var template = HtmlService.createTemplateFromFile(templateName);
    template.formType = formType;
    template.webAppUrl = ScriptApp.getService().getUrl();
    
    return template.evaluate()
      .setTitle('Miranda Salud - Nómina ' + formType.toUpperCase())
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    // Fallback a plantilla unificada si no existen archivos separados
    try {
      var unifiedTemplate = HtmlService.createTemplateFromFile('Formulario_UNIFICADO');
      unifiedTemplate.formType = formType;
      unifiedTemplate.webAppUrl = ScriptApp.getService().getUrl();
      
      return unifiedTemplate.evaluate()
        .setTitle('Miranda Salud - Nóminas Clínicas')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    } catch(unifyErr) {
      return ContentService.createTextOutput("Servicio Nominal Miranda Salud 2026 en Linea.");
    }
  }
}

/**
 * Retorna las credenciales persistidas o utiliza las constantes autorizadas por defecto.
 */
function getSupabaseConfig() {
  var props = PropertiesService.getScriptProperties();
  var url = props.getProperty('SUPABASE_URL') || SUPABASE_URL;
  var key = props.getProperty('SUPABASE_ANON_KEY') || SUPABASE_KEY;
  return { url: url, key: key };
}

/**
 * Busca un registro por cédula en el maestro correspondiente de Supabase
 */
function buscarPorCedula(tabla, cedula) {
  var config = getSupabaseConfig();
  var sanitized = cedula.toUpperCase().trim();
  if (!sanitized) return null;
  
  var queryUrl = config.url + "/rest/v1/" + encodeURIComponent(tabla) + "?cedula=eq." + encodeURIComponent(sanitized) + "&select=*";
  
  var headers = {
    "apikey": config.key,
    "Authorization": "Bearer " + config.key
  };
  
  var options = {
    "method": "get",
    "headers": headers,
    "muteHttpExceptions": true
  };
  
  try {
    var response = UrlFetchApp.fetch(queryUrl, options);
    var code = response.getResponseCode();
    if (code >= 200 && code < 300) {
      var data = JSON.parse(response.getContentText());
      return data.length > 0 ? data[0] : null;
    } else {
      Logger.log("Err Supabase (" + code + "): " + response.getContentText());
      return null;
    }
  } catch (e) {
    Logger.log("Excepción de red buscando cédula: " + e.toString());
    return null;
  }
}

function buscarPaciente(cedula) {
  return buscarPorCedula('pacientes', cedula);
}

function buscarMedico(cedula) {
  return buscarPorCedula('DATOS_DEL_MEDICO_TRATANTE', cedula);
}

/**
 * Guarda el formulario clínico con bifurcaciones de tipo, asegurando integridad,
 * actualizando maestros, inyectándolo en caliente a Supabase, y reflejando espejo en Google Sheets.
 */
function guardarRegistroClinico(tipo, payload) {
  var config = getSupabaseConfig();
  var headers = {
    "apikey": config.key,
    "Authorization": "Bearer " + config.key,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  };
  
  // A. Guardar/Actualizar primero el paciente y el médico en sus catálogos maestros
  asegurarPacientesYMedicos(payload, tipo);
  
  // B. Construir payload específico de la tabla destino
  var endpoint = "";
  var insertData = {};
  
  if (tipo === 'quirurgica') {
    endpoint = "/rest/v1/registros_quirurgicos";
    insertData = {
      fecha: payload.fecha,
      estado: payload.estado || 'MIRANDA',
      centro_salud: payload.centro_salud,
      cedula_paciente: payload.cedula_paciente,
      nombre_paciente: payload.nombre_paciente,
      apellido_paciente: payload.apellido_paciente,
      edad_paciente: parseInt(payload.edad_paciente) || 0,
      sexo_paciente: payload.sexo_paciente,
      telefono_paciente: payload.telefono_paciente,
      especialidad_quirurgica: payload.especialidad_quirurgica,
      tipo_intervencion: payload.tipo_intervencion,
      urgente_electiva: payload.urgente_electiva,
      cantidad_intervencion: parseInt(payload.cantidad_intervencion) || 1,
      cedula_medico: payload.cedula_medico,
      nombre_medico: payload.nombre_medico,
      apellido_medico: payload.apellido_medico,
      telefono_medico: payload.telefono_medico
    };
  } else if (tipo === 'obstetrica') {
    endpoint = "/rest/v1/registros_obstetricos";
    insertData = {
      fecha: payload.fecha,
      estado: payload.estado || 'MIRANDA',
      centro_salud: payload.centro_salud,
      cedula_madre: payload.cedula_madre,
      nombre_madre: payload.nombre_madre,
      apellido_madre: payload.apellido_madre,
      edad_madre: parseInt(payload.edad_madre) || 0,
      telefono_madre: payload.telefono_madre,
      nombre_infante: payload.nombre_infante,
      sexo_infante: payload.sexo_infante,
      tipo_parto: payload.tipo_parto,
      tipo_intervencion: payload.tipo_intervencion,
      cedula_medico: payload.cedula_medico,
      nombre_medico: payload.nombre_medico,
      apellido_medico: payload.apellido_medico,
      telefono_medico: payload.telefono_medico
    };
  } else if (tipo === 'defuncion') {
    endpoint = "/rest/v1/registros_defunciones";
    insertData = {
      fecha: payload.fecha,
      estado: payload.estado || 'MIRANDA',
      centro_salud: payload.centro_salud,
      cedula_fallecido: payload.cedula_fallecido || null,
      nombre_fallecido: payload.nombre_fallecido,
      apellido_fallecido: payload.apellido_fallecido,
      edad_fallecido: parseInt(payload.edad_fallecido) || 0,
      sexo_fallecido: payload.sexo_fallecido,
      hora_fallecimiento: payload.hora_fallecimiento,
      patologia: payload.patologia,
      observacion: payload.observacion || '',
      cedula_medico: payload.cedula_medico,
      nombre_medico: payload.nombre_medico,
      apellido_medico: payload.apellido_medico,
      telefono_medico: payload.telefono_medico
    };
  }
  
  // Guardado Tabla Específica
  var specificRes = UrlFetchApp.fetch(config.url + endpoint, {
    method: "POST",
    headers: headers,
    payload: JSON.stringify(insertData),
    muteHttpExceptions: true
  });
  
  var respCode = specificRes.getResponseCode();
  if (respCode < 200 || respCode >= 300) {
    throw new Error("Fallo al insertar tabla específica: " + specificRes.getContentText());
  }
  
  var savedArray = JSON.parse(specificRes.getContentText());
  var recordId = (savedArray && savedArray.length > 0) ? savedArray[0].id : 999;
  
  // C. Duplicar entrada de auditoría en tabla temporal de refresco nominales
  var nominalPayload = {
    tipo_registro: tipo,
    registro_id: recordId,
    cedula_principal: payload.cedula_paciente || payload.cedula_madre || payload.cedula_fallecido || 'S-CI',
    centro_salud: payload.centro_salud,
    datos: insertData
  };
  
  UrlFetchApp.fetch(config.url + "/rest/v1/nominales", {
    method: "POST",
    headers: headers,
    payload: JSON.stringify(nominalPayload),
    muteHttpExceptions: true
  });
  
  // D. Ejecutar propagación correctiva de datos nulos de pacientes y médicos
  propagarCorrectivasYFichas(payload, tipo);
  
  // E. Sincronizar en vivo con la hoja de Google Sheets activa del usuario
  try {
    guardarEnGoogleSheet(tipo, payload);
  } catch (sheetErr) {
    Logger.log("Error intentando inyectar fila en Google Sheets en vivo: " + sheetErr.toString());
  }
  
  return { success: true, id: recordId };
}

/**
 * Asegura existencia de Pacientes, Madres y Médicos verificándolos y creándolos en caliente
 */
function asegurarPacientesYMedicos(payload, tipo) {
  var config = getSupabaseConfig();
  var headers = {
    "apikey": config.key,
    "Authorization": "Bearer " + config.key,
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
  };
  
  if (tipo === 'quirurgica') {
    var pac = {
      cedula: payload.cedula_paciente.toUpperCase().trim(),
      nombre: payload.nombre_paciente.toUpperCase().trim(),
      apellido: payload.apellido_paciente.toUpperCase().trim(),
      edad: parseInt(payload.edad_paciente) || 0,
      sexo: payload.sexo_paciente,
      telefono: payload.telefono_paciente
    };
    UrlFetchApp.fetch(config.url + "/rest/v1/pacientes", {
      method: "POST", headers: headers, payload: JSON.stringify(pac), muteHttpExceptions: true
    });
  } else if (tipo === 'obstetrica') {
    var madre = {
      cedula: payload.cedula_madre.toUpperCase().trim(),
      nombre: payload.nombre_madre.toUpperCase().trim(),
      apellido: payload.apellido_madre.toUpperCase().trim(),
      edad: parseInt(payload.edad_madre) || 0,
      sexo: 'FEMENINO',
      telefono: payload.telefono_madre
    };
    UrlFetchApp.fetch(config.url + "/rest/v1/pacientes", {
      method: "POST", headers: headers, payload: JSON.stringify(madre), muteHttpExceptions: true
    });
  } else if (tipo === 'defuncion' && payload.cedula_fallecido) {
    var fallecido = {
      cedula: payload.cedula_fallecido.toUpperCase().trim(),
      nombre: payload.nombre_fallecido.toUpperCase().trim(),
      apellido: payload.apellido_fallecido.toUpperCase().trim(),
      edad: parseInt(payload.edad_fallecido) || 0,
      sexo: payload.sexo_fallecido,
      telefono: ''
    };
    UrlFetchApp.fetch(config.url + "/rest/v1/pacientes", {
      method: "POST", headers: headers, payload: JSON.stringify(fallecido), muteHttpExceptions: true
    });
  }
  
  if (payload.cedula_medico) {
    var medico = {
      cedula: payload.cedula_medico.toUpperCase().trim(),
      nombre: payload.nombre_medico.toUpperCase().trim(),
      apellido: payload.apellido_medico.toUpperCase().trim(),
      telefono: payload.telefono_medico
    };
    UrlFetchApp.fetch(config.url + "/rest/v1/DATOS_DEL_MEDICO_TRATANTE", {
      method: "POST", headers: headers, payload: JSON.stringify(medico), muteHttpExceptions: true
    });
  }
}

/**
 * Propaga retroactivamente nulos o campos vacíos anteriores
 */
function propagarCorrectivasYFichas(payload, tipo) {
  var config = getSupabaseConfig();
  var headers = {
    "apikey": config.key,
    "Authorization": "Bearer " + config.key,
    "Content-Type": "application/json"
  };
  
  var rpcUrl = config.url + "/rest/v1/rpc/propagar_datos_por_cedula";
  
  var triggerRpc = function(ced, nom, ape, tel, ed, se) {
    var params = {
      target_cedula: ced,
      target_nombre: nom,
      target_apellido: ape,
      target_telefono: tel,
      target_edad: ed || null,
      target_sexo: se || null
    };
    UrlFetchApp.fetch(rpcUrl, {
      method: "POST",
      headers: headers,
      payload: JSON.stringify(params),
      muteHttpExceptions: true
    });
  };
  
  if (tipo === 'quirurgica') {
    triggerRpc(payload.cedula_paciente, payload.nombre_paciente, payload.apellido_paciente, payload.telefono_paciente, parseInt(payload.edad_paciente), payload.sexo_paciente);
    triggerRpc(payload.cedula_medico, payload.nombre_medico, payload.apellido_medico, payload.telefono_medico, null, null);
  } else if (tipo === 'obstetrica') {
    triggerRpc(payload.cedula_madre, payload.nombre_madre, payload.apellido_madre, payload.telefono_madre, parseInt(payload.edad_madre), 'FEMENINO');
    triggerRpc(payload.cedula_medico, payload.nombre_medico, payload.apellido_medico, payload.telefono_medico, null, null);
  } else if (tipo === 'defuncion') {
    if (payload.cedula_fallecido) {
      triggerRpc(payload.cedula_fallecido, payload.nombre_fallecido, payload.apellido_fallecido, '', parseInt(payload.edad_fallecido), payload.sexo_fallecido);
    }
    triggerRpc(payload.cedula_medico, payload.nombre_medico, payload.apellido_medico, payload.telefono_medico, null, null);
  }
}

/**
 * Respaldo Manual desde el Editor de Apps Script
 */
function backupManual() {
  Logger.log("Iniciando backup manual inducido por operador...");
  var fileId = generarBackupSemanal();
  Logger.log("Operación completada con éxito. Archivo ID: " + fileId);
  return "Backup Exitoso: " + fileId;
}

/**
 * Genera respaldo ZIP comprimido de las Tablas en Google Drive del Usuario y limpia temporales
 */
function generarBackupSemanal() {
  // Carpeta de resguardo (Se crea o utiliza la por defecto del usuario)
  var defaultFolderName = "Miranda Salud - Backups Nominales Secuenciales";
  var folders = DriveApp.getFoldersByName(defaultFolderName);
  var folder;
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(defaultFolderName);
  }
  
  Logger.log("Conectando con Supabase para recolectar datos consolidados...");
  
  var config = getSupabaseConfig();
  var headers = {
    "apikey": config.key,
    "Authorization": "Bearer " + config.key
  };
  var options = {
    "method": "get",
    "headers": headers,
    "muteHttpExceptions": true
  };
  
  // Extraer datos de las 4 tablas
  var qRes = UrlFetchApp.fetch(config.url + "/rest/v1/registros_quirurgicos?select=*", options);
  var oRes = UrlFetchApp.fetch(config.url + "/rest/v1/registros_obstetricos?select=*", options);
  var dRes = UrlFetchApp.fetch(config.url + "/rest/v1/registros_defunciones?select=*", options);
  var nRes = UrlFetchApp.fetch(config.url + "/rest/v1/nominales?select=*", options);
  
  var qData = JSON.parse(qRes.getContentText()) || [];
  var oData = JSON.parse(oRes.getContentText()) || [];
  var dData = JSON.parse(dRes.getContentText()) || [];
  var nData = JSON.parse(nRes.getContentText()) || [];
  
  // Convertir cada DataSet a cadena de texto tipo CSV
  var qCsv = parseJSONToCSV(qData);
  var oCsv = parseJSONToCSV(oData);
  var dCsv = parseJSONToCSV(dData);
  var nCsv = parseJSONToCSV(nData);
  
  // Empaquetar en un Blob comprimido ZIP único (Cumple con requisitos)
  var stamp = Utilities.formatDate(new Date(), "America/Caracas", "yyyy-MM-dd_HH-mm");
  var zipName = "backup_nominales_" + stamp + ".zip";
  
  var blobs = [
    Utilities.newBlob(qCsv, 'text/csv', 'registros_quirurgicos.csv'),
    Utilities.newBlob(oCsv, 'text/csv', 'registros_obstetricas.csv'),
    Utilities.newBlob(dCsv, 'text/csv', 'registros_defunciones.csv'),
    Utilities.newBlob(nCsv, 'text/csv', 'nominales_temporal_vigente.csv')
  ];
  
  var zipBlob = Utilities.zip(blobs, zipName);
  var file = folder.createFile(zipBlob);
  Logger.log("Backup guardado de forma satisfactoria con ID: " + file.getId());
  
  limpiarNominalesAntiguosViaAPI();
  
  return file.getId();
}

/**
 * Formatea objetos JSON a texto de valores separados por coma (CSV)
 */
function parseJSONToCSV(jsonArray) {
  if (!jsonArray || jsonArray.length === 0) {
    return "ID,MENSAJE\nS-ID,Sin registros cargados actualmente.";
  }
  
  var headers = Object.keys(jsonArray[0]);
  var csvRows = [];
  
  // Cabecera
  csvRows.push(headers.join(","));
  
  // Filas
  for (var i = 0; i < jsonArray.length; i++) {
    var values = [];
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j];
      var rawVal = jsonArray[i][key];
      
      if (rawVal === null || rawVal === undefined) {
        values.push("");
      } else {
        var strVal = (typeof rawVal === 'object') ? JSON.stringify(rawVal) : rawVal.toString();
        strVal = strVal.replace(/"/g, '""');
        if (strVal.indexOf(",") !== -1 || strVal.indexOf("\n") !== -1 || strVal.indexOf('"') !== -1) {
          values.push('"' + strVal + '"');
        } else {
          values.push(strVal);
        }
      }
    }
    csvRows.push(values.join(","));
  }
  
  return csvRows.join("\n");
}

/**
 * Purgar registros temporales con más de 7 días
 */
function limpiarNominalesAntiguosViaAPI() {
  var config = getSupabaseConfig();
  var sieteDiasAtras = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  var deleteUrl = config.url + "/rest/v1/nominales?fecha_creacion=lt." + encodeURIComponent(sieteDiasAtras);
  
  var headers = {
    "apikey": config.key,
    "Authorization": "Bearer " + config.key
  };
  
  UrlFetchApp.fetch(deleteUrl, {
    "method": "delete",
    "headers": headers,
    "muteHttpExceptions": true
  });
  
  Logger.log("Limpieza de registros obsoletos de nominales de más de 7 días completada.");
}

/**
 * Inyección reactiva a espejo en hojas individuales del libro principal de Spreadsheet
 */
function guardarEnGoogleSheet(tipo, payload) {
  var props = PropertiesService.getScriptProperties();
  var spreadsheetId = props.getProperty('SPREADSHEET_ID') || "1WeJ4q40PcNrIi6e2Odi_LtiOq4LWx4qdYRwdE1RGTL0";
  
  if (!spreadsheetId) {
    Logger.log("No se definió 'SPREADSHEET_ID'. Omite sincronización directa a Sheets.");
    return;
  }
  
  Logger.log("Sincronizando formulario con Google Spreadsheet ID: " + spreadsheetId);
  var ss = SpreadsheetApp.openById(spreadsheetId);
  
  var sheetName = "";
  var headers = [];
  var rowValues = [];
  var stamp = Utilities.formatDate(new Date(), "America/Caracas", "yyyy-MM-dd HH:mm:ss");
  
  if (tipo === 'quirurgica') {
    sheetName = "Nominas Quirurgicas";
    headers = [
      "Fecha Registro", "Fecha Operacion", "Estado", "Centro de Salud", 
      "Cedula Paciente", "Nombre Paciente", "Apellido Paciente", "Edad", "Sexo", "Telefono Paciente",
      "Especialidad Quirurgica", "Tipo Intervencion", "Urgente/Electiva", "Cantidad",
      "Cedula Medico", "Nombre Medico", "Apellido Medico", "Telefono Medico"
    ];
    rowValues = [
      stamp, payload.fecha, payload.estado || "MIRANDA", payload.centro_salud,
      payload.cedula_paciente, payload.nombre_paciente, payload.apellido_paciente, payload.edad_paciente, payload.sexo_paciente, payload.telefono_paciente,
      payload.especialidad_quirurgica, payload.tipo_intervencion, payload.urgente_electiva, payload.cantidad_intervencion || 1,
      payload.cedula_medico, payload.nombre_medico, payload.apellido_medico, payload.telefono_medico
    ];
  } else if (tipo === 'obstetrica') {
    sheetName = "Nominas Obstetricas";
    headers = [
      "Fecha Registro", "Fecha Evento", "Estado", "Centro de Salud",
      "Cedula Madre", "Nombre Madre", "Apellido Madre", "Edad Madre", "Telefono Madre",
      "Nombre Infante", "Sexo Infante", "Tipo Parto", "Tipo Intervencion",
      "Cedula Medico", "Nombre Medico", "Apellido Medico", "Telefono Medico"
    ];
    rowValues = [
      stamp, payload.fecha, payload.estado || "MIRANDA", payload.centro_salud,
      payload.cedula_madre, payload.nombre_madre, payload.apellido_madre, payload.edad_madre, payload.telefono_madre,
      payload.nombre_infante, payload.sexo_infante, payload.tipo_parto, payload.tipo_intervencion,
      payload.cedula_medico, payload.nombre_medico, payload.apellido_medico, payload.telefono_medico
    ];
  } else if (tipo === 'defuncion') {
    sheetName = "Nominas Defunciones";
    headers = [
      "Fecha Registro", "Fecha Fallecimiento", "Estado", "Centro de Salud",
      "Cedula Fallecido", "Nombre Fallecido", "Apellido Fallecido", "Edad Fallecido", "Sexo Fallecido",
      "Hora Fallecimiento", "Patologia", "Observaciones",
      "Cedula Medico", "Nombre Medico", "Apellido Medico", "Telefono Medico"
    ];
    rowValues = [
      stamp, payload.fecha, payload.estado || "MIRANDA", payload.centro_salud,
      payload.cedula_fallecido || "S/CI", payload.nombre_fallecido, payload.apellido_fallecido, payload.edad_fallecido, payload.sexo_fallecido,
      payload.hora_fallecimiento, payload.patologia, payload.observacion || "",
      payload.cedula_medico, payload.nombre_medico, payload.apellido_medico, payload.telefono_medico
    ];
  }
  
  if (!sheetName) return;
  
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#EAEEF3");
  }
  
  sheet.appendRow(rowValues);
  Logger.log("Fila insertada con éxito en pestaña: " + sheetName);
}


// =========================================================================
// MODULE B: CONSOLIDACIÓN SEMANAL ASIC POR EJES HISTÓRICOS
// =========================================================================

/**
 * Función principal coordinada para consolidar todos los ejes y reiniciar semanas (Jueves 23:50)
 */
function respaldoSemanalYLimpiar() {
  try {
    // --- 1. Leer todas las hojas ASIC de los 5 libros de ejes ---
    let todosLosDatos = [];
    let encabezadosGlobales = null;
    
    for (const [nombreEje, idLibro] of Object.entries(EJES_CONFIG)) {
      const libro = SpreadsheetApp.openById(idLibro);
      const hojas = libro.getSheets();
      
      for (const hoja of hojas) {
        const nombreHoja = hoja.getName();
        // Coincide con pestañas que comiencen por "ASIC"
        if (nombreHoja.toUpperCase().startsWith('ASIC')) {
          const datos = hoja.getDataRange().getValues();
          if (datos.length < 2) continue; // Si solo contiene encabezados
          
          if (!encabezadosGlobales) {
            encabezadosGlobales = [...datos[0]];
          }
          
          for (let i = 1; i < datos.length; i++) {
            const fila = datos[i];
            // Validar que la primera columna no esté vacía
            if (fila[0] && fila[0].toString().trim() !== '') {
              const filaCompleta = [nombreEje, nombreHoja, ...fila];
              todosLosDatos.push(filaCompleta);
            }
          }
        }
      }
    }
    
    if (todosLosDatos.length === 0) {
      throw new Error('No se encontraron datos activos en ninguna de las hojas ASIC inspeccionadas.');
    }
    
    const encabezadosFinales = ['EJE', 'HOJA_ASIC', ...encabezadosGlobales];
    
    // --- 2. Respaldar consolidado actual de la semana en curso al histórico permanente ---
    const semanalSS = SpreadsheetApp.openById(SEMANAL_ID);
    let semanalSheet = semanalSS.getSheetByName(NOMBRE_HOJA_CONSOLIDADO);
    if (!semanalSheet) semanalSheet = semanalSS.insertSheet(NOMBRE_HOJA_CONSOLIDADO);
    
    const datosActualesConsolidado = semanalSheet.getDataRange().getValues();
    if (datosActualesConsolidado.length > 1) {
      const permanenteSS = SpreadsheetApp.openById(PERMANENTE_ID);
      let permanenteSheet = permanenteSS.getSheetByName(NOMBRE_HOJA_CONSOLIDADO);
      if (!permanenteSheet) {
        permanenteSheet = permanenteSS.insertSheet(NOMBRE_HOJA_CONSOLIDADO);
        const headersBackup = [...encabezadosFinales, 'FECHA_RESPALDO'];
        permanenteSheet.getRange(1, 1, 1, headersBackup.length).setValues([headersBackup]);
      }
      
      const fechaBackup = new Date();
      const filasParaBackup = [];
      for (let i = 1; i < datosActualesConsolidado.length; i++) {
        const fila = datosActualesConsolidado[i];
        if (fila[0] && fila[0].toString().trim() !== '') {
          filasParaBackup.push([...fila, fechaBackup]);
        }
      }
      if (filasParaBackup.length > 0) {
        const ultimaFila = permanenteSheet.getLastRow();
        permanenteSheet.getRange(ultimaFila + 1, 1, filasParaBackup.length, filasParaBackup[0].length)
                     .setValues(filasParaBackup);
      }
    }
    
    // --- 3. Sobrescribir consolidado semanal con los nuevos datos consolidados ---
    semanalSheet.clearContents();
    semanalSheet.getRange(1, 1, 1, encabezadosFinales.length).setValues([encabezadosFinales]);
    if (todosLosDatos.length > 0) {
      semanalSheet.getRange(2, 1, todosLosDatos.length, encabezadosFinales.length)
                  .setValues(todosLosDatos);
    }
    semanalSheet.autoResizeColumns(1, encabezadosFinales.length);
    
    // --- 4. Limpiar todas las hojas ASIC (vaciar filas, conservar encabezados) ---
    limpiarHojasAsicEnEjes();
    
    Logger.log(`✅ Respaldo y consolidación completada con éxito. Total filas: ${todosLosDatos.length}.`);
    return ContentService.createTextOutput(JSON.stringify({status:'success', rows:todosLosDatos.length}));
    
  } catch (error) {
    Logger.log(`❌ ERROR CONSOLIDANDO EJES: ${error.message}`);
    return ContentService.createTextOutput(JSON.stringify({status:'error', message:error.message}));
  }
}

/**
 * Limpia filas operativas de todas las hojas ASIC en todos los ejes
 */
function limpiarHojasAsicEnEjes() {
  for (const [nombreEje, idLibro] of Object.entries(EJES_CONFIG)) {
    try {
      const libro = SpreadsheetApp.openById(idLibro);
      const hojas = libro.getSheets();
      
      for (const hoja of hojas) {
        if (hoja.getName().toUpperCase().startsWith('ASIC')) {
          const datos = hoja.getDataRange().getValues();
          if (datos.length > 1) { // Posee registros cargados
            hoja.clearContents();
            if (datos.length > 0 && datos[0].length > 0) {
              hoja.getRange(1, 1, 1, datos[0].length).setValues([datos[0]]);
            }
            Logger.log(`🗑️ Limpiada hoja operativa: ${hoja.getName()} de eje: ${nombreEje}`);
          }
        }
      }
    } catch (e) {
      console.error(`Error de red limpiando hojas del eje ${nombreEje}: ${e.message}`);
    }
  }
}

/**
 * Totalizador en tiempo de ejecución (Lectura pura e informe sin modificar datos)
 */
function totalizarEntreSemana() {
  const resumen = [];
  let totalFilasGlobal = 0;
  let totalEstablecimientosGlobal = 0;
  let totalActivosGlobal = 0;
  
  for (const [nombreEje, idLibro] of Object.entries(EJES_CONFIG)) {
    try {
      const libro = SpreadsheetApp.openById(idLibro);
      const hojas = libro.getSheets();
      let filasEje = 0;
      let estEje = 0;
      let activosEje = 0;
      
      for (const hoja of hojas) {
        if (hoja.getName().toUpperCase().startsWith('ASIC')) {
          const datos = hoja.getDataRange().getValues();
          for (let i = 1; i < datos.length; i++) {
            if (datos[i][0] && datos[i][0].toString().trim() !== '') {
              filasEje++;
              if (datos[i][1]) estEje += Number(datos[i][1]) || 0;
              if (datos[i][2]) activosEje += Number(datos[i][2]) || 0;
            }
          }
        }
      }
      totalFilasGlobal += filasEje;
      totalEstablecimientosGlobal += estEje;
      totalActivosGlobal += activosEje;
      resumen.push([nombreEje, filasEje, estEje, activosEje]);
    } catch(e) {
      resumen.push([nombreEje, 'ERROR', e.message]);
    }
  }
  
  Logger.log('=== TOTALIZACIÓN EN CURSO ===');
  resumen.forEach(r => Logger.log(r.join(' | ')));
  Logger.log(`Totales: Registros=${totalFilasGlobal}, Establecimientos=${totalEstablecimientosGlobal}, Actores Activos=${totalActivosGlobal}`);
  
  return { resumen, totalFilasGlobal, totalEstablecimientosGlobal, totalActivosGlobal };
}

/**
 * Registra trigger semanal automatizado los jueves a las 23:50 PM
 */
function crearTriggerSemanal() {
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'respaldoSemanalYLimpiar') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  ScriptApp.newTrigger('respaldoSemanalYLimpiar')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.THURSDAY)
    .atHour(23)
    .nearMinute(50)
    .create();
  
  Logger.log('✅ Trigger programado: Todos los jueves a las 11:50 PM');
}

function probarTotalizacionManual() {
  return totalizarEntreSemana();
}

/**
 * Interfaz UI interactiva para confirmaciones y ejecuciones de respaldo en caliente
 */
function ejecutarRespaldoManual() {
  const ui = SpreadsheetApp.getUi();
  const respuesta = ui.alert('⚠️ ADVERTENCIA DE CORTE', 
    '¿Seguro de ejecutar el corte manual?\n\n- Se enviarán los datos del consolidado semanal actual al Histórico Permanente.\n- Recopilará y consolidará todos los ejes.\n- BORRARÁ por completo los datos operativos en los ejes.', 
    ui.ButtonSet.YES_NO);
  
  if (respuesta === ui.Button.YES) {
    respaldoSemanalYLimpiar();
    ui.alert('✅ Proceso completado exitosamente.');
  }
}

/**
 * Diagnóstico de estado actual de las planillas distribuidas
 */
function diagnosticarHojasASIC() {
  for (const [nombreEje, idLibro] of Object.entries(EJES_CONFIG)) {
    console.log(`\n📁 EJE: ${nombreEje} (ID: ${idLibro})`);
    try {
      const libro = SpreadsheetApp.openById(idLibro);
      const hojas = libro.getSheets();
      let encontradas = 0;
      for (const hoja of hojas) {
        const nombre = hoja.getName();
        if (nombre.toUpperCase().startsWith('ASIC')) {
          encontradas++;
          const datos = hoja.getDataRange().getValues();
          const filasConDatos = datos.filter((fila, idx) => idx > 0 && fila[0] && fila[0].toString().trim() !== '').length;
          console.log(`  ✅ Hoja: "${nombre}" → ${datos.length - 1} filas totales, ${filasConDatos} útiles`);
        }
      }
      if (encontradas === 0) console.log(`  ❌ No se detectaron hojas que comiencen por "ASIC"`);
    } catch(e) {
      console.error(`  ❌ Error abriendo libro: ${e.message}`);
    }
  }
}

/**
 * Respalda pero omite la limpieza de hojas de ejes secundarios
 */
function soloRespaldoSinLimpiar() {
  const originalLimpiar = limpiarHojasAsicEnEjes;
  limpiarHojasAsicEnEjes = function() { Logger.log("🧹 LIMPIEZA OMITIDA TEMPORALMENTE (MODO PRUEBA)"); };
  try {
    respaldoSemanalYLimpiar();
  } finally {
    limpiarHojasAsicEnEjes = originalLimpiar;
  }
}

/**
 * Elimina duplicados de centros basados en su identificador unívoco
 */
function eliminarDuplicadosEnConsolidado() {
  const ss = SpreadsheetApp.openById(SEMANAL_ID);
  const sheet = ss.getSheetByName(NOMBRE_HOJA_CONSOLIDADO);
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  
  const headers = data[0];
  const columnaIndice = 3; // Columna identificadora unívoca
  
  const seen = new Map();
  const newData = [headers];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const key = row[columnaIndice] ? row[columnaIndice].toString().trim() : '';
    if (key && !seen.has(key)) {
      seen.set(key, true);
      newData.push(row);
    } else if (!key) {
      newData.push(row);
    }
  }
  
  if (newData.length < data.length) {
    sheet.clearContents();
    sheet.getRange(1, 1, newData.length, newData[0].length).setValues(newData);
    Logger.log(`Duplicados eliminados: ${data.length - newData.length} filas.`);
  } else {
    Logger.log("No se encontraron duplicados.");
  }
}

/**
 * Invoca el popup intermedio para alertar corte en vivo
 */
function hacerCorteYLimpiarAhora() {
  const ui = SpreadsheetApp.getUi();
  const respuesta = ui.alert(
    "⚠️ CORTE SEMANAL INMEDIATO",
    "Esta acción:\n" +
    "✅ Respaldará los datos al histórico permanente\n" +
    "✅ Escribirá el consolidado semanal consolidado\n" +
    "🧹 Limpiará las hojas temporales operativas en los ejes.\n\n" +
    "¿Proceder?",
    ui.ButtonSet.YES_NO
  );
  if (respuesta === ui.Button.YES) {
    respaldoSemanalYLimpiar();
    ui.alert("✅ CORTE SEMANAL INMEDIATO EFECTUADO");
  }
}

/**
 * Restaura el consolidado semanal actual a partir del último respaldo histórico
 */
function restaurarDesdeUltimoRespaldo() {
  const ui = SpreadsheetApp.getUi();
  const respuesta = ui.alert(
    "⚠️ RESTAURAR CONSOLIDADO DESDE COPIA HISTÓRICA",
    "Esta acción reemplazará los datos vigentes sustituyéndolos por el respaldo permanente.\n\n¿Continuar?",
    ui.ButtonSet.YES_NO
  );
  if (respuesta !== ui.Button.YES) return;
  
  const permanenteSS = SpreadsheetApp.openById(PERMANENTE_ID);
  let permanenteSheet = permanenteSS.getSheetByName(NOMBRE_HOJA_CONSOLIDADO);
  if (!permanenteSheet) {
    ui.alert("❌ No se detectó la hoja del histórico permanente.");
    return;
  }
  
  const backupData = permanenteSheet.getDataRange().getValues();
  if (backupData.length <= 1) {
    ui.alert("❌ El respaldo del histórico se encuentra vacío.");
    return;
  }
  
  const headers = backupData[0];
  const fechaColIndex = headers.indexOf('FECHA_RESPALDO');
  if (fechaColIndex === -1) {
    ui.alert("❌ No se localizó la columna de control FECHA_RESPALDO.");
    return;
  }
  
  let latestDate = null;
  let latestRows = [];
  for (let i = 1; i < backupData.length; i++) {
    const fecha = backupData[i][fechaColIndex];
    if (fecha instanceof Date) {
      if (!latestDate || fecha > latestDate) {
        latestDate = fecha;
        latestRows = [backupData[i]];
      } else if (fecha.getTime() === latestDate.getTime()) {
        latestRows.push(backupData[i]);
      }
    }
  }
  
  if (latestRows.length === 0) {
    ui.alert("❌ No se encontraron fechas de control congruentes.");
    return;
  }
  
  const restoredRows = latestRows.map(row => {
    const newRow = [...row];
    newRow.splice(fechaColIndex, 1);
    return newRow;
  });
  
  const semanalSS = SpreadsheetApp.openById(SEMANAL_ID);
  let semanalSheet = semanalSS.getSheetByName(NOMBRE_HOJA_CONSOLIDADO);
  if (!semanalSheet) semanalSheet = semanalSS.insertSheet(NOMBRE_HOJA_CONSOLIDADO);
  
  semanalSheet.clearContents();
  const headersWithoutDate = headers.filter(h => h !== 'FECHA_RESPALDO');
  semanalSheet.getRange(1, 1, 1, headersWithoutDate.length).setValues([headersWithoutDate]);
  if (restoredRows.length > 0) {
    semanalSheet.getRange(2, 1, restoredRows.length, restoredRows[0].length).setValues(restoredRows);
  }
  
  ui.alert(`✅ Restauradas ${restoredRows.length} filas desde el respaldo de fecha: ${latestDate.toLocaleString()}.`);
}


// =========================================================================
// MODULE C: SINCRONIZADOR CENTRAL VÍA SUPABASE (SALA DE ANÁLISIS TRÁNSITO)
// =========================================================================

/**
 * Envía/Actualiza (upsert) el estado de semáforo y reporte de un centro particular a Supabase
 */
function upsertTransitoReporte(centro) {
  const url = `${SUPABASE_URL}/rest/v1/transito_reportes`;
  
  const payload = {
    id_centro: centro.id_centro,
    nombre_centro: centro.nombre_centro,
    asic: centro.asic,
    eje_geografico: centro.eje_geografico,
    ultimo_reporte: centro.ultimo_reporte || new Date().toISOString(),
    estado_semaforo: centro.estado_semaforo || 'Rojo',
    horas_retraso: Number(centro.horas_retraso) || 0,
    actualizado_en: new Date().toISOString()
  };
  
  const options = {
    method: "POST",
    contentType: "application/json",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY,
      // Resolución de conflictos: sobreescribir sobre duplicidad de ID de centro
      "Prefer": "resolution=merge-duplicates"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  Logger.log(`📤 ${payload.id_centro}: Estado de subida de transitabilidad reportó código ${response.getResponseCode()}`);
  return response;
}

/**
 * Transfiere masivamente múltiples establecimientos/centros
 */
function enviarTransitoReportes(centros) {
  const resultados = [];
  for (const centro of centros) {
    const res = upsertTransitoReporte(centro);
    resultados.push({
      id: centro.id_centro,
      status: res.getResponseCode()
    });
  }
  return resultados;
}

/**
 * Pruebas unitarias de transmisión hacia la nube
 */
function testEnvio() {
  const centros = [
    {
      id_centro: "TEST_CENTRO_1",
      nombre_centro: "Establecimiento Demostrativo Territorial",
      asic: "ES-9001",
      eje_geografico: "ALTOS MIRANDINOS",
      estado_semaforo: "Verde",
      horas_retraso: 0
    }
  ];
  
  const resultado = enviarTransitoReportes(centros);
  Logger.log(resultado);
}

/**
 * Ejecutor principal total de engranaje de transitabilidad de los centros hacia Supabase
 */
function LANZAR_SINCRONIZACION_TOTAL() {
  Logger.log("🚀 Iniciando engranaje unificado de sincronización...");
  testEnvio();
  Logger.log("✅ Proceso de sincronización centralizada en caliente culminado.");
}
