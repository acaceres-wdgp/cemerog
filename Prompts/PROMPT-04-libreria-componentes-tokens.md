# Prompt 04 — Librería `components/cemerog/`: tokens (sin cambio visual)

> Pégalo en Claude Code en la raíz de `cemerog`, después de `git checkout main && git pull`. Hazlo **después** de mezclar el PR del Prompt 03.

---

Los componentes compartidos de `resources/js/components/cemerog/` todavía tienen colores hex. Son unos 180 en total; los que más tienen son `StatusBadge` (45), `ClinicalHistoryList` (24), `DataTable` (23), `AlertBanner` (12), `FormField` (11), `PasswordInput` (11), `TriageBadge` (10), `SegmentedControl` (9), `FilterChips` (8) y `VitalsGrid` (8). Migra **toda la librería** a tokens. **Cero cambios visuales**: estos componentes se usan en Pacientes, Citas, Tablero, Consulta, Inicio, Caja, Internamiento, login y otras páginas. Lee `CLAUDE.md`.

## Reglas
- **Rama:** créala desde `main` **recién actualizado**, con el nombre `refactor/libreria-tokens`. Abre un PR y **no lo mezcles**.
- **Archivos que puedes tocar:** solo `resources/js/components/cemerog/` (incluidos sus `__tests__/`), `resources/css/app.css` y `resources/js/__tests__/no-hardcoded-hex.test.ts`.
- **Prohibido:**
  - Cambiar la API (props) de un componente.
  - Tocar páginas, el backend o `components/ui/`.
  - Mover colores a `style={{ color: 'var(--…)' }}`.
  - Instalar dependencias.
  - Usar `as any`, `@ts-ignore` o `eslint-disable`.

## Commits
1. **Tests que fijan los colores actuales.** Agrega tests a los componentes que no los tengan, sobre todo los de estados. Cada test debe verificar, por estado o variante, la etiqueta y que se aplica la clase o el color correcto. Por ejemplo:
   - `StatusBadge`: todos sus estados.
   - `TriageBadge`: los niveles I–V.
   - `AlertBanner`: sus variantes.
2. **Ampliar el test anti-hex** para que también revise `components/cemerog/`, excepto `palettes.ts`, que es la paleta dinámica de avatares. Debe fallar en este commit.
3. **Componentes de estado** (`StatusBadge`, `TriageBadge`): mueve los colores de cada estado a tokens con nombre semántico en `app.css`.
   - `app.css` ya tiene clases `.state-*` y variables `--triage-*`; **reutilízalas o consolídalas, no dupliques**.
   - Los colores de estado y triaje están definidos en `design/README.md` (tablas "Estados de la atención" y "Triaje"); los valores deben coincidir.
4. **El resto de componentes**, uno o dos por commit: hex y `style={{` estáticos a clases con tokens existentes. Antes de crear un token, busca si ya existe uno con el mismo valor.
5. **Página de muestra.** Verifica la página `resources/js/pages/dev/components.tsx`, si existe una ruta para verla, y menciona en el PR cómo abrirla.

## Antes de abrir el PR
- Los 7 comandos deben terminar con **código 0**. Comprueba el lint con `npm run lint; echo $?`:
  ```bash
  vendor/bin/pint --test && vendor/bin/phpstan analyse --level=6 && vendor/bin/pest
  npm run types:check && npm run lint && npm run test && npm run build
  ```
- Este comando debe dar **0**:
  ```bash
  grep -rnE "#[0-9a-fA-F]{3,6}\b" resources/js/components/cemerog --include=*.tsx | wc -l
  ```
- En la descripción del PR incluye:
  - una tabla por componente, antes/después;
  - los tokens nuevos;
  - qué clases o variables de `app.css` se consolidaron;
  - la salida de los comandos.
- No incluyas capturas: la comparación visual la hago yo.
