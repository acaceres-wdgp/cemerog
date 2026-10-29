# Prompt 17 — Receta: guardar, imprimir y ver en el historial

> Pégalo **después** de mezclar el PR del Prompt 16.

---

## Contexto y diseño
Usa el diseño de Claude Design (`design/CEMEROG v6.dc.html`): pestaña **Receta** en Consulta y documento **Receta médica** en *Documentos imprimibles*. `design/README.md`: «receta (medicamento por medicamento con dosis, frecuencia y duración o "Continuo"; bloquea alergias; se guarda como registro del historial)».

Lee `CLAUDE.md` y síguelo.

## Reglas
- Rama `feat/receta` desde `main` recién actualizado. PR, no lo mezcles. TDD, un commit por paso.
- Migraciones nuevas con test de reversión. Prohibido: instalar dependencias, `as any`/`@ts-ignore`/`eslint-disable`, hex o `style={{` estáticos. Usa `PrintablePage` para el documento.

## Paso 1 — Modelo
- `prescriptions`: `id`, `consultation_id` (FK, nullable hasta guardar la nota si hace falta), `turn_id` (FK, **único**: una receta por atención), `patient_id`, `doctor_id`, `general_instructions` (text, nullable), `created_by`, `prescribed_at`, timestamps.
- `prescription_items`: `id`, `prescription_id` (FK cascade), `position`, `medication` (string — medicamento y concentración), `route` (vía, nullable), `dose` (string, p. ej. «1 tableta»), `frequency` (string, p. ej. «Cada 8 horas»), `duration_days` (int nullable), `is_continuous` (bool), `quantity` (int, **la escribe el médico**), timestamps.
- Regla: `duration_days` obligatorio salvo `is_continuous`.

## Paso 2 — Guardar y editar
- Ruta para guardar/actualizar la receta del turno (solo el médico del turno, regla del Prompt 14).
- **Editable hasta el alta**; después del alta (existe `discharge` del turno) queda de solo lectura (403 al intentar modificar).
- **Bloqueo por alergia**: si el texto de un medicamento coincide (sin mayúsculas ni tildes) con alguna palabra de las alergias del paciente, se marca la fila en rojo, se muestra el aviso del diseño («Paciente alérgico(a) a … Los medicamentos relacionados se marcarán en rojo y no se podrá guardar la receta.») y **no se puede guardar** — y el backend también lo rechaza.

## Paso 3 — Pestaña Receta (según el diseño)
Tabla Medicamento / Vía / Dosis / Frecuencia / Duración (días o **Continuo**) / **Cantidad**, eliminar fila, «+ Agregar medicamento», «Indicaciones generales», estado «Sin guardar / Guardado», botones **Guardar receta** e **Imprimir receta** (Imprimir habilitado solo con la receta guardada). Reemplaza `RecetaTab.tsx` y que ningún archivo pase de ~250 líneas.

## Paso 4 — Documento imprimible (tamaño carta, según el diseño)
Encabezado de la clínica (logo, nombre, RNC, teléfono, dirección — toma los datos de `config/cemerog.php` o crea las claves si faltan), Paciente, Edad · Sexo, **Alergias en rojo**, Fecha, No. de atención; bloque **Rx** numerado con medicamento en negrita, «Cant.: N» y la instrucción **redactada** a partir de los campos («Tomar 1 tableta por vía oral cada 12 horas durante 7 días.»; si es continuo: «… de forma continua.»); Indicaciones; «Próxima cita: ____»; firma con el nombre del médico. CSS de impresión (`@media print`) que oculte el resto de la app. Ruta propia (p. ej. `/consulta/recetas/{prescription}/imprimir`) accesible a médicos (y desde el historial).

**Acceso a la impresión.** El middleware `attend-patients` (PR #25) deja pasar **cualquier `GET`** a quien tenga `module.consulta.access`, aunque no tenga médico activo; así puede mostrar el estado vacío de Consulta. Por eso la ruta de impresión debe comprobar **ella misma** `$user->canAttendPatients()` y responder 403 si es falso. Agrega un test Pest: usuario `medico` sin médico activo → 403 al imprimir.

## Paso 5 — Historial
- La entrada de la consulta en el historial muestra un enlace **«Ver receta»** que abre el detalle (medicamentos e indicaciones) con botón **Imprimir**.
- Activa el filtro **«Recetas»** del historial (según el diseño).
- Cualquier médico ve recetas de otros médicos (solo lectura). Divide `HistorialPanel` si pasa de ~250 líneas.

## Tests
- Pest: crear/editar receta; editar tras el alta → 403; médico ajeno → 403; medicamento que coincide con alergia → 422; `duration_days` obligatorio salvo continuo; una receta por turno; la ruta de impresión devuelve los datos correctos.
- Vitest: agregar/quitar filas; «Continuo» deshabilita días; alerta y bloqueo por alergia; Imprimir deshabilitado sin guardar; redacción de la instrucción («Tomar 1 tableta por vía oral cada 12 horas durante 7 días.»); «Ver receta» en el historial.

## Antes de abrir el PR
7 comandos con **código 0**. Salida real en el PR. No incluyas capturas.
