/**
 * cierre_caja.js
 * FASE 3 ERP: Control de Cierre Diario de Caja
 */

let resumenSistema = null;

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('cierre-caja-section')) {
        setupCierreCajaListeners();
        // Cargar datos de hoy al inicio
        cargarResumenCaja();
    }
});

function setupCierreCajaListeners() {
    // Inputs de conteo real para calcular diferencia en vivo
    ['realEfectivo', 'realTarjeta', 'realTransferencia'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', calcularDiferencias);
    });

    const btnCerrar = document.getElementById('btnCerrarCaja');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', enviarCierreCaja);
    }
}

async function cargarResumenCaja() {
    console.log('💰 Cargando resumen de caja...');

    try {
        const fecha = new Date().toISOString().split('T')[0]; // Hoy
        const response = await fetch(`${SCRIPT_URL}?action=getResumenCaja&fecha=${fecha}`);
        const result = await response.json();

        if (result.status === 'success') {
            resumenSistema = result.data;
            renderizarResumenSistema(resumenSistema);
        } else {
            console.error('Error cargando caja:', result.message);
        }
    } catch (error) {
        console.error('Error de red:', error);
    }
}

function renderizarResumenSistema(data) {
    // Llenar columna "Sistema"
    document.getElementById('sysEfectivo').textContent = formatMoney(data.efectivo);
    document.getElementById('sysTarjeta').textContent = formatMoney(data.tarjeta);
    document.getElementById('sysTransferencia').textContent = formatMoney(data.transferencia + data.nequi + data.daviplata);
    document.getElementById('sysGastos').textContent = formatMoney(data.gastos);

    // Total Esperado = Efectivo + Bancos - Gastos (Los gastos salen del efectivo generalmente)
    // Pero para el cuadre, comparamos medio por medio.

    // Aquí asumimos Total Sistema General
    const totalVentas = data.totalVentas;
    document.getElementById('sysTotalVentas').textContent = formatMoney(totalVentas);

    // Pre-llenar inputs con 0
    // calcularDiferencias() se encargará del resto
}

function calcularDiferencias() {
    if (!resumenSistema) return;

    const realEf = parseFloat(document.getElementById('realEfectivo').value) || 0;
    const realTar = parseFloat(document.getElementById('realTarjeta').value) || 0;
    const realTrans = parseFloat(document.getElementById('realTransferencia').value) || 0;

    // Calcular diferencias por medio
    const difEf = realEf - (resumenSistema.efectivo - resumenSistema.gastos); // Al efectivo se le restan los gastos
    const difTar = realTar - resumenSistema.tarjeta;
    const difTrans = realTrans - (resumenSistema.transferencia + resumenSistema.nequi + resumenSistema.daviplata);

    // Actualizar UI Diferencias
    updateDiffUI('difEfectivo', difEf);
    updateDiffUI('difTarjeta', difTar);
    updateDiffUI('difTransferencia', difTrans);

    // Total Real
    const totalReal = realEf + realTar + realTrans;
    document.getElementById('totalRealCierre').textContent = formatMoney(totalReal);

    // Diferencia Total
    const totalEsperado = resumenSistema.totalEsperado + resumenSistema.tarjeta + (resumenSistema.transferencia + resumenSistema.nequi + resumenSistema.daviplata);
    const difTotal = totalReal - totalEsperado;

    const elTotal = document.getElementById('difTotalCierre');
    elTotal.textContent = formatMoney(difTotal);
    elTotal.className = difTotal < 0 ? 'text-danger' : (difTotal > 0 ? 'text-success' : '');
}

function updateDiffUI(id, valor) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = formatMoney(valor);
    el.className = valor < 0 ? 'text-danger' : (valor > 0 ? 'text-success' : 'text-muted');
}

async function enviarCierreCaja() {
    if (!confirm('¿Seguro que deseas cerrar la caja del día? Esta acción guardará el reporte.')) return;

    const btn = document.getElementById('btnCerrarCaja');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    const realEf = parseFloat(document.getElementById('realEfectivo').value) || 0;
    const realTar = parseFloat(document.getElementById('realTarjeta').value) || 0;
    const realTrans = parseFloat(document.getElementById('realTransferencia').value) || 0;

    // Recalcular totales finales
    const totalReal = realEf + realTar + realTrans;
    // Total Sistema Neto = (Efectivo - Gastos) + Tarjeta + Transf
    const totalSistNeto = (resumenSistema.efectivo - resumenSistema.gastos) + resumenSistema.tarjeta + (resumenSistema.transferencia + resumenSistema.nequi + resumenSistema.daviplata);

    const datosCierre = {
        usuario: 'Admin', // Idealmente obtener del auth
        totalSistema: totalSistNeto,
        totalReal: totalReal,
        diferencia: totalReal - totalSistNeto,
        notas: document.getElementById('notasCierre').value,
        detalles: {
            efectivo: { sistema: resumenSistema.efectivo, real: realEf, gastos: resumenSistema.gastos },
            tarjeta: { sistema: resumenSistema.tarjeta, real: realTar },
            transferencia: { sistema: (resumenSistema.transferencia + resumenSistema.nequi + resumenSistema.daviplata), real: realTrans }
        }
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'registrarCierreCaja',
                datosCierre: datosCierre
            })
        });
        const result = await response.json();

        if (result.status === 'success') {
            alert('✅ Cierre de caja guardado correctamente.');
            // Limpiar o redirigir
            document.getElementById('notasCierre').value = '';
            btn.innerHTML = '<i class="fas fa-check"></i> Cierre Guardado';
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
        btn.disabled = false;
        btn.innerHTML = 'Guardar Cierre';
    }
}
