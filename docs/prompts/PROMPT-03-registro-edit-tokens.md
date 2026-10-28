# Prompt 03 — Registro / editar paciente: tokens (sin cambio visual)

> Pégalo en Claude Code en la raíz de `cemerog`, después de `git checkout main && git pull`.

---

Migra `resources/js/pages/registro/edit.tsx` (1.005 líneas, 64 hex, 69 `style={{`) a tokens y clases, siguiendo el modelo de `resources/js/pages/citas/` y `resources/js/pages/tablero/`. **Es un refactor puro: cero cambios de comportamiento, cero cambios visuales y cero cambios en el backend.** Lee `CLAUDE.md`.

## Reglas
- **Rama:** créala desde `main` **recién actualizado** (`git checkout main && git pull` primero), con el nombre `refactor/registro-edit-tokens`. Abre un PR y **no lo mezcles**.
- **Archivos que puedes tocar:** solo `resources/js/pages/registro/edit.tsx`, archivos nuevos en `resources/js/pages/registro/edit/` (o `registro/components/`), `resources/css/app.css` y `resources/js/__tests__/`.
- **Prohibido:**
  - Mover colores a `style={{ color: 'var(--…)' }}`.
  - Tocar `registro/index.tsx`, el backend o `components/ui/`.
  - Instalar dependencias.
  - Usar `as any`, `@ts-ignore` o `eslint-disable`.

## Commits
1. **Tests de caracterización** en `resources/js/__tests__/registro-edit.test.tsx`. Deben cubrir:
   - Precarga los datos del paciente: nombres, documento, sexo, teléfono, sangre, alergias y contacto.
   - Cambia la máscara según el tipo de documento.
   - Muestra los errores de validación que llegan en `errors`.
   - Al guardar llama a `put` con la ruta y el payload correctos.
   - "Cancelar" vuelve a la ruta correcta.
   - Si existe, cubre la subida y vista previa de la foto.

   Estos tests pasan con el código actual y **no cambian de lógica después**.
2. **Partir el archivo** en componentes (máx. ~250 líneas cada uno), **sin cambiar ninguna clase ni estilo**.
3. **Ampliar el test anti-hex.** Agrega `registro/edit.tsx` y la carpeta nueva a `no-hardcoded-hex.test.ts`. Debe fallar en este commit, porque todavía quedan hex.
4. **Tokens.** Pasa todos los hex y `style={{` estáticos a clases con los tokens existentes de `app.css`. Antes de crear un token, busca si ya existe uno con ese valor. Solo se permiten `style` dinámicos, con el comentario `// dynamic-style:`.

## Antes de abrir el PR
- Los 7 comandos deben terminar con **código 0**. Comprueba el lint con `npm run lint; echo $?`:
  ```bash
  vendor/bin/pint --test && vendor/bin/phpstan analyse --level=6 && vendor/bin/pest
  npm run types:check && npm run lint && npm run test && npm run build
  ```
- En la descripción del PR incluye:
  - una tabla antes/después con números reales (líneas, hex, `style` estáticos y dinámicos);
  - los tokens nuevos;
  - la salida de los comandos.
- Si en `registro/index.tsx` existen campos equivalentes, menciona en el PR qué partes del formulario se repiten, pero **no las unifiques** en este PR.
- No incluyas capturas.
