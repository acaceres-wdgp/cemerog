# Prompt 05b — Ajustes al PR #12 (turnos por médico)

> Pégalo en Claude Code en la raíz de `cemerog`.

---

Trabaja en la misma rama del PR #12: `git checkout fix/turno-por-medico && git pull`. Sube los commits al mismo PR y **no lo mezcles**. Sigue `CLAUDE.md`.

La lógica del PR está bien. Quedan cuatro detalles de presentación, cada uno con su test.

## 1. "Dr. Dra. López": prefijo duplicado

Los nombres de médico ya incluyen el prefijo: `DoctorFactory` genera "Dr. …" o "Dra. …" y `DemoSeeder` usa "Dr. Demo …". Sin embargo, se antepone "Dr." otra vez en dos lugares:
- `app/Exceptions/PatientHasOpenTurnException.php`: `"…turno abierto hoy con Dr. {$doctorName}…"`.
- `resources/js/pages/registro/index.tsx` (~línea 527): `` `Dr. ${t.doctor_name} (...)` ``.

Usa el nombre tal como viene, sin agregar prefijo. El mensaje queda así: "El paciente ya tiene un turno abierto hoy con Dra. López (En espera)."

**Tests:**
- Pest: con un médico llamado "Dra. López", el mensaje contiene "con Dra. López" y **no** contiene "Dr. Dra.".
- Vitest: lo mismo en el aviso de Registro.

## 2. Estado mostrado en crudo

Tanto el mensaje como el aviso muestran `espera` o `en_consulta` tal cual. Muéstralos como etiquetas: "En espera" y "En consulta".
- En el frontend, reutiliza las etiquetas que ya existen en `StatusBadge`, o un mapa compartido de etiquetas si existe; no dupliques textos.
- En el backend, agrega un método en el modelo `Turn` (por ejemplo `statusLabel()`) o un helper, con su test.

## 3. El aviso usa colores de Tailwind en vez de tokens

El aviso "Atención abierta hoy" de `registro/index.tsx` usa `border-amber-300 bg-amber-50 text-amber-800`. Reemplázalo por el componente `AlertBanner` (variante `warning`) de `components/cemerog/`, manteniendo el texto y el enlace a `/tablero`. Si `AlertBanner` no admite el enlace, usa su prop `action` o la que exista. No cambies la API del componente salvo que haga falta, y en ese caso agrega su test.

## 4. Tablero: el error de turno duplicado no se muestra

Cuando se agrega un walk-in en `AgregarTurnoModal` (`resources/js/pages/tablero/components/AgregarTurnoModal.tsx`) para un paciente que ya tiene turno abierto **con el mismo médico**, el backend devuelve `errors.open_turn`. El modal lo guarda en `errors`, pero solo pinta `patient_id` y `doctor_id`, así que **el error no se ve** y parece que no pasó nada.

Lo mismo ocurre con "Asignar turno" desde una cita del día (`router.post` en `tablero/index.tsx` o `CitasHoyPanel`): no maneja `onError`.

Muestra `errors.open_turn`:
- en el modal, con `AlertBanner` (variante `danger`) arriba del botón;
- en "Asignar turno" desde una cita, con el toast de error que ya use el proyecto (`sonner`). Si no se usa, usa `AlertBanner` en el panel.

**Tests:** con Vitest, simula `onError({ open_turn: '…' })` en ambos casos y verifica que el mensaje aparece. Los tests de caracterización de `tablero-index.test.tsx` deben seguir pasando; solo puedes **agregar** tests.

## Antes de subir

Los 7 comandos deben terminar con **código 0**; comprueba el lint con `npm run lint; echo $?`.

Actualiza la descripción del PR con los 4 ajustes y la salida real de los comandos. No lo mezcles.
