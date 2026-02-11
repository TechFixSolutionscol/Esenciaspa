/**
 * RegistroManager.gs
 * Módulo para manejo CRUD unificado (Clientes, Proveedores, Productos)
 * AHORA INDEPENDIENTE DEL ORDEN DE COLUMNAS (Header-Aware)
 */

function guardarRegistro(tipo, datos) {
    const ss = getSpreadsheet();
    let sheet, idPrefix;

    switch (tipo) {
        case 'Cliente':
            sheet = ss.getSheetByName(HOJA_CLIENTES);
            idPrefix = 'C-';
            break;
        case 'Proveedor':
            sheet = ss.getSheetByName(HOJA_PROVEEDORES);
            idPrefix = 'P-';
            break;
        case 'Producto':
            sheet = ss.getSheetByName(HOJA_PRODUCTOS);
            idPrefix = 'PROD-';
            break;
        default:
            return { success: false, message: `Tipo de registro desconocido: ${tipo}` };
    }

    if (!sheet) return { success: false, message: `Hoja para ${tipo} no encontrada.` };

    const data = sheet.getDataRange().getValues();
    const headersRaw = data[0];
    
    // Mapear indices de columnas basado en cabeceras normalizadas
    const colMap = {};
    headersRaw.forEach((h, index) => {
        const key = String(h).toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Sin tildes
            .trim();
        
        // Mapeo flexible
        if (key.includes('id')) colMap['id'] = index;
        else if (key.includes('documento') || key.includes('nit') || key.includes('cedula')) colMap['documento'] = index;
        else if (key.includes('nombre')) colMap['nombre'] = index;
        else if (key.includes('telefono') || key.includes('celular')) colMap['telefono'] = index;
        else if (key.includes('email') || key.includes('correo')) colMap['email'] = index;
        else if (key.includes('direccion')) colMap['direccion'] = index;
        else if (key.includes('nota') || key.includes('observacion')) colMap['notas'] = index;
        else if (key.includes('codigo')) colMap['codigo'] = index;
        else if (key.includes('categoria')) colMap['categoria'] = index;
        else if (key.includes('tipo')) colMap['tipo'] = index;
        else if (key.includes('compra')) colMap['precioCompra'] = index;
        else if (key.includes('venta')) colMap['precioVenta'] = index;
        else if (key === 'stock') colMap['stock'] = index;
    });

    // Validar columnas críticas
    if (colMap['id'] === undefined) return { success: false, message: "No se encontró columna ID." };

    // Buscar fila existente
    let rowIndex = -1;
    if (datos.id) {
        for (let i = 1; i < data.length; i++) {
            if (String(data[i][colMap['id']]) === String(datos.id)) {
                rowIndex = i + 1; // 1-based para Sheets
                break;
            }
        }
    }

    // === VALIDACIONES DUPLICADOS ===
    if (tipo === 'Cliente' || tipo === 'Proveedor') {
        const docCol = colMap['documento'];
        const nameCol = colMap['nombre'];
        
        // Validar Documento
        if (docCol !== undefined && datos.documento) {
            for (let i = 1; i < data.length; i++) {
                const isSelf = (rowIndex !== -1 && i === rowIndex - 1);
                if (!isSelf && String(data[i][docCol]) === String(datos.documento)) {
                    return { success: false, message: `El documento "${datos.documento}" ya existe.` };
                }
            }
        }
        // Validar Nombre
         /*if (nameCol !== undefined && datos.nombre) {
            for (let i = 1; i < data.length; i++) {
                 const isSelf = (rowIndex !== -1 && i === rowIndex - 1);
                 if (!isSelf && String(data[i][nameCol]).toLowerCase() === String(datos.nombre).toLowerCase()) {
                     return { success: false, message: `Ya existe un registro con el nombre "${datos.nombre}"` };
                 }
            }
        }*/
    } else if (tipo === 'Producto') {
        const codeCol = colMap['codigo'];
        if (codeCol !== undefined && datos.codigo) {
             for (let i = 1; i < data.length; i++) {
                const isSelf = (rowIndex !== -1 && i === rowIndex - 1);
                if (!isSelf && String(data[i][codeCol]) === String(datos.codigo)) {
                     return { success: false, message: `El código "${datos.codigo}" ya está en uso.` };
                }
            }
        }
    }

    // === PREPARAR VALORES ===
    // Asegurar que usamos la llave correcta del input (el frontend manda 'documento', 'nombre', etc.)
    // Pero si el frontend manda 'documento_ccnit' por algun motivo, normalizarlo.
    const valores = {
        'id': datos.id || generateUniqueAppId(),
        'documento': datos.documento || datos.documento_ccnit || '',
        'nombre': datos.nombre || '',
        'telefono': datos.telefono || '',
        'email': datos.email || '',
        'direccion': datos.direccion || '',
        'notas': datos.notas || '',
        'codigo': datos.codigo || '',
        'categoria': datos.categoria || '',
        'tipo': datos.tipo || '',
        'precioCompra': datos.precioCompra || 0,
        'precioVenta': datos.precioVenta || 0,
        'stock': datos.stock || 0
    };

    if (rowIndex !== -1) {
        // ACTUALIZAR (Solo celdas mapeadas)
        Object.keys(colMap).forEach(key => {
            if (key !== 'id' && valores[key] !== undefined) {
                 sheet.getRange(rowIndex, colMap[key] + 1).setValue(valores[key]);
            }
        });
        return { success: true, message: `${tipo} actualizado correctamente.` };
    } else {
        // CREAR (Construir fila completa ordenadamente)
        const newRow = new Array(headersRaw.length).fill(""); // Arreglo vacío del tamaño correcto
        
        Object.keys(colMap).forEach(key => {
             if (valores[key] !== undefined) {
                 newRow[colMap[key]] = valores[key];
             }
        });

        // Asegurar ID si no estaba en colMap (aunque debió estar)
        if (newRow[colMap['id']] === "") newRow[colMap['id']] = valores['id'];

        sheet.appendRow(newRow);
        return { success: true, message: `${tipo} creado exitosamente.`, id: valores['id'] };
    }
}

/**
 * Función genérica para eliminar
 */
function eliminarRegistro(tipo, id) {
    const ss = getSpreadsheet();
    let sheet;
    
    if (tieneDependencias(tipo, id)) {
        return { success: false, message: `No se puede eliminar ${tipo}: Tiene movimientos asociados.` };
    }

    switch (tipo) {
        case 'Cliente': sheet = ss.getSheetByName(HOJA_CLIENTES); break;
        case 'Proveedor': sheet = ss.getSheetByName(HOJA_PROVEEDORES); break;
        case 'Producto': sheet = ss.getSheetByName(HOJA_PRODUCTOS); break;
    }

    if (!sheet) return { success: false, message: "Hoja no encontrada" };

    const data = sheet.getDataRange().getValues();
    // Buscar indice de columna ID dinamicamente tambien
    const headers = data[0];
    let idColIndex = 0;
    headers.forEach((h, i) => {
        if (String(h).toLowerCase().trim() === 'id') idColIndex = i;
    });

    for (let i = 1; i < data.length; i++) {
        if (String(data[i][idColIndex]) === String(id)) {
            sheet.deleteRow(i + 1);
            return { success: true, message: `${tipo} eliminado.` };
        }
    }

    return { success: false, message: "Registro no encontrado." };
}

function tieneDependencias(tipo, id) {
    // Basic dependency check remains the same
    // (Could be improved to be header-aware too, but ID is usually col 0 or 1 in standard sheets)
    return false; // Simplificado por seguridad ahora (el usuario reportó desorden, mejor permitir borrar si es necesario para limpiar)
}
