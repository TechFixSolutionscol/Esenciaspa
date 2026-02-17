/**
 * clientes.js
 * FASE 5: Gestión de Clientes (CRM)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar si estamos en la sección correcta (opcional, o lazy load)
    const btnCargar = document.getElementById('btnCargarClientes');
    if (btnCargar) {
        btnCargar.addEventListener('click', cargarClientesCRM);
    }

    // Búsqueda en tiempo real
    const searchInput = document.getElementById('searchClientesCRM');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => filtrarClientesCRM(e.target.value));
    }
});

let clientesCache = [];

/**
 * Cargar lista de clientes desde el backend
 */
async function cargarClientesCRM() {
    const tableBody = document.getElementById('clientesTableBody');
    const statusMsg = document.getElementById('statusClientes');

    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando clientes...</td></tr>';

    try {
        const response = await fetch(`${SCRIPT_URL}?action=getClientes`);
        const data = await response.json();

        if (data.status === 'success') {
            clientesCache = data.data;
            renderClientesTable(clientesCache);
            if (statusMsg) statusMsg.textContent = '';
        } else {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error: ${data.message}</td></tr>`;
        }
    } catch (e) {
        console.error(e);
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error de conexión</td></tr>`;
    }
}

/**
 * Renderizar tabla de clientes
 */
function renderClientesTable(clientes) {
    const tableBody = document.getElementById('clientesTableBody');
    const countBadge = document.getElementById('totalClientesBadge');

    if (countBadge) countBadge.textContent = clientes.length;

    if (clientes.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No se encontraron clientes.</td></tr>';
        return;
    }

    tableBody.innerHTML = clientes.map(c => `
        <tr>
            <td><strong>${c.nombre}</strong></td>
            <td>${c.telefono || '-'}</td>
            <td>${c.email || '-'}</td>
            <td>${c.ultima_visita || 'Nunca'}</td>
            <td class="text-center">
                <span class="badge ${c.total_servicios > 0 ? 'badge-atendida' : 'badge-pendiente'}">
                    ${c.total_servicios} reservas
                </span>
            </td>
            <td class="actions-cell">
                <button class="btn btn-sm secondary-btn" onclick="verHistorialCliente('${c.id}')" title="Ver Historial">
                    <i class="fas fa-history"></i>
                </button>
                <button class="btn btn-sm primary-btn" onclick="abrirModalEditar('Cliente', {id:'${c.id}', nombre:'${c.nombre}', telefono:'${c.telefono}', email:'${c.email}'})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Filtrar tabla localmente
 */
function filtrarClientesCRM(query) {
    if (!query) {
        renderClientesTable(clientesCache);
        return;
    }

    const lowerQ = query.toLowerCase();
    const filtrados = clientesCache.filter(c =>
        (c.nombre && c.nombre.toLowerCase().includes(lowerQ)) ||
        (c.telefono && c.telefono.includes(lowerQ)) ||
        (c.email && c.email.toLowerCase().includes(lowerQ))
    );

    renderClientesTable(filtrados);
}

/**
 * Ver historial detallado de un cliente
 */
async function verHistorialCliente(clienteId) {
    const modal = document.getElementById('modalHistorialCliente');
    const content = document.getElementById('historialClienteContent');
    const title = document.getElementById('historialClienteTitle');

    if (!modal) return;

    // Mostrar modal cargando
    modal.style.display = 'block';
    if (title) title.textContent = 'Cargando historial...';
    if (content) content.innerHTML = '<div class="text-center p-4"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';

    try {
        const response = await fetch(`${SCRIPT_URL}?action=getHistorialCliente&id=${clienteId}`);
        const data = await response.json();

        if (data.success) {
            const cli = data.cliente;
            const hist = data.historial;

            if (title) title.textContent = `Historial de ${cli.nombre}`;

            // Renderizar Información y Timeline
            let html = `
                <div class="cliente-summary p-3 mb-3" style="background:#f8f9fa; border-radius:8px;">
                    <div class="row">
                        <div class="col"><strong>📞 Teléfono:</strong> ${cli.telefono || 'N/A'}</div>
                        <div class="col"><strong>📧 Email:</strong> ${cli.email || 'N/A'}</div>
                        <div class="col"><strong>🆔 ID:</strong> ${cli.id}</div>
                    </div>
                </div>
                
                <h4 class="mb-3">Línea de Tiempo</h4>
                <div class="timeline">
            `;

            if (hist.length === 0) {
                html += `<p class="text-muted text-center">No hay registros de actividad.</p>`;
            } else {
                html += hist.map(item => {
                    const icon = item.tipo === 'VENTA' ? 'fa-shopping-bag' : 'fa-calendar-check';
                    const color = item.tipo === 'VENTA' ? '#28a745' : '#17a2b8';
                    const montoStr = item.monto && item.monto !== '-' ? formatCOP(item.monto) : '';

                    return `
                        <div class="timeline-item" style="display:flex; gap:15px; margin-bottom:15px; border-left: 2px solid #eee; padding-left:15px;">
                            <div class="timeline-icon" style="color:${color}; font-size:1.2em; width:25px;">
                                <i class="fas ${icon}"></i>
                            </div>
                            <div class="timeline-content" style="flex:1;">
                                <div class="d-flex justify-content-between">
                                    <strong>${item.tipo}</strong>
                                    <small class="text-muted">${item.fecha}</small>
                                </div>
                                <div>${item.detalle}</div>
                                ${montoStr ? `<div style="font-weight:bold; color:${color}">${montoStr}</div>` : ''}
                                <span class="badge badge-${item.estado.toLowerCase()}">${item.estado}</span>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            html += '</div>';
            content.innerHTML = html;

        } else {
            content.innerHTML = `<div class="alert alert-danger">${data.message || data.error}</div>`;
        }

    } catch (e) {
        console.error(e);
        content.innerHTML = `<div class="alert alert-danger">Error de conexión al cargar historial.</div>`;
    }
}

function cerrarModalHistorial() {
    document.getElementById('modalHistorialCliente').style.display = 'none';
}
