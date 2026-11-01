# Decisiones de arquitectura (ADRs)

## ADR-001: Stack tecnológico

**Fecha**: 2026-10  
**Estado**: Aceptado

### Decisión

Laravel 12 + Inertia 2 + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui.

### Justificación

- Laravel es el estándar en el ecosistema PHP dominicano; facilita contratación.
- Inertia elimina la complejidad de una API REST separada para una app de una sola empresa.
- React + TypeScript: mejor ergonomía para formularios complejos clínicos.
- shadcn/ui: componentes de alta calidad sin vendor lock-in, personalizables.
- Tailwind CSS 4: mejor rendimiento y DX que versiones anteriores.

---

## ADR-002: Autenticación por username (no email)

**Fecha**: 2026-10  
**Estado**: Aceptado

### Decisión

Los usuarios se autentican con `username` y `password`. El email es opcional.

### Justificación

- Entorno clínico interno: los empleados no necesariamente tienen email corporativo.
- El username es más simple de recordar en contexto de rotación de personal.
- No hay recuperación de contraseña por email – el administrador lo resetea manualmente.
- Sin registro público: todos los usuarios los crea el administrador.

---

## ADR-003: Sin correo transaccional

**Fecha**: 2026-10  
**Estado**: Aceptado

### Decisión

No se implementa envío de correos (recuperación de contraseña, notificaciones, etc.).

### Justificación

- Clínica pequeña, gestión interna de credenciales.
- Reduce complejidad de infraestructura (sin SMTP, sin configuración de dominio).
- Si en el futuro se requiere, se puede agregar sin romper nada.

---

## ADR-004: Dinero en centavos (entero)

**Fecha**: 2026-10  
**Estado**: Aceptado

### Decisión

Todos los valores monetarios se almacenan como `INTEGER` en la base de datos, representando centavos.

### Justificación

- Evita errores de precisión de punto flotante en cálculos financieros.
- `150050` = RD$1,500.50 – fácil de razonar.
- Función `formatMoney(centavos)` centraliza el formato visual.
- Convención estándar en sistemas de facturación.

---

## ADR-005: Una sola clínica (sin multi-tenancy)

**Fecha**: 2026-10  
**Estado**: Aceptado

### Decisión

El sistema está diseñado para una sola clínica. No habrá multi-tenancy.

### Justificación

- El cliente es una clínica específica.
- Multi-tenancy agrega complejidad significativa sin beneficio actual.
- Si en el futuro se requiere multi-tenancy, se puede migrar con `stancl/tenancy`.

---

## ADR-006: Despliegue en Laravel Forge + DigitalOcean

**Fecha**: 2026-10  
**Estado**: Propuesto

### Decisión

Servidor administrado con Laravel Forge sobre un Droplet de DigitalOcean.

### Justificación

- Forge abstrae la configuración de servidor, Nginx, SSL, workers.
- DigitalOcean está disponible en la región de Nueva York (latencia aceptable desde RD).
- Alternativa evaluada: Railway – descartada por costo a escala.

---

## ADR-007: Spatie Permission para roles y permisos

**Fecha**: 2026-10  
**Estado**: Aceptado

### Decisión

Usar `spatie/laravel-permission` para gestión de roles y permisos.

### Justificación

- Solución madura y bien documentada.
- 8 roles predefinidos cubren todos los casos de uso.
- Permisos granulares `module.<key>.access` permiten control fino.
- Idempotente mediante `firstOrCreate` en seeders.

---

## ADR-008: Sin Laravel Fortify

**Fecha**: 2026-10  
**Estado**: Aceptado

### Decisión

Desinstalar `laravel/fortify`, que venía con el starter kit, junto con sus dependencias de passkeys y 2FA. La autenticación es código propio: `LoginController`, `LoginRequest` y `ChangePasswordController`.

### Justificación

- Solo el administrador gestiona accesos y contraseñas. No hay registro público, recuperación de contraseña, verificación de email, 2FA ni passkeys.
- Fortify ya tenía sus rutas desactivadas (`ignoreRoutes()`), pero su configuración mantenía activados el registro y la recuperación. Bastaba quitar esa línea para abrirlos.
- Sin la dependencia, esas funciones no pueden reactivarse por accidente. `NoPublicAuthRoutesTest` verifica que Fortify no está instalado y que sus rutas dan 404.

### Limpieza

- La migración `drop_passkeys_and_two_factor_columns` elimina la tabla `passkeys` y las 3 columnas de 2FA de `users`. Su `down()` las restaura, y `DropPasskeysAndTwoFactorTest` verifica ambos sentidos.
- `@laravel/passkeys` también se desinstaló de npm.

---

## ADR-009: Los pacientes son expedientes permanentes

**Fecha**: 2026-10  
**Estado**: Aceptado

### Decisión

No existe borrado ni desactivación de pacientes. Una vez creado, un expediente es permanente.

- Se eliminó `SoftDeletes` del modelo `Patient`.
- Se eliminaron las columnas `deleted_at` e `is_active` de la tabla `patients`.
- Se eliminó la ruta `DELETE /registro/pacientes/{patient}`.

### Justificación

- Los expedientes clínicos son documentos legales; borrarlos viola regulaciones de salud.
- La desactivación genera inconsistencias: un turno o consulta sin paciente referenciado.
- Si un paciente "deja de venir", simplemente no tiene atenciones nuevas; sigue visible en el historial.
- Simplifica la lógica de búsqueda y el ORM (sin `withTrashed`, sin scopes de `is_active`).

### Consecuencias

- El administrador puede editar datos personales (nombre, documento, teléfono) si hay un error.
- No hay forma de "archivar" o "desactivar" un paciente desde la interfaz.
- Las búsquedas devuelven todos los pacientes registrados históricamente.

---

## ADR-010: Hash de dígitos para document_number y phone

**Fecha**: 2026-10  
**Estado**: Aceptado

### Decisión

`document_number` y `phone` se almacenan cifrados con `encrypted` cast. Para búsquedas exactas e índices únicos se guardan columnas `document_number_hash` y `phone_hash` (HMAC-SHA256 de `config('app.key')`), calculadas sobre solo los dígitos del valor.

### Justificación

- Los campos cifrados no son consultables con `LIKE` en la base de datos.
- Al normalizar a solo dígitos antes de hashear, `031-0234567-8`, `03102345678` y `(031) 023-4567-8` producen el mismo hash → el sistema los reconoce como el mismo documento.
- HMAC-SHA256 (no SHA simple) evita ataques de preimagen con rainbow tables, usando la clave de la app como secreto.

### Consecuencias

- Al guardar un paciente, el mutador calcula automáticamente el hash.
- La regla `UniqueDocumentNumber` también normaliza a dígitos antes de hashear para consistencia.
- El backfill se ejecuta en la migración `add_phone_hash_to_patients` para registros existentes.

---

## ADR-011: Registro no aparece en el sidebar

**Contexto:** El módulo Registro (/registro) requiere siempre un flujo consciente (crear atención nueva o para paciente existente). Mostrarlo en el sidebar invitaba a ir directo sin pasar por la lista de pacientes, aumentando el riesgo de duplicados.

**Decisión:** Quitar "Registro de pacientes" del sidebar. La ruta /registro sigue existiendo y protegida por `module.registro.access`. Se accede únicamente desde botones explícitos: "Nuevo paciente" en /pacientes, "Nueva atención" en el panel lateral, y accesos del Tablero, Inicio y Citas.

**Consecuencias:** El sidebar de Recepción muestra: Tablero de atenciones, Pacientes y Citas. El ítem Pacientes usa `activeFor: ['/registro']` para mantenerse resaltado cuando el usuario navega a /registro.

---

## ADR-012: Restaurar soft deletes en pacientes

**Fecha**: 2026-10-24
**Estado**: Aceptado

### Contexto

La tabla `patients` originalmente tenía `deleted_at` (soft deletes). Una migración anterior eliminó la columna. Con el sistema en producción, necesitamos eliminar registros de pacientes sin perder la integridad referencial (turns, appointments, etc.).

### Decisión

Restaurar el trait `SoftDeletes` en `App\Models\Patient` mediante la migración `2026_10_24_300000_restore_soft_deletes_to_patients.php`.

Todos los endpoints que muestran listas de registros relacionados (`/tablero`, `/citas`) filtran con `->whereHas('patient')` para excluir filas huérfanas. El endpoint `/registro?paciente=` ignora silenciosamente pacientes eliminados (retorna `patient: null`) en lugar de 404, para evitar romper flujos de navegación con IDs en caché.

### Consecuencias

- `Patient::query()` y `Patient::find()` excluyen automáticamente registros con `deleted_at != null`.
- Los endpoints `/pacientes`, `/pacientes/buscar` y `/registro?paciente=` no requieren cambios adicionales gracias al scope automático de Eloquent.
- `TableroController` y `CitasController` añaden `->whereHas('patient')` para evitar null pointer en el mapeo `$t->patient->full_name`.
- Se cubre con 6 tests en `tests/Feature/Pacientes/SoftDeletesTest.php`.
- La UI no ofrece eliminar pacientes: el botón "Eliminar paciente" en la vista de edición fue removido (ver ADR-013).

---

## ADR-014: Hash por tipo de documento (documentHash)

**Fecha**: 2026-10-25
**Estado**: Aceptado

### Contexto

ADR-010 introdujo `document_number_hash` calculado solo sobre los dígitos del valor, lo cual era correcto para cédulas dominicanas (formato `NNN-NNNNNNN-N`). Sin embargo, dos pasaportes con letras distintas pero los mismos dígitos —p.ej. `AB123456` y `XY123456`— producían el mismo hash `hash('123456')`, violando la unicidad en DB o silenciando duplicados en búsquedas.

El mismo problema afectaba los códigos generados para `no_tiene` (prefijo `GEN-` + caracteres alfanuméricos).

### Decisión

Reemplazar la normalización de solo-dígitos por una normalización dependiente del tipo de documento:

| Tipo                                         | Normalización antes del hash           |
| -------------------------------------------- | -------------------------------------- |
| `cedula`                                     | Solo dígitos (`/[^\d]/` eliminado)     |
| `pasaporte`, `cedula_extranjera`, `no_tiene` | Mayúsculas [A-Z0-9] (letras + dígitos) |

La lógica centralizada vive en `Pii::documentHash(string $type, string $number): string`.

`Pii::hash()` queda sin cambios para `phone_hash` (dígitos siguen siendo la normalización correcta para teléfonos).

### Cambios

- `app/Support/Pii.php`: nuevo método `documentHash()`.
- `app/Models/Patient.php`: el hash se calcula en el evento `saving` (en lugar del setter) para garantizar que `document_type` ya esté disponible.
- `app/Rules/UniqueDocumentNumber.php`: acepta `type` como segundo parámetro.
- `app/Http/Requests/StorePatientRequest.php`, `UpdatePatientRequest.php`, `RegisterArrivalRequest.php`: pasan `document_type` al construir la regla.
- `app/Actions/CreatePatient.php`, `app/Actions/Patients/SearchPatients.php`: usan `documentHash`.
- `app/Http/Controllers/Modules/PacientesController.php`: `exists()` y `index()` usan `documentHash`.
- `resources/js/pages/registro/index.tsx`: envía parámetro `tipo` al endpoint `/registro/pacientes/existe`.
- Migración `2026_10_25_233835_recalculate_document_number_hashes.php`: recalcula todos los hashes existentes con la nueva lógica; aborta si detecta que los nuevos hashes producirían duplicados.

### Consecuencias

- Dos pasaportes con distintos prefijos de letras pero mismos dígitos ya no colisionan.
- La función `down()` de la migración restaura el algoritmo antiguo (solo dígitos), lo que en sí puede producir duplicados para pasaportes que usaban letras distintas — este es el bug documentado que `up()` corrige.

---

## ADR-013: Unicidad de turno por médico (no por paciente)

**Fecha**: 2026-10-25
**Estado**: Aceptado

### Contexto

El chequeo original en `RegisterArrival` bloqueaba cualquier nuevo turno si el paciente ya tenía uno abierto ese día, independientemente del médico. Esto impedía que una secretaria registrara a un paciente con el Dr. A y luego con el Dr. B en la misma visita (p. ej., Medicina General + Pediatría).

### Decisión

La unicidad del turno abierto se verifica por `(patient_id, doctor_id, fecha, status IN ('espera', 'en_consulta'))`. Un paciente puede tener varios turnos abiertos el mismo día siempre que sean con médicos distintos. Solo se bloquea un segundo turno con el _mismo_ médico.

### Cambios

- `RegisterArrival::handle`: añade `where('doctor_id', $attention['doctor_id'])` al chequeo.
- `PatientHasOpenTurnException`: el mensaje incluye el nombre del médico.
- `PacientesController::search` y `RegistroController::patientPayload`: devuelven `open_turns_today` (lista de `{ doctor_name, status }`) en lugar de los flags planos `has_open_turn_today` + `open_turn_status`.
- Frontend (`registro/index.tsx`): la UI advierte sobre turnos abiertos por médico pero no bloquea el formulario — el servidor es quien valida.

### Consecuencias

- El índice único necesario para prevenir condiciones de carrera sería `(patient_id, doctor_id, DATE(arrived_at), status)`, pero como el status cambia a lo largo del turno, se mantiene la validación en la capa de aplicación (sin índice único en DB).
- Los tests C9–C15 en `RegisterArrivalTest` cubren todos los escenarios.

---

## ADR-015: Médico = registro en `doctors` vinculado a un usuario; el rol no basta

**Fecha**: 2026-10-27
**Estado**: Aceptado

### Contexto

Inicialmente se consideró usar únicamente el rol `medico` de spatie/laravel-permission para identificar a los médicos del sistema. Sin embargo, un médico tiene atributos propios (nombre, exequátur, teléfono, especialidad, consultorio) que no pertenecen al modelo `User`. Además, un mismo usuario podría tener múltiples roles (p. ej. `administrador` + `medico`).

### Decisión

Un médico es siempre un registro en la tabla `doctors`. El vínculo con `users` es opcional (`user_id` nullable), pero cuando existe define el acceso al sistema:

1. **Crear usuario nuevo** (`access_mode=create_user`): se genera automáticamente un `User` con rol `medico`, `must_change_password=true` y contraseña temporal de 10 caracteres (alfabeto sin 0/O/l/1). Las credenciales se entregan **una sola vez** via `Inertia::flash('credentials', …)` y nunca se persisten en texto plano.

2. **Vincular usuario existente** (`access_mode=link_user`): se asocia un `User` ya existente y se le añade el rol `medico` sin quitar sus roles actuales (un administrador-médico conserva ambos roles).

3. **Sin acceso** (`access_mode=none` o `user_id=null`): el doctor existe en el catálogo pero no puede iniciar sesión como médico.

El rol `medico` por sí solo no garantiza que el usuario esté vinculado a un registro en `doctors`. La relación es `doctors.user_id → users.id` (BelongsTo).

### Cambios

- `app/Actions/Doctors/GenerateDoctorCredentials.php`: genera username (primera letra del nombre + primer apellido, sin acentos, sin prefijo Dr./Dra., sufijo numérico en colisión) y contraseña temporal.
- `app/Actions/Doctors/ResetDoctorPassword.php`: genera nueva contraseña temporal y activa `must_change_password`.
- `app/Actions/CreateDoctor.php` / `UpdateDoctor.php`: transacción que crea/vincula el user junto con el doctor.
- `DoctoresController`: nuevo endpoint `POST /{doctor}/reset-password`; `toggleDoctor` sincroniza el estado activo del user vinculado; `updateDoctor` sincroniza el nombre del user al cambiar el nombre del doctor.
- Frontend `doctores/index.tsx`: sección "Sistema de acceso" con radio buttons; diálogo de credenciales de un solo uso con botones Copiar e Imprimir.

### Consecuencias

- No se puede tener dos registros `doctors` apuntando al mismo `user_id` (validado por `Rule::unique`).
- Desactivar un doctor desactiva su user; reactivarlo lo reactiva.
- Cambiar el nombre del doctor sincroniza el campo `name` del user (no el `username`).
- La contraseña temporal nunca se almacena en texto plano; solo viaja en la respuesta inmediata.

---

## ADR-016: Cuenta diaria por paciente; precio y honorario por médico guardados en cada cargo

**Fecha**: 2026-10-27
**Estado**: Aceptado

### Contexto

Al llegar un paciente se necesita registrar qué consumió ese día (consultas, laboratorio, etc.) para poder facturarle. Los médicos cobran honorarios sobre lo facturado, que se liquidan posteriormente. Los precios pueden cambiar, pero los cargos históricos deben preservar el precio vigente al momento de la atención.

### Decisión

1. **Precio y honorario por médico** (`doctors.consultation_price`, `doctors.consultation_fee`, ambos en centavos). La especialidad sigue teniendo `consultation_price` como referencia; al crear un doctor se inicializa con ese valor, pero cada médico puede tener un precio diferente. Validación: `consultation_fee ≤ consultation_price`.

2. **Cuenta diaria por paciente** (`accounts`): una sola cuenta agrupa todo lo consumido por un paciente en un día. Si llega con dos médicos distintos, hay una cuenta con dos cargos. Si la cuenta del día ya fue facturada y el paciente regresa el mismo día, se abre otra cuenta nueva.

3. **Cargo de consulta** (`account_charges`, `type=consulta`): al registrar la llegada se crea un cargo con `unit_price = doctor.consultation_price` y `doctor_fee = doctor.consultation_fee` en ese instante. Cambios posteriores de precio no afectan el cargo guardado.

4. **Liquidación de honorarios**: la tabla `account_charges.doctor_fee` guarda el honorario por cargo individual. La liquidación total por período es responsabilidad del módulo de Facturación (futuro).

5. **Ciclo de vida de la cuenta**:
    - `abierta`: desde el primer cargo del día hasta el último alta.
    - `pendiente_facturar`: cuando el último turno abierto del paciente ese día recibe el alta.
    - `facturada` / `anulada`: gestionados por Facturación (futuro).

6. **Visibilidad de cargos en Consulta**: médico+administrador ve todos los cargos de la cuenta; médico sin rol administrador ve solo los cargos que generó él (`doctor_id = user's doctor id`).

### Justificación

- Capturar el precio al momento del cargo evita disputas cuando los precios cambian.
- Una sola cuenta por día simplifica la facturación y el cuadre de caja.
- `lockForUpdate()` en `GetOrOpenDailyAccount` previene que dos llegadas concurrentes creen cuentas duplicadas.
- El honorario se guarda por cargo (no como porcentaje) para soportar honorarios fijos o mixtos en el futuro.

### Consecuencias

- `RegisterArrival` ahora llama `GetOrOpenDailyAccount` y `AddConsultationCharge` en la misma transacción.
- El módulo de Facturación deberá leer `accounts` con `status = pendiente_facturar` para generar facturas.
- La liquidación de honorarios (`doctor_fee` acumulado por médico y período) es responsabilidad de un módulo futuro (`honorarios` o `cuadre`).

---

## ADR-017: Facturación al final, una caja, cobros por turno

**Contexto:** La clínica es pequeña y cobra al final de la atención. Tiene una sola caja, que manejan la secretaria o el cajero.

**Decisión:**

- Una factura por cuenta del día (no por servicio). Facturar no requiere turno; cobrar sí.
- Las facturas y los recibos son inmutables: los errores se corrigen anulando, solo el administrador y con motivo. Un recibo solo se anula dentro de su turno, para que un cuadre cerrado no cambie.
- Un único turno de caja abierto (índice único `cash_shifts.open_lock`). El sistema muestra el efectivo esperado; el cajero cuadra y cierra.
- El descuento reduce el honorario del médico en proporción (`invoice_lines.doctor_fee`), porque los honorarios se pagan por lo facturado.
- Sin impuestos ni seguros (ARS) por ahora; `invoices.ncf` queda listo para cuando se usen comprobantes fiscales.

**Consecuencias:** la liquidación de honorarios se calculará con `invoice_lines.doctor_fee` de facturas no anuladas.

---

## ADR-018: El alta no cierra la facturación; cargos de otras áreas

**Fecha**: 2026-10  
**Estado**: Aceptado (5.3 implementado; el resto, con los módulos de Emergencia, Laboratorio e Imágenes)

**Contexto:** Además de la consulta habrá cargos de medicación en Emergencia, análisis e imágenes, que pueden ocurrir después del alta médica.

**Decisión:**

- La cuenta es de la visita del día, no de la consulta. El alta cierra la parte clínica; la cuenta pasa a «Pendiente de facturar» cuando no quedan turnos abiertos.
- **Un cargo se genera cuando el servicio se realiza**, no cuando se indica: medicación al administrarla, análisis e imágenes al hacerlos en la clínica.
- **Una indicación no bloquea la facturación.** El paciente puede hacerse los análisis o las imágenes en otro lugar. Caja ve un recordatorio («tiene análisis indicados») para avisarle, nada más.
- **Caja factura lo que hay.** Un cargo que llega después de facturar va a una cuenta nueva y sale en otra factura; una factura emitida no se modifica.
- **Mismo día, sin facturar:** si el paciente vuelve, se reabre su cuenta del día (`GetOrOpenDailyAccount`) y todo sale en una sola factura. Si ya se facturó, o la cuenta se anuló por vacía, se abre una cuenta nueva.
- **Otro día:** siempre factura nueva. Análisis e imágenes se registran desde su propio módulo, sin turno de consulta; ese módulo abre o usa la cuenta del día del paciente.

---

## ADR-019: Emergencia — ingreso rápido, cubículos y cargos

**Fecha**: 2026-10  
**Estado**: Aceptado

**Decisión:**

- **Ingreso rápido** con lo mínimo: nombre (o **N.N. · Sin identificar**), documento (o tipo «No tiene»), sexo, cubículo, médico de turno y motivo. Primero se busca al paciente por identificación; si existe, no se tocan sus datos. Sin edad ni prioridad inicial.
- `patients.birth_date` pasa a ser opcional y `patients.profile_incomplete` marca al paciente hasta que Recepción guarde su ficha completa.
- **Cubículos** configurables por el administrador (`emergency_cubicles`), sin release. Un cubículo tiene un solo paciente a la vez: `emergencies.occupied_cubicle_id` es único y se libera al dar el alta.
- **Cargo de emergencia** al ingresar, con el precio de `settings.emergency_fee`. La emergencia guarda su `account_id`: todo lo que se aplique durante la estancia va a esa cuenta, aunque pase la medianoche, y la cuenta sigue abierta mientras la emergencia esté activa.
- `account_charges.type` pasa de enum a texto validado en la aplicación, para sumar `emergencia` e `insumo`.
- Medicamentos e insumos salen del catálogo (`inventory_items`, solo el administrador lo edita). Aplicarlos descuenta existencia sin bloquear al llegar a 0. Un medicamento traído por el paciente se registra sin cargo y sin tocar el inventario.

---

## ADR-020: Inventario sencillo — artículo único, costo por proveedor, entradas

**Fecha**: 2026-10  
**Estado**: Aceptado

**Decisión** (lo más simple posible mientras llega el feedback del cliente):

- **Un artículo por medicamento o insumo**, con una **existencia global**. No se lleva existencia por lote. El artículo guarda el lote y el vencimiento de la última entrada y su último costo.
- **Proveedores como entidad** (`suppliers`). Todavía no hay cuentas por pagar, pero la estructura queda lista. Cada entrada dice de qué proveedor vino y a qué costo, y se guarda el **último costo de cada proveedor** por artículo (`inventory_item_supplier`). Los insumos siguen el mismo mecanismo.
- **Entradas** numeradas `ENT-0001` (el prefijo `E-` ya lo usan las emergencias). Una línea puede crear un producto que no estaba en el catálogo.
- **Ajuste de existencia** con motivo (conteo físico, merma, vencido), con registro de la existencia anterior y la diferencia. La existencia puede quedar negativa porque aplicar en Emergencia nunca se bloquea; el ajuste la corrige.
- El **rol almacén** y el administrador editan el catálogo, los proveedores y registran entradas.

---

## ADR-021: Laboratorio — catálogo con parámetros, órdenes y cobro al tomar la muestra

**Fecha**: 2026-11  
**Estado**: Aceptado

**Decisión:**

- **Catálogo de análisis** (`lab_tests`) con **parámetros**: numéricos (mínimo, máximo y unidad) o de texto (valor normal). Así se marca solo lo que está fuera de rango. Lo edita el administrador.
- **Órdenes** (`lab_orders`, `L-0001`) desde Consulta (médico del turno) y Emergencia. Estados: ordenada → muestra tomada → resultado ingresado → validada → entregada, o cancelada.
- **Se cobra al tomar la muestra**, no al ordenar (ADR-018). Va a la cuenta de la emergencia si sigue abierta; si no, a la cuenta del día del paciente. Una orden que se hará en otro laboratorio se cancela con motivo y no se cobra.
- **Los resultados guardan una copia** del nombre y la referencia de cada parámetro, para que un cambio posterior en el catálogo no altere resultados ya emitidos.
- **Validan el bioanalista y el administrador.** Para validar hacen falta todos los resultados. Lo validado aparece en Consulta («Órdenes y cargos»), en Emergencia y en el historial clínico.
- El paciente que viene solo a estudios se registra en Registro («Solo análisis o imágenes»). Imágenes: ver ADR-022.

---

## ADR-022: Imágenes — una orden por estudio, cobro al realizar, informe firmado

**Fecha**: 2026-11  
**Estado**: Aceptado

**Decisión:**

- **Catálogo de imágenes** (`imaging_studies`, código `I-01`) con modalidad (Radiografía, Sonografía, Tomografía, Mamografía, Otro), preparación y precio. Lo edita el administrador.
- **Una orden por estudio** (`imaging_orders`, `I-0001`), porque cada estudio tiene su propio informe y su propio estado: ordenada → realizado → informe en redacción → informe listo → entregado, o cancelada. Se ordena desde Consulta, Emergencia y Registro («Solo análisis o imágenes»), en el mismo diálogo que los análisis.
- **Se cobra al marcar «Estudio realizado»** (ADR-018). Va a la cuenta de la emergencia si sigue abierta; si no, a la cuenta del día. Una orden que se hará en otro centro se cancela con motivo y no se cobra.
- **Firman el rol imágenes y el administrador.** Para firmar hacen falta hallazgos y conclusión. Un informe firmado ya no se modifica. Aparece en Consulta, en Emergencia y en el historial clínico.
- **Adjuntos** (imágenes, PDF, DICOM; hasta 20 MB) en el **disco privado**. Se descargan solo a través de la aplicación, para quien tiene acceso a Imágenes, Consulta o Emergencia, porque son datos clínicos.
