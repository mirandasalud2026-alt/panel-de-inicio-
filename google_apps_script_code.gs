/**
 * =========================================================================
 * GOOGLE APES SCRIPT (GAS) - SERVIDOR ("Código.gs" o "Codigo.gs")
 * SISTEMA DE INFORMACIÓN NOMINAL MIRANDA SALUD 2026
 * =========================================================================
 * 
 * Este archivo contiene la lógica del servidor de Google Apps Script. 
 * Se conecta de forma segura a Supabase vía API REST, gestiona la búsqueda 
 * de cédulas, inserción de planillas nominales, actualización cruzada de datos 
 * huérfanos y realiza copias semanales (backups CSV comprimidos ZIP en Google Drive).
 */

// 1. SERVIR EL LOG DE FORMULARIOS HTML CORRESPONDIENTES (doGet)
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
    // Si no existen archivos separados para cada pestaña se usa un único archivo integrador responsivo
    var unifiedTemplate = HtmlService.createTemplateFromFile('Formulario_UNIFICADO');
    unifiedTemplate.formType = formType;
    unifiedTemplate.webAppUrl = ScriptApp.getService().getUrl();
    
    return unifiedTemplate.evaluate()
      .setTitle('Miranda Salud - Nóminas Clínicas')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

// 2. CONFIGURACIÓN Y SERVICIO DE PARÁMETROS DE SUPABASE
function getSupabaseConfig() {
  var props = PropertiesService.getScriptProperties();
  var url = props.getProperty('SUPABASE_URL') || "https://f2a15edf-bad2-4504-8ead-0c24fdfd4b2c.supabase.co"; // Reemplazar
  var key = props.getProperty('SUPABASE_ANON_KEY') || ""; // Reemplazar por su Service Role / Anon Key
  
  if (!key) {
    throw new Error("La variable 'SUPABASE_ANON_KEY' no está definida en ScriptProperties en script.google.com.");
  }
  return { url: url, key: key };
}

// 3. LOGICA DE BUSQUEDA POR CÉDULA DESDE SUPABASE
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

// buscarPaciente() wrapper
function buscarPaciente(cedula) {
  return buscarPorCedula('pacientes', cedula);
}

// buscarMedico() wrapper
function buscarMedico(cedula) {
  return buscarPorCedula('DATOS_DEL_MEDICO_TRATANTE', cedula);
}


// 4. GUARDAR REGISTROS E INSERCIÓN DINÁMICA DE PACIENTES/MÉDICOS
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
  
  var nowStr = new Date().toISOString();
  
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
  
  // C. Duplicar entrada de auditoría en tabla temporal "nominales"
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

// Insertar/actualizar paciente y médico de forma atómica si no existen
function asegurarPacientesYMedicos(payload, tipo) {
  var config = getSupabaseConfig();
  var headers = {
    "apikey": config.key,
    "Authorization": "Bearer " + config.key,
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
  };
  
  if (tipo === 'quirurgica') {
    // Paciente
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
    // Madre
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
    // Fallecido
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
  
  // Médico Tratante (Aplica a los tres formularios)
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

// Propagar retroactivamente para corregir campos nulos / obsoletos
function propagarCorrectivasYFichas(payload, tipo) {
  var config = getSupabaseConfig();
  var headers = {
    "apikey": config.key,
    "Authorization": "Bearer " + config.key,
    "Content-Type": "application/json"
  };
  
  // Ejecutar RPC de propagación atómica para actualizar tablas
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


// =========================================================================
// 5. RESPALDO SEMANAL INTEGRADO AUTOMÁTICO - EN GOOGLE DRIVE
// =========================================================================

// Función de diagnóstico/ejecución directa desde el editor de Apps Script
function backupManual() {
  Logger.log("Iniciando backup manual inducido por operador...");
  var fileId = generarBackupSemanal();
  Logger.log("Operación completada con éxito. Archivo ID: " + fileId);
  return "Backup Exitoso: " + fileId;
}

// Se ejecuta de manera planificada (Activador de tiempo: Domingos 23:55)
function generarBackupSemanal() {
  var folderId = "19RTGSwQuisCSr1YLZrZX6ezngQ_69Mhv";
  var folder = DriveApp.getFolderById(folderId);
  
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
  
  // A. Extraer datos de las 4 tablas
  var qRes = UrlFetchApp.fetch(config.url + "/rest/v1/registros_quirurgicos?select=*", options);
  var oRes = UrlFetchApp.fetch(config.url + "/rest/v1/registros_obstetricos?select=*", options);
  var dRes = UrlFetchApp.fetch(config.url + "/rest/v1/registros_defunciones?select=*", options);
  var nRes = UrlFetchApp.fetch(config.url + "/rest/v1/nominales?select=*", options);
  
  var qData = JSON.parse(qRes.getContentText()) || [];
  var oData = JSON.parse(oRes.getContentText()) || [];
  var dData = JSON.parse(dRes.getContentText()) || [];
  var nData = JSON.parse(nRes.getContentText()) || [];
  
  // B. Convertir cada DataSet a cadena de texto tipo CSV con separador de comas (Excel Compliant)
  var qCsv = parseJSONToCSV(qData);
  var oCsv = parseJSONToCSV(oData);
  var dCsv = parseJSONToCSV(dData);
  var nCsv = parseJSONToCSV(nData);
  
  // C. Empaquetar en un Blob comprimido ZIP único (Cumple con los requisitos solicitados)
  var stamp = Utilities.formatDate(new Date(), "America/Caracas", "yyyy-MM-dd_HH-mm");
  var zipName = "backup_nominales_" + stamp + ".zip";
  
  var blobs = [
    Utilities.newBlob(qCsv, 'text/csv', 'registros_quirurgicos.csv'),
    Utilities.newBlob(oCsv, 'text/csv', 'registros_obstetricos.csv'),
    Utilities.newBlob(dCsv, 'text/csv', 'registros_defunciones.csv'),
    Utilities.newBlob(nCsv, 'text/csv', 'nominales_temporal_vigente.csv')
  ];
  
  var zipBlob = Utilities.zip(blobs, zipName);
  
  // D. Subir el archivo resultante a la carpeta escolarizada de Google Drive
  var file = folder.createFile(zipBlob);
  Logger.log("Backup guardado de forma satisfactoria en Google Drive con ID: " + file.getId());
  
  // E. Adicionalmente de manera opcional, realizamos limpieza de nominales vencidos (> 7 días) desde el script
  limpiarNominalesAntiguosViaAPI();
  
  return file.getId();
}

// Convertir un arreglo JSON a String CSV sanitizando comas y saltos de línea
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
        // Escapar comillas y envolver
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

// Purgar nominales de más de 7 días directo vía API
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
  
  Logger.log("Limpieza de registros transitorios vencidos de 7 días en nominales efectuada.");
}

/**
 * Guarda el registro clínico de forma paralela en el documento Google Sheets Activo.
 */
function guardarEnGoogleSheet(tipo, payload) {
  var props = PropertiesService.getScriptProperties();
  // Se obtiene el ID de la hoja configurada o se usa por defecto el ID enviado por el usuario
  var spreadsheetId = props.getProperty('SPREADSHEET_ID') || "1WeJ4q40PcNrIi6e2Odi_LtiOq4LWx4qdYRwdE1RGTL0";
  
  if (!spreadsheetId) {
    Logger.log("No se definió 'SPREADSHEET_ID'. Omite sincronización directa.");
    return;
  }
  
  Logger.log("Sincronizando formulario con Google Spreadsheet ID: " + spreadsheetId);
  var ss = SpreadsheetApp.openById(spreadsheetId);
  
  // Nombre de la pestaña según el tipo
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
    // Si la pestaña no existe, se crea y configuran las cabeceras
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    // Negrita en las cabeceras para elegancia visual
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#EAEEF3");
  }
  
  sheet.appendRow(rowValues);
  Logger.log("Fila insertada con éxito en pestaña: " + sheetName);
}
