/**
 * PublicoManager.gs
 * Gestión de la API pública para la página web
 * Esencia Spa
 */

/**
 * Obtener servicios para visualización en página web
 */
function getServiciosPublicos() {
  try {
    const ss = getSpreadsheet();
    const productosSheet = ss.getSheetByName(HOJA_PRODUCTOS);
    const data = productosSheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).toLowerCase().trim());
    
    // Mapeo de columnas
    const colMap = {
      id: headers.indexOf('id'),
      nombre: headers.indexOf('nombre'),
      categoria: headers.indexOf('categoria'),
      tipo: headers.indexOf('tipo'),
      precioVenta: headers.indexOf('precio_venta'),
      imagenUrl: headers.indexOf('imagen_url'),
      imagenDriveId: headers.indexOf('imagen_drive_id'),
      descripcion: headers.indexOf('descripcion'), // Nueva columna
      duracion: headers.indexOf('duracion')       // Nueva columna
    };

    const servicios = [];

    for (let i = 1; i < data.length; i++) {
        const tipo = data[i][colMap.tipo];
        
        // Filtrar solo Servicios o Productos marcados para venta
        if (tipo === 'Servicio' || tipo === 'Inventariable') {
            servicios.push({
                id: data[i][colMap.id],
                nombre: data[i][colMap.nombre],
                categoria: data[i][colMap.categoria],
                precio: data[i][colMap.precioVenta],
                imagenUrl: data[i][colMap.imagenUrl],
                imagenDriveId: data[i][colMap.imagenDriveId],
                descripcion: colMap.descripcion > -1 ? data[i][colMap.descripcion] : '',
                duracion: colMap.duracion > -1 ? data[i][colMap.duracion] : 0
            });
        }
    }
    
    return servicios;

  } catch (e) {
    Logger.log('Error getServiciosPublicos: ' + e);
    return [];
  }
}

/**
 * MIGRACIÓN DE DATOS (USO ÚNICO)
 * Poblar la hoja de Productos con la información estática actual
 */
function migrateStaticServices() {
    const serviciosAEstandarizar = [
        // Manicura Estética
        { categoria: "Manicura Estética", nombre: "Manicura Limpieza", duracion: 30, precio: 25000, descripcion: "Mantén tus uñas y cutículas impecables con un acabado natural.", tipo: "Servicio" },
        { categoria: "Manicura Estética", nombre: "Manicura Semi-Hombre", duracion: 50, precio: 35000, descripcion: "Manos pulcras con un acabado discreto y profesional.", tipo: "Servicio" },
        { categoria: "Manicura Estética", nombre: "Manicura Semipermanente - Un Tono", duracion: 75, precio: 50000, descripcion: "Color vibrante y brillo impecable que dura semanas sin preocupaciones.", tipo: "Servicio" },
        { categoria: "Manicura Estética", nombre: "Manicura Semipermanente - Con Diseño", duracion: 90, precio: 60000, descripcion: "Diseños personalizados con colores vibrantes que duran semanas.", tipo: "Servicio" },

        // Gel y Polygel (Manos)
        { categoria: "Gel y Polygel (Manos)", nombre: "Forrado en Gel", duracion: 90, precio: 85000, descripcion: "Refuerza tu uña natural con una cubierta protectora de gel de larga duración.", tipo: "Servicio" },
        { categoria: "Gel y Polygel (Manos)", nombre: "Press On + Semi", duracion: 120, precio: 100000, descripcion: "Manicura de alta durabilidad con acabado impecable y diseño personalizado.", tipo: "Servicio" },
        { categoria: "Gel y Polygel (Manos)", nombre: "Polygel Esculpido (hasta #3) + Semi", duracion: 120, precio: 120000, descripcion: "Transforma tus uñas con longitud, fuerza y acabado semipermanente.", tipo: "Servicio" },
        { categoria: "Gel y Polygel (Manos)", nombre: "Forrado en Polygel + Semi", duracion: 120, precio: 110000, descripcion: "Refuerza tu uña existente con polygel y acabado semipermanente.", tipo: "Servicio" },
        { categoria: "Gel y Polygel (Manos)", nombre: "Retoque Polygel + Semi", duracion: 120, precio: 100000, descripcion: "Mantén tu manicura perfecta cada 20 días con un retoque profesional.", tipo: "Servicio" },

        // Servicios Adicionales (Manos)
        { categoria: "Servicios Adicionales (Manos)", nombre: "Retiro Semi / Rubber / Dipping", duracion: 15, precio: 15000, descripcion: "Retiro cuidadoso de sistema.", tipo: "Servicio" },
        { categoria: "Servicios Adicionales (Manos)", nombre: "Retiro Polygel / Press On", duracion: 25, precio: 20000, descripcion: "Retiro cuidadoso de sistema avanzado.", tipo: "Servicio" },
        { categoria: "Servicios Adicionales (Manos)", nombre: "Reparación Uña Polygel", duracion: 15, precio: 10000, descripcion: "Reparación individual por uña.", tipo: "Servicio" },
        { categoria: "Servicios Adicionales (Manos)", nombre: "Cambio de Color", duracion: 30, precio: 35000, descripcion: "Cambio de color tradicional o semi.", tipo: "Servicio" },

        // Pedicura Estética
        { categoria: "Pedicura Estética", nombre: "Pedicura Estética - Solo Limpieza", duracion: 40, precio: 25000, descripcion: "Cuidado básico que refresca y mantiene tus pies pulcros y saludables.", tipo: "Servicio" },
        { categoria: "Pedicura Estética", nombre: "Pedicura Estética Semipermanente", duracion: 75, precio: 50000, descripcion: "Color impecable y brillo duradero en tus pies por semanas.", tipo: "Servicio" },

        // Servicios Adicionales (Pies)
        { categoria: "Servicios Adicionales (Pies)", nombre: "Pedi Spa", duracion: 20, precio: 30000, descripcion: "Relajación profunda para tus pies.", tipo: "Servicio" },
        { categoria: "Servicios Adicionales (Pies)", nombre: "Reparación Uña Polygel (Pie)", duracion: 10, precio: 10000, descripcion: "Reparación individual uña pie.", tipo: "Servicio" },
        { categoria: "Servicios Adicionales (Pies)", nombre: "Terapia Plantar (Callosidades)", duracion: 20, precio: 25000, descripcion: "Tratamiento específico para zonas callosas.", tipo: "Servicio" },

        // Pedicura Clínica
        { categoria: "Pedicura Clínica", nombre: "Onicocriptosis (Uña Encarnada)", duracion: 60, precio: 80000, descripcion: "Tratamiento especializado y alivio de uñas encarnadas con técnicas clínicas.", tipo: "Servicio" },
        { categoria: "Pedicura Clínica", nombre: "Onicomadesis / Onicolisis", duracion: 60, precio: 80000, descripcion: "Tratamiento profesional para desprendimiento de uñas y patologías relacionadas.", tipo: "Servicio" },
        { categoria: "Pedicura Clínica", nombre: "Quiropodias (Valoración)", duracion: 30, precio: 0, descripcion: "Valoración Gratuita para diagnóstico.", tipo: "Servicio" }
    ];

    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(HOJA_PRODUCTOS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0]; // 0-based

    // 1. Asegurar columnas nuevas
    let descCol = headers.indexOf('descripcion');
    let durCol = headers.indexOf('duracion');
    
    if (descCol === -1) {
        sheet.getRange(1, headers.length + 1).setValue('descripcion');
        descCol = headers.length; // New index
    }
    // Re-check headers length if we added one? No, indexes shift. Safer to re-get but let's assume +1 logic
    // Actually safer to append both then read.
    if (durCol === -1) {
         // If descCol was added, header length increased by 1 effectively for next
         const nextCol = (descCol === headers.length) ? headers.length + 2 : headers.length + 1;
         sheet.getRange(1, nextCol).setValue('duracion');
         durCol = nextCol - 1;
    }
    
    // Refresh headers map
    const newHeaders = sheet.getDataRange().getValues()[0];
    const map = {};
    newHeaders.forEach((h, i) => map[String(h).toLowerCase().trim()] = i);

    let updatedCount = 0;
    let createdCount = 0;

    serviciosAEstandarizar.forEach(servicio => {
        let foundRowIndex = -1;
        
        // Buscar por nombre exacto o aproximado
        for (let i = 1; i < data.length; i++) {
             // data[i] is old data snapshot, might not have new cols, but has Name
             const rowName = String(data[i][map['nombre']]).trim();
             if (rowName.toLowerCase() === servicio.nombre.toLowerCase()) {
                 foundRowIndex = i + 1;
                 break;
             }
        }

        if (foundRowIndex > -1) {
            // ACTUALIZAR
            // Solo actualizamos descripción y duración si están vacías, O forzamos update?
            // "Guardar datos actuales" -> Queremos que la DB refleje la realidad del HTML. Forzamos update.
            sheet.getRange(foundRowIndex, map['descripcion'] + 1).setValue(servicio.descripcion);
            sheet.getRange(foundRowIndex, map['duracion'] + 1).setValue(servicio.duracion);
            sheet.getRange(foundRowIndex, map['categoria'] + 1).setValue(servicio.categoria); // Unificar categorias
            sheet.getRange(foundRowIndex, map['precio_venta'] + 1).setValue(servicio.precio);
            updatedCount++;
        } else {
            // CREAR
            // ID, nombre, cat, tipo, precio_compra, precio_venta, stock, img, img_id, desc, dur
            const newRow = [];
            // Llenar con '' hasta el max length
            for(let k=0; k<newHeaders.length; k++) newRow.push('');
            
            newRow[map['id']] = generateUniqueAppId();
            newRow[map['nombre']] = servicio.nombre;
            newRow[map['categoria']] = servicio.categoria;
            newRow[map['tipo']] = servicio.tipo;
            newRow[map['precio_venta']] = servicio.precio;
            newRow[map['descripcion']] = servicio.descripcion;
            newRow[map['duracion']] = servicio.duracion;
            newRow[map['stock']] = 999; // Servicio infinito
            
            sheet.appendRow(newRow);
            createdCount++;
        }
    });

    return { 
        status: 'success', 
        message: `Migración completada. Actualizados: ${updatedCount}, Creados: ${createdCount}`
    };
}
