/**
 * EstadisticasManager.gs
 * Gestiona las estadísticas avanzadas para el dashboard ERP
 */

/**
 * Obtener todas las estadísticas para evitar múltiples llamadas
 */
function getEstadisticasAvanzadas() {
  const ss = getSpreadsheet();
  const sheetVentas = ss.getSheetByName(HOJA_VENTAS);
  const sheetProductos = ss.getSheetByName(HOJA_PRODUCTOS);
  const sheetClientes = ss.getSheetByName(HOJA_CLIENTES);

  if (!sheetVentas) return { error: "No hay hoja de ventas" };

  const dataVentas = sheetVentas.getDataRange().getValues();
  // Headers: [id, producto_id, cantidad, precio, fecha, extra_data]
  const rows = dataVentas.slice(1);

  return {
    topServicios: calcularTopServicios(rows, sheetProductos),
    ventasPorPeriodo: calcularVentasPorPeriodo(rows),
    retencionClientes: calcularRetencionClientes(rows),
    horasPico: calcularHorasPico(rows),
    resumenMensual: calcularResumenMensual(rows)
  };
}

/**
 * Top 5 Servicios/Productos más vendidos
 */
function calcularTopServicios(rows, sheetProductos) {
  const productosMap = {};
  const nombresMap = {};

  // Mapear nombres de productos para no mostrar IDs
  if (sheetProductos) {
    const dataProd = sheetProductos.getDataRange().getValues();
    for(let i=1; i<dataProd.length; i++) {
        nombresMap[dataProd[i][0]] = dataProd[i][1];
    }
  }

  rows.forEach(r => {
    const id = r[1];
    const cantidad = parseFloat(r[2]) || 0;
    const total = cantidad * (parseFloat(r[3]) || 0);

    if (!productosMap[id]) productosMap[id] = { id, nombre: nombresMap[id] || id, cantidad: 0, total: 0 };
    
    productosMap[id].cantidad += cantidad;
    productosMap[id].total += total;
  });

  return Object.values(productosMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}

/**
 * Ventas últimos 7 días
 */
function calcularVentasPorPeriodo(rows) {
  const ventasDiarias = {};
  const hoy = new Date();
  
  // Inicializar últimos 7 días en 0
  for(let i=6; i>=0; i--) {
    const d = new Date(hoy);
    d.setDate(d.getDate() - i);
    const fechaStr = d.toLocaleDateString();
    ventasDiarias[fechaStr] = 0;
  }

  rows.forEach(r => {
    const fecha = new Date(r[4]);
    const fechaStr = fecha.toLocaleDateString();
    const total = (parseFloat(r[2]) || 0) * (parseFloat(r[3]) || 0);

    if (ventasDiarias.hasOwnProperty(fechaStr)) {
      ventasDiarias[fechaStr] += total;
    }
  });

  return {
    labels: Object.keys(ventasDiarias),
    data: Object.values(ventasDiarias)
  };
}

/**
 * Porcentaje de Retención (Clientes recurrentes vs Nuevos)
 */
function calcularRetencionClientes(rows) {
  const clientesMap = {};

  rows.forEach(r => {
    const extraData = String(r[5] || '');
    // Extraer nombre cliente después del |
    const partes = extraData.split('|');
    const cliente = partes.length > 1 ? partes[1].trim() : 'Anónimo';
    
    if (cliente === 'Anónimo') return;

    if (!clientesMap[cliente]) clientesMap[cliente] = 0;
    clientesMap[cliente]++;
  });

  let nuevos = 0;
  let recurrentes = 0;

  Object.values(clientesMap).forEach(compras => {
    if (compras === 1) nuevos++;
    else recurrentes++;
  });

  return { nuevos, recurrentes };
}

/**
 * Horas pico de atención
 */
function calcularHorasPico(rows) {
  const horasMap = Array(24).fill(0);

  rows.forEach(r => {
    const fecha = new Date(r[4]);
    const hora = fecha.getHours();
    horasMap[hora]++;
  });

  // Filtrar solo horas laborales (ej: 8am a 8pm)
  const etiquetas = [];
  const valores = [];
  
  for(let i=8; i<=20; i++) {
    etiquetas.push(i + ':00');
    valores.push(horasMap[i]);
  }

  return { labels: etiquetas, data: valores };
}

/**
 * Totales del mes actual vs mes anterior
 */
function calcularResumenMensual(rows) {
  const hoy = new Date();
  const mesActual = hoy.getMonth();
  const anioActual = hoy.getFullYear();
  
  let totalMesActual = 0;
  let totalMesAnterior = 0;

  rows.forEach(r => {
    const fecha = new Date(r[4]);
    const total = (parseFloat(r[2]) || 0) * (parseFloat(r[3]) || 0);

    if (fecha.getFullYear() === anioActual && fecha.getMonth() === mesActual) {
      totalMesActual += total;
    } else if (fecha.getFullYear() === anioActual && fecha.getMonth() === mesActual - 1) {
      totalMesAnterior += total;
    }
  });

  return {
    mesActual: totalMesActual,
    mesAnterior: totalMesAnterior,
    crecimiento: totalMesAnterior > 0 ? ((totalMesActual - totalMesAnterior) / totalMesAnterior) * 100 : 100
  };
}
