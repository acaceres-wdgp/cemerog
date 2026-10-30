# Dominio de negocio – CEMEROG

Clínica médica privada "Dres. Rodríguez & Guzmán", República Dominicana.
Una sola sucursal. Moneda: peso dominicano (DOP).

---

## Glosario

| Término       | Definición                                      |
| ------------- | ----------------------------------------------- |
| Paciente      | Persona registrada que recibe atención          |
| Expediente    | Historial clínico completo del paciente         |
| Consulta      | Visita médica programada o de walk-in           |
| Emergencia    | Atención no programada, urgente                 |
| Internamiento | Hospitalización con cama asignada               |
| Cirugía       | Procedimiento quirúrgico programado             |
| Análisis      | Examen de laboratorio o imagen diagnóstica      |
| Factura       | Documento de cobro por servicios                |
| Cuadre        | Cierre diario de caja                           |
| CxC           | Cuentas por cobrar pendientes                   |
| Triaje        | Clasificación de urgencia (I–V)                 |
| Especialidad  | Área médica (Medicina general, Pediatría, etc.) |

---

## Módulos y reglas de negocio

### Inicio

- Dashboard resumen del día.
- Acceso para: Administrador, Médico, Secretaría, Caja.
- **Pendiente de implementar**: widgets de estadísticas en tiempo real.

### Tablero

- Vista kanban/lista de pacientes por estado (espera, consulta, internado, etc.).
- Estados de atención: espera, consulta, emergencia, internado, cirugia, pendiente, balance, saldada, cancelada.
- **Pendiente de implementar**: actualización en tiempo real con broadcasting.

### Pacientes

- Directorio permanente de todos los pacientes de la clínica.
- Búsqueda por nombre (AND entre palabras) o por número de documento/teléfono (hash exacto).
- Panel de detalle (Sheet) con datos personales, alergias, y últimas 4 atenciones.
- **Los expedientes son permanentes**: no existe borrado ni desactivación de pacientes. Una vez registrado, el paciente forma parte del historial clínico para siempre. Ver ADR-009.

### Registro de pacientes

- Flujo unificado: buscar primero → elegir paciente existente o registrar nuevo → crear turno de atención.
- Búsqueda con autocompletar (mínimo 3 caracteres, debounce 300 ms).
- Un paciente no puede tener más de una atención abierta el mismo día con el mismo médico; el sistema muestra un aviso si intenta registrarse de nuevo (ver ADR-013).
- La creación del paciente y la asignación del turno ocurren en una sola transacción (`RegisterArrival`).
- Al registrar la llegada se crea automáticamente (o reutiliza) la **cuenta diaria del paciente** (`accounts`) y se agrega un **cargo de consulta** (`account_charges`) con el precio y honorario vigentes del médico en ese momento. Ver ADR-016.
- **Registrar sin atención**: en el formulario de registro de nuevo paciente (`mode=new`) existe el botón secundario "Solo registrar paciente" (`POST /registro/pacientes`). Crea el expediente pero no genera turno; redirige a `/pacientes?paciente={id}` con flash "Paciente registrado." Útil para ingresar datos de pacientes nuevos antes de su primera consulta.
- `expediente_number` = `P-` + id con cero a la izquierda (5 dígitos mínimo).
- `document_number` y `phone` se guardan cifrados; se indexan mediante `document_number_hash` y `phone_hash` (HMAC-SHA256) para búsquedas exactas. `document_number_hash` usa normalización por tipo: solo dígitos para `cedula`, mayúsculas [A-Z0-9] para `pasaporte`/`cedula_extranjera`/`no_tiene` (`Pii::documentHash`). `phone_hash` siempre usa solo dígitos (`Pii::hash`). Ver ADR-014.

### Citas

- Programación de consultas por médico y especialidad.
- Recordatorio y confirmación (futuro).
- **Pendiente de implementar**: calendario de citas por médico.

### Consulta

- Notas SOAP, diagnóstico CIE-10, prescripciones.
- Genera órdenes de laboratorio e imagen.
- La pestaña **«Órdenes y cargos»** muestra los cargos de la cuenta diaria del paciente. Visibilidad: médico+admin ve todos los cargos; médico sin admin ve solo los suyos.
- Al dar de alta al último turno abierto del día, la cuenta pasa a `pendiente_facturar` automáticamente (ver ADR-016).

#### Reglas de autoría y acceso (ADR-015)

1. Cada turno pertenece a un médico. Solo ese médico puede llamarlo, registrar la consulta y dar el alta.
2. En Consulta, cada médico ve únicamente su propia cola del día (`turns` filtrados por `doctor_id = auth user's doctor`).
3. El médico puede ver el historial completo del paciente (todos los médicos), en modo lectura.
4. Un paciente puede tener turnos con múltiples médicos el mismo día; cada médico gestiona los suyos de forma independiente.
5. Para acceder a Consulta se requiere **dos condiciones** simultáneas:
    - Permiso `module.consulta.access` (lo tiene el rol `medico`; no el rol `administrador`).
    - Usuario vinculado a un médico activo (`doctors.is_active = true`, `doctors.user_id = auth user`).
      El propietario accede porque tiene roles `administrador` + `medico` y está vinculado a su doctor. Un administrador puro (sin doctor activo) ve 403 en `/consulta`. Middleware `attend-patients`.
6. La consulta siempre se guarda con el `doctor_id` y `patient_id` del turno, nunca del cuerpo de la petición.
7. `consultations.created_by` registra el `user_id` del usuario autenticado que guardó la nota.
8. `updateAntecedents`: solo el médico con un turno abierto hoy para ese paciente puede modificar sus antecedentes.

### Emergencia

- Flujo de triaje (I–V).
- Atención inmediata, puede derivar a internamiento o cirugía.
- **Pendiente de implementar**: tablero de triaje en tiempo real.

### Internamiento

- Asignación de cama/habitación.
- Seguimiento de evolución.
- **Pendiente de implementar**: gestión de habitaciones y camas.

### Cirugía

- Programación quirúrgica, equipo, anestesiólogo.
- **Pendiente de implementar**: agenda quirúrgica.

### Laboratorio

- Catálogo de análisis con precios.
- Registro de resultados, referencia de rangos normales.
- **Pendiente de implementar**: interfaz de carga de resultados.

### Imágenes

- Rayos X, ultrasonido, TAC, RMN.
- **Pendiente de implementar**: gestión de estudios de imagen.

### Facturación

- Factura por servicios prestados.
- Tipos de pago: efectivo, tarjeta, seguro.
- ITBIS aplicado según tipo de servicio.
- **Pendiente de implementar**: generación de facturas y recibos.

### Cuentas por cobrar

- Facturas pendientes de pago total o parcial.
- **Pendiente de implementar**: módulo de seguimiento de cobros.

### Cuadre de caja

- Cierre diario: efectivo, tarjeta, otros.
- Un solo cuadre por día por cajero.
- **Pendiente de implementar**: formulario de cuadre y reporte.

### Almacén (Catálogo)

- Inventario de insumos, medicamentos, materiales.
- **Pendiente de implementar**: catálogo y control de stock.

### Entrada de mercancía

- Registro de compras y entradas al inventario.
- **Pendiente de implementar**: formulario de entrada.

### Administración – Usuarios y roles

- CRUD de usuarios con asignación de roles.
- Contraseña temporal + cambio obligatorio en primer login.
- **Pendiente de implementar**: interfaz de gestión de usuarios.

### Administración – Doctores y especialidades

- Catálogo de médicos y sus especialidades.
- Un médico es siempre un registro en `doctors`; el rol `medico` en `users` no es suficiente por sí solo (ver ADR-015).
- `doctors.user_id` (nullable) vincula al doctor con su cuenta de sistema.
- Al crear un doctor se puede generar usuario nuevo (credenciales temporales de un solo uso) o vincular un usuario existente (se le añade el rol `medico` sin quitar los demás).
- Desactivar un doctor desactiva también su usuario vinculado.
- Cambiar el nombre del doctor sincroniza el campo `name` del usuario (no el `username`).
- Restablecer contraseña genera nueva contraseña temporal y activa `must_change_password`.
- `doctors.consultation_price` y `doctors.consultation_fee` (centavos enteros) definen el precio de consulta y el honorario por consulta por médico. Se inicializan con el precio de la especialidad al crear el doctor. Validación: `consultation_fee ≤ consultation_price`. Ver ADR-016.

### Catálogos de precios

- Precios por servicio, análisis, estudio.
- **Pendiente de implementar**: editor de precios.

### Habitaciones y camas

- Catálogo de habitaciones, tipo de cama, tarifa.
- **Pendiente de implementar**: mapa de disponibilidad.

### Tema y estados

- Configuración del tema visual del sidebar.
- **Pendiente de implementar**: editor de estados de atención.

---

## Reglas generales del negocio

1. Un paciente puede estar en múltiples estados simultáneamente (consulta + laboratorio pendiente).
2. La factura se genera cuando el paciente está en estado "balance".
3. Una cuenta pasa a "saldada" cuando el saldo es 0.
4. El cuadre solo lo puede cerrar un usuario con rol "caja".
5. Los precios de servicios son configurables desde el catálogo de precios.
6. ITBIS: los servicios médicos están exentos; medicamentos al 18 %.
7. **Permanencia de pacientes**: los expedientes clínicos nunca se borran ni desactivan. Solo el administrador puede editar datos personales.
8. **Turno único por médico por día**: un paciente puede tener turnos con varios médicos el mismo día (por ejemplo, Medicina General y Pediatría). Lo que no está permitido es abrir un segundo turno con el _mismo_ médico mientras el primero sigue en estado `espera` o `en_consulta`. El intento genera un error de validación que nombra al médico con el turno abierto.
9. **Permanencia de pacientes**: la UI no ofrece eliminar pacientes. Los expedientes clínicos son permanentes (ver ADR-009 y ADR-012).
