# Prompt 06 — Vincular médico ↔ usuario y consultorio

> Pégalo **después** de mezclar el PR del Prompt 05 (`git checkout main && git pull`).

---

Para que la barra lateral muestre la cola de turnos del médico que inició sesión, cada médico (`doctors`) debe poder estar vinculado a un usuario (`users`) y tener un consultorio. Lee `CLAUDE.md`.

**Regla de negocio:** cualquier médico puede atender a cualquier paciente. El vínculo médico↔usuario solo sirve para saber **qué cola es la del usuario que inició sesión**. **No** restringe qué pacientes puede ver o atender.

## Reglas
- **Rama:** créala desde `main` **recién actualizado**, con el nombre `feat/medico-usuario`. Abre un PR y **no lo mezcles**.
- **Prohibido:**
  - Editar migraciones existentes; crea migraciones nuevas, cada una con su test de reversión.
  - Instalar dependencias.
  - Usar `as any`, `@ts-ignore` o `@phpstan-ignore`.
  - Escribir hex o `style={{` en páginas.

## Qué hacer (TDD)
1. **Migración nueva** sobre `doctors`:
   - `user_id`: nullable, foreign key a `users` con `nullOnDelete` e índice **único** (un usuario corresponde como máximo a un médico).
   - `office`: string nullable, por ejemplo "Consultorio 1".
   - Agrega un test de reversión en `tests/Feature/Database/`.
2. **Modelo:** relación `Doctor::user()` (`belongsTo`) y `User::doctor()` (`hasOne`), con tests.
3. **Doctores (admin):** en el formulario de crear y editar médico agrega:
   - un selector "Usuario del sistema", que liste solo usuarios con rol `medico` que no estén ya vinculados a otro médico, más el actual;
   - un campo "Consultorio".

   Usa `FormField` y los tokens. Agrega la validación en los Form Requests (`user_id` único en `doctors`, el usuario debe tener rol `medico`), con tests de feature.
4. **Datos compartidos:** en `HandleInertiaRequests`, si el usuario autenticado tiene un médico vinculado, comparte:
   ```
   doctor: { id, name, office } | null
   ```
   Agrega un test en `InertiaSharedPropsTest`.
5. **Seeder:** en `DemoSeeder`, vincula los usuarios de rol `medico` con médicos de demo y asígnales consultorio. `AdminUserSeeder` y `RolesAndPermissionsSeeder` no se tocan.

## Antes de abrir el PR
- Los 7 comandos deben terminar con **código 0**. Comprueba el lint con `npm run lint; echo $?`.
- Pon la salida real en la descripción del PR.
