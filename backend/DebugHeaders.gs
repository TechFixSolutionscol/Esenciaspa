function debugSheetHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ['Cotizaciones', 'Citas', 'Clientes', 'Productos', 'Ventas'];
  
  let log = '--- HEADERS REPORT ---\n';
  
  sheets.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (!sheet) {
      log += `❌ Hoja '${name}' NO EXISTE\n`;
    } else {
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      log += `✅ Hoja '${name}': [${headers.join(', ')}]\n`;
      // Ver indices especificos problematicos
      if (name === 'Cotizaciones') {
          log += `   Indices: id=${headers.indexOf('id')}, cita_id=${headers.indexOf('cita_id')}, cliente_id=${headers.indexOf('cliente_id')}, total=${headers.indexOf('total')}\n`;
      }
    }
  });
  
  Logger.log(log);
  return log;
}
