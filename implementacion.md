FASE 0 – Preparación y base técnica (obligatoria)

Objetivo: dejar el sistema listo para integraciones sin tocar lógica de negocio.

Alcance

Activar Google Calendar API (servicio avanzado v3).

Definir calendarios (1 principal o 1 por manicurista).

Definir carpeta base en Google Drive para imágenes.

Definir hojas base nuevas:

Citas

Cotizaciones

Validar permisos OAuth.

Resultado esperado

El proyecto Apps Script tiene acceso a:

Calendar

Drive

No hay cambios visibles para usuarios finales.

FASE 1 – Sistema de citas (Web → Calendar → ERP)

Objetivo: registrar citas reales con validación de horario.

Alcance

Crear endpoint doPost para recibir citas desde la web.

Validar disponibilidad en Google Calendar.

Crear evento con:

Fecha

Hora

Duración

Invitado (correo del cliente)

Registrar la cita en la hoja Citas.

Datos mínimos

Cliente (nombre, teléfono, email)

Servicio

Fecha y hora

ID evento Calendar

Resultado esperado

No hay doble reserva.

El cliente recibe correo.

El ERP ve la cita registrada.

FASE 2 – Clientes y CRM básico

Objetivo: consolidar información del cliente.

Alcance

Buscar cliente por teléfono/email.

Crear cliente si no existe.

Agregar campos:

Fecha de cumpleaños

Observaciones

Enlazar:

Cliente ↔ Citas

Cliente ↔ Historial

Resultado esperado

Un cliente tiene historial real.

Datos no se duplican.

Base para fidelización futura.

FASE 3 – Cotización automática al crear cita

Objetivo: formalizar el ingreso sin facturar aún.

Alcance

Al crear la cita:

Crear cotización automática.

Cotización debe:

Asociarse a la cita

Asociarse al cliente

Tener estado Cotizada

Permitir modificar la cotización desde el ERP.

Resultado esperado

Toda cita tiene respaldo comercial.

Nada se vende sin atención real.

FASE 4 – Conversión Cotización → Venta

Objetivo: cierre correcto del servicio.

Alcance

Botón “Finalizar servicio” en el ERP.

Al presionar:

Cambiar estado de la cita a Atendida.

Convertir cotización en venta.

Registrar venta en historial.

Registrar método de pago (manual).

Resultado esperado

Flujo controlado.

Historial limpio.

Métricas confiables.

FASE 5 – Panel administrativo de productos y servicios

Objetivo: control real del catálogo.

Alcance

Panel interno para:

Crear productos

Editar productos

Asignar precio y categoría

Servicios:

Usados en citas

Usados en cotizaciones

Relación productos ↔ servicios (opcional).

Resultado esperado

Catálogo editable.

No tocar código para cambios simples.

FASE 6 – Imágenes en Google Drive

Objetivo: profesionalizar el contenido.

Alcance

Subida de imágenes desde panel.

Guardado en carpeta Drive.

Registro:

fileId

URL pública

Reemplazo de imágenes existentes.

Resultado esperado

Imágenes centralizadas.

Escalable.

Sin archivos sueltos.

FASE 7 – Dashboard operativo

Objetivo: que el sistema trabaje para el usuario.

Alcance

Widgets mínimos:

Citas hoy

Próximas citas

Cotizaciones pendientes

Ventas del día

Acciones rápidas:

Finalizar cita

Ver cliente

Abrir cotización

Resultado esperado

Menos clics.

Más control.

Operación fluida.

FASE 8 – Automatizaciones (opcional / futura)

Objetivo: ahorro de tiempo.

Alcance

Recordatorios automáticos.

Felicitaciones de cumpleaños.

Reagendamiento.

Cancelaciones sincronizadas con Calendar.

FASE 9 – Escalabilidad

Objetivo: crecimiento sin refactor.

Alcance

Multi-manicurista (varios calendarios).

Roles de usuario.

Reportes mensuales.

Pagos online (futuro).

Resumen ejecutivo
Fase	Riesgo	Impacto	Prioridad
0–1	Bajo	Alto	Crítica
2–4	Medio	Muy alto	Alta
5–7	Bajo	Alto	Media
8–9	Bajo	Medio	Opcional

Nota de lógica – Duración variable de citas por servicio
Contexto

Las citas NO tienen una duración fija, ya que el tiempo requerido depende de:

El tipo de servicio principal.

Si el servicio incluye retiro de sistema anterior.

Si se agregan servicios adicionales (esmaltado, diseño, etc.).

Por lo tanto, la duración de la cita debe calcularse dinámicamente según reglas predefinidas.

Regla general

La duración total de una cita se calcula como la suma del tiempo base del servicio principal + tiempos adicionales según condiciones específicas.

Lógica por tipo de servicio
1. Sistemas de uñas (Polygel, Press On, Gel, etc.)

Tiempo base mínimo: 2 horas

Variación según complejidad:

Polygel estándar: 2 horas 30 minutos

Si incluye retiro de sistema anterior: +30 minutos

Duración máxima estimada: 3 horas

Ejemplo:

Polygel sin retiro → 2h 30m

Polygel con retiro → 3h

2. Manicure

Limpieza básica:

50 minutos

Limpieza + esmaltado:

1 hora 30 minutos

3. Pedicure

Pedicure básico:

1 hora

Pedicure con esmaltado:

1 hora 30 minutos

Regla de validación de agenda

El sistema NO debe permitir citas traslapadas.

El bloque de tiempo reservado en el calendario debe cubrir toda la duración calculada, no solo la hora de inicio.

La disponibilidad se valida contra Google Calendar usando:

hora_inicio

hora_fin = hora_inicio + duración_calculada

Implementación recomendada (conceptual)

Cada servicio debe tener:

duracion_base

duracion_extra_retiro (si aplica)

En el formulario de cita:

El usuario selecciona el servicio.

Indica si requiere retiro (Sí / No).

El sistema calcula automáticamente la duración total.

Esa duración se usa para:

Validar disponibilidad.

Crear el evento en Google Calendar.

Registrar la cita en el ERP.

Ejemplo de cálculo lógico (conceptual)

Servicio: Polygel
Requiere retiro: Sí

Duración base: 150 minutos
Duración retiro: 30 minutos

Duración total cita: 180 minutos (3 horas)

Beneficio de esta lógica

Agenda realista.

Evita sobrecupo.

Reduce retrasos.

Refleja la operación real del servicio.
