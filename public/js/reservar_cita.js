/**
 * reservar_cita.js
 * Lógica del formulario de reserva de citas
 * Esencia Spa
 */

// 🔴 IMPORTANTE: Reemplazar con tu URL de Apps Script deployment
const SCRIPT_URL = 'TU_SCRIPT_URL_AQUI';

let servicioActual = null;
let servicios = [];

// Cargar servicios al iniciar
document.addEventListener('DOMContentLoaded', async () => {
    // Establecer fecha mínima (hoy)
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').setAttribute('min', hoy);
    document.getElementById('fecha').value = hoy;

    await cargarServicios();
    setupEventListeners();
});

/**
 * Cargar servicios desde backend
 */
async function cargarServicios() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getInventario`);
        const data = await response.json();

        if (data.status === 'success') {
            // Filtrar solo servicios
            servicios = data.data.filter(p =>
                p.es_servicio === 'SERVICIO' ||
                p.tipo === 'Servicio' ||
                p.categoria === 'Servicios'
            );

            const select = document.getElementById('servicio');
            select.innerHTML = '<option value="">-- Seleccione un servicio --</option>' +
                servicios.map(s => `<option value="${s.id}">${s.nombre}</option>`).join('');
        } else {
            mostrarError('Error al cargar servicios');
        }
    } catch (e) {
        console.error('Error cargando servicios:', e);
        mostrarError('No se pudieron cargar los servicios. Intente nuevamente.');
    }
}

/**
 * Configurar event listeners
 */
function setupEventListeners() {
    const servicioSelect = document.getElementById('servicio');
    const requiereRetiroCheck = document.getElementById('requiere-retiro');
    const horaInput = document.getElementById('hora');
    const fechaInput = document.getElementById('fecha');

    // Al cambiar servicio
    servicioSelect.addEventListener('change', async (e) => {
        await actualizarDuracion();
    });

    // Al marcar/desmarcar retiro
    requiereRetiroCheck.addEventListener('change', async () => {
        await actualizarDuracion();
    });

    // Al cambiar hora
    horaInput.addEventListener('change', () => {
        actualizarHoraFin();
    });

    // Submit del formulario
    document.getElementById('reserva-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await crearReserva();
    });
}

/**
 * Actualizar duración al cambiar servicio o retiro
 */
async function actualizarDuracion() {
    const servicioId = document.getElementById('servicio').value;

    if (!servicioId) {
        document.getElementById('duracion-info').style.display = 'none';
        document.getElementById('retiro-group').style.display = 'none';
        servicioActual = null;
        return;
    }

    const requiereRetiro = document.getElementById('requiere-retiro').checked;

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'calcularDuracion',
                servicio_id: servicioId,
                requiere_retiro: requiereRetiro
            })
        });

        const data = await response.json();

        if (data.success) {
            servicioActual = data;

            // Mostrar checkbox de retiro solo si el servicio lo permite
            if (data.requiereRetiroOpcional && data.duracionRetiro > 0) {
                document.getElementById('retiro-group').style.display = 'block';
            } else {
                document.getElementById('retiro-group').style.display = 'none';
                document.getElementById('requiere-retiro').checked = false;
            }

            // Mostrar duración
            document.getElementById('duracion-display').textContent = data.duracionTotal;
            document.getElementById('duracion-info').style.display = 'block';

            actualizarHoraFin();
        } else {
            mostrarError('Error al calcular duración: ' + data.error);
        }
    } catch (e) {
        console.error('Error calculando duración:', e);
        mostrarError('Error de conexión al calcular duración');
    }
}

/**
 * Actualizar hora fin estimada
 */
function actualizarHoraFin() {
    if (!servicioActual) return;

    const horaInicio = document.getElementById('hora').value;
    if (!horaInicio) return;

    const [horas, minutos] = horaInicio.split(':');
    const inicio = new Date();
    inicio.setHours(parseInt(horas), parseInt(minutos), 0, 0);

    const fin = new Date(inicio.getTime() + (servicioActual.duracionTotal * 60000));

    const horaFin = fin.getHours().toString().padStart(2, '0') + ':' +
        fin.getMinutes().toString().padStart(2, '0');

    document.getElementById('hora-fin-display').textContent = horaFin;
}

/**
 * Crear reserva
 */
async function crearReserva() {
    // Validar que se calculó la duración
    if (!servicioActual) {
        mostrarError('Por favor seleccione un servicio');
        return;
    }

    // Mostrar loading
    document.getElementById('loading').classList.add('active');
    document.getElementById('submit-btn').disabled = true;
    ocultarAlerta();

    const formData = new FormData(document.getElementById('reserva-form'));
    const data = {
        action: 'crearCita',
        servicio_id: formData.get('servicio_id'),
        fecha: formData.get('fecha'),
        hora_inicio: formData.get('hora_inicio'),
        cliente_nombre: formData.get('cliente_nombre'),
        cliente_telefono: formData.get('cliente_telefono'),
        cliente_email: formData.get('cliente_email') || '',
        observaciones: formData.get('observaciones') || '',
        requiere_retiro: document.getElementById('requiere-retiro').checked
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            mostrarExito(result);
        } else {
            mostrarError(result.message || 'Error al crear la cita');
        }
    } catch (e) {
        console.error('Error al crear cita:', e);
        mostrarError('Error de conexión. Por favor intente nuevamente.');
    } finally {
        document.getElementById('loading').classList.remove('active');
        document.getElementById('submit-btn').disabled = false;
    }
}

/**
 * Mostrar mensaje de éxito
 */
function mostrarExito(result) {
    const alertDiv = document.getElementById('alert');
    alertDiv.className = 'alert success active';

    alertDiv.innerHTML = `
        <h3>✅ ¡Cita reservada exitosamente!</h3>
        <p><strong>ID de cita:</strong> ${result.citaId}</p>
        <p><strong>Duración:</strong> ${result.duracion} minutos (hasta las ${result.horaFin})</p>
        <p style="margin-top: 15px;">
            <strong>📧 Notificación:</strong> 
            ${result.whatsappLink ?
            `<a href="${result.whatsappLink}" target="_blank" style="color: #25D366; font-weight: bold;">
                    📱 Abrir WhatsApp para confirmar
                </a>` :
            'Recibirás confirmación por email (si proporcionaste uno)'
        }
        </p>
        <button onclick="location.reload()" class="btn primary-btn" style="margin-top: 20px;">
            Reservar otra cita
        </button>
    `;

    // Limpiar formulario
    document.getElementById('reserva-form').reset();
    servicioActual = null;
    document.getElementById('duracion-info').style.display = 'none';
    document.getElementById('retiro-group').style.display = 'none';

    // Scroll a la alerta
    alertDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Mostrar error
 */
function mostrarError(mensaje) {
    const alertDiv = document.getElementById('alert');
    alertDiv.className = 'alert error active';
    alertDiv.innerHTML = `
        <strong>❌ Error:</strong> ${mensaje}
    `;

    // Scroll a la alerta
    alertDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Ocultar alerta
 */
function ocultarAlerta() {
    document.getElementById('alert').classList.remove('active');
}
