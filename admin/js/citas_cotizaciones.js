/**
 * citas_cotizaciones.js
 * FASE 3: Gestión de Cotizaciones en Panel Admin
 * Esencia Spa - Fixops
 */

// 🔴 IMPORTANTE: Configurar URL del script de Google Apps Script
// SCRIPT_URL ya está definida globalmente en script.js

let cotizacionesPendientes = [];
let cotizacionSeleccionada = null;

/**
 * Inicializar módulo al cargar
 */
document.addEventListener('DOMContentLoaded', () => {
    // Solo inicializar si estamos en la sección de citas-cotizaciones
    if (document.getElementById('seccion_citas_cotizaciones')) {
        setupEventListeners();
        console.log('✅ Módulo de Citas y Cotizaciones inicializado');
    }
});

/**
 * Configurar event listeners
 */
function setupEventListeners() {
    // Botón actualizar lista
    const btnActualizar = document.getElementById('cargarCotizacionesBtn');
    if (btnActualizar) {
        btnActualizar.addEventListener('click', cargarCotizacionesPendientes);
    }

    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => cambiarTab(btn.dataset.tab));
    });

    // Botón confirmar venta en modal
    const btnConfirmar = document.getElementById('btnConfirmarVenta');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', confirmarVenta);
    }
}

/**
 * Cargar cotizaciones pendientes desde backend
 */
async function cargarCotizacionesPendientes() {
    const statusDiv = document.getElementById('statusCitasCotizaciones');
    const tbody = document.getElementById('cotizacionesPendientesBody');
    const countSpan = document.getElementById('countPendientes');

    try {
        statusDiv.className = 'status-message info';
        statusDiv.textContent = '⏳ Cargando cotizaciones...';
        statusDiv.style.display = 'block';

        const response = await fetch(`${SCRIPT_URL}?action=getCotizacionesPendientes`);
        const data = await response.json();

        if (data.status === 'success' && data.data) {
            cotizacionesPendientes = data.data;
            renderCotizacionesTable(cotizacionesPendientes);

            countSpan.textContent = cotizacionesPendientes.length;

            statusDiv.className = 'status-message success';
            statusDiv.textContent = `✅ ${cotizacionesPendientes.length} cotización(es) pendiente(s) cargada(s)`;

            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        } else {
            throw new Error(data.message || 'Error al cargar cotizaciones');
        }
    } catch (error) {
        console.error('Error:', error);
        statusDiv.className = 'status-message error';
        statusDiv.textContent = '❌ Error al cargar cotizaciones: ' + error.message;

        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-exclamation-triangle fa-2x" style="color: #e74c3c;"></i>
                    <p style="margin-top: 10px;">Error al cargar datos. Verifique la conexión.</p>
                </td>
            </tr>
        `;
    }
}

/**
 * Renderizar tabla de cotizaciones
 */
function renderCotizacionesTable(cotizaciones) {
    const tbody = document.getElementById('cotizacionesPendientesBody');

    if (!cotizaciones || cotizaciones.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-inbox fa-3x" style="color: #ccc;"></i>
                    <p style="margin-top: 10px;">No hay cotizaciones pendientes</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = cotizaciones.map(cot => {
        const estadoBadge = getEstadoBadge(cot.cita?.estado || 'PENDIENTE');
        const fecha = formatearFecha(cot.cita?.fecha);
        const total = formatearMoneda(cot.total);

        return `
            <tr>
                <td>${fecha}</td>
                <td>${cot.cita?.hora_inicio || '-'}</td>
                <td>${cot.cliente?.nombre || 'Sin nombre'}</td>
                <td>${cot.cliente?.telefono || '-'}</td>
                <td>${cot.servicio_nombre || 'Sin servicio'}</td>
                <td><strong>${total}</strong></td>
                <td>${estadoBadge}</td>
                <td>
                    <button class="btn primary-btn" style="padding: 6px 12px; font-size: 13px;"
                        onclick="abrirModalFinalizar('${cot.cotizacion_id}')">
                        <i class="fas fa-check-circle"></i> Finalizar
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Abrir modal para finalizar servicio
 */
function abrirModalFinalizar(cotizacionId) {
    const cotizacion = cotizacionesPendientes.find(c => c.cotizacion_id === cotizacionId);

    if (!cotizacion) {
        alert('Cotización no encontrada');
        return;
    }

    cotizacionSeleccionada = cotizacion;

    // Llenar resumen del servicio
    const resumenDiv = document.getElementById('resumenServicio');
    resumenDiv.innerHTML = `
        <h4 style="margin-top: 0; color: var(--primary-color);">
            <i class="fas fa-calendar-check"></i> Resumen del Servicio
        </h4>
        <div style="display: grid; gap: 10px;">
            <p><strong>Cliente:</strong> ${cotizacion.cliente?.nombre || '-'}</p>
            <p><strong>Teléfono:</strong> ${cotizacion.cliente?.telefono || '-'}</p>
            <p><strong>Servicio:</strong> ${cotizacion.servicio_nombre || '-'}</p>
            <p><strong>Fecha:</strong> ${formatearFecha(cotizacion.cita?.fecha)}</p>
            <p><strong>Hora:</strong> ${cotizacion.cita?.hora_inicio || '-'}</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 10px 0;">
            <p style="font-size: 18px; color: var(--secondary-color);">
                <strong>Total a cobrar:</strong> ${formatearMoneda(cotizacion.total)}
            </p>
        </div>
    `;

    // Mostrar modal
    document.getElementById('modalFinalizarServicio').style.display = 'flex';
}

/**
 * Cerrar modal
 */
function cerrarModalFinalizar() {
    document.getElementById('modalFinalizarServicio').style.display = 'none';
    cotizacionSeleccionada = null;
    document.getElementById('metodoPago').value = 'Efectivo';
    document.getElementById('observacionesPago').value = '';
}

/**
 * Confirmar venta
 */
async function confirmarVenta() {
    if (!cotizacionSeleccionada) {
        alert('No hay cotización seleccionada');
        return;
    }

    const metodoPago = document.getElementById('metodoPago').value;
    const observaciones = document.getElementById('observacionesPago').value;

    const btnConfirmar = document.getElementById('btnConfirmarVenta');
    btnConfirmar.disabled = true;
    btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'convertirCotizacionEnVenta',
                cotizacion_id: cotizacionSeleccionada.cotizacion_id,
                metodo_pago: metodoPago,
                fecha: new Date() // Enviamos fecha actual
            })
        });

        const result = await response.json();

        if (result.success) {
            // Mostrar toast de éxito
            mostrarToast('✅ Venta registrada exitosamente', 'success');

            // Cerrar modal
            cerrarModalFinalizar();

            // Recargar lista
            await cargarCotizacionesPendientes();
        } else {
            throw new Error(result.message || 'Error al convertir cotización');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('❌ Error: ' + error.message, 'error');
    } finally {
        btnConfirmar.disabled = false;
        btnConfirmar.innerHTML = '<i class="fas fa-dollar-sign"></i> Confirmar Venta';
    }
}

/**
 * Cambiar tab
 */
function cambiarTab(tabName) {
    // Actualizar botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Actualizar contenido
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    const contentId = `content${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`;
    const targetContent = document.getElementById(contentId);

    if (targetContent) {
        targetContent.classList.add('active');
    } else {
        console.warn(`⚠️ No se encontró el contenido del tab: ${contentId}`);
    }
}

/**
 * Utilidades
 */
function formatearFecha(fecha) {
    if (!fecha) return '-';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatearMoneda(valor) {
    if (!valor) return '$0';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(valor);
}

function getEstadoBadge(estado) {
    const badges = {
        'PENDIENTE': '<span class="badge badge-pendiente">Pendiente</span>',
        'CONFIRMADA': '<span class="badge badge-confirmada">Confirmada</span>',
        'ATENDIDA': '<span class="badge badge-atendida">Atendida</span>',
        'CANCELADA': '<span class="badge" style="background: #e74c3c; color: white;">Cancelada</span>'
    };
    return badges[estado] || '<span class="badge">-</span>';
}

function mostrarToast(mensaje, tipo = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.warn('Toast container not found');
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.style.cssText = `
        background: ${tipo === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        margin-bottom: 10px;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = mensaje;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========================================================================
// SECCIÓN: DASHBOARD DE CITAS
// ========================================================================

/**
 * Cargar KPIs del Dashboard de Citas
 */
async function cargarKPIsCitas() {
    console.log('📊 Cargando KPIs de citas...');

    try {
        // Obtener estadísticas con rango de hoy
        const hoy = new Date();
        const fechaInicio = formatearFechaISO(hoy);
        const fechaFin = formatearFechaISO(hoy);

        const response = await fetch(`${SCRIPT_URL}?action=getEstadisticasCitas&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
        const data = await response.json();

        if (data.status === 'success' && data.data) {
            const stats = data.data;

            // Actualizar KPIs
            actualizarKPI('kpi-citas-hoy', stats.total || 0);
            actualizarKPI('kpi-pendientes', stats.pendientes || 0);
            actualizarKPI('kpi-atendidas', stats.atendidas || 0);
            actualizarKPI('kpi-ingresos', formatearMoneda(stats.ingresos || 0));

            console.log('✅ KPIs actualizados:', stats);
        } else {
            console.error('❌ Error en respuesta de estadísticas:', data);
        }
    } catch (error) {
        console.error('❌ Error cargando KPIs:', error);
        mostrarToast('Error al cargar estadísticas', 'error');
    }
}

/**
 * Actualizar valor de un KPI
 */
function actualizarKPI(kpiId, valor) {
    const kpiElement = document.getElementById(kpiId);
    if (kpiElement) {
        const valorElement = kpiElement.querySelector('.kpi-valor');
        if (valorElement) {
            valorElement.textContent = valor;
        }
    }
}

/**
 * Cargar citas de hoy
 */
async function cargarCitasHoy() {
    console.log('📅 Cargando citas de hoy...');

    const tbody = document.getElementById('citasHoyBody');
    const btnActualizar = document.querySelector('#contentCitasHoy button');

    if (!tbody) {
        console.warn('⚠️ Elemento citasHoyBody no encontrado');
        return;
    }

    try {
        // Deshabilitar botón durante carga
        if (btnActualizar) {
            btnActualizar.disabled = true;
            btnActualizar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
        }

        const response = await fetch(`${SCRIPT_URL}?action=getCitasHoy`);
        const data = await response.json();

        if (data.status === 'success' && data.data) {
            renderCitasHoyTable(data.data);
            console.log(`✅ ${data.data.length} citas cargadas para hoy`);
        } else {
            throw new Error(data.message || 'Error al cargar citas');
        }
    } catch (error) {
        console.error('❌ Error cargando citas:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-exclamation-triangle fa-2x" style="color: #e74c3c;"></i>
                    <p style="margin-top: 10px;">Error al cargar citas de hoy</p>
                </td>
            </tr>
        `;
        mostrarToast('Error al cargar citas', 'error');
    } finally {
        // Rehabilitar botón
        if (btnActualizar) {
            btnActualizar.disabled = false;
            btnActualizar.innerHTML = '<i class="fas fa-sync"></i> Actualizar';
        }
    }
}

/**
 * Renderizar tabla de citas de hoy
 */
function renderCitasHoyTable(citas) {
    const tbody = document.getElementById('citasHoyBody');

    if (!citas || citas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-calendar-check fa-2x"></i>
                    <p style="margin-top: 10px;">No hay citas programadas para hoy</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = citas.map(cita => `
        <tr>
            <td>${cita.hora || '-'}</td>
            <td><strong>${cita.cliente || 'Cliente Anónimo'}</strong></td>
            <td>${cita.servicio || '-'}</td>
            <td>${cita.telefono || '-'}</td>
            <td>
                <span class="badge badge-${cita.estado?.toLowerCase() || 'pendiente'}">
                    ${cita.estado || 'Pendiente'}
                </span>
            </td>
            <td>${formatearMoneda(cita.precio || 0)}</td>
            <td>
                <div class="action-buttons" style="display: flex; gap: 5px;">
                    ${cita.estado !== 'Atendida' ? `
                        <button onclick="cambiarEstadoCita('${cita.id}', 'Atendida')" 
                                class="btn-action btn-success" 
                                title="Marcar como atendida">
                            <i class="fas fa-check"></i>
                        </button>
                        <button onclick="abrirModalReagendar('${cita.id}')" 
                                class="btn-action btn-warning" 
                                title="Reagendar">
                            <i class="fas fa-clock"></i>
                        </button>
                    ` : ''}
                    <button onclick="cancelarCita('${cita.id}')" 
                            class="btn-action btn-danger" 
                            title="Cancelar cita">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Cambiar estado de una cita
 */
async function cambiarEstadoCita(citaId, nuevoEstado) {
    if (!confirm(`¿Marcar esta cita como ${nuevoEstado}?`)) {
        return;
    }

    console.log(`🔄 Cambiando estado de cita ${citaId} a ${nuevoEstado}`);

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'cambiarEstadoCita',
                citaId: citaId,
                nuevoEstado: nuevoEstado
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            mostrarToast(`✅ Cita marcada como ${nuevoEstado}`, 'success');
            // Recargar datos
            await cargarCitasHoy();
            await cargarKPIsCitas();
        } else {
            throw new Error(data.message || 'Error al cambiar estado');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        mostrarToast('Error al cambiar estado de la cita', 'error');
    }
}

/**
 * Cancelar una cita
 */
async function cancelarCita(citaId) {
    const motivo = prompt('¿Por qué desea cancelar esta cita?\n(Opcional: ingrese un motivo)');

    if (motivo === null) {
        return; // Usuario canceló
    }

    console.log(`❌ Cancelando cita ${citaId}`);

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'cancelarCita',
                citaId: citaId,
                motivo: motivo || 'Sin especificar'
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            mostrarToast('✅ Cita cancelada exitosamente', 'success');
            // Recargar datos
            await cargarCitasHoy();
            await cargarKPIsCitas();
        } else {
            throw new Error(data.message || 'Error al cancelar');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        mostrarToast('Error al cancelar la cita', 'error');
    }
}

/**
 * Abrir modal para reagendar cita
 */
function abrirModalReagendar(citaId) {
    // Por ahora, usar prompt simple
    // TODO: Implementar modal más elaborado
    const nuevaFecha = prompt('Ingrese la nueva fecha (YYYY-MM-DD):');
    const nuevaHora = prompt('Ingrese la nueva hora (HH:MM):');

    if (!nuevaFecha || !nuevaHora) {
        return;
    }

    reagendarCita(citaId, nuevaFecha, nuevaHora);
}

/**
 * Reagendar una cita
 */
async function reagendarCita(citaId, nuevaFecha, nuevaHora) {
    console.log(`📅 Reagendando cita ${citaId} para ${nuevaFecha} ${nuevaHora}`);

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'reagendarCita',
                citaId: citaId,
                nuevaFecha: nuevaFecha,
                nuevaHora: nuevaHora
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            mostrarToast('✅ Cita reagendada exitosamente', 'success');
            // Recargar datos
            await cargarCitasHoy();
            await cargarKPIsCitas();
        } else {
            throw new Error(data.message || 'Error al reagendar');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        mostrarToast('Error al reagendar la cita', 'error');
    }
}

/**
 * Inicializar Dashboard de Citas cuando se activa la sección
 */
function inicializarDashboardCitas() {
    console.log('🚀 Inicializando Dashboard de Citas');

    // Cargar KPIs
    cargarKPIsCitas();

    // Setup botón actualizar en tab "Citas Hoy"
    const btnActualizar = document.querySelector('#contentCitasHoy button');
    if (btnActualizar) {
        btnActualizar.addEventListener('click', async () => {
            await cargarCitasHoy();
            await cargarKPIsCitas();
        });
    }

    // Auto-cargar citas si el tab está activo
    const tabCitasHoy = document.getElementById('contentCitasHoy');
    if (tabCitasHoy && tabCitasHoy.classList.contains('active')) {
        cargarCitasHoy();
    }
}

/**
 * Formatear fecha a ISO (YYYY-MM-DD)
 */
function formatearFechaISO(fecha) {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Inicializar cuando se haga click en la sección de citas
document.addEventListener('DOMContentLoaded', () => {
    const menuLink = document.querySelector('a[data-section="seccion_citas_cotizaciones"]');
    if (menuLink) {
        menuLink.addEventListener('click', () => {
            setTimeout(() => {
                inicializarDashboardCitas();
            }, 200);
        });
    }

    // También inicializar si ya estamos en la sección
    const seccion = document.getElementById('seccion_citas_cotizaciones');
    if (seccion && seccion.classList.contains('active')) {
        setTimeout(() => {
            inicializarDashboardCitas();
        }, 500);
    }
});

// Exponer funciones globales necesarias
window.abrirModalFinalizar = abrirModalFinalizar;
window.cerrarModalFinalizar = cerrarModalFinalizar;
window.cambiarEstadoCita = cambiarEstadoCita;
window.cancelarCita = cancelarCita;
window.abrirModalReagendar = abrirModalReagendar;
window.reagendarCita = reagendarCita;
window.cargarCitasHoy = cargarCitasHoy;
window.cargarKPIsCitas = cargarKPIsCitas;
