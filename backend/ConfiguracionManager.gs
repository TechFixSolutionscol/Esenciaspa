/**
 * ConfiguracionManager.gs
 * Gestión de configuración del sistema (horarios, slots, etc.)
 * Esencia Spa - Sistema de Gestión
 */

/**
 * Obtener toda la configuración del sistema
 * @returns {Object} Configuración completa con horarios parseados
 */
function getConfiguracion() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let configSheet = ss.getSheetByName('Configuracion');
    
    // Si no existe la hoja, crearla con valores por defecto
    if (!configSheet) {
      configSheet = crearHojaConfiguracion();
    }
    
    const data = configSheet.getDataRange().getValues();
    const config = {};
    
    // Construir objeto de configuración (saltar header)
    for (let i = 1; i < data.length; i++) {
      const clave = data[i][0];
      const valor = data[i][1];
      
      if (clave && clave.trim() !== '') {
        config[clave] = valor;
      }
    }
    
    // Parsear horarios por día
    const horarios = parseHorarios(config);
    
    return {
      success: true,
      config: config,
      horarios: horarios
    };
    
  } catch (e) {
    Logger.log('Error getConfiguracion: ' + e);
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * Parsear horarios desde configuración
 * @param {Object} config - Objeto de configuración
 * @returns {Object} Horarios estructurados por día
 */
function parseHorarios(config) {
  const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const horarios = {};
  
  dias.forEach(dia => {
    const apertura = config[`horario_${dia}_apertura`];
    const cierre = config[`horario_${dia}_cierre`];
    
    // Convertir a string de forma segura
    let aperturaStr = '';
    let cierreStr = '';
    
    if (apertura) {
      if (apertura instanceof Date) {
        // Convertir Date a formato HH:MM
        aperturaStr = Utilities.formatDate(apertura, Session.getScriptTimeZone(), 'HH:mm');
      } else {
        const aperturaString = String(apertura).trim();
        // Verificar si es un string de fecha ISO (contiene 'T')
        if (aperturaString.includes('T') || aperturaString.includes('Z')) {
          try {
            const date = new Date(aperturaString);
            aperturaStr = Utilities.formatDate(date, Session.getScriptTimeZone(), 'HH:mm');
          } catch (e) {
            Logger.log(`Error parseando apertura ${dia}: ${e}`);
            aperturaStr = '';
          }
        } else {
          // Ya es un string simple como "09:00"
          aperturaStr = aperturaString;
        }
      }
    }
    
    if (cierre) {
      if (cierre instanceof Date) {
        // Convertir Date a formato HH:MM
        cierreStr = Utilities.formatDate(cierre, Session.getScriptTimeZone(), 'HH:mm');
      } else {
        const cierreString = String(cierre).trim();
        // Verificar si es un string de fecha ISO (contiene 'T')
        if (cierreString.includes('T') || cierreString.includes('Z')) {
          try {
            const date = new Date(cierreString);
            cierreStr = Utilities.formatDate(date, Session.getScriptTimeZone(), 'HH:mm');
          } catch (e) {
            Logger.log(`Error parseando cierre ${dia}: ${e}`);
            cierreStr = '';
          }
        } else {
          // Ya es un string simple como "18:00"
          cierreStr = cierreString;
        }
      }
    }
    
    Logger.log(`${dia}: apertura="${aperturaStr}", cierre="${cierreStr}"`);
    
    // Solo agregar si ambos valores existen y no están vacíos
    if (aperturaStr !== '' && cierreStr !== '') {
      horarios[dia] = {
        apertura: aperturaStr,
        cierre: cierreStr
      };
    } else {
      horarios[dia] = null; // Día cerrado
    }
  });
  
  return horarios;
}

/**
 * Crear hoja de configuración con valores por defecto
 * @returns {Sheet} Hoja de configuración creada
 */
function crearHojaConfiguracion() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.insertSheet('Configuracion');
  
  // Header
  configSheet.appendRow(['clave', 'valor']);
  
  // Valores por defecto - Lunes a Viernes 9:00-18:00
  configSheet.appendRow(['horario_lunes_apertura', '09:00']);
  configSheet.appendRow(['horario_lunes_cierre', '18:00']);
  configSheet.appendRow(['horario_martes_apertura', '09:00']);
  configSheet.appendRow(['horario_martes_cierre', '18:00']);
  configSheet.appendRow(['horario_miercoles_apertura', '09:00']);
  configSheet.appendRow(['horario_miercoles_cierre', '18:00']);
  configSheet.appendRow(['horario_jueves_apertura', '09:00']);
  configSheet.appendRow(['horario_jueves_cierre', '18:00']);
  configSheet.appendRow(['horario_viernes_apertura', '09:00']);
  configSheet.appendRow(['horario_viernes_cierre', '18:00']);
  
  // Sábado 9:00-14:00
  configSheet.appendRow(['horario_sabado_apertura', '09:00']);
  configSheet.appendRow(['horario_sabado_cierre', '14:00']);
  
  // Domingo cerrado (vacío)
  configSheet.appendRow(['horario_domingo_apertura', '']);
  configSheet.appendRow(['horario_domingo_cierre', '']);
  
  // Configuraciones adicionales
  configSheet.appendRow(['dias_cerrado', 'domingo']);
  configSheet.appendRow(['anticipacion_minima_horas', '2']);
  configSheet.appendRow(['intervalo_slots_minutos', '30']);
  
  // Formato
  const headerRange = configSheet.getRange('A1:B1');
  headerRange.setBackground('#d81b60');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  
  configSheet.setColumnWidth(1, 250);
  configSheet.setColumnWidth(2, 150);
  configSheet.setFrozenRows(1);
  
  Logger.log('✅ Hoja de Configuración creada con valores por defecto');
  
  return configSheet;
}

/**
 * Actualizar un valor de configuración
 * @param {string} clave - Clave de configuración
 * @param {string} valor - Nuevo valor
 * @returns {Object} Resultado de la operación
 */
function actualizarConfiguracion(clave, valor) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName('Configuracion');
    
    if (!configSheet) {
      return { success: false, error: 'Hoja de configuración no existe' };
    }
    
    const data = configSheet.getDataRange().getValues();
    let encontrado = false;
    
    // Buscar y actualizar
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === clave) {
        configSheet.getRange(i + 1, 2).setValue(valor);
        encontrado = true;
        break;
      }
    }
    
    // Si no existe, agregar
    if (!encontrado) {
      configSheet.appendRow([clave, valor]);
    }
    
    Logger.log(`✅ Configuración actualizada: ${clave} = ${valor}`);
    
    return {
      success: true,
      message: 'Configuración actualizada exitosamente'
    };
    
  } catch (e) {
    Logger.log('Error actualizarConfiguracion: ' + e);
    return {
      success: false,
      error: e.message
    };
  }
}
