/**
 * ReportesManager.gs
 * FASE 6: Reportes, Métricas y Analytics
 * Esencia Spa - Sistema de Gestión
 */

/**
 * Obtener métricas generales para el dashboard dentro de un rango de fechas
 * @param {Date} fechaInicio 
 * @param {Date} fechaFin 
 * @returns {Object} JSON con totales de ventas, citas, y clientes nuevos
 */
function getMetricasGenerales(fechaInicioStr, fechaFinStr) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Parsear fechas (YYYY-MM-DD o vacías para mes actual)
    const fechaInicio = fechaInicioStr ? new Date(fechaInicioStr) : getStartOfMonth(new Date());
    const fechaFin = fechaFinStr ? new Date(fechaFinStr) : new Date();
    
    if (fechaInicioStr) fechaInicio.setHours(0,0,0,0);
    if (fechaFinStr) fechaFin.setHours(23,59,59,999);
    
    // --- 1. Calcular Ventas Totales ---
    const cotSheet = ss.getSheetByName('Cotizaciones'); // Usamos Cotizaciones para ventas confirmadas
    let totalVentas = 0;
    let numVentas = 0;
    
    if (cotSheet) {
      const data = cotSheet.getDataRange().getValues();
      const headers = data[0].map(h => String(h).toLowerCase());
      const fechaCol = headers.indexOf('fecha_creacion');
      const totalCol = headers.indexOf('total');
      const estadoCol = headers.indexOf('estado');
      
      for(let i=1; i<data.length; i++) {
        const estado = String(data[i][estadoCol] || '');
        if (estado !== 'Convertida') continue; // Solo ventas reales
        
        const fecha = new Date(data[i][fechaCol]);
        if (fecha >= fechaInicio && fecha <= fechaFin) {
          totalVentas += Number(data[i][totalCol] || 0);
          numVentas++;
        }
      }
    }
    
    // --- 2. Calcular Citas Totales y Pendientes ---
    const citasSheet = ss.getSheetByName('Citas');
    let totalCitas = 0;
    let citasPendientes = 0;
    
    if (citasSheet) {
      const data = citasSheet.getDataRange().getValues();
      const headers = data[0].map(h => String(h).toLowerCase());
      const fechaCol = headers.indexOf('fecha');
      const estadoCol = headers.indexOf('estado');
      
      for(let i=1; i<data.length; i++) {
        const fecha = new Date(data[i][fechaCol]);
        const estado = String(data[i][estadoCol] || '');
        
        if (fecha >= fechaInicio && fecha <= fechaFin) {
          totalCitas++;
          if (estado === 'Pendiente' || estado === 'Confirmada') citasPendientes++;
        }
      }
    }
    
    // --- 3. Calcular Nuevos Clientes ---
    // (Asume que Clientes tiene fecha de registro, si no, es difícil calcular por fecha)
    const clientesSheet = ss.getSheetByName('Clientes');
    let nuevosClientes = 0;
    let totalClientes = 0;
    
    if (clientesSheet) {
      const data = clientesSheet.getDataRange().getValues();
      const headers = data[0].map(h => String(h).toLowerCase());
      // Intentar encontrar columna fecha registro, si no, retornar total general
      const fechaRegCol = headers.findIndex(h => h.includes('fecha') || h.includes('registro') || h.includes('created'));
      
      totalClientes = data.length - 1; // Menos header
      
      if (fechaRegCol !== -1) {
        for(let i=1; i<data.length; i++) {
          const fecha = new Date(data[i][fechaRegCol]);
          if (fecha >= fechaInicio && fecha <= fechaFin) {
            nuevosClientes++;
          }
        }
      } else {
        nuevosClientes = -1; // Indicar que no se puede calcular por fecha
      }
    }
    
    return {
      success: true,
      rango: {
        inicio: Utilities.formatDate(fechaInicio, 'America/Bogota', 'yyyy-MM-dd'),
        fin: Utilities.formatDate(fechaFin, 'America/Bogota', 'yyyy-MM-dd')
      },
      metricas: {
        total_ventas: totalVentas,
        num_ventas: numVentas,
        total_citas: totalCitas,
        citas_pendientes: citasPendientes,
        nuevos_clientes: nuevosClientes,
        total_clientes_historico: totalClientes
      }
    };
    
  } catch (e) {
    Logger.log('Error getMetricasGenerales: ' + e);
    return { success: false, error: e.toString() };
  }
}

/**
 * Obtener datos de ventas diarias para gráfico
 */
function getReporteVentasDiarias(fechaInicioStr, fechaFinStr) {
  // Similar logic but returning array of { fecha: 'YYYY-MM-DD', total: 123000 }
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const cotSheet = ss.getSheetByName('Cotizaciones');
    
    if (!cotSheet) return { success: false, data: [] };
    
    const fechaInicio = fechaInicioStr ? new Date(fechaInicioStr) : getStartOfMonth(new Date());
    const fechaFin = fechaFinStr ? new Date(fechaFinStr) : new Date();
    if (fechaInicioStr) fechaInicio.setHours(0,0,0,0);
    if (fechaFinStr) fechaFin.setHours(23,59,59,999);
    
    const data = cotSheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).toLowerCase());
    const fechaCol = headers.indexOf('fecha_creacion');
    const totalCol = headers.indexOf('total');
    const estadoCol = headers.indexOf('estado');
    
    const ventasPorDia = {};
    
    for(let i=1; i<data.length; i++) {
      const estado = String(data[i][estadoCol] || '');
      if (estado !== 'Convertida') continue;
      
      const fecha = new Date(data[i][fechaCol]);
      if (fecha >= fechaInicio && fecha <= fechaFin) {
        const fechaKey = Utilities.formatDate(fecha, 'America/Bogota', 'yyyy-MM-dd');
        ventasPorDia[fechaKey] = (ventasPorDia[fechaKey] || 0) + Number(data[i][totalCol] || 0);
      }
    }
    
    // Convertir a array ordenado
    const resultado = Object.keys(ventasPorDia).sort().map(fecha => ({
      fecha: fecha,
      total: ventasPorDia[fecha]
    }));
    
    return { success: true, data: resultado };
    
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Obtener servicios más populares
 */
function getServiciosPopulares(limit = 5) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const citasSheet = ss.getSheetByName('Citas');
    
    if (!citasSheet) return { success: false, data: [] };
    
    const data = citasSheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).toLowerCase());
    const servicioCol = headers.indexOf('servicio_nombre'); // Asumiendo que guardamos el nombre
    // Si no guardamos nombre, habría que cruzar con sheet Servicios usando servicio_id
    
    if (servicioCol === -1) return { success: false, message: 'Columna servicio no encontrada' };
    
    const conteo = {};
    
    for(let i=1; i<data.length; i++) {
      const servicio = String(data[i][servicioCol] || 'Desconocido');
      conteo[servicio] = (conteo[servicio] || 0) + 1;
    }
    
    // Convertir a array y ordenar
    const resultado = Object.keys(conteo)
       .map(nombre => ({ nombre: nombre, cantidad: conteo[nombre] }))
       .sort((a,b) => b.cantidad - a.cantidad)
       .slice(0, limit);
       
    return { success: true, data: resultado };
    
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}


function getStartOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
