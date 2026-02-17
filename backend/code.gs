// ***************************************************************
// ⚠️ 1. REEMPLAZA ESTE VALOR con el ID real de tu Google Sheet
// ***************************************************************
const SPREADSHEET_ID = "1TZLrhH8Ez7DVjmEPSOgOhsKu1K8tGK91rJ2E6XcRHkY";

// Nombres de las pestañas
const HOJA_CATEGORIAS = "Categorias";
const HOJA_PRODUCTOS = "Productos";
const HOJA_COMPRAS = "Compras";
const HOJA_VENTAS = "Ventas";
const HOJA_PROVEEDORES = "Proveedores";
const HOJA_CLIENTES = "Clientes";
const HOJA_RESUMEN = "resumen_diario";
const HOJA_USUARIOS = "Usuarios";

// Encabezados
const CATEGORIAS_HEADERS = ["id", "nombre"];
const PRODUCTOS_HEADERS = ["id", "nombre", "código", "categoría", "tipo", "precio_compra", "precio_venta", "stock", "fecha_creado"];
const COMPRAS_HEADERS = ["id", "producto_id", "cantidad", "precio_compra", "fecha", "proveedor"];
const VENTAS_HEADERS = ["id", "producto_id", "cantidad", "precio_venta", "fecha", "cliente"];
const PROVEEDORES_HEADERS = ["id", "nombre", "telefono"];
const CLIENTES_HEADERS = ["id", "nombre", "telefono","Documento (CC/NIT)","Direccion","Notas"];
const RESUMEN_HEADERS = ["fecha", "total_ventas", "total_compras", "ganancia", "productos_vendidos"];
const USUARIOS_HEADERS = ["usuario", "hash", "rol", "created"];
// Credenciales por defecto (se crearán automáticamente al inicializar la BD)
const DEFAULT_ADMIN_USER = "admin";
const DEFAULT_ADMIN_PASS = "admin";
// Clave admin fija (fallback) para crear usuarios si no está en Script Properties
const ADMIN_KEY_CONST = "Excol123**";

// --- FUNCIÓN CENTRAL PARA ACCEDER A LA HOJA ---
function getSpreadsheet() {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// 🔑 FUNCIÓN CORREGIDA: Generación de ID Único
function generateUniqueAppId() {
    return 'id-' + (new Date().getTime().toString(36) + Math.random().toString(36).substring(2, 9)).toUpperCase();
}

// ----------------------------------------------------------------------
// ENTRADA PRINCIPAL PARA SOLICITUDES GET
// ----------------------------------------------------------------------
function doGet(e) {
    const action = e.parameter.action;
    const query = e.parameter.query;
    const sheetName = e.parameter.sheetName;
    let result;

    try {
        if (action === "iniciar" || action === "resetear") {
            result = action === "iniciar" ? iniciarBaseDeDatos() : resetearBaseDeDatos();
        } else if (action === "getCategorias") {
            result = getCategorias();
        } else if (action === "buscarProducto") {
            result = buscarProducto(query);
        } else if (action === "getInventario") {
            result = getInventario();
        } else if (action === "getResumenDiario") {
            result = getResumenDiario();
        } else if (action === "getData" && sheetName) {
            result = getData(sheetName);
        } else if (action === "getConfiguracion") {
            // 🆕 FASE 1: Endpoint para obtener configuración de horarios
            result = getConfiguracion();
        } else if (action === "getCotizacionesPendientes") {
            // 🆕 FASE 3: Endpoint para obtener cotizaciones pendientes
            result = { status: 'success', data: getCotizacionesPendientes() };
        } else if (action === "getHistorialFacturas") {
            // 🆕 FASE 1: ERP - Historial de Facturas
            result = { status: 'success', data: getHistorialFacturas() };
        } else if (action === "getEstadisticasAvanzadas") {
            // 🆕 FASE 2: ERP - Estadísticas Avanzadas
            result = { status: 'success', data: getEstadisticasAvanzadas() };
        } else if (action === "getResumenCaja") {
            // 🆕 FASE 3: ERP - Cierre de Caja
            const fecha = e.parameter.fecha || null;
            result = { status: 'success', data: getResumenCaja(fecha) };
        } else if (action === "migrarEsquema") {
            // 🛠️ MIGRACIÓN ONE-OFF
            result = { status: 'success', message: migrarColumnasContactos() };
        } else if (action === "instalarSistema") {
            // 🛠️ INSTALACIÓN COMPLETA (Reseteo/Init)
            result = { status: 'success', message: instalarSistema() };
        } else if (action === "listarImagenesCatalogo") {
            // 🆕 FASE 2: Imágenes
            result = { status: 'success', data: listarImagenesCatalogo() };
        } else if (action === "getProductosSinImagen") {
            // 🆕 FASE 2: Imágenes
            result = { status: 'success', data: getProductosSinImagen() };
        } else if (action === "getSystemAlerts") {
            // 🆕 FASE 3: Alertas
            result = { status: 'success', data: getSystemAlerts() };
        } else if (action === "getClientes") {
            // 🆕 FASE 5: CRM - Lista de Clientes
            result = { status: 'success', data: getClientes() };
        } else if (action === "getHistorialCliente") {
            // 🆕 FASE 5: CRM - Historial
            const id = e.parameter.id;
            result = getHistorialCliente(id); // Ya devuelve estructura {success, ...}

        } else if (action === "getMetricasGenerales") {
            // 🆕 FASE 6: Reportes - Métricas Generales
            const fi = e.parameter.fecha_inicio;
            const ff = e.parameter.fecha_fin;
            result = getMetricasGenerales(fi, ff);
        } else if (action === "getReporteVentasDiarias") {
            // 🆕 FASE 6: Reportes - Ventas Diarias
            const fi = e.parameter.fecha_inicio;
            const ff = e.parameter.fecha_fin;
            result = getReporteVentasDiarias(fi, ff);
        } else if (action === "getServiciosPopulares") {
            // 🆕 FASE 6: Reportes - Servicios Populares
            const limit = e.parameter.limit || 5;
            result = getServiciosPopulares(limit);
        } else if (action === "getImageContent") {
            // 🆕 FASE 2: Imágenes - Fallback Base64
            result = getImageContent(e.parameter.id);
        } else if (action === "getServiciosPublicos") {
            // 🆕 FASE 7: Servicios Públicos
            result = { status: 'success', data: getServiciosPublicos() };
        } else if (action === "runMigration") {
            // 🆕 FASE 7: Migración Única
            result = migrateStaticServices();
        } else if (action === "getCitasHoy") {
            // 🆕 FASE 3: Endpoint para obtener citas del día actual
            result = { status: 'success', data: getCitasHoy() };
        } else if (action === "getEstadisticasCitas") {
            // 🆕 FASE 3: Endpoint para obtener estadísticas de citas
            const fechaInicio = e.parameter.fecha_inicio || null;
            const fechaFin = e.parameter.fecha_fin || null;
            result = { status: 'success', data: getEstadisticasCitas(fechaInicio, fechaFin) };
        } else if (action === "getCitasPorFecha") {
            // 🆕 FASE 3: Endpoint para obtener citas por fecha específica
            const fecha = e.parameter.fecha;
            if (!fecha) {
                result = { status: 'error', message: 'Parámetro "fecha" requerido' };
            } else {
                result = { status: 'success', data: getCitasPorFecha(fecha) };
            }
        } else if (action === "inicializarHistoriasClinicas") {
            // 🆕 HISTORIA CLÍNICA: Inicializar hojas necesarias
            result = inicializarHistoriasClinicas();
        } else if (action === "verificarHistoriaExistente") {
            // 🆕 HISTORIA CLÍNICA: Verificar si un cliente ya tiene HC
            const clienteId = e.parameter.clienteId;
            if (!clienteId) {
                result = { success: false, message: 'Parámetro "clienteId" requerido' };
            } else {
                result = verificarHistoriaExistente(clienteId);
            }
        } else if (action === "buscarCliente") {
            // 🆕 FASE 1: Buscar clientes para Historia Clínica
            const query = e.parameter.query;
            result = { status: 'success', data: buscarCliente(query) };
        } else if (action === "obtenerHistoriaClinica") {
            // 🆕 FASE 2: Obtener datos de HC
            const historiaId = e.parameter.historiaId;
            result = obtenerHistoriaClinica(historiaId);
        } else if (action === "obtenerAntecedentes") {
            // 🆕 FASE 2: Obtener antecedentes de HC
            const historiaId = e.parameter.historiaId;
            result = obtenerAntecedentes(historiaId);
        } else if (action === "obtenerEvoluciones") {
            // 🆕 FASE 2: Obtener evoluciones de HC
            const historiaId = e.parameter.historiaId;
            result = obtenerEvoluciones(historiaId);
        } else if (action === "obtenerTratamientos") {
            // 🆕 FASE 3: Obtener tratamientos de HC
            const historiaId = e.parameter.historiaId;
            result = obtenerTratamientos(historiaId);
        } else {
            result = { status: "error", message: `Acción GET '${action}' no válida o faltan parámetros.` };
        }
    } catch (error) {
        result = { status: "error", message: `Error en doGet: ${error.message}` };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
}

// ----------------------------------------------------------------------
// ENTRADA PRINCIPAL PARA SOLICITUDES POST
// ----------------------------------------------------------------------
function doPost(e) {
    try {
        if (!e.postData || !e.postData.contents) {
            return ContentService.createTextOutput(JSON.stringify({
                status: "error",
                message: "No se recibieron datos en la solicitud POST."
            })).setMimeType(ContentService.MimeType.JSON);
        }

        const requestData = JSON.parse(e.postData.contents);
        const action = requestData.action;

        let result;
        if (action === "agregarCategoria") {
            result = agregarCategoria(requestData);
        } else if (action === "agregarProducto") {
            result = agregarProducto(requestData);
        } else if (action === "registrarTransaccion") {
            result = registrarTransaccion(requestData);
        } else if (action === 'authLogin') {
            result = authLogin(requestData);
        } else if (action === 'createUserInternal') {
            result = createUserInternal(requestData);
        } else if (action === 'migrateUsersToHash') {
            result = migrateUsersToHash(requestData);
        } else if (action === 'registrarTransaccionBatch') {
            result = registrarTransaccionBatch(requestData);
        } else if (action === 'agregarRegistroGenerico') {
            result = agregarRegistroGenerico(requestData);
        } else if (action === 'updateUserRole') {
            result = updateUserRole(requestData);
        } else if (action === 'deleteUser') {
            result = deleteUser(requestData);
        } else if (action === 'getNextOrderId') {
            result = getNextOrderId(requestData);
        } else if (action === 'crearCita') {
            // 🆕 FASE 2: Endpoint para crear una cita
            const citaResult = crearCita(requestData);
            result = {
                success: citaResult.success,
                message: citaResult.message,
                citaId: citaResult.citaId,
                duracion: citaResult.duracion,
                horaFin: citaResult.horaFin,
                whatsappLink: citaResult.whatsappLink
            };
        } else if (action === 'calcularDuracion') {
            // 🆕 FASE 2: Endpoint para calcular duración dinámica
            const dur = calcularDuracionCita(requestData.servicio_id, requestData.requiere_retiro);
            result = {
                success: true,
                duracionTotal: dur.duracionTotal,
                duracionBase: dur.duracionBase,
                duracionRetiro: dur.duracionRetiro,
                requiereRetiroOpcional: dur.requiereRetiroOpcional
            };
        } else if (action === 'convertirCotizacionEnVenta') {
            // 🆕 FASE 3: Endpoint para convertir cotización en venta
            result = convertirCotizacionEnVenta(requestData.cotizacion_id, {
                metodo_pago: requestData.metodo_pago || 'Efectivo',
                fecha: requestData.fecha || new Date()
            });
        } else if (action === 'actualizarConfiguracion') {
            // 🆕 FASE 1: Endpoint para actualizar configuración de reservas
            result = actualizarConfiguracion(requestData.clave, requestData.valor);
        } else if (action === 'anularFactura') {
            // 🆕 FASE 1: ERP - Anulación de Factura
            result = anularFactura(requestData.order_id, requestData.motivo);
        } else if (action === 'registrarCierreCaja') {
            // 🆕 FASE 3: ERP - Registrar Cierre
            result = registrarCierreCaja(requestData.datosCierre);
        } else if (action === 'registrarMantenimiento') {
            // 🆕 FASE 2: CRUD Genérico (Guardar/Editar)
            result = guardarRegistro(requestData.tipo, requestData.datos);
        } else if (action === 'eliminarMantenimiento') {
            // 🆕 FASE 2: CRUD Genérico (Eliminar)
            result = eliminarRegistro(requestData.tipo, requestData.id);
        } else if (action === 'subirYAsociarImagen') {
            // 🆕 FASE 2: Imágenes
            result = subirYAsociarImagen(requestData);
        } else if (action === 'eliminarImagenDeProducto') {
            // 🆕 FASE 2: Imágenes
            result = eliminarImagenDeProducto(requestData.productoId);
        } else if (action === 'cambiarEstadoCita') {
            // 🆕 FASE 3: Endpoint para cambiar estado de cita
            result = cambiarEstadoCita(requestData.cita_id, requestData.nuevo_estado);
        } else if (action === 'cancelarCita') {
            // 🆕 FASE 3: Endpoint para cancelar cita
            result = cancelarCita(requestData.cita_id, requestData.motivo || 'No especificado');
        } else if (action === 'reagendarCita') {
            // 🆕 FASE 3: Endpoint para reagendar cita
            result = reagendarCita(
                requestData.cita_id,
                requestData.nueva_fecha,
                requestData.nueva_hora
            );
        } else if (action === 'crearHistoriaClinica') {
            // 🆕 HISTORIA CLÍNICA: Crear nueva HC
            result = crearHistoriaClinica(requestData);
        } else if (action === 'agregarAntecedente') {
            // 🆕 HISTORIA CLÍNICA: Antecedentes
            result = agregarAntecedente(requestData);
        } else if (action === 'agregarEvolucion') {
            // 🆕 HISTORIA CLÍNICA: Evoluciones
            result = agregarEvolucion(requestData);
        } else if (action === 'crearTratamiento') {
            // 🆕 HISTORIA CLÍNICA: Tratamientos (Crear)
            result = crearTratamiento(requestData);
        } else if (action === 'registrarAvanceTratamiento') {
            // 🆕 HISTORIA CLÍNICA: Tratamientos (Avance)
            result = registrarAvanceTratamiento(requestData.tratamiento_id);
        } else if (action === 'agregarAntecedente') {
            // 🆕 HISTORIA CLÍNICA: Agregar antecedente
            result = agregarAntecedente(requestData);
        } else if (action === 'agregarEvolucion') {
            // 🆕 HISTORIA CLÍNICA: Agregar evolución
            result = agregarEvolucion(requestData);
        } else {
            result = { status: "error", message: "Acción POST no reconocida." };
        }

        return ContentService.createTextOutput(JSON.stringify(result))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            message: `Error al procesar la solicitud POST: ${error.message}`
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * Agrega un registro genérico a una hoja específica.
 * @param {Object} requestData - Contiene sheetName (nombre de la hoja) y data (objeto con los campos).
 */
function agregarRegistroGenerico(requestData) {
    const sheetName = requestData.sheetName;
    const data = requestData.data;

    if (!sheetName) return { status: "error", message: "Falta el nombre de la hoja (sheetName)." };
    if (!data) return { status: "error", message: "Falta el objeto de datos (data)." };

    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) return { status: "error", message: `La pestaña '${sheetName}' no existe. Inicie la Base de Datos.` };

    try {
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const newId = generateUniqueAppId();

        const newRow = headers.map(header => {
            const h = header.toLowerCase();
            if (h === 'id') return newId;
            if (h === 'fecha' || h === 'fecha_creado' || h === 'created') return new Date();
            // Buscar en data (ignora mayúsculas/minúsculas en las llaves del objeto)
            const key = Object.keys(data).find(k => k.toLowerCase() === h);
            return key ? data[key] : "";
        });

        sheet.appendRow(newRow);
        return {
            status: "success",
            message: `Registro agregado exitosamente a '${sheetName}'.`,
            id: newId,
            data: data
        };
    } catch (e) {
        return { status: "error", message: `Error al agregar registro: ${e.message}` };
    }
}

// ----------------------------------------------------------------------
// FUNCIONES DE GESTIÓN DE CATEGORÍAS
// ----------------------------------------------------------------------
function getCategorias() {
    return getData(HOJA_CATEGORIAS);
}

function agregarCategoria(data) {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(HOJA_CATEGORIAS);

    if (!sheet) {
        return { status: "error", message: `La pestaña '${HOJA_CATEGORIAS}' no existe. Inicie la Base de Datos.` };
    }

    const newId = generateUniqueAppId();

    const newRow = [
        newId,
        data.nombre
    ];

    try {
        sheet.appendRow(newRow);
        return { status: "success", message: `Categoría '${data.nombre}' agregada (ID: ${newId}).` };
    } catch (e) {
        return { status: "error", message: `Error al escribir categoría: ${e.message}` };
    }
}

// ----------------------------------------------------------------------
// FUNCIONES DE GESTIÓN DE PRODUCTOS Y BÚSQUEDA
// ----------------------------------------------------------------------
function getInventario() {
    return getData(HOJA_PRODUCTOS);
}

function buscarProducto(query) {
    const data = getData(HOJA_PRODUCTOS);

    if (data.status !== 'success') return data;

    const products = data.data;
    const lowerQuery = query.toLowerCase().trim();

    if (lowerQuery.length === 0) {
        return { status: "warning", message: "Especifique un ID, Código o Nombre para buscar." };
    }

    // Filtra productos por ID, Código, o Nombre - CONVERSIÓN SEGURA A STRING
    const results = products.filter(p => {
        // Convertir todos los valores a string de forma segura
        const idStr = String(p.id || '');
        const codigoStr = String(p.código || '');
        const nombreStr = String(p.nombre || '');

        return idStr.toLowerCase().includes(lowerQuery) ||
            codigoStr.toLowerCase().includes(lowerQuery) ||
            nombreStr.toLowerCase().includes(lowerQuery);
    });

    if (results.length > 0) {
        return { status: "success", data: results, message: `${results.length} coincidencias encontradas.` };
    } else {
        return { status: "warning", message: "Producto no encontrado." };
    }
}

function agregarProducto(data) {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(HOJA_PRODUCTOS);

    if (!sheet) {
        return { status: "error", message: `La pestaña '${HOJA_PRODUCTOS}' no existe. Inicie la Base de Datos.` };
    }

    const newId = generateUniqueAppId();
    const tipo = data.tipo || "Inventariable"; // Default to Inventariable
    const stock = tipo === "Servicio" ? 0 : parseInt(data.stock || 0);

    const newRow = [
        newId,
        data.nombre,
        data.codigo,
        data.categoria,
        tipo,
        parseFloat(data.precio_compra),
        parseFloat(data.precio_venta),
        stock,
        new Date()
    ];

    try {
        sheet.appendRow(newRow);
        return { status: "success", message: `Producto '${data.nombre}' registrado con éxito. ID: ${newId}` };
    } catch (e) {
        return { status: "error", message: `Error al escribir producto: ${e.message}` };
    }
}

// ----------------------------------------------------------------------
// FUNCIONES DE GESTIÓN DE TRANSACCIONES (COMPRAS/VENTAS)
// ----------------------------------------------------------------------
function registrarTransaccion(data) {
    const ss = getSpreadsheet();
    const action = data.type; // 'compra' o 'venta'
    const isCompra = action === "compra";
    const sheetName = isCompra ? HOJA_COMPRAS : HOJA_VENTAS;
    const sheet = ss.getSheetByName(sheetName);
    const sheetProductos = ss.getSheetByName(HOJA_PRODUCTOS);

    if (!sheet || !sheetProductos) {
        return { status: "error", message: `Una o más pestañas necesarias no existen. Inicie la Base de Datos.` };
    }

    // 1. Validar producto y obtener fila actual
    const { rowData, rowIndex } = findProductRow(sheetProductos, data.producto_id);

    if (rowIndex === -1) {
        return { status: "error", message: `Producto ID ${data.producto_id} no encontrado en inventario.` };
    }

    // 2. Obtener datos actuales del producto
    const tipoColIndex = 4;  // Nueva columna 'tipo'
    const stockColIndex = 7;  // Ajustado por nueva columna
    const precioCompraColIndex = 5;
    const precioVentaColIndex = 6;

    const productoTipo = rowData[tipoColIndex] || "Inventariable";
    const cantidad = parseInt(data.cantidad);
    const precioTransaccion = parseFloat(data.precio);

    let stockActual = parseFloat(rowData[stockColIndex]) || 0;
    let nuevoStock = stockActual;

    // 3. Validar y actualizar stock solo para productos inventariables
    if (productoTipo === "Inventariable") {
        if (!isCompra) {
            if (stockActual < cantidad) {
                return {
                    status: "warning",
                    message: `Stock insuficiente. Solo hay ${stockActual} unidades disponibles para la venta de ${cantidad} unidades.`
                };
            }
            nuevoStock = stockActual - cantidad;
        } else {
            nuevoStock = stockActual + cantidad;
        }
    }
    // Para servicios, no se modifica el stock

    // 4. Escribir nueva transacción
    const transaccionId = generateUniqueAppId();
    const fechaTransaccion = data.fecha ? new Date(data.fecha) : new Date();
    // Ajustar para evitar desfase de zona horaria si viene de input date
    if (data.fecha) fechaTransaccion.setMinutes(fechaTransaccion.getMinutes() + fechaTransaccion.getTimezoneOffset());

    const newRow = [
        transaccionId,
        data.producto_id,
        cantidad,
        precioTransaccion,
        fechaTransaccion,
        data.extra_data || ''
    ];

    try {
        sheet.appendRow(newRow);
    } catch (e) {
        return { status: "error", message: `Error al registrar transacción: ${e.message}` };
    }

    // 5. Actualizar stock del producto solo si es inventariable
    if (productoTipo === "Inventariable") {
        try {
            sheetProductos.getRange(rowIndex + 1, stockColIndex + 1).setValue(nuevoStock);

            // 6. Actualizar precio si es diferente
            if (isCompra) {
                const precioActualCompra = parseFloat(rowData[precioCompraColIndex]) || 0;
                if (precioTransaccion !== precioActualCompra) {
                    sheetProductos.getRange(rowIndex + 1, precioCompraColIndex + 1).setValue(precioTransaccion);
                }
            } else {
                const precioActualVenta = parseFloat(rowData[precioVentaColIndex]) || 0;
                if (precioTransaccion !== precioActualVenta) {
                    sheetProductos.getRange(rowIndex + 1, precioVentaColIndex + 1).setValue(precioTransaccion);
                }
            }

            return {
                status: "success",
                message: `${isCompra ? 'Compra' : 'Venta'} registrada exitosamente. Stock actualizado: ${nuevoStock} unidades.`
            };

        } catch (e) {
            // Si falla la actualización, revertir la transacción
            sheet.deleteRow(sheet.getLastRow());
            return { status: "error", message: `Error al actualizar inventario: ${e.message}` };
        }
    } else {
        // Para servicios, solo confirmar la transacción sin actualizar stock
        return {
            status: "success",
            message: `${isCompra ? 'Compra' : 'Venta'} de servicio registrada exitosamente.`
        };
    }
}

/**
 * Registra múltiples transacciones en un solo lote (Batch).
 */
function registrarTransaccionBatch(data) {
    const items = data.items;
    let successCount = 0;
    let errors = [];

    for (let item of items) {
        const transData = {
            type: data.type,
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            precio: item.precio,
            fecha: data.fecha,
            extra_data: `Pedido: ${data.order_id} | ${data.extra_data || ''}`
        };

        const res = registrarTransaccion(transData);
        if (res.status === 'success') {
            successCount++;
        } else {
            errors.push(`${item.producto_id}: ${res.message}`);
        }
    }

    if (errors.length === 0) {
        return { status: "success", message: `Pedido ${data.order_id} completado. ${successCount} artículos registrados.` };
    } else {
        return {
            status: "partial",
            message: `Registrados ${successCount}/${items.length} artículos. Errores: ${errors.join(", ")}`
        };
    }
}

// ----------------------------------------------------------------------
// FUNCIÓN PARA OBTENER RESUMEN DIARIO
// ----------------------------------------------------------------------
function getResumenDiario() {
    return getData(HOJA_RESUMEN);
}

// ----------------------------------------------------------------------
// FUNCIONES DE UTILIDAD GENERAL
// ----------------------------------------------------------------------
function getData(sheetName) {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet || sheet.getLastRow() < 2) {
        return { status: "error", message: `Pestaña '${sheetName}' vacía o no existe.` };
    }

    const data = sheet.getDataRange().getValues();
    // Normalizar cabeceras: minusculas, sin tildes, espacios x guiones bajos (opcional)
    const headers = data[0].map(h => 
        String(h).toLowerCase().trim()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar tildes
            .replace(/\s+/g, '_') // Espacios a guion bajo (opcional, pero util)
            .replace(/[^a-z0-9_]/g, "") // Solo alfanumericos y guion bajo
    );
    const rows = data.slice(1);

    const mappedData = rows.map(row => {
        let entry = {};
        headers.forEach((header, index) => {
            let value = row[index];

            // Manejar valores vacíos
            if (value === '' || value === null || value === undefined) {
                value = '';
            }
            // Si es número, mantenerlo como número
            else if (typeof value === 'number') {
                value = value;
            }
            // Si es string que representa número, convertirlo a número
            else if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
                // Para códigos, mantener como string si tiene letras
                if (header === 'código' && /[a-zA-Z]/.test(value)) {
                    value = value; // Mantener como string
                } else {
                    value = parseFloat(value);
                }
            }
            // Si es fecha, dejarla como está
            else if (value instanceof Date) {
                // Mantener como Date
            }
            // Para cualquier otro caso, asegurar que sea string
            else {
                value = String(value);
            }

            entry[header] = value;
        });
        return entry;
    });

    // Filtrar filas completamente vacías
    const filteredData = mappedData.filter(entry => {
        return Object.values(entry).some(value => value !== '' && value !== null);
    });

    return { status: "success", data: filteredData };
}

// --------------------- AUTENTICACIÓN (Apps Script) ---------------------
function bytesToHex(bytes) {
    return bytes.map(function (b) {
        var v = (b < 0) ? b + 256 : b;
        return (v.toString(16).length === 1 ? '0' : '') + v.toString(16);
    }).join('');
}

function hashPasswordAppsScript(password) {
    try {
        var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
        return bytesToHex(raw);
    } catch (e) {
        throw new Error('Error al generar hash: ' + e.message);
    }
}

function authLogin(data) {
    if (!data || !data.usuario || !data.password) return { status: 'error', message: 'Faltan credenciales.' };
    var usuario = String(data.usuario).trim();
    var password = String(data.password);

    var check = getData(HOJA_USUARIOS);
    if (check.status !== 'success') return { status: 'error', message: 'No hay usuarios configurados.' };
    var users = check.data;

    for (var i = 0; i < users.length; i++) {
        if (String(users[i].usuario).toLowerCase() === usuario.toLowerCase()) {
            var storedHash = String(users[i].hash || '');
            var userRol = String(users[i].rol || 'Vendedor'); // Default a Vendedor si no tiene rol
            var incomingHash = hashPasswordAppsScript(password);

            // Aceptar si la celda contiene el hash SHA-256 o la contraseña en claro
            if (storedHash === incomingHash) {
                return { status: 'success', message: 'Autenticación correcta', usuario: usuario, rol: userRol };
            }

            // También permitir autenticación si el valor almacenado coincide exactamente con la contraseña enviada
            if (storedHash === password) {
                return { status: 'success', message: 'Autenticación correcta (contraseña en claro)', usuario: usuario, rol: userRol };
            }

            // Intentar comparar con trim y sin mayúsculas por si el valor fue guardado con espacios
            if (storedHash.trim() === incomingHash || storedHash.trim() === password.trim()) {
                return { status: 'success', message: 'Autenticación correcta', usuario: usuario, rol: userRol };
            }

            return { status: 'error', message: 'Credenciales inválidas' };
        }
    }
    return { status: 'error', message: 'Usuario no encontrado' };
}

function createUserInternal(data) {
    // data.usuario, data.password, data.adminKey, data.rol (opcional)
    if (!data || !data.usuario || !data.password || !data.adminKey) return { status: 'error', message: 'Faltan parámetros.' };
    var adminKey = String(data.adminKey);
    var props = PropertiesService.getScriptProperties();
    var stored = props.getProperty('ADMIN_KEY');
    // Si existe ADMIN_KEY en Properties, usarla; si no, permitir la constante ADMIN_KEY_CONST
    if (stored) {
        if (adminKey !== stored) return { status: 'error', message: 'Clave admin inválida.' };
    } else {
        if (adminKey !== ADMIN_KEY_CONST) return { status: 'error', message: 'Clave admin inválida.' };
    }

    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(HOJA_USUARIOS);
    if (!sheet) return { status: 'error', message: `La pestaña '${HOJA_USUARIOS}' no existe. Inicie la Base de Datos.` };

    // Validar rol
    var rol = data.rol ? String(data.rol).trim() : 'Vendedor';
    var rolesValidos = ['Admin', 'Vendedor', 'Bodeguero'];
    if (rolesValidos.indexOf(rol) === -1) {
        return { status: 'error', message: 'Rol inválido. Roles permitidos: Admin, Vendedor, Bodeguero.' };
    }

    // validar existencia
    var existing = getData(HOJA_USUARIOS);
    var usuario = String(data.usuario).trim();
    if (existing.status === 'success') {
        var arr = existing.data;
        for (var i = 0; i < arr.length; i++) {
            if (String(arr[i].usuario).toLowerCase() === usuario.toLowerCase()) {
                return { status: 'error', message: 'El usuario ya existe.' };
            }
        }
    }

    var hashed = hashPasswordAppsScript(String(data.password));
    try {
        sheet.appendRow([usuario, hashed, rol, new Date()]);
        return { status: 'success', message: `Usuario '${usuario}' creado correctamente con rol: ${rol}.` };
    } catch (e) {
        return { status: 'error', message: 'Error al crear usuario: ' + e.message };
    }
}

/**
 * Migrar contraseñas en claro en la hoja `Usuarios` a hashes SHA-256.
 * Requiere objeto { adminKey: '...' } con la clave guardada en Script Properties (ADMIN_KEY).
 */
function migrateUsersToHash(data) {
    if (!data || !data.adminKey) return { status: 'error', message: 'Falta adminKey.' };
    var props = PropertiesService.getScriptProperties();
    var stored = props.getProperty('ADMIN_KEY');
    // permitir clave desde Properties o usar la constante ADMIN_KEY_CONST si no está configurada
    if (stored) {
        if (String(data.adminKey) !== stored) return { status: 'error', message: 'Clave admin inválida.' };
    } else {
        if (String(data.adminKey) !== ADMIN_KEY_CONST) return { status: 'error', message: 'Clave admin inválida.' };
    }

    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(HOJA_USUARIOS);
    if (!sheet) return { status: 'error', message: `La pestaña '${HOJA_USUARIOS}' no existe.` };

    var range = sheet.getDataRange().getValues();
    // encabezados en la fila 1
    if (range.length < 2) return { status: 'success', message: 'No hay usuarios para migrar.' };

    var converted = 0;
    var hexRegex = /^[a-f0-9]{64}$/i;

    // iterar filas desde la segunda (índice 1)
    for (var i = 1; i < range.length; i++) {
        var row = range[i];
        var usuario = String(row[0] || '').trim();
        var storedVal = String(row[1] || '');
        if (!usuario) continue;
        // si está vacío o ya parece un hash, saltar
        if (!storedVal) continue;
        if (hexRegex.test(storedVal.trim())) continue;

        // convertir: storedVal se interpreta como contraseña en claro -> calcular hash
        try {
            var hashed = hashPasswordAppsScript(storedVal);
            sheet.getRange(i + 1, 2).setValue(hashed); // columna B (índice 2)
            converted++;
        } catch (e) {
            // registrar y continuar
            // no usar Logger aquí para no romper la ejecución
        }
    }

    return { status: 'success', message: `Migración completa. ${converted} contraseñas convertidas a hash.` };
}

function findProductRow(sheetProductos, productoId) {
    try {
        const data = sheetProductos.getDataRange().getValues();
        const idColIndex = 0;

        for (let i = 1; i < data.length; i++) {
            const rowId = String(data[i][idColIndex] || '');
            const searchId = String(productoId || '');

            if (rowId.toLowerCase() === searchId.toLowerCase()) {
                return { rowData: data[i], rowIndex: i };
            }
        }
        return { rowData: null, rowIndex: -1 };
    } catch (error) {
        console.error(`Error en findProductRow: ${error}`);
        return { rowData: null, rowIndex: -1 };
    }
}

// ----------------------------------------------------------------------
// FUNCIONES DE CONFIGURACIÓN DE BASE DE DATOS
// ----------------------------------------------------------------------
function createOrResetSheet(ss, name, headers) {
    let sheet = ss.getSheetByName(name);
    let action = "verificada";

    if (!sheet) {
        sheet = ss.insertSheet(name);
        action = "creada";
    }

    // Limpiar contenido y establecer encabezados
    sheet.clearContents();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);

    return `Pestaña '${name}' ${action}.`;
}

function iniciarBaseDeDatos() {
    const ss = getSpreadsheet();
    let msg = [];

    msg.push(createOrResetSheet(ss, HOJA_CATEGORIAS, CATEGORIAS_HEADERS));
    msg.push(createOrResetSheet(ss, HOJA_PRODUCTOS, PRODUCTOS_HEADERS));
    msg.push(createOrResetSheet(ss, HOJA_COMPRAS, COMPRAS_HEADERS));
    msg.push(createOrResetSheet(ss, HOJA_VENTAS, VENTAS_HEADERS));
    msg.push(createOrResetSheet(ss, HOJA_RESUMEN, RESUMEN_HEADERS));
    msg.push(createOrResetSheet(ss, HOJA_USUARIOS, USUARIOS_HEADERS));
    msg.push(createOrResetSheet(ss, HOJA_PROVEEDORES, PROVEEDORES_HEADERS));
    msg.push(createOrResetSheet(ss, HOJA_CLIENTES, CLIENTES_HEADERS));
    msg.push(createOrResetSheet(ss, HOJA_PROVEEDORES, PROVEEDORES_HEADERS));
    msg.push(createOrResetSheet(ss, HOJA_CLIENTES, CLIENTES_HEADERS));

    // Añadir usuario admin por defecto si la hoja está vacía (sólo encabezados)
    try {
        var sheetUsers = ss.getSheetByName(HOJA_USUARIOS);
        if (sheetUsers && sheetUsers.getLastRow() < 2) {
            var hashed = hashPasswordAppsScript(String(DEFAULT_ADMIN_PASS));
            sheetUsers.appendRow([String(DEFAULT_ADMIN_USER), hashed, 'Admin', new Date()]);
            msg.push(`Usuario por defecto '${DEFAULT_ADMIN_USER}' creado con rol Admin.`);
        }
    } catch (e) {
        msg.push(`No fue posible crear usuario admin: ${e.message}`);
    }

    return { status: "success", message: `Base de datos inicializada: ${msg.join(" ")}` };
}

function resetearBaseDeDatos() {
    const ss = getSpreadsheet();
    let msg = [];

    // Se eliminan todas las pestañas excepto la primera ("Hoja 1")
    ss.getSheets().forEach(sheet => {
        const sheetName = sheet.getName();
        if (sheetName !== "Hoja 1") {
            ss.deleteSheet(sheet);
            msg.push(`Pestaña '${sheetName}' eliminada.`);
        }
    });

    // Se recrean las pestañas
    msg.push(createOrResetSheet(ss, HOJA_CATEGORIAS, CATEGORIAS_HEADERS));
    msg.push(createOrResetSheet(ss, HOJA_PRODUCTOS, PRODUCTOS_HEADERS));
    msg.push(createOrResetSheet(ss, HOJA_COMPRAS, COMPRAS_HEADERS));
    msg.push(createOrResetSheet(ss, HOJA_VENTAS, VENTAS_HEADERS));
    msg.push(createOrResetSheet(ss, HOJA_RESUMEN, RESUMEN_HEADERS));
    msg.push(createOrResetSheet(ss, HOJA_USUARIOS, USUARIOS_HEADERS));

    // Añadir usuario admin por defecto si la hoja está vacía (sólo encabezados)
    try {
        var sheetUsers2 = ss.getSheetByName(HOJA_USUARIOS);
        if (sheetUsers2 && sheetUsers2.getLastRow() < 2) {
            var hashed2 = hashPasswordAppsScript(String(DEFAULT_ADMIN_PASS));
            sheetUsers2.appendRow([String(DEFAULT_ADMIN_USER), hashed2, 'Admin', new Date()]);
            msg.push(`Usuario por defecto '${DEFAULT_ADMIN_USER}' creado con rol Admin.`);
        }
    } catch (e) {
        msg.push(`No fue posible crear usuario admin: ${e.message}`);
    }

    return { status: "success", message: `Base de datos reseteada completamente: ${msg.join(" ")}` };
}

// ========== USER MANAGEMENT FUNCTIONS ==========

function updateUserRole(data) {
    // data: { usuario, nuevoRol, adminKey }
    if (!data || !data.usuario || !data.nuevoRol || !data.adminKey) {
        return { status: 'error', message: 'Faltan parámetros.' };
    }

    // Validar admin key
    var adminKey = String(data.adminKey);
    var props = PropertiesService.getScriptProperties();
    var stored = props.getProperty('ADMIN_KEY');
    if (stored) {
        if (adminKey !== stored) return { status: 'error', message: 'Clave admin inválida.' };
    } else {
        if (adminKey !== ADMIN_KEY_CONST) return { status: 'error', message: 'Clave admin inválida.' };
    }

    // Validar rol
    var nuevoRol = String(data.nuevoRol).trim();
    var rolesValidos = ['Admin', 'Vendedor', 'Bodeguero'];
    if (rolesValidos.indexOf(nuevoRol) === -1) {
        return { status: 'error', message: 'Rol inválido. Roles permitidos: Admin, Vendedor, Bodeguero.' };
    }

    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(HOJA_USUARIOS);
    if (!sheet) return { status: 'error', message: `La pestaña '${HOJA_USUARIOS}' no existe.` };

    var data_range = sheet.getDataRange();
    var values = data_range.getValues();
    var usuario = String(data.usuario).trim().toLowerCase();

    // Buscar usuario y actualizar rol
    for (var i = 1; i < values.length; i++) { // Empezar en 1 para saltar headers
        if (String(values[i][0]).toLowerCase() === usuario) {
            // Actualizar rol (columna 2, índice 2)
            sheet.getRange(i + 1, 3).setValue(nuevoRol);
            return { status: 'success', message: `Rol de '${data.usuario}' actualizado a '${nuevoRol}'.` };
        }
    }

    return { status: 'error', message: 'Usuario no encontrado.' };
}

function deleteUser(data) {
    // data: { usuario, adminKey }
    if (!data || !data.usuario || !data.adminKey) {
        return { status: 'error', message: 'Faltan parámetros.' };
    }

    // Validar admin key
    var adminKey = String(data.adminKey);
    var props = PropertiesService.getScriptProperties();
    var stored = props.getProperty('ADMIN_KEY');
    if (stored) {
        if (adminKey !== stored) return { status: 'error', message: 'Clave admin inválida.' };
    } else {
        if (adminKey !== ADMIN_KEY_CONST) return { status: 'error', message: 'Clave admin inválida.' };
    }

    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(HOJA_USUARIOS);
    if (!sheet) return { status: 'error', message: `La pestaña '${HOJA_USUARIOS}' no existe.` };

    var data_range = sheet.getDataRange();
    var values = data_range.getValues();
    var usuario = String(data.usuario).trim().toLowerCase();

    // Contar admins
    var adminCount = 0;
    var targetRow = -1;

    for (var i = 1; i < values.length; i++) {
        if (String(values[i][2]) === 'Admin') adminCount++;
        if (String(values[i][0]).toLowerCase() === usuario) {
            targetRow = i + 1; // +1 porque getRange es 1-indexed
        }
    }

    if (targetRow === -1) {
        return { status: 'error', message: 'Usuario no encontrado.' };
    }

    // Verificar que no sea el último admin
    var targetUserRol = String(values[targetRow - 1][2]);
    if (targetUserRol === 'Admin' && adminCount <= 1) {
        return { status: 'error', message: 'No se puede eliminar el último administrador del sistema.' };
    }

    // Eliminar fila
    sheet.deleteRow(targetRow);
    return { status: 'success', message: `Usuario '${data.usuario}' eliminado correctamente.` };
}

// ========== ORDER ID MANAGEMENT ==========

function getNextOrderId(data) {
    // data.type: 'Ventas' or 'Compras'
    if (!data || !data.type) return { status: 'error', message: 'Tipo no especificado.' };

    var sheetName = data.type === 'Ventas' ? HOJA_VENTAS : HOJA_COMPRAS;
    var prefix = data.type === 'Ventas' ? 'V-' : 'P-';

    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return { status: 'error', message: `Hoja ${sheetName} no encontrada.` };

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
        return { status: 'success', nextId: prefix + '1' };
    }

    // Obtener columna de IDs (columna 1)
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    var maxId = 0;

    for (var i = 0; i < ids.length; i++) {
        var idStr = String(ids[i][0]);
        // Intentar extraer número del formato PREFIJO-NUMERO o simplemente NUMERO
        // Ejemplo: V-123 -> 123, P-45 -> 45
        var num = parseInt(idStr.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(num) && num > maxId) {
            maxId = num;
        }
    }

    return { status: 'success', nextId: prefix + (maxId + 1) };
}
