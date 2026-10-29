# Prompt 16b — Ajustes al PR #29 (acciones y alta médica)

> Pégalo en Claude Code en la raíz de `cemerog`.

---

Trabaja en la misma rama del PR #29 (`git checkout feat/consulta-acciones-alta && git pull`). Sube los commits al mismo PR y **no lo mezcles**. Sigue `CLAUDE.md`. Un commit por punto, empezando por el test que falla.

## 1. Quitar el alta vieja sin registro (bloqueante)

Sigue existiendo `PATCH /consulta/turnos/{turn}/alta` (`ConsultaController::alta`), que marca el turno `atendido` **sin** crear el `discharge`. Cualquiera que llame a esa ruta salta el tipo de alta y el diagnóstico de egreso.

- Elimina la ruta `consulta.alta` y el método `alta`.
- Pasa sus tests (`ConsultaTest`, `ConsultaAccesoAutoriaTest`) a `POST /consulta/turnos/{turn}/alta` con un payload válido. Se conservan los mismos casos: dueño del turno, otro médico (403), administrador sin médico (403), turno de ayer y turno ya atendido (403).
- **Test (Pest):** `PATCH /consulta/turnos/{turn}/alta` → 405.

## 2. El lint no está en verde y el test del tooltip no prueba nada

- `npm run lint` avisa `'tooltip' is declared but never used` en `discharge-modal.test.tsx`. Corrígelo y confirma que `npm run lint; echo $?` imprime `0`.
- El test «"Ordenar estudios" has tooltip» siempre pasa, porque el botón siempre tiene `aria-label`. Reescríbelo: al pasar el mouse (`userEvent.hover`) **y** al enfocar con teclado, aparece el texto del tooltip. Hazlo para los **tres** botones deshabilitados.
- Para que funcione con teclado, el `span` que envuelve al botón deshabilitado necesita `tabIndex={0}`. Un botón `disabled` no recibe foco.

## 3. «Cargar próximo paciente» no hace nada

El botón no tiene `onClick` y muestra el número del turno **actual**.

- Muestra el número del **siguiente** turno en espera de la cola del médico (`T-02 Cargar próximo paciente`) y, al hacer clic, lo selecciona, igual que al elegirlo en la cola.
- Si no hay nadie en espera, el botón queda deshabilitado con el texto «Sin pacientes en espera».
- **Tests (Vitest):** con espera, el clic selecciona el siguiente turno; sin espera, el botón está deshabilitado.

## 4. Errores del alta visibles en el modal

- Una segunda alta del mismo turno hoy responde `abort(409)` y en la app sale una página de error. Responde con un error de validación (422) con el mensaje «Este turno ya tiene un alta registrada.», y ajusta el test.
- El modal muestra los errores del backend (`type`, `destination`, `discharge_diagnosis` y el de alta duplicada) con los tokens de error.
- Usa la ruta de Wayfinder (`consulta.discharge`) en lugar de la URL escrita a mano.
- En el subtítulo del modal, el turno va con dos dígitos (`T-01`), como en el resto de la app.
- **Test (Vitest):** con `errors.discharge_diagnosis` en las props, el mensaje aparece en el modal.

## 5. Test de reversión de la migración

`discharges migration can be rolled back` usa `migrate:rollback --step 1`, que deshace **la última** migración, no necesariamente esta. Se rompe en cuanto exista una migración más nueva. Es el mismo error que este PR corrigió en `AddCreatedByToConsultationsTest`. Usa `--path` con esta migración, como ahí.

## Antes de subir

Los 7 comandos deben terminar con **código 0**. Pega en la descripción del PR la salida **real**, con el código de salida de `npm run lint`. No lo mezcles.
