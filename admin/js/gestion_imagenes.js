/**
 * gestion_imagenes.js
 * Panel administrativo para gestión de imágenes
 * Esencia Spa - FixOps ERP
 */

// Cargar al abrir la sección
function cargarGestionImagenes() {
    cargarProductosSinImagen();
    cargarCatalogoConImagenes();
}

/**
 * Cargar productos/servicios sin imagen
 */
async function cargarProductosSinImagen() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getProductosSinImagen`);
        const data = await response.json();

        const tbody = document.getElementById('productos-sin-imagen-tbody');

        if (data.status === 'success' && data.data.length > 0) {
            tbody.innerHTML = data.data.map(p => `
                <tr>
                    <td>${p.id}</td>
                    <td>${p.nombre}</td>
                    <td><span class="badge ${p.tipo === 'SERVICIO' ? 'badge-info' : 'badge-warning'}">${p.tipo || 'Producto'}</span></td>
                    <td>${p.categoria || 'N/A'}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="abrirModalSubirImagen('${p.id}', '${p.nombre}')">
                            📷 Subir Imagen
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">✅ Todos los productos tienen imagen</td></tr>';
        }
    } catch (e) {
        console.error('Error cargando productos sin imagen:', e);
        mostrarNotificacion('Error al cargar productos', 'error');
    }
}

/**
 * Cargar catálogo con imágenes
 */
async function cargarCatalogoConImagenes() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=listarImagenesCatalogo`);
        const data = await response.json();

        const container = document.getElementById('catalogo-imagenes');

        if (data.status === 'success' && data.data.length > 0) {
            container.innerHTML = data.data.map(p => `
                <div class="imagen-card">
                    <img src="${p.imagenUrl}" alt="${p.nombre}" onerror="this.src='assets/img/placeholder.png'">
                    <div class="imagen-info">
                        <h4>${p.nombre}</h4>
                        <p>${p.categoria || 'Sin categoría'}</p>
                        <span class="badge ${p.tipo === 'SERVICIO' ? 'badge-info' : 'badge-warning'}">${p.tipo || 'Producto'}</span>
                    </div>
                    <div class="imagen-actions">
                        <button class="btn btn-sm btn-danger" onclick="eliminarImagen('${p.id}', '${p.nombre}')">
                            🗑️ Eliminar
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="abrirModalSubirImagen('${p.id}', '${p.nombre}')">
                            🔄 Reemplazar
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-center">No hay imágenes en el catálogo</p>';
        }
    } catch (e) {
        console.error('Error cargando catálogo:', e);
        mostrarNotificacion('Error al cargar catálogo', 'error');
    }
}

/**
 * Abrir modal para subir imagen
 */
function abrirModalSubirImagen(productoId, productoNombre) {
    document.getElementById('modal-producto-id').value = productoId;
    document.getElementById('modal-producto-nombre').textContent = productoNombre;
    document.getElementById('preview-imagen').style.display = 'none';
    document.getElementById('imagen-file').value = '';

    document.getElementById('modal-subir-imagen').style.display = 'flex';
}

/**
 * Cerrar modal
 */
function cerrarModalSubirImagen() {
    document.getElementById('modal-subir-imagen').style.display = 'none';
}

/**
 * Preview de imagen seleccionada
 */
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('imagen-file');

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];

            if (file) {
                // Validar tamaño (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert('El archivo es muy grande. Máximo 5MB.');
                    e.target.value = '';
                    return;
                }

                // Validar tipo
                if (!file.type.startsWith('image/')) {
                    alert('Por favor seleccione una imagen válida.');
                    e.target.value = '';
                    return;
                }

                // Preview
                const reader = new FileReader();
                reader.onload = (event) => {
                    const preview = document.getElementById('preview-imagen');
                    preview.src = event.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

/**
 * Subir imagen
 */
async function subirImagen() {
    const productoId = document.getElementById('modal-producto-id').value;
    const fileInput = document.getElementById('imagen-file');

    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Por favor seleccione una imagen');
        return;
    }

    const file = fileInput.files[0];

    // Mostrar loading
    const btnSubir = document.getElementById('btn-confirmar-subir');
    const textOriginal = btnSubir.textContent;
    btnSubir.disabled = true;
    btnSubir.textContent = '⏳ Subiendo...';

    try {
        // Convertir a base64
        const base64Data = await fileToBase64(file);

        const payload = {
            action: 'subirYAsociarImagen',
            productoId: productoId,
            fileData: {
                base64Data: base64Data,
                mimeType: file.type,
                fileName: file.name
            }
        };

        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            mostrarNotificacion('✅ Imagen subida exitosamente', 'success');
            cerrarModalSubirImagen();
            cargarProductosSinImagen();
            cargarCatalogoConImagenes();
        } else {
            mostrarNotificacion('❌ Error: ' + result.error, 'error');
        }
    } catch (e) {
        console.error('Error subiendo imagen:', e);
        mostrarNotificacion('Error de conexión', 'error');
    } finally {
        btnSubir.disabled = false;
        btnSubir.textContent = textOriginal;
    }
}

/**
 * Convertir archivo a base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Remover el prefijo "data:image/...;base64,"
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Eliminar imagen
 */
async function eliminarImagen(productoId, productoNombre) {
    if (!confirm(`¿Eliminar imagen de "${productoNombre}"?`)) {
        return;
    }

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'eliminarImagenDeProducto',
                productoId: productoId
            })
        });

        const result = await response.json();

        if (result.success) {
            mostrarNotificacion('✅ Imagen eliminada', 'success');
            cargarProductosSinImagen();
            cargarCatalogoConImagenes();
        } else {
            mostrarNotificacion('❌ Error: ' + result.message, 'error');
        }
    } catch (e) {
        console.error('Error eliminando imagen:', e);
        mostrarNotificacion('Error de conexión', 'error');
    }
}

/**
 * Mostrar notificación
 */
function mostrarNotificacion(mensaje, tipo) {
    // Usar el sistema de notificaciones existente del dashboard
    if (typeof showNotification === 'function') {
        showNotification(mensaje, tipo);
    } else {
        alert(mensaje);
    }
}
