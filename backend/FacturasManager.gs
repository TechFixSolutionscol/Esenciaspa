/**
 * FacturasManager.gs
 * Gestiona el historial de ventas y la anulación de facturas.
 */

const HOJA_ANULADAS = "Anuladas"; // Nueva hoja para historial de anulaciones

/**
 * Obtiene el historial agrupado de facturas (Ventas y Anuladas)
 */
function getHistorialFacturas() {
  const ss = getSpreadsheet();
  const sheetVentas = ss.getSheetByName(HOJA_VENTAS);
  const sheetAnuladas = ss.getSheetByName(HOJA_ANULADAS); // Puede no existir aún

  let facturasMap = {};

  // 1. Procesar Ventas Activas
  if (sheetVentas && sheetVentas.getLastRow() > 1) {
    const data = sheetVentas.getDataRange().getValues();
    // Skip header (row 0)
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        procesarFilaFactura(row, facturasMap, 'ACTIVA');
    }
  }

  // 2. Procesar Ventas Anuladas (si existe la hoja)
  if (sheetAnuladas && sheetAnuladas.getLastRow() > 1) {
    const data = sheetAnuladas.getDataRange().getValues();
    // Skip header (row 0)
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        procesarFilaFactura(row, facturasMap, 'ANULADA');
    }
  }

  // Convertir mapa a array ordenado por fecha (más reciente primero)
  const historial = Object.values(facturasMap).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  
  return historial;
}

/**
 * Helper para procesar fila y agrupar por Order ID
 */
function procesarFilaFactura(row, map, estado) {
    // Estructura row Ventas: [id, producto_id, cantidad, precio, fecha, extra_data (cliente/pedido)]
    // Estructura row Anuladas: Igual + [motivo, fecha_anulacion]
    
    // Parsear Order ID de extra_data "Pedido: V-12345 | Cliente..."
    const extraData = String(row[5] || '');
    let orderId = 'SIN-REF';
    let cliente = 'Cliente General';
    
    const pedidoMatch = extraData.match(/Pedido:\s*([^\s|]+)/);
    if (pedidoMatch) {
        orderId = pedidoMatch[1];
    } else {
        // Fallback si no tiene formato de pedido, usar ID transacción
        orderId = 'TR-' + row[0]; 
    }

    // Extraer cliente (después del |)
    const clienteMatch = extraData.split('|');
    if (clienteMatch.length > 1) {
        cliente = clienteMatch[1].trim();
    }

    // Inicializar factura en mapa si no existe
    if (!map[orderId]) {
        map[orderId] = {
            id: orderId,
            fecha: row[4], // Usamos la fecha de la primera transacción encontrada
            cliente: cliente,
            total: 0,
            estado: estado,
            items: [],
            motivo_anulacion: estado === 'ANULADA' ? (row[6] || '') : ''
        };
    }

    // Sumar al total
    const cantidad = parseFloat(row[2]) || 0;
    const precio = parseFloat(row[3]) || 0;
    const subtotal = cantidad * precio;
    
    map[orderId].total += subtotal;
    map[orderId].items.push({
        producto: row[1],
        cantidad: cantidad,
        precio: precio,
        subtotal: subtotal
    });
}

/**
 * Anula una factura completa por su Order ID
 * @param {string} orderId - ID del pedido (ej: V-38492)
 * @param {string} motivo - Razón de la anulación
 */
function anularFactura(orderId, motivo) {
    const ss = getSpreadsheet();
    const sheetVentas = ss.getSheetByName(HOJA_VENTAS);
    const sheetProductos = ss.getSheetByName(HOJA_PRODUCTOS);
    let sheetAnuladas = ss.getSheetByName(HOJA_ANULADAS);

    if (!sheetVentas) return { success: false, message: "No se encuentra la hoja de Ventas." };

    // Crear hoja de anuladas si no existe
    if (!sheetAnuladas) {
        sheetAnuladas = ss.insertSheet(HOJA_ANULADAS);
        // Copiar encabezados de Ventas y agregar Motivo y Fecha Anulación
        const headers = sheetVentas.getRange(1, 1, 1, sheetVentas.getLastColumn()).getValues()[0];
        headers.push("Motivo Anulación", "Fecha Anulación");
        sheetAnuladas.appendRow(headers);
    }

    const data = sheetVentas.getDataRange().getValues();
    const rowsToDelete = [];
    const fechaAnulacion = new Date();
    
    // 1. Encontrar filas correspondientes al pedido
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const extraData = String(row[5] || '');
        
        // Verificar si la fila pertenece al pedido
        if (extraData.includes(`Pedido: ${orderId}`)) {
            
            // 2. Revertir Inventario (Devolver stock)
            const productoId = row[1];
            const cantidad = parseFloat(row[2]) || 0;
            
            revertirStock(sheetProductos, productoId, cantidad);

            // 3. Copiar a hoja Anuladas
            const newRow = [...row, motivo, fechaAnulacion];
            sheetAnuladas.appendRow(newRow);

            // Marcar fila para borrar (guardamos índice real, +1 porque data es 0-indexed pero sheet es 1-indexed)
            rowsToDelete.push(i + 1);
        }
    }

    if (rowsToDelete.length === 0) {
        return { success: false, message: `No se encontraron transacciones para el pedido ${orderId}` };
    }

    // 4. Borrar filas de Ventas (de abajo hacia arriba para no alterar índices)
    // Ordenar descendente
    rowsToDelete.sort((a, b) => b - a);
    rowsToDelete.forEach(rowIndex => {
        sheetVentas.deleteRow(rowIndex);
    });

    return { 
        success: true, 
        message: `Factura ${orderId} anulada exitosamente. ${rowsToDelete.length} ítems revertidos al inventario.` 
    };
}

/**
 * Helper para devolver stock al inventario
 */
function revertirStock(sheetProductos, productoId, cantidad) {
    const data = sheetProductos.getDataRange().getValues();
    const idColForProd = 0; // ID es columna A (0)
    const stockColForProd = 7; // Stock es columna H (7) - Verificado en code.gs constantes
    const tipoColForProd = 4; // Tipo es columna E (4)

    for (let i = 1; i < data.length; i++) {
        if (String(data[i][idColForProd]) === String(productoId)) {
            // Solo si es inventariable
            if (data[i][tipoColForProd] === 'Inventariable') {
                const currentStock = parseFloat(data[i][stockColForProd]) || 0;
                const newStock = currentStock + cantidad; // SUMAMOS porque es anulación de venta
                sheetProductos.getRange(i + 1, stockColForProd + 1).setValue(newStock);
            }
            break; 
        }
    }
}
