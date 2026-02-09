/**
 * InicializarFinanzas.gs
 * Script para configurar las hojas de la Fase 4: Finanzas
 */

function inicializarHojasFinanzas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Hoja de GASTOS
  const HOJA_GASTOS = 'Gastos';
  const HEADERS_GASTOS = ['id', 'fecha', 'categoria', 'descripcion', 'monto', 'metodo_pago', 'registrado_por'];
  
  let sheetGastos = ss.getSheetByName(HOJA_GASTOS);
  if (!sheetGastos) {
    sheetGastos = ss.insertSheet(HOJA_GASTOS);
    sheetGastos.appendRow(HEADERS_GASTOS);
    // Formato negrita y congelar primera fila
    sheetGastos.getRange(1, 1, 1, HEADERS_GASTOS.length).setFontWeight('bold');
    sheetGastos.setFrozenRows(1);
    
    // Validacion de Categoria (opcional)
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Insumos', 'Servicios Públicos', 'Nómina', 'Mantenimiento', 'Publicidad', 'Otros'], true)
      .build();
    sheetGastos.getRange('C2:C1000').setDataValidation(rule);
    
    Logger.log('✅ Hoja Gastos creada exitosamente');
  } else {
    Logger.log('ℹ️ Hoja Gastos ya existe');
  }

  // 2. Hoja de CAJA (Cierre Diario)
  const HOJA_CAJA = 'Caja';
  const HEADERS_CAJA = ['fecha', 'total_ventas', 'total_gastos', 'balance_diario', 'saldo_acumulado', 'observaciones'];
  
  let sheetCaja = ss.getSheetByName(HOJA_CAJA);
  if (!sheetCaja) {
    sheetCaja = ss.insertSheet(HOJA_CAJA);
    sheetCaja.appendRow(HEADERS_CAJA);
    sheetCaja.getRange(1, 1, 1, HEADERS_CAJA.length).setFontWeight('bold');
    sheetCaja.setFrozenRows(1);
    Logger.log('✅ Hoja Caja creada exitosamente');
  } else {
    Logger.log('ℹ️ Hoja Caja ya existe');
  }
}
