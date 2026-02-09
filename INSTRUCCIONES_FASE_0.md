# 📋 INSTRUCCIONES FASE 0 - Preparación Técnica

## ⚠️ IMPORTANTE
Siga estos pasos EN ORDEN. No omita ningún paso.

---

## PASO 1: Subir Script de Migración a Apps Script

### 1.1 Abrir Google Sheets
1. Abra su hoja de cálculo de Google Sheets (FixOps/Esenciaspa)
2. Click en **Extensiones → Apps Script**

### 1.2 Crear Archivo de Migración
1. En el editor de Apps Script, click en el botón **+** junto a "Archivos"
2. Seleccione **Script**
3. Nombre del archivo: `MigracionDatos`
4. Copie TODO el contenido del archivo `backend/MigracionDatos.gs`
5. Péguelo en el editor
6. Click en **💾 Guardar** (o Ctrl+S)

---

## PASO 2: Activar APIs Necesarias

### 2.1 Google Calendar API
1. En el editor de Apps Script, click en **Servicios** (ícono de ➕ en el panel izquierdo)
2. Busque **Calendar API**
3. Click en **Agregar**
4. Versión: **v3**
5. Identificador: `Calendar` (dejar por defecto)
6. Click en **Agregar**

### 2.2 Google Drive API
1. Repita el proceso anterior
2. Busque **Drive API**
3. Click en **Agregar**
4. Versión: **v3**
5. Identificador: `Drive` (dejar por defecto)
6. Click en **Agregar**

### 2.3 Configurar OAuth Scopes
1. En el editor de Apps Script, click en **⚙️ Configuración del proyecto**
2. Marque la casilla **"Mostrar archivo de manifiesto appsscript.json en el editor"**
3. Vuelva a **Editor**
4. Ahora verá un archivo `appsscript.json`
5. Reemplace su contenido con:

```json
{
  "timeZone": "America/Bogota",
  "dependencies": {
    "enabledAdvancedServices": [
      {
        "userSymbol": "Calendar",
        "version": "v3",
        "serviceId": "calendar"
      },
      {
        "userSymbol": "Drive",
        "version": "v3",
        "serviceId": "drive"
      }
    ]
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.send_mail",
    "https://www.googleapis.com/auth/drive.file"
  ]
}
```

6. **💾 Guardar**

---

## PASO 3: Crear Carpeta en Google Drive

### 3.1 Crear Carpeta para Imágenes
1. Abra [Google Drive](https://drive.google.com)
2. Click derecho → **Nueva carpeta**
3. Nombre: `Esencia Spa - Catálogo`
4. Click en **Crear**

### 3.2 Configurar Permisos Públicos
1. Click derecho en la carpeta → **Obtener enlace**
2. Cambiar a: **Cualquier persona con el enlace**
3. Permisos: **Lector**
4. Click en **Copiar enlace**
5. **IMPORTANTE:** Copie el ID de la carpeta del enlace
   - URL ejemplo: `https://drive.google.com/drive/folders/1A2B3C4D5E6F7G8H9I0J`
   - ID de carpeta: `1A2B3C4D5E6F7G8H9I0J` (la parte después de `/folders/`)
6. **Guarde este ID** - lo necesitará más adelante

---

## PASO 4: Crear/Configurar Calendario

### Opción A: Usar Calendario Principal
- No requiere acción adicional
- El sistema usará el calendario principal de su cuenta

### Opción B: Crear Calendario Dedicado (Recomendado)
1. Abra [Google Calendar](https://calendar.google.com)
2. En el panel izquierdo, junto a "Otros calendarios" click en **+**
3. Seleccione **Crear calendario**
4. Nombre: `Esencia Spa - Citas`
5. Descripción: `Agenda de citas del spa`
6. Zona horaria: `(GMT-05:00) Bogotá`
7. Click en **Crear calendario**
8. Click derecho en el nuevo calendario → **Configuración y uso compartido**
9. Copie el **ID del calendario** (está en "Integrar calendario")
   - Ejemplo: `esenciaspaco@gmail.com` o algo similar
10. **Guarde este ID**

---

## PASO 5: Ejecutar Migración de Datos

### 5.1 Volver a Google Sheets
1. Cierre el editor de Apps Script
2. Vuelva a su hoja de Google Sheets
3. Recargue la página (F5)
4. Debería aparecer un nuevo menú: **🌸 Esencia Spa - Migración**

### 5.2 Crear Backup
1. Click en **🌸 Esencia Spa - Migración → 📦 Crear Backup**
2. Espere el mensaje de confirmación
3. **Copie y guarde la URL del backup**

### 5.3 Ejecutar Migración Completa
1. Click en **🌸 Esencia Spa - Migración → 🚀 Ejecutar Migración Completa**
2. Confirme cuando se le pregunte
3. **Primera vez:** Aparecerá una ventana pidiendo permisos
   - Click en **Revisar permisos**
   - Seleccione su cuenta de Google
   - Click en **Avanzado**
   - Click en **Ir a [nombre del proyecto] (no seguro)**
   - Click en **Permitir**
4. Ejecute nuevamente la migración
5. Espere el mensaje de confirmación

### 5.4 Validar Resultados
1. Revise que se hayan creado las hojas:
   - **Citas** (nueva)
   - **Cotizaciones** (nueva)
2. Revise hoja **Productos**:
   - Deben aparecer nuevas columnas al final: `imagen_url`, `imagen_drive_id`, `duracion_base_minutos`, `duracion_retiro_minutos`, `requiere_retiro_opcional`, `es_servicio`
3. Revise hoja **Clientes**:
   - Deben aparecer nuevas columnas: `email`, `fecha_cumpleanos`, `observaciones`, `fecha_registro`, `total_servicios`, `ultima_visita`

---

## PASO 6: Configurar Datos de Servicios Iniciales

### 6.1 Agregar Duraciones a Servicios
En la hoja **Productos**, para cada servicio existente o nuevo:

| Nombre | duracion_base_minutos | duracion_retiro_minutos | requiere_retiro_opcional | es_servicio |
|--------|----------------------|-------------------------|-------------------------|-------------|
| Polygel estándar | 150 | 30 | TRUE | SERVICIO |
| Manicure básica | 50 | 0 | FALSE | SERVICIO |
| Manicure + esmaltado | 90 | 0 | FALSE | SERVICIO |
| Pedicure básico | 60 | 0 | FALSE | SERVICIO |
| Pedicure + esmaltado | 90 | 0 | FALSE | SERVICIO |

---

## ✅ CHECKLIST FASE 0

- [ ] Script `MigracionDatos.gs` subido a Apps Script
- [ ] Calendar API activada
- [ ] Drive API activada
- [ ] OAuth scopes configurados en `appsscript.json`
- [ ] Carpeta en Drive creada y pública
- [ ] ID de carpeta Drive copiado
- [ ] Calendario creado/configurado
- [ ] ID de calendario copiado
- [ ] Backup creado y URL guardada
- [ ] Migración ejecutada exitosamente
- [ ] Hojas Citas y Cotizaciones creadas
- [ ] Columnas agregadas a Productos
- [ ] Columnas agregadas a Clientes
- [ ] Datos de servicios configurados
- [ ] **NO se perdieron datos** (validado)

---

## 🆘 Solución de Problemas

### Error: "No se puede encontrar el método..."
- **Causa:** Typo en el nombre de la función
- **Solución:** Revise que copió correctamente el código

### Error: "No tiene permisos..."
- **Causa:** No autorizó el script
- **Solución:** Siga el PASO 5.3 nuevamente, autorizando correctamente

### No aparece el menú "Esencia Spa"
- **Causa:** No se ejecutó `onOpen()`
- **Solución:** Recargue la página de Sheets (F5)

### Hoja Citas/Cotizaciones ya existe
- **Causa:** Ya ejecutó la migración antes
- **Solución:** Elimine las hojas existentes o omita este paso

---

## 📞 Siguiente Paso

Una vez completada la FASE 0, **informe al administrador técnico** con:
1. ✅ Confirmación de que todos los pasos se completaron
2. 📋 ID de carpeta de Drive
3. 📅 ID de calendario
4. 🔗 URL del backup creado

**Luego procederemos con FASE 1: Sistema de Citas**
