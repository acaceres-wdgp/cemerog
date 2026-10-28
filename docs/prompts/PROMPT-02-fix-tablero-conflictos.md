# Prompt 02-fix — Tablero: actualizar el PR #9 con `main` y corregir

> Pégalo en Claude Code en la raíz de `cemerog`.

---

El PR #9 (`refactor/tablero-tokens`) **se creó desde un `main` viejo** (`8af456e`), anterior a la mezcla del refactor de Citas (PR #8, `5470bea`). Por eso tiene conflictos en 3 archivos y rehace sobre el `citas/index.tsx` monolítico un trabajo que ya está en `main`. Lee `CLAUDE.md`.

## Reglas

- Trabaja en la misma rama: `git checkout refactor/tablero-tokens && git pull`.
- Trae `main` con **merge**, no con rebase ni force-push: `git fetch origin && git merge origin/main`.
- Sube los commits al mismo PR #9. **No lo mezcles.**
- **Prohibido:**
  - Cambiar la lógica de `citas-index.test.tsx` o de `tablero-index.test.tsx`.
  - Tocar el backend o `components/ui/`.
  - Instalar dependencias.
  - Usar `as any`, `@ts-ignore` o `eslint-disable`.

## 1. Resolver los conflictos

- **`resources/js/pages/citas/index.tsx`:** quédate con la versión de `main`, de 86 líneas, que usa `citas/components/`. Descarta los cambios de esta rama sobre ese archivo.
- **`resources/css/app.css`:** `main` ya tiene `secondary-bg`, `secondary-fg`, `secondary-border`, `text-dim`, `list-row-bg`, `cita-atendida-bg`, `cita-atendida-fg` y `overlay`, entre otros. **No dupliques tokens:** deja una sola definición de cada uno, con el valor de `main`. Si un token nuevo de esta rama tiene el mismo valor que uno existente, elimínalo y usa el existente.
- **`resources/js/__tests__/no-hardcoded-hex.test.ts`:** parte de la versión de `main`, que ya admite directorios, `// dynamic-style:` y `EXCLUDED_FILES`, y solo agrega `'tablero/'`.

## 2. Un solo `PatientSearch` y una sola paleta

- **Buscador de pacientes.** En `main`, Citas usa `citas/components/PatientSearch.tsx`, la versión con tokens. Haz que el `components/cemerog/PatientSearch.tsx` compartido parta de **esa** versión. Después, que Citas y Tablero lo usen, y elimina `citas/components/PatientSearch.tsx`.
- **Paleta de avatares.** Ahora existen `citas/lib/palettes.ts` y `components/cemerog/palettes.ts`. Deja **una sola**, en `resources/js/lib/palettes.ts` o en `components/cemerog/`, y que los dos módulos la importen.
- **Colores de estado de cita.** Elimina `CITA_STATUS_COLORS` y `BADGE_FALLBACK`. El color de un estado no es un valor calculado en tiempo de ejecución: para eso existe `StatusBadge`, que ya tiene los estados `cita-*`. Usa `StatusBadge` en `CitasHoyPanel`, con el **mismo aspecto** que tiene hoy el tablero. Si `StatusBadge` no lo reproduce, ajústalo con una prop nueva y su test.

## 3. Quitar archivos que no hacen falta

Elimina `.eslintignore` y `.prettierignore`. El proyecto configura lint y formato en `vite.config.ts` (`lint.ignorePatterns` y `fmt.ignorePatterns`), y `.eslintignore` está obsoleto. Si hace falta ignorar `.claude/`, agrégalo ahí.

## Antes de subir

Los 7 comandos deben terminar con **código 0**; verifica el lint con `npm run lint; echo $?`:
```bash
vendor/bin/pint --test
vendor/bin/phpstan analyse --level=6
vendor/bin/pest
npm run types:check
npm run lint
npm run test
npm run build
```

Verifica también que no quedan conflictos ni duplicados:
```bash
git diff --check origin/main
grep -c "color-secondary-bg" resources/css/app.css      # debe dar 1
ls resources/js/pages/citas/components/PatientSearch.tsx   # no debe existir
```

Actualiza la descripción del PR con:
- números reales;
- cómo resolviste cada conflicto;
- la salida de los 7 comandos.

No lo mezcles.
