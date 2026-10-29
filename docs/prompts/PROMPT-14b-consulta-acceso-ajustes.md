# Prompt 14b — Ajustes al PR #25 (Consulta: acceso y autoría)

> Pégalo en Claude Code en la raíz de `cemerog`.

---

Trabaja en la misma rama del PR #25 (`git checkout fix/consulta-acceso-autoria && git pull`). Sube los commits al mismo PR y **no lo mezcles**. Sigue `CLAUDE.md`. Un commit por punto, empezando por el test que falla.

El backend del PR está bien: el `doctor_id` sale del turno, se guarda `created_by` y la cola es propia. Faltan dos partes del Paso 1 del prompt 14, que no tocan el frontend, y un hueco en el alta.

## 1. Estado vacío para el médico sin vínculo (faltó)

Hoy un usuario con rol `medico` cuyo usuario **no** está vinculado a un médico, o cuyo médico está **inactivo**, ve Consulta en el menú. Al entrar recibe una página de error 403. El prompt 14 pedía un estado vacío.

- Para **`GET /consulta`**, si el usuario tiene `module.consulta.access` pero no tiene médico activo, **no** devuelvas 403. Renderiza `consulta/index` con una prop `can_attend: false`, sin cola ni historial.
- La página muestra **solo** el mensaje: «Tu usuario no está vinculado a un médico activo. Contacta al administrador.», con los componentes de `components/cemerog/` (por ejemplo `EmptyState`, si existe) y sin cola ni formulario.
- Las rutas que escriben (`POST /consulta`, alta y antecedentes) siguen devolviendo **403** en ese caso.
- El administrador **sin** `module.consulta.access` sigue recibiendo 403 en todas las rutas, incluido el `GET`.
- **Tests (Pest):**
  - `medico` sin vínculo: `GET` → 200 con `can_attend = false` y sin turnos; `POST` → 403.
  - `medico` con médico inactivo: el mismo comportamiento.
  - Administrador sin médico: `GET` → 403.
- **Test (Vitest):** con `can_attend: false` se ve el mensaje y no se ven la cola ni el formulario.

## 2. El menú oculta Consulta si no puede atender (faltó)

El menú lateral solo mira el permiso. Hay que ocultar Consulta también cuando el usuario no tiene un médico activo.

- En los datos compartidos (`HandleInertiaRequests`), agrega `is_active` al objeto `doctor`. O mejor, agrega un booleano `can_attend`, calculado igual que en el middleware: extrae esa regla a **un solo lugar**, por ejemplo `User::canAttendPatients()`, y que la usen el middleware, el controlador y los datos compartidos.
- En el filtrado de `resources/js/lib/navigation.ts` (o donde se filtren los ítems por permiso), Consulta se muestra solo si hay permiso **y** `can_attend`.
- **Tests (Vitest):** el menú oculta Consulta con permiso y sin médico activo, y la muestra con permiso y médico activo.
- **Test (Pest):** los datos compartidos traen `can_attend` correcto en los tres casos: médico activo, médico inactivo y sin médico.

## 3. Alta: solo turnos abiertos de hoy

`alta` comprueba que el turno sea del médico, pero no que sea **de hoy** ni que esté **abierto**. Hoy se puede volver a dar de alta un turno ya `atendido` o uno de un día anterior.

- Exige que el turno sea de hoy y esté en `espera` o `en_consulta`; si no, responde 403. Usa la misma regla que `StoreConsultationRequest`, extraída a un solo lugar, por ejemplo `Turn::isOpenToday()`.
- **Tests (Pest):** alta de un turno de ayer → 403. Alta de un turno ya `atendido` → 403.

## Antes de subir

Los 7 comandos deben terminar con **código 0**. Pega en la descripción del PR la salida **real**, con el código de salida de `npm run lint`. No lo mezcles.
