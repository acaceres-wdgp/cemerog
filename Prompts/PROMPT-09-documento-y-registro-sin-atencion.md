# Prompt 09 — Normalizar el documento por tipo + registrar paciente sin atención

> Pégalo en Claude Code en la raíz de `cemerog`, después de `git checkout main && git pull`.

Este prompt tiene **dos partes en el mismo PR**, en commits separados y en este orden: primero la **Parte A** (normalización del documento, que corrige deuda técnica) y después la **Parte B** (registrar sin atención).

---

# PARTE A — Normalizar el documento según su tipo

## Problema

`App\Support\Pii::hash($value, fallbackToFull: true)` calcula `document_number_hash` usando **solo los dígitos** cuando el valor tiene alguno. Para la cédula está bien: así `001-1234567-8` y `00112345678` son el mismo documento. Para otros tipos es incorrecto:

1. **Pasaportes y cédulas extranjeras distintos chocan.** `AB123456` y `XY123456` producen el mismo hash, así que el sistema rechaza al segundo paciente como duplicado. Como `patients.document_number_hash` tiene índice **único**, el choque también puede salir como error de base de datos.
2. **Bug en `App\Actions\CreatePatient` (tipo `no_tiene`).** El ciclo que genera `GEN-XXXXXXXX` comprueba la unicidad con `hash_hmac('sha256', $generated, …)`, que es el hash del código **completo**. Pero el modelo **guarda** `Pii::hash($generated)`, que son **solo los dígitos** del código aleatorio. Resultado: `GEN-AB12CD34` y `GEN-XY12ZW34` se guardan con el mismo hash (el de `1234`). La comprobación no lo detecta y la inserción **falla por el índice único**. Con suficientes pacientes sin documento, esto **va** a pasar.
3. **El listado de Pacientes no encuentra pasaportes.** `SearchPatients` y `PacientesController::index` tratan como búsqueda por nombre cualquier texto que contenga letras, así que buscar `AB123456` nunca compara contra el documento.

## A1 — Una sola función de normalización (TDD)

Crea en `App\Support\Pii` (o en una clase `App\Support\DocumentNumber`) **una única** función:

```php
public static function documentHash(string $type, string $number): string
```

Reglas de normalización, aplicadas antes del HMAC con `config('app.key')`:

| Tipo | Normalización | Ejemplo |
|---|---|---|
| `cedula` | Solo dígitos | `001-1234567-8` → `00112345678` |
| `pasaporte`, `cedula_extranjera` | Mayúsculas y sin espacios, guiones ni puntos (solo `[A-Z0-9]`) | `ab-123 456` → `AB123456` |
| `no_tiene` | Mayúsculas y solo `[A-Z0-9]` | `GEN-ab12cd34` → `GENAB12CD34` |

**Tests unitarios:**
- Cédula con y sin guiones → mismo hash.
- `AB123456` ≠ `XY123456`.
- `ab123456` = `AB-123456`.
- Una cédula y un pasaporte con los mismos dígitos (`00112345678` vs `P00112345678`) → hashes distintos.
- Dos códigos `GEN-` con los mismos dígitos pero letras distintas → hashes distintos.

`Pii::hash()` **se queda igual**, porque lo sigue usando `phone_hash` (para teléfonos, solo dígitos es lo correcto). Deja de usarlo para documentos.

## A2 — Usar la función en todos los lugares

El hash depende ahora **del tipo y del número**, así que el modelo ya no puede calcularlo en el setter de `document_number`: el orden en que se asignan los atributos no está garantizado. Haz esto:

- **`Patient`:** el setter de `document_number` solo cifra. Calcula `document_number_hash` en el evento `saving` del modelo, con `document_type` y el número descifrado.
- **`UniqueDocumentNumber`:** recibe el tipo, por ejemplo `new UniqueDocumentNumber(type: $this->input('document_type'), ignoreId: …)`, y usa `documentHash`. Actualiza sus tres usos: `StorePatientRequest`, `UpdatePatientRequest` y `RegisterArrivalRequest`.
- **`CreatePatient` (`no_tiene`):** la comprobación de unicidad del código generado debe usar **exactamente** `documentHash('no_tiene', $generated)`. Test: simula una colisión forzada y comprueba que se genera otro código.
- **Endpoint `GET /registro/pacientes/existe`:** recibe también `tipo` y usa `documentHash`. En el frontend, el aviso de duplicados de `registro/index.tsx` envía `tipo` = `data.document_type`.
- **Búsqueda (`SearchPatients` y `PacientesController::index`):**
  - Si la consulta son solo dígitos y separadores, compara contra `documentHash('cedula', q)` y contra `phone_hash`, como hasta ahora.
  - Si la consulta es **un solo término alfanumérico que contiene al menos un dígito** (por ejemplo `AB123456`), compara **también** contra `documentHash('pasaporte', q)`. Ese hash coincide con pasaportes y cédulas extranjeras, porque comparten normalización. Sigue haciendo la búsqueda por nombre (`LIKE`) con OR.
  - Tests: encuentra por pasaporte, sigue encontrando por cédula, por teléfono y por nombre.
- **Limpieza:** `grep -rn "hash_hmac\|Pii::hash" app` no debe mostrar ningún cálculo de hash de **documento** fuera de `documentHash`.

## A3 — Migración de datos (con test de reversión)

Crea una migración nueva (no edites ninguna existente) que recalcule `document_number_hash` para **todos** los pacientes, incluidos los eliminados con soft delete (`withTrashed`):
- Descifra con `Pii::decrypt` y aplica `documentHash(document_type, número)`. Procesa en bloques (`chunkById`).
- **Antes de escribir nada**, calcula todos los hashes nuevos y comprueba que no haya duplicados. Si los hay, **aborta** con un error claro que liste los IDs de los pacientes afectados, sin dejar datos a medias. Si lo necesitas, envuélvelo en una transacción.
- **`down()`:** recalcula con el algoritmo anterior (solo dígitos y, si no hay dígitos, el valor completo), para que la reversión sea real.
- **Test en `tests/Feature/Database/`:**
  - Con pacientes de los tres tipos, `up` deja los hashes nuevos y `down` restaura los anteriores.
  - Con dos pasaportes que antes chocaban, después de `up` quedan distintos.

## A4 — Documentación

En `docs/DECISIONS.md`, nuevo ADR: «Normalización del documento por tipo». Debe explicar:
- por qué se normaliza así;
- el bug de `GEN-`;
- la migración.

Actualiza también la fila de **PII** en `CLAUDE.md`: el hash de documento se calcula con `documentHash(tipo, número)`, no con `Pii::hash`.

---

# PARTE B — Registrar un paciente sin crear atención

## Contexto

Hoy el formulario de `/registro` **siempre** crea paciente + atención en la misma operación (`RegistroController::store` → `RegisterArrival`), y por eso el médico es obligatorio. La clínica necesita también **registrar solo al paciente**, sin turno. Ejemplo: alguien que llama para agendar una cita otro día, o una ficha que se completa antes de la primera visita.

Ya existen piezas que se pueden reutilizar:
- `App\Http\Requests\StorePatientRequest`: tiene validación completa (incluido `UniqueDocumentNumber` y la foto), pero **no está conectado a ninguna ruta**.
- `App\Actions\CreatePatient`.

Lee `CLAUDE.md` y síguelo.

## Reglas (aplican a las Partes A y B)

- **Rama:** `feat/documento-y-registro-sin-atencion`, creada desde `main` **recién actualizado**. Abre un PR y **no lo mezcles**.
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

- Las Partes A y B van en commits separados (A primero).
- Los 7 comandos deben terminar con **código 0**. Comprueba el lint con `npm run lint; echo $?`.
  ```bash
  vendor/bin/pint --test && vendor/bin/phpstan analyse --level=6 && vendor/bin/pest
  npm run types:check && npm run lint && npm run test && npm run build
  ```
- La descripción del PR debe incluir la ruta nueva, los tests agregados y la salida real de los comandos.
- No incluyas capturas.
