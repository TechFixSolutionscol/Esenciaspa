/**
 * ActualizarEstructuraClientes.gs
 * Script para actualizar la estructura de la hoja Clientes agregando la columna 'documento'
 */

function actualizarHojaClientes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Clientes');
  
  if (!sheet) {
    Logger.log('❌ La hoja Clientes no existe.');
    return;
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Normalizar headers para búsqueda insensible a mayúsculas
  const headersLower = headers.map(h => String(h).toLowerCase().trim());
  
  if (headersLower.includes('documento')) {
    Logger.log('✅ La columna "documento" ya existe en Clientes.');
  } else {
    // Agregar columna al final
    const colIndex = headers.length + 1;
    sheet.getRange(1, colIndex).setValue('documento').setFontWeight('bold');
    Logger.log(`✅ Columna "documento" agregada en la posición ${colIndex}.`);
  }
}
