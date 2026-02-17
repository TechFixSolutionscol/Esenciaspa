# Diagnóstico: Problema con Horarios de Lunes

## 🔴 Problema Identificado
El formulario de reservas dice "No hay horarios disponibles para este día" en **lunes**, pero en la hoja de configuración se ve claramente:
- `horario_lunes_apertura`: 8:00
- `horario_lunes_cierre`: 17:00

## 🔍 Causa Probable
Las horas en Google Sheets se guardan como **números decimales** (formato hora) en lugar de strings.

Por ejemplo:
- `8:00` se guarda internamente como `0.333333` (8 horas / 24 horas)
- `17:00` se guarda internamente como `0.708333` (17 horas / 24 horas)

Cuando el backend intenta convertir estos valores, puede haber problemas.

## ✅ Solución

### Opción 1: Formatear Celdas en Google Sheets (MÁS RÁPIDO)

1. Abre tu Google Sheet de configuración
2. Selecciona TODAS las cel das de horarios (apertura y cierre)
3. Click derecho → **Format cells** → **Plain text**
4. Ahora edita cada celda y escribe:
   - Para apertura: `8:00` (como texto)
   - Para cierre: `17:00` (como texto)
5. Guarda

### Opción 2: Mejorar el Backend (MÁS ROBUSTO)

Modificar la función `parseHorarios` en `ConfiguracionManager.gs` para manejar mejor los números
decimales de Google Sheets.

## 🧪 Para Diagnosticar

1. Abre la consola del formulario (F12)
2. Busca el mensaje: `✅ Configuración cargada:`
3. Verifica qué dice en: `- lunes:`
4. Debería decir: `{ apertura: "8:00", cierre: "17:00" }`
5. Si dice `null` o está vacío, el problema está en el backend

## 📝 Valores de Debugging Esperados

En la consola del navegador deberías ver:

```
✅ Configuración cargada:
   - Config general: Object
   - Horarios completos: Object
   - lunes: { apertura: "8:00", cierre: "17:00" }
   - martes:{ apertura: "8:00", cierre: "17:00" }
   - miercoles: { apertura: "8:00", cierre: "17:00" }
   ...
```

Si ves:
```
   - lunes: null
```

Entonces el problema está en cómo el Sheet está guardando los datos.

## 🔧 Script de Prueba para Backend

Agrega temporalmente este código en `ConfiguracionManager.gs` dentro de `parseHorarios`:

```javascript
// DESPUÉS de la línea: const apertura = config[`horario_${dia}_apertura`];
Logger.log(`DEBUG ${dia} - tipo apertura: ${typeof apertura}, valor: ${apertura}`);
Logger.log(`DEBUG ${dia} - es Date: ${apertura instanceof Date}`);
Logger.log(`DEBUG ${dia} - String: "${String(apertura)}"`);
```

Luego ejecuta `getConfiguracion()` y ve los logs en Google Apps Script.
