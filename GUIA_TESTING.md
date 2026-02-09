# 🧪 Guía de Testing y Debugging

## Script de Testing Creado

He creado `backend/TestingDebug.gs` que incluye un menú interactivo completo para probar todas las funcionalidades.

---

## Paso 1: Subir Script de Testing

1. Abra **Google Sheets → Extensiones → Apps Script**
2. Click en **+ → Script**
3. Nombre: `TestingDebug`
4. Copie TODO el contenido de `backend/TestingDebug.gs`
5. Pegue y **Guardar**
6. Cierre Apps Script y **recargue (F5) Google Sheets**

---

## Paso 2: Usar el Menú de Testing

Después de recargar Sheets, verá un nuevo menú: **🧪 Testing & Debug**

### FASE 0: Datos
- **✅ Validar Estructura de Hojas** - Verifica que todas las hojas existan
- **📈 Mostrar Estadísticas** - Muestra conteo de registros

### FASE 1: Citas
- **🧮 Test: Calcular Duración** - Prueba cálculo de duración dinámica
- **📅 Test: Verificar Calendar API** - Verifica conexión con Calendar
- **✨ Test: Crear Cita de Prueba** - Crea cita completa de prueba
- **🔍 Test: Listar Eventos Hoy** - Lista eventos de Calendar

### FASE 2: Imágenes
- **📁 Test: Verificar Carpeta Drive** - Verifica acceso a carpeta
- **📋 Test: Listar Productos Sin Imagen** - Muestra productos sin imagen
- **🖼️ Test: Listar Catálogo Imágenes** - Muestra productos con imagen

### Test Completo
- **🔧 Test Completo (Todas las Fases)** - Ejecuta todos los tests

---

## Paso 3: Ejecutar Tests en Orden

### 3.1 Validar FASE 0
1. Click en **🧪 Testing & Debug → 📊 FASE 0 - Datos → ✅ Validar Estructura de Hojas**
2. Debería mostrar:
   ```
   ✅ Hojas existentes (6/6):
   Productos, Clientes, Citas, Cotizaciones, Categorias, Proveedores
   
   ✅ Todas las hojas requeridas existen
   ```

3. Click en **📈 Mostrar Estadísticas**
4. Verá el conteo de registros en cada hoja

**Si falla:** Ejecute nuevamente la migración de FASE 0

### 3.2 Validar FASE 1
1. Click en **📅 FASE 1 - Citas → 📅 Test: Verificar Calendar API**
2. Debería mostrar:
   ```
   ✅ Calendar API funcionando correctamente
   Calendario ID: primary
   Eventos encontrados: X
   ```

**Si falla con error "Calendar API not found":**
- Vaya a Apps Script → Servicios → Agregar → Calendar API v3

**Si falla con error de permisos:**
- Apps Script → Implementar → Nueva implementación
- Autorice permisos de Calendar

3. Click en **🧮 Test: Calcular Duración**
4. Debería mostrar duración base y con retiro de un servicio

**Si falla:** Verifique que los servicios tengan `duracion_base_minutos` configurada

4. **OPCIONAL:** Click en **✨ Test: Crear Cita de Prueba**
   - Esto creará una cita real de prueba para mañana a las 10:00
   - Verifique en Google Calendar que aparezca

### 3.3 Validar FASE 2
1. Click en **📷 FASE 2 - Imágenes → 📁 Test: Verificar Carpeta Drive**
2. Deberá mostrar:
   ```
   ✅ Carpeta accesible correctamente
   Nombre: Esencia Spa - Catálogo
   Archivos: X
   ```

**Si falla:**
- Verifique que `DRIVE_FOLDER_ID` en `DriveManager.gs` esté correcto
- Verifique permisos de Drive

3. Click en **📋 Test: Listar Productos Sin Imagen**
4. Mostrará productos que no tienen imagen aún

---

## Paso 4: Errores Comunes y Soluciones

### Error: "Calendar API not found"
**Causa:** Calendar API no activada

**Solución:**
1. Apps Script → Servicios (ícono +)
2. Buscar "Calendar API"
3. Agregar (v3)

### Error: "Drive folder not found"
**Causa:** ID de carpeta incorrecto

**Solución:**
1. Abra Google Drive
2. Vaya a la carpeta "Esencia Spa - Catálogo"
3. Click derecho → Obtener enlace
4. La URL será: `https://drive.google.com/drive/folders/[ID_AQUI]`
5. Copie el ID y actualícelo en `DriveManager.gs` línea 8

### Error: "Service no tiene duración configurada"
**Causa:** Falta `duracion_base_minutos` en Productos

**Solución:**
1. Abra hoja Productos
2. Verifique que existan las columnas:
   - `duracion_base_minutos`
   - `duracion_retiro_minutos`
   - `requiere_retiro_opcional`
   - `es_servicio`
3. Complete las duraciones para sus servicios

### Error: "Servicio no encontrado"
**Causa:** No hay servicios en la hoja Productos

**Solución:**
1. Agregue al menos un servicio a la hoja Productos
2. Complete todos los campos de duración

### Error: "Invalid time value" en getEventosDelDia
**Causa:** Fecha inválida pasada a la función

**Solución:**
- Ya corregido en `CalendarAPI.gs` con validaciones
- Si persiste, verifique que el endpoint pase fecha en formato `YYYY-MM-DD`

---

## Paso 5: Ver Logs Detallados

Para ver todos los logs de ejecución:

1. En Apps Script, click en **Ejecuciones** (ícono de reloj)
2. O vaya a **Ver → Registros** en el editor
3. Verá log completo de cada función ejecutada

---

## Paso 6: Test de Integración Frontend

### Probar Formulario de Reservas
1. Abra `public/reservar-cita.html` en el navegador
2. Seleccione un servicio
3. Verifique que muestre la duración
4. Si tiene checkbox de retiro, márquelo
5. Verifique que la duración aumente
6. Complete el formulario y reserve

**Si no carga servicios:**
- Verifique que `SCRIPT_URL` en `reservar_cita.js` sea correcto
- Revise la consola del navegador (F12)

### Probar Admin de Imágenes
1. Abra `admin/dashboard.html`
2. Click en **📷 Imágenes** (si ya lo agregó al menú)
3. Debería cargar productos sin imagen
4. Intente subir una imagen de prueba

**Si no funciona:**
- Verifique que esté cargado `<script src="js/gestion_imagenes.js"></script>`
- Revise consola del navegador (F12)

---

## ✅ Checklist de Debugging

- [ ] Menu Testing aparece en Sheets
- [ ] Test FASE 0: Todas las hojas existen
- [ ] Test FASE 1: Calendar API funciona
- [ ] Test FASE 1: Cálculo de duración funciona
- [ ] Test FASE 1: Cita de prueba se crea exitosamente
- [ ] Test FASE 2: Carpeta Drive accesible
- [ ] Frontend: Reservar cita carga servicios
- [ ] Frontend: Cálculo de duración en tiempo real
- [ ] Admin: Sección imágenes visible
- [ ] Admin: Upload de imagen funciona

---

## 🆘 Si Todo Falla

Ejecute **Test Completo** desde el menú:
- **🧪 Testing & Debug → 🔧 Test Completo (Todas las Fases)**

Esto ejecutará todos los tests y le dirá exactamente qué está fallando.

Luego revise los logs en Apps Script para ver el error específico.

---

**¿Qué error específico estás teniendo ahora?** Puedo ayudarte a solucionarlo paso a paso.
