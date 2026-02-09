/**
 * reservar_cita.js
 * Lógica del formulario de reserva de citas
 * Esencia Spa
 */

// 🔴 IMPORTANTE: Reemplazar con tu URL de Apps Script deployment
// Ejemplo: 'https://script.google.com/macros/s/AKfycbx.../exec'
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx52WXG_TEBl7OQfb1B7njCla-dCF4kkU38PvqXhybV0X_S2dCLgIWpERvlvKp60L8N/exec';

let servicioActual = null;
let servicios = [];

// Cargar servicios al iniciar
document.addEventListener('DOMContentLoaded', async () => {
    // Establecer fecha mínima (hoy)
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').setAttribute('min', hoy);
    document.getElementById('fecha').value = hoy;

    await cargarServicios();

    // Auto-seleccionar servicio si viene desde servicios.html
    autoSeleccionarServicio();

    setupEventListeners();
});

/**
 * Cargar servicios desde backend
 */
async function cargarServicios() {
    // Verificar si la URL está configurada
    if (SCRIPT_URL === 'TU_SCRIPT_URL_AQUI') {
        console.warn('⚠️ SCRIPT_URL no configurada. Usando datos de ejemplo.');
        cargarServiciosDemo();
        return;
    }

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
 * Cargar servicios de ejemplo (modo demo)
 */
function cargarServiciosDemo() {
    servicios = [
        { id: 'SRV-001', nombre: 'Manicura Limpieza', precio: 25000, duracion_base_minutos: 30 },
        { id: 'SRV-002', nombre: 'Manicura Semipermanente - Un Tono', precio: 50000, duracion_base_minutos: 75 },
        { id: 'SRV-003', nombre: 'Pedicura Estética Semipermanente', precio: 50000, duracion_base_minutos: 75 },
        { id: 'SRV-004', nombre: 'Polygel Esculpido + Semi', precio: 120000, duracion_base_minutos: 120 }
    ];

    const select = document.getElementById('servicio');
    select.innerHTML = '<option value="">-- Seleccione un servicio --</option>' +
        servicios.map(s => `<option value="${s.id}">${s.nombre} - $${s.precio.toLocaleString()}</option>`).join('');

    mostrarError('⚠️ Modo DEMO: Configura SCRIPT_URL para conectar con el backend real.');
}

/**
 * Auto-seleccionar servicio si viene desde servicios.html
 */
function autoSeleccionarServicio() {
    const selectedServiceData = sessionStorage.getItem('selectedService');
    if (!selectedServiceData) return;

    try {
        const service = JSON.parse(selectedServiceData);
        const serviceSelect = document.getElementById('servicio');

        // Buscar opción que coincida con el nombre del servicio
        for (let option of serviceSelect.options) {
            if (option.text.includes(service.nombre)) {
                option.selected = true;
                // Disparar evento change para actualizar duración
                serviceSelect.dispatchEvent(new Event('change'));
                break;
            }
        }

        // Limpiar sessionStorage
        sessionStorage.removeItem('selectedService');

        console.log('Servicio auto-seleccionado:', service.nombre);
    } catch (e) {
        console.error('Error al auto-seleccionar servicio:', e);
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

    // Modo DEMO: calcular duración localmente
    if (SCRIPT_URL === 'TU_SCRIPT_URL_AQUI') {
        calcularDuracionDemo(servicioId, requiereRetiro);
        return;
    }

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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

            // Actualizar UI
            document.getElementById('duracion-display').textContent = data.duracionTotal;
            document.getElementById('duracion-info').style.display = 'block';

            actualizarHoraFin();
        } else {
            mostrarError('Error al calcular duración');
        }
    } catch (e) {
        console.error('Error calculando duración:', e);
        mostrarError('Error de conexión al calcular duración');
    }
}

/**
 * Calcular duración en modo demo
 */
function calcularDuracionDemo(servicioId, requiereRetiro) {
    const servicio = servicios.find(s => s.id === servicioId);

    if (!servicio) {
        mostrarError('Servicio no encontrado');
        return;
    }

    const duracionBase = servicio.duracion_base_minutos || 60;
    const duracionRetiro = requiereRetiro ? 30 : 0; // 30 min adicionales si requiere retiro
    const duracionTotal = duracionBase + duracionRetiro;

    servicioActual = {
        success: true,
        servicioId: servicio.id,
        servicioNombre: servicio.nombre,
        duracionBase: duracionBase,
        duracionRetiro: duracionRetiro,
        duracionTotal: duracionTotal,
        requiereRetiroOpcional: true
    };

    // Mostrar checkbox de retiro (en demo siempre está disponible)
    document.getElementById('retiro-group').style.display = 'block';

    // Actualizar UI
    document.getElementById('duracion-display').textContent = duracionTotal;
    document.getElementById('duracion-info').style.display = 'block';

    actualizarHoraFin();
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

    // Modo DEMO: simular creación de cita
    if (SCRIPT_URL === 'TU_SCRIPT_URL_AQUI') {
        setTimeout(() => {
            crearReservaDemo(formData);
        }, 1000); // Simular delay de red
        return;
    }

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
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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
 * Crear reserva en modo demo
 */
function crearReservaDemo(formData) {
    const citaId = 'DEMO-' + Date.now();
    const horaInicio = formData.get('hora_inicio');
    const [h, m] = horaInicio.split(':');
    const inicio = new Date();
    inicio.setHours(parseInt(h), parseInt(m));
    const fin = new Date(inicio.getTime() + (servicioActual.duracionTotal * 60000));
    const horaFin = fin.getHours().toString().padStart(2, '0') + ':' + fin.getMinutes().toString().padStart(2, '0');

    const result = {
        success: true,
        citaId: citaId,
        duracion: servicioActual.duracionTotal,
        horaFin: horaFin,
        whatsappLink: null,
        message: 'Cita creada en modo DEMO (no se guardó en base de datos)'
    };

    mostrarExito(result);

    document.getElementById('loading').classList.remove('active');
    document.getElementById('submit-btn').disabled = false;
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
