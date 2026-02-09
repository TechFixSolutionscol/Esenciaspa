# 📋 INSTRUCCIONES FASE 2 - Gestión de Imágenes

## ✅ Pre-requisitos
- FASE 0 y FASE 1 completadas
- Carpeta de Drive creada y configurada
- ID de carpeta Drive guardado

---

## PASO 1: Subir DriveManager.gs a Apps Script

### 1.1 Abrir Apps Script
1. Abra su Google Sheets
2. **Extensiones → Apps Script**

### 1.2 Agregar DriveManager.gs
1. Click en **+ (Agregar archivo) → Script**
2. Nombre: `DriveManager`
3. Copie TODO el contenido de `backend/DriveManager.gs`
4. **⚠️ IMPORTANTE:** En la línea 8, reemplace:
   ```javascript
   const DRIVE_FOLDER_ID = 'TU_FOLDER_ID_AQUI';
   ```
   Por el ID de su carpeta que guardó en FASE 0
   - Ejemplo: `const DRIVE_FOLDER_ID = '1A2B3C4D5E6F7G8H9I0J';`
5. **Guardar** (Ctrl+S)

---

## PASO 2: Actualizar Code.gs con Nuevos Endpoints

### 2.1 Agregar casos a doGet()
Busque la función `doGet(e)` y agregue:

```javascript
case 'listarImagenesCatalogo':
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'success', data: listarImagenesCatalogo() })
  ).setMimeType(ContentService.MimeType.JSON);

case 'getProductosSinImagen':
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'success', data: getProductosSinImagen() })
  ).setMimeType(ContentService.MimeType.JSON);
```

### 2.2 Agregar casos a doPost()
Busque la función `doPost(e)` y agregue:

```javascript
case 'subirYAsociarImagen':
  return ContentService.createTextOutput(
    JSON.stringify(subirYAsociarImagen(data))
  ).setMimeType(ContentService.MimeType.JSON);

case 'eliminarImagenDeProducto':
  return ContentService.createTextOutput(
    JSON.stringify(eliminarImagenDeProducto(data.productoId))
  ).setMimeType(ContentService.MimeType.JSON);
```

---

## PASO 3: Agregar Sección en Dashboard Admin

### 3.1 Abrir dashboard.html
1. Abra el archivo `admin/dashboard.html`

### 3.2 Agregar al Menú de Navegación
Busque el `<nav>` o menú lateral y agregue:

```html
<li><a href="#" onclick="showSection('imagenesSection'); cargarGestionImagenes();">📷 Imágenes</a></li>
```

### 3.3 Agregar Sección HTML
Copie TODO el contenido de `admin/seccion_imagenes.html` y péguelo antes del cierre de `</main>` o después de la última sección existente.

### 3.4 Agregar Script
Antes del cierre de `</body>`, agregue:

```html
<script src="js/gestion_imagenes.js"></script>
```

---

## PASO 4: Desplegar Nueva Versión

### 4.1 Crear Nuevo Deployment
1. En Apps Script, click en **Implementar → Nueva implementación**
2. Descripción: `FASE 2 - Gestión de Imágenes`
3. Click en **Implementar**
4. Copie la nueva URL (reemplazar en frontend si cambió)

### 4.2 Autorizar Permisos de Drive
1. La primera vez le pedirá permisos de Drive
2. **Revisar permisos → Permitir**

---

## PASO 5: Testing - Subir Primera Imagen

### 5.1 Acceder al Dashboard
1. Abra `admin/dashboard.html` (o su login)
2. Click en **📷 Imágenes** en el menú

### 5.2 Verificar Productos sin Imagen
1. Debería ver una tabla con productos/servicios que no tienen imagen
2. Si todos tienen imagen, genial. Si no, continúe:

### 5.3 Subir Imagen
1. Click en **📷 Subir Imagen** en algún producto
2. Seleccione una imagen (JPG, PNG, WebP - máx 5MB)
3. Verá un preview
4. Click en **📤 Subir**
5. Espere confirmación

### 5.4 Verificar en Drive
1. Abra su [carpeta de Drive](https://drive.google.com)
2. Vaya a "Esencia Spa - Catálogo"
3. Verifique que la imagen aparezca allí

### 5.5 Verificar en Sheets
1. Abra su Google Sheets
2. Hoja **Productos**
3. Verifique que el producto tenga:
   - `imagen_url`: URL pública de Drive
   - `imagen_drive_id`: ID del archivo

---

## PASO 6: Actualizar Páginas Públicas

### 6.1 Actualizar Tienda (tienda.html)
Abra `public/tienda.html` y actualice el código donde se renderiza cada producto:

**Antes:**
```html
<div class="producto-card">
    <img src="assets/images/producto_placeholder.jpg" alt="${producto.nombre}">
    <h3>${producto.nombre}</h3>
    <p>${producto.precio}</p>
</div>
```

**Después:**
```html
<div class="producto-card">
    <img src="${producto.imagen_url || 'assets/images/producto_placeholder.jpg'}" 
         alt="${producto.nombre}"
         onerror="this.src='assets/images/producto_placeholder.jpg'">
    <h3>${producto.nombre}</h3>
    <p>${producto.precio}</p>
</div>
```

### 6.2 Actualizar Servicios (servicios.html)
Similar al paso anterior, actualice el renderizado de servicios:

```html
<div class="servicio-card">
    <img src="${servicio.imagen_url || 'assets/images/servicio_placeholder.jpg'}" 
         alt="${servicio.nombre}"
         onerror="this.src='assets/images/servicio_placeholder.jpg'">
    <h3>${servicio.nombre}</h3>
    <p>${servicio.descripcion}</p>
</div>
```

### 6.3 Crear Imágenes Placeholder
Si no tiene imágenes placeholder, cree dos imágenes simples:
- `public/assets/images/producto_placeholder.jpg`
- `public/assets/images/servicio_placeholder.jpg`

O use este código para generar placeholders dinámicos:

```javascript
// Alternativa sin archivos físicos
function getImagenProducto(producto) {
    if (producto.imagen_url) {
        return producto.imagen_url;
    }
    // Placeholder con iniciales
    const inicial = producto.nombre.charAt(0).toUpperCase();
    return `https://via.placeholder.com/300x300/ff69b4/ffffff?text=${inicial}`;
}
```

---

## PASO 7: Testing Completo

### 7.1 Subir Varias Imágenes
1. Suba imágenes a al menos 3 productos distintos
2. Suba imágenes a al menos 2 servicios

### 7.2 Verificar en Tienda Pública
1. Abra `public/tienda.html` en el navegador
2. Verifique que las imágenes aparezcan
3. Si alguna imagen no carga, debe mostrarse el placeholder

### 7.3 Verificar en Servicios Públicos
1. Abra `public/servicios.html`
2. Verifique que las imágenes de servicios aparezcan

### 7.4 Probar Reemplazo
1. Vuelva al admin → Imágenes
2. En un producto que ya tiene imagen, click en **🔄 Reemplazar**
3. Suba una imagen diferente
4. Verifique que la anterior se eliminó de Drive
5. Verifique que la nueva aparece en el catálogo público

### 7.5 Probar Eliminación
1. En un producto con imagen, click en **🗑️ Eliminar**
2. Confirme
3. Verifique que:
   - La imagen se elimina de Drive
   - El producto vuelve a la tabla "Sin Imagen"
   - En la tienda pública aparece el placeholder

---

## ✅ CHECKLIST FASE 2

- [ ] DriveManager.gs subido con FOLDER_ID correcto
- [ ] Nuevos endpoints agregados a Code.gs
- [ ] Sección Imágenes agregada al dashboard
- [ ] Script gestion_imagenes.js cargado
- [ ] Nueva implementación desplegada
- [ ] Permisos de Drive autorizados
- [ ] Primera imagen subida exitosamente
- [ ] Imagen visible en carpeta Drive
- [ ] imagen_url guardada en Sheets
- [ ] Tienda pública actualizada para mostrar imágenes
- [ ] Servicios públicos actualizados
- [ ] Placeholders configurados
- [ ] Reemplazo de imagen funciona
- [ ] Eliminación de imagen funciona
- [ ] Imágenes visibles en sitio público

---

## 🆘 Solución de Problemas

### Error: "Drive folder not found"
- **Causa:** ID de carpeta incorrecto
- **Solución:** Verifique el ID en DriveManager.gs línea 8

### Imagen se sube pero no aparece en sitio
- **Causa:** Imagen no es pública
- **Solución:** Revise permisos de la carpeta Drive (debe ser "Cualquiera con el enlace")

### Error: "File too large"
- **Causa:** Imagen mayor a 5MB
- **Solución:** Reduzca el tamaño con herramientas online (TinyPNG, etc.)

### Preview no funciona
- **Causa:** Navegador no soporta FileReader
- **Solución:** Use Chrome/Edge/Firefox actualizado

---

## 📞 Siguiente Paso

Una vez completada la FASE 2, confirme:
1. ✅ Puede subir imágenes desde el admin
2. ✅ Imágenes se almacenan en Drive
3. ✅ Imágenes aparecen en tienda y servicios públicos
4. ✅ Puede reemplazar y eliminar imágenes

**Próximas Fases Disponibles:**
- FASE 3: Dashboard de Citas (Admin)
- FASE 4: Cotizaciones Automáticas
- FASE 5: Reportes y Analytics

**¿Cuál desea implementar?**
