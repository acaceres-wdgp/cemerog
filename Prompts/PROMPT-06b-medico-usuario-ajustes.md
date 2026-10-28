# Prompt 06b — Ajustes al PR #13 (médico ↔ usuario)

> Pégalo en Claude Code en la raíz de `cemerog`.

---

Trabaja en la misma rama del PR #13: haz `git checkout` de esa rama y luego `git pull`. Sube los commits al mismo PR y **no lo mezcles**. Sigue `CLAUDE.md`.

El backend del PR está bien. Quedan dos ajustes en el formulario de Doctores.

## 1. Al editar, el usuario vinculado aparece como "(usuario vinculado)" en vez de su nombre

`DoctoresController` manda `availableUsers` **excluyendo** a todos los usuarios ya vinculados, incluido el del médico que se está editando. Por eso, en el frontend, `usersForSelect` muestra el texto genérico `"(usuario vinculado)"`.

Qué hacer:
- En el payload de cada doctor, agrega `user_name` (el nombre del usuario vinculado, o `null`) junto a `user_id`. Carga la relación con `with('user')` para evitar N+1.
- En el frontend, al editar, muestra ese nombre real en el selector.
- En la lista de doctores, si ya hay una columna o detalle donde encaje, muestra el usuario vinculado y el consultorio. Si no la hay, **no** rediseñes la tabla.

Tests:
- Pest: el payload incluye `user_name`.
- Vitest: al editar un doctor vinculado a "Dr. Demo Médico", el selector muestra "Dr. Demo Médico" seleccionado.

## 2. Los campos nuevos usan hex y estilos inline

Los campos "Usuario del sistema" y "Consultorio" se agregaron con `style={{…}}` y colores hex (`#b91c1c`). `CLAUDE.md` lo prohíbe en páginas. La página `doctores/index.tsx` todavía no está migrada, pero **el código nuevo no debe sumar deuda**.

Qué hacer:
- Construye los dos campos con `FormField` de `components/cemerog/` (`as="select"` para el usuario), que ya maneja label, error y tokens.
- Si `FormField` no encaja con el resto del formulario, usa clases de Tailwind con tokens (`border-input-border`, `border-error`, `text-error`…).
- **No migres el resto de la página**: eso irá en su propio PR.

Verificación:
```bash
git diff origin/main -- resources/js/pages/doctores/index.tsx | grep "^+" | grep -cE "#[0-9a-fA-F]{3,6}\b|style=\{\{"   # debe dar 0
```

## Antes de subir

Los 7 comandos deben terminar con **código 0**; para el lint, comprueba con `npm run lint; echo $?`.

Actualiza la descripción del PR con los ajustes y la salida real de los comandos. No lo mezcles.
