# Prompt 10 — Los mensajes de éxito no se muestran en casi ninguna pantalla

> Pégalo **después** de mezclar el PR del Prompt 09 (`git checkout main && git pull`).

---

## Problema

El frontend muestra los toasts con `resources/js/hooks/use-flash-toast.ts`, que escucha el evento `flash` de Inertia y lee `flash.toast`. Esos datos solo llegan cuando el backend usa **`Inertia::flash('toast', ['type' => …, 'message' => …])`**, como hace `Settings/ProfileController`.

Pero casi todos los controladores usan la sesión de Laravel, que nadie comparte con el frontend:
- `->with('flash', ['type' => 'success', 'message' => '…'])` en Citas, Consulta, Doctores, Registro y Turnos;
- `->with('success', '…')` en Admin.

Resultado: **ninguno de esos mensajes de éxito llega a verse** («Cita registrada correctamente», «Consulta guardada», «Turno asignado», «Usuario creado»…). Lee `CLAUDE.md`.

## Reglas

- **Rama:** `fix/flash-toasts`, creada desde `main` **recién actualizado**. Abre un PR y **no lo mezcles**.
- **Prohibido:**
  - cambiar los textos de los mensajes;
  - cambiar a dónde redirige cada acción;
  - instalar dependencias;
  - usar `as any`, `@ts-ignore` o `eslint-disable`.

## Qué hacer (TDD)

1. **Inventario.** Lista en la descripción del PR **todas** las llamadas a `->with('flash', …)`, `->with('success', …)`, `->with('error', …)` y similares en `app/`, con archivo y línea. Usa `git grep -n "->with('" app`.
2. **Tests que fallan.** Para cada acción con mensaje, el test de feature correspondiente debe verificar que la respuesta trae el flash `toast` con el `type` y `message` esperados. Usa el helper de aserción de flash de Inertia, si existe en esta versión. Si ya hay un test de esa acción, agrega la aserción ahí; si no, créalo.
3. **Corrección.** Reemplaza todas esas llamadas por `Inertia::flash('toast', ['type' => 'success'|'error', 'message' => '…'])`. Si se repite mucho, crea un helper pequeño, por ejemplo `App\Support\Toast::success('…')` y `Toast::error('…')`, con su test.
4. **Errores.** Revisa si hay mensajes de error enviados por sesión que tampoco se muestran, excluyendo los de validación (`withErrors`), que ya funcionan. Si los hay, pásalos también a `toast` con `type: 'error'`.
5. **Regla en `CLAUDE.md`.** Añade a «Lo que NO hacer»: «No usar `->with('flash'|'success', …)` para mensajes al usuario; usar `Inertia::flash('toast', …)` (o `Toast::success`)».
6. **Test de protección.** Agrega un test, en Pest o como script en `tests/`, que falle si aparece `->with('flash'` o `->with('success'` en `app/`.

## Antes de abrir el PR

Los 7 comandos deben terminar con **código 0**; comprueba el lint con `npm run lint; echo $?`.

En la descripción del PR incluye el inventario del paso 1 y la salida real de los comandos.
