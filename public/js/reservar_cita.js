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
let configuracion = null;

// Cargar servicios y configuración al iniciar
document.addEventListener('DOMContentLoaded', async () => {
    // Establecer fecha mínima (hoy)
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').setAttribute('min', hoy);
    document.getElementById('fecha').value = hoy;

    // Cargar configuración de horarios
    await cargarConfiguracion();

    await cargarServicios();

    // Auto-seleccionar servicio si viene desde servicios.html
    autoSeleccionarServicio();

    setupEventListeners();
});

/**
 * Cargar configuración de horarios desde backend
 */
async function cargarConfiguracion() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getConfiguracion`);
        const data = await response.json();

        console.log('📡 Respuesta completa de configuración:', data);

        if (data.success) {
            configuracion = data;

            // Debug detallado
            console.log('✅ Configuración cargada:');
            console.log('   - Config general:', data.config);
            console.log('   - Horarios completos:', data.horarios);

            // Verificar cada día
            const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
            dias.forEach(dia => {
                const horario = data.horarios[dia];
                console.log(`   - ${dia}:`, horario || 'CERRADO');
            });

            configuracionCargada = true;
        } else {
            console.error('❌ Error en respuesta:', data.error);
            // Usar configuración por defecto en caso de error
            configuracion = getConfiguracionPorDefecto();
        }
    } catch (e) {
        console.error('❌ Error cargando configuración:', e);
        // Usar configuración por defecto en caso de error
        configuracion = getConfiguracionPorDefecto();
    }
}

/**
 * Configuración por defecto (fallback)
 */
function getConfiguracionPorDefecto() {
    return {
        success: true,
        config: {
            anticipacion_minima_horas: '2',
            intervalo_slots_minutos: '30',
            dias_cerrado: 'domingo'
        },
        horarios: {
            lunes: { apertura: '09:00', cierre: '18:00' },
            martes: { apertura: '09:00', cierre: '18:00' },
            miercoles: { apertura: '09:00', cierre: '18:00' },
            jueves: { apertura: '09:00', cierre: '18:00' },
            viernes: { apertura: '09:00', cierre: '18:00' },
            sabado: { apertura: '09:00', cierre: '14:00' },
            domingo: null
        }
    };
}

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
        // Actualizar slots disponibles
        actualizarSelectorHora();
    });

    // Al cambiar fecha
    fechaInput.addEventListener('change', () => {
        validarDiaHabil();
        // Actualizar slots disponibles
        actualizarSelectorHora();
    });

    // Al marcar/desmarcar retiro
    requiereRetiroCheck.addEventListener('change', async () => {
        await actualizarDuracion();
        // Actualizar slots disponibles
        actualizarSelectorHora();
    });

    // Al cambiar hora
    horaInput.addEventListener('change', () => {
        actualizarHoraFin();
    });

    // Submit del formulario
    document.getElementById('reserva-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (validarFormulario()) {
            await crearReserva();
        }
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

/**
 * Generar slots de tiempo disponibles
 * @param {string} fecha - Fecha seleccionada (YYYY-MM-DD)
 * @param {number} duracionServicio - Duración del servicio en minutos
 * @returns {Array} Array de horas disponibles
 */
function generarSlots(fecha, duracionServicio) {
    if (!configuracion) return [];

    // Parsear fecha de forma segura (evitar problemas de zona horaria)
    const [year, month, day] = fecha.split('-').map(Number);
    const fechaObj = new Date(year, month - 1, day); // Mes es 0-indexed

    // Mapeo SIN acentos (debe coincidir con backend)
    const diaSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][fechaObj.getDay()];

    console.log('🔍 Debug generarSlots:', {
        fechaInput: fecha,
        fechaObj: fechaObj.toDateString(),
        diaSemanaIndex: fechaObj.getDay(),
        diaSemana: diaSemana,
        horarioDisponible: configuracion.horarios[diaSemana]
    });

    const horario = configuracion.horarios[diaSemana];

    if (!horario) {
        console.warn(`⚠️ No hay horario para ${diaSemana}`);
        return []; // Día cerrado
    }

    const slots = [];
    const [horaApertura, minApertura] = horario.apertura.split(':').map(Number);
    const [horaCierre, minCierre] = horario.cierre.split(':').map(Number);
    const intervalo = parseInt(configuracion.config.intervalo_slots_minutos) || 30;

    let horaActual = horaApertura * 60 + minApertura; // minutos desde medianoche
    const horaCierreMin = horaCierre * 60 + minCierre;

    // Si es hoy, aplicar anticipación mínima
    const ahora = new Date();
    const fechaSeleccionada = new Date(year, month - 1, day);
    let minimaHora = 0;

    if (fechaSeleccionada.toDateString() === ahora.toDateString()) {
        const anticipacion = parseInt(configuracion.config.anticipacion_minima_horas) || 2;
        minimaHora = (ahora.getHours() * 60 + ahora.getMinutes()) + (anticipacion * 60);
    }

    // Generar slots que permitan completar el servicio antes del cierre
    while (horaActual + duracionServicio <= horaCierreMin) {
        if (horaActual >= minimaHora) {
            const h = Math.floor(horaActual / 60);
            const m = horaActual % 60;
            const horaStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            slots.push(horaStr);
        }
        horaActual += intervalo;
    }

    console.log(`✅ Slots generados para ${diaSemana}:`, slots.length);
    return slots;
}

/**
 * Actualizar selector de hora con slots disponibles
 */
function actualizarSelectorHora() {
    const fecha = document.getElementById('fecha').value;
    const servicioId = document.getElementById('servicio').value;
    const horaSelect = document.getElementById('hora');

    if (!fecha || !servicioId || !configuracion) {
        horaSelect.innerHTML = '<option value="">-- Primero seleccione servicio y fecha --</option>';
        return;
    }

    // Obtener duración del servicio
    const servicio = servicios.find(s => s.id === servicioId);
    if (!servicio) {
        horaSelect.innerHTML = '<option value="">-- Error: Servicio no encontrado --</option>';
        return;
    }

    const duracion = servicioActual ? servicioActual.duracionTotal : (servicio.duracion_base_minutos || 60);
    const slots = generarSlots(fecha, duracion);

    if (slots.length === 0) {
        horaSelect.innerHTML = '<option value="">-- No hay horarios disponibles para este día --</option>';

        // Parsear fecha de forma segura
        const [year, month, day] = fecha.split('-').map(Number);
        const fechaObj = new Date(year, month - 1, day);

        // Nombres CON acentos solo para mostrar al usuario
        const diasDisplay = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const diaSemana = diasDisplay[fechaObj.getDay()];
        mostrarError(`No abrimos los ${diaSemana}. Por favor seleccione otro día.`);
        return;
    }

    horaSelect.innerHTML = '<option value="">-- Seleccione una hora --</option>' +
        slots.map(slot => `<option value="${slot}">${slot}</option>`).join('');

    // Actualizar info de slots
    const slotsInfo = document.getElementById('slots-info');
    if (slotsInfo) {
        slotsInfo.textContent = `${slots.length} horarios disponibles`;
    }
}

/**
 * Validar que el día seleccionado sea hábil
 */
function validarDiaHabil() {
    const fecha = document.getElementById('fecha').value;
    if (!fecha || !configuracion) return true;

    // Parsear fecha de forma segura
    const [year, month, day] = fecha.split('-').map(Number);
    const fechaObj = new Date(year, month - 1, day);

    // Mapeo SIN acentos para buscar en configuración
    const diaSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][fechaObj.getDay()];
    // Nombres CON acentos solo para mostrar
    const diasDisplay = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const diaEspanol = diasDisplay[fechaObj.getDay()];

    if (!configuracion.horarios[diaSemana]) {
        mostrarError(`No abrimos los ${diaEspanol}s. Por favor seleccione otro día.`);
        document.getElementById('fecha').value = '';
        return false;
    }

    return true;
}

/**
 * Validar formulario antes de enviar
 */
function validarFormulario() {
    const fecha = new Date(document.getElementById('fecha').value);
    const ahora = new Date();
    ahora.setHours(0, 0, 0, 0);

    // Fecha pasada
    if (fecha < ahora) {
        mostrarError('No puedes reservar en fechas pasadas');
        return false;
    }

    // Teléfono
    const telefono = document.getElementById('telefono').value.replace(/\D/g, '');
    if (telefono.length !== 10) {
        mostrarError('El teléfono debe tener 10 dígitos');
        return false;
    }

    // Hora seleccionada
    if (!document.getElementById('hora').value) {
        mostrarError('Debes seleccionar una hora');
        return false;
    }

    // Servicio seleccionado
    if (!document.getElementById('servicio').value) {
        mostrarError('Debes seleccionar un servicio');
        return false;
    }

    return true;
}
