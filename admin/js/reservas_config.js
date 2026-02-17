/**
 * reservas_config.js
 * Gestión de configuración de reservas desde el panel admin
 * Esencia Spa - Sistema de Gestión
 */

// Usa SCRIPT_URL ya declarado en script.js

let configuracionActual = null;
let configuracionCargada = false;

console.log('🔧 Módulo reservas_config.js cargado');

// Inicializar cuando la sección se active
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 Inicializando reservas_config...');

    // Cargar configuración al hacer click en el tab de Reservas dentro de Configuración
    const tabReservas = document.getElementById('tabConfigReservas');
    if (tabReservas) {
        console.log('✅ Tab de Reservas encontrado');
        tabReservas.addEventListener('click', () => {
            console.log('👆 Click en tab Reservas');
            setTimeout(() => {
                if (!configuracionCargada) {
                    console.log('📥 Cargando configuración por primera vez...');
                    cargarConfiguracion();
                }
            }, 150);
        });
    } else {
        console.warn('⚠️ No se encontró el tab de Reservas (tabConfigReservas)');
    }

    // También cargar cuando se abre la sección de configuración por primera vez
    const menuConfigLink = document.querySelector('a[data-section="configuracion"]');
    if (menuConfigLink) {
        console.log('✅ Link de Configuración encontrado');
        menuConfigLink.addEventListener('click', () => {
            // Esperar a que se muestre la sección
            setTimeout(() => {
                const tabReservasBtn = document.getElementById('tabConfigReservas');
                // Si el tab de reservas está activo, cargar
                if (tabReservasBtn && tabReservasBtn.classList.contains('active') && !configuracionCargada) {
                    console.log('📥 Cargando configuración (tab activo)...');
                    cargarConfiguracion();
                }
            }, 250);
        });
    }

    // Botón refrescar - usar delegación de eventos para botones que pueden estar ocultos
    document.addEventListener('click', function (e) {
        if (e.target && e.target.id === 'refreshConfigBtn') {
            console.log('🔄 Click en botón Refrescar');
            e.preventDefault();
            cargarConfiguracion();
        }
    });

    // Verificar si el botón existe (puede estar oculto)
    setTimeout(() => {
        const refreshBtn = document.getElementById('refreshConfigBtn');
        if (refreshBtn) {
            console.log('✅ Botón Refrescar encontrado en el DOM');
        } else {
            console.warn('⚠️ Botón Refrescar NO encontrado (refreshConfigBtn)');
        }
    }, 500);

    // Botón guardar - también con delegación
    document.addEventListener('click', function (e) {
        if (e.target && e.target.id === 'guardarConfigReservas') {
            console.log('💾 Click en botón Guardar');
            e.preventDefault();
            guardarConfiguracion();
        }
    });
});

/**
 * Cargar configuración desde el backend
 */
async function cargarConfiguracion() {
    mostrarStatus('Cargando configuración...', 'info');

    try {
        const response = await fetch(`${SCRIPT_URL}?action=getConfiguracion`);
        const data = await response.json();

        if (data.success) {
            configuracionActual = data;
            poblarFormulario(data);
            configuracionCargada = true; // Marcar como cargada
            mostrarStatus('✅ Configuración cargada correctamente', 'success');
        } else {
            mostrarStatus('❌ Error al cargar configuración: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error cargando configuración:', error);
        mostrarStatus('❌ Error de conexión: ' + error.message, 'error');
    }
}

/**
 * Poblar formulario con datos de configuración
 */
function poblarFormulario(data) {
    const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

    // Llenar horarios
    dias.forEach(dia => {
        const horario = data.horarios[dia];

        if (horario) {
            const aperturaInput = document.getElementById(`${dia}_apertura`);
            const cierreInput = document.getElementById(`${dia}_cierre`);

            if (aperturaInput) aperturaInput.value = horario.apertura || '';
            if (cierreInput) cierreInput.value = horario.cierre || '';
        } else {
            // Día cerrado
            const aperturaInput = document.getElementById(`${dia}_apertura`);
            const cierreInput = document.getElementById(`${dia}_cierre`);

            if (aperturaInput) aperturaInput.value = '';
            if (cierreInput) cierreInput.value = '';
        }
    });

    // Llenar configuraciones generales
    const anticipacion = document.getElementById('anticipacion_minima');
    if (anticipacion) {
        anticipacion.value = data.config.anticipacion_minima_horas || '2';
    }

    const intervalo = document.getElementById('intervalo_slots');
    if (intervalo) {
        intervalo.value = data.config.intervalo_slots_minutos || '30';
    }

    const diasCerrado = document.getElementById('dias_cerrado');
    if (diasCerrado) {
        diasCerrado.value = data.config.dias_cerrado || 'domingo';
    }
}

/**
 * Guardar configuración
 */
async function guardarConfiguracion() {
    if (!confirm('¿Desea guardar la configuración de reservas?\n\nEsto afectará los horarios disponibles para las reservas del sitio público.')) {
        return;
    }

    mostrarStatus('Guardando configuración...', 'info');

    const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const cambios = [];

    // Recopilar cambios de horarios
    dias.forEach(dia => {
        const apertura = document.getElementById(`${dia}_apertura`).value;
        const cierre = document.getElementById(`${dia}_cierre`).value;

        cambios.push({
            clave: `horario_${dia}_apertura`,
            valor: apertura
        });

        cambios.push({
            clave: `horario_${dia}_cierre`,
            valor: cierre
        });
    });

    // Configuraciones generales
    cambios.push({
        clave: 'anticipacion_minima_horas',
        valor: document.getElementById('anticipacion_minima').value
    });

    cambios.push({
        clave: 'intervalo_slots_minutos',
        valor: document.getElementById('intervalo_slots').value
    });

    cambios.push({
        clave: 'dias_cerrado',
        valor: document.getElementById('dias_cerrado').value
    });

    // Guardar cada cambio
    let exitosos = 0;
    let errores = 0;

    for (const cambio of cambios) {
        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: 'actualizarConfiguracion',
                    clave: cambio.clave,
                    valor: cambio.valor
                })
            });

            const result = await response.json();

            if (result.success) {
                exitosos++;
            } else {
                errores++;
                console.error(`Error guardando ${cambio.clave}:`, result.error);
            }
        } catch (error) {
            errores++;
            console.error(`Error guardando ${cambio.clave}:`, error);
        }
    }

    if (errores === 0) {
        mostrarStatus(`✅ Configuración guardada exitosamente (${exitosos} valores actualizados)`, 'success');
        // Recargar para confirmar
        setTimeout(cargarConfiguracion, 1000);
    } else {
        mostrarStatus(`⚠️ Configuración guardada parcialmente: ${exitosos} exitosos, ${errores} errores`, 'warning');
    }
}

/**
 * Mostrar mensaje de estado
 */
function mostrarStatus(mensaje, tipo) {
    const statusDiv = document.getElementById('statusReservasConfig');
    if (!statusDiv) return;

    statusDiv.className = 'status-message ' + tipo;
    statusDiv.textContent = mensaje;
    statusDiv.style.display = 'block';

    // Auto-ocultar después de 5 segundos si es éxito
    if (tipo === 'success') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}
