/**
 * HistoriaClinicaManager.gs
 * Gestor de Historias Clínicas Digitales
 * Esencia Spa - Fases 0 y 1
 */

// Nombre de las hojas
const HOJA_HISTORIAS = 'Historias_Clinicas';
const HOJA_ANTECEDENTES = 'Antecedentes';
const HOJA_EVOLUCIONES = 'Evoluciones';
const HOJA_TRATAMIENTOS = 'Tratamientos';

/**
 * Inicializar todas las hojas necesarias para historias clínicas
 * @returns {Object} Resultado de la inicialización
 */
function inicializarHistoriasClinicas() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let resultado = {
      success: true,
      hojasCreadas: [],
      hojasExistentes: [],
      errors: []
    };

    // Hoja principal: Historias Clínicas
    if (!ss.getSheetByName(HOJA_HISTORIAS)) {
      crearHojaHistoriasClinicas();
      resultado.hojasCreadas.push(HOJA_HISTORIAS);
    } else {
      resultado.hojasExistentes.push(HOJA_HISTORIAS);
    }

    // Hoja: Antecedentes Médicos
    if (!ss.getSheetByName(HOJA_ANTECEDENTES)) {
      crearHojaAntecedentes();
      resultado.hojasCreadas.push(HOJA_ANTECEDENTES);
    } else {
      resultado.hojasExistentes.push(HOJA_ANTECEDENTES);
    }

    // Hoja: Evoluciones
    if (!ss.getSheetByName(HOJA_EVOLUCIONES)) {
      crearHojaEvoluciones();
      resultado.hojasCreadas.push(HOJA_EVOLUCIONES);
    } else {
      resultado.hojasExistentes.push(HOJA_EVOLUCIONES);
    }

    // Hoja: Tratamientos
    if (!ss.getSheetByName(HOJA_TRATAMIENTOS)) {
      crearHojaTratamientos();
      resultado.hojasCreadas.push(HOJA_TRATAMIENTOS);
    } else {
      resultado.hojasExistentes.push(HOJA_TRATAMIENTOS);
    }

    Logger.log('Historias Clínicas inicializadas: ' + JSON.stringify(resultado));
    return resultado;

  } catch (e) {
    Logger.log('Error inicializando historias clínicas: ' + e);
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * Crear hoja principal de Historias Clínicas
 */
function crearHojaHistoriasClinicas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.insertSheet(HOJA_HISTORIAS);

  // Headers
  const headers = [
    'id',                    // HC-001, HC-002...
    'cliente_id',           // Referencia a Clientes
    'cliente_nombre',       // Nombre completo
    'fecha_creacion',       // Timestamp
    'tipo_documento',       // CC, TI, CE, etc.
    'numero_documento',     // Número de identificación
    'fecha_nacimiento',     // Para calcular edad
    'edad',                 // Edad calculada
    'genero',               // Masculino, Femenino, Otro
    'estado_civil',         // Soltero/a, Casado/a, etc.
    'ocupacion',            // Profesión/oficio
    'direccion',            // Dirección completa
    'telefono',             // Teléfono principal
    'telefono_emergencia',  // Contacto de emergencia
    'nombre_emergencia',    // Nombre del contacto
    'email',                // Correo electrónico
    'eps',                  // EPS o seguro médico
    'grupo_sanguineo',      // A+, O-, etc.
    'estado',               // Activa, Archivada
    'fecha_modificacion',   // Última modificación
    'modificado_por'        // Usuario que modificó
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Formato
  formatearHojaHistorias(sheet);

  Logger.log('✅ Hoja Historias_Clinicas creada');
}

/**
 *Crear hoja de Antecedentes Médicos
 */
function crearHojaAntecedentes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.insertSheet(HOJA_ANTECEDENTES);

  const headers = [
    'id',                        // ANT-001
    'historia_clinica_id',       // Referencia a HC
    'cliente_nombre',            // Para referencia rápida
    'tipo_antecedente',          // Patológico, Quirúrgico, Alérgico, Farmacológico, Familiar
    'categoria',                 // Subcategoría específica
    'descripcion',               // Descripción detallada
    'fecha_diagnostico',         // Cuándo se diagnosticó
    'tratamiento_actual',        // Si/No
    'medicamento',               // Nombre del medicamento
    'dosis',                     // Dosis si aplica
    'frecuencia',                // Frecuencia de medicamento
    'observaciones',             // Notas adicionales
    'gravedad',                  // Leve, Moderada, Grave
    'estado',                    // Activo, Resuelto, En seguimiento
    'fecha_registro',            // Cuándo se registró
    'registrado_por'             // Usuario que registró
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatearHojaAntecedentes(sheet);

  Logger.log('✅ Hoja Antecedentes creada');
}

/**
 * Crear hoja de Evoluciones
 */
function crearHojaEvoluciones() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.insertSheet(HOJA_EVOLUCIONES);

  const headers = [
    'id',                        // EVO-001
    'historia_clinica_id',       // Referencia a HC
    'cliente_nombre',            // Para referencia
    'fecha_atencion',            // Fecha de la consulta/servicio
    'tipo_atencion',             // Consulta, Tratamiento, Seguimiento, Procedimiento
    'motivo_consulta',           // Por qué vino
    'signos_vitales_presion',    // Presión arterial
    'signos_vitales_pulso',      // Pulso
    'signos_vitales_temperatura',// Temperatura
    'signos_vitales_peso',       // Peso
    'signos_vitales_altura',     // Altura
    'examen_fisico',             // Hallazgos del examen
    'diagnostico',               // Diagnóstico principal
    'diagnósticos_secundarios',  // Otros diagnósticos
    'tratamiento_realizado',     // Qué se hizo
    'productos_utilizados',      // Productos/servicios aplicados
    'medicamentos_formulados',   // Medicamentos recetados
    'recomendaciones',           // Indicaciones al paciente
    'proxima_cita',              // Fecha de siguiente cita
    'observaciones',             // Notas adicionales
    'profesional',               // Quien atendió
    'duracion_minutos',          // Duración de la atención
    'estado',                    // Completada, Pendiente
    'adjuntos',                  // URLs de fotos/documentos
    'fecha_registro',            // Timestamp
    'registrado_por'             // Usuario
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatearHojaEvoluciones(sheet);

  Logger.log('✅ Hoja Evoluciones creada');
}

/**
 * Crear hoja de Tratamientos
 */
function crearHojaTratamientos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.insertSheet(HOJA_TRATAMIENTOS);

  const headers = [
    'id',                        // TRT-001
    'historia_clinica_id',       // Referencia a HC
    'evolucion_id',              // Referencia a evolución
    'cliente_nombre',            // Para referencia
    'tipo_tratamiento',          // Facial, Corporal, Capilar, etc.
    'nombre_tratamiento',        // Nombre específico
    'fecha_inicio',              // Inicio del tratamiento
    'fecha_fin_programada',      // Cuándo debe terminar
    'estado',                    // En curso, Completado, Suspendido
    'numero_sesiones',           // Total de sesiones
    'sesiones_completadas',      // Cuántas se han hecho
    'frecuencia',                // Semanal, Quincenal, etc.
    'area_tratamiento',          // Zona del cuerpo
    'productos_utilizados',      // Lista de productos
    'tecnicas_aplicadas',        // Técnicas/procedimientos
    'resultados_esperados',      // Objetivos del tratamiento
    'resultados_obtenidos',      // Resultados reales
    'efectos_adversos',          // Cualquier efecto no esperado
    'fotos_antes',               // URLs de fotos iniciales
    'fotos_progreso',            // URLs de fotos intermedias
    'fotos_despues',             // URLs de fotos finales
    'profesional_responsable',   // Quien realiza
    'costo_total',               // Costo del tratamiento
    'observaciones',             // Notas
    'fecha_registro',            // Timestamp
    'registrado_por'             // Usuario
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatearHojaTratamientos(sheet);

  Logger.log('✅ Hoja Tratamientos creada');
}

/**
 * Formatear hoja de Historias Clínicas
 */
function formatearHojaHistorias(sheet) {
  // Header en negrita y centrado
  const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4361ee');
  headerRange.setFontColor('#ffffff');
  headerRange.setHorizontalAlignment('center');

  // Ajustar anchos de columna
  sheet.setColumnWidth(1, 100);  // id
  sheet.setColumnWidth(2, 100);  // cliente_id
  sheet.setColumnWidth(3, 200);  // cliente_nombre
  sheet.setColumnWidth(6, 120);  // numero_documento
  sheet.setColumnWidth(12, 200); // direccion

  // Congelar header
  sheet.setFrozenRows(1);
}

/**
 * Formatear hoja de Antecedentes
 */
function formatearHojaAntecedentes(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#2ec4b6');
  headerRange.setFontColor('#ffffff');
  headerRange.setHorizontalAlignment('center');

  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(6, 300);  // descripcion
  sheet.setFrozenRows(1);
}

/**
 * Formatear hoja de Evoluciones
 */
function formatearHojaEvoluciones(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#ff9f1c');
  headerRange.setFontColor('#ffffff');
  headerRange.setHorizontalAlignment('center');

  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(5, 150);  // motivo_consulta
  sheet.setColumnWidth(12, 300); // examen_fisico
  sheet.setFrozenRows(1);
}

/**
 * Formatear hoja de Tratamientos
 */
function formatearHojaTratamientos(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#e63946');
  headerRange.setFontColor('#ffffff');
  headerRange.setHorizontalAlignment('center');

  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(6, 200);  // nombre_tratamiento
  sheet.setFrozenRows(1);
}

/**
 * Generar ID único para historia clínica
 */
function generarIdHistoriaClinica() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(HOJA_HISTORIAS);
  
  if (!sheet) {
    return 'HC-001';
  }
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return 'HC-001';
  }
  
  // Obtener el último ID
  const lastId = sheet.getRange(lastRow, 1).getValue();
  const numero = parseInt(lastId.split('-')[1]) + 1;
  
  return 'HC-' + numero.toString().padStart(3, '0');
}

/**
 * Verificar si un cliente ya tiene historia clínica
 * @param {string} clienteId - ID del cliente
 * @returns {Object} Resultado con la HC si existe
 */
function verificarHistoriaExistente(clienteId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(HOJA_HISTORIAS);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return { existe: false };
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Buscar por cliente_id (columna 2)
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === clienteId) {
        return {
          existe: true,
          historiaId: data[i][0],
          clienteNombre: data[i][2],
          fechaCreacion: data[i][3],
          estado: data[i][18]
        };
      }
    }
    
    return { existe: false };
    
  } catch (e) {
    Logger.log('Error verificando historia existente: ' + e);
    return { existe: false, error: e.message };
  }
}

/**
 * Guardar firma base64 en Google Drive
 */
function guardarFirmaEnDrive(base64, historiaId, nombreCliente) {
  try {
    const folderName = "Firmas_Pacientes_EsenciaSpa";
    let folder;
    const folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }

    if (!base64 || base64.indexOf("data:image") === -1) return "";
    
    const parts = base64.split(",");
    const contentType = parts[0].split(":")[1].split(";")[0];
    const bytes = Utilities.base64Decode(parts[1]);
    const blob = Utilities.newBlob(bytes, contentType, `Firma_${historiaId}_${nombreCliente.replace(/ /g, '_')}.png`);
    
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return file.getUrl();
  } catch (e) {
    Logger.log("Error guardando firma: " + e.toString());
    return "";
  }
}

// ========================================================================
// OPERACIONES CRUD - FASE 1
// ========================================================================

/**
 * Crear nueva Historia Clínica
 * @param {Object} data - Datos del paciente
 * @returns {Object} Resultado con el ID de la HC creada
 */
function crearHistoriaClinica(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(HOJA_HISTORIAS);
    
    if (!sheet) {
      return {
        success: false,
        message: 'La hoja Historias_Clinicas no existe. Inicialice primero.'
      };
    }
    
    // Verificar si ya existe HC para este cliente
    if (data.cliente_id) {
      const existente = verificarHistoriaExistente(data.cliente_id);
      if (existente.existe) {
        return {
          success: false,
          message: 'Este cliente ya tiene una Historia Clínica.',
          historiaExistente: existente
        };
      }
    }
    
    // Generar ID único
    const historiaId = generarIdHistoriaClinica();
    const ahora = new Date();
    const usuario = Session.getActiveUser().getEmail() || 'Sistema';

    // Calcular edad si hay fecha de nacimiento
    let edad = '';
    if (data.fecha_nacimiento) {
      const fechaNac = new Date(data.fecha_nacimiento);
      const diff = Date.now() - fechaNac.getTime();
      const ageDate = new Date(diff);
      edad = Math.abs(ageDate.getUTCFullYear() - 1970);
    }
    
    // Procesar Firma Digital
    let urlFirma = '';
    if (data.firma_base64 && data.firma_base64.indexOf('data:image') !== -1) {
        urlFirma = guardarFirmaEnDrive(data.firma_base64, historiaId, data.cliente_nombre);
    }

    // Preparar fila con TODOS los campos del formulario físico
    const fila = [
      historiaId,
      data.cliente_id || ('C-' + Math.floor(Math.random() * 10000)),
      data.cliente_nombre,
      data.fecha_nacimiento,
      edad,
      data.numero_documento,
      data.tipo_documento,
      data.telefono,
      data.email,
      data.direccion,
      data.ocupacion,
      data.estado_civil,
      data.eps,
      // --- DATOS EMERGENCIA / TUTOR ---
      data.contacto_emergencia_nombre || '',
      data.contacto_emergencia_telefono || '',
      data.tutor_nombre || '', // Si es menor
      data.tutor_parentesco || '',
      
      // --- INFORMACIÓN MÉDICA ---
      Array.isArray(data.afecciones) ? data.afecciones.join(', ') : (data.afecciones || ''), // Checkboxes (Diabetes, etc)
      data.embarazo || 'No',
      data.deporte || 'No',
      data.alergias_productos || 'No',
      data.tratamientos_actuales || '',
      data.medicamentos_actuales || '',
      data.enfermedades_familiares || '',
      
      // --- EVALUACIÓN MANOS ---
      data.manos_estado_unas || '',
      data.manos_tipo_una || '',
      data.manos_tipo_piel || '', // Normal, Seca, Grasa...
      Array.isArray(data.manos_servicios) ? data.manos_servicios.join(', ') : (data.manos_servicios || ''),

      // --- EVALUACIÓN PIES ---
      data.pies_tipo_pie || '', // Cuadrado, Griego...
      data.pies_tipo_pisada || '', // Normal, Plano...
      data.pies_estado_unas || '', // Onicocriptosis, etc.
      Array.isArray(data.pies_servicios) ? data.pies_servicios.join(', ') : (data.pies_servicios || ''),

      // --- OTROS ---
      data.observaciones || '', 
      'Activa', // estado
      usuario,
      ahora,
      urlFirma, // URL Firma en Drive
      'Sí' // Consentimiento Aceptado (implícito al firmar y guardar)
    ];

    // Verificar headers dinámicos
    const headersRequeridos = [
       'id', 'cliente_id', 'nombre', 'nacimiento', 'edad', 'doc', 'tipo_doc', 'tel', 'email', 'dir', 'ocup', 'civil', 'eps',
       'emergencia_nom', 'emergencia_tel', 'tutor_nom', 'tutor_rel',
       'afecciones_medicas', 'embarazo', 'deporte', 'alergias_prod', 'tratamientos_act', 'medicamentos', 'enfermedades_fam',
       'manos_estado', 'manos_tipo', 'manos_piel', 'manos_servicios',
       'pies_tipo', 'pies_pisada', 'pies_estado', 'pies_servicios',
       'observaciones', 'estado', 'usuario', 'fecha_reg', 'url_firma', 'consentimiento'
    ];

    if (sheet.getLastColumn() < headersRequeridos.length) {
       sheet.getRange(1, 1, 1, headersRequeridos.length).setValues([headersRequeridos]).setFontWeight('bold').setBackground('#FFD1DC'); // Rosado Esencia
    }

    sheet.appendRow(fila);
    
    return {
      success: true,
      message: 'Historia Clínica guardada exitosamente',
      historiaId: historiaId
    };
    
  } catch (e) {
    Logger.log('Error creando HC: ' + e);
    return {
      success: false,
      message: 'Error al crear: ' + e.message
    };
  }
}

/**
 * Obtener Historia Clínica por ID
 * @param {string} historiaId - ID de la historia clínica
 * @returns {Object} Datos de la HC
 */
function obtenerHistoriaClinica(historiaId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(HOJA_HISTORIAS);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return { success: false, message: 'No hay historias clínicas registradas' };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Buscar por ID
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === historiaId) {
        // Construir objeto
        const historia = {};
        headers.forEach((header, index) => {
          historia[header] = data[i][index];
        });
        
        return {
          success: true,
          data: historia
        };
      }
    }
    
    return {
      success: false,
      message: 'Historia Clínica no encontrada'
    };
    
  } catch (e) {
    Logger.log('Error obteniendo historia clínica: ' + e);
    return {
      success: false,
      message: 'Error: ' + e.message
    };
  }
}

/**
 * Listar todas las Historias Clínicas
 * @returns {Object} Array de historias
 */
function listarHistoriasClinicas() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(HOJA_HISTORIAS);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return { success: true, data: [] };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const historias = [];
    
    for (let i = 1; i < data.length; i++) {
      const historia = {};
      headers.forEach((header, index) => {
        historia[header] = data[i][index];
      });
      historias.push(historia);
    }
    
    return {
      success: true,
      data: historias
    };
    
  } catch (e) {
    Logger.log('Error listando historias: ' + e);
    return {
      success: false,
      message: 'Error: ' + e.message
    };
  }
}

/**
 * Agregar Antecedente a una Historia Clínica
 * @param {Object} data - Datos del antecedente
 * @returns {Object} Resultado
 */
function agregarAntecedente(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(HOJA_ANTECEDENTES);
    
    if (!sheet) {
      return { success: false, message: 'Hoja Antecedentes no existe' };
    }
    
    // Generar ID
    const lastRow = sheet.getLastRow();
    let numero = 1;
    if (lastRow > 1) {
      const lastId = sheet.getRange(lastRow, 1).getValue();
      numero = parseInt(lastId.split('-')[1]) + 1;
    }
    const antecedenteId = 'ANT-' + numero.toString().padStart(3, '0');
    
    const ahora = new Date();
    const usuario = Session.getActiveUser().getEmail() || 'Sistema';
    
    const fila = [
      antecedenteId,
      data.historia_clinica_id,
      data.cliente_nombre || '',
      data.tipo_antecedente || '',
      data.categoria || '',
      data.descripcion || '',
      data.fecha_diagnostico || '',
      data.tratamiento_actual || 'No',
      data.medicamento || '',
      data.dosis || '',
      data.frecuencia || '',
      data.observaciones || '',
      data.gravedad || 'Leve',
      data.estado || 'Activo',
      ahora,
      usuario
    ];
    
    sheet.appendRow(fila);
    
    return {
      success: true,
      antecedenteId: antecedenteId,
      message: 'Antecedente agregado exitosamente'
    };
    
  } catch (e) {
    Logger.log('Error agregando antecedente: ' + e);
    return {
      success: false,
      message: 'Error: ' + e.message
    };
  }
}

/**
 * Obtener Antecedentes de una Historia Clínica
 * @param {string} historiaId - ID de la historia clínica
 * @returns {Object} Array de antecedentes
 */
function obtenerAntecedentes(historiaId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(HOJA_ANTECEDENTES);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return { success: true, data: [] };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const antecedentes = [];
    
    // Filtrar por historia_clinica_id (columna 2)
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === historiaId) {
        const antecedente = {};
        headers.forEach((header, index) => {
          antecedente[header] = data[i][index];
        });
        antecedentes.push(antecedente);
      }
    }
    
    return {
      success: true,
      data: antecedentes
    };
    
  } catch (e) {
    Logger.log('Error obteniendo antecedentes: ' + e);
    return {
      success: false,
      message: 'Error: ' + e.message
    };
  }
}

/**
 * Agregar Evolución (Consulta/Atención)
 * @param {Object} data - Datos de la evolución
 * @returns {Object} Resultado
 */
function agregarEvolucion(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(HOJA_EVOLUCIONES);
    
    if (!sheet) {
      return { success: false, message: 'Hoja Evoluciones no existe' };
    }
    
    // Generar ID
    const lastRow = sheet.getLastRow();
    let numero = 1;
    if (lastRow > 1) {
      const lastId = sheet.getRange(lastRow, 1).getValue();
      numero = parseInt(lastId.split('-')[1]) + 1;
    }
    const evolucionId = 'EVO-' + numero.toString().padStart(3, '0');
    
    const ahora = new Date();
    const usuario = Session.getActiveUser().getEmail() || 'Sistema';
    
    const fila = [
      evolucionId,
      data.historia_clinica_id,
      data.cliente_nombre || '',
      data.fecha_atencion || ahora,
      data.tipo_atencion || 'Consulta',
      data.motivo_consulta || '',
      data.signos_vitales_presion || '',
      data.signos_vitales_pulso || '',
      data.signos_vitales_temperatura || '',
      data.signos_vitales_peso || '',
      data.signos_vitales_altura || '',
      data.examen_fisico || '',
      data.diagnostico || '',
      data.diagnosticos_secundarios || '',
      data.tratamiento_realizado || '',
      data.productos_utilizados || '',
      data.medicamentos_formulados || '',
      data.recomendaciones || '',
      data.proxima_cita || '',
      data.observaciones || '',
      data.profesional || usuario,
      data.duracion_minutos || 0,
      data.estado || 'Completada',
      data.adjuntos || '',
      ahora,
      usuario
    ];
    
    sheet.appendRow(fila);
    
    return {
      success: true,
      evolucionId: evolucionId,
      message: 'Evolución registrada exitosamente'
    };
    
  } catch (e) {
    Logger.log('Error agregando evolución: ' + e);
    return {
      success: false,
      message: 'Error: ' + e.message
    };
  }
}

/**
 * Obtener Evoluciones de una Historia Clínica
 * @param {string} historiaId - ID de la historia clínica
 * @returns {Object} Array de evoluciones
 */
function obtenerEvoluciones(historiaId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(HOJA_EVOLUCIONES);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return { success: true, data: [] };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const evoluciones = [];
    
    // Filtrar por historia_clinica_id (columna 2)
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === historiaId) {
        const evolucion = {};
        headers.forEach((header, index) => {
          evolucion[header] = data[i][index];
        });
        evoluciones.push(evolucion);
      }
    }
    
    // Ordenar por fecha descendente
    evoluciones.sort((a, b) => new Date(b.fecha_atencion) - new Date(a.fecha_atencion));
    
    return {
      success: true,
      data: evoluciones
    };
    
  } catch (e) {
    Logger.log('Error obteniendo evoluciones: ' + e);
    return {
      success: false,
      message: 'Error: ' + e.message
    };
  }
}

// ========================================================================
// MÓDULO DE TRATAMIENTOS (FASE 3)
// ========================================================================

/**
 * Crear un nuevo Tratamiento (Paquete)
 * @param {Object} data - Datos del tratamiento
 */
function crearTratamiento(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(HOJA_TRATAMIENTOS);
    
    if (!sheet) return { success: false, message: 'Hoja Tratamientos no existe' };
    
    // Generar ID Tratamiento: TRT-HCXXX-001
    const idSufijo = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    // Extraer numero de HC si es posible, sino usar random
    const hcPart = data.historia_clinica_id ? data.historia_clinica_id.split('-')[1] : '000';
    const tratamientoId = `TRT-${hcPart}-${idSufijo}`;
    const ahora = new Date();
    const usuario = Session.getActiveUser().getEmail() || 'Sistema';
    
    const fila = [
      tratamientoId,
      data.historia_clinica_id,
      '', // evolucion_id (inicialmente vacío)
      data.cliente_nombre || '',
      data.tipo_tratamiento || 'Corporal',
      data.nombre_tratamiento || 'Tratamiento General',
      data.fecha_inicio || ahora,
      data.fecha_fin_programada || '',
      'En Curso', // Estado inicial
      data.numero_sesiones || 1, // Total sesiones
      0, // Sesiones completadas iniciales
      data.frecuencia || 'Semanal',
      data.area_tratamiento || '',
      '', // productos
      '', // tecnicas
      data.objetivos || '', // resultados_esperados
      '', // resultados_obtenidos
      '', // efectos_adversos
      '', // fotos_antes
      '', // fotos_progreso
      '', // fotos_despues
      data.profesional || '',
      data.costo_total || 0,
      data.observaciones || '',
      ahora,
      usuario
    ];
    
    sheet.appendRow(fila);
    
    return {
      success: true,
      tratamientoId: tratamientoId,
      aviso: 'Tratamiento creado exitosamente'
    };
    
  } catch (e) {
    Logger.log('Error crearTratamiento: ' + e);
    return { success: false, message: e.message };
  }
}

/**
 * Obtener Tratamientos de un Paciente
 */
function obtenerTratamientos(historiaId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(HOJA_TRATAMIENTOS);
    
    if (!sheet) return { success: false, message: 'Hoja Tratamientos no existe' };
    
    const data = sheet.getDataRange().getValues();
    const tratamientos = [];
    
    for (let i = 1; i < data.length; i++) {
        // Columna 1 es historia_clinica_id
       if (String(data[i][1]) === String(historiaId)) {
        tratamientos.push({
          id: data[i][0],
          nombre: data[i][5],
          tipo: data[i][4],
          estado: data[i][8],
          sesiones_total: data[i][9],
          sesiones_completadas: data[i][10],
          fecha_inicio: data[i][6],
          area: data[i][12],
          objetivos: data[i][15]
        });
      }
    }
    
    return { success: true, data: tratamientos };
    
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Registrar avance de sesión en un tratamiento
 * Incrementa contador y puede cambiar estado
 */
function registrarAvanceTratamiento(tratamientoId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(HOJA_TRATAMIENTOS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(tratamientoId)) {
        const row = i + 1;
        // Columna 10 (K): Sesiones Completadas (Index 10 -> Col 11)
        // Columna 9 (J): Total Sesiones (Index 9 -> Col 10)
        
        let actuales = parseInt(data[i][10]) || 0;
        const total = parseInt(data[i][9]) || 1;
        
        if (actuales < total) {
            actuales++;
            sheet.getRange(row, 11).setValue(actuales);
            
            // Si llega al total, marcar completado
            if (actuales >= total) {
                sheet.getRange(row, 9).setValue('Completado'); // Col 9 -> I (Estado)
            }
            
            return { success: true, message: `Sesión registrada (${actuales}/${total})`, sesiones: actuales };
        } else {
            return { success: false, message: 'El tratamiento ya está completado.' };
        }
      }
    }
    
    return { success: false, message: 'Tratamiento no encontrado' };
    
  } catch (e) {
    return { success: false, message: e.message };
  }
}
