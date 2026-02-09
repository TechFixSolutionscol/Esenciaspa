/**
 * TestingDebug.gs
 * Script de testing y debugging para todas las fases
 * Esencia Spa - Sistema de Gestión
 */

/**
 * MENÚ DE TESTING
 * Este menú aparecerá en Google Sheets
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🧪 Testing & Debug')
    .addSubMenu(ui.createMenu('📊 FASE 0 - Datos')
      .addItem('✅ Validar Estructura de Hojas', 'testValidarEstructuraHojas')
      .addItem('📈 Mostrar Estadísticas', 'testMostrarEstadisticas'))
    .addSubMenu(ui.createMenu('📅 FASE 1 - Citas')
      .addItem('🧮 Test: Calcular Duración', 'testCalcularDuracion')
      .addItem('📅 Test: Verificar Calendar API', 'testCalendarAPI')
      .addItem('✨ Test: Crear Cita de Prueba', 'testCrearCitaPrueba')
      .addItem('🔍 Test: Listar Eventos Hoy', 'testListarEventosHoy'))
    .addSubMenu(ui.createMenu('📷 FASE 2 - Imágenes')
      .addItem('📁 Test: Verificar Carpeta Drive', 'testVerificarCarpetaDrive')
      .addItem('📋 Test: Listar Productos Sin Imagen', 'testListarProductosSinImagen')
      .addItem('🖼️ Test: Listar Catálogo Imágenes', 'testListarCatalogoImagenes'))
    .addSeparator()
    .addItem('🔧 Test Completo (Todas las Fases)', 'testCompleto')
    .addToUi();
}

// ========================================
// FASE 0: TESTING DE ESTRUCTURA DE DATOS
// ========================================

function testValidarEstructuraHojas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  const hojasRequeridas = ['Productos', 'Clientes', 'Citas', 'Cotizaciones', 'Categorias', 'Proveedores'];
  const resultado = {
    existentes: [],
    faltantes: []
  };
  
  hojasRequeridas.forEach(nombre => {
    if (ss.getSheetByName(nombre)) {
      resultado.existentes.push(nombre);
    } else {
      resultado.faltantes.push(nombre);
    }
  });
  
  let mensaje = '📊 VALIDACIÓN DE ESTRUCTURA\\n\\n';
  mensaje += `✅ Hojas existentes (${resultado.existentes.length}/${hojasRequeridas.length}):\\n`;
  mensaje += resultado.existentes.join(', ') + '\\n\\n';
  
  if (resultado.faltantes.length > 0) {
    mensaje += `❌ Hojas faltantes (${resultado.faltantes.length}):\\n`;
    mensaje += resultado.faltantes.join(', ');
  } else {
    mensaje += '✅ Todas las hojas requeridas existen';
  }
  
  ui.alert('Test: Estructura de Hojas', mensaje, ui.ButtonSet.OK);
  Logger.log(mensaje);
}

function testMostrarEstadisticas() {
  const datos = validarDatosExistentes();
  const ui = SpreadsheetApp.getUi();
  
  let mensaje = '📈 ESTADÍSTICAS DEL SISTEMA\\n\\n';
  
  Object.keys(datos).forEach(hoja => {
    const icono = datos[hoja] > 0 ? '✅' : '⚠️';
    mensaje += `${icono} ${hoja}: ${datos[hoja]} registros\\n`;
  });
  
  const total = Object.values(datos).reduce((a, b) => a + b, 0);
  mensaje += `\\n📊 Total de registros: ${total}`;
  
  ui.alert('Estadísticas', mensaje, ui.ButtonSet.OK);
  Logger.log(mensaje);
}

// ========================================
// FASE 1: TESTING DE SISTEMA DE CITAS
// ========================================

function testCalcularDuracion() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    // Obtener primer servicio de la hoja
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const productosSheet = ss.getSheetByName('Productos');
    const data = productosSheet.getDataRange().getValue();
    
    if (!data || data.length < 2) {
      ui.alert('Error', 'No hay servicios en la hoja Productos para probar', ui.ButtonSet.OK);
      return;
    }
    
    const headers = data[0];
    const primerRegistro = data[1];
    const servicioId = primerRegistro[headers.indexOf('id')];
    
    // Test sin retiro
    const resultado1 = calcularDuracionCita(servicioId, false);
    
    // Test con retiro
    const resultado2 = calcularDuracionCita(servicioId, true);
    
    let mensaje = '🧮 TEST: CÁLCULO DE DURACIÓN\\n\\n';
    
    if (resultado1.success) {
      mensaje += `Servicio: ${resultado1.servicioNombre}\\n`;
      mensaje += `Duración base: ${resultado1.duracionBase} min\\n`;
      mensaje += `Con retiro: ${resultado2.duracionTotal} min\\n`;
      mensaje += `Sin retiro: ${resultado1.duracionTotal} min\\n`;
      mensaje += '\\n✅ Cálculo funcionando correctamente';
    } else {
      mensaje += `❌ Error: ${resultado1.error}\\n\\n`;
      mensaje += 'Posibles causas:\\n';
      mensaje += '- Servicio no tiene duracion_base_minutos configurada\\n';
      mensaje += '- Falta columna duracion_base_minutos en Productos';
    }
    
    ui.alert('Test: Cálculo de Duración', mensaje, ui.ButtonSet.OK);
    Logger.log(mensaje);
    
  } catch (e) {
    ui.alert('Error', 'Error en test: ' + e.message, ui.ButtonSet.OK);
    Logger.log('Error testCalcularDuracion: ' + e);
  }
}

function testCalendarAPI() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    // Intentar listar eventos de hoy
    const hoy = Utilities.formatDate(new Date(), 'America/Bogota', 'yyyy-MM-dd');
    const eventos = getEventosDelDia(hoy);
    
    let mensaje = '📅 TEST: CALENDAR API\\n\\n';
    mensaje += `Calendario ID: ${CALENDAR_ID}\\n`;
    mensaje += `Fecha de prueba: ${hoy}\\n`;
    mensaje += `Eventos encontrados: ${eventos.length}\\n\\n`;
    
    if (eventos.length > 0) {
      mensaje += 'Eventos:\\n';
      eventos.forEach((e, i) => {
        mensaje += `${i + 1}. ${e.titulo}\\n`;
      });
    }
    
    mensaje += '\\n✅ Calendar API funcionando correctamente';
    
    ui.alert('Test: Calendar API', mensaje, ui.ButtonSet.OK);
    Logger.log(mensaje);
    
  } catch (e) {
    let mensaje = '❌ ERROR EN CALENDAR API\\n\\n';
    mensaje += `Error: ${e.message}\\n\\n`;
    mensaje += 'Posibles causas:\\n';
    mensaje += '- Calendar API no activada\\n';
    mensaje += '- Permisos no autorizados\\n';
    mensaje += '- CALENDAR_ID incorrecto en CalendarAPI.gs';
    
    ui.alert('Error: Calendar API', mensaje, ui.ButtonSet.OK);
    Logger.log('Error testCalendarAPI: ' + e);
  }
}

function testCrearCitaPrueba() {
  const ui = SpreadsheetApp.getUi();
  
  const respuesta = ui.alert(
    'Test: Crear Cita de Prueba',
    '¿Desea crear una cita de prueba?\\n\\nSe creará:\\n- Evento en Calendar\\n- Registro en hoja Citas\\n- Cliente de prueba',
    ui.ButtonSet.YES_NO
  );
  
  if (respuesta !== ui.Button.YES) {
    return;
  }
  
  try {
    // Obtener primer servicio
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const productosSheet = ss.getSheetByName('Productos');
    const data = productosSheet.getDataRange().getValues();
    
    if (data.length < 2) {
      ui.alert('Error', 'No hay servicios para crear cita de prueba', ui.ButtonSet.OK);
      return;
    }
    
    const headers = data[0];
    const servicioId = data[1][headers.indexOf('id')];
    
    // Crear cita mañana a las 10:00
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const fechaCita = Utilities.formatDate(manana, 'America/Bogota', 'yyyy-MM-dd');
    
    const citaData = {
      servicio_id: servicioId,
      fecha: fechaCita,
      hora_inicio: '10:00',
      cliente_nombre: 'Test Cliente',
      cliente_telefono: '3001234567',
      cliente_email: 'test@esenciaspa.com',
      observaciones: 'Cita de prueba del sistema',
      requiere_retiro: false
    };
    
    const resultado = crearCita(citaData);
    
    let mensaje = '';
    
    if (resultado.success) {
      mensaje = '✅ CITA DE PRUEBA CREADA\\n\\n';
      mensaje += `ID Cita: ${resultado.citaId}\\n`;
      mensaje += `Cliente: ${resultado.clienteId} ${resultado.clienteEsNuevo ? '(Nuevo)' : '(Existente)'}\\n`;
      mensaje += `Fecha: ${fechaCita} ${citaData.hora_inicio}\\n`;
      mensaje += `Duración: ${resultado.duracion} min\\n`;
      mensaje += `Hora fin: ${resultado.horaFin}\\n\\n`;
      mensaje += 'Verificar:\\n';
      mensaje += '✓ Hoja Citas\\n';
      mensaje += '✓ Google Calendar\\n';
      mensaje += '✓ Email recibido (si tiene)';
    } else {
      mensaje = '❌ ERROR AL CREAR CITA\\n\\n';
      mensaje += `Error: ${resultado.message}\\n`;
      mensaje += `Detalles: ${resultado.error || 'N/A'}`;
    }
    
    ui.alert('Test: Crear Cita de Prueba', mensaje, ui.ButtonSet.OK);
    Logger.log(mensaje);
    
  } catch (e) {
    ui.alert('Error', 'Error al crear cita de prueba: ' + e.message, ui.ButtonSet.OK);
    Logger.log('Error testCrearCitaPrueba: ' + e);
  }
}

function testListarEventosHoy() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    const hoy = Utilities.formatDate(new Date(), 'America/Bogota', 'yyyy-MM-dd');
    const eventos = getEventosDelDia(hoy);
    
    let mensaje = `📅 EVENTOS DE HOY (${hoy})\\n\\n`;
    
    if (eventos.length === 0) {
      mensaje += 'No hay eventos programados para hoy.';
    } else {
      mensaje += `Total de eventos: ${eventos.length}\\n\\n`;
      eventos.forEach((e, i) => {
        const inicio = new Date(e.inicio);
        const horaInicio = Utilities.formatDate(inicio, 'America/Bogota', 'HH:mm');
        mensaje += `${i + 1}. ${horaInicio} - ${e.titulo}\\n`;
      });
    }
    
    ui.alert('Eventos de Hoy', mensaje, ui.ButtonSet.OK);
    Logger.log(mensaje);
    
  } catch (e) {
    ui.alert('Error', 'Error al listar eventos: ' + e.message, ui.ButtonSet.OK);
    Logger.log('Error testListarEventosHoy: ' + e);
  }
}

// ========================================
// FASE 2: TESTING DE GESTIÓN DE IMÁGENES
// ========================================

function testVerificarCarpetaDrive() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const archivos = folder.getFiles();
    
    let count = 0;
    while (archivos.hasNext()) {
      archivos.next();
      count++;
    }
    
    let mensaje = '📁 TEST: CARPETA DRIVE\\n\\n';
    mensaje += `Carpeta ID: ${DRIVE_FOLDER_ID}\\n`;
    mensaje += `Nombre: ${folder.getName()}\\n`;
    mensaje += `Archivos: ${count}\\n`;
    mensaje += `URL: ${folder.getUrl()}\\n\\n`;
    mensaje += '✅ Carpeta accesible correctamente';
    
    ui.alert('Test: Carpeta Drive', mensaje, ui.ButtonSet.OK);
    Logger.log(mensaje);
    
  } catch (e) {
    let mensaje = '❌ ERROR AL ACCEDER A CARPETA DRIVE\\n\\n';
    mensaje += `Error: ${e.message}\\n\\n`;
    mensaje += 'Posibles causas:\\n';
    mensaje += '- DRIVE_FOLDER_ID incorrecto en DriveManager.gs\\n';
    mensaje += '- Drive API no activada\\n';
    mensaje += '- Permisos no autorizados\\n';
    mensaje += '- Carpeta eliminada';
    
    ui.alert('Error: Carpeta Drive', mensaje, ui.ButtonSet.OK);
    Logger.log('Error testVerificarCarpetaDrive: ' + e);
  }
}

function testListarProductosSinImagen() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    const productos = getProductosSinImagen();
    
    let mensaje = `⚠️ PRODUCTOS SIN IMAGEN\\n\\n`;
    mensaje += `Total: ${productos.length}\\n\\n`;
    
    if (productos.length === 0) {
      mensaje += '✅ Todos los productos tienen imagen';
    } else {
      productos.slice(0, 10).forEach((p, i) => {
        mensaje += `${i + 1}. ${p.nombre} (${p.tipo || 'N/A'})\\n`;
      });
      
      if (productos.length > 10) {
        mensaje += `\\n... y ${productos.length - 10} más`;
      }
    }
    
    ui.alert('Productos Sin Imagen', mensaje, ui.ButtonSet.OK);
    Logger.log(mensaje);
    
  } catch (e) {
    ui.alert('Error', 'Error al listar productos: ' + e.message, ui.ButtonSet.OK);
    Logger.log('Error testListarProductosSinImagen: ' + e);
  }
}

function testListarCatalogoImagenes() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    const catalogo = listarImagenesCatalogo();
    
    let mensaje = `🖼️ CATÁLOGO DE IMÁGENES\\n\\n`;
    mensaje += `Total de productos con imagen: ${catalogo.length}\\n\\n`;
    
    if (catalogo.length === 0) {
      mensaje += '⚠️ No hay productos con imagen aún';
    } else {
      catalogo.slice(0, 10).forEach((p, i) => {
        mensaje += `${i + 1}. ${p.nombre} (${p.tipo || 'N/A'})\\n`;
      });
      
      if (catalogo.length > 10) {
        mensaje += `\\n... y ${catalogo.length - 10} más`;
      }
    }
    
    ui.alert('Catálogo de Imágenes', mensaje, ui.ButtonSet.OK);
    Logger.log(mensaje);
    
  } catch (e) {
    ui.alert('Error', 'Error al listar catálogo: ' + e.message, ui.ButtonSet.OK);
    Logger.log('Error testListarCatalogoImagenes: ' + e);
  }
}

// ========================================
// TEST COMPLETO: TODAS LAS FASES
// ========================================

function testCompleto() {
  const ui = SpreadsheetApp.getUi();
  
  ui.alert(
    'Test Completo',
    'Se ejecutarán todos los tests.\\nRevise los logs para ver resultados detallados.\\n\\nEsto puede tomar un momento...',
    ui.ButtonSet.OK
  );
  
  Logger.log('========================================');
  Logger.log('🧪 INICIANDO TEST COMPLETO');
  Logger.log('========================================');
  
  let resultados = {
    exitosos: 0,
    fallidos: 0,
    errores: []
  };
  
  // Test FASE 0
  try {
    Logger.log('\\n📊 FASE 0: Estructura de Datos');
    validarDatosExistentes();
    resultados.exitosos++;
  } catch (e) {
    resultados.fallidos++;
    resultados.errores.push('FASE 0: ' + e.message);
  }
  
  // Test FASE 1
  try {
    Logger.log('\\n📅 FASE 1: Sistema de Citas');
    getEventosDelDia(Utilities.formatDate(new Date(), 'America/Bogota', 'yyyy-MM-dd'));
    resultados.exitosos++;
  } catch (e) {
    resultados.fallidos++;
    resultados.errores.push('FASE 1: ' + e.message);
  }
  
  // Test FASE 2
  try {
    Logger.log('\\n📷 FASE 2: Gestión de Imágenes');
    DriveApp.getFolderById(DRIVE_FOLDER_ID);
    resultados.exitosos++;
  } catch (e) {
    resultados.fallidos++;
    resultados.errores.push('FASE 2: ' + e.message);
  }
  
  Logger.log('\\n========================================');
  Logger.log('📊 RESUMEN DE TESTS');
  Logger.log(`✅ Exitosos: ${resultados.exitosos}`);
  Logger.log(`❌ Fallidos: ${resultados.fallidos}`);
  if (resultados.errores.length > 0) {
    Logger.log('\\nErrores:');
    resultados.errores.forEach((e, i) => {
      Logger.log(`${i + 1}. ${e}`);
    });
  }
  Logger.log('========================================');
  
  let mensaje = `📊 TEST COMPLETO FINALIZADO\\n\\n`;
  mensaje += `✅ Exitosos: ${resultados.exitosos}\\n`;
  mensaje += `❌ Fallidos: ${resultados.fallidos}\\n\\n`;
  
  if (resultados.fallidos === 0) {
    mensaje += '🎉 ¡Todos los tests pasaron correctamente!';
  } else {
    mensaje += 'Revise los logs (Ver → Registros) para más detalles.';
  }
  
  ui.alert('Test Completo', mensaje, ui.ButtonSet.OK);
}
