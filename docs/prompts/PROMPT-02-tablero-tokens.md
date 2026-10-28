# Prompt 02 — Tablero: migrar a tokens y componentes (sin cambio visual)

> Pégalo en Claude Code en la raíz de `cemerog`, con `main` actualizado (`git checkout main && git pull`).

---

Vas a refactorizar el módulo **Tablero de atenciones** (`resources/js/pages/tablero/index.tsx`, 1.784 líneas, 140 colores hex). Sigue el mismo modelo que se usó en **Citas** (PR #8, ya mezclado): revisa `resources/js/pages/citas/` y cópiale la estructura y las convenciones.

**Es un refactor puro: cero cambios de comportamiento, cero cambios visuales y cero cambios en el backend.** Lee primero `CLAUDE.md` y síguelo.

## Reglas

1. Trabaja en la rama `refactor/tablero-tokens`, creada desde `main`. Abre un PR. **No hagas commit a `main` ni mezcles el PR.**
2. Haz commits pequeños, en el orden de los pasos de abajo. Cada uno debe dejar los tests en verde, salvo el del paso 4, que falla a propósito.
3. Solo puedes tocar:
   - `resources/js/pages/tablero/`
   - `resources/js/pages/citas/`, solo para el paso 3
   - `resources/js/components/cemerog/`
   - `resources/css/app.css`
   - `resources/js/__tests__/`
4. **Prohibido:**
   - Tocar `design/`, `components/ui/` o el backend.
   - Instalar dependencias.
   - Usar `as any`, `@ts-ignore` o `eslint-disable`.
   - Borrar o saltar tests.
   - Mover colores a `style={{ color: 'var(--color-…)' }}`. Eso no cuenta como migrar.

## Paso 1 — Tests de caracterización (antes de tocar nada)

Crea `resources/js/__tests__/tablero-index.test.tsx` con el mismo estilo que `citas-index.test.tsx` y fija el comportamiento actual:
- Muestra los turnos con número, paciente, médico y estado (`espera` / `en_consulta`), y los contadores de cada pestaña.
- Las pestañas de turnos (todas, en espera, en consulta) filtran bien.
- Las pestañas de citas del día filtran bien, y una cita con `has_turn` no aparece como pendiente.
- "Llamar siguiente", o la acción equivalente, hace `router.patch` al turno correcto con el estado correcto.
- Subir y bajar un turno hace `router.patch` con la dirección correcta.
- "Asignar turno" desde una cita hace `router.post` con el payload correcto.
- "Marcar no asistió" hace `router.patch` correctamente.
- El modal "Agregar turno" (walk-in) se abre y se cierra. Con un paciente y un médico elegidos, envía `router.post` con el payload correcto. Sin paciente o sin médico, muestra los errores de validación.
- El buscador de pacientes del modal no consulta con menos de 2 caracteres y sí con 2 o más.

**Estos tests no pueden cambiar de lógica después de este commit.** Si alguno necesita cambiar, detente y explícame por qué.

## Paso 2 — Partir el archivo

Mueve el código a `resources/js/pages/tablero/`, siguiendo la estructura de Citas:
- `components/`
- `lib/`
- `types.ts`

Saca a componentes, como mínimo:
- `AgregarTurnoModal`;
- la lista o tabla de turnos y sus filas;
- el panel de citas del día;
- la barra de pestañas y acciones;
- cualquier bloque de más de ~150 líneas.

**Meta:** `index.tsx` por debajo de ~150 líneas y ningún archivo por encima de ~250.

## Paso 3 — Un solo `PatientSearch` compartido

`tablero` tiene su propio `PatientSearch`, prácticamente igual a `citas/components/PatientSearch.tsx`; ambos usan `/citas/pacientes/buscar`.

1. Muévelo a `resources/js/components/cemerog/PatientSearch.tsx`. El endpoint debe ser una prop, idealmente una ruta de Wayfinder.
2. Agrega su test en `components/cemerog/__tests__/PatientSearch.test.tsx`.
3. Haz que **Citas y Tablero** usen el componente compartido.
4. Elimina las copias.

Los tests de caracterización de Citas y Tablero deben seguir pasando sin cambios de lógica.

## Paso 4 — Test anti-hex para Tablero

Agrega `'tablero/'` a la lista del test `resources/js/__tests__/no-hardcoded-hex.test.ts`, que ya admite directorios y detecta `style={{`.

Este commit **debe fallar**, porque todavía quedan hex. Así se demuestra que el test funciona. Haz el commit y continúa.

## Paso 5 — Tokens y componentes

1. Reemplaza los hex por los tokens de `resources/css/app.css`. Casi todos ya existen desde Citas: `divider`, `muted`, `text-heading`, `primary`, `card-border`, `text-dim`, `secondary-bg`, `secondary-border`, `secondary-fg`, `input-border`, `app-bg`, `accent-bg`, `error`, `text-tertiary`, `table-header-text`, `table-header-bg`, `list-row-bg`, `row-separator`, `cita-atendida-*`, `overlay`…
   - **Antes de crear un token, busca si ya existe uno con el mismo valor.** Si hay que crear uno, dale un nombre semántico.
2. Estados de turno (`espera`, `en_consulta`) y de cita: usa `StatusBadge`. Los estados `espera`, `consulta` y `cita-*` ya existen. Si falta alguno, agrégalo con su test. **El aspecto debe ser exactamente el actual**; ojo con el borde, que fue el error en Citas.
3. Modal "Agregar turno": usa `FormDialog`, que ya reproduce el aspecto del modal original.
4. Tarjetas: usa `Panel` si reproduce el aspecto actual.
5. **Cero `style={{` estáticos**, todo a clases de Tailwind. Solo se permiten valores calculados en tiempo de ejecución, como la paleta de avatar por médico; reutiliza `citas/lib/palettes.ts` (o muévelo a `lib/` si lo usan ambos). Cada uno lleva en la línea anterior el comentario `// dynamic-style: <motivo>`.
6. Si un componente de `components/cemerog/` no reproduce el aspecto exacto, ajusta el componente con una prop nueva y su test, o deja el markup con clases y justifícalo en el PR. **Nunca cambies el aspecto.**

## Antes de abrir el PR

Corre los 7 comandos. **Cada uno debe terminar con código de salida 0.** En el proyecto, los avisos del lint cuentan como fallo, así que verifícalo con `npm run lint; echo $?`.
```bash
vendor/bin/pint --test
vendor/bin/phpstan analyse --level=6
vendor/bin/pest
npm run types:check
npm run lint
npm run test
npm run build
```

Y estos dos deben dar **0**:
```bash
grep -rn "style={{" resources/js/pages/tablero | wc -l   # solo cuentan los que no llevan // dynamic-style:
grep -rnE "#[0-9a-fA-F]{3,6}\b" resources/js/pages/tablero --include=*.tsx | wc -l
```

## Descripción del PR

- Un resumen por commit.
- Tabla antes / después: líneas de `index.tsx`, número de archivos, hex, `style={{` estáticos y dinámicos. **Pon números reales, medidos con los comandos de arriba.**
- Componentes de CEMEROG usados y cuáles no, con el motivo.
- Tokens nuevos, si los hay.
- La salida **real** de los 7 comandos, con el código de salida.
- **No incluyas capturas**: la comparación visual la hago yo.

No mezcles el PR.
