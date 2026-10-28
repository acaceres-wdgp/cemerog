# Prompt 07b — Ajustes al PR #14 (barra superior y tarjeta "Turno actual")

> Pégalo en Claude Code en la raíz de `cemerog`.

---

Trabaja en la misma rama del PR #14: haz `git checkout` de esa rama y luego `git pull`. Sube los commits al mismo PR y **no lo mezcles**. Sigue `CLAUDE.md`. Cada punto va en su propio commit y empieza con un test que falla.

## 1. La tarjeta nunca carga sus datos (bloqueante)

En `HandleInertiaRequests`, `queue` se comparte con `Inertia::optional(...)`. Una prop opcional **solo** se envía cuando el frontend la pide de forma explícita con una recarga parcial (`only: ['queue']`). Hoy `TurnoActualCard` solo hace esa recarga **después** de pulsar "Llamar siguiente". El resultado es este ciclo sin salida:
- al cargar cualquier página, `queue` es `undefined`;
- entonces `waitingCount` vale 0 y el botón queda deshabilitado con "Sin pacientes en espera";
- nunca se puede pulsar, así que los datos nunca se cargan.

**Corrección:** cambia a `Inertia::defer(fn () => …)`, que se carga sola justo después de la carga inicial sin frenarla. Si `defer` no funciona en esta versión de Inertia, haz una recarga parcial (`router.reload({ only: ['queue'] })`) al montar la tarjeta. En cualquiera de los dos casos, la consulta solo debe ejecutarse para usuarios con médico vinculado.

Mientras carga, la tarjeta debe mostrar un estado de carga (skeleton o "Cargando…") y **no** "Sin pacientes en espera".

**Tests:**
- Pest: una petición normal de un usuario médico termina recibiendo `queue` como prop diferida.
- Vitest: con `queue` sin cargar se muestra el estado de carga, y con `queue` cargado se muestran el número de turno y la cantidad en espera.

## 2. "Llamar siguiente" sin pacientes devuelve JSON

Cuando no hay nadie en espera, `TurnosController::callNext` responde `response()->json([...], 422)`. A una petición de Inertia eso le produce el modal de error "All Inertia requests must receive a valid Inertia response".

**Corrección:** devuelve `back()` con un mensaje flash de error o con `withErrors(['queue' => 'No hay pacientes en espera.'])`. La tarjeta debe mostrarlo como toast (`sonner`).

**Test:** Pest verifica que la respuesta es una redirección con el error, no JSON.

## 3. Usar `arrived_at` en vez de `created_at`

`resolveQueue` y `callNext` filtran el día con `whereDate('created_at', …)`. El resto del sistema (`AssignTurn`, `RegisterArrival`, `TableroController`) usa `arrived_at`. Cambia ambos a `arrived_at` para que todo el sistema use el mismo criterio. Los tests de `QueuePropsTest` ya crean los turnos con `arrived_at`.

## 4. "Llamar siguiente" cuando ya hay un paciente en consulta

Hoy, si el médico ya tiene un paciente `en_consulta` y pulsa "Llamar siguiente", quedan **dos** pacientes en consulta a la vez.

**Corrección:** si ya hay uno en consulta, **no** llames al siguiente. Devuelve el error "Ya tienes un paciente en consulta (T-NN). Termina la consulta antes de llamar al siguiente." y muéstralo como toast. En la tarjeta, mientras haya un paciente en consulta, el botón muestra "En consulta: T-NN" y queda deshabilitado, o enlaza a `/consulta` si esa ruta acepta el turno.

**Test:** Pest cubre el caso "ya hay uno en consulta": no cambia ningún estado y devuelve el error.

## 5. Buscador de la barra superior

`Topbar.tsx` vuelve a implementar la búsqueda (`fetch`, debounce, clic fuera) en vez de usar el componente compartido `components/cemerog/PatientSearch`. Además, se muestra a **todos** los roles, aunque `/pacientes/buscar` exige `module.pacientes.access`. Para enfermería, caja, laboratorio o almacén siempre dice "no encontrado".

**Corrección:**
- Muestra el buscador **solo** si el usuario tiene `module.pacientes.access`, usando `permissions` de los datos compartidos.
- Reutiliza `PatientSearch`. Si le falta algo, por ejemplo una variante compacta para la barra superior, agrégale una prop con su test en vez de duplicar la lógica.

**Tests (Vitest):**
- Un usuario sin permiso no ve el buscador.
- Un usuario con permiso lo ve, y al elegir un paciente navega a `/pacientes?paciente={id}`.

## Antes de subir

Los 7 comandos deben terminar con **código 0**; verifica el lint con `npm run lint; echo $?`.

Actualiza la descripción del PR con los 5 ajustes y la salida real de los comandos. No lo mezcles.
