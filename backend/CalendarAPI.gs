/**
 * CalendarAPI.gs
 * Integración con Google Calendar para gestión de citas
 * Esencia Spa - Sistema de Gestión
 */

// CONFIGURACIÓN - Actualizar con tu ID de calendario
const CALENDAR_ID = 'primary'; // Cambiar por el ID específico si creaste un calendario dedicado

/**
 * Verifica disponibilidad en un rango horario
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {string} horaInicio - Hora en formato HH:MM
 * @param {number} duracionMinutos - Duración total calculada
 * @returns {Object} { available, conflictingEvents, message }
 */
function checkAvailability(fecha, horaInicio, duracionMinutos) {
  try {
    // Parsear fecha y hora
    const fechaObj = new Date(fecha + 'T00:00:00-05:00'); // Zona horaria Colombia
    const [horas, minutos] = horaInicio.split(':');
    
    fechaObj.setHours(parseInt(horas), parseInt(minutos), 0, 0);
    
    // CRÍTICO: Calcular hora_fin usando duración total
    const horaFin = new Date(fechaObj.getTime() + (duracionMinutos * 60000));
    
    Logger.log(`Verificando disponibilidad: ${fechaObj.toISOString()} - ${horaFin.toISOString()}`);
    
    // Buscar eventos que traslapen con este rango
    const events = Calendar.Events.list(CALENDAR_ID, {
      timeMin: fechaObj.toISOString(),
      timeMax: horaFin.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    if (events.items && events.items.length > 0) {
      // Hay traslape
      return {
        available: false,
        conflictingEvents: events.items.length,
        message: `Ya hay ${events.items.length} cita(s) en ese horario`,
        conflicts: events.items.map(e => ({
          summary: e.summary,
          start: e.start.dateTime,
          end: e.end.dateTime
        }))
      };
    }
    
    return {
      available: true,
      message: 'Horario disponible',
      horaFin: horaFin.toISOString()
    };
    
  } catch (e) {
    Logger.log('Error checkAvailability: ' + e);
    return {
      available: false,
      error: e.message
    };
  }
}

/**
 * Crear evento en Google Calendar
 * @param {Object} citaData - Datos de la cita
 * @returns {Object} { success, eventId, htmlLink }
 */
function createCalendarEvent(citaData) {
  try {
    const fechaObj = new Date(citaData.fecha + 'T00:00:00-05:00');
    const [horas, minutos] = citaData.hora_inicio.split(':');
    
    fechaObj.setHours(parseInt(horas), parseInt(minutos), 0, 0);
    const horaFin = new Date(fechaObj.getTime() + (citaData.duracion_minutos * 60000));
    
    const event = {
      summary: `${citaData.servicio_nombre} - ${citaData.cliente_nombre}`,
      description: `Cliente: ${citaData.cliente_nombre}\n` +
                   `Teléfono: ${citaData.cliente_telefono}\n` +
                   `${citaData.requiere_retiro ? '⚠️ Requiere retiro de sistema anterior\n' : ''}` +
                   `Duración: ${citaData.duracion_minutos} minutos\n` +
                   `Observaciones: ${citaData.observaciones || 'N/A'}`,
      start: {
        dateTime: fechaObj.toISOString(),
        timeZone: 'America/Bogota'
      },
      end: {
        dateTime: horaFin.toISOString(),
        timeZone: 'America/Bogota'
      },
      attendees: citaData.cliente_email ? [{ email: citaData.cliente_email }] : [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 día antes
          { method: 'popup', minutes: 60 }       // 1 hora antes
        ]
      },
      colorId: '10' // Verde para citas
    };
    
    const createdEvent = Calendar.Events.insert(event, CALENDAR_ID, {
      sendUpdates: 'all' // Enviar email automático
    });
    
    Logger.log(`✅ Evento creado en Calendar: ${createdEvent.id}`);
    
    return {
      success: true,
      eventId: createdEvent.id,
      htmlLink: createdEvent.htmlLink
    };
    
  } catch (e) {
    Logger.log('Error createCalendarEvent: ' + e);
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * Actualizar evento existente
 * @param {string} eventId - ID del evento
 * @param {Object} newData - Nuevos datos
 * @returns {Object} { success, eventId }
 */
function updateCalendarEvent(eventId, newData) {
  try {
    const event = Calendar.Events.get(CALENDAR_ID, eventId);
    
    // Actualizar solo campos modificados
    if (newData.summary) event.summary = newData.summary;
    if (newData.description) event.description = newData.description;
    if (newData.start) event.start = newData.start;
    if (newData.end) event.end = newData.end;
    
    const updatedEvent = Calendar.Events.update(event, CALENDAR_ID, eventId, {
      sendUpdates: 'all'
    });
    
    Logger.log(`✅ Evento actualizado: ${updatedEvent.id}`);
    
    return {
      success: true,
      eventId: updatedEvent.id
    };
    
  } catch (e) {
    Logger.log('Error updateCalendarEvent: ' + e);
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * Eliminar evento (cancelar cita)
 * @param {string} eventId - ID del evento
 * @returns {Object} { success }
 */
function deleteCalendarEvent(eventId) {
  try {
    Calendar.Events.remove(CALENDAR_ID, eventId, {
      sendUpdates: 'all'
    });
    
    Logger.log(`✅ Evento eliminado: ${eventId}`);
    
    return { success: true };
    
  } catch (e) {
    Logger.log('Error deleteCalendarEvent: ' + e);
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * Obtener eventos del día
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @returns {Array} Lista de eventos
 */
function getEventosDelDia(fecha) {
  try {
    // Validar que fecha no sea null, undefined o vacío
    if (!fecha || typeof fecha !== 'string') {
      Logger.log('Error getEventosDelDia: Fecha inválida o no proporcionada - ' + fecha);
      return [];
    }
    
    // Validar formato básico YYYY-MM-DD
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
      Logger.log('Error getEventosDelDia: Formato de fecha inválido - ' + fecha);
      return [];
    }
    
    const inicio = new Date(fecha + 'T00:00:00-05:00');
    const fin = new Date(fecha + 'T23:59:59-05:00');
    
    // Validar que las fechas creadas sean válidas
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      Logger.log('Error getEventosDelDia: Fecha no válida - ' + fecha);
      return [];
    }
    
    const events = Calendar.Events.list(CALENDAR_ID, {
      timeMin: inicio.toISOString(),
      timeMax: fin.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    if (!events.items || events.items.length === 0) {
      return [];
    }
    
    return events.items.map(e => ({
      id: e.id,
      titulo: e.summary,
      inicio: e.start.dateTime,
      fin: e.end.dateTime,
      descripcion: e.description
    }));
    
  } catch (e) {
    Logger.log('Error getEventosDelDia: ' + e);
    return [];
  }
}
