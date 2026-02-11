/**
 * mantenimiento.js
 * Gestiona el CRUD (Editar/Borrar) para Clientes, Proveedores y Productos.
 */

// Estado del registro siendo editado
let currentEditId = null;
let currentEditType = null;

function abrirModalEditar(tipo, objeto) {
    currentEditId = objeto.id;
    currentEditType = tipo;

    // Obtener overlay y modal
    const modal = document.getElementById('modalMantenimiento');
    const form = document.getElementById('formMantenimiento');
    const titulo = document.getElementById('modalTitleMant');

    if (!modal || !form) return console.error("Modal Mantenimiento no encontrado");

    // Limpiar formulario previo
    form.innerHTML = '';
    titulo.textContent = objeto.id ? `Editar ${tipo}` : `Crear ${tipo}`;

    // Construir campos dinámicamente según el objeto
    // (Esto es simplificado, idealmente tendríamos schemas definidos)

    if (tipo === 'Cliente' || tipo === 'Proveedor') {
        crearInput(form, 'Documento (C.C. / NIT)', 'documento', objeto.documento || objeto.documento_ccnit, true); // Identificación primero
        crearInput(form, 'Nombre', 'nombre', objeto.nombre, true);
        crearInput(form, 'Teléfono', 'telefono', objeto.telefono);
        crearInput(form, 'Email', 'email', objeto.email);
        crearInput(form, 'Dirección', 'direccion', objeto.direccion);
        crearInput(form, 'Notas', 'notas', objeto.notas);
    }
    else if (tipo === 'Producto') {
        crearInput(form, 'Nombre', 'nombre', objeto.nombre, true);
        crearInput(form, 'Código', 'codigo', objeto.codigo);
        crearSelect(form, 'Categoría', 'categoria', objeto.categoria, ['Uñas', 'Pies', 'Depilación', 'Insumos', 'Venta Público']);
        crearSelect(form, 'Tipo', 'tipo', objeto.tipo, ['Inventariable', 'Servicio']);
        crearInput(form, 'Precio Compra', 'precioCompra', objeto.precioCompra, false, 'number');
        crearInput(form, 'Precio Venta', 'precioVenta', objeto.precioVenta, true, 'number');
        crearInput(form, 'Stock Actual', 'stock', objeto.stock, true, 'number'); // Solo admin debería poder
    }

    modal.style.display = 'block';
}

function crearInput(form, labelText, name, value, required = false, type = 'text') {
    const div = document.createElement('div');
    div.className = 'form-group';

    const label = document.createElement('label');
    label.textContent = labelText;

    const input = document.createElement('input');
    input.type = type;
    input.name = name;
    input.value = value || '';
    if (required) input.required = true;
    if (type === 'number') input.step = '0.01';

    div.appendChild(label);
    div.appendChild(input);
    form.appendChild(div);
}

function crearSelect(form, labelText, name, value, options) {
    const div = document.createElement('div');
    div.className = 'form-group';

    const label = document.createElement('label');
    label.textContent = labelText;

    const select = document.createElement('select');
    select.name = name;

    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        if (opt === value) option.selected = true;
        select.appendChild(option);
    });

    div.appendChild(label);
    div.appendChild(select);
    form.appendChild(div);
}

function cerrarModalMantenimiento() {
    document.getElementById('modalMantenimiento').style.display = 'none';
    currentEditId = null;
    currentEditType = null;
}

async function guardarCambiosMantenimiento() {
    const form = document.getElementById('formMantenimiento');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const datos = {};
    formData.forEach((value, key) => datos[key] = value);

    datos.id = currentEditId; // Asegurar que enviamos ID para Update

    const btn = document.getElementById('btnGuardarMant');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'registrarMantenimiento',
                tipo: currentEditType,
                datos: datos
            })
        });

        const result = await response.json();

        if (result.status === 'success' || result.success === true) {
            alert('✅ Registro actualizado correctamente.');
            cerrarModalMantenimiento();
            // Refrescar tabla correspondiente
            if (currentEditType === 'Cliente') cargarClientes(); // Asumiendo que existen estas fns en script.js
            if (currentEditType === 'Proveedor') cargarProveedores();
            if (currentEditType === 'Producto') cargarInventario();
        } else {
            alert('❌ Error: ' + result.message);
        }

    } catch (e) {
        console.error(e);
        alert('Error de red al guardar.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Guardar Cambios';
    }
}

async function eliminarRegistro(tipo, id) {
    if (!confirm(`¿Estás seguro de ELIMINAR este ${tipo}? Esta acción no se puede deshacer.`)) return;

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'eliminarMantenimiento',
                tipo: tipo,
                id: id
            })
        });

        const result = await response.json();

        if (result.status === 'success' || result.success === true) {
            alert('🗑️ Registro eliminado.');
            if (tipo === 'Cliente') cargarClientes();
            if (tipo === 'Proveedor') cargarProveedores();
            if (tipo === 'Producto') cargarInventario();
        } else {
            alert('❌ Error: ' + result.message);
        }

    } catch (e) {
        console.error(e);
        alert('Error de red al eliminar.');
    }
}
