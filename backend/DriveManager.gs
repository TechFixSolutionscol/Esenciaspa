/**
 * DriveManager.gs
 * Gestión de imágenes en Google Drive
 * Esencia Spa - Sistema de Gestión
 */

// 🔴 IMPORTANTE: Reemplazar con el ID de tu carpeta de Drive si deseas una específica
const DRIVE_FOLDER_ID = 'TU_FOLDER_ID_AQUI'; 

function getDriveFolder() {
  if (DRIVE_FOLDER_ID !== 'TU_FOLDER_ID_AQUI') {
    try {
      return DriveApp.getFolderById(DRIVE_FOLDER_ID);
    } catch (e) {
      Logger.log('⚠️ ID de carpeta inválido, creando nueva carpeta...');
    }
  }
  
  // Buscar carpeta por nombre
  const folderName = 'EsenciaSpa_Imagenes';
  const folders = DriveApp.getFoldersByName(folderName);
  
  if (folders.hasNext()) {
    return folders.next();
  } else {
    // Crear nueva carpeta
    return DriveApp.createFolder(folderName);
  }
}

/**
 * Subir imagen a Google Drive
 * @param {Object} fileData - Datos del archivo (base64)
 * @param {string} productoId - ID del producto/servicio
 * @returns {Object} { fileId, publicUrl }
 */
function uploadImageToDrive(fileData, productoId) {
  try {
    // Decodificar base64
    const blob = Utilities.newBlob(
      Utilities.base64Decode(fileData.base64Data),
      fileData.mimeType,
      fileData.fileName
    );
    
    // Obtener carpeta
    const folder = getDriveFolder();
    
    // Crear archivo
    const file = folder.createFile(blob);
    
    // Intentar hacer público (puede fallar por políticas de dominio)
    let publicUrl = `https://drive.google.com/uc?export=view&id=${file.getId()}`;
    try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
        Logger.log('⚠️ No se pudo hacer público globalmente: ' + e);
        try {
            // Intentar compartir con el dominio (Organización)
            file.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW);
            Logger.log('✅ Compartido con el dominio/organización');
        } catch (e2) {
             Logger.log('⚠️ Falló compartir con dominio, archivo privado: ' + e2);
        }
    }
    
    const fileId = file.getId();
    Logger.log(`✅ Imagen subida: ${fileId} en carpeta ${folder.getName()} (${folder.getUrl()})`);
    
    return {
      success: true,
      fileId: fileId,
      publicUrl: publicUrl,
      fileName: fileData.fileName,
      folderUrl: folder.getUrl() // Return folder URL to user
    };
    
  } catch (e) {
    Logger.log('Error uploadImageToDrive: ' + e);
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * Eliminar imagen de Drive
 * @param {string} fileId - ID del archivo
 * @returns {Object} { success }
 */
function deleteImageFromDrive(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    
    Logger.log(`✅ Imagen eliminada: ${fileId}`);
    
    return { success: true };
    
  } catch (e) {
    Logger.log('Error deleteImageFromDrive: ' + e);
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * Asociar imagen a producto/servicio
 * @param {string} productoId - ID del producto
 * @param {Object} imageData - Datos de la imagen
 * @returns {Object} { success }
 */
function asociarImagenAProducto(productoId, imageData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const productosSheet = ss.getSheetByName('Productos');
    
    const data = productosSheet.getDataRange().getValues();
    const headers = data[0];
    
    let idCol = headers.indexOf('id');
    let imagenUrlCol = headers.indexOf('imagen_url');
    let imagenDriveIdCol = headers.indexOf('imagen_drive_id');

    // 🆕 Si las columnas de imagen no existen, crearlas
    if (imagenUrlCol === -1 || imagenDriveIdCol === -1) {
      Logger.log('⚠️ Columnas de imagen faltantes, creándolas...');
      const lastCol = productosSheet.getLastColumn();
      
      if (imagenUrlCol === -1) {
        productosSheet.getRange(1, lastCol + 1).setValue('imagen_url');
        imagenUrlCol = lastCol; // Ahora es lastCol (0-indexed logic for headers array? No, headers array length logic)
        // Wait, headers array is 0-indexed.
        // If lastCol is 5, new col is 6. Index in headers array would be 5.
        // Let's just re-fetch headers to be safe or use calculated index.
      }
      
      const newLastCol = productosSheet.getLastColumn();
      if (imagenDriveIdCol === -1) {
        productosSheet.getRange(1, newLastCol + 1).setValue('imagen_drive_id');
        imagenDriveIdCol = newLastCol; 
      }
      
      // Update headers array for subsequent logic if needed, but we have the indices now.
      // Note: indexOf returns 0-based index. 
      // If we add at col 6 (index 5), then imagenUrlCol should be 5.
      // But let's keep it simple: re-read headers or just use the new column index.
      // Actually, standard practice:
      
      // Re-leer headers para asegurar indices correctos
      const newData = productosSheet.getDataRange().getValues();
      const newHeaders = newData[0];
      imagenUrlCol = newHeaders.indexOf('imagen_url');
      imagenDriveIdCol = newHeaders.indexOf('imagen_drive_id');
      
      // Re-leer data también si se necesita (aunque las filas siguen igual)
    }

    for (let i = 1; i < data.length; i++) {
        const rowId = String(data[i][idCol]).trim();
        if (rowId === String(productoId).trim()) { // Comparación robusta
            
        // Si ya tenía imagen, eliminar la anterior
        const oldImageId = data[i][imagenDriveIdCol];
        if (oldImageId) {
          try { deleteImageFromDrive(oldImageId); } catch(e) {}
        }
        
        // Actualizar con nueva imagen
        // getRange(row, col) -> col is 1-based.
        // imagenUrlCol is 0-based index from headers array. So +1 is correct.
        productosSheet.getRange(i + 1, imagenUrlCol + 1).setValue(imageData.publicUrl);
        productosSheet.getRange(i + 1, imagenDriveIdCol + 1).setValue(imageData.fileId);
        
        Logger.log(`✅ Imagen asociada a producto ${productoId}`);
        
        return { success: true };
      }
    }
    
    return { success: false, message: 'Producto no encontrado' };
    
  } catch (e) {
    Logger.log('Error asociarImagenAProducto: ' + e);
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * Eliminar imagen de producto
 * @param {string} productoId - ID del producto
 * @returns {Object} { success }
 */
function eliminarImagenDeProducto(productoId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const productosSheet = ss.getSheetByName('Productos');
    
    const data = productosSheet.getDataRange().getValues();
    const headers = data[0];
    
    const idCol = headers.indexOf('id');
    const imagenUrlCol = headers.indexOf('imagen_url');
    const imagenDriveIdCol = headers.indexOf('imagen_drive_id');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === productoId) {
        const imageId = data[i][imagenDriveIdCol];
        
        if (imageId) {
          // Eliminar de Drive
          deleteImageFromDrive(imageId);
          
          // Limpiar campos en Sheet
          productosSheet.getRange(i + 1, imagenUrlCol + 1).setValue('');
          productosSheet.getRange(i + 1, imagenDriveIdCol + 1).setValue('');
          
          Logger.log(`✅ Imagen eliminada de producto ${productoId}`);
          
          return { success: true };
        }
        
        return { success: false, message: 'El producto no tiene imagen' };
      }
    }
    
    return { success: false, message: 'Producto no encontrado' };
    
  } catch (e) {
    Logger.log('Error eliminarImagenDeProducto: ' + e);
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * Subir y asociar imagen (flujo completo)
 * @param {Object} data - { productoId, fileData }
 * @returns {Object} { success, publicUrl }
 */
function subirYAsociarImagen(data) {
  try {
    // 1. Subir a Drive
    const uploadResult = uploadImageToDrive(data.fileData, data.productoId);
    
    if (!uploadResult.success) {
      return uploadResult;
    }
    
    // 2. Asociar a producto
    const asociarResult = asociarImagenAProducto(data.productoId, {
      fileId: uploadResult.fileId,
      publicUrl: uploadResult.publicUrl
    });
    
    if (!asociarResult.success) {
      // Si falla la asociación, eliminar imagen de Drive
      deleteImageFromDrive(uploadResult.fileId);
      return asociarResult;
    }
    
    return {
      success: true,
      fileId: uploadResult.fileId,
      publicUrl: uploadResult.publicUrl,
      message: 'Imagen subida y asociada exitosamente'
    };
    
  } catch (e) {
    Logger.log('Error subirYAsociarImagen: ' + e);
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * Listar imágenes del catálogo
 * @returns {Array} Lista de productos con imágenes
 */
function listarImagenesCatalogo() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const productosSheet = ss.getSheetByName('Productos');
    
    const data = productosSheet.getDataRange().getValues();
    const headers = data[0];
    
    const imagenes = [];
    
    for (let i = 1; i < data.length; i++) {
      const imagenUrl = data[i][headers.indexOf('imagen_url')];
      const imagenDriveId = data[i][headers.indexOf('imagen_drive_id')];
      
      if (imagenUrl && imagenDriveId) {
        imagenes.push({
          id: data[i][headers.indexOf('id')],
          nombre: data[i][headers.indexOf('nombre')],
          categoria: data[i][headers.indexOf('categoria')],
          tipo: data[i][headers.indexOf('tipo')] || data[i][headers.indexOf('es_servicio')],
          imagenUrl: imagenUrl,
          imagenDriveId: imagenDriveId
        });
      }
    }
    
    return imagenes;
    
  } catch (e) {
    Logger.log('Error listarImagenesCatalogo: ' + e);
    return [];
  }
}

/**
 * Obtener productos/servicios sin imagen
 * @returns {Array} Lista de items sin imagen
 */
function getProductosSinImagen() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const productosSheet = ss.getSheetByName('Productos');
    
    const data = productosSheet.getDataRange().getValues();
    const headers = data[0];
    
    const sinImagen = [];
    
    for (let i = 1; i < data.length; i++) {
      const imagenUrl = data[i][headers.indexOf('imagen_url')];
      
      if (!imagenUrl || imagenUrl === '') {
        sinImagen.push({
          id: data[i][headers.indexOf('id')],
          nombre: data[i][headers.indexOf('nombre')],
          categoria: data[i][headers.indexOf('categoria')],
          tipo: data[i][headers.indexOf('tipo')] || data[i][headers.indexOf('es_servicio')]
        });
      }
    }
    
    return sinImagen;
    
  } catch (e) {
    Logger.log('Error getProductosSinImagen: ' + e);
    return [];
  }
}

/**
 * Obtener contenido de imagen en Base64 desde Drive
 * Para saltar restricciones de dominio en previews directos
 */
function getImageContent(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    const base64 = Utilities.base64Encode(blob.getBytes());
    
    return {
      status: 'success',
      data: {
        mime: blob.getContentType(),
        base64: base64
      }
    };
  } catch (e) {
    Logger.log('Error getImageContent: ' + e);
    return { status: 'error', message: e.toString() };
  }
}
