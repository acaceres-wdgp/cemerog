# Prompt 02c — Tablero: tokens y componentes (sin cambio visual)

> Pégalo cuando los PR de 02a y 02b estén mezclados (`git checkout main && git pull`).

---

El Tablero ya está partido en componentes, en `resources/js/pages/tablero/`. Ahora migra sus estilos a tokens y a los componentes de CEMEROG, igual que se hizo en Citas: revisa `resources/js/pages/citas/` como modelo. **Cero cambios visuales y de comportamiento.** Lee `CLAUDE.md`.

## Reglas

- Trabaja en la rama `refactor/tablero-02c-tokens`, creada desde `main`. Abre un PR. **No lo mezcles.**
- Solo puedes tocar:
  - `resources/js/pages/tablero/`
  - `resources/js/components/cemerog/`
  - `resources/css/app.css`
  - `resources/js/__tests__/`
- **Prohibido:**
  - Mover colores a `style={{ color: 'var(--color-…)' }}`. Eso no cuenta como migrar.
  - Cambiar la lógica de `tablero-index.test.tsx`.
  - Tocar el backend o `components/ui/`.
  - Instalar dependencias.
  - Usar `as any`, `@ts-ignore` o `eslint-disable`.

## Commits, en orden

1. **Test que falla.** Agrega `'tablero/'` a la lista de `resources/js/__tests__/no-hardcoded-hex.test.ts`, que ya admite directorios y detecta `style={{`. Debe fallar en este commit.
2. **Colores a tokens.** Usa los tokens de `resources/css/app.css`; casi todos ya existen desde Citas. **Antes de crear un token nuevo, busca si ya hay uno con el mismo valor**, y dale nombres semánticos a los que crees.
3. **Estados con `StatusBadge`.** Los estados de turno (`espera`, `en_consulta`) y de cita deben usar `StatusBadge`; los estados `espera`, `consulta` y `cita-*` ya existen. **El aspecto debe ser exactamente el actual**: ojo con el borde, que fue el error en Citas.
4. **Modal.** "Agregar turno" pasa a `FormDialog`, que ya reproduce el modal original. Las tarjetas pasan a `Panel` si reproduce el aspecto actual.
5. **Cero `style={{` estáticos.** Todo a clases de Tailwind. Solo se permiten valores calculados en tiempo de ejecución, como la paleta de avatar por médico; reutiliza `citas/lib/palettes.ts`, o muévelo a `resources/js/lib/` si lo usan ambos. Cada uno lleva en la línea anterior `// dynamic-style: <motivo>`.

Si un componente de `components/cemerog/` no reproduce el aspecto exacto, ajústalo con una prop nueva y su test, o deja el markup con clases y justifícalo en el PR. **Nunca cambies el aspecto.**

## Antes de abrir el PR

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

Y estos dos deben dar **0**:
```bash
grep -rn "style={{" resources/js/pages/tablero | wc -l   # solo cuentan los que no llevan // dynamic-style:
grep -rnE "#[0-9a-fA-F]{3,6}\b" resources/js/pages/tablero --include=*.tsx | wc -l
```

En la descripción del PR pon:
- una tabla con los hex y los `style={{` estáticos y dinámicos, antes y después (**números reales**);
- los componentes usados, y los no usados con el motivo;
- los tokens nuevos;
- la salida real de los 7 comandos.

No incluyas capturas. No lo mezcles.
