# Prompt para Claude Code — Saneamiento de CEMEROG (24/10/2026)

> **Antes de pegarlo:** completa las dos decisiones de abajo (borra la opción que no aplique).
> Pega todo lo que está debajo de la línea en Claude Code, en la raíz del repo, con `main` actualizado (`git pull`).

---

Vas a sanear el repositorio CEMEROG después de varios commits que dejaron errores. **No agregues funcionalidades nuevas.** Lee primero `CLAUDE.md`, `docs/TESTING.md` y `docs/DECISIONS.md` y síguelos.

## Decisiones ya tomadas (no las cambies ni preguntes)

- **DECISIÓN A — Datos en producción:**
  - (A1) No hay pacientes reales en producción. Se puede hacer `php artisan migrate:fresh --seed` en local y simplificar el cifrado.
  - (A2) Sí hay pacientes reales en producción. Nada puede requerir `migrate:fresh`; toda corrección de datos va en migraciones seguras e idempotentes.
- **DECISIÓN B — Soft deletes de pacientes:**
  - (B1) Restaurarlos: un expediente clínico nunca se borra físicamente.
  - (B2) Dejarlos eliminados, como están ahora.

## Reglas de trabajo (obligatorias)

1. Crea una rama por fase desde `main` actualizado: `fix/fase-1-pacientes-en-blanco`, `fix/fase-2-checks`, etc. **Nunca hagas commit directo a `main` ni mezcles tú los PR.**
2. Commits pequeños, uno por cambio lógico, con mensaje en español con formato `tipo(alcance): descripción`.
3. TDD: en cada bug, primero escribe el test que falla, demuéstralo y después corrige.
4. Antes de dar por terminada una fase, corre **todo** esto y pega la salida resumida en tu reporte:
   ```bash
   vendor/bin/pint --test
   vendor/bin/phpstan analyse --level=6
   vendor/bin/pest
   npm run types:check
   npm run lint
   npm run test
   npm run build
   ```
   Si algo queda en rojo, la fase no está terminada.
5. **Prohibido:**
   - Tocar `design/`.
   - Instalar dependencias.
   - Crear migraciones que esta tarea no pida.
   - Silenciar errores con `as any`, `as unknown as`, `@ts-ignore`, `eslint-disable` o `@phpstan-ignore`.
   - Borrar o saltar tests.
   - Cambiar el diseño visual (salvo en la fase 5, y ahí sin diferencias visibles).
6. Al terminar cada fase, **detente**. Reporta qué cambiaste, los archivos tocados y la salida de los checks, y espera mi confirmación antes de seguir con la siguiente.

---

## Fase 1 — Bug: `/pacientes` sale en blanco

**Síntoma.** Al entrar a `/pacientes` sin parámetros en la URL, la página queda en blanco. En consola aparece:
`Uncaught TypeError: Array.prototype.filter called on null or undefined at PacientesIndex (index.tsx)`.

**Causa.** En `PacientesController::index` se manda `'filters' => $request->only(['q', 'filter', 'sort'])`. Si no hay parámetros, PHP devuelve un array vacío, que llega al frontend como JSON `[]` y no como objeto. Entonces `filters.filter` no es `undefined`: es la función `Array.prototype.filter`. `useState(filters.filter ?? 'todos')` recibe esa función, React la ejecuta como inicializador y explota.

**Qué hacer:**
1. **Test Pest** (`tests/Feature/Pacientes/PacientesIndexTest.php`): un GET a `/pacientes` sin parámetros devuelve `filters` con las claves `q`, `filter` y `sort` y sus valores por defecto (`''`, `'todos'`, `'ultima_atencion'`). Debe fallar antes del arreglo.
2. **Test Vitest**: renderiza `PacientesIndex` con `filters` vacío y verifica que no lanza error y que el segmento activo es "Todos".
3. **Backend:** devuelve siempre un objeto con las tres claves y sus valores por defecto. Valida `filter` y `sort` contra los valores permitidos; si llega algo inválido, usa el valor por defecto.
4. **Frontend:** tipa `filters` con valores requeridos según el contrato nuevo. Nunca pases a `useState` un valor que pueda ser una función.
5. Busca en `app/Http/Controllers` cualquier otro prop que pueda llegar como `[]` cuando el frontend espera un objeto (`$request->only`, `->toArray()` de colecciones vacías usadas como mapa, etc.). Corrige y prueba cada caso.

## Fase 2 — Checks en verde

1. Corrige los errores de TypeScript **de verdad**, no con casts:
   - `resources/js/pages/pacientes/index.tsx`: el cast de `page.props` a `Props` en `onSuccess`. Tipa la respuesta correctamente, por ejemplo con el genérico de `usePage`/`router` o leyendo solo `selected`.
   - `resources/js/pages/registro/index.tsx`: `errors.open_turn` no está en el tipo del formulario. Agrega `open_turn` a los errores esperados de forma tipada.
   - `resources/js/pages/registro/index.tsx`: la comparación `data.document_type === 'no_tiene'` dentro de la rama de `'cedula'` es código muerto. Elimínala y deja el `disabled` en la rama correcta si hace falta.
   - Cualquier otro error que muestre `npm run types:check`, salvo los de módulos generados por Wayfinder, que se arreglan corriendo `php artisan wayfinder:generate --with-form`.
2. **Carpeta de diseño duplicada:** `design_handoff_cemerog/` es idéntica a `design/`. Elimina `design_handoff_cemerog/` y quita de `CLAUDE.md` el párrafo que la menciona. `design/` es la única referencia.
3. Corre `npm run check:fix` y `vendor/bin/pint` **en un commit aparte que solo contenga formato**.
4. **Bug de edad en Registro:** la edad del panel "Resumen" se calcula restando solo años, así que se equivoca antes del cumpleaños. Usa `differenceInYears` de `date-fns` y agrega un test.

## Fase 3 — Cifrado PII y migraciones

Contexto: el commit `aebd24c` agregó un mutador `phone()` que cifraba con `encrypt()` mientras seguía el cast `'phone' => 'encrypted'`. Eso produjo doble cifrado y un 500. El commit `5675a00` lo parchó con `App\Support\Pii::decrypt`, que tolera 3 formatos, y con una migración irreversible de normalización.

**Si la DECISIÓN A es A1 (sin datos reales):**
1. Simplifica `Pii::decrypt` a un único formato (`Crypt::decryptString`). Elimina la detección de formatos serializados y de doble cifrado.
2. Elimina la migración `2026_10_24_200000_normalize_patient_pii_encryption.php` y su test.
3. En `2026_10_24_100001_add_phone_hash_to_patients.php`, deja solo la creación de la columna e índice. Quita el backfill con `decrypt()`, porque usa un formato que ya no existe.
4. Ajusta `PiiTest` y `PatientPiiTest` al formato único. Corre `php artisan migrate:fresh --seed` y verifica a mano `/pacientes`, la búsqueda por teléfono y cédula, y el registro de un paciente nuevo.

**Si la DECISIÓN A es A2 (hay datos reales):**
1. Conserva la tolerancia de `Pii::decrypt` y la migración de normalización.
2. Agrega un test que demuestre que, después de la migración, todas las filas quedan en formato `encryptString`.
3. Documenta en `docs/DECISIONS.md` por qué existe la tolerancia y cuándo se podrá eliminar.
4. Cambia el `down()` vacío por un comentario explícito de que es irreversible, y agrega un test que ejecute `down()` sin errores.

**En ambos casos:**
- Agrega los **tests de reversión** que exige `CLAUDE.md` (migración `up` → `down` → `up` sin errores) para `2026_10_24_100000_remove_soft_deletes_from_patients.php` y `2026_10_24_100001_add_phone_hash_to_patients.php`. Usa como modelo `tests/Feature/Database/`.
- Verifica que ningún modelo combine un cast `encrypted` con un `Attribute` sobre la misma columna. Agrega un test que lo compruebe para `Patient`.

## Fase 4 — Soft deletes de pacientes

**Si la DECISIÓN B es B1 (restaurar):**
1. Crea una migración nueva (no edites la anterior) que agregue `deleted_at` a `patients`, con su test de reversión.
2. Vuelve a poner `SoftDeletes` en `Patient`.
3. Revisa que las búsquedas, `/pacientes`, Registro, Citas y Tablero excluyan los pacientes eliminados, con un test por cada uno.
4. **No** restaures `is_active` salvo que algún código lo use.
5. Documenta la decisión en `docs/DECISIONS.md`.

**Si la DECISIÓN B es B2 (dejarlos eliminados):** solo documenta en `docs/DECISIONS.md` por qué se eliminaron y que no existe ruta para borrar pacientes. El test `DeleteRouteRemovedTest` ya lo cubre.

## Fase 5 — Documentación y regla de estilos

1. **`CLAUDE.md`:**
   - Corrige el stack a las versiones reales de `composer.lock` y `package.json`: Laravel 13, Inertia 3, PHP 8.4. Revisa y corrige también `README.md`.
   - Agrega a "Lo que NO hacer":
     - "No escribir colores hex ni `style={{…}}` en `resources/js/pages/`; usar tokens de Tailwind (`bg-primary`, `border-border`, etc.) y componentes de `components/cemerog/`."
     - "No hacer commits de más de ~400 líneas de código de producción; dividir en PRs."
2. Revisa que `docs/MODULES.md` y `docs/DECISIONS.md` reflejen el estado real tras las fases anteriores.

## Fase 6 — Piloto: Pacientes y Registro con tokens y componentes

Objetivo: que `resources/js/pages/pacientes/index.tsx` y `resources/js/pages/registro/index.tsx` no tengan **ningún** color hex ni `style={{}}`, **sin cambio visual**.

1. Revisa `resources/css/app.css`; ya existen `--color-primary`, `--accent`, etc. Agrega en `@theme` solo los tokens que falten para los valores del `design/README.md`. Ejemplos: fondo de app `#F3F7F2`, borde de card `#e3e9e3`, encabezado de tabla `#F6FAF1`/`#56693f`, acento de marca `#8CC63F`, error `#b91c1c`/`#fef2f2`/`#fecaca`, y los colores de los estados de atención. Usa nombres semánticos (`bg-app`, `border-card`, `text-table-head`…), no nombres de color.
2. Reemplaza los hex y los estilos inline de esas dos páginas por esos tokens y por los componentes de `components/cemerog/`: `Panel`, `DataTable`, `FormField`, `SegmentedControl`, `StatusBadge`, `EmptyState`. Si un componente no cubre un caso, extiéndelo con su test en vez de duplicar markup.
3. Divide las páginas si pasan de ~400 líneas. Por ejemplo, saca `DetailPanel` de Pacientes y las tarjetas "Datos del paciente", "Nueva atención" y "Resumen" de Registro a `resources/js/pages/<modulo>/components/`.
4. **Verificación visual:** toma capturas de `/pacientes`, del panel lateral abierto y de `/registro` (paciente nuevo y paciente existente) **antes y después**, con los mismos datos del `DemoSeeder`, y compáralas. Reporta cualquier diferencia.
5. Agrega un test (Vitest o un script en `tests/`) que falle si aparecen colores hex o `style={{` en `pacientes/` o `registro/`. Esta lista de carpetas se ampliará módulo por módulo.
6. Al final, entrega una tabla con el conteo actual de hex y `style={{` por módulo y un orden recomendado para migrar el resto, **un módulo por PR**. **No migres otros módulos en esta tarea.**

---

**Entregable final:** un PR por fase, cada uno con descripción, lista de cambios, salida de los checks y, en la fase 6, las capturas antes/después.
