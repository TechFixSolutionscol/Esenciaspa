/**
 * FinanzasManager.gs
 * Módulo para manejo de Cierre de Caja y Gastos Operativos.
 */

const HOJA_GASTOS = "Gastos";

/**
 * Función para obtener el resumen del sistema al momento (Corte Parcial)
 * Calcula cuánto debería haber en caja basado en las ventas del día.
 */
function getResumenCaja(fechaStr) {
    const ss = getSpreadsheet();
    const sheetVentas = ss.getSheetByName(HOJA_VENTAS);
    
    // Si no se pasa fecha, usar la de hoy
    const fechaFiltro = fechaStr ? new Date(fechaStr) : new Date();
    fechaFiltro.setHours(0,0,0,0);

    const resumen = {
        totalVentas: 0,
        efectivo: 0,
        tarjeta: 0,
        transferencia: 0,
        nequi: 0,
        daviplata: 0,
        gastos: 0,
        totalEsperado: 0
    };

    if (sheetVentas) {
        const data = sheetVentas.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const fechaVenta = new Date(row[4]); // Columna Fecha
            fechaVenta.setHours(0,0,0,0);

            // Filtrar solo ventas de la fecha seleccionada
            if (fechaVenta.getTime() === fechaFiltro.getTime()) {
                const totalVenta = (parseFloat(row[2]) || 0) * (parseFloat(row[3]) || 0);
                const extraData = String(row[5] || '');
                
                // Intentar extraer método de pago de extraData (si lo guardamos ahí)
                // Convención sugerida: "Pedido: X | Cliente: Y | Pago: Efectivo"
                let metodo = 'Efectivo'; // Default
                const pagoMatch = extraData.match(/Pago:\s*([^|]+)/);
                if (pagoMatch) {
                    metodo = pagoMatch[1].trim();
                }

                resumen.totalVentas += totalVenta;

                // Clasificar por método
                if (metodo.includes('Efectivo')) resumen.efectivo += totalVenta;
                else if (metodo.includes('Tarjeta')) resumen.tarjeta += totalVenta;
                else if (metodo.includes('Transferencia')) resumen.transferencia += totalVenta;
                else if (metodo.includes('Nequi')) resumen.nequi += totalVenta;
                else if (metodo.includes('Daviplata')) resumen.daviplata += totalVenta;
                else resumen.efectivo += totalVenta; // Fallback
            }
        }
    }

    // Calcular gastos del día (si existen)
    const sheetGastos = ss.getSheetByName(HOJA_GASTOS);
    if (sheetGastos) {
        const dataGastos = sheetGastos.getDataRange().getValues();
        for (let i = 1; i < dataGastos.length; i++) {
            const fechaGasto = new Date(dataGastos[i][0]);
            fechaGasto.setHours(0,0,0,0);
            if (fechaGasto.getTime() === fechaFiltro.getTime()) {
                resumen.gastos += (parseFloat(dataGastos[i][2]) || 0);
            }
        }
    }

    // Total Esperado en Caja (Efectivo - Gastos)
    // Asumimos que los gastos salen de caja menor (efectivo)
    resumen.totalEsperado = resumen.efectivo - resumen.gastos;

    return resumen;
}

/**
 * Función para registrar el Cierre de Caja definitivo
 */
function registrarCierreCaja(datosCierre) {
    const ss = getSpreadsheet();
    let sheetCierre = ss.getSheetByName(HOJA_CIERRE_CAJA);
    
    // Auto-crear si no existe (seguridad)
    if (!sheetCierre) {
        inicializarHojaCierreCaja();
        sheetCierre = ss.getSheetByName(HOJA_CIERRE_CAJA);
    }

    const idCierre = generateUniqueAppId(); // Usamos function de Code.gs
    const fechaHora = new Date(); // Fecha real de registro
    
    const row = [
        idCierre,
        fechaHora,
        datosCierre.usuario || 'Sistema',
        datosCierre.totalSistema, // Lo que calculó getResumenCaja
        datosCierre.totalReal,    // Lo que contó el usuario
        datosCierre.diferencia,   // Real - Sistema
        datosCierre.notas || '',
        JSON.stringify(datosCierre.detalles) // Guardar desglose como JSON string
    ];

    sheetCierre.appendRow(row);

    return { success: true, message: `Cierre de caja registrado. Diferencia: ${datosCierre.diferencia}` };
}

/**
 * Registrar un Gasto Operativo
 */
function registrarGasto(concepto, monto, categoria) {
    const ss = getSpreadsheet();
    let sheetGastos = ss.getSheetByName(HOJA_GASTOS);

    if (!sheetGastos) {
        sheetGastos = ss.insertSheet(HOJA_GASTOS);
        sheetGastos.appendRow(["Fecha", "Concepto", "Monto", "Categoría", "Usuario"]);
    }

    sheetGastos.appendRow([
        new Date(),
        concepto,
        monto,
        categoria || 'General',
        'Sistema' // O pasar usuario si se tiene
    ]);

    return { success: true };
}
