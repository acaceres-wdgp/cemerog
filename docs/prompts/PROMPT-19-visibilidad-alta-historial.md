# Prompt 19 — Turnos y citas por médico, volver a Consulta tras el alta, historial unificado

> Pégalo en Claude Code en la raíz de `cemerog`, después de `git checkout main && git pull`.

---

Salen de las pruebas en producción. Lee `CLAUDE.md` y la sección **«Lecciones de los PR anteriores»** de `docs/prompts/PROMPT-18-cuenta-cargos-honorarios.md`, y síguelas.

## Reglas
- **Rama:** `feat/medico-turnos-historial`, desde `main` recién actualizado. Abre un PR y **no lo mezcles**.
- Haz un commit por punto, empezando por el test que falla.
- **Prohibido:**
  - instalar dependencias;
  - usar `as any`, `@ts-ignore`, `eslint-disable` o `@phpstan-ignore`;
  - escribir hex o `style={{` estáticos;
  - pasar de ~250 líneas por archivo.
- **No toques nada dentro de `design/`.** Es solo la referencia visual.
- Trabaja **en esta rama, sin worktrees ni subagentes**. Al terminar, haz `git push` y comprueba con `git status` que no quedan cambios sin commit.

## 1. Un médico solo ve sus turnos y sus citas

Hoy un médico que no es administrador ve en **Tablero** y en **Citas** los turnos y las citas de todos los médicos.

**Regla.** Usuario con médico vinculado **y sin** rol `administrador`: ve y gestiona **solo** los turnos y las citas de su médico. Los demás usuarios siguen viéndolo todo: administrador (incluido el dueño, que es administrador y médico), secretaría y caja.
- Pon la regla en **un solo lugar**, por ejemplo `User::seesOnlyOwnSchedule(): bool`, y úsala en todos los puntos de abajo.
- **Se filtra en el backend**, no solo ocultando en la pantalla.

**Dónde aplicarla:**
- **Tablero:** `TableroController::index` envía solo sus turnos y citas.
- **Citas:** `CitasController::index` envía solo sus citas, y el selector de médicos muestra solo el suyo.
- **Acciones sobre turnos ajenos → 403:** cambiar estado, reordenar, llamar y asignar turno desde la cita.
- **Acciones sobre citas ajenas → 403:** cambiar estado, cancelar y editar.
- **Crear cita:** el médico solo crea citas para sí mismo. El backend fuerza su `doctor_id` aunque el formulario envíe otro.

**Pacientes no cambia:** el médico puede buscar cualquier paciente y ver todo su historial clínico.

**Tests (Pest):**
- médico A no ve en Tablero ni en Citas los turnos y citas de B;
- 403 al cambiar el estado o reordenar un turno de B;
- 403 al cancelar una cita de B;
- crear una cita enviando el `doctor_id` de B la deja a nombre de A;
- el dueño (administrador + médico) y la secretaría ven todo;
- Pacientes sigue mostrando a todos los pacientes al médico.

**Test (Vitest):** el selector de médicos de Citas muestra solo los médicos que llegan en las props.

## 2. Después del alta, volver a la vista principal de Consulta

Hoy, al confirmar el alta, el modal se queda abierto con el paciente que ya salió de la cola. Si se vuelve a pulsar «Confirmar alta», sale «Este turno ya tiene un alta registrada.».

- Cuando el alta se guarda bien:
  - el modal se cierra;
  - el turno activo pasa al siguiente turno en consulta del médico o, si no hay, a la vista vacía con la cola;
  - la URL queda en `/consulta`, sin `patient_id`.
- En `consulta/index.tsx`, si el turno activo ya no está en `turns_en_consulta` ni en `turns_en_espera` después de recibir las props nuevas, deja de mostrarse. Esto aplica a cualquier caso, no solo al alta.
- **Tests (Vitest):**
  - tras el `onSuccess` del alta, el modal se cierra y se muestra el siguiente turno, o el estado vacío;
  - con props nuevas que ya no contienen el turno activo, deja de mostrarse.

## 3. Historial clínico unificado (como en el diseño)

Referencia: `design/CEMEROG v6.dc.html`, panel **«Historial en la clínica»** de Consulta. A la izquierda va la lista de entradas, con un chip de tipo y su color; a la derecha, el detalle de la entrada elegida. Arriba van los filtros **Todo · Notas clínicas · Recetas · Análisis e imágenes** y **Todos · Míos · Otros**, con contador.

Hoy el historial sale solo de `consultations`. Una receta aparece únicamente dentro de su consulta, y si el médico guardó la receta y dio el alta **sin nota**, el historial queda vacío.

**Backend.** El historial es una lista de entradas de varios tipos, ordenada de la más reciente a la más antigua. Cada entrada lleva `type`, `date`, `doctor`, `specialty`, `mine` (si la generó el médico del usuario) y los datos de su detalle:
- **`consulta`:** cada nota clínica guardada, con su diagnóstico, motivo, examen, plan, signos vitales y el alta del turno si existe (tipo y diagnóstico de egreso).
- **`receta`:** **cada receta es su propia entrada**, con sus medicamentos (con la instrucción redactada), las indicaciones y el botón Imprimir. Aparece aunque el turno no tenga nota.
- **`alta`:** si un turno tiene alta pero no tiene nota clínica, el alta aparece como entrada propia, para que no se pierda.
- **`laboratorio` / `imagen`:** todavía no existen. Deja los tipos previstos en el tipo de TS y en el filtro «Análisis e imágenes», que muestra un estado vacío: «Disponible cuando se implementen Laboratorio e Imágenes». No inventes tablas.

Arma el historial en una Action, por ejemplo `BuildClinicalHistory`, con eager loading y sin N+1. **Reutilízala** en el prompt 20 (Perfil del paciente).

**Frontend.**
- Los filtros funcionan juntos (tipo × Todos/Míos/Otros) y los contadores reflejan el total de cada uno.
- El historial muestra **todas** las atenciones del paciente con cualquier médico, solo lectura. Así se decidió en el prompt 14.
- Divide los componentes para no pasar de ~250 líneas.

**Tests (Pest):**
- una receta guardada sin nota aparece como entrada `receta`;
- un alta sin nota aparece como entrada `alta`;
- `mine` es correcto para el médico A y para el médico B;
- el orden es por fecha.

**Tests (Vitest):**
- el filtro «Recetas» muestra solo recetas;
- «Míos» muestra solo las entradas con `mine: true`;
- los contadores son correctos;
- el detalle de una receta muestra sus medicamentos y el botón Imprimir.

## Antes de abrir el PR
Los 7 comandos deben terminar con **código 0**: `vendor/bin/pint --test`, `vendor/bin/phpstan analyse --level=6`, `vendor/bin/pest`, `npm run types:check`, `npm run lint` (comprueba con `npm run lint; echo $?`), `npm run test` y `npm run build`. Pega la salida **real** en la descripción del PR.

Prueba también en Herd:
1. Entra como médico no administrador y comprueba que solo ves tus turnos y tus citas.
2. Da de alta a un paciente y comprueba que vuelves a la cola.
3. Guarda una receta sin nota y comprueba que aparece en el historial.
