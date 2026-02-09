/**
 * CotizacionesManager.gs
 * FASE 3 & 4: Gestión de Cotizaciones y Conversión a Venta
 * Esencia Spa - Sistema de Gestión
 */

/**
 * Crear cotización automática al crear cita
 * @param {Object} citaData - Datos de la cita recién creada
 * @returns {Object} { success, cotizacionId }
 */
function crearCotizacionAutomatica(citaData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const cotizacionesSheet = ss.getSheetByName('Cotizaciones');
    const productosSheet = ss.getSheetByName('Productos');
    
    // Buscar el servicio para obtener el precio
    const productosData = productosSheet.getDataRange().getValues();
    const productosHeaders = productosData[0];
    
    const idCol = productosHeaders.indexOf('id');
    const nombreCol = productosHeaders.indexOf('nombre');
    // CORRECCIÓN: Usar 'precio_venta' en lugar de 'precio'
    let precioCol = productosHeaders.indexOf('precio_venta');
    if (precioCol === -1) precioCol = productosHeaders.indexOf('precio'); // Fallback
    
    let servicio = null;
    for (let i = 1; i < productosData.length; i++) {
      if (productosData[i][idCol] === citaData.servicio_id) {
        servicio = {
          id: productosData[i][idCol],
          nombre: productosData[i][nombreCol],
          precio: parseFloat(productosData[i][precioCol]) || 0
        };
        break;
      }
    }
    
    if (!servicio) {
      Logger.log('⚠️ Servicio no encontrado para cotización');
      return { success: false, message: 'Servicio no encontrado' };
    }
    
    // Calcular totales
    const subtotal = servicio.precio;
    const iva = subtotal * 0.19; // 19% IVA
    const total = subtotal + iva;
    
    // Crear JSON de items
    const items = [{
      servicio_id: servicio.id,
      servicio_nombre: servicio.nombre,
      cantidad: 1,
      precio_unitario: servicio.precio,
      subtotal: servicio.precio
    }];
    
    const itemsJson = JSON.stringify(items);
    
    // Generar ID de cotización
    const cotizacionId = 'COT-' + new Date().getTime();
    
    // Registrar cotización
    cotizacionesSheet.appendRow([
      cotizacionId,
      citaData.cita_id,
      citaData.cliente_id,
      itemsJson,
      subtotal,
      iva,
      total,
      'Cotizada', // estado
      new Date(), // fecha_creacion
      null, // fecha_conversion
      null  // converted_to_venta_id
    ]);
    
    Logger.log(`✅ Cotización creada: ${cotizacionId} para cita ${citaData.cita_id}`);
    
    return {
      success: true,
      cotizacionId: cotizacionId,
      subtotal: subtotal,
      iva: iva,
      total: total,
      items: items
    };
    
  } catch (e) {
    Logger.log('Error crearCotizacionAutomatica: ' + e);
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * Obtener cotizaciones pendientes (estado: Cotizada)
 * @returns {Array} Lista de cotizaciones pendientes con info de cita y cliente
 */
function getCotizacionesPendientes() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Función helper para leer datos crudos rápidamente
    const getData = (name) => {
        const sheet = ss.getSheetByName(name);
        if (!sheet) return [];
        const rows = sheet.getDataRange().getValues();
        return rows.slice(1);
    };

    const cotData = getData('Cotizaciones');
    const citData = getData('Citas');
    const cliData = getData('Clientes');
    const prodData = getData('Productos');
    
    const cotizaciones = [];

    // --- ÍNDICES FIJOS (Validado con DebugHeaders) ---
    // Cotizaciones: [cotizacion_id, cita_id, cliente_id, items_json, sub, iva, total, estado]
    const IDX_COT_ID = 0;
    const IDX_COT_CITA_ID = 1;
    const IDX_COT_CLIENTE_ID = 2;
    const IDX_COT_ITEMS = 3;
    const IDX_COT_TOTAL = 6;
    const IDX_COT_ESTADO = 7;

    // Citas: [cita_id, cliente_id, servicio_id, fecha, hora_inicio, ...]
    const IDX_CIT_ID = 0;
    const IDX_CIT_SERVICIO = 2;
    const IDX_CIT_FECHA = 3;
    const IDX_CIT_HORA = 4;
    const IDX_CIT_ESTADO = 7;

    // Clientes: Detección ROBUSTA de columnas
    const sheetCli = ss.getSheetByName('Clientes');
    if (!sheetCli) return [];
    
    const cliValues = sheetCli.getDataRange().getValues();
    if (cliValues.length === 0) return [];
    
    const cliHeadRaw = cliValues[0].map(h => String(h).trim().toLowerCase());
    
    // Función helper para buscar índice
    const findCol = (aliases) => cliHeadRaw.findIndex(h => aliases.some(a => h.includes(a)));

    let IDX_CLI_ID = findCol(['id', 'código', 'codigo', 'documento']); // Prioriza ID
    if (IDX_CLI_ID === -1) IDX_CLI_ID = 0; // Fallback extremo a col A

    let IDX_CLI_NOMBRE = findCol(['nombre', 'cliente', 'nombres', 'razón social']);
    if (IDX_CLI_NOMBRE === -1) IDX_CLI_NOMBRE = 1; // Fallback extremo a col B

    let IDX_CLI_TEL = findCol(['telefono', 'teléfono', 'celular', 'whatsapp', 'movil']);
    if (IDX_CLI_TEL === -1) IDX_CLI_TEL = 2; // Fallback extremo a col C

    // cliData tiene los datos sin headers, así que usamos cliValues slice(1)
    const clientesSource = cliValues.slice(1);

    // Productos: [id, nombre]
    const IDX_PROD_ID = 0;
    const IDX_PROD_NOMBRE = 1;


    cotData.forEach(row => {
      const estado = String(row[IDX_COT_ESTADO] || '').trim();
      
      if (estado.toLowerCase() === 'cotizada') {
        const cotId = row[IDX_COT_ID];
        const citaId = String(row[IDX_COT_CITA_ID]).trim();
        const clienteId = String(row[IDX_COT_CLIENTE_ID]).trim();
        const total = row[IDX_COT_TOTAL];
        const itemsJson = row[IDX_COT_ITEMS];

        // 1. Buscar Cita
        const citaRow = citData.find(r => String(r[IDX_CIT_ID]).trim() === citaId);
        
        let fecha = '-';
        let hora = '-';
        let servicioNombre = '';
        let estadoCita = 'Pendiente';
        let debugMsg = '';

        if (citaRow) {
            // Fecha
            const fRaw = citaRow[IDX_CIT_FECHA];
            if (fRaw instanceof Date) fecha = Utilities.formatDate(fRaw, 'America/Bogota', 'yyyy-MM-dd');
            else fecha = String(fRaw).split('T')[0];

            // Hora
            const hRaw = citaRow[IDX_CIT_HORA];
            if (hRaw instanceof Date) hora = Utilities.formatDate(hRaw, 'America/Bogota', 'HH:mm');
            else hora = String(hRaw).replace(/.*1899.*T/, '').substring(0, 5);

            // Estado
            estadoCita = citaRow[IDX_CIT_ESTADO];

            // Servicio (Buscar nombre en Productos)
            const servId = String(citaRow[IDX_CIT_SERVICIO]).trim();
            const prodRow = prodData.find(p => String(p[IDX_PROD_ID]).trim() === servId);
            
            if (prodRow) servicioNombre = prodRow[IDX_PROD_NOMBRE];
            else servicioNombre = `ID: ${servId} (No en Prod)`;

        } else {
            debugMsg = `⚠️ Cita NO hallada: ${citaId}`;
            servicioNombre = debugMsg;
            fecha = 'Error';
        }

        // 2. Buscar Cliente (usando fuente dinámica)
        const cliRow = clientesSource.find(c => String(c[IDX_CLI_ID]).trim() === clienteId);
        const cliNombre = cliRow ? cliRow[IDX_CLI_NOMBRE] : `ID: ${clienteId}`;
        const cliTel = cliRow ? cliRow[IDX_CLI_TEL] : '';

        // Fallback Servicio
        if ((!servicioNombre || servicioNombre.startsWith('ID:')) && itemsJson && !debugMsg) {
             try {
                const items = JSON.parse(itemsJson);
                if (items[0]?.servicio_nombre) servicioNombre = items[0].servicio_nombre;
             } catch(e) {}
        }

        cotizaciones.push({
          cotizacion_id: cotId, // Frontend usa cot.cotizacion_id
          total: total,
          servicio_nombre: servicioNombre, // Frontend usa cot.servicio_nombre
          cita: {
              fecha: fecha,       // Frontend usa cot.cita.fecha
              hora_inicio: hora,  // Frontend usa cot.cita.hora_inicio
              estado: estadoCita  // Frontend usa cot.cita.estado
          },
          cliente: {
              nombre: cliNombre,  // Frontend usa cot.cliente.nombre
              telefono: cliTel    // Frontend usa cot.cliente.telefono
          }
        });
      }
    });
    
    return cotizaciones;
    
  } catch (e) {
    Logger.log('Error getCotizacionesPendientes: ' + e);
    return [];
  }
}

/**
 * Convertir cotización en venta
 * @returns {Object} { success, ventaId }
 */
function convertirCotizacionEnVenta(cotizacionId, ventaData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const cotizacionesSheet = ss.getSheetByName('Cotizaciones');
    const ventasSheet = ss.getSheetByName('Ventas');
    const citasSheet = ss.getSheetByName('Citas');
    
    const data = cotizacionesSheet.getDataRange().getValues();
    const headers = data[0];
    
    // CORRECCIÓN: Buscar 'cotizacion_id' o 'id'
    let idCol = headers.indexOf('cotizacion_id');
    if (idCol === -1) idCol = headers.indexOf('id');
    if (idCol === -1) idCol = 0; // Fallback a Columna A
    
    let cotizacion = null;
    let cotizacionRow = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === cotizacionId) {
        // Índices FIJOS para conversión segura
        cotizacion = {
            id: data[i][0],      // col A
            cita_id: data[i][1], // col B
            cliente_id: data[i][2], // col C
            items_json: data[i][3], // col D
            total: data[i][6],   // col G
            estado: data[i][7]   // col H
        };
        cotizacionRow = i + 1;
        break;
      }
    }
    
    if (!cotizacion) return { success: false, message: 'Cotización no encontrada' };
    if (cotizacion.estado !== 'Cotizada') return { success: false, message: 'Ya convertida o cancelada' };
    
    // Procesar Venta
    const items = JSON.parse(cotizacion.items_json);
    const ventaId = 'V-' + String(new Date().getTime()).slice(-5);
    
    items.forEach(item => {
      const transaccionId = 'T-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      ventasSheet.appendRow([
        transaccionId,
        item.servicio_id,
        item.cantidad,
        item.precio_unitario,
        ventaData.fecha || new Date(),
        `Cita: ${cotizacion.cita_id} | Cliente: ${cotizacion.cliente_id}`
      ]);
    });
    
    // Actualizar estados
    // Usamos índices fijos + 1 (para setValue)
    cotizacionesSheet.getRange(cotizacionRow, 8).setValue('Convertida'); // Col H (estado)
    cotizacionesSheet.getRange(cotizacionRow, 10).setValue(new Date()); // Col J (fecha_conv)
    cotizacionesSheet.getRange(cotizacionRow, 11).setValue(ventaId);    // Col K (venta_id)
    
    // Actualizar Cita
    const citasData = citasSheet.getDataRange().getValues();
    // Cita ID está en col 0
    for (let i = 1; i < citasData.length; i++) {
      if (citasData[i][0] === cotizacion.cita_id) {
        citasSheet.getRange(i + 1, 8).setValue('ATENDIDA'); // Col H (estado)
        // ESPERA: DebugHeaders dice: row 29: [cita_id... estado, observaciones, requiere_retiro, evento...]
        // Total NO está en encabezados de Citas en el reporte Debug.
        // Mejor NO actualizamos columna de total en Citas si no existe. Solo estado.
        break;
      }
    }
    
    return { success: true, ventaId: ventaId, message: 'Venta creada exitosamente' };
    
  } catch (e) {
    Logger.log('Error convertirCotizacionEnVenta: ' + e);
    return { success: false, error: e.message };
  }
}

function getCotizacionDetalle(cotizacionId) {
    // Implementación simplificada
    return { success: false, message: 'Función en mantenimiento' }; 
}
