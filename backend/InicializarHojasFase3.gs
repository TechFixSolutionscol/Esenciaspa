/**
 * Script para agregar hojas de Fase 3 sin borrar datos existentes
 * Esencia Spa - Sistema de Gestión
 * 
 * INSTRUCCIONES:
 * 1. Abre tu Google Sheet de Esencia Spa
 * 2. Ve a Extensiones > Apps Script
 * 3. Crea un nuevo archivo temporal y pega este código
 * 4. Ejecuta la función: inicializarHojasFase3()
 * 5. Revisa los logs para ver qué hojas se crearon
 * 6. Elimina este archivo temporal después de ejecutarlo
 */

function inicializarHojasFase3() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const resultados = [];
  
  // Definir las hojas necesarias para Fase 3
  const hojasNecesarias = [
    {
      nombre: 'Citas',
      headers: [
        'cita_id',
        'cliente_id',
        'servicio_id',
        'fecha',
        'hora_inicio',
        'hora_fin',
        'duracion_minutos',
        'estado',
        'observaciones',
        'requiere_retiro',
        'evento_calendar_id',
        'fecha_creacion'
      ]
    },
    {
      nombre: 'Cotizaciones',
      headers: [
        'cotizacion_id',
        'cita_id',
        'cliente_id',
        'items_json',
        'subtotal',
        'iva',
        'total',
        'estado',
        'fecha_creacion',
        'fecha_conversion',
        'converted_to_venta_id'
      ]
    }
  ];
  
  // Verificar y crear cada hoja
  hojasNecesarias.forEach(hoja => {
    const sheetExistente = ss.getSheetByName(hoja.nombre);
    
    if (sheetExistente) {
      // La hoja ya existe, verificar si tiene encabezados
      if (sheetExistente.getLastRow() === 0) {
        // Hoja vacía, agregar encabezados
        sheetExistente.getRange(1, 1, 1, hoja.headers.length).setValues([hoja.headers]);
        sheetExistente.setFrozenRows(1);
        resultados.push(`✅ Hoja '${hoja.nombre}' ya existía (vacía) - Encabezados agregados`);
      } else {
        // Hoja con datos, no tocar
        resultados.push(`ℹ️ Hoja '${hoja.nombre}' ya existe con datos - NO modificada`);
      }
    } else {
      // Crear nueva hoja
      const nuevaHoja = ss.insertSheet(hoja.nombre);
      nuevaHoja.getRange(1, 1, 1, hoja.headers.length).setValues([hoja.headers]);
      nuevaHoja.setFrozenRows(1);
      
      // Formatear encabezados
      const headerRange = nuevaHoja.getRange(1, 1, 1, hoja.headers.length);
      headerRange.setBackground('#4a86e8');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
      
      resultados.push(`🆕 Hoja '${hoja.nombre}' creada exitosamente`);
    }
  });
  
  // Verificar que la hoja Clientes tenga los campos necesarios
  verificarHojaClientes(ss, resultados);
  
  // Mostrar resultados
  Logger.log('\n=== RESULTADOS DE INICIALIZACIÓN FASE 3 ===\n');
  resultados.forEach(msg => Logger.log(msg));
  Logger.log('\n=== FIN ===\n');
  
  // Mostrar alerta al usuario
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Inicialización Fase 3 Completada',
    resultados.join('\n'),
    ui.ButtonSet.OK
  );
  
  return { success: true, resultados: resultados };
}

/**
 * Verificar que la hoja Clientes tenga los campos necesarios
 */
function verificarHojaClientes(ss, resultados) {
  const clientesSheet = ss.getSheetByName('Clientes');
  
  if (!clientesSheet) {
    // Crear hoja Clientes si no existe
    const nuevaHoja = ss.insertSheet('Clientes');
    const headers = ['id', 'nombre', 'telefono', 'email', 'fecha_creacion'];
    nuevaHoja.getRange(1, 1, 1, headers.length).setValues([headers]);
    nuevaHoja.setFrozenRows(1);
    
    // Formatear
    const headerRange = nuevaHoja.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#4a86e8');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    
    resultados.push('🆕 Hoja "Clientes" creada');
  } else {
    // Verificar que tenga los campos necesarios
    const headers = clientesSheet.getRange(1, 1, 1, clientesSheet.getLastColumn()).getValues()[0];
    const camposNecesarios = ['id', 'nombre', 'telefono', 'email'];
    const faltantes = camposNecesarios.filter(campo => !headers.includes(campo));
    
    if (faltantes.length > 0) {
      resultados.push(`⚠️ Hoja "Clientes" existe pero le faltan campos: ${faltantes.join(', ')}`);
      resultados.push('   → Agrégalos manualmente o contacta soporte');
    } else {
      resultados.push('✅ Hoja "Clientes" verificada - Todos los campos presentes');
    }
  }
}

/**
 * Función auxiliar: Ver estructura de hojas existentes
 */
function verEstructuraActual() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  
  Logger.log('\n=== ESTRUCTURA ACTUAL DEL SPREADSHEET ===\n');
  
  sheets.forEach(sheet => {
    const nombre = sheet.getName();
    const filas = sheet.getLastRow();
    const columnas = sheet.getLastColumn();
    
    let headers = [];
    if (filas > 0 && columnas > 0) {
      headers = sheet.getRange(1, 1, 1, columnas).getValues()[0];
    }
    
    Logger.log(`📄 ${nombre}`);
    Logger.log(`   Filas: ${filas}, Columnas: ${columnas}`);
    if (headers.length > 0) {
      Logger.log(`   Headers: ${headers.join(', ')}`);
    }
    Logger.log('');
  });
  
  Logger.log('=== FIN ===\n');
}
