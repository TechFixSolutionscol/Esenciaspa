/**
 * CitasManager.gs
 * Gestión de citas con duración dinámica
 * Esencia Spa - Sistema de Gestión
 */

/**
 * Calcula la duración total de una cita
 * @param {string} servicioId - ID del servicio seleccionado
 * @param {boolean} requiereRetiro - Si el cliente necesita retiro de sistema anterior
 * @returns {Object} { duracionTotal, duracionBase, duracionRetiro }
 */
function calcularDuracionCita(servicioId, requiereRetiro = false) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const productosSheet = ss.getSheetByName('Productos');
    
    // Buscar servicio por ID
    const data = productosSheet.getDataRange().getValues();
    const headers = data[0];
    
    const idCol = headers.indexOf('id');
    const nombreCol = headers.indexOf('nombre');
    const duracionBaseCol = headers.indexOf('duracion_base_minutos');
    const duracionRetiroCol = headers.indexOf('duracion_retiro_minutos');
    const requiereRetiroCol = headers.indexOf('requiere_retiro_opcional');
    
    let servicio = null;
    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === servicioId) {
        servicio = {
          id: data[i][idCol],
          nombre: data[i][nombreCol],
          duracionBase: parseInt(data[i][duracionBaseCol]) || 0,
          duracionRetiro: parseInt(data[i][duracionRetiroCol]) || 0,
          requiereRetiroOpcional: data[i][requiereRetiroCol] === true || 
                                  data[i][requiereRetiroCol] === 'TRUE' ||
                                  data[i][requiereRetiroCol] === 'true'
        };
        break;
      }
    }
    
    if (!servicio) {
      throw new Error('Servicio no encontrado');
    }
    
    if (servicio.duracionBase === 0) {
      throw new Error('El servicio no tiene duración configurada');
    }
    
    let duracionTotal = servicio.duracionBase;
    
    // Agregar tiempo de retiro si aplica
    if (requiereRetiro && servicio.requiereRetiroOpcional && servicio.duracionRetiro > 0) {
      duracionTotal += servicio.duracionRetiro;
    }
    
    return {
      success: true,
      servicioNombre: servicio.nombre,
      duracionBase: servicio.duracionBase,
      duracionRetiro: (requiereRetiro && servicio.requiereRetiroOpcional) ? servicio.duracionRetiro : 0,
      duracionTotal: duracionTotal,
      requiereRetiro: requiereRetiro,
      requiereRetiroOpcional: servicio.requiereRetiroOpcional
    };
    
  } catch (e) {
    Logger.log('Error calcularDuracionCita: ' + e);
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * Crear una nueva cita con duración calculada
 * @param {Object} citaData - Datos de la cita
 * @returns {Object} Resultado de la operación
 */
function crearCita(citaData) {
  try {
    Logger.log('Creando cita con datos: ' + JSON.stringify(citaData));
    
    // 1. Buscar o crear cliente
    const clienteResult = buscarOCrearCliente({
      nombre: citaData.cliente_nombre,
      telefono: citaData.cliente_telefono,
      email: citaData.cliente_email
    });
    
    if (!clienteResult.success) {
      return { success: false, message: 'Error al procesar cliente: ' + clienteResult.error };
    }
    
    const clienteId = clienteResult.clienteId;
    
    // 2. Calcular duración total
    const duracion = calcularDuracionCita(
      citaData.servicio_id,
      citaData.requiere_retiro || false
    );
    
    if (!duracion.success) {
      return { success: false, message: 'Error al calcular duración: ' + duracion.error };
    }
    
    // 3. Validar disponibilidad con duración total
    const disponibilidad = checkAvailability(
      citaData.fecha,
      citaData.hora_inicio,
      duracion.duracionTotal
    );
    
    if (!disponibilidad.available) {
      return {
        success: false,
        message: disponibilidad.message,
        conflicts: disponibilidad.conflicts
      };
    }
    
    // 4. Crear evento en Calendar
    const fechaObj = new Date(citaData.fecha + 'T00:00:00-05:00');
    const [horas, minutos] = citaData.hora_inicio.split(':');
    fechaObj.setHours(parseInt(horas), parseInt(minutos), 0, 0);
    
    const horaFin = new Date(fechaObj.getTime() + (duracion.duracionTotal * 60000));
    
    const calendarResult = createCalendarEvent({
      servicio_nombre: duracion.servicioNombre,
      cliente_nombre: citaData.cliente_nombre,
      cliente_telefono: citaData.cliente_telefono,
      cliente_email: citaData.cliente_email,
      fecha: citaData.fecha,
      hora_inicio: citaData.hora_inicio,
      duracion_minutos: duracion.duracionTotal,
      requiere_retiro: citaData.requiere_retiro || false,
      observaciones: citaData.observaciones || ''
    });
    
    if (!calendarResult.success) {
      return { success: false, message: 'Error al crear evento en Calendar: ' + calendarResult.error };
    }
    
    // 5. Registrar en hoja Citas
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const citasSheet = ss.getSheetByName('Citas');
    
    const citaId = 'CITA-' + new Date().getTime();
    
    citasSheet.appendRow([
      citaId,
      clienteId,
      citaData.servicio_id,
      citaData.fecha,
      citaData.hora_inicio,
      Utilities.formatDate(horaFin, 'America/Bogota', 'HH:mm'),
      duracion.duracionTotal,
      'PENDIENTE',
      calendarResult.eventId,
      null, // metodo_pago
      null, // total
      citaData.observaciones || '',
      new Date(),
      new Date()
    ]);
    
    Logger.log(`✅ Cita creada exitosamente: ${citaId}`);
    
    // 6. Crear cotización automática (FASE 3)
    const cotizacionResult = crearCotizacionAutomatica({
      cita_id: citaId,
      cliente_id: clienteId,
      servicio_id: citaData.servicio_id
    });
    
    if (cotizacionResult.success) {
      Logger.log(`✅ Cotización creada automáticamente: ${cotizacionResult.cotizacionId}`);
    } else {
      Logger.log(`⚠️ No se pudo crear cotización: ${cotizacionResult.message || cotizacionResult.error}`);
    }
    
    // 7. Generar link de WhatsApp
    const whatsappLink = generarNotificacionWhatsApp(
      citaData.cliente_telefono,
      citaData.cliente_nombre,
      duracion.servicioNombre,
      citaData.fecha,
      citaData.hora_inicio,
      duracion.duracionTotal
    );
    
    return {
      success: true,
      citaId: citaId,
      clienteId: clienteId,
      clienteEsNuevo: clienteResult.esNuevo,
      calendarEventId: calendarResult.eventId,
      calendarLink: calendarResult.htmlLink,
      duracion: duracion.duracionTotal,
      horaFin: Utilities.formatDate(horaFin, 'America/Bogota', 'HH:mm'),
      whatsappLink: whatsappLink,
      cotizacionId: cotizacionResult.success ? cotizacionResult.cotizacionId : null,
      cotizacionTotal: cotizacionResult.success ? cotizacionResult.total : null,
      message: 'Cita y cotización creadas exitosamente'
    };
    
  } catch (e) {
    Logger.log('Error crearCita: ' + e);
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * Generar enlace de WhatsApp para notificación
 * @param {string} telefono - Número de teléfono
 * @param {string} nombre - Nombre del cliente
 * @param {string} servicio - Nombre del servicio
 * @param {string} fecha - Fecha de la cita
 * @param {string} hora - Hora de inicio
 * @param {number} duracion - Duración en minutos
 * @returns {string} URL de WhatsApp
 */
function generarNotificacionWhatsApp(telefono, nombre, servicio, fecha, hora, duracion) {
  // Limpiar teléfono
  const telefonoLimpio = telefono.replace(/\D/g, '');
  const telefonoCompleto = telefonoLimpio.startsWith('57') ? telefonoLimpio : '57' + telefonoLimpio;
  
  // Formatear fecha
  const fechaObj = new Date(fecha);
  const fechaFormateada = Utilities.formatDate(fechaObj, 'America/Bogota', 'dd/MM/yyyy');
  
  const mensaje = `🌸 *Esencia Spa*\n\n` +
                  `¡Hola ${nombre}!\n\n` +
                  `Tu cita ha sido confirmada:\n` +
                  `📅 Fecha: ${fechaFormateada}\n` +
                  `🕐 Hora: ${hora}\n` +
                  `💅 Servicio: ${servicio}\n` +
                  `⏱️ Duración: ${duracion} minutos\n\n` +
                  `¡Te esperamos! 💖`;
  
  const mensajeCodificado = encodeURIComponent(mensaje);
  return `https://wa.me/${telefonoCompleto}?text=${mensajeCodificado}`;
}

/**
 * Obtener citas por fecha
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @returns {Array} Lista de citas
 */
function getCitasPorFecha(fecha) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const citasSheet = ss.getSheetByName('Citas');
    
    const data = citasSheet.getDataRange().getValues();
    const headers = data[0];
    
    const citas = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][headers.indexOf('fecha')] === fecha) {
        citas.push({
          id: data[i][headers.indexOf('id')],
          clienteId: data[i][headers.indexOf('cliente_id')],
          servicioId: data[i][headers.indexOf('servicio_id')],
          fecha: data[i][headers.indexOf('fecha')],
          horaInicio: data[i][headers.indexOf('hora_inicio')],
          horaFin: data[i][headers.indexOf('hora_fin')],
          duracion: data[i][headers.indexOf('duracion_min')],
          estado: data[i][headers.indexOf('estado')],
          observaciones: data[i][headers.indexOf('observaciones')]
        });
      }
    }
    
    return citas;
    
  } catch (e) {
    Logger.log('Error getCitasPorFecha: ' + e);
    return [];
  }
}

/**
 * Cambiar estado de una cita
 * @param {string} citaId - ID de la cita
 * @param {string} nuevoEstado - PENDIENTE | CONFIRMADA | ATENDIDA | CANCELADA
 * @returns {Object} { success }
 */
function cambiarEstadoCita(citaId, nuevoEstado) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const citasSheet = ss.getSheetByName('Citas');
    
    const data = citasSheet.getDataRange().getValues();
    const headers = data[0];
    const idCol = headers.indexOf('id');
    const estadoCol = headers.indexOf('estado');
    const updatedCol = headers.indexOf('updated_at');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === citaId) {
        citasSheet.getRange(i + 1, estadoCol + 1).setValue(nuevoEstado);
        citasSheet.getRange(i + 1, updatedCol + 1).setValue(new Date());
        
        Logger.log(`✅ Estado de cita ${citaId} cambiado a ${nuevoEstado}`);
        return { success: true };
      }
    }
    
    return { success: false, message: 'Cita no encontrada' };
    
  } catch (e) {
    Logger.log('Error cambiarEstadoCita: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Obtener citas del día actual
 * @returns {Array} Lista de citas de hoy con información de cliente y servicio
 */
function getCitasHoy() {
  try {
    const hoy = Utilities.formatDate(new Date(), 'America/Bogota', 'yyyy-MM-dd');
    return getCitasPorFecha(hoy);
  } catch (e) {
    Logger.log('Error getCitasHoy: ' + e);
    return [];
  }
}

/**
 * Obtener estadísticas de citas
 * @param {string} fechaInicio - Fecha inicio en formato YYYY-MM-DD (opcional)
 * @param {string} fechaFin - Fecha fin en formato YYYY-MM-DD (opcional)
 * @returns {Object} Estadísticas de citas
 */
function getEstadisticasCitas(fechaInicio, fechaFin) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const citasSheet = ss.getSheetByName('Citas');
    const cotizacionesSheet = ss.getSheetByName('Cotizaciones');
    
    const citasData = citasSheet.getDataRange().getValues();
    const citasHeaders = citasData[0];
    
    const fechaCol = citasHeaders.indexOf('fecha');
    const estadoCol = citasHeaders.indexOf('estado');
    
    // Fecha de hoy para filtro
    const hoy = Utilities.formatDate(new Date(), 'America/Bogota', 'yyyy-MM-dd');
    
    let citasHoy = 0;
    let citasPendientes = 0;
    let citasConfirmadas = 0;
    let citasAtendidas = 0;
    let citasCanceladas = 0;
    
    for (let i = 1; i < citasData.length; i++) {
      const fechaCita = citasData[i][fechaCol];
      const fechaStr = fechaCita instanceof Date 
        ? Utilities.formatDate(fechaCita, 'America/Bogota', 'yyyy-MM-dd')
        : String(fechaCita).split('T')[0];
      
      const estado = String(citasData[i][estadoCol] || '').toUpperCase();
      
      // Contar citas de hoy
      if (fechaStr === hoy) {
        citasHoy++;
      }
      
      // Contar por estado
      switch (estado) {
        case 'PENDIENTE':
          citasPendientes++;
          break;
        case 'CONFIRMADA':
          citasConfirmadas++;
          break;
        case 'ATENDIDA':
          citasAtendidas++;
          break;
        case 'CANCELADA':
          citasCanceladas++;
          break;
      }
    }
    
    // Calcular ingresos proyectados del día
    let ingresosHoy = 0;
    if (cotizacionesSheet) {
      const cotData = cotizacionesSheet.getDataRange().getValues();
      const cotHeaders = cotData[0];
      
      const citaIdCol = cotHeaders.indexOf('cita_id');
      const totalCol = cotHeaders.indexOf('total');
      const estadoCotCol = cotHeaders.indexOf('estado');
      
      // Obtener IDs de citas de hoy
      const citasHoyIds = [];
      for (let i = 1; i < citasData.length; i++) {
        const fechaCita = citasData[i][fechaCol];
        const fechaStr = fechaCita instanceof Date 
          ? Utilities.formatDate(fechaCita, 'America/Bogota', 'yyyy-MM-dd')
          : String(fechaCita).split('T')[0];
        
        if (fechaStr === hoy) {
          citasHoyIds.push(citasData[i][0]); // ID de cita
        }
      }
      
      // Sumar totales de cotizaciones de hoy
      for (let i = 1; i < cotData.length; i++) {
        const citaId = cotData[i][citaIdCol];
        const estado = String(cotData[i][estadoCotCol] || '').toLowerCase();
        
        if (citasHoyIds.includes(citaId) && estado !== 'cancelada') {
          ingresosHoy += parseFloat(cotData[i][totalCol]) || 0;
        }
      }
    }
    
    return {
      citasHoy: citasHoy,
      citasPendientes: citasPendientes,
      citasConfirmadas: citasConfirmadas,
      citasAtendidas: citasAtendidas,
      citasCanceladas: citasCanceladas,
      ingresosHoy: ingresosHoy,
      fecha: hoy
    };
    
  } catch (e) {
    Logger.log('Error getEstadisticasCitas: ' + e);
    return {
      citasHoy: 0,
      citasPendientes: 0,
      citasConfirmadas: 0,
      citasAtendidas: 0,
      citasCanceladas: 0,
      ingresosHoy: 0,
      error: e.message
    };
  }
}

/**
 * Cancelar una cita
 * @param {string} citaId - ID de la cita
 * @param {string} motivo - Motivo de la cancelación
 * @returns {Object} { success, message }
 */
function cancelarCita(citaId, motivo) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const citasSheet = ss.getSheetByName('Citas');
    
    const data = citasSheet.getDataRange().getValues();
    const headers = data[0];
    
    const idCol = headers.indexOf('id');
    const estadoCol = headers.indexOf('estado');
    const observCol = headers.indexOf('observaciones');
    const eventIdCol = headers.indexOf('calendar_event_id');
    const updatedCol = headers.indexOf('updated_at');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === citaId) {
        const eventId = data[i][eventIdCol];
        
        // Actualizar estado y observaciones
        citasSheet.getRange(i + 1, estadoCol + 1).setValue('CANCELADA');
        
        const observActual = data[i][observCol] || '';
        const nuevaObserv = observActual + `\n[CANCELADA: ${motivo}]`;
        citasSheet.getRange(i + 1, observCol + 1).setValue(nuevaObserv);
        citasSheet.getRange(i + 1, updatedCol + 1).setValue(new Date());
        
        // Eliminar o actualizar evento en Calendar
        if (eventId) {
          try {
            deleteCalendarEvent(eventId);
            Logger.log(`✅ Evento ${eventId} eliminado de Calendar`);
          } catch (e) {
            Logger.log(`⚠️ No se pudo eliminar evento de Calendar: ${e.message}`);
          }
        }
        
        Logger.log(`✅ Cita ${citaId} cancelada. Motivo: ${motivo}`);
        return { 
          success: true, 
          message: 'Cita cancelada exitosamente'
        };
      }
    }
    
    return { success: false, message: 'Cita no encontrada' };
    
  } catch (e) {
    Logger.log('Error cancelarCita: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Reagendar una cita
 * @param {string} citaId - ID de la cita
 * @param {string} nuevaFecha - Nueva fecha en formato YYYY-MM-DD
 * @param {string} nuevaHora - Nueva hora en formato HH:mm
 * @returns {Object} { success, message }
 */
function reagendarCita(citaId, nuevaFecha, nuevaHora) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const citasSheet = ss.getSheetByName('Citas');
    
    const data = citasSheet.getDataRange().getValues();
    const headers = data[0];
    
    const idCol = headers.indexOf('id');
    const fechaCol = headers.indexOf('fecha');
    const horaInicioCol = headers.indexOf('hora_inicio');
    const horaFinCol = headers.indexOf('hora_fin');
    const duracionCol = headers.indexOf('duracion_min');
    const eventIdCol = headers.indexOf('calendar_event_id');
    const updatedCol = headers.indexOf('updated_at');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === citaId) {
        const duracion = parseInt(data[i][duracionCol]) || 60;
        const eventId = data[i][eventIdCol];
        
        // Validar disponibilidad en la nueva fecha/hora
        const disponibilidad = checkAvailability(nuevaFecha, nuevaHora, duracion);
        
        if (!disponibilidad.available) {
          return {
            success: false,
            message: disponibilidad.message,
            conflicts: disponibilidad.conflicts
          };
        }
        
        // Calcular nueva hora de fin
        const fechaObj = new Date(nuevaFecha + 'T00:00:00-05:00');
        const [horas, minutos] = nuevaHora.split(':');
        fechaObj.setHours(parseInt(horas), parseInt(minutos), 0, 0);
        const horaFin = new Date(fechaObj.getTime() + (duracion * 60000));
        const horaFinStr = Utilities.formatDate(horaFin, 'America/Bogota', 'HH:mm');
        
        // Actualizar en Sheets
        citasSheet.getRange(i + 1, fechaCol + 1).setValue(nuevaFecha);
        citasSheet.getRange(i + 1, horaInicioCol + 1).setValue(nuevaHora);
        citasSheet.getRange(i + 1, horaFinCol + 1).setValue(horaFinStr);
        citasSheet.getRange(i + 1, updatedCol + 1).setValue(new Date());
        
        // Actualizar evento en Calendar
        if (eventId) {
          try {
            updateCalendarEventTime(eventId, nuevaFecha, nuevaHora, duracion);
            Logger.log(`✅ Evento ${eventId} actualizado en Calendar`);
          } catch (e) {
            Logger.log(`⚠️ No se pudo actualizar evento en Calendar: ${e.message}`);
          }
        }
        
        Logger.log(`✅ Cita ${citaId} reagendada a ${nuevaFecha} ${nuevaHora}`);
        return { 
          success: true, 
          message: 'Cita reagendada exitosamente',
          nuevaFecha: nuevaFecha,
          nuevaHora: nuevaHora,
          horaFin: horaFinStr
        };
      }
    }
    
    return { success: false, message: 'Cita no encontrada' };
    
  } catch (e) {
    Logger.log('Error reagendarCita: ' + e);
    return { success: false, error: e.message };
  }
}
