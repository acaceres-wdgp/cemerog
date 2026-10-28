# Prompt 01 — Citas: migrar a tokens y componentes (sin cambio visual)

> Pégalo en Claude Code en la raíz de `cemerog`, con `main` actualizado (`git checkout main && git pull`).

---

Vas a refactorizar el módulo **Citas** (`resources/js/pages/citas/index.tsx`, ~1.750 líneas) para que use los tokens de diseño y los componentes de CEMEROG. **Es un refactor puro: cero cambios de comportamiento, cero cambios visuales y cero cambios en el backend.** Lee primero `CLAUDE.md` y síguelo.

## Reglas

1. Trabaja en la rama `refactor/citas-tokens`, creada desde `main`. **No hagas commit directo a `main` ni mezcles el PR.**
2. Commits pequeños, en este orden, cada uno dejando todo en verde:
   1. Tests de caracterización (ver abajo).
   2. Extracción de subcomponentes a archivos propios, sin tocar estilos.
   3. Reemplazo de colores hex y estilos inline por tokens y componentes.
3. **Prohibido:**
   - Tocar `design/` o archivos fuera de `resources/js/pages/citas/`, `resources/js/components/cemerog/`, `resources/css/app.css` y `resources/js/__tests__/`.
   - Instalar dependencias.
   - Cambiar props que llegan del backend o rutas.
   - Usar `as any`, `@ts-ignore` o `eslint-disable`.
   - Borrar o saltar tests.
4. Antes de abrir el PR, todo debe terminar con código de salida 0. Pega la salida resumida en la descripción del PR:
   ```bash
   vendor/bin/pint --test
   vendor/bin/phpstan analyse --level=6
   vendor/bin/pest
   npm run types:check
   npm run lint
   npm run test
   npm run build
   ```

## Paso 1 — Tests de caracterización (antes de tocar nada)

Crea `resources/js/__tests__/citas-index.test.tsx` y fija el comportamiento actual de la página:
- Renderiza la lista de citas del día con los datos de ejemplo (paciente, hora, médico y estado).
- La navegación de fecha (hoy, mañana, anterior y siguiente) llama a `router.get` con la fecha correcta.
- Abrir "Nueva cita" muestra el modal. La búsqueda de paciente (`PatientSearch`) consulta el endpoint con 3 o más caracteres y no lo hace con menos.
- Enviar el modal con datos válidos llama a `post` con el payload esperado.

Estos tests deben pasar **antes y después** del refactor sin modificarse. Si al refactorizar necesitas cambiarlos, detente y explícame por qué.

## Paso 2 — Partir el archivo

Mueve a `resources/js/pages/citas/components/`:
- `PatientSearch.tsx`
- `NuevaCitaModal.tsx`
- Cualquier bloque de la página principal que pase de ~150 líneas, como la lista o tabla de citas y la cabecera con la navegación de fecha.

Mueve a `resources/js/pages/citas/lib/dates.ts` los helpers de fecha (`todayStr`, `tomorrowStr`, `addDays`, `formatDateLong`) y la constante `SLOTS`, con tests unitarios. Si `date-fns` ya resuelve alguno, úsalo.

**Meta:** `citas/index.tsx` por debajo de ~400 líneas, y ningún archivo nuevo por encima de ~400.

## Paso 3 — Tokens y componentes

1. Reemplaza **todos** los colores hex por los tokens que ya existen en `resources/css/app.css`. La correspondencia más común:

   | hex | token |
   |---|---|
   | `#eef0ec` | `divider` |
   | `#71717a` | `muted` |
   | `#1f2d22` | `text-heading` |
   | `#8a948e` | `text-tertiary` |
   | `#e3e9e3` | `card-border` |
   | `#e4e4e7` | `input-border` |
   | `#f3f7f2` | `app-bg` |
   | `#eef6e2` | `accent-bg` |
   | `#56693f` | `table-header-text` |
   | `#f6faf1` | `table-header-bg` |
   | `#b91c1c` | `error` |
   | `#2e8b3e` | `primary` |
   | `#f4f4f5` | `muted-bg` |

2. Para los colores sin token, agrégalo en `@theme` con nombre **semántico** según su uso. Ejemplos: `#f6f9f5`/`#dfe7df` son el fondo y el borde del botón secundario (`secondary-bg`, `secondary-border`), y `#52525b` es texto apagado. No crees dos tokens con el mismo valor.
3. Para los colores de estado de cita (`#fef3c7`/`#92400e`, `#dbeafe`/`#1e40af`, `#fce7f3`…), usa `StatusBadge` o las clases `.state-*` que ya existen en `app.css`. Si `StatusBadge` no cubre algún estado de cita, extiéndelo con su test en `components/cemerog/__tests__/`.
4. Usa los componentes existentes donde encajen: `PageHeader`, `Panel`, `FormDialog` (para el modal), `FormField`, `EmptyState` y `SegmentedControl`. **No dupliques markup que ya exista en un componente.**
5. Elimina los `style={{…}}`. Solo se permiten para valores calculados en tiempo de ejecución, y cada uno debe llevar un comentario de una línea que explique por qué.
6. Agrega `citas/index.tsx` y todos los archivos de `citas/components/` a `CLEAN_PAGES` en `resources/js/__tests__/no-hardcoded-hex.test.ts`. Si el test solo acepta rutas fijas, amplíalo para que acepte un directorio completo.

## Paso 4 — Verificación visual

Con `php artisan migrate:fresh --seed` y el `DemoSeeder`, toma capturas **antes** (en `main`) y **después** (en tu rama) de:
- `/citas` del día con citas;
- un día sin citas (estado vacío);
- el modal "Nueva cita" abierto, con un paciente buscado.

Guárdalas en `docs/screenshots/citas/` (antes y después) y compáralas. Reporta en el PR cualquier diferencia, por pequeña que sea, y corrígela si no es intencional.

## Entregable

Un PR hacia `main` que incluya:
- un resumen de los commits;
- el conteo antes y después: líneas de `index.tsx`, hex y `style={{` en `citas/`;
- la lista de tokens nuevos agregados a `app.css`;
- las capturas;
- la salida de los 7 comandos.

**No lo mezcles**: lo reviso yo.
