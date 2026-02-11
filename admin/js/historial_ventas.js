/**
 * historial_ventas.js
 * FASE 1 ERP: Gestión de Historial de Ventas y Anulaciones
 * Esencia Spa
 */

let historialFacturas = [];
let facturaSeleccionada = null;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar si existe la sección
    if (document.getElementById('historial-ventas')) {
        setupHistorialEventListeners();
        console.log('✅ Módulo de Historial de Ventas inicializado');
    }
});

function setupHistorialEventListeners() {
    // Botón refrescar
    const btnRefrescar = document.getElementById('btnRefrescarHistorial');
    if (btnRefrescar) {
        btnRefrescar.addEventListener('click', cargarHistorialVentas);
    }

    // Filtro de búsqueda
    const inputBusqueda = document.getElementById('searchHistorial');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', (e) => {
            filtrarHistorial(e.target.value);
        });
    }

    // Botón confirmar anulación
    const btnConfirmarAnular = document.getElementById('btnConfirmarAnulacion');
    if (btnConfirmarAnular) {
        btnConfirmarAnular.addEventListener('click', confirmarAnulacion);
    }
}

/**
 * Cargar historial desde backend
 */
async function cargarHistorialVentas() {
    const tbody = document.getElementById('historialVentasBody');
    const statusDiv = document.getElementById('statusHistorial');

    try {
        statusDiv.style.display = 'block';
        statusDiv.className = 'status-message info';
        statusDiv.textContent = '⏳ Cargando historial...';
        tbody.innerHTML = '';

        const response = await fetch(`${SCRIPT_URL}?action=getHistorialFacturas`);
        const data = await response.json();

        if (data.status === 'success') {
            historialFacturas = data.data;
            renderHistorialTable(historialFacturas);
            statusDiv.style.display = 'none';
        } else {
            throw new Error(data.message || 'Error al cargar historial');
        }
    } catch (error) {
        console.error(error);
        statusDiv.className = 'status-message error';
        statusDiv.textContent = '❌ Error: ' + error.message;
    }
}

/**
 * Renderizar tabla
 */
function renderHistorialTable(facturas) {
    const tbody = document.getElementById('historialVentasBody');

    if (facturas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">No hay ventas registradas.</td></tr>`;
        return;
    }

    tbody.innerHTML = facturas.map(f => {
        const fecha = new Date(f.fecha).toLocaleDateString() + ' ' + new Date(f.fecha).toLocaleTimeString();
        const estadoClass = f.estado === 'ANULADA' ? 'badge-anulada' : 'badge-activa';
        const estadoLabel = f.estado === 'ANULADA' ? 'ANULADA' : 'ACTIVA';

        return `
            <tr class="${f.estado === 'ANULADA' ? 'row-anulada' : ''}">
                <td><strong>${f.id}</strong></td>
                <td>${fecha}</td>
                <td>${f.cliente || 'Cliente General'}</td>
                <td>${formatMoney(f.total)}</td>
                <td><span class="badge ${estadoClass}">${estadoLabel}</span></td>
                <td>
                    <button class="btn-icon" onclick="verDetalleFactura('${f.id}')" title="Ver Detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${f.estado === 'ACTIVA' ? `
                    <button class="btn-icon btn-danger" onclick="abrirModalAnular('${f.id}')" title="Anular Factura">
                        <i class="fas fa-ban"></i>
                    </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Filtrar tabla localmente
 */
function filtrarHistorial(query) {
    if (!query) {
        renderHistorialTable(historialFacturas);
        return;
    }
    const lowerQuery = query.toLowerCase();
    const filtradas = historialFacturas.filter(f =>
        f.id.toLowerCase().includes(lowerQuery) ||
        f.cliente.toLowerCase().includes(lowerQuery)
    );
    renderHistorialTable(filtradas);
}

/**
 * Ver detalles (Modal)
 */
function verDetalleFactura(id) {
    const factura = historialFacturas.find(f => f.id === id);
    if (!factura) return;

    const modal = document.getElementById('modalDetalleFactura');
    const contenido = document.getElementById('detalleFacturaContent');

    let html = `
        <div class="invoice-header">
            <h3>Factura #${factura.id}</h3>
            <span class="badge ${factura.estado === 'ANULADA' ? 'badge-anulada' : 'badge-activa'}">${factura.estado}</span>
        </div>
        <p><strong>Fecha:</strong> ${new Date(factura.fecha).toLocaleString()}</p>
        <p><strong>Cliente:</strong> ${factura.cliente}</p>
        ${factura.estado === 'ANULADA' ? `<p class="text-danger"><strong>Motivo Anulación:</strong> ${factura.motivo_anulacion}</p>` : ''}
        
        <table class="table-simple" style="width:100%; margin-top:15px;">
            <thead>
                <tr>
                    <th>Producto/Servicio</th>
                    <th>Cant</th>
                    <th>Precio</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>
    `;

    factura.items.forEach(item => {
        html += `
            <tr>
                <td>${item.producto}</td>
                <td>${item.cantidad}</td>
                <td>${formatMoney(item.precio)}</td>
                <td>${formatMoney(item.subtotal)}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3" style="text-align:right"><strong>TOTAL:</strong></td>
                    <td><strong>${formatMoney(factura.total)}</strong></td>
                </tr>
            </tfoot>
        </table>
    `;

    contenido.innerHTML = html;
    modal.style.display = 'flex';
}

/**
 * Abrir modal de anulación
 */
function abrirModalAnular(id) {
    facturaSeleccionada = id;
    document.getElementById('motivoAnulacion').value = '';
    document.getElementById('modalAnularFactura').style.display = 'flex';
}

/**
 * Confirmar anulación
 */
async function confirmarAnulacion() {
    if (!facturaSeleccionada) return;

    const motivo = document.getElementById('motivoAnulacion').value;
    if (!motivo.trim()) {
        alert('Debe ingresar un motivo para la anulación.');
        return;
    }

    if (!confirm('¿Está seguro de anular esta factura? Esta acción revertirá el inventario y no se puede deshacer.')) {
        return;
    }

    const btn = document.getElementById('btnConfirmarAnulacion');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'anularFactura',
                order_id: facturaSeleccionada,
                motivo: motivo
            })
        });
        const data = await response.json();

        if (data.status === 'success') {
            alert('✅ Factura anulada correctamente');
            cerrarModalAnular();
            cargarHistorialVentas(); // Recargar tabla
        } else {
            throw new Error(data.message || 'Error al anular');
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Confirmar Anulación';
    }
}

// Cerrar modales
window.cerrarModalDetalle = () => document.getElementById('modalDetalleFactura').style.display = 'none';
window.cerrarModalAnular = () => document.getElementById('modalAnularFactura').style.display = 'none';

// Utility
function formatMoney(amount) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
}

// Exponer globalmente
window.verDetalleFactura = verDetalleFactura;
window.abrirModalAnular = abrirModalAnular;
