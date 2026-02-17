/**
 * ClientesManager.gs
 * FASE 5: Gestión de Clientes, Historial y CRM
 * Esencia Spa - Sistema de Gestión
 */

/**
 * Obtener lista de clientes con métricas básicas
 * @returns {Array} Lista de clientes
 */
function getClientes() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const clientesSheet = ss.getSheetByName('Clientes');
    
    if (!clientesSheet) return [];
    
    const data = clientesSheet.getDataRange().getValues();
    const headers = data[0];
    
    // Mapeo básico de columnas (similar a buscarOCrearCliente)
    const headersRaw = headers.map(h => String(h).trim().toLowerCase());
    const findCol = (aliases) => headersRaw.findIndex(h => aliases.some(a => h.includes(a)));

    let idCol = findCol(['id', 'codigo', 'documento']); 
    if (idCol === -1) idCol = 0;
    
    let nombreCol = findCol(['nombre', 'cliente']);
    if (nombreCol === -1) nombreCol = 1;
    
    let telefonoCol = findCol(['telefono', 'celular']);
    if (telefonoCol === -1) telefonoCol = 2;
    
    let emailCol = findCol(['email', 'correo']);

    let ultVisitaCol = findCol(['ultima_visita', 'última visita']);
    let totalServiciosCol = findCol(['total_servicios', 'frecuencia']);
    
    const clientes = [];
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[idCol]) continue; // Skip filas vacías

        clientes.push({
            id: row[idCol],
            nombre: row[nombreCol],
            telefono: row[telefonoCol],
            email: emailCol !== -1 ? row[emailCol] : '',
            ultima_visita: ultVisitaCol !== -1 ? formatDate(row[ultVisitaCol]) : '-',
            total_servicios: totalServiciosCol !== -1 ? (row[totalServiciosCol] || 0) : 0
        });
    }
    
    return clientes.reverse(); // Mostrar más recientes primero (si están ordenados por fecha creación)
    
  } catch (e) {
    Logger.log('Error getClientes: ' + e);
    return [];
  }
}

/**
 * Helper para formatear fecha
 */
function formatDate(dateVal) {
    if (!dateVal) return '-';
    if (dateVal instanceof Date) return Utilities.formatDate(dateVal, 'America/Bogota', 'yyyy-MM-dd');
    return String(dateVal).split('T')[0];
}

/**
 * Obtener historial de un cliente (Citas y Ventas)
 * @param {string} clienteId
 * @returns {Object} { cliente: {}, historial: [] }
 */
function getHistorialCliente(clienteId) {
    try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        
        // 1. Obtener datos del cliente
        const clientesSheet = ss.getSheetByName('Clientes');
        const cliData = clientesSheet.getDataRange().getValues();
        let cliente = null;
        
        // Búsqueda simple por ID (asumiendo Col 0 es ID por simplicidad, o re-usando lógica robusta)
        // Por eficiencia usaremos la lógica robusta simplificada
        const cliHeaders = cliData[0].map(h => String(h).trim().toLowerCase());
        const idCol = cliHeaders.findIndex(h => h.includes('id') || h.includes('codigo')) || 0;
        
        for(let i=1; i<cliData.length; i++) {
            if(String(cliData[i][idCol]) === String(clienteId)) {
                cliente = {
                    id: cliData[i][idCol],
                    nombre: cliData[i][1], // Asumiendo nombre en col 1
                    telefono: cliData[i][2], // Asumiendo tel en col 2
                    email: cliData[i][3] || ''
                };
                break;
            }
        }
        
        if (!cliente) return { success: false, message: 'Cliente no encontrado' };
        
        const historial = [];
        
        // 2. Buscar en CITAS
        const citasSheet = ss.getSheetByName('Citas');
        if (citasSheet) {
            const citasData = citasSheet.getDataRange().getValues();
            // Headers: id, cliente_id, servicio_id, fecha, hora, ..., estado
            // Asumimos orden estándar o buscamos headers
            const cHeaders = citasData[0].map(h => String(h).toLowerCase());
            const cResIdx = {
                id: cHeaders.indexOf('id'),
                cliId: cHeaders.indexOf('cliente_id'),
                servId: cHeaders.indexOf('servicio_id'),
                fecha: cHeaders.indexOf('fecha'),
                estado: cHeaders.indexOf('estado')
            };
            
            for(let i=1; i<citasData.length; i++) {
                if (String(citasData[i][cResIdx.cliId]) === String(clienteId)) {
                    historial.push({
                        tipo: 'CITA',
                        fecha: formatDate(citasData[i][cResIdx.fecha]),
                        detalle: `Servicio ID: ${citasData[i][cResIdx.servId]}`,
                        estado: citasData[i][cResIdx.estado],
                        monto: '-' 
                    });
                }
            }
        }
        
        // 3. Buscar en COTIZACIONES (Convertidas en ventas)
        const cotSheet = ss.getSheetByName('Cotizaciones');
        if (cotSheet) {
            const cotData = cotSheet.getDataRange().getValues();
            // Headers: cot_id, cita_id, cliente_id, ..., total, estado
            const ctHeaders = cotData[0].map(h => String(h).toLowerCase());
            const ctIdx = {
                cliId: ctHeaders.indexOf('cliente_id'),
                fecha: ctHeaders.indexOf('fecha_creacion'),
                total: ctHeaders.indexOf('total'),
                estado: ctHeaders.indexOf('estado')
            };
            
            for(let i=1; i<cotData.length; i++) {
                 if (String(cotData[i][ctIdx.cliId]) === String(clienteId)) {
                    const estado = cotData[i][ctIdx.estado];
                    historial.push({
                        tipo: estado === 'Convertida' ? 'VENTA' : 'COTIZACION',
                        fecha: formatDate(cotData[i][ctIdx.fecha]),
                        detalle: estado === 'Convertida' ? 'Venta realizada' : 'Cotización pendiente',
                        estado: estado,
                        monto: cotData[i][ctIdx.total]
                    });
                }
            }
        }
        
        // Ordenar cronológicamente descendente
        historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        return {
            success: true,
            cliente: cliente,
            historial: historial
        };
        
    } catch(e) {
        Logger.log('Error getHistorialCliente: ' + e);
        return { success: false, error: e.message };
    }
}


/**
 * Buscar o crear cliente (Movido desde CitasManager.gs)
 * @param {Object} clienteData - Datos del cliente
 * @returns {Object} { clienteId, esNuevo }
 */
function buscarOCrearCliente(clienteData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const clientesSheet = ss.getSheetByName('Clientes');
    
    const data = clientesSheet.getDataRange().getValues();
    const headers = data[0];
    
    // Detección robusta de columnas
    const headersRaw = headers.map(h => String(h).trim().toLowerCase());
    const findCol = (aliases) => headersRaw.findIndex(h => aliases.some(a => h.includes(a)));

    let telefonoCol = findCol(['telefono', 'teléfono', 'celular', 'whatsapp']);
    if (telefonoCol === -1) telefonoCol = 2; // Fallback

    let emailCol = findCol(['email', 'correo']); // Puede ser -1

    let idCol = findCol(['id', 'codigo', 'código', 'documento']); 
    if (idCol === -1) idCol = 0; // Fallback
    
    // Buscar por teléfono o email
    for (let i = 1; i < data.length; i++) {
        const telefono = String(data[i][telefonoCol] || '').trim().replace(/\D/g, ''); // Limpiar teléfono
        const email = String(data[i][emailCol] || '').trim().toLowerCase();
        
        const searchTel = String(clienteData.telefono || '').trim().replace(/\D/g, '');
        const searchEmail = String(clienteData.email || '').trim().toLowerCase();
      
        // Comparación laxa de teléfono (si contiene al menos 7 dígitos coincidentes)
        const telMatch = searchTel && telefono && (telefono.includes(searchTel) || searchTel.includes(telefono));
        const emailMatch = emailCol !== -1 && searchEmail && email === searchEmail;
      
        if (telMatch || emailMatch) {
            return {
                success: true,
                clienteId: data[i][idCol],
                esNuevo: false
            };
        }
    }
    
    // Cliente no existe, crear nuevo usando ID Estandarizado
    // Intentamos usar la función global si existe, si no, generamos uno local compatible
    let nuevoId;
    try {
        nuevoId = generateUniqueAppId(); 
    } catch(e) {
        nuevoId = 'id-' + (new Date().getTime().toString(36) + Math.random().toString(36).substring(2, 9)).toUpperCase();
    }
    
    // Construir fila para nuevo cliente respetando columnas
    const newRow = new Array(headers.length).fill('');
    
    // Indices adicionales para completar
    let nombreCol = findCol(['nombre', 'cliente']);
    if (nombreCol === -1) nombreCol = 1;

    // Asignar valores
    newRow[idCol] = nuevoId;
    newRow[nombreCol] = clienteData.nombre;
    newRow[telefonoCol] = clienteData.telefono;
    if (emailCol !== -1) newRow[emailCol] = clienteData.email || '';
    
    // Llenar fecha registro si existe columna 'fecha' o 'registro'
    let fechaRegCol = findCol(['fecha', 'registro', 'created']);
    if (fechaRegCol !== -1) newRow[fechaRegCol] = new Date();

    clientesSheet.appendRow(newRow);
    
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
 * Buscar clientes por nombre, teléfono o documento
 * @param {string} query - Texto de búsqueda
 * @returns {Array} Lista de clientes coincidentes
 */
function buscarCliente(query) {
  try {
    if (!query || query.length < 3) return []; // Mínimo 3 caracteres
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Clientes');
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    
    // Identificar columnas
    const idCol = headers.findIndex(h => h.includes('id') || h.includes('codigo')) || 0;
    const nombreCol = headers.findIndex(h => h.includes('nombre') || h.includes('cliente')) || 1;
    const telefonoCol = headers.findIndex(h => h.includes('telefono') || h.includes('celular')) || 2;
    const documentoCol = headers.findIndex(h => h.includes('documento') || h.includes('nit') || h.includes('cc') || h.includes('identificacion'));
    const emailCol = headers.findIndex(h => h.includes('email') || h.includes('correo'));
    const direccionCol = headers.findIndex(h => h.includes('direccion'));

    const queryNorm = String(query).toLowerCase();
    const resultados = [];
    
    // Convertir array de arrays a objetos para búsqueda
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[idCol]) continue; // Skip filas vacías

        const nombre = String(row[nombreCol] || '').toLowerCase();
        const telefono = String(row[telefonoCol] || '');
        const documento = documentoCol !== -1 ? String(row[documentoCol] || '') : '';
        const email = emailCol !== -1 ? String(row[emailCol] || '').toLowerCase() : '';
        
        if (nombre.includes(queryNorm) || 
            telefono.includes(queryNorm) || 
            (documentoCol !== -1 && documento.includes(queryNorm)) || 
            email.includes(queryNorm)) {
            
            resultados.push({
                id: row[idCol],
                nombre: row[nombreCol],
                telefono: row[telefonoCol],
                documento: documentoCol !== -1 ? row[documentoCol] : '',
                email: emailCol !== -1 ? row[emailCol] : '',
                direccion: direccionCol !== -1 ? row[direccionCol] : ''
            });

            if (resultados.length >= 10) break; // Limite de resultados
        }
    }
    
    return resultados;
    
  } catch (e) {
    Logger.log('Error buscarCliente: ' + e);
    return [];
  }
}
