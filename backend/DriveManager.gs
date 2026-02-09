/**
 * DriveManager.gs
 * Gestión de imágenes en Google Drive
 * Esencia Spa - Sistema de Gestión
 */

// 🔴 IMPORTANTE: Reemplazar con el ID de tu carpeta de Drive
const DRIVE_FOLDER_ID = 'TU_FOLDER_ID_AQUI'; // Copiar del PASO 3 de FASE 0

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
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    
    // Crear archivo
    const file = folder.createFile(blob);
    
    // Hacer público
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Obtener URL pública
    const fileId = file.getId();
    const publicUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    
    Logger.log(`✅ Imagen subida: ${fileId}`);
    
    return {
      success: true,
      fileId: fileId,
      publicUrl: publicUrl,
      fileName: fileData.fileName
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
    
    const idCol = headers.indexOf('id');
    const imagenUrlCol = headers.indexOf('imagen_url');
    const imagenDriveIdCol = headers.indexOf('imagen_drive_id');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === productoId) {
        // Si ya tenía imagen, eliminar la anterior
        const oldImageId = data[i][imagenDriveIdCol];
        if (oldImageId) {
          deleteImageFromDrive(oldImageId);
        }
        
        // Actualizar con nueva imagen
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
