# Prompt 09 — Registrar un paciente sin crear atención

> Pégalo **después** de que se mezcle el PR del Prompt 08 (`git checkout main && git pull`).

---

## Contexto

Hoy el formulario de `/registro` **siempre** crea paciente + atención en la misma operación (`RegistroController::store` → `RegisterArrival`), y por eso el médico es obligatorio. La clínica necesita también **registrar solo al paciente**, sin turno. Ejemplo: alguien que llama para agendar una cita otro día, o una ficha que se completa antes de la primera visita.

Ya existen piezas que se pueden reutilizar:
- `App\Http\Requests\StorePatientRequest`: tiene validación completa (incluido `UniqueDocumentNumber` y la foto), pero **no está conectado a ninguna ruta**.
- `App\Actions\CreatePatient`.

Lee `CLAUDE.md` y síguelo.

## Reglas

- **Rama:** `feat/registrar-sin-atencion`, creada desde `main` **recién actualizado**. Abre un PR y **no lo mezcles**.
- **Commits:** uno por paso, empezando por el test que falla.
- **Prohibido:**
  - cambiar el flujo actual de «Registrar y crear atención» (`registro.store` / `RegisterArrival`);
  - instalar dependencias;
  - usar `as any`, `@ts-ignore` o `eslint-disable`;
  - escribir hex o `style={{` estáticos.
- **Tests existentes:** todos los de Registro, Pacientes y Turnos deben seguir pasando **sin cambiar su lógica**.

## Paso 1 — Backend: ruta para crear solo el paciente

1. Agrega `POST /registro/pacientes` → `RegistroController::storePatient`, con nombre `registro.pacientes.store`, dentro del grupo con `permission:module.registro.access`.
2. `storePatient` usa `StorePatientRequest` + `CreatePatient` y **no** crea turno.
3. Al terminar redirige a `/pacientes?paciente={id}`, para que se abra el panel del paciente recién creado, con el flash de éxito «Paciente registrado.».
4. Tests Pest (`tests/Feature/Registro/StorePatientOnlyTest.php`):
   - Crea el paciente sin crear ningún `Turn`.
   - Redirige al panel del paciente.
   - Rechaza una cédula duplicada con el mismo mensaje de `UniqueDocumentNumber`.
   - Valida los campos obligatorios del paciente, pero **no** exige `doctor_id`.
   - Un usuario sin `module.registro.access` recibe 403.
   - Con foto, la guarda igual que en el flujo con atención.

## Paso 2 — Frontend: segundo botón en modo «nuevo paciente»

En `resources/js/pages/registro/index.tsx`, **solo en modo `new`**:

- Al pie del formulario, junto a «Registrar y crear atención», agrega un botón secundario **«Solo registrar paciente»**. Usa el estilo de botón secundario que ya existe y los tokens.
- Al pulsarlo:
  - Envía **solo los campos del paciente** (y la foto, si la hay) a `registro.pacientes.store`, usando la ruta de Wayfinder.
  - No exige médico ni ningún otro dato de la sección «Nueva atención».
  - Si el backend devuelve errores, se muestran en los mismos campos que hoy.
- Para el botón principal, «Registrar y crear atención», **nada cambia**: sigue exigiendo médico.
- Para que la diferencia quede clara, debajo de los botones pon un texto pequeño en `text-muted`:

  > «Solo registrar paciente» guarda la ficha sin asignar turno; podrás crear la atención más tarde desde el listado de Pacientes.

- En modo `existing` (`/registro?paciente=ID`) el botón **no** aparece, porque el paciente ya existe.

Tests (Vitest):
- En modo `new`, el botón existe. Al pulsarlo con los datos del paciente llenos y **sin** médico, llama a `post`/`router.post` con la ruta `registro.pacientes.store` y **sin** `doctor_id` ni otros campos de atención en el payload.
- En modo `existing`, el botón no aparece.
- El botón principal sigue mostrando el error de médico obligatorio si no se elige médico.

## Paso 3 — Resumen y textos

- **Panel «Resumen» de la derecha:** se mantiene como está, pero cuando el usuario use «Solo registrar paciente» no debe quedar ningún texto que sugiera que se creó un turno.
- **`docs/DOMAIN.md`:** agrega la regla «Un paciente puede registrarse sin atención; la atención se crea después desde el listado (Nueva atención) o desde el Tablero (Agregar turno)».
- **`docs/MODULES.md`:** actualízalo si describe el flujo de Registro.

## Antes de abrir el PR

- Los 7 comandos deben terminar con **código 0**. Comprueba el lint con `npm run lint; echo $?`.
  ```bash
  vendor/bin/pint --test && vendor/bin/phpstan analyse --level=6 && vendor/bin/pest
  npm run types:check && npm run lint && npm run test && npm run build
  ```
- La descripción del PR debe incluir la ruta nueva, los tests agregados y la salida real de los comandos.
- No incluyas capturas.
