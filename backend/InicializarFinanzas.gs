/**
 * InicializarSistema.gs
 * Módulo consolidado para verificar y crear todas las hojas del ERP Esencia Spa.
 * Use ACTION: instalarSistema
 */

// === NOMBRES DE HOJAS ===
const HOJAS = {
    CLIENTES: "Clientes",
    PROVEEDORES: "Proveedores",
    PRODUCTOS: "Productos",
    VENTAS: "Ventas",
    ANULADAS: "Anuladas",
    CIERRE_CAJA: "CierreCaja",
    GASTOS: "Gastos",
    CONFIGURACION: "Configuracion"
};

// === CABECERAS DEFINITIVAS (Orden Crítico) ===
const HEADERS = {
    [HOJAS.CLIENTES]: ["ID", "Documento (CC/NIT)", "Nombre", "Teléfono", "Email", "Dirección", "Notas"],
    [HOJAS.PROVEEDORES]: ["ID", "Documento (CC/NIT)", "Nombre", "Teléfono", "Email", "Dirección", "Notas"],
    [HOJAS.PRODUCTOS]: ["ID", "Nombre", "Código", "Categoría", "Tipo", "Precio Compra", "Precio Venta", "Stock", "Stock Mínimo"],
    [HOJAS.VENTAS]: ["ID Venta", "ID Producto", "Cantidad", "Precio Unitario", "Fecha", "Extra Data", "Usuario"],
    [HOJAS.ANULADAS]: ["ID Venta", "ID Producto", "Cantidad", "Precio Unitario", "Fecha", "Extra Data", "Usuario", "Fecha Anulación", "Motivo"],
    [HOJAS.CIERRE_CAJA]: ["ID Cierre", "Fecha Hora", "Usuario", "Total Sistema", "Total Real", "Diferencia", "Notas", "Detalle JSON"],
    [HOJAS.GASTOS]: ["Fecha", "Concepto", "Monto", "Categoría", "Usuario"],
    [HOJAS.CONFIGURACION]: ["Clave", "Valor", "Descripción"]
};

/**
 * Función Principal de Instalación
 * Verifica cada hoja, la crea si no existe, o valida columnas si ya existe.
 */
function instalarSistema() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let reporte = [];

    Object.keys(HOJAS).forEach(key => {
        const nombreHoja = HOJAS[key];
        let sheet = ss.getSheetByName(nombreHoja);

        if (!sheet) {
            // === CREAR HOJA SI NO EXISTE ===
            sheet = ss.insertSheet(nombreHoja);
            sheet.appendRow(HEADERS[nombreHoja]);
            
            // Formato básico
            sheet.getRange(1, 1, 1, HEADERS[nombreHoja].length).setFontWeight("bold").setBackground("#e0e0e0");
            sheet.setFrozenRows(1);
            
            reporte.push(`✅ Hoja '${nombreHoja}' creada.`);
        } else {
            // === VALIDAR ESTRUCTURA SI YA EXISTE ===
            const headersActuales = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
            const headersEsperados = HEADERS[nombreHoja];
            
            // Caso especial: Migración de Clientes/Proveedores
            if ((nombreHoja === HOJAS.CLIENTES || nombreHoja === HOJAS.PROVEEDORES) && headersActuales[1] !== "Documento (CC/NIT)") {
                reporte.push(`⚠️ Hoja '${nombreHoja}' tiene estructura antigua. Ejecuta migrarEsquema.`);
            } else {
                 reporte.push(`ℹ️ Hoja '${nombreHoja}' ya existe.`);
            }
        }
    });

    // Configuración Inicial si está vacía
    const sheetConfig = ss.getSheetByName(HOJAS.CONFIGURACION);
    if (sheetConfig && sheetConfig.getLastRow() === 1) {
        sheetConfig.appendRow(["empresa_nombre", "Esencia Spa", "Nombre del negocio"]);
        sheetConfig.appendRow(["moneda", "COP", "Moneda principal"]);
        reporte.push("⚙️ Configuración inicial cargada.");
    }

    return reporte.join("\n");
}
