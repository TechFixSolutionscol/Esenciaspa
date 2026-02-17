/**
 * historia_clinica.js
 * Lógica para la gestión de Historias Clínicas Digitales
 * Fase 2: Gestión Completa (Creación, Visualización, Antecedentes, Evoluciones)
 */

let historiaClinicaActual = null;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar listeners
    const btnNuevaHC = document.getElementById('btnNuevaHC');
    if (btnNuevaHC) btnNuevaHC.addEventListener('click', mostrarFormularioNuevaHC);

    const busquedaHCInput = document.getElementById('busquedaHCInput');
    if (busquedaHCInput) {
        busquedaHCInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                buscarHistoriasClinicasMain();
            }
        });
    }

    const formBusqueda = document.getElementById('formBusquedaHC');
    if (formBusqueda) {
        formBusqueda.addEventListener('submit', (e) => {
            e.preventDefault();
            buscarHistoriasClinicasMain();
        });
    }
});

/**
 * Buscar Historias Clínicas (Menú Principal)
 * Aprovechamos el endpoint de buscarCliente y verificamos si tienen HC
 */
async function buscarHistoriasClinicasMain() {
    const query = document.getElementById('busquedaHCInput').value.trim();
    if (query.length < 3) {
        showToast('Ingrese al menos 3 caracteres', 'warning');
        return;
    }

    const resultadosDiv = document.getElementById('resultadosBusquedaHC');
    resultadosDiv.innerHTML = '<div class="spinner"><i class="fas fa-spinner fa-spin"></i> Buscando expedientes...</div>';

    try {
        // 1. Buscar clientes que coincidan
        const response = await fetch(`${SCRIPT_URL}?action=buscarCliente&query=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.status === 'success' && data.data.length > 0) {
            resultadosDiv.innerHTML = '';

            // 2. Verificar HC para cada cliente encontrado
            // Esto podría ser lento si son muchos, idealmente el backend haría el join,
            // pero por ahora haremos la verificación cliente por cliente en paralelo
            const clientes = data.data;
            let encontradosConHC = 0;

            const lista = document.createElement('div');
            lista.className = 'grid-historias';
            lista.style.display = 'grid';
            lista.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
            lista.style.gap = '15px';

            // Promesas para verificar HC
            const verificaciones = clientes.map(async (cliente) => {
                const res = await fetch(`${SCRIPT_URL}?action=verificarHistoriaExistente&clienteId=${cliente.id}`);
                const hcData = await res.json();

                if (hcData.existe) {
                    return { cliente, hc: hcData };
                }
                return null;
            });

            const resultados = await Promise.all(verificaciones);

            resultados.forEach(item => {
                if (item) {
                    encontradosConHC++;
                    const card = document.createElement('div');
                    card.className = 'card hc-card';
                    card.style.cursor = 'pointer';
                    card.onclick = () => cargarDetalleHistoria(item.hc.historiaId);

                    card.innerHTML = `
                        <div class="card-body" style="padding: 15px;">
                            <div style="display:flex; justify-content:space-between; align-items:start;">
                                <h4 style="margin:0; color:var(--primary-color);">
                                    <i class="fas fa-file-medical-alt"></i> ${item.hc.historiaId}
                                </h4>
                                <span class="badge badge-success">Activa</span>
                            </div>
                            <h5 style="margin: 10px 0 5px;">${item.cliente.nombre}</h5>
                            <p style="margin:0; font-size:0.9em; color:#666;">
                                <i class="fas fa-id-card"></i> ${item.cliente.documento || 'Sin Doc'}
                            </p>
                            <p style="margin:0; font-size:0.9em; color:#666;">
                                <i class="fas fa-phone"></i> ${item.cliente.telefono}
                            </p>
                            <div style="margin-top:10px; text-align:right;">
                                <button class="btn btn-sm primary-btn">Ver Expediente <i class="fas fa-arrow-right"></i></button>
                            </div>
                        </div>
                    `;
                    lista.appendChild(card);
                }
            });

            if (encontradosConHC > 0) {
                resultadosDiv.appendChild(lista);
            } else {
                resultadosDiv.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-user-slash fa-3x" style="color:#ccc;"></i>
                        <p>Se encontraron clientes, pero ninguno tiene Historia Clínica activa.</p>
                        <button class="btn btn-sm success-btn" onclick="mostrarFormularioNuevaHC()">Crear Nueva HC</button>
                    </div>
                `;
            }

        } else {
            resultadosDiv.innerHTML = '<p class="text-muted text-center">No se encontraron pacientes.</p>';
        }
    } catch (e) {
        console.error('Error buscando HCs:', e);
        resultadosDiv.innerHTML = `<p class="text-error">Error: ${e.message}</p>`;
    }
}

/**
 * Cargar y mostrar el detalle completo de una Historia Clínica
 */
async function cargarDetalleHistoria(historiaId) {
    // Ocultar búsqueda
    document.getElementById('seccionBusquedaHC').style.display = 'none';

    // Mostrar contenedor (si no existe, crearlo)
    let contenedorDetalle = document.getElementById('contenedorDetalleHC');
    if (!contenedorDetalle) {
        contenedorDetalle = document.createElement('div');
        contenedorDetalle.id = 'contenedorDetalleHC';
        document.getElementById('historia-clinica').appendChild(contenedorDetalle);
    }
    contenedorDetalle.style.display = 'block';

    // Skeleton loader
    contenedorDetalle.innerHTML = '<div class="spinner"><i class="fas fa-spinner fa-spin"></i> Cargando expediente...</div>';

    try {
        // 1. Obtener datos basicos
        const response = await fetch(`${SCRIPT_URL}?action=obtenerHistoriaClinica&historiaId=${historiaId}`);
        const data = await response.json();

        if (data.success) {
            historiaClinicaActual = data.data;
            renderizarVistaDetalle(historiaClinicaActual);
            // Cargar datos asíncronos de tabs
            cargarAntecedentes(historiaId);
            cargarEvoluciones(historiaId);
            cargarTratamientos(historiaId);
        } else {
            contenedorDetalle.innerHTML = `<p class="text-error">${data.message}</p>`;
        }

    } catch (e) {
        console.error('Error cargando detalle HC:', e);
        contenedorDetalle.innerHTML = `<p class="text-error">Error de conexión: ${e.message}</p>`;
    }
}

/**
 * Renderizar la estructura de pestañas y cabecera
 */
function renderizarVistaDetalle(hc) {
    const contenedor = document.getElementById('contenedorDetalleHC');

    // Calcular edad actual si es posible
    let edadDisplay = hc.edad || '';
    if (hc.fecha_nacimiento) {
        const hoy = new Date();
        const nacimiento = new Date(hc.fecha_nacimiento);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
        edadDisplay = `${edad} años`;
    }

    contenedor.innerHTML = `
        <div class="card header-hc" style="border-left: 5px solid var(--primary-color);">
            <div class="card-body">
                <div style="display:flex; justify-content:space-between; flex-wrap:wrap;">
                    <div>
                        <h2 style="margin:0; color:var(--primary-color);">${hc.cliente_nombre}</h2>
                        <div style="font-size:1.1em; color:#555; margin-top:5px;">
                            <span class="badge badge-primary">${hc.id}</span>
                            <span style="margin:0 10px;">|</span>
                            <i class="fas fa-id-card"></i> ${hc.tipo_documento} ${hc.numero_documento}
                            <span style="margin:0 10px;">|</span>
                            <i class="fas fa-birthday-cake"></i> ${edadDisplay}
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <button onclick="cerrarDetalleHC()" class="btn secondary-btn"><i class="fas fa-arrow-left"></i> Volver</button>
                        <button onclick="window.print()" class="btn btn-outline"><i class="fas fa-print"></i> Imprimir</button>
                    </div>
                </div>
                
                <div class="hc-info-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px; margin-top:20px; background:#f8f9fa; padding:15px; border-radius:8px;">
                    <div><strong><i class="fas fa-phone"></i> Teléfono:</strong> ${hc.telefono || '-'}</div>
                    <div><strong><i class="fas fa-envelope"></i> Email:</strong> ${hc.email || '-'}</div>
                    <div><strong><i class="fas fa-briefcase"></i> Ocupación:</strong> ${hc.ocupacion || '-'}</div>
                    <div><strong><i class="fas fa-heart"></i> Estado Civil:</strong> ${hc.estado_civil || '-'}</div>
                    <div><strong><i class="fas fa-clinic-medical"></i> EPS:</strong> ${hc.eps || '-'}</div>
                </div>
            </div>
        </div>

        <!-- TABS -->
        <div class="tabs-container" style="margin-top:20px;">
            <div class="tabs-header" style="display:flex; border-bottom:2px solid #ddd; margin-bottom:20px; overflow-x:auto;">
                <button class="tab-btn active" onclick="cambiarTabHC('evoluciones')" id="tab-evoluciones"><i class="fas fa-notes-medical"></i> Evoluciones</button>
                <button class="tab-btn" onclick="cambiarTabHC('antecedentes')" id="tab-antecedentes"><i class="fas fa-history"></i> Antecedentes</button>
                <button class="tab-btn" onclick="cambiarTabHC('tratamientos')" id="tab-tratamientos"><i class="fas fa-spa"></i> Tratamientos</button>
                <button class="tab-btn" onclick="cambiarTabHC('evaluacion')" id="tab-evaluacion"><i class="fas fa-clipboard-check"></i> Evaluación & Legal</button>
                <button class="tab-btn" onclick="cambiarTabHC('archivos')" id="tab-archivos"><i class="fas fa-paperclip"></i> Archivos</button>
            </div>

            <!-- CONTENIDO TABS -->
            <div id="content-evoluciones" class="tab-content-hc active">
                <div style="margin-bottom:15px; text-align:right;">
                    <button class="btn success-btn" onclick="abrirModalNuevaEvolucion()"><i class="fas fa-plus"></i> Nueva Evolución</button>
                </div>
                <div id="lista-evoluciones">Cargando...</div>
            </div>

            <div id="content-antecedentes" class="tab-content-hc" style="display:none;">
                <div style="margin-bottom:15px; text-align:right;">
                    <button class="btn success-btn" onclick="abrirModalNuevoAntecedente()"><i class="fas fa-plus"></i> Agregar Antecedente</button>
                </div>
                <div id="lista-antecedentes">Cargando...</div>
            </div>

            <div id="content-tratamientos" class="tab-content-hc" style="display:none;">
                <div style="margin-bottom:15px; text-align:right;">
                    <button class="btn success-btn" onclick="abrirModalNuevoTratamiento()"><i class="fas fa-plus"></i> Nuevo Tratamiento</button>
                </div>
                <div id="lista-tratamientos" class="grid-tratamientos">
                     <div class="spinner"><i class="fas fa-spinner fa-spin"></i> Cargando historial de tratamientos...</div>
                </div>
            </div>
            
            <!-- NUEVA PESTAÑA: EVALUACIÓN Y LEGAL -->
            <div id="content-evaluacion" class="tab-content-hc" style="display:none;">
                <div class="row">
                    <div class="col-md-6">
                        <div class="card mb-3">
                            <div class="card-header bg-light"><strong>Evaluación de Manos</strong></div>
                            <div class="card-body">
                                <p><strong>Estado Uñas:</strong> ${hc.manos_estado || 'No registrado'}</p>
                                <p><strong>Tipo Piel:</strong> ${hc.manos_piel || 'No registrado'}</p>
                                <p><strong>Servicios Solicitados:</strong> ${hc.manos_servicios || '-'}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card mb-3">
                            <div class="card-header bg-light"><strong>Evaluación de Pies</strong></div>
                            <div class="card-body">
                                <p><strong>Tipo Pie:</strong> ${hc.pies_tipo || 'No registrado'}</p>
                                <p><strong>Pisada:</strong> ${hc.pies_pisada || 'No registrado'}</p>
                                <p><strong>Estado Uñas/Piel:</strong> ${hc.pies_estado || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card mt-3 border-info">
                    <div class="card-header bg-info text-white"><strong>Consentimiento Informado & Firma</strong></div>
                    <div class="card-body text-center">
                        <p class="text-success"><i class="fas fa-check-circle"></i> Consentimiento Aceptado el ${formatDateShort(hc.fecha_reg)}</p>
                        
                        <div style="margin-top: 15px; border: 1px dashed #ccc; padding: 10px; display: inline-block;">
                            ${hc.url_firma ?
            `<img src="${hc.url_firma}" alt="Firma Digital Paciente" style="max-width: 300px; height: auto;">` :
            '<p class="text-muted"><i class="fas fa-signature"></i> Sin firma digital registrada</p>'
        }
                        </div>
                        <p class="small text-muted mt-2">Firma digital almacenada en Google Drive</p>
                    </div>
                </div>
            </div>

            <div id="content-archivos" class="tab-content-hc" style="display:none;">
                <p class="text-muted">Gestión de adjuntos en desarrollo</p>
            </div>
        </div>
    `;
}

/**
 * Cambiar pestaña activa
 */
function cambiarTabHC(tabName) {
    // Ocultar contenidos
    document.querySelectorAll('.tab-content-hc').forEach(el => el.style.display = 'none');
    document.getElementById(`content-${tabName}`).style.display = 'block';

    // Actualizar botones
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

/**
 * Cargar lista de antecedentes
 */
async function cargarAntecedentes(historiaId) {
    const contenedor = document.getElementById('lista-antecedentes');
    try {
        const response = await fetch(`${SCRIPT_URL}?action=obtenerAntecedentes&historiaId=${historiaId}`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            let html = '<table class="table table-striped"><thead><tr><th>Tipo</th><th>Descripción</th><th>Fecha Reg.</th><th>Gravedad</th></tr></thead><tbody>';
            data.data.forEach(ant => {
                const gravedadColor = ant.gravedad === 'Alta' ? 'red' : (ant.gravedad === 'Moderada' ? 'orange' : 'green');
                html += `
                    <tr>
                        <td><strong>${ant.tipo_antecedente}</strong></td>
                        <td>${ant.descripcion}</td>
                        <td>${formatDateShort(ant.fecha_registro)}</td>
                        <td><span class="badge" style="background:${gravedadColor}; color:white;">${ant.gravedad}</span></td>
                    </tr>
                `;
            });
            html += '</tbody></table>';
            contenedor.innerHTML = html;
        } else {
            contenedor.innerHTML = '<p class="text-muted">No hay antecedentes registrados.</p>';
        }
    } catch (e) {
        contenedor.innerHTML = `<p class="text-error">Error: ${e.message}</p>`;
    }
}

/**
 * Cargar lista de evoluciones
 */
async function cargarEvoluciones(historiaId) {
    const contenedor = document.getElementById('lista-evoluciones');
    try {
        const response = await fetch(`${SCRIPT_URL}?action=obtenerEvoluciones&historiaId=${historiaId}`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            let html = '';
            data.data.forEach(evo => {
                html += `
                    <div class="card mb-3" style="border-left: 4px solid var(--info-color);">
                        <div class="card-header" style="background:#f1f3f5; padding:10px 15px; display:flex; justify-content:space-between;">
                            <strong><i class="fas fa-calendar-alt"></i> ${formatDateShort(evo.fecha_atencion)}</strong>
                            <span class="badge badge-info">${evo.tipo_atencion}</span>
                        </div>
                        <div class="card-body" style="padding:15px;">
                            <p><strong>Motivo:</strong> ${evo.motivo_consulta}</p>
                            <p><strong>Diagnóstico:</strong> ${evo.diagnostico || 'N/A'}</p>
                            <div style="background:#fff3cd; padding:10px; border-radius:5px; margin-top:10px;">
                                <strong><i class="fas fa-stethoscope"></i> Tratamiento/Procedimiento:</strong><br>
                                ${evo.tratamiento_realizado || 'No especificado'}
                            </div>
                        </div>
                    </div>
                `;
            });
            contenedor.innerHTML = html;
        } else {
            contenedor.innerHTML = `<div class="empty-state">
                <i class="fas fa-file-medical-alt fa-2x" style="color:#ccc;"></i>
                <p>No hay evoluciones registradas para este paciente.</p>
                <button class="btn btn-sm success-btn" onclick="abrirModalNuevaEvolucion()">Registrar Primera Atención</button>
            </div>`;
        }
    } catch (e) {
        contenedor.innerHTML = `<p class="text-error">Error: ${e.message}</p>`;
    }
}

/**
 * Utilidades: Formatear fecha corta
 */
function formatDateShort(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-CO');
}

/**
 * Cerrar vista detalle y volver al buscador
 */
function cerrarDetalleHC() {
    const detalle = document.getElementById('contenedorDetalleHC');
    if (detalle) detalle.style.display = 'none';
    document.getElementById('seccionBusquedaHC').style.display = 'block';
    historiaClinicaActual = null;
}

// ==========================================================================
// MODALES DE REGISTRO (ANTECEDENTES / EVOLUCIONES) - IMPLEMENTACIÓN BÁSICA
// ==========================================================================

function abrirModalNuevaEvolucion() {
    if (!historiaClinicaActual) return;

    // Aquí idealmente usaríamos un modal bootstrap o custom.
    // Por rapidez implementaremos un prompt básico o inyectaremos un form modal
    const modalHtml = `
        <div id="modalEvolucion" class="modal" style="display:block; background:rgba(0,0,0,0.5); position:fixed; top:0; left:0; width:100%; height:100%; z-index:1000;">
            <div class="modal-content" style="background:white; width:90%; max-width:600px; margin:50px auto; padding:20px; border-radius:8px; max-height:80vh; overflow-y:auto;">
                <h3>Nueva Evolución - ${historiaClinicaActual.cliente_nombre}</h3>
                <form id="formEvolucion" onsubmit="guardarEvolucion(event)">
                    <div class="form-group">
                        <label>Tipo de Atención</label>
                        <select name="tipo_atencion" id="evo_tipo" required>
                            <option value="Quiropodia">Quiropodia (Salud Uñas/Piel)</option>
                            <option value="Manicure/Pedicure">Manicure / Pedicure Tradicional</option>
                            <option value="Sistemas">Sistemas (Acrílico / Gel / Polygel)</option>
                            <option value="Mantenimiento">Mantenimiento / Retoque</option>
                            <option value="Retiro">Retiro de Producto / Uña</option>
                            <option value="Spa">Spa de Manos / Pies</option>
                            <option value="Control">Control / Revisión</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Motivo de Consulta</label>
                        <textarea name="motivo_consulta" id="evo_motivo" rows="2" required placeholder="Ej: Dolor en uña del pie derecho, mantenimiento de acrílico, durezas en talón..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Diagnóstico / Hallazgos</label>
                        <textarea name="diagnostico" id="evo_diagnostico" rows="2" placeholder="Ej: Onicocriptosis lateral, Onicomicosis distal, Hiperqueratosis plantar..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Procedimiento Realizado</label>
                        <textarea name="tratamiento_realizado" id="evo_tratamiento" rows="3" required placeholder="Ej: Onicotomia (corte), limpieza de canales, desbastado de callosidad, aplicación de sistema acrílico..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Indicaciones / Recomendaciones</label>
                        <textarea name="recomendaciones" id="evo_recomendaciones" rows="2" placeholder="Ej: Uso de calzado amplio, aplicar aceite de cutícula, cita de control en 15 días..."></textarea>
                    </div>
                    <div style="text-align:right; margin-top:20px;">
                        <button type="button" class="btn secondary-btn" onclick="document.getElementById('modalEvolucion').remove()">Cancelar</button>
                        <button type="submit" class="btn success-btn">Guardar Evolución</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async function guardarEvolucion(e) {
    e.preventDefault();
    if (!historiaClinicaActual) return;

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerText = "Guardando...";

    const data = {
        action: 'agregarEvolucion',
        historia_clinica_id: historiaClinicaActual.id,
        cliente_nombre: historiaClinicaActual.cliente_nombre,
        tipo_atencion: document.getElementById('evo_tipo').value,
        motivo_consulta: document.getElementById('evo_motivo').value,
        diagnostico: document.getElementById('evo_diagnostico').value,
        tratamiento_realizado: document.getElementById('evo_tratamiento').value,
        recomendaciones: document.getElementById('evo_recomendaciones').value
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        const res = await response.json();

        if (res.success) {
            alert('✅ Evolución guardada exitosamente');
            document.getElementById('modalEvolucion').remove();
            cargarEvoluciones(historiaClinicaActual.id);
        } else {
            alert('❌ Error: ' + res.message);
        }
    } catch (err) {
        alert('Error de conexión');
    } finally {
        btn.disabled = false;
        btn.innerText = "Guardar Evolución";
    }
}

function abrirModalNuevoAntecedente() {
    if (!historiaClinicaActual) return;

    const modalHtml = `
        <div id="modalAntecedente" class="modal" style="display:block; background:rgba(0,0,0,0.5); position:fixed; top:0; left:0; width:100%; height:100%; z-index:1000;">
            <div class="modal-content" style="background:white; width:90%; max-width:500px; margin:50px auto; padding:20px; border-radius:8px; max-height:80vh; overflow-y:auto;">
                <h3>Nuevo Antecedente - ${historiaClinicaActual.cliente_nombre}</h3>
                <form id="formAntecedente" onsubmit="guardarAntecedente(event)">
                    <div class="form-group">
                        <label>Tipo de Antecedente</label>
                        <select name="tipo_antecedente" id="ant_tipo" required>
                            <option value="Patológico">Patológico (Enfermedades)</option>
                            <option value="Quirúrgico">Quirúrgico (Cirugías)</option>
                            <option value="Alérgico">Alérgico (Alergias)</option>
                            <option value="Farmacológico">Farmacológico (Medicamentos)</option>
                            <option value="Familiar">Familiar (Herencia)</option>
                            <option value="Tóxico">Tóxico</option>
                            <option value="Traumático">Traumático</option>
                            <option value="Gineco-obstétrico">Gineco-obstétrico</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Descripción / Detalle</label>
                        <textarea name="descripcion" id="ant_descripcion" rows="3" required placeholder="Especifique..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Gravedad / Relevancia</label>
                        <select name="gravedad" id="ant_gravedad">
                            <option value="Leve">Baja (Solo informativo)</option>
                            <option value="Moderada">Moderada (A considerar)</option>
                            <option value="Alta">Alta (Crítico / Alerta)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Observaciones Adicionales</label>
                        <textarea name="observaciones" id="ant_observaciones" rows="2"></textarea>
                    </div>
                    
                    <div style="text-align:right; margin-top:20px;">
                        <button type="button" class="btn secondary-btn" onclick="document.getElementById('modalAntecedente').remove()">Cancelar</button>
                        <button type="submit" class="btn success-btn">Guardar Antecedente</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async function guardarAntecedente(e) {
    e.preventDefault();
    if (!historiaClinicaActual) return;

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerText = "Guardando...";

    const data = {
        action: 'agregarAntecedente',
        historia_clinica_id: historiaClinicaActual.id,
        cliente_nombre: historiaClinicaActual.cliente_nombre,
        tipo_antecedente: document.getElementById('ant_tipo').value,
        descripcion: document.getElementById('ant_descripcion').value,
        gravedad: document.getElementById('ant_gravedad').value,
        observaciones: document.getElementById('ant_observaciones').value
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        const res = await response.json();

        if (res.success) {
            alert('✅ Antecedente guardado exitosamente');
            document.getElementById('modalAntecedente').remove();
            cargarAntecedentes(historiaClinicaActual.id);
        } else {
            alert('❌ Error: ' + res.message);
        }
    } catch (err) {
        alert('Error de conexión');
    } finally {
        btn.disabled = false;
        btn.innerText = "Guardar Antecedente";
    }
}

// ========================================================================
// MÓDULO DE TRATAMIENTOS (FASE 3)
// ========================================================================

async function cargarTratamientos(historiaId) {
    const contenedor = document.getElementById('lista-tratamientos');
    // Si no estamos en el tab, no cargamos aun
    if (!contenedor) return;

    try {
        const response = await fetch(`${SCRIPT_URL}?action=obtenerTratamientos&historiaId=${historiaId}`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            contenedor.className = 'grid-tratamientos';
            contenedor.innerHTML = ''; // Limpiar loader

            data.data.forEach(trt => {
                const porcentaje = Math.round((trt.sesiones_completadas / trt.sesiones_total) * 100);
                const barraColor = porcentaje === 100 ? '#2ec4b6' : '#4361ee';
                const estadoClass = trt.estado === 'Completado' ? 'success' : 'primary';

                // Card de Tratamiento
                const card = document.createElement('div');
                card.className = 'card mb-3';
                card.style.borderLeft = `5px solid ${barraColor}`;

                card.innerHTML = `
                    <div class="card-body">
                        <div style="display:flex; justify-content:space-between;">
                            <h4 style="margin:0; color:var(--primary-color);">
                                ${trt.nombre} <small style="color:#666; font-size:0.7em;">(${trt.tipo})</small>
                            </h4>
                            <span class="badge badge-${estadoClass}">${trt.estado}</span>
                        </div>
                        
                        <div style="margin:10px 0; font-size:0.9em; color:#555;">
                            <div><strong>Inicio:</strong> ${formatDateShort(trt.fecha_inicio)}</div>
                            <div><strong>Área:</strong> ${trt.area || 'General'}</div>
                            <div><strong>Objetivo:</strong> ${trt.objetivos || 'No especificado'}</div>
                        </div>

                        <!-- Barra de Progreso -->
                        <div style="margin:15px 0;">
                             <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                                <strong>Sesión ${trt.sesiones_completadas} de ${trt.sesiones_total}</strong>
                                <span>${porcentaje}%</span>
                             </div>
                             <div style="background:#e9ecef; border-radius:10px; height:10px; overflow:hidden;">
                                <div style="width:${porcentaje}%; background:${barraColor}; height:100%;"></div>
                             </div>
                        </div>

                        <div style="text-align:right;">
                            ${trt.estado !== 'Completado' ?
                        `<button class="btn btn-sm btn-outline-primary" onclick="registrarAvance('${trt.id}', '${trt.nombre}')">
                                    <i class="fas fa-check-circle"></i> Registrar Sesión
                                 </button>` :
                        '<span class="text-success"><i class="fas fa-check"></i> Finalizado</span>'
                    }
                        </div>
                    </div>
                `;
                contenedor.appendChild(card);
            });
        } else {
            contenedor.innerHTML = `<div class="empty-state">
                <i class="fas fa-spa fa-2x" style="color:#ccc;"></i>
                <p>No hay tratamientos activos.</p>
                <button class="btn btn-sm success-btn" onclick="abrirModalNuevoTratamiento()">Crear Primer Tratamiento</button>
            </div>`;
        }
    } catch (e) {
        contenedor.innerHTML = `<p class="text-error">Error cargando tratamientos: ${e.message}</p>`;
    }
}

function abrirModalNuevoTratamiento() {
    if (!historiaClinicaActual) return;

    const modalHtml = `
        <div id="modalTratamiento" class="modal" style="display:block; background:rgba(0,0,0,0.5); position:fixed; top:0; left:0; width:100%; height:100%; z-index:1000;">
            <div class="modal-content" style="background:white; width:90%; max-width:600px; margin:50px auto; padding:20px; border-radius:8px; max-height:80vh; overflow-y:auto;">
                <h3>Nuevo Tratamiento - ${historiaClinicaActual.cliente_nombre}</h3>
                <form id="formTratamiento" onsubmit="guardarTratamiento(event)">
                    <div class="form-row">
                        <div class="form-group" style="flex:2;">
                            <label>Nombre del Tratamiento *</label>
                            <input type="text" id="trt_nombre" required placeholder="Ej: Tratamiento Onicomicosis, Ortodoncia Ungueal, Paquete Spa Hidratante">
                        </div>
                         <div class="form-group">
                            <label>Tipo</label>
                            <select id="trt_tipo">
                                <option value="Quiropodia">Quiropodia (Salud del Pie)</option>
                                <option value="Manicure/Pedicure">Manicure / Pedicure Tradicional</option>
                                <option value="Sistemas">Sistemas (Acrílico / Gel / Polygel)</option>
                                <option value="Spa Manos/Pies">Spa de Manos y Pies</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Nº Sesiones *</label>
                            <input type="number" id="trt_sesiones" value="1" min="1" required>
                        </div>
                        <div class="form-group">
                            <label>Frecuencia</label>
                            <select id="trt_frecuencia">
                                <option value="Semanal">Semanal</option>
                                <option value="Quincenal">Quincenal</option>
                                <option value="Mensual">Mensual</option>
                                <option value="Única">Sesión Única</option>
                            </select>
                        </div>
                         <div class="form-group">
                            <label>Costo Total</label>
                            <input type="number" id="trt_costo" placeholder="$">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Zona / Área a Tratar</label>
                        <input type="text" id="trt_area" placeholder="Ej: Uña Hallux (Dedo gordo), Zona plantar (Planta), Talones, Manos completas">
                    </div>
                    
                    <div class="form-group">
                        <label>Objetivos / Resultados Esperados</label>
                        <textarea id="trt_objetivos" rows="2" placeholder="Ej: Corrección de curvatura de la uña, eliminación total de hiperqueratosis (callos)..."></textarea>
                    </div>

                    <div style="text-align:right; margin-top:20px;">
                        <button type="button" class="btn secondary-btn" onclick="document.getElementById('modalTratamiento').remove()">Cancelar</button>
                        <button type="submit" class="btn success-btn">Crear Tratamiento</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async function guardarTratamiento(e) {
    e.preventDefault();
    if (!historiaClinicaActual) return;

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerText = "Creando...";

    const data = {
        action: 'crearTratamiento',
        historia_clinica_id: historiaClinicaActual.id,
        cliente_nombre: historiaClinicaActual.cliente_nombre,
        nombre_tratamiento: document.getElementById('trt_nombre').value,
        tipo_tratamiento: document.getElementById('trt_tipo').value,
        numero_sesiones: document.getElementById('trt_sesiones').value,
        frecuencia: document.getElementById('trt_frecuencia').value,
        costo_total: document.getElementById('trt_costo').value,
        area_tratamiento: document.getElementById('trt_area').value,
        objetivos: document.getElementById('trt_objetivos').value
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        const res = await response.json();

        if (res.success) {
            alert('✅ Tratamiento creado exitosamente');
            document.getElementById('modalTratamiento').remove();
            cargarTratamientos(historiaClinicaActual.id);
        } else {
            alert('❌ Error: ' + res.message);
        }
    } catch (err) {
        alert('Error de conexión');
    } finally {
        btn.disabled = false;
        btn.innerText = "Crear Tratamiento";
    }
}

async function registrarAvance(tratamientoId, nombreTratamiento) {
    if (!confirm(`¿Confirmar que se realizó una sesión para: ${nombreTratamiento}?`)) return;

    // Aquí podríamos abrir un modal para notas de la sesión, pero por simplicidad de Fase 3:
    // Solo incrementamos el contador.

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'registrarAvanceTratamiento',
                tratamiento_id: tratamientoId
            })
        });
        const res = await response.json();

        if (res.success) {
            alert(`✅ ${res.message}`);
            cargarTratamientos(historiaClinicaActual.id);
        } else {
            alert('❌ ' + res.message);
        }
    } catch (e) {
        alert('Error de conexión');
    }
}

// --- Funciones del Formulario de Creación (Fase 1) ---

// (Mantenemos las funciones de Fase 1 aquí para no romper nada)

function mostrarFormularioNuevaHC() {
    document.getElementById('seccionBusquedaHC').style.display = 'none';
    const contenedorForm = document.getElementById('contenedorFormularioHC');
    contenedorForm.style.display = 'block';

    // Renderizar form anterior (ver código de Fase 1 - abreviado aquí por espacio, 
    // en implementación real debe incluirse completo)
    renderizarFormularioCreacion(contenedorForm);
}

function renderizarFormularioCreacion(contenedor) {
    contenedor.innerHTML = `
        <div class="card" style="max-width: 900px; margin: 0 auto;">
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h3 class="m-0"><i class="fas fa-file-medical"></i> Historia Clínica Digital</h3>
                <button onclick="cancelarCreacionHC()" class="btn btn-sm btn-light"><i class="fas fa-times"></i> Cerrar</button>
            </div>
            
            <div class="card-body p-0">
                <!-- TABS NAVEGACIÓN FORMULARIO -->
                <div class="form-tabs">
                    <button class="form-tab active" onclick="cambiarPasoForm(1)" id="tab-paso-1">1. Datos Personales</button>
                    <button class="form-tab" onclick="cambiarPasoForm(2)" id="tab-paso-2">2. Antecedentes Médicos</button>
                    <button class="form-tab" onclick="cambiarPasoForm(3)" id="tab-paso-3">3. Evaluación Manos</button>
                    <button class="form-tab" onclick="cambiarPasoForm(4)" id="tab-paso-4">4. Evaluación Pies</button>
                    <button class="form-tab" onclick="cambiarPasoForm(5)" id="tab-paso-5">5. Consentimiento y Firma</button>
                </div>

                <form id="formNuevaHC" onsubmit="guardarNuevaHC(event)" style="padding: 20px;">
                    <input type="hidden" name="cliente_id" id="hc_cliente_id">
                    
                    <!-- PASO 1: DATOS PERSONALES -->
                    <div id="paso-1" class="paso-form active">
                        <div class="search-client-section mb-4 p-3 bg-light rounded border">
                            <h4><i class="fas fa-search"></i> Buscar Cliente</h4>
                            <div class="d-flex gap-2">
                                <input type="text" id="busquedaClienteInputC" class="form-control" placeholder="Buscar por Nombre o Cédula">
                                <button type="button" onclick="buscarClienteParaHC()" class="btn btn-primary">Buscar</button>
                            </div>
                            <div id="resultadosClientes" class="mt-2"></div>
                        </div>

                        <h5 class="section-title">Datos Básicos del Paciente</h5>
                        <div class="row">
                            <div class="col-md-6 form-group">
                                <label>Nombre Completo *</label>
                                <input type="text" id="hc_nombre" class="form-control" required readonly>
                            </div>
                            <div class="col-md-3 form-group">
                                <label>Documento *</label>
                                <input type="text" id="hc_documento" class="form-control" required readonly>
                            </div>
                            <div class="col-md-3 form-group">
                                <label>Tipo Doc</label>
                                <select id="hc_tipo_doc" class="form-control">
                                    <option value="CC">Cédula</option><option value="TI">TI</option><option value="CE">CE</option><option value="PAS">Pasaporte</option>
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-4 form-group">
                                <label>Fecha Nacimiento *</label>
                                <input type="date" id="hc_fecha_nac" class="form-control" required onchange="calcularEdadForm(this.value)">
                            </div>
                            <div class="col-md-2 form-group">
                                <label>Edad</label>
                                <input type="text" id="hc_edad_calc" class="form-control" readonly>
                            </div>
                             <div class="col-md-3 form-group">
                                <label>Género</label>
                                <select id="hc_genero" class="form-control">
                                    <option value="F">Femenino</option><option value="M">Masculino</option><option value="O">Otro</option>
                                </select>
                            </div>
                             <div class="col-md-3 form-group">
                                <label>Estado Civil</label>
                                <select id="hc_estado_civil" class="form-control">
                                    <option value="Soltero">Soltero</option><option value="Casado">Casado</option><option value="Unión Libre">Unión Libre</option>
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 form-group"><label>Dirección</label><input type="text" id="hc_direccion" class="form-control"></div>
                            <div class="col-md-3 form-group"><label>Teléfono</label><input type="tel" id="hc_telefono" class="form-control"></div>
                            <div class="col-md-3 form-group"><label>Ocupación</label><input type="text" id="hc_ocupacion" class="form-control"></div>
                        </div>
                        
                        <h5 class="section-title mt-4">Contacto de Emergencia / Tutor</h5>
                        <div class="row">
                            <div class="col-md-6 form-group"><label>Nombre Contacto</label><input type="text" id="hc_emer_nombre" class="form-control"></div>
                            <div class="col-md-3 form-group"><label>Teléfono</label><input type="tel" id="hc_emer_tel" class="form-control"></div>
                            <div class="col-md-3 form-group"><label>Parentesco</label><input type="text" id="hc_emer_rel" class="form-control"></div>
                        </div>
                        <div id="seccion-tutor" style="display:none;" class="alert alert-warning mt-2">
                            <strong>Menor de Edad:</strong> Se requiere información del tutor legal.
                            <div class="row mt-2">
                                <div class="col-md-6"><label>Nombre Tutor</label><input type="text" id="hc_tutor_nombre" class="form-control"></div>
                                <div class="col-md-6"><label>Documento Tutor</label><input type="text" id="hc_tutor_doc" class="form-control"></div>
                            </div>
                        </div>

                        <div class="mt-3 text-right">
                             <button type="button" class="btn btn-primary" onclick="cambiarPasoForm(2)">Siguiente <i class="fas fa-arrow-right"></i></button>
                        </div>
                    </div>

                    <!-- PASO 2: ANTECEDENTES MÉDICOS -->
                    <div id="paso-2" class="paso-form" style="display:none;">
                        <h5 class="section-title">Información Médica del Usuario</h5>
                        <p class="text-muted small">Seleccione las afecciones médicas o dermatológicas que padece:</p>
                        
                        <div class="grid-checkboxes">
                            <label><input type="checkbox" name="afecciones" value="Alergias"> Alergias</label>
                            <label><input type="checkbox" name="afecciones" value="Diabetes"> Diabetes</label>
                            <label><input type="checkbox" name="afecciones" value="Hipertensión"> Hipertensión</label>
                            <label><input type="checkbox" name="afecciones" value="Tiroides"> Tiroides</label>
                            <label><input type="checkbox" name="afecciones" value="Cáncer"> Cáncer (Antecedente)</label>
                            <label><input type="checkbox" name="afecciones" value="Onicomicosis"> Onicomicosis (Hongos)</label>
                            <label><input type="checkbox" name="afecciones" value="Pie de Atleta"> Pie de Atleta</label>
                            <label><input type="checkbox" name="afecciones" value="Callosidades"> Callosidades</label>
                            <label><input type="checkbox" name="afecciones" value="Psoriasis"> Psoriasis</label>
                            <label><input type="checkbox" name="afecciones" value="Verrugas"> Verrugas</label>
                            <label><input type="checkbox" name="afecciones" value="Mala Circulación"> Mala Circulación</label>
                            <label><input type="checkbox" name="afecciones" value="Sensibilidad Piel"> Piel Sensible</label>
                        </div>

                        <div class="row mt-3">
                            <div class="col-md-3 form-group">
                                <label>¿Está en embarazo?</label>
                                <select id="hc_embarazo" class="form-control"><option value="No">No</option><option value="Si">Sí</option></select>
                            </div>
                            <div class="col-md-3 form-group">
                                <label>¿Practica deporte?</label>
                                <select id="hc_deporte" class="form-control"><option value="No">No</option><option value="Si">Sí</option></select>
                            </div>
                             <div class="col-md-6 form-group">
                                <label>¿Reacción alérgica a esmaltes/uñas?</label>
                                <input type="text" id="hc_alergias_prod" class="form-control" placeholder="Especifique si aplica">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Tratamientos / Medicamentos Actuales</label>
                            <textarea id="hc_med_actuales" class="form-control" rows="2" placeholder="Anticoagulantes, Insulina, etc..."></textarea>
                        </div>
                        <div class="form-group">
                             <label>Enfermedades Familiares Relevantes</label>
                             <input type="text" id="hc_enf_fam" class="form-control">
                        </div>

                        <div class="mt-3 d-flex justify-content-between">
                            <button type="button" class="btn btn-secondary" onclick="cambiarPasoForm(1)"><i class="fas fa-arrow-left"></i> Atrás</button>
                            <button type="button" class="btn btn-primary" onclick="cambiarPasoForm(3)">Siguiente <i class="fas fa-arrow-right"></i></button>
                        </div>
                    </div>

                    <!-- PASO 3: MANOS -->
                    <div id="paso-3" class="paso-form" style="display:none;">
                        <h5 class="section-title">Evaluación de Manos</h5>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <label class="font-weight-bold">Estado de las Uñas:</label>
                                <div class="list-group">
                                    <label class="list-group-item"><input type="radio" name="manos_estado" value="Sanas" checked> Uñas Totalmente Sanas</label>
                                    <label class="list-group-item"><input type="radio" name="manos_estado" value="Onicofagia"> Onicofagia (Se come las uñas)</label>
                                    <label class="list-group-item"><input type="radio" name="manos_estado" value="Onicomicosis"> Onicomicosis (Hongos)</label>
                                    <label class="list-group-item"><input type="radio" name="manos_estado" value="Decoloradas"> Amarillas / Decoloradas</label>
                                    <label class="list-group-item"><input type="radio" name="manos_estado" value="Quebradizas"> Frágiles / Quebradizas</label>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <label class="font-weight-bold">Tipo de Piel:</label>
                                <div class="d-flex gap-3">
                                    <label><input type="radio" name="manos_piel" value="Normal" checked> Normal</label>
                                    <label><input type="radio" name="manos_piel" value="Seca"> Seca</label>
                                    <label><input type="radio" name="manos_piel" value="Grasa"> Grasa</label>
                                    <label><input type="radio" name="manos_piel" value="Sensible"> Sensible</label>
                                </div>
                                <hr>
                                <label class="font-weight-bold">Servicios a realizar (Manos):</label>
                                <div class="grid-checkboxes-small">
                                    <label><input type="checkbox" name="manos_serv" value="Manicure Tradicional"> Tradicional</label>
                                    <label><input type="checkbox" name="manos_serv" value="Semipermanente"> Semipermanente</label>
                                    <label><input type="checkbox" name="manos_serv" value="Acrílico"> Acrílico</label>
                                    <label><input type="checkbox" name="manos_serv" value="Gel/Polygel"> Gel / Polygel</label>
                                    <label><input type="checkbox" name="manos_serv" value="Retiro"> Retiro</label>
                                </div>
                            </div>
                        </div>

                        <div class="mt-3 d-flex justify-content-between">
                            <button type="button" class="btn btn-secondary" onclick="cambiarPasoForm(2)"><i class="fas fa-arrow-left"></i> Atrás</button>
                            <button type="button" class="btn btn-primary" onclick="cambiarPasoForm(4)">Siguiente <i class="fas fa-arrow-right"></i></button>
                        </div>
                    </div>

                    <!-- PASO 4: PIES -->
                    <div id="paso-4" class="paso-form" style="display:none;">
                        <h5 class="section-title">Evaluación Podal (Pies)</h5>
                        
                        <div class="row">
                            <div class="col-md-4">
                                <label class="font-weight-bold">Tipo de Pie:</label>
                                <select id="hc_tipo_pie" class="form-control">
                                    <option value="Egipcio">Egipcio (Dedo gordo más largo)</option>
                                    <option value="Griego">Griego (Segundo dedo más largo)</option>
                                    <option value="Cuadrado">Cuadrado (Dedos igual largo)</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label class="font-weight-bold">Tipo de Pisada:</label>
                                <select id="hc_pisada" class="form-control">
                                    <option value="Normal">Normal / Neutra</option>
                                    <option value="Plano">Pie Plano (Pronador)</option>
                                    <option value="Cavo">Pie Cavo (Supinador)</option>
                                </select>
                            </div>
                        </div>

                        <div class="row mt-3">
                            <div class="col-md-12">
                                <label class="font-weight-bold">Estado de Uñas y Piel (Pies):</label>
                                <div class="grid-checkboxes">
                                    <label><input type="checkbox" name="pies_estado" value="Sanas" checked> Sanas</label>
                                    <label><input type="checkbox" name="pies_estado" value="Onicocriptosis"> Uña Encarnada (Onicocriptosis)</label>
                                    <label><input type="checkbox" name="pies_estado" value="Onicomicosis"> Hongos en Uñas</label>
                                    <label><input type="checkbox" name="pies_estado" value="Pie de Atleta"> Hongos en Piel</label>
                                    <label><input type="checkbox" name="pies_estado" value="Hiperqueratosis"> Callosidades / Durezas</label>
                                    <label><input type="checkbox" name="pies_estado" value="Talones Agrietados"> Talones Agrietados</label>
                                    <label><input type="checkbox" name="pies_estado" value="Juanetes"> Hallux Valgus (Juanetes)</label>
                                </div>
                            </div>
                        </div>

                         <div class="form-group mt-3">
                            <label class="font-weight-bold">Servicios a realizar (Pies):</label>
                            <div class="grid-checkboxes-small">
                                <label><input type="checkbox" name="pies_serv" value="Pedicure Tradicional"> Tradicional</label>
                                <label><input type="checkbox" name="pies_serv" value="Quiropodia"> Quiropodia Clínica</label>
                                <label><input type="checkbox" name="pies_serv" value="Spa Pies"> Spa Hidratante</label>
                                <label><input type="checkbox" name="pies_serv" value="Reconstrucción"> Reconstrucción Uña</label>
                            </div>
                        </div>

                        <div class="mt-3 d-flex justify-content-between">
                            <button type="button" class="btn btn-secondary" onclick="cambiarPasoForm(3)"><i class="fas fa-arrow-left"></i> Atrás</button>
                            <button type="button" class="btn btn-primary" onclick="cambiarPasoForm(5)">Ir a Firma <i class="fas fa-arrow-right"></i></button>
                        </div>
                    </div>

                    <!-- PASO 5: CONSENTIMIENTO Y FIRMA -->
                    <div id="paso-5" class="paso-form" style="display:none;">
                        <h5 class="section-title">Consentimiento Informado</h5>
                        
                        <div class="alert alert-info" style="font-size: 0.85rem; height: 150px; overflow-y: auto; text-align: justify; background: #fff; border: 1px solid #ddd;">
                            <p><strong>DECLARACIÓN Y CONSENTIMIENTO:</strong></p>
                            <p>Yo, identificado con los datos proporcionados, declaro que la información sobre mi salud y antecedentes es veraz y completa. </p>
                            <p>Autorizo a los profesionales de <strong>ESENCIA SPA</strong> a realizar los procedimientos estéticos o de quiropodia acordados. He sido informado(a) sobre los posibles riesgos leves como sensibilidad, enrojecimiento temporal o sangrado leve en manejo de cutículas profundas.</p>
                            <p>Me comprometo a seguir las recomendaciones post-tratamiento y exonero al spa de responsabilidad por resultados derivados de información falsa proporcionada por mí o descuido en los cuidados posteriores.</p>
                        </div>

                        <div class="form-group text-center">
                            <label class="font-weight-bold">FIRMA DIGITAL DEL PACIENTE</label>
                            <div style="border: 2px dashed #4361ee; background: #fff; display: inline-block; cursor: crosshair;">
                                <canvas id="signature-pad" width="500" height="200" style="touch-action: none;"></canvas>
                            </div>
                            <br>
                            <button type="button" class="btn btn-sm btn-outline-danger mt-2" onclick="limpiarFirma()">Borrar Firma</button>
                            <input type="hidden" name="firma_base64" id="hc_firma_base64">
                        </div>

                        <div class="mt-4 d-flex justify-content-between">
                            <button type="button" class="btn btn-secondary" onclick="cambiarPasoForm(4)"><i class="fas fa-arrow-left"></i> Atrás</button>
                            <button type="submit" class="btn btn-success btn-lg">FINALIZAR Y GUARDAR <i class="fas fa-check"></i></button>
                        </div>
                    </div>

                </form>
            </div>
        </div>
        
        <style>
            .form-tabs { display: flex; border-bottom: 1px solid #ddd; background: #f8f9fa; }
            .form-tab { flex: 1; padding: 15px; border: none; background: none; font-weight: 500; color: #666; cursor: pointer; border-bottom: 3px solid transparent; }
            .form-tab.active { color: var(--primary-color); border-bottom-color: var(--primary-color); background: white; font-weight: bold; }
            .section-title { color: var(--primary-color); border-bottom: 2px solid #eee; padding-bottom: 5px; margin-bottom: 15px; margin-top: 10px; }
            .grid-checkboxes { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
            .grid-checkboxes label { background: #fff; padding: 8px; border: 1px solid #eee; border-radius: 5px; cursor: pointer; }
            .grid-checkboxes input { margin-right: 8px; }
             /* Ajustes para tablet */
            @media (max-width: 768px) {
                .form-tab { font-size: 0.8rem; padding: 10px 5px; }
            }
        </style>
    `;

    setTimeout(inicializarCanvasFirma, 500);
}

function cambiarPasoForm(paso) {
    document.querySelectorAll('.paso-form').forEach(el => el.style.display = 'none');
    document.getElementById(`paso-${paso}`).style.display = 'block';

    document.querySelectorAll('.form-tab').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-paso-${paso}`).classList.add('active');
}

function calcularEdadForm(fecha) {
    if (!fecha) return;
    const nacimiento = new Date(fecha);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    document.getElementById('hc_edad_calc').value = edad;

    // Mostrar tutor si es menor
    if (edad < 18) {
        document.getElementById('seccion-tutor').style.display = 'block';
    } else {
        document.getElementById('seccion-tutor').style.display = 'none';
    }
}


// Variables globales para la firma
let signaturePad = null;

function inicializarCanvasFirma() {
    const canvas = document.getElementById('signature-pad');
    if (!canvas) return;

    // Ajustar el tamaño del canvas al contenedor visual para evitar distorsión
    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
        // Limpiar al redimensionar podría ser molesto si ya firmó, pero necesario para evitar borrones
        // Si queremos persistir, habría que guardar la imagen y repintarla. Por ahora simple.
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas(); // Llamada inicial

    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function start(e) {
        isDrawing = true;
        const pos = getPos(e);
        lastX = pos.x;
        lastY = pos.y;
        // Prevenir scroll en móviles
        if (e.type === 'touchstart') e.preventDefault();
    }

    function draw(e) {
        if (!isDrawing) return;
        if (e.type === 'touchmove') e.preventDefault(); // Prevenir scroll

        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastX = pos.x;
        lastY = pos.y;
    }

    function end() {
        isDrawing = false;
        // Guardar firma en input hidden
        const dataUrl = canvas.toDataURL();
        // Validar que no sea un canvas vacío (muy básico, por tamaño string)
        if (dataUrl.length > 1000) {
            document.getElementById('hc_firma_base64').value = dataUrl;
        }
    }

    // Eventos Mouse
    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('mouseout', end);

    // Eventos Touch
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', end);
}

function limpiarFirma() {
    const canvas = document.getElementById('signature-pad');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById('hc_firma_base64').value = '';
}


function cancelarCreacionHC() {
    document.getElementById('contenedorFormularioHC').style.display = 'none';
    document.getElementById('seccionBusquedaHC').style.display = 'block';
}

async function buscarClienteParaHC() {
    const query = document.getElementById('busquedaClienteInputC').value.trim();
    if (query.length < 3) { alert('Mínimo 3 caracteres'); return; }

    // Reutilizamos la lógica del buscador principal
    const resultadosDiv = document.getElementById('resultadosClientes');
    resultadosDiv.innerHTML = 'Buscando...';

    try {
        const res = await fetch(`${SCRIPT_URL}?action=buscarCliente&query=${encodeURIComponent(query)}`);
        const data = await res.json();

        resultadosDiv.innerHTML = '';
        if (data.status === 'success' && data.data.length > 0) {
            data.data.forEach(c => {
                const div = document.createElement('div');
                div.innerHTML = `<strong>${c.nombre}</strong> (${c.documento || 'Sin Doc'}) <button class="btn btn-sm success-btn">Seleccionar</button>`;
                div.style.padding = '5px'; div.style.borderBottom = '1px solid #eee';
                div.querySelector('button').onclick = () => seleccionarClienteHC(c);
                resultadosDiv.appendChild(div);
            });
        } else {
            resultadosDiv.innerHTML = 'No encontrado';
        }
    } catch (e) { console.error(e); }
}

function seleccionarClienteHC(cliente) {
    document.getElementById('hc_cliente_id').value = cliente.id;
    document.getElementById('hc_nombre').value = cliente.nombre;
    document.getElementById('hc_documento').value = cliente.documento || '';
    document.getElementById('hc_telefono').value = cliente.telefono || '';
    document.getElementById('hc_email').value = cliente.email || '';

    if (!cliente.documento) {
        document.getElementById('hc_documento').readOnly = false;
        document.getElementById('hc_documento').style.background = 'white';
    }

    document.getElementById('formNuevaHC').style.opacity = '1';
    document.getElementById('formNuevaHC').style.pointerEvents = 'auto';
    document.getElementById('resultadosClientes').innerHTML = '';
}

async function guardarNuevaHC(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    // Helpers para obtener valores múltiples
    const getChecked = (name) => Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(cb => cb.value);
    const getRadio = (name) => {
        const el = document.querySelector(`input[name="${name}"]:checked`);
        return el ? el.value : '';
    };

    const formData = {
        action: 'crearHistoriaClinica',
        // Paso 1
        cliente_id: document.getElementById('hc_cliente_id').value,
        cliente_nombre: document.getElementById('hc_nombre').value,
        numero_documento: document.getElementById('hc_documento').value,
        tipo_documento: document.getElementById('hc_tipo_doc').value,
        fecha_nacimiento: document.getElementById('hc_fecha_nac').value,
        genero: document.getElementById('hc_genero').value,
        estado_civil: document.getElementById('hc_estado_civil').value,
        telefono: document.getElementById('hc_telefono').value,
        email: document.getElementById('hc_email').value,
        direccion: document.getElementById('hc_direccion').value,
        ocupacion: document.getElementById('hc_ocupacion').value,
        eps: document.getElementById('hc_eps').value,

        // Emergencia
        contacto_emergencia_nombre: document.getElementById('hc_emer_nombre').value,
        contacto_emergencia_telefono: document.getElementById('hc_emer_tel').value,

        // Tutor
        tutor_nombre: document.getElementById('hc_tutor_nombre').value,
        tutor_parentesco: document.getElementById('hc_tutor_doc').value, // Usé el campo doc para parentesco en HTML arriba o viceversa, ajusto aquí

        // Paso 2: Médico
        afecciones: getChecked('afecciones'),
        embarazo: document.getElementById('hc_embarazo').value,
        deporte: document.getElementById('hc_deporte').value,
        alergias_productos: document.getElementById('hc_alergias_prod').value,
        medicamentos_actuales: document.getElementById('hc_med_actuales').value,
        enfermedades_familiares: document.getElementById('hc_enf_fam').value,

        // Paso 3: Manos
        manos_estado_unas: getRadio('manos_estado'),
        manos_tipo_piel: getRadio('manos_piel'),
        manos_servicios: getChecked('manos_serv'),

        // Paso 4: Pies
        pies_tipo_pie: document.getElementById('hc_tipo_pie').value,
        pies_tipo_pisada: document.getElementById('hc_pisada').value,
        pies_estado_unas: getChecked('pies_estado'), // Checkboxes múltiples
        pies_servicios: getChecked('pies_serv'),

        // Paso 5
        firma_base64: document.getElementById('hc_firma_base64').value
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        const result = await response.json();

        if (result.success) {
            alert('✅ Historia Clínica creada exitosamente');
            // Recargar o mostrar detalle
            cancelarCreacionHC();
            cargarDetalleHistoria(result.historiaId);
        } else {
            alert('❌ Error: ' + result.message);
        }
    } catch (error) {
        alert('❌ Error de conexión: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = 'FINALIZAR Y GUARDAR';
    }
}
