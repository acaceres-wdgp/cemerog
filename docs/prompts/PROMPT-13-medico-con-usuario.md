# Prompt 13 — Al crear un médico se crea su usuario y sus credenciales

> Pégalo en Claude Code en la raíz de `cemerog`, después de `git checkout main && git pull`.

---

## Regla de negocio

Un médico necesita un **usuario** para entrar a Consulta y atender pacientes. «Ser médico» = tener un registro en `doctors` vinculado a un usuario (`doctors.user_id`, ya existe desde el PR #13). El **rol** define qué puede ver; **ser médico** define si puede firmar consultas. Un usuario puede tener varios roles (p. ej. el dueño: `administrador` + `medico`).

Lee `CLAUDE.md` y síguelo.

## Reglas
- Rama `feat/medico-con-usuario` desde `main` **recién actualizado**. PR, **no lo mezcles**. Un commit por paso, empezando por el test que falla.
- Prohibido: editar migraciones existentes (crea nuevas con test de reversión), instalar dependencias, `as any`/`@ts-ignore`/`eslint-disable`/`@phpstan-ignore`, hex o `style={{` estáticos (usa `FormField`, `FormDialog`, tokens).
- Mensajes al usuario con `Toast::success`/`Toast::error`.

## Paso 1 — Generar credenciales (acción reutilizable)
Crea `App\Actions\Doctors\GenerateDoctorCredentials` (o similar) que, dado un nombre:
- **Usuario**: inicial del primer nombre + primer apellido, en minúsculas, sin tildes ni prefijos «Dr.»/«Dra.» (`Dr. Franklin Rodríguez Jorge` → `frodriguez`). Si existe, agrega número: `frodriguez2`, `frodriguez3`…
- **Contraseña temporal** aleatoria de 10 caracteres, legible (sin `0/O/l/1`).
- El usuario se crea con rol `medico`, `must_change_password = true`, `is_active = true`.
Tests unitarios: normalización (tildes, ñ, prefijos, apellidos compuestos), sufijo numérico, longitud y alfabeto de la contraseña.

## Paso 2 — Crear médico: «crear usuario nuevo» o «vincular existente»
En el formulario de crear médico (`resources/js/pages/doctores/…`) agrega una sección **Acceso al sistema** con dos opciones:
1. **Crear usuario nuevo** (por defecto): se generan las credenciales del Paso 1.
2. **Vincular usuario existente**: selector de usuarios **activos** que **no** estén vinculados a otro médico (ya existe `availableUsers`). Al vincular, si el usuario no tiene rol `medico`, **se le agrega** (sin quitar sus otros roles — caso del dueño administrador).

Todo en una transacción (`CreateDoctor`): si falla la creación del usuario, no se crea el médico.

Tras guardar con «crear usuario nuevo», muestra **una sola vez** un `FormDialog` «Credenciales del médico» con: nombre, usuario, contraseña temporal, el aviso «Entrégale estas credenciales al médico. Deberá cambiar la contraseña al entrar. No se volverán a mostrar.», y botones **Copiar** e **Imprimir**. La contraseña **no** se guarda en texto plano en ningún lado ni se envía en flash persistente: pásala solo en la respuesta inmediata (p. ej. `Inertia::flash('credentials', …)` de un solo uso) y verifica en un test que no queda en sesión después de mostrarla.

## Paso 3 — Médicos existentes sin usuario
En **editar médico**, si no tiene usuario, mostrar las mismas dos opciones (generar credenciales / vincular existente). Si ya tiene usuario, mostrar su usuario (solo lectura) y un botón **«Restablecer contraseña»** que genera una nueva temporal (con `must_change_password = true`) y la muestra igual que en el Paso 2.

## Paso 4 — Ciclo de vida
- **Desactivar médico** (`toggleDoctor`) desactiva también su usuario; reactivarlo lo reactiva. Sus consultas se conservan.
- **Desactivar el usuario** desde Admin de un usuario vinculado a un médico: permitido, pero el médico deja de poder atender (lo cubre el Prompt 14).
- **Cambiar el nombre del médico** actualiza el `name` del usuario vinculado (no el `username`).

## Tests (Pest + Vitest)
- Crear médico con «crear usuario nuevo» crea usuario `medico` vinculado, `must_change_password`, y devuelve las credenciales una vez.
- Colisión de usuario → sufijo numérico.
- «Vincular existente» con un usuario `administrador` le **agrega** `medico` y conserva `administrador`.
- No se puede vincular un usuario ya vinculado ni uno inactivo.
- Fallo en la creación del usuario → no se crea el médico (rollback).
- Restablecer contraseña genera una nueva y marca `must_change_password`.
- Desactivar/reactivar médico desactiva/reactiva su usuario.
- Vitest: el diálogo de credenciales muestra usuario y contraseña y tiene Copiar/Imprimir; selector de «vincular existente».

## Documentación
ADR nuevo en `docs/DECISIONS.md`: «Médico = registro en `doctors` vinculado a un usuario; el rol no basta». Actualiza `docs/DOMAIN.md`.

## Antes de abrir el PR
7 comandos con **código 0** (`npm run lint; echo $?`). Salida real en el PR. No incluyas capturas.
