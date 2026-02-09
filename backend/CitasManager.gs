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
 * Buscar o crear cliente
 * @param {Object} clienteData - Datos del cliente
 * @returns {Object} { clienteId, esNuevo }
 */
function buscarOCrearCliente(clienteData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const clientesSheet = ss.getSheetByName('Clientes');
    
    const data = clientesSheet.getDataRange().getValues();
    const headers = data[0];
    
    const telefonoCol = headers.indexOf('telefono');
    const emailCol = headers.indexOf('email');
    const idCol = headers.indexOf('id');
    
    // Buscar por teléfono o email
    for (let i = 1; i < data.length; i++) {
      const telefono = data[i][telefonoCol];
      const email = data[i][emailCol];
      
      if (telefono === clienteData.telefono || (clienteData.email && email === clienteData.email)) {
        // Cliente encontrado
        return {
          success: true,
          clienteId: data[i][idCol],
          esNuevo: false
        };
      }
    }
    
    // Cliente no existe, crear nuevo
    const nuevoId = 'CLI-' + new Date().getTime();
    
    clientesSheet.appendRow([
      nuevoId,
      clienteData.nombre,
      clienteData.telefono,
      clienteData.email || '',
      '', // fecha_cumpleanos
      '', // observaciones
      new Date(), // fecha_registro
      0, // total_servicios
      null // ultima_visita
    ]);
    
    Logger.log(`✅ Cliente creado: ${nuevoId}`);
    
    return {
      success: true,
      clienteId: nuevoId,
      esNuevo: true
    };
    
  } catch (e) {
    Logger.log('Error buscarOCrearCliente: ' + e);
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
    
    // 6. Generar link de WhatsApp
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
      message: 'Cita creada exitosamente'
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
