# Prompt 17b — Ajustes al PR #31 (receta)

> Pégalo en Claude Code en la raíz de `cemerog`.

---

Trabaja en la misma rama del PR #31 (`git checkout feat/receta && git pull`). Sube los commits al mismo PR y **no lo mezcles**. Sigue `CLAUDE.md`. Un commit por punto, empezando por el test que falla.

## 1. Guardar e imprimir no funcionan en la app real (bloqueante)

Hay tres fallos que los tests no detectan, porque simulan `fetch` con una respuesta inventada:

- `store` responde `{ message: 'Receta guardada.' }` **sin `id`**. Por eso `savedPrescriptionId` nunca se llena: **Imprimir no se habilita nunca**, y el segundo guardado hace otro `POST`, que falla con «Este turno ya tiene una receta registrada.».
- El backend **nunca envía** la prop `prescriptions` que lee `consulta/index.tsx`. Al recargar la página o volver al turno, la receta guardada no aparece.
- Se usa `fetch` con el token XSRF armado a mano, en vez de Inertia como en el resto de la app.

Corrígelo así:

- `store` y `update` responden con **redirect back** y `Toast::success`, como `ConsultaController::store`. Nada de `JsonResponse`.
- `RecetaTab` guarda con `router.post` / `router.put`, usando las rutas de **Wayfinder**, y muestra los errores de validación de `errors` debajo de cada fila o campo.
- `ConsultaController::index` envía `prescriptions`: la receta (con sus items) de cada turno de la cola del médico, indexada por `turn_id`.
- Imprimir se habilita cuando existe la receta del turno y no hay cambios sin guardar.
- **Tests (Pest):** `GET /consulta` incluye la receta guardada del turno. Guardar dos veces seguidas (crear y luego editar) deja **una** receta con los items nuevos.
- **Tests (Vitest):** con `prescriptions[turn.id]` en las props, las filas aparecen cargadas e Imprimir está habilitado. Guardar llama a `router.post` la primera vez y a `router.put` si ya existe. Quita el mock de `fetch`.

## 2. Alergias: una sola regla, sin falsos positivos

Hoy, si el campo de alergias dice «No», se bloquea cualquier medicamento que contenga «no», como **Naproxeno** o **Nolotil**. Lo mismo pasa con «N/A» u otras respuestas comunes. Además, la regla está escrita dos veces, en PHP y en TS.

- Regla:
  1. Separa las alergias por `,`, `;`, `/` y la palabra « y ».
  2. Ignora las respuestas que significan «ninguna»: `no`, `ninguna`, `ninguno`, `niega`, `n/a`, `na`, `nkda`, `no conocidas`, `no refiere`, `desconoce`, y el campo vacío.
  3. Ignora los términos de menos de 4 letras.
  4. Hay conflicto si alguna **palabra** del medicamento **empieza por** el término de alergia, sin tildes ni mayúsculas. Ejemplos: «Penicilina» bloquea «Penicilina G benzatínica»; «Sulfa» bloquea «Sulfametoxazol».
- En PHP, la regla vive en `App\Support\AllergyChecker::conflict(string $allergies, string $medication): bool`. En TS, en `resources/js/lib/allergy.ts`, con la misma firma.
- Crea un archivo de casos compartido, `tests/fixtures/allergy-cases.json` (alergias, medicamento, resultado esperado), y úsalo **en los dos lados**: en un test de Pest y en uno de Vitest. Así PHP y TS no pueden divergir. Incluye: «No» + Naproxeno → sin conflicto, «Ninguna» + Amoxicilina → sin conflicto, «Penicilina» + «penicilina g» → conflicto, «Sulfas» + Sulfametoxazol → conflicto, y tildes y mayúsculas.

## 3. Solo turnos abiertos de hoy

`store` y `update` solo revisan si hubo alta. Exige además `$turn->isOpenToday()` (403), igual que el alta. **Tests (Pest):** turno de ayer → 403; turno `atendido` → 403.

## 4. Migraciones

- Las claves foráneas `patient_id`, `doctor_id` y `created_by` usan `cascadeOnDelete`: borrar un médico o un usuario **borraría recetas**, que son registros clínicos. Usa `restrictOnDelete`, como en `discharges`.
- Las migraciones tienen fecha `2026_10_27`, **anterior** a otras que ya están en `main`, como `discharges` (`2026_10_29`). Renómbralas con la fecha de hoy para que el orden sea real. Todavía no se han desplegado, así que se puede.

## 5. Historial: detalle de la receta y filtro

El prompt 17 pedía que «Ver receta» abriera el **detalle** dentro del historial y que el filtro **«Recetas»** funcionara. Hoy «Ver receta» abre directamente la impresión con un `<Link>` de Inertia y `target="_blank"`.

- «Ver receta» muestra en el panel del historial los medicamentos, la instrucción redactada y las indicaciones, con un botón **Imprimir** que abre la impresión en otra pestaña. Usa un `<a target="_blank">` normal, no `<Link>`.
- Envía en el historial los datos de la receta que hagan falta para el detalle.
- Activa el filtro **«Recetas»**: muestra solo las atenciones que tienen receta.
- Divide `HistorialPanel.tsx` (353 líneas) y `RecetaTab.tsx` (328 líneas) para que ningún archivo pase de ~250 líneas.
- **Tests (Vitest):** el detalle muestra los medicamentos y el filtro «Recetas» oculta las atenciones sin receta.

## 6. Lint y configuración

- `npm run lint` avisa `'fireEvent' is imported but never used`. Corrígelo y confirma que `npm run lint; echo $?` imprime `0`.
- Agrega `CLINIC_NAME`, `CLINIC_RNC`, `CLINIC_PHONE` y `CLINIC_ADDRESS` a `.env.example`, con un comentario.

## Antes de subir

Los 7 comandos deben terminar con **código 0**. Pega en la descripción del PR la salida **real**, con el código de salida de `npm run lint`. Prueba en Herd: guardar la receta → Imprimir se habilita → recargar la página → la receta sigue ahí → editarla y guardar. No lo mezcles.
