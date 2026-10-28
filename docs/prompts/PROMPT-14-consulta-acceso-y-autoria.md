# Prompt 14 — Consulta: solo el médico del turno atiende y firma

> Pégalo **después** de mezclar el PR del Prompt 13 (`git checkout main && git pull`).

---

## Reglas de negocio
1. **Cada turno pertenece a un médico.** Solo ese médico lo llama, registra su consulta y le da de alta.
2. En Consulta, cada médico ve **solo su propia cola** del día.
3. El médico ve el **historial completo** del paciente (consultas de **cualquier** médico), **solo lectura**.
4. Un paciente puede tener turnos con varios médicos el mismo día; cada uno registra su propia consulta.
5. Para entrar a Consulta hace falta el permiso `module.consulta.access` **y** tener un **médico vinculado activo**. El **administrador que no es médico no ve Consulta** (ni en el menú ni por URL). El dueño (administrador + médico) sí.

## Problema actual
`ConsultaController::store` toma `doctor_id` **del formulario** (`StoreConsultationRequest`, `authorize()` devuelve `true`). Cualquier usuario con acceso puede guardar una consulta a nombre de cualquier médico. Tampoco se registra qué usuario la escribió.

Lee `CLAUDE.md` y síguelo.

## Reglas
- Rama `fix/consulta-acceso-autoria` desde `main` recién actualizado. PR, no lo mezcles. TDD, un commit por paso.
- Prohibido: editar migraciones existentes, instalar dependencias, `as any`/`@ts-ignore`/`eslint-disable`/`@phpstan-ignore`, hex o `style={{` estáticos.

## Paso 1 — Permisos
- En `RolesAndPermissionsSeeder`, **quita `consulta`** del rol `administrador` (déjalo en `medico`). Test en `SyncPermissionsTest`/`InertiaSharedPropsTest`.
- Middleware o `Gate` `attend-patients`: requiere `module.consulta.access` **y** `$user->doctor?->is_active`. Aplícalo a **todo** el grupo `/consulta`.
- Si el usuario tiene el permiso pero **no** tiene médico vinculado (o está inactivo), Consulta muestra un estado vacío: «Tu usuario no está vinculado a un médico activo. Contacta al administrador.» (sin cola, sin formulario).
- El menú lateral oculta Consulta si no se cumple la regla (usa los datos compartidos `doctor`).

## Paso 2 — Cola propia
`ConsultaController::index` devuelve solo los turnos del día **del médico del usuario** (`doctor_id = auth()->user()->doctor->id`).

## Paso 3 — Consulta firmada por el médico del turno
- `StoreConsultationRequest`: **elimina `doctor_id` de los datos aceptados**; exige `turn_id` (obligatorio) y valida en `authorize()` que el turno exista, sea **de hoy**, esté `en_consulta` (o `espera`, según el flujo actual — documenta cuál) y que `turn->doctor_id === auth()->user()->doctor->id`.
- El controlador toma `doctor_id` y `patient_id` **del turno**, nunca del request.
- Nueva columna `consultations.created_by` (FK `users`, nullable para registros antiguos) con el usuario que la escribió. Migración nueva con test de reversión.
- Igual para **dar de alta** (`alta`) y **editar antecedentes** (`updateAntecedents`): solo el médico con un turno abierto hoy de ese paciente.

## Tests (Pest)
- Administrador **sin** médico: 403 en `/consulta`, `POST /consulta`, alta y antecedentes; Consulta no aparece en el menú.
- Dueño (administrador + médico vinculado): puede todo con **sus** turnos.
- Médico A no ve en su cola ni puede guardar/dar alta un turno del médico B (403).
- Aunque el request envíe `doctor_id` de otro médico, la consulta queda con el `doctor_id` del turno.
- `created_by` = usuario autenticado.
- Paciente con turno con A y con B el mismo día: cada uno guarda su consulta.
- Usuario `medico` sin médico vinculado o con médico inactivo: ve el estado vacío, no puede guardar.
- El historial devuelve consultas de **todos** los médicos para ese paciente.

## Paso 4 — Aviso para producción (en la descripción del PR)
Incluye en la descripción del PR esta checklist **antes de mezclar**:
1. En producción, el usuario del dueño debe tener roles `administrador` **y** `medico`.
2. Debe estar vinculado a su registro de médico (Administración → Doctores).
3. Tras el deploy, Forge ejecuta `cemerog:sync-permissions`, que quita Consulta del rol administrador.

## Documentación
Actualiza `docs/DOMAIN.md` (reglas 1–5) y `docs/MODULES.md` (Consulta: acceso).

## Antes de abrir el PR
7 comandos con **código 0**. Salida real en el PR.
