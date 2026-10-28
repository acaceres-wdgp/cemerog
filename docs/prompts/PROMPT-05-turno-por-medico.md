# Prompt 05 — Regla: un paciente puede tener turnos con varios médicos el mismo día

> Pégalo en Claude Code en la raíz de `cemerog`, después de `git checkout main && git pull`.

---

**Regla de negocio de la clínica:** cualquier médico puede atender a cualquier paciente. Un paciente puede consultar con un médico un día y con otro médico otro día, **o con dos médicos el mismo día**.

**El problema hoy:** `app/Actions/Registro/RegisterArrival.php` (línea ~47) lanza `PatientHasOpenTurnException` si el paciente tiene **cualquier** turno abierto hoy (`espera` o `en_consulta`), sin importar el médico. Eso impide la segunda consulta del día con otro médico. Lee `CLAUDE.md`.

## Reglas
- **Rama:** créala desde `main` **recién actualizado**, con el nombre `fix/turno-por-medico`. Abre un PR y **no lo mezcles**.
- **Prohibido:** cambiar migraciones, instalar dependencias, usar `as any` o `@phpstan-ignore`, y borrar tests.

## Qué hacer (TDD)
1. **Tests que fallan** en `tests/Feature/Registro/RegisterArrivalTest.php` (y en `TurnTest` si aplica):
   - Un paciente con un turno abierto hoy con el **médico A** puede registrar otro turno hoy con el **médico B**. Se crean 2 turnos, cada uno con su número en la cola de su médico.
   - Un paciente con un turno abierto hoy con el **médico A** **no** puede abrir otro turno con el **médico A** (se mantiene la excepción).
   - Si el turno con el médico A ya está cerrado (atendido o dado de alta), sí puede volver a abrir turno con el médico A el mismo día. Confirma primero cuáles son los estados cerrados en el modelo `Turn`.
   - Lo mismo por la ruta de walk-in del Tablero (`TurnosController::store`) y por "Asignar turno" desde una cita.
2. **Corrección mínima:** filtra la búsqueda del turno abierto también por `doctor_id`.
3. **Mensajes.**
   - El mensaje de la excepción debe nombrar al médico: "El paciente ya tiene un turno abierto hoy con Dr. X".
   - En el frontend de Registro y en la búsqueda de pacientes (`has_open_turn_today` y `open_turn_status`), revisa si el aviso de "atención abierta" bloquea el envío. Debe **avisar** ("ya tiene turno abierto hoy con Dr. X"), **no impedir** registrar con otro médico. Ajusta los datos que devuelve la búsqueda si hace falta, por ejemplo una lista de médicos con turno abierto, y cubre el cambio con un test.
4. **Documentación:** registra la regla en `docs/DOMAIN.md` y añade un ADR en `docs/DECISIONS.md`.
5. **Quitar el botón "Eliminar paciente"**, en un commit aparte: `fix(registro): quitar botón Eliminar paciente`.
   - **Problema:** la pantalla de editar paciente (`resources/js/pages/registro/edit.tsx` y sus componentes en `resources/js/pages/registro/components/`) muestra ese botón, que llama a `router.delete('/registro/pacientes/{id}')`. **Esa ruta no existe a propósito**: los expedientes clínicos no se borran (ADR-012), y `DeleteRouteRemovedTest` lo verifica.
   - **Test primero:** en `resources/js/__tests__/registro-edit.test.tsx`, verifica que el botón **no** aparece y que nunca se llama a `router.delete`. Si hay tests que verifican que el botón existe, cámbialos para que verifiquen que no existe. No borres otros tests.
   - **Cambio:** elimina el botón, su handler, el `window.confirm` asociado y cualquier import que quede sin uso. No toques nada más de la pantalla.
   - **Documentación:** añade una línea al ADR-012 en `docs/DECISIONS.md`: "La UI no ofrece eliminar pacientes."

## Antes de abrir el PR
- Los 7 comandos deben terminar con **código 0**. Comprueba el lint con `npm run lint; echo $?`:
  ```bash
  vendor/bin/pint --test && vendor/bin/phpstan analyse --level=6 && vendor/bin/pest
  npm run types:check && npm run lint && npm run test && npm run build
  ```
- Pon la salida real de los comandos en la descripción del PR.
