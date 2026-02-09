# 🚀 Plan de Testing en Producción - esenciaspa.site

## 📋 CHECKLIST COMPLETO DE TESTING

---

## PARTE 1: Testing Backend (Google Sheets + Apps Script)

### 1.1 Verificar Menú de Testing
- [ ] Abrir Google Sheets
- [ ] Recargar página (F5)
- [ ] Verificar que aparezca menú **🧪 Testing & Debug**

### 1.2 Test FASE 0: Estructura de Datos
**Acción:** Click en `🧪 Testing & Debug → 📊 FASE 0 - Datos → ✅ Validar Estructura de Hojas`

**Resultado esperado:**
```
✅ Hojas existentes (6/6):
Productos, Clientes, Citas, Cotizaciones, Categorias, Proveedores
✅ Todas las hojas requeridas existen
```

**Si falla:** Ejecutar migración FASE 0 nuevamente

### 1.3 Test Estadísticas
**Acción:** Click en `📈 Mostrar Estadísticas`

**Resultado esperado:**
```
✅ Productos: X registros
✅ Clientes: X registros
✅ Categorias: X registros
etc...
```

### 1.4 Test FASE 1: Calendar API
**Acción:** Click en `📅 FASE 1 - Citas → 📅 Test: Verificar Calendar API`

**Resultado esperado:**
```
✅ Calendar API funcionando correctamente
Calendario ID: primary (o tu ID)
Eventos encontrados: X
```

**Si falla:** 
- Activar Calendar API en Apps Script → Servicios
- Autorizar permisos

### 1.5 Test Cálculo de Duración
**Acción:** Click en `🧮 Test: Calcular Duración`

**Resultado esperado:**
```
Servicio: [Nombre del servicio]
Duración base: X min
Con retiro: Y min
Sin retiro: X min
✅ Cálculo funcionando correctamente
```

**Si falla:**
- Verificar que servicios tengan `duracion_base_minutos` configurada
- Ir a hoja Productos y completar duraciones

### 1.6 Test FASE 2: Drive
**Acción:** Click en `📷 FASE 2 - Imágenes → 📁 Test: Verificar Carpeta Drive`

**Resultado esperado:**
```
✅ Carpeta accesible correctamente
Nombre: Esencia Spa - Catálogo
Archivos: X
URL: [URL de carpeta]
```

**Si falla:**
- Verificar DRIVE_FOLDER_ID en DriveManager.gs
- Activar Drive API

### 1.7 Test Completo Automático
**Acción:** Click en `🔧 Test Completo (Todas las Fases)`

**Resultado esperado:**
```
✅ Exitosos: 3
❌ Fallidos: 0
🎉 ¡Todos los tests pasaron correctamente!
```

---

## PARTE 2: Testing Frontend Público (esenciaspa.site)

### 2.1 Página Principal
**URL:** https://esenciaspa.site

**Tests:**
- [ ] Página carga correctamente
- [ ] Logo e imágenes visibles
- [ ] Menú de navegación funciona
- [ ] Links a Servicios, Tienda funcionan
- [ ] Botón WhatsApp flotante funciona

**Verificar en navegador (F12 → Console):**
- Sin errores 404
- Sin errores de JavaScript

### 2.2 Página de Servicios
**URL:** https://esenciaspa.site/public/servicios.html

**Tests:**
- [ ] Página carga correctamente
- [ ] Servicios se muestran (cargados desde Sheets)
- [ ] Imágenes de servicios visibles (desde Drive o placeholders)
- [ ] Precios y descripciones correctas
- [ ] Link "Reservar Cita" visible

**Verificar:**
```javascript
// Abrir consola (F12) y ejecutar:
fetch('TU_SCRIPT_URL?action=getInventario')
  .then(r => r.json())
  .then(d => console.log('Servicios:', d))
```

### 2.3 Página de Tienda
**URL:** https://esenciaspa.site/public/tienda.html

**Tests:**
- [ ] Página carga correctamente
- [ ] Productos se muestran (cargados desde Sheets)
- [ ] Imágenes de productos visibles
- [ ] Precios correctos
- [ ] Categorías funcionan

### 2.4 Página de Reservar Cita ⭐ CRÍTICO
**URL:** https://esenciaspa.site/public/reservar-cita.html

**Tests:**
- [ ] Página carga correctamente
- [ ] Selector de servicio carga servicios desde backend
- [ ] Al seleccionar servicio, muestra duración
- [ ] Si servicio permite retiro, muestra checkbox
- [ ] Al marcar retiro, duración aumenta (+30 min)
- [ ] Hora fin se calcula automáticamente
- [ ] Campos de cliente validados correctamente
- [ ] Fecha mínima es hoy

**Test Completo de Reserva:**
1. Seleccionar servicio: "Polygel estándar"
2. Marcar "Requiere retiro"
3. Verificar duración: 180 min (3 horas)
4. Seleccionar fecha: Mañana
5. Hora: 10:00
6. Verificar hora fin: 13:00
7. Ingresar datos:
   - Nombre: Test Usuario
   - Teléfono: 3001234567
   - Email: test@test.com
8. Click "Reservar Cita"

**Resultado esperado:**
```
✅ ¡Cita reservada exitosamente!
ID de cita: CITA-[timestamp]
Duración: 180 minutos (hasta las 13:00)
📱 Abrir WhatsApp para confirmar
```

**Verificar después:**
- [ ] Evento creado en Google Calendar (10:00-13:00)
- [ ] Registro en hoja "Citas" de Sheets
- [ ] Cliente creado en hoja "Clientes" (si no existía)
- [ ] Email recibido (si proporcionó email)
- [ ] Link de WhatsApp abre correctamente

---

## PARTE 3: Testing Admin Panel

### 3.1 Login
**URL:** https://esenciaspa.site/admin/

**Tests:**
- [ ] Página de login carga
- [ ] Puede iniciar sesión con credenciales
- [ ] Redirige a dashboard después de login

### 3.2 Dashboard Principal
**Tests:**
- [ ] Dashboard carga correctamente
- [ ] Menú de navegación visible
- [ ] Widgets/estadísticas cargan

### 3.3 Sección Productos
**Tests:**
- [ ] Lista de productos carga desde Sheets
- [ ] Puede crear nuevo producto
- [ ] Puede editar producto existente
- [ ] Puede eliminar producto

### 3.4 Sección Imágenes ⭐ NUEVO
**Tests:**
- [ ] Sección "📷 Imágenes" visible en menú
- [ ] Tabla "Productos sin Imagen" carga
- [ ] Grid "Catálogo de Imágenes" carga
- [ ] Botón "Subir Imagen" abre modal
- [ ] Preview de imagen funciona
- [ ] Upload de imagen funciona (test con imagen < 5MB)
- [ ] Imagen aparece en Drive
- [ ] imagen_url se guarda en Sheets
- [ ] Imagen aparece en sitio público

**Test Completo Upload:**
1. Click en "📷 Imágenes" en menú
2. Seleccionar un producto sin imagen
3. Click "📷 Subir Imagen"
4. Seleccionar imagen de prueba
5. Verificar preview
6. Click "📤 Subir"
7. Esperar confirmación
8. Verificar que producto desaparece de tabla "Sin Imagen"
9. Verificar que producto aparece en "Catálogo de Imágenes"
10. Ir a sitio público y verificar que imagen se muestra

---

## PARTE 4: Verificaciones de Integración

### 4.1 Google Calendar
**Verificar:**
- [ ] Abrir Google Calendar
- [ ] Ver eventos creados desde formulario público
- [ ] Eventos tienen duración correcta (no solo 1 hora)
- [ ] Descripción del evento incluye datos del cliente
- [ ] Color del evento es verde (ID: 10)

### 4.2 Google Drive
**Verificar:**
- [ ] Abrir carpeta "Esencia Spa - Catálogo" en Drive
- [ ] Ver imágenes subidas desde admin
- [ ] Permisos: "Cualquiera con el enlace puede ver"
- [ ] URLs públicas funcionan

### 4.3 Google Sheets
**Verificar:**
- [ ] Hoja "Citas": tiene registros de reservas
- [ ] Hoja "Clientes": clientes creados automáticamente
- [ ] Hoja "Productos": campos de imagen completados

---

## PARTE 5: Tests de Validación

### 5.1 Prevención de Traslapes
**Test:**
1. Crear cita: Mañana 10:00, servicio 3 horas
2. Intentar crear otra cita: Mañana 11:00
3. **Resultado esperado:** Debe rechazarse con mensaje "Ya hay cita en ese horario"
4. Crear cita: Mañana 13:00 (después de la primera)
5. **Resultado esperado:** Debe crearse exitosamente

### 5.2 Validación de Formulario
**Test:**
- [ ] Teléfono con menos de 10 dígitos: rechazado
- [ ] Email inválido: muestra error
- [ ] Fecha pasada: no se puede seleccionar
- [ ] Envío sin servicio: muestra error

### 5.3 WhatsApp Notification
**Test:**
1. Crear cita de prueba
2. Click en link de WhatsApp en confirmación
3. **Verificar:**
   - Abre WhatsApp Web/App
   - Número correcto (+57...)
   - Mensaje pre-llenado con:
     - Nombre del spa
     - Nombre del cliente
     - Fecha y hora
     - Servicio
     - Duración

---

## PARTE 6: Checklist de Configuración

### 6.1 Variables de Configuración
**Verificar en código:**

**CalendarAPI.gs (línea 8):**
```javascript
const CALENDAR_ID = 'primary'; // o ID específico
```

**DriveManager.gs (línea 8):**
```javascript
const DRIVE_FOLDER_ID = '[TU_ID_AQUI]';
```

**reservar_cita.js (línea 7):**
```javascript
const SCRIPT_URL = '[TU_DEPLOYMENT_URL]';
```

**script.js (admin) (buscar SCRIPT_URL):**
```javascript
const SCRIPT_URL = '[TU_DEPLOYMENT_URL]';
```

### 6.2 APIs Activadas
- [ ] Calendar API (v3)
- [ ] Drive API (v3)
- [ ] Sheets API (incorporada)

### 6.3 Scopes Autorizados
**En appsscript.json:**
```json
"oauthScopes": [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/script.send_mail",
  "https://www.googleapis.com/auth/drive.file"
]
```

---

## 🐛 Errores Comunes y Soluciones Rápidas

### Error: "Servicios no cargan en formulario"
**Solución:**
1. F12 → Console
2. Buscar error de CORS o 404
3. Verificar SCRIPT_URL en reservar_cita.js
4. Verificar deployment en Apps Script

### Error: "Cita se crea pero no en Calendar"
**Solución:**
1. Verificar Calendar API activada
2. Verificar permisos autorizados
3. Ver logs en Apps Script → Ejecuciones

### Error: "Imagen no se sube"
**Solución:**
1. Verificar DRIVE_FOLDER_ID correcto
2. Verificar tamaño < 5MB
3. Verificar Drive API activada
4. Ver consola del navegador (F12)

### Error: "Duración no se calcula"
**Solución:**
1. Verificar que servicio tenga `duracion_base_minutos`
2. Ver consola del navegador
3. Verificar endpoint `calcularDuracion` en Code.gs

---

## ✅ RESUMEN FINAL

**Sistema 100% Funcional cuando:**
- [ ] Todos los tests backend pasan (menú Testing)
- [ ] Formulario público crea citas exitosamente
- [ ] Citas aparecen en Calendar con duración correcta
- [ ] Admin puede subir imágenes
- [ ] Imágenes aparecen en sitio público
- [ ] WhatsApp notifications funcionan
- [ ] No hay traslape de citas

---

**Próximos pasos después de testing:**
1. Si todo funciona → Pasar a FASE 3 (Dashboard de Citas Admin)
2. Si hay errores → Reportar cuáles para debuggear
