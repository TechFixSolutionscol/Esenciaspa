/**
 * Script para actualizar la estructura de la hoja Productos
 * Agrega columnas necesarias para la gestión de citas y duración
 */
function actualizarEstructuraProductos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojaProductos = ss.getSheetByName('Productos');
  
  if (!hojaProductos) {
    Logger.log('❌ No se encontró la hoja Productos');
    return;
  }
  
  const headers = hojaProductos.getRange(1, 1, 1, hojaProductos.getLastColumn()).getValues()[0];
  const nuevasColumnas = [
    { nombre: 'duracion_base_minutos', default: 60 },
    { nombre: 'requiere_retiro_opcional', default: false },
    { nombre: 'duracion_retiro_minutos', default: 30 },
    { nombre: 'es_servicio', default: 'SERVICIO' }
  ];
  
  let columnasAgregadas = 0;
  
  nuevasColumnas.forEach(col => {
    if (headers.indexOf(col.nombre) === -1) {
      // Agregar columna al final
      const ultimaColumna = hojaProductos.getLastColumn();
      hojaProductos.getRange(1, ultimaColumna + 1).setValue(col.nombre);
      
      // Formato encabezado
      const headerCell = hojaProductos.getRange(1, ultimaColumna + 1);
      headerCell.setBackground('#4a86e8');
      headerCell.setFontColor('#ffffff');
      headerCell.setFontWeight('bold');
      
      // Llenar datos por defecto
      const lastRow = hojaProductos.getLastRow();
      if (lastRow > 1) {
        hojaProductos.getRange(2, ultimaColumna + 1, lastRow - 1, 1).setValue(col.default);
      }
      
      columnasAgregadas++;
      Logger.log(`✅ Columna '${col.nombre}' agregada con valor por defecto: ${col.default}`);
    } else {
      Logger.log(`ℹ️ Columna '${col.nombre}' ya existe`);
    }
  });
  
  if (columnasAgregadas > 0) {
    const ui = SpreadsheetApp.getUi();
    ui.alert('Actualización Completada', `Se agregaron ${columnasAgregadas} columnas a la hoja Productos.`, ui.ButtonSet.OK);
  } else {
    Logger.log('No se requirieron cambios.');
  }
}
