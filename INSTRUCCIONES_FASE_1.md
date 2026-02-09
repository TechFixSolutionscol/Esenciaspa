# 📋 INSTRUCCIONES FASE 1 - Sistema de Citas

## ✅ Pre-requisitos
- FASE 0 completada exitosamente
- Google Calendar API activada
- Hojas Citas y Cotizaciones creadas
- Productos con duraciones configuradas

---

## PASO 1: Subir Scripts Backend a Apps Script

### 1.1 Abrir Apps Script
1. Abra su Google Sheets
2. **Extensiones → Apps Script**

### 1.2 Agregar CalendarAPI.gs
1. Click en **+ (Agregar archivo) → Script**
2. Nombre: `CalendarAPI`
3. Copie TODO el contenido de `backend/CalendarAPI.gs`
4. Pegue en el editor
5. **⚠️ IMPORTANTE:** En la línea 8, reemplace:
   ```javascript
   const CALENDAR_ID = 'primary';
   ```
   Por el ID de su calendario (si creó uno dedicado en FASE 0), o déjelo como está para usar el calendario principal.
6. **Guardar** (Ctrl+S)

### 1.3 Agregar CitasManager.gs
1. Click en **+ → Script**
2. Nombre: `CitasManager`
3. Copie TODO el contenido de `backend/CitasManager.gs`
4. Pegue en el editor
5. **Guardar**

### 1.4 Actualizar Code.gs (archivo principal)
1. Abra el archivo `Code.gs` existente
2. Busque la función `doGet(e)`
3. Dentro del `switch(data.action)`, agregue estos casos:

```javascript
case 'getCitasPorFecha':
  const fecha = data.fecha || new Date().toISOString().split('T')[0];
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'success', data: getCitasPorFecha(fecha) })
  ).setMimeType(ContentService.MimeType.JSON);

case 'getEventosDelDia':
  const fechaEvento = data.fecha || new Date().toISOString().split('T')[0];
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'success', data: getEventosDelDia(fechaEvento) })
  ).setMimeType(ContentService.MimeType.JSON);
```

4. Busque la función `doPost(e)`
5. Dentro del `switch(data.action)`, agregue estos casos:

```javascript
case 'calcularDuracion':
  return ContentService.createTextOutput(
    JSON.stringify(calcularDuracionCita(data.servicio_id, data.requiere_retiro))
  ).setMimeType(ContentService.MimeType.JSON);

case 'checkDisponibilidad':
  return ContentService.createTextOutput(
    JSON.stringify(checkAvailability(data.fecha, data.hora_inicio, data.duracion_minutos))
  ).setMimeType(ContentService.MimeType.JSON);

case 'crearCita':
  return ContentService.createTextOutput(
    JSON.stringify(crearCita(data))
  ).setMimeType(ContentService.MimeType.JSON);

case 'cambiarEstadoCita':
  return ContentService.createTextOutput(
    JSON.stringify(cambiarEstadoCita(data.cita_id, data.nuevo_estado))
  ).setMimeType(ContentService.MimeType.JSON);
```

6. **Guardar**

---

## PASO 2: Configurar Duraciones de Servicios

### 2.1 Abrir Hoja Productos
1. Vaya a su Google Sheets
2. Abra la hoja **Productos**

### 2.2 Configurar Servicios Existentes
Para cada servicio, complete las nuevas columnas:

| Nombre | duracion_base_minutos | duracion_retiro_minutos | requiere_retiro_opcional | es_servicio |
|--------|----------------------|-------------------------|-------------------------|-------------|
| Polygel estándar | 150 | 30 | TRUE | SERVICIO |
| Manicure básica | 50 | 0 | FALSE | SERVICIO |
| Manicure + esmaltado | 90 | 0 | FALSE | SERVICIO |
| Pedicure básico | 60 | 0 | FALSE | SERVICIO |
| Pedicure + esmaltado | 90 | 0 | FALSE | SERVICIO |

**Nota:** Ajuste las duraciones según su experiencia real.

---

## PASO 3: Desplegar Nueva Versión

### 3.1 Crear Nuevo Deployment
1. En Apps Script, click en **Implementar → Nueva implementación**
2. Tipo: **Aplicación web**
3. Descripción: `FASE 1 - Sistema de Citas`
4. Ejecutar como: **Yo**
5. Acceso: **Cualquier usuario**
6. Click en **Implementar**
7. **Copie la URL de la aplicación web** (la necesitará para el frontend)

### 3.2 Autorizar Permisos de Calendar
1. La primera vez le pedirá permisos adicionales
2. Click en **Revisar permisos**
3. Seleccione su cuenta
4. **Avanzado → Ir a [proyecto] (no seguro)**
5. **Permitir** acceso a Calendar

---

## PASO 4: Configurar Frontend Público

### 4.1 Actualizar URL en JavaScript
1. Abra el archivo `public/js/reservar_cita.js`
2. En la línea 7, reemplace:
   ```javascript
   const SCRIPT_URL = 'TU_SCRIPT_URL_AQUI';
   ```
   Por la URL que copió en el Paso 3.1

### 4.2 Agregar Link en Menú de Navegación
1. Abra `index.html` (raíz)
2. Busque el `<nav>` y agregue:
   ```html
   <li><a href="public/reservar-cita.html">Reservar Cita</a></li>
   ```

3. Haga lo mismo en `public/servicios.html` y `public/tienda.html`

---

## PASO 5: Testing del Sistema

### 5.1 Probar Cálculo de Duración
1. Abra `public/reservar-cita.html` en el navegador
2. Seleccione un servicio
3. Verifique que aparezca la duración correcta
4. Si el servicio permite retiro, marque la casilla
5. Verifique que la duración aumente correctamente

### 5.2 Crear Cita de Prueba
1. Complete el formulario:
   - Servicio: Polygel estándar
   - Fecha: Mañana
   - Hora: 10:00
   - Marque "Requiere retiro"
   - Ingrese sus datos
2. Click en **Reservar Cita**
3. Espere la confirmación

### 5.3 Verificar en Google Calendar
1. Abra [Google Calendar](https://calendar.google.com)
2. Verifique que aparezca el evento:
   - Título: "Polygel estándar - [Su nombre]"
   - Duración: 3 horas (10:00 - 13:00)
   - Descripción con detalles del cliente

### 5.4 Verificar en Google Sheets
1. Abra la hoja **Citas**
2. Verifique que aparezca el nuevo registro con:
   - ID de cita
   - Estado: PENDIENTE
   - Event ID de Calendar
   - Duración: 180 minutos

### 5.5 Verificar WhatsApp
1. En la confirmación de la página, click en "Abrir WhatsApp"
2. Verifique que se abra WhatsApp Web/App con el mensaje prellenado
3. **Opcional:** Envíe el mensaje al cliente

---

## PASO 6: Probar Validación de Traslapes

### 6.1 Intentar Cita Traslapada
1. Intente crear otra cita:
   - Mismo servicio
   - Misma fecha
   - Hora: 11:00 (traslapa con la anterior que termina a las 13:00)
2. **Resultado esperado:** Debe rechazarse con mensaje de error

### 6.2 Crear Cita Válida
1. Cree otra cita:
   - Hora: 13:00 (justo después de la anterior)
2. **Resultado esperado:** Debe crearse exitosamente

---

## ✅ CHECKLIST FASE 1

- [ ] CalendarAPI.gs subido y Calendar ID configurado
- [ ] CitasManager.gs subido
- [ ] Code.gs actualizado con nuevos endpoints
- [ ] Servicios configurados con duraciones
- [ ] Nueva implementación desplegada
- [ ] Permisos de Calendar autorizados
- [ ] URL de script actualizada en reservar_cita.js
- [ ] Link "Reservar Cita" agregado al menú
- [ ] Cita de prueba creada exitosamente
- [ ] Evento visible en Google Calendar
- [ ] Registro visible en hoja Citas
- [ ] WhatsApp notification generado
- [ ] Validación de traslapes funciona

---

## 🆘 Solución de Problemas

### Error: "Calendar API not found"
- **Causa:** No activó Calendar API en FASE 0
- **Solución:** Vaya a Servicios → Agregar → Calendar API v3

### Error: "Servicio no tiene duración configurada"
- **Causa:** Falta completar columnas de duración
- **Solución:** Complete `duracion_base_minutos` en la hoja Productos

### WhatsApp no abre
- **Causa:** Número de teléfono inválido
- **Solución:** Use formato de 10 dígitos (ej: 3001234567)

### Cita se crea pero no aparece en Calendar
- **Causa:** Permisos no autorizados o Calendar ID incorrecto
- **Solución:** Revise permisos y verifique Calendar ID en CalendarAPI.gs

---

## 📞 Siguiente Paso

Una vez completada la FASE 1, confirme:
1. ✅ Puede crear citas desde la web pública
2. ✅ Se sincroniza con Google Calendar
3. ✅ WhatsApp notifications funcionan
4. ✅ Validación de traslapes funciona

**Luego procederemos con FASE 2: Gestión de Imágenes con Google Drive**
