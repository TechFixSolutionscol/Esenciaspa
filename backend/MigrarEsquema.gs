/**
 * MigrarEsquema.gs
 * Script de utilidad para reorganizar las columnas de Clientes y Proveedores.
 * 
 * EJECUTAR UNA SOLA VEZ DESDE EL EDITOR.
 */

function migrarColumnasContactos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojas = ["Clientes", "Proveedores"]; // Aplicar a ambas
  
  hojas.forEach(nombre => {
    const sheet = ss.getSheetByName(nombre);
    if (!sheet) {
      Logger.log(`Hoja ${nombre} no encontrada.`);
      return;
    }
    
    // Leer cabeceras actuales
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Validación para no romper si ya se ejecutó
    // Si la columna B (índice 1) ya se llama "Documento" y NO parece ser el email (que estaba en D originalmente)
    if (headers.length > 1 && headers[1].toString().trim() === "Documento (CC/NIT)") {
       Logger.log(`La hoja ${nombre} ya tiene la estructura correcta.`);
       return;
    }

    // === MIGRACIÓN ===
    
    // 1. Insertar una columna vacía después de ID (A) -> Se convierte en la nueva B
    sheet.insertColumnAfter(1);
    
    // Ahora las columnas se han desplazado:
    // A: ID
    // B: (Nueva vacía)
    // C: Nombre (antes B)
    // D: Telefono (antes C)
    // E: Email (antes D, llamada 'documento' incorrectamente)
    // F: Direccion (antes E)
    
    // 2. Establecer los nombres correctos de las cabeceras
    sheet.getRange("B1").setValue("Documento (CC/NIT)"); // Nueva columna para Cédula
    sheet.getRange("C1").setValue("Nombre");
    sheet.getRange("D1").setValue("Teléfono");
    sheet.getRange("E1").setValue("Email");     // Renombrar la vieja 'documento' que tenía emails
    sheet.getRange("F1").setValue("Dirección");
    sheet.getRange("G1").setValue("Notas");     // Asegurar que existe Notas
    
    // 3. Ajustar anchos sugeridos
    try {
        sheet.setColumnWidth(1, 100); // ID
        sheet.setColumnWidth(2, 120); // Doc
        sheet.setColumnWidth(3, 200); // Nombre
        sheet.setColumnWidth(5, 200); // Email
    } catch(e) {}
    
    Logger.log(`Migración completada para ${nombre}`);
  });
  
  return "Proceso finalizado. Verifica las hojas.";
}
