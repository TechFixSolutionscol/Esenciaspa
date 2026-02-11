/**
 * alertas.js
 * Gestión de Alertas Frontend
 * Esencia Spa - FixOps ERP
 */

async function cargarAlertas() {
    console.log("Cargando alertas del sistema...");
    const container = document.getElementById('alertas-content');
    if (!container) return;

    container.innerHTML = '<p class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando alertas...</p>';

    try {
        const response = await fetch(`${SCRIPT_URL}?action=getSystemAlerts`);
        const result = await response.json();

        if (result.status === 'success' || result.data) { // Ajuste por si el backend devuelve directo
            const data = result.data || result;
            renderAlertas(data, container);
            updateBadge(data.summary);
        } else {
            container.innerHTML = '<p class="text-center text-danger">Error al cargar alertas.</p>';
        }
    } catch (e) {
        console.error("Error cargando alertas:", e);
        container.innerHTML = '<p class="text-center text-danger">Error de conexión.</p>';
    }
}

function renderAlertas(data, container) {
    let html = '';

    // 1. Alertas de Stock
    if (data.lowStock && data.lowStock.length > 0) {
        html += `
            <div class="card warning-card" style="margin-bottom: 20px;">
                <div class="card-header bg-warning text-white">
                    <h3><i class="fas fa-exclamation-triangle"></i> Stock Bajo (${data.lowStock.length})</h3>
                </div>
                <div class="card-body">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Producto</th>
                                <th>Stock Actual</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.lowStock.map(p => `
                                <tr>
                                    <td>${p.id}</td>
                                    <td>${p.nombre}</td>
                                    <td style="font-weight:bold; color:${p.stock === 0 ? 'red' : 'orange'}">${p.stock}</td>
                                    <td><span class="badge ${p.stock === 0 ? 'badge-danger' : 'badge-warning'}">${p.nivel}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="card success-card" style="margin-bottom: 20px;">
                <div class="card-body text-center">
                    <h3 class="text-success"><i class="fas fa-check-circle"></i> Todo el inventario está bajo control.</h3>
                </div>
            </div>
        `;
    }

    // 2. Alertas de Cotizaciones
    if (data.pendingQuotes && data.pendingQuotes.length > 0) {
        html += `
            <div class="card info-card">
                <div class="card-header bg-info text-white">
                    <h3><i class="fas fa-clock"></i> Cotizaciones Pendientes (${data.pendingQuotes.length})</h3>
                </div>
                <div class="card-body">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID Cotización</th>
                                <th>Cliente</th>
                                <th>Fecha</th>
                                <th>Días Pendiente</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.pendingQuotes.map(c => `
                                <tr>
                                    <td>${c.id}</td>
                                    <td>${c.cliente}</td>
                                    <td>${c.fecha}</td>
                                    <td><span class="badge ${c.dias > 3 ? 'badge-danger' : 'badge-info'}">${c.dias} días</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="card success-card">
                <div class="card-body text-center">
                    <h3 class="text-success"><i class="fas fa-check-circle"></i> No hay cotizaciones pendientes de larga duración.</h3>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function updateBadge(summary) {
    if (!summary) return;
    const totalAlerts = (summary.lowStockCount || 0) + (summary.pendingQuotesCount || 0);

    // Buscar elemento badge en sidebar (si existe)
    const badge = document.getElementById('alertas-badge');
    if (badge) {
        if (totalAlerts > 0) {
            badge.textContent = totalAlerts;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}
