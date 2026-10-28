# Prompt 16 — Botones de acción y alta médica con tipo

> Pégalo **después** de mezclar el PR del Prompt 15.

---

## Contexto
El diseño de Claude Design (`design/CEMEROG v6.dc.html`, pantalla Consulta) tiene, sobre las pestañas, la barra: **«T-NN Cargar próximo paciente»** a la izquierda y **«Ordenar estudios»**, **«Pasar a emergencia»**, **«Ingresar»** y **«Dar alta médica»** (primario) a la derecha. Las pestañas son **«Nota clínica»**, **«Receta»** y **«Órdenes y cargos»**.

Lee `CLAUDE.md` y síguelo.

## Reglas
- Rama `feat/consulta-acciones-alta` desde `main` recién actualizado. PR, no lo mezcles. TDD.
- Migraciones nuevas con test de reversión. Prohibido: instalar dependencias, `as any`/`@ts-ignore`/`eslint-disable`, hex o `style={{` estáticos. Modal con `FormDialog`.

## Paso 1 — Barra de acciones como en el diseño
- Agrega los botones con los íconos del diseño.
- **«Ordenar estudios»**, **«Pasar a emergencia»** e **«Ingresar»**: visibles pero **deshabilitados**, con tooltip «Disponible cuando se implemente Laboratorio / Emergencia / Internamiento».
- Renombra la pestaña «Cuenta / Órdenes» a **«Órdenes y cargos»**.
- Registra en `docs/MODULES.md`, en una sección **«Dependencias pendientes»**: «Consulta → *Ordenar estudios*: habilitar al terminar Laboratorio (e Imágenes)», «Consulta → *Pasar a emergencia*: habilitar con Emergencia», «Consulta → *Ingresar*: habilitar con Internamiento».

## Paso 2 — Modelo de alta
Nueva tabla `discharges` (pensada para reutilizarse desde Emergencia e Internamiento):
`id`, `turn_id` (FK, único), `patient_id`, `doctor_id`, `type` (`recuperado` | `traslado` | `defuncion`), `destination` (nullable, nombre del centro — obligatorio si `traslado`), `reason` (nullable; para traslado por defecto «A petición del familiar»), `discharge_diagnosis` (text, obligatorio), `discharged_at`, `created_by` (FK users), timestamps.
Al dar de alta, el turno pasa a `atendido` (como hoy) **y** se crea el registro `discharge`, en una transacción.

## Paso 3 — Modal «Alta médica» (según el diseño)
Título «Alta médica», subtítulo con paciente y No. de atención; tres opciones en tarjetas:
- **Por alivio** — «El paciente mejora y regresa a su hogar.» (`recuperado`)
- **Traslado a otro centro** — «A petición del familiar.» + campo **Centro de destino** obligatorio (`traslado`)
- **Defunción** — «Requiere confirmación.» (`defuncion`): al confirmar pide una **segunda confirmación** explícita («Confirmo la defunción del paciente…»).
Campo **Diagnóstico de egreso** (obligatorio). Botones Cancelar / Confirmar alta.
Solo el médico del turno puede dar el alta (regla del Prompt 14).

## Paso 4 — Historial
En el historial del paciente, la entrada de esa atención muestra el tipo de alta (etiqueta) y el diagnóstico de egreso.

## Tests
- Pest: alta con cada tipo crea `discharge` con los datos correctos y el turno queda `atendido`; traslado sin destino → 422; sin diagnóstico → 422; médico ajeno → 403; un turno no puede tener dos altas.
- Vitest: botones deshabilitados con su tooltip; el modal exige destino en traslado y doble confirmación en defunción; envía el payload correcto.

## Antes de abrir el PR
7 comandos con **código 0**. Salida real en el PR. No incluyas capturas.
