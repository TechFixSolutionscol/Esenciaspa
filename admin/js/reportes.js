/**
 * reportes.js
 * FASE 6: Reportes Analytics
 */

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar flatpickr si existe (opcional)
    const fechaInicio = document.getElementById('reporteFechaInicio');
    const fechaFin = document.getElementById('reporteFechaFin');

    // Set default dates: Start of month to today
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

    if (fechaInicio && fechaFin) {
        fechaInicio.value = firstDay.toISOString().split('T')[0];
        fechaFin.value = now.toISOString().split('T')[0];
    }

    const btnCargar = document.getElementById('btnCargarReportes');
    if (btnCargar) {
        btnCargar.addEventListener('click', cargarReportes);
    }
});

async function cargarReportes() {
    const fi = document.getElementById('reporteFechaInicio').value;
    const ff = document.getElementById('reporteFechaFin').value;
    const statusMsg = document.getElementById('statusReportes');

    if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.textContent = 'Cargando métricas...';
        statusMsg.className = 'status-message info';
    }

    try {
        // Ejecutar en paralelo
        const [metricasRes, ventasRes, serviciosRes] = await Promise.all([
            fetch(`${SCRIPT_URL}?action=getMetricasGenerales&fecha_inicio=${fi}&fecha_fin=${ff}`),
            fetch(`${SCRIPT_URL}?action=getReporteVentasDiarias&fecha_inicio=${fi}&fecha_fin=${ff}`),
            fetch(`${SCRIPT_URL}?action=getServiciosPopulares&limit=5`)
        ]);

        const metricasData = await metricasRes.json();
        const ventasData = await ventasRes.json();
        const serviciosData = await serviciosRes.json();

        // 1. Render KPIs
        if (metricasData.success) {
            renderKPIs(metricasData.metricas);
        }

        // 2. Render Gráfico Ventas (Simple CSS Bar Chart)
        if (ventasData.success) {
            renderVentasChart(ventasData.data);
        }

        // 3. Render Top Servicios
        if (serviciosData.success) {
            renderTopServicios(serviciosData.data);
        }

        if (statusMsg) statusMsg.textContent = '';

    } catch (e) {
        console.error(e);
        if (statusMsg) {
            statusMsg.textContent = 'Error al cargar reportes.';
            statusMsg.className = 'status-message error';
        }
    }
}

function renderKPIs(metricas) {
    document.getElementById('kpiVentasTotal').textContent = formatCOP(metricas.total_ventas || 0);
    document.getElementById('kpiNumVentas').textContent = metricas.num_ventas || 0;

    // Calcular ticket promedio
    const ticketPromedio = metricas.num_ventas > 0 ? (metricas.total_ventas / metricas.num_ventas) : 0;
    document.getElementById('kpiTicketPromedio').textContent = formatCOP(ticketPromedio);

    document.getElementById('kpiCitasTotal').textContent = metricas.total_citas || 0;
    document.getElementById('kpiNuevosClientes').textContent = metricas.nuevos_clientes >= 0 ? metricas.nuevos_clientes : '-';
}

function renderVentasChart(data) {
    const container = document.getElementById('chartVentasContainer');
    if (!container) return;

    if (data.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No hay ventas en este periodo.</p>';
        return;
    }

    // Encontrar máximo para escalar
    const maxVal = Math.max(...data.map(d => d.total));

    const barsHtml = data.map(item => {
        const height = maxVal > 0 ? (item.total / maxVal * 100) : 0;
        return `
            <div class="chart-bar-group" style="display:flex; flex-direction:column; align-items:center; flex:1; min-width:30px;">
                <div class="chart-bar" style="height:${height}%; width:20px; background:var(--primary-color); border-radius:4px 4px 0 0;" title="${item.fecha}: ${formatCOP(item.total)}"></div>
                <div class="chart-label" style="font-size:0.7em; color:#666; margin-top:5px; transform:rotate(-45deg); white-space:nowrap;">${item.fecha.slice(5)}</div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div style="display:flex; align-items:flex-end; height:200px; gap:5px; padding-bottom:30px; border-bottom:1px solid #ddd;">
            ${barsHtml}
        </div>
    `;
}

function renderTopServicios(data) {
    const tbody = document.getElementById('topServiciosTableBody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">No hay datos.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map((s, index) => `
        <tr>
            <td style="width:50px; text-align:center; font-weight:bold; color:#666;">#${index + 1}</td>
            <td>${s.nombre}</td>
            <td class="text-center"><strong>${s.cantidad}</strong></td>
        </tr>
    `).join('');
}
