/**
 * FASE 0 - Script de Migración de Datos
 * Esencia Spa - Sistema de Gestión
 * 
 * IMPORTANTE: Este script agrega columnas SIN eliminar datos existentes
 * Ejecutar ANTES de crear las hojas nuevas
 */

/**
 * 1. BACKUP - Crear copia de seguridad completa
 */
function crearBackupCompleto() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const nombreBackup = `BACKUP_${new Date().toISOString().split('T')[0]}_${ss.getName()}`;
  
  try {
    const backup = ss.copy(nombreBackup);
    const backupUrl = backup.getUrl();
    
    Logger.log('✅ BACKUP CREADO EXITOSAMENTE');
    Logger.log(`Nombre: ${nombreBackup}`);
    Logger.log(`URL: ${backupUrl}`);
    
    // Mostrar mensaje al usuario
    SpreadsheetApp.getUi().alert(
      '✅ Backup Creado',
      `Se ha creado una copia de seguridad:\n\n${nombreBackup}\n\nURL: ${backupUrl}\n\nGuarde este enlace en un lugar seguro.`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    return { success: true, url: backupUrl, nombre: nombreBackup };
  } catch (e) {
    Logger.log('❌ Error creando backup: ' + e);
    SpreadsheetApp.getUi().alert('Error', 'No se pudo crear el backup: ' + e.message, SpreadsheetApp.getUi().ButtonSet.OK);
    return { success: false, error: e.message };
  }
}

/**
 * 2. VALIDACIÓN - Contar registros antes de migración
 */
function validarDatosExistentes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const reporte = {
    Productos: 0,
    Categorias: 0,
    Clientes: 0,
    Proveedores: 0,
    Ventas: 0,
    Compras: 0,
    Usuarios: 0
  };
  
  Object.keys(reporte).forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      const lastRow = sheet.getLastRow();
      reporte[sheetName] = lastRow > 1 ? lastRow - 1 : 0; // -1 por header
    }
  });
  
  Logger.log('📊 DATOS EXISTENTES:');
  Logger.log(JSON.stringify(reporte, null, 2));
  
  return reporte;
}

/**
 * 3. MIGRACIÓN PRODUCTOS - Agregar columnas para imágenes y duración
 */
function migrarHojaProductos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Productos');
  
  if (!sheet) {
    Logger.log('⚠️ Hoja Productos no encontrada');
    return { success: false, message: 'Hoja Productos no existe' };
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const lastRow = sheet.getLastRow();
  let columnasAgregadas = [];
  
  // Agregar imagen_url
  if (!headers.includes('imagen_url')) {
    sheet.insertColumnAfter(sheet.getLastColumn());
    sheet.getRange(1, sheet.getLastColumn()).setValue('imagen_url');
    columnasAgregadas.push('imagen_url');
  }
  
  // Agregar imagen_drive_id
  if (!headers.includes('imagen_drive_id')) {
    sheet.insertColumnAfter(sheet.getLastColumn());
    sheet.getRange(1, sheet.getLastColumn()).setValue('imagen_drive_id');
    columnasAgregadas.push('imagen_drive_id');
  }
  
  // Agregar duracion_base_minutos
  if (!headers.includes('duracion_base_minutos')) {
    sheet.insertColumnAfter(sheet.getLastColumn());
    sheet.getRange(1, sheet.getLastColumn()).setValue('duracion_base_minutos');
    columnasAgregadas.push('duracion_base_minutos');
  }
  
  // Agregar duracion_retiro_minutos
  if (!headers.includes('duracion_retiro_minutos')) {
    sheet.insertColumnAfter(sheet.getLastColumn());
    sheet.getRange(1, sheet.getLastColumn()).setValue('duracion_retiro_minutos');
    
    // Valor por defecto: 0
    if (lastRow > 1) {
      sheet.getRange(2, sheet.getLastColumn(), lastRow - 1, 1).setValue(0);
    }
    columnasAgregadas.push('duracion_retiro_minutos');
  }
  
  // Agregar requiere_retiro_opcional
  if (!headers.includes('requiere_retiro_opcional')) {
    sheet.insertColumnAfter(sheet.getLastColumn());
    sheet.getRange(1, sheet.getLastColumn()).setValue('requiere_retiro_opcional');
    
    // Valor por defecto: FALSE
    if (lastRow > 1) {
      sheet.getRange(2, sheet.getLastColumn(), lastRow - 1, 1).setValue(false);
    }
    columnasAgregadas.push('requiere_retiro_opcional');
  }
  
  // Agregar es_servicio
  if (!headers.includes('es_servicio')) {
    sheet.insertColumnAfter(sheet.getLastColumn());
    sheet.getRange(1, sheet.getLastColumn()).setValue('es_servicio');
    
    // Valor por defecto: PRODUCTO (todos los existentes)
    if (lastRow > 1) {
      sheet.getRange(2, sheet.getLastColumn(), lastRow - 1, 1).setValue('PRODUCTO');
    }
    columnasAgregadas.push('es_servicio');
  }
  
  Logger.log(`✅ Productos migrado. Columnas agregadas: ${columnasAgregadas.join(', ')}`);
  return { success: true, columnasAgregadas: columnasAgregadas };
}

/**
 * 4. MIGRACIÓN CLIENTES - Agregar campos CRM
 */
function migrarHojaClientes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Clientes');
  
  if (!sheet) {
    Logger.log('⚠️ Hoja Clientes no encontrada');
    return { success: false, message: 'Hoja Clientes no existe' };
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const lastRow = sheet.getLastRow();
  let columnasAgregadas = [];
  
  const nuevasCols = ['email', 'fecha_cumpleanos', 'observaciones', 'fecha_registro', 'total_servicios', 'ultima_visita'];
  
  nuevasCols.forEach(col => {
    if (!headers.includes(col)) {
      sheet.insertColumnAfter(sheet.getLastColumn());
      sheet.getRange(1, sheet.getLastColumn()).setValue(col);
      
      // Valores por defecto
      if (lastRow > 1) {
        if (col === 'fecha_registro') {
          sheet.getRange(2, sheet.getLastColumn(), lastRow - 1, 1).setValue(new Date());
        } else if (col === 'total_servicios') {
          sheet.getRange(2, sheet.getLastColumn(), lastRow - 1, 1).setValue(0);
        }
      }
      
      columnasAgregadas.push(col);
    }
  });
  
  Logger.log(`✅ Clientes migrado. Columnas agregadas: ${columnasAgregadas.join(', ')}`);
  return { success: true, columnasAgregadas: columnasAgregadas };
}

/**
 * 5. CREAR HOJA CITAS
 */
function crearHojaCitas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (ss.getSheetByName('Citas')) {
    Logger.log('⚠️ La hoja Citas ya existe');
    return { success: false, message: 'La hoja ya existe' };
  }
  
  const sheet = ss.insertSheet('Citas');
  
  const headers = [
    'id', 'cliente_id', 'servicio_id', 'fecha', 'hora_inicio', 'hora_fin',
    'duracion_min', 'estado', 'calendar_event_id', 'metodo_pago', 'total',
    'observaciones', 'created_at', 'updated_at'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#4285f4');
  sheet.getRange(1, 1, 1, headers.length).setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  
  Logger.log('✅ Hoja Citas creada correctamente');
  return { success: true };
}

/**
 * 6. CREAR HOJA COTIZACIONES
 */
function crearHojaCotizaciones() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (ss.getSheetByName('Cotizaciones')) {
    Logger.log('⚠️ La hoja Cotizaciones ya existe');
    return { success: false, message: 'La hoja ya existe' };
  }
  
  const sheet = ss.insertSheet('Cotizaciones');
  
  const headers = [
    'id', 'cita_id', 'cliente_id', 'items_json', 'subtotal', 'iva', 'total',
    'estado', 'fecha_creacion', 'fecha_conversion', 'converted_to_venta_id'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#0f9d58');
  sheet.getRange(1, 1, 1, headers.length).setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  
  Logger.log('✅ Hoja Cotizaciones creada correctamente');
  return { success: true };
}

/**
 * 🚀 EJECUTAR MIGRACIÓN COMPLETA
 * 
 * Este es el script principal que ejecuta todo el proceso
 */
function ejecutarMigracionFase0() {
  Logger.log('═══════════════════════════════════════');
  Logger.log('🚀 INICIANDO MIGRACIÓN FASE 0');
  Logger.log('═══════════════════════════════════════');
  
  const ui = SpreadsheetApp.getUi();
  const respuesta = ui.alert(
    '⚠️ MIGRACIÓN FASE 0',
    '¿Está seguro de iniciar la migración?\n\n' +
    'Este proceso:\n' +
    '1. Creará un backup completo\n' +
    '2. Agregará columnas nuevas a Productos y Clientes\n' +
    '3. Creará hojas Citas y Cotizaciones\n\n' +
    'NO se perderán datos existentes.',
    ui.ButtonSet.YES_NO
  );
  
  if (respuesta !== ui.Button.YES) {
    Logger.log('❌ Migración cancelada por el usuario');
    return;
  }
  
  // 1. BACKUP
  Logger.log('\n📦 Paso 1: Creando backup...');
  const backup = crearBackupCompleto();
  if (!backup.success) {
    ui.alert('Error', 'No se pudo crear el backup. Migración abortada.', ui.ButtonSet.OK);
    return;
  }
  
  // 2. VALIDAR DATOS INICIALES
  Logger.log('\n📊 Paso 2: Validando datos existentes...');
  const datosInicio = validarDatosExistentes();
  
  // 3. MIGRAR PRODUCTOS
  Logger.log('\n🔧 Paso 3: Migrando hoja Productos...');
  const resultProductos = migrarHojaProductos();
  
  // 4. MIGRAR CLIENTES
  Logger.log('\n👥 Paso 4: Migrando hoja Clientes...');
  const resultClientes = migrarHojaClientes();
  
  // 5. CREAR CITAS
  Logger.log('\n📅 Paso 5: Creando hoja Citas...');
  const resultCitas = crearHojaCitas();
  
  // 6. CREAR COTIZACIONES
  Logger.log('\n📋 Paso 6: Creando hoja Cotizaciones...');
  const resultCotizaciones = crearHojaCotizaciones();
  
  // 7. VALIDAR DATOS FINALES
  Logger.log('\n✅ Paso 7: Validando integridad de datos...');
  const datosFin = validarDatosExistentes();
  
  // 8. COMPARAR
  let integridadOK = true;
  Object.keys(datosInicio).forEach(hoja => {
    if (datosInicio[hoja] !== datosFin[hoja]) {
      Logger.log(`⚠️ ADVERTENCIA: ${hoja} cambió de ${datosInicio[hoja]} a ${datosFin[hoja]} registros`);
      integridadOK = false;
    }
  });
  
  // REPORTE FINAL
  Logger.log('\n═══════════════════════════════════════');
  if (integridadOK) {
    Logger.log('✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
    Logger.log('✅ NO SE PERDIERON DATOS');
    
    ui.alert(
      '✅ Migración Exitosa',
      'La migración se completó correctamente.\n\n' +
      `Backup: ${backup.nombre}\n\n` +
      'Columnas agregadas:\n' +
      `- Productos: ${resultProductos.columnasAgregadas ? resultProductos.columnasAgregadas.join(', ') : 'ninguna'}\n` +
      `- Clientes: ${resultClientes.columnasAgregadas ? resultClientes.columnasAgregadas.join(', ') : 'ninguna'}\n\n` +
      'Hojas creadas: Citas, Cotizaciones\n\n' +
      '✅ Integridad de datos: VERIFICADA',
      ui.ButtonSet.OK
    );
  } else {
    Logger.log('⚠️ MIGRACIÓN COMPLETADA CON ADVERTENCIAS');
    Logger.log(`URL del backup: ${backup.url}`);
    
    ui.alert(
      '⚠️ Advertencia',
      'La migración se completó pero hay cambios en el conteo de registros.\n\n' +
      'Revise el log de ejecución para detalles.\n\n' +
      `Backup disponible en: ${backup.nombre}`,
      ui.ButtonSet.OK
    );
  }
  Logger.log('═══════════════════════════════════════');
}

/**
 * CREAR MENÚ PERSONALIZADO
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🌸 Esencia Spa - Migración')
    .addItem('📦 Crear Backup', 'crearBackupCompleto')
    .addItem('📊 Validar Datos', 'validarDatosExistentes')
    .addSeparator()
    .addItem('🚀 Ejecutar Migración Completa', 'ejecutarMigracionFase0')
    .addToUi();
}
