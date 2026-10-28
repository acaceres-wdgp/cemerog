# Prompt 09b — Ajustes al PR #17 (documento por tipo + registrar sin atención)

> Pégalo en Claude Code en la raíz de `cemerog`.

---

Trabaja en la misma rama del PR #17: haz `git checkout` de esa rama, luego `git pull`, y trae `main` **con merge**, no con rebase (`git fetch origin && git merge origin/main`), porque la rama partió de un `main` anterior al PR #16. Sube los commits al mismo PR y **no lo mezcles**. Sigue `CLAUDE.md`.

La normalización por tipo, la migración y la ruta nueva están bien. Faltan cuatro cosas, cada una con su test.

## 1. El mensaje «Paciente registrado.» nunca se muestra

`RegistroController::storePatient` hace `->with('success', 'Paciente registrado.')`, pero el frontend solo muestra toasts que llegan por **`Inertia::flash('toast', [...])`** (ver `resources/js/hooks/use-flash-toast.ts` y `Settings/ProfileController`). La clave `success` no la lee nadie.

- Usa `Inertia::flash('toast', ['type' => 'success', 'message' => 'Paciente registrado.'])`.
- Ajusta `StorePatientTest` para verificar el flash correcto, usando el helper de aserción de Inertia para flash. Si no existe, verifica la sesión que use `Inertia::flash`.
- No arregles aquí los demás controladores: van en un PR aparte (Prompt 10).

## 2. Faltan tests que pedía el prompt

- **Búsqueda por pasaporte**, en `tests/Unit/SearchPatientsTest.php` y `tests/Feature/Pacientes/PacientesIndexTest.php`:
  - buscar `AB123456` encuentra al paciente con pasaporte `AB-123456`;
  - buscar `XY123456` **no** lo encuentra;
  - siguen funcionando las búsquedas por cédula (con y sin guiones), por teléfono y por nombre.
- **Colisión de código `GEN-`** en `CreatePatient`: fuerza una colisión, por ejemplo creando antes un paciente con el hash del primer código o mockeando `Str::random`, y verifica que se genera otro código y que el paciente se crea sin error de índice único.

## 3. La lógica de búsqueda está duplicada

`App\Actions\Patients\SearchPatients::handle` y `PacientesController::index` repiten la misma lógica (dígitos → cédula/teléfono, alfanumérico → pasaporte o nombre, texto → nombre). Con este PR la duplicación creció. Unifícala para que haya **una sola** definición:
- Crea, por ejemplo, `SearchPatients::applyTo(Builder $query, string $q): Builder`, que agrega las condiciones a una consulta existente.
- `handle()` lo usa con su `limit`.
- `PacientesController::index` lo usa sobre su consulta con filtros, orden y paginación.
- Los tests de ambos deben seguir pasando sin cambiar su lógica.

## 4. La rama debe incluir `main` actual

Después del merge de `origin/main`, confirma que `resources/js/__tests__/pacientes-detail-close.test.tsx`, que llegó a `main` con el PR #16, **existe y pasa**, y que `git diff origin/main --stat` ya no lo muestra como eliminado.

## Antes de subir

Los 7 comandos deben terminar con **código 0**; comprueba el lint con `npm run lint; echo $?`.

Actualiza la descripción del PR con los 4 ajustes y la salida real de los comandos. No lo mezcles.
