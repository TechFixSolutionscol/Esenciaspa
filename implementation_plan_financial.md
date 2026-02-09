# Fase 4: Gestión Financiera - Plan de Implementación

## Objetivos
Implementar el control total del flujo de dinero en Esencia Spa:
1. **Registro de Ventas**: Tanto de citas atendidas como ventas directas de mostrador.
2. **Control de Gastos**: Registro de egresos (compras, pagos, etc.).
3. **Cierre de Caja**: Balance diario de ingresos vs egresos.

---

## 1. Base de Datos (Google Sheets)

Necesitaremos inicializar/verificar las siguientes hojas:

### Hoja `Ventas`
Historial de todos los ingresos.
- **Columnas**: `id`, `fecha`, `cliente_id` (opcional), `tipo` (Servicio/Producto), `items_json`, `total`, `metodo_pago`, `vendedor`, `observaciones`.

### Hoja `Gastos`
Registro de salidas de dinero.
- **Columnas**: `id`, `fecha`, `categoria` (Insumos, Servicios, Nómina, Otros), `descripcion`, `monto`, `metodo_pago`, `registrado_por`.

### Hoja `Caja` (Resumen Diario)
Cierres diarios automáticos o calculados.
- **Columnas**: `fecha`, `total_ventas`, `total_gastos`, `balance`, `efectivo_caja`, `bancos`.

---

## 2. Backend (Google Apps Script)

### Nuevos Archivos:
- **`FinanzasManager.gs`**:
  - `registrarVenta(data)`: Guarda venta y descuenta stock (si aplica).
  - `registrarGasto(data)`: Guarda gasto.
  - `obtenerResumenFinanciero(fechaInicio, fechaFin)`: Calcula totales.
  - `getCajaDiaria()`: Obtiene movimientos del día actual.

### Modificaciones en `Code.gs`:
- Nuevos endpoints:
  - `getResumenFinanciero`
  - `registrarVentaDirecta`
  - `registrarGasto`
  - `getMovimientosCaja`

---

## 3. Frontend (Panel Admin)

### Modificaciones en `dashboard.html`:
- Nuevo ítem en sidebar: **Finanzas**.
- Nueva sección `<section id="finanzas">`:
  - **Tabs**: Resumen, Nueva Venta, Nuevo Gasto, Historial.
  - **Tarjetas KPI**: Ventas Hoy, Gastos Hoy, Balance.
  - **Gráfico**: Ingresos vs Gastos (semana actual).

### Nuevo Script `finanzas.js`:
- Lógica para formularios de venta y gasto.
- Renderizado de tablas de historial.
- Cálculo de totales en frontend.

---

## Estrategia de Implementación

1. **Paso 1**: Inicializar hojas de cálculo (`Ventas`, `Gastos`, `Caja`).
2. **Paso 2**: Implementar backend (`FinanzasManager.gs` y endpoints).
3. **Paso 3**: Implementar frontend (HTML y JS en Dashboard).
4. **Paso 4**: Pruebas de flujo de caja.
