# Prompt 18b — Ajustes al PR #34 (cuenta del día, cargos y honorarios)

> Pégalo en Claude Code en la raíz de `cemerog`.

---

Trabaja en la misma rama del PR #34 (`git checkout feat/cuenta-cargos && git pull`). Sube los commits al mismo PR y **no lo mezcles**. Sigue `CLAUDE.md` y la sección «Lecciones de los PR anteriores» del prompt 18. Un commit por punto, empezando por el test que falla.

## 1. Turno «No asistió»: la cuenta queda abierta y con el cobro de una consulta que no se dio (bloqueante)

Al registrar la atención se agrega el cargo de consulta. Pero si después el turno se marca `no_asistio` (`TurnosController::updateStatus`), el cargo sigue en la cuenta y la cuenta nunca se cierra, porque solo el alta la cierra.

- Al pasar un turno a `no_asistio`, elimina el cargo de consulta **de ese turno**, en la misma transacción.
- Si al paciente no le quedan turnos abiertos ese día, la cuenta pasa a `pendiente_facturar` si todavía tiene cargos, o a `anulada` si quedó vacía (con `closed_at`).
- Extrae a una acción (por ejemplo `CloseDailyAccountIfDone`) la lógica de «cerrar la cuenta si no quedan turnos abiertos», y úsala en el alta y aquí.
- **Tests (Pest):**
  - un solo turno marcado `no_asistio` → sin cargos y cuenta `anulada`;
  - dos turnos, uno `no_asistio` y el otro dado de alta → cuenta `pendiente_facturar` con **un** cargo;
  - `no_asistio` con otro turno todavía abierto → cuenta `abierta`.

## 2. El bloqueo de concurrencia no bloquea

`GetOrOpenDailyAccount` hace `lockForUpdate()` sobre una cuenta que **todavía no existe**: no hay fila que bloquear, así que dos registros simultáneos pueden crear dos cuentas. Lo mismo pasa con la verificación de «turno abierto» de `RegisterArrival`. El test «concurrent arrivals» llama dos veces seguidas a la acción, así que no prueba concurrencia.

- Al inicio de la transacción de `RegisterArrival`, cuando el paciente ya existe, bloquea **la fila del paciente**: `Patient::whereKey($patient->id)->lockForUpdate()->first()`. Esto serializa la verificación de turno abierto y la cuenta del día. Haz lo mismo dentro de `GetOrOpenDailyAccount`.
- Renombra el test a lo que de verdad prueba («una segunda atención el mismo día reutiliza la cuenta abierta») y explica en un comentario que la concurrencia real no se puede probar con SQLite.

## 3. Hex y `style={{` nuevos en Doctores

Los campos «Precio de consulta» y «Honorario por consulta» de `resources/js/pages/doctores/index.tsx` traen `style={{…}}` con `#b91c1c` y `#e4e4e7`. `CLAUDE.md` y el prompt lo prohíben, aunque esa página todavía no esté migrada a tokens.

- Usa `FormField` (con prefijo `RD$` si lo soporta, o un `span` con tokens) y las clases de error de la librería. Nada de hex ni `style={{` en el código nuevo.
- **Test (Vitest):** con `errors.consultation_fee`, el mensaje aparece en el formulario.

## 4. Fechas de las migraciones

Las tres migraciones tienen fecha `2026_10_27`, **anterior** a migraciones que ya están en `main` (`2026_10_30_000002_create_prescription_items_table`). Es justo lo que pedía evitar la sección de lecciones. Renómbralas con la fecha de hoy, posterior a esa, y ajusta las rutas de sus tests de reversión. Confirma con `git status` que las viejas quedaron **borradas en el commit**.

## Antes de subir

Los 7 comandos deben terminar con **código 0**. Pega en la descripción del PR la salida **real**, con el código de salida de `npm run lint`. En local, después de renombrar las migraciones: `php artisan migrate:fresh --seed`. No lo mezcles.
