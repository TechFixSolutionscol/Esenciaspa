/**
 * Code_Endpoints_Fases_3_4.gs
 * Endpoints para Cotizaciones y Conversión a Venta
 * 
 * INSTRUCCIONES:
 * Agregar estos casos al switch de doGet() y doPost() en Code.gs principal
 */

/**
 * ========================================
 * AGREGAR AL SWITCH DE doGet()
 * ========================================
 */

// case 'getCotizacionesPendientes':
//   return ContentService.createTextOutput(
//     JSON.stringify({ 
//       status: 'success', 
//       data: getCotizacionesPendientes() 
//     })
//   ).setMimeType(ContentService.MimeType.JSON);

// case 'getCotizacionDetalle':
//   const cotizacionId = data.cotizacion_id;
//   return ContentService.createTextOutput(
//     JSON.stringify(getCotizacionDetalle(cotizacionId))
//   ).setMimeType(ContentService.MimeType.JSON);


/**
 * ========================================
 * AGREGAR AL SWITCH DE doPost()
 * ========================================
 */

// case 'convertirCotizacionEnVenta':
//   return ContentService.createTextOutput(
//     JSON.stringify(convertirCotizacionEnVenta(data.cotizacion_id, {
//       metodo_pago: data.metodo_pago || 'Efectivo',
//       fecha: data.fecha || new Date()
//     }))
//   ).setMimeType(ContentService.MimeType.JSON);


/**
 * ========================================
 * NOTAS DE IMPLEMENTACIÓN
 * ========================================
 * 
 * 1. El flujo completo es:
 *    - Cliente reserva cita desde web
 *    - Sistema crea cita en Calendar y Sheets
 *    - Sistema crea COTIZACIÓN automática
 *    - Cliente llega al spa
 *    - Admin abre Fixops → Sección "Citas y Cotizaciones"
 *    - Admin ve lista de cotizaciones pendientes
 *    - Admin click "Finalizar Servicio"
 *    - Sistema convierte cotización en VENTA en Fixops
 *    - Sistema cambia estado de cita a ATENDIDA
 * 
 * 2. Estados de Cotización:
 *    - Cotizada: Recién creada, pendiente
 *    - Convertida: Ya se convirtió en venta
 *    - Cancelada: Cita cancelada (futuro)
 * 
 * 3. Estados de Cita:
 *    - PENDIENTE: Creada, esperando
 *    - CONFIRMADA: Cliente confirmó (futuro)
 *    - ATENDIDA: Servicio completado y pagado
 *    - CANCELADA: Cita cancelada
 *    - NO_ASISTIO: Cliente no llegó
 * 
 * 4. Integración con Fixops:
 *    - Las ventas se registran en hoja "Ventas" 
 *    - Cada item es una fila (estructura Fixops)
 *    - El order_id es el mismo para todos los items
 *    - Se vincula con cliente_id en extra_data
 */
