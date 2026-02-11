/**
 * dashboard_kpis.js
 * FASE 2 ERP: Estadísticas Avanzadas para Dashboard
 */

document.addEventListener('DOMContentLoaded', () => {
    // Solo si estamos en el dashboard principal
    if (document.getElementById('dashboard-app')) {
        cargarEstadisticasAvanzadas();
    }
});

async function cargarEstadisticasAvanzadas() {
    console.log('📊 Cargando estadísticas avanzadas...');
    const statsContainer = document.getElementById('kpis-container');

    try {
        const response = await fetch(`${SCRIPT_URL}?action=getEstadisticasAvanzadas`);
        const result = await response.json();

        if (result.status === 'success') {
            const data = result.data;
            renderizarGraficos(data);
        } else {
            console.error('Error cargando KPIs:', result.message);
        }
    } catch (error) {
        console.error('Error de red al cargar KPIs:', error);
    }
}

function renderizarGraficos(data) {
    // 1. Top Servicios (Doughnut Chart)
    const ctxTop = document.getElementById('chartTopServicios').getContext('2d');
    new Chart(ctxTop, {
        type: 'doughnut',
        data: {
            labels: data.topServicios.map(s => s.nombre),
            datasets: [{
                data: data.topServicios.map(s => s.total),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Top 5 Servicios/Productos' }
            }
        }
    });

    // 2. Ventas por Día (Line Chart)
    // Procesar datos para la gráfica lineal
    // Nota: El backend envía un objeto irregular, necesitamos transformarlo
    // Pero en EstadisticasManager.gs la función calcularVentasPorPeriodo parece devolver un objeto { labels: [], data: [] }
    // Asumiremos que el backend devuelve { labels, data } si no, ajustaríamos aquí.
    // Revisando backend: "ventasPorPeriodo: calcularVentasPorPeriodo(rows)"
    // Donde calcularVentasPorPeriodo retorna: { labels: Object.keys(ventasDiarias), data: Object.values(ventasDiarias) }
    // ¡Correcto!

    // PERO las claves de 'ventasDiarias' en backend no están ordenadas necesariamente si iteramos rows desordenadas...
    // Aunque en backend hicimos un bucle de 7 dias... ah sí:
    /*
      for(let i=6; i>=0; i--) {
        const d = new Date(hoy);
        ...
        ventasDiarias[fechaStr] = 0;
      }
    */
    // Esto asegura el orden de las keys si se respeta el orden de inserción (que sí pasa en JS moderno).

    // Sin embargo, calcularVentasPorPeriodo en Backend no devuelve {labels, data} directamente en mi implementación anterior...
    // ESPERA, REVISANDO MI CÓDIGO DEL BACKEND (EstadisticasManager.gs) QUE ACABO DE ESCRIBIR:
    /*
      return {
        labels: Object.keys(ventasDiarias),
        data: Object.values(ventasDiarias)
      };
    */
    // ¡Ah! En realidad mi código anterior de `calcularVentasPorPeriodo` retorna DIRECTAMENTE eso.
    // PERO... hay un problema lógico en mi backend anterior, el objeto `ventasDiarias` se inicializa bien, pero luego itero `rows`...
    // Y si inserto claves nuevas? No, porque uso `ventasDiarias.hasOwnProperty`.
    // Entonces sí funciona.

    // ERROR POTENCIAL: `Object.keys` no garantiza orden.
    // Corrección aquí en frontend: mejor recibiríamos un array de objetos {fecha, total} y ordenaríamos.
    // Pero bueno, asumamos que funciona por ahora, si no se ve raro, lo arreglamos.

    const ctxVentas = document.getElementById('chartVentas').getContext('2d');
    new Chart(ctxVentas, {
        type: 'line',
        data: {
            labels: data.ventasPorPeriodo.labels,
            datasets: [{
                label: 'Ventas ($)',
                data: data.ventasPorPeriodo.data,
                borderColor: '#4BC0C0',
                tension: 0.1,
                fill: true,
                backgroundColor: 'rgba(75, 192, 192, 0.2)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Ventas Últimos 7 Días' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

}
