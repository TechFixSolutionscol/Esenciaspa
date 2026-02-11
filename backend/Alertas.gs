/**
 * Alertas.gs
 * Gestión de Alertas del Sistema (Stock, Cotizaciones, etc.)
 * Esencia Spa - FixOps ERP
 */

/**
 * Obtener alertas del sistema
 * @returns {Object} { lowStock: [], pendingQuotes: [], summary: {} }
 */
function getSystemAlerts() {
  const alerts = {
    lowStock: [],
    pendingQuotes: [],
    summary: {
      lowStockCount: 0,
      pendingQuotesCount: 0
    }
  };
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Alertas de Stock Bajo
    const productosSheet = ss.getSheetByName('Productos');
    if (productosSheet) {
      const data = productosSheet.getDataRange().getValues();
      const headers = data[0].map(h => String(h).toLowerCase());
      
      const idxId = headers.indexOf('id');
      const idxNombre = headers.indexOf('nombre');
      const idxStock = headers.indexOf('stock');
      const idxTipo = headers.indexOf('tipo'); // Inventariable vs Servicio
      
      if (idxStock !== -1) {
        // Empezar en 1 para saltar headers
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          const tipo = idxTipo !== -1 ? String(row[idxTipo]) : 'Inventariable';
          const stock = parseInt(row[idxStock]) || 0;
          
          // Solo validar si es inventariable y stock <= 5
          if (tipo !== 'Servicio' && stock <= 5) {
            alerts.lowStock.push({
              id: row[idxId],
              nombre: row[idxNombre],
              stock: stock,
              nivel: stock === 0 ? 'CRITICO' : 'BAJO'
            });
          }
        }
      }
    }
    
    // 2. Alertas de Cotizaciones Pendientes
    const cotizacionesSheet = ss.getSheetByName('Cotizaciones');
    if (cotizacionesSheet) {
      const data = cotizacionesSheet.getDataRange().getValues();
      const headers = data[0].map(h => String(h).toLowerCase());
      
      const idxId = headers.indexOf('cotizacion_id') > -1 ? headers.indexOf('cotizacion_id') : 0;
      const idxEstado = headers.indexOf('estado');
      const idxFecha = headers.indexOf('fecha_creado') > -1 ? headers.indexOf('fecha_creado') : headers.indexOf('fecha_creacion');
      const idxCliente = headers.indexOf('cliente_id') > -1 ? headers.indexOf('cliente_id') : 2;
      
      if (idxEstado !== -1) {
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          const estado = String(row[idxEstado]).trim();
          
          if (estado === 'Cotizada') {
            const fecha = row[idxFecha] ? new Date(row[idxFecha]) : new Date();
            const hoy = new Date();
            const diffTime = Math.abs(hoy - fecha);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            alerts.pendingQuotes.push({
              id: row[idxId],
              cliente: row[idxCliente],
              dias: diffDays,
              fecha: Utilities.formatDate(fecha, 'America/Bogota', 'yyyy-MM-dd')
            });
          }
        }
      }
    }
    
    // Resumen
    alerts.summary.lowStockCount = alerts.lowStock.length;
    alerts.summary.pendingQuotesCount = alerts.pendingQuotes.length;
    
    return alerts;
    
  } catch (e) {
    Logger.log('Error getSystemAlerts: ' + e);
    return {
      error: true,
      message: e.message,
      summary: { lowStockCount: 0, pendingQuotesCount: 0 }
    };
  }
}
