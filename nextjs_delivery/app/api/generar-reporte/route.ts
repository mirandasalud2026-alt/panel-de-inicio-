import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';
import { GoogleApis } from 'googleapis';

const google = new GoogleApis();

// 1. Obtener variáveis de entorno con lazyness
const getEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta configurar la variable de entorno: ${name}`);
  }
  return value;
};

// 2. Inicializar cliente Supabase con token de Service Role (opcional si es para admin) o Anon Key 
const getSupabase = () => {
  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return createClient(supabaseUrl, supabaseKey);
};

// 3. Crear cliente OAuth2 de Google
const getGoogleDriveClient = () => {
  const clientId = getEnvVar('GOOGLE_CLIENT_ID');
  const clientSecret = getEnvVar('GOOGLE_CLIENT_SECRET');
  const refreshToken = getEnvVar('GOOGLE_REFRESH_TOKEN');

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: 'v3', auth: oauth2Client });
};

// POST o GET: app/api/generar-reporte/route.ts
export async function POST(req: NextRequest) {
  try {
    // A. Validar cuerpo de la petición
    const body = await req.json().catch(() => ({}));
    const { 
      tabla = 'nominales', 
      fecha_inicio, 
      fecha_fin 
    } = body;

    const TABLAS_PERMITIDAS = ['nominales', 'registros_quirurgicos', 'registros_obstetricos', 'registros_defunciones'];
    if (!TABLAS_PERMITIDAS.includes(tabla)) {
      return NextResponse.json(
        { success: false, message: `La tabla especificada '${tabla}' no es permitida.` },
        { status: 400 }
      );
    }

    // B. Consultas paginadas sobre Supabase para evitar limitaciones de registros de gran escala (>500)
    const supabase = getSupabase();
    let allRecords: any[] = [];
    let hasMore = true;
    let page = 0;
    const limit = 500;

    // Aplicar filtros opcionales de rango de fecha
    let queryBuilder = supabase.from(tabla).select('*', { count: 'exact' });
    if (fecha_inicio) {
      queryBuilder = queryBuilder.gte('fecha', fecha_inicio);
    }
    if (fecha_fin) {
      queryBuilder = queryBuilder.lte('fecha', fecha_fin);
    }

    while (hasMore) {
      const from = page * limit;
      const to = from + limit - 1;

      // Obtener lote
      const { data, error } = await queryBuilder
        .range(from, to)
        .order('id', { ascending: true });

      if (error) {
        throw new Error(`Error consultando base de datos: ${error.message}`);
      }

      if (data && data.length > 0) {
        allRecords = [...allRecords, ...data];
        page++;
        // Si el lote trajo menos que el límite, hemos terminado
        if (data.length < limit) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    if (allRecords.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No existen registros en el rango de fechas especificado para generar el reporte.'
      }, { status: 404 });
    }

    // C. GENERACIÓN EXCEL CON EXCELJS (Alineaciones, colores institucionales, auto-ancho y JSON expandido)
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Dirección de Salud Miranda';
    workbook.lastModifiedBy = 'Miranda Salud Sync';
    workbook.created = new Date();

    const sheetName = tabla.toUpperCase().substring(0, 30);
    const worksheet = workbook.addWorksheet(sheetName);

    // Titulado Institucional superior
    worksheet.mergeCells('A1:J1');
    const headerTitleCell = worksheet.getCell('A1');
    headerTitleCell.value = 'GOBERNACIÓN DEL ESTADO BOLIVARIANO DE MIRANDA - DIRECCIÓN DE SALUD';
    headerTitleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    headerTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0B3D5C' } // Color Institucional Azul Miranda
    };
    headerTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 35;

    worksheet.mergeCells('A2:J2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = `REPORTE NOMINAL DE EVENTOS CLÍNICOS: ${tabla.toUpperCase()} (GENERADO EL ${new Date().toLocaleString()})`;
    subtitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF333333' } };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 20;

    // Espaciado vacio
    worksheet.getRow(3).values = [];

    // Descubrir claves ordenadas e incluir JSON expandido para la tabla "nominales"
    // De este modo evitamos que el JSON se muestre plano "[object Object]"
    const sampleRow = allRecords[0];
    const columnsHeader: string[] = [];
    const columnsKeys: string[] = [];

    Object.keys(sampleRow).forEach(key => {
      if (key === 'datos' && tabla === 'nominales') {
        // Expandir recursivamente las llaves del JSON bitoacora contenido en "datos"
        const subsetKeys = new Set<string>();
        allRecords.forEach(rec => {
          if (rec.datos && typeof rec.datos === 'object') {
            Object.keys(rec.datos).forEach(subK => subsetKeys.add(subK));
          }
        });
        subsetKeys.forEach(subK => {
          columnsKeys.push(`_json_${subK}`);
          columnsHeader.push(`DATOS_${subK.toUpperCase()}`);
        });
      } else {
        columnsKeys.push(key);
        columnsHeader.push(key.toUpperCase());
      }
    });

    // Añadir línea de cabeceras en Row 4
    const headerRowNumber = 4;
    const headerRow = worksheet.getRow(headerRowNumber);
    headerRow.values = columnsHeader;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1E293B' } // Gris oscuro elegante para cabecera de datos
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'medium' },
        right: { style: 'thin' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    });
    headerRow.height = 25;

    // Rellenar filas de datos
    allRecords.forEach((record, index) => {
      const dataRowValues = columnsKeys.map(key => {
        if (key.startsWith('_json_')) {
          const actualKey = key.replace('_json_', '');
          const val = record.datos ? record.datos[actualKey] : null;
          return val !== null && typeof val === 'object' ? JSON.stringify(val) : val;
        }
        const cellValue = record[key];
        // Formatear objetos genéricos para que no queden sin parsear
        return cellValue !== null && typeof cellValue === 'object' ? JSON.stringify(cellValue) : cellValue;
      });

      const nextRow = worksheet.addRow(dataRowValues);
      
      // Estilo de banda cebra alternado para los datos clínicos
      const isEven = index % 2 === 0;
      nextRow.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 9 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
        if (isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' } // Fondo suave de alternancia
          };
        }
      });
      nextRow.height = 18;
    });

    // Ajustar anchos automáticos de columnas basado en contenido + padding mínimo de 4
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell?.((cell, rowNum) => {
        if (rowNum > 2) { // Evitamos medir el banner corporativo de las líneas 1-2
          const valueStr = cell.value ? String(cell.value) : '';
          if (valueStr.length > maxLength) {
            maxLength = valueStr.length;
          }
        }
      });
      column.width = Math.max(maxLength + 4, 12); // un ancho mínimo de 12 para legibilidad
    });

    // Escribir a un Buffer en memoria
    const buffer = await workbook.xlsx.writeBuffer();

    // D. CARGAR ARCHIVO EXCEL A GOOGLE DRIVE USANDO CLIENTE OAUTH2 CON REFRESH TOKEN
    const drive = getGoogleDriveClient();
    
    // Configurar metadatos del archivo Excel en la carpeta destino 
    const folderId = '19RTGSwQuisCSr1YLZrZX6ezngQ_69Mhv';
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 8);
    const fileName = `Reporte_Nominales_${tabla.toUpperCase()}_${timestamp}.xlsx`;

    // Convertir el ArrayBuffer a Readable Stream para que Google API lo acepte
    const { Readable } = require('stream');
    const fileStream = new Readable();
    fileStream.push(buffer);
    fileStream.push(null);

    const driveResponse = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        parents: [folderId]
      },
      media: {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: fileStream
      }
    });

    return NextResponse.json({
      success: true,
      message: '¡Fichero nominal compilado y respaldado en Google Drive de forma exitosa!',
      fileId: driveResponse.data.id,
      fileName: fileName,
      recordsCount: allRecords.length
    });

  } catch (err: any) {
    console.error('Error en API generar-reporte:', err);
    return NextResponse.json({
      success: false,
      message: err.message || 'Error interno del servidor al procesar el reporte clínicos y respaldar en Drive.'
    }, { status: 500 });
  }
}
