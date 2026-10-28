# Prompt 08 — Registro: quitar el buscador y entrar directo al formulario

> Pégalo en Claude Code en la raíz de `cemerog`, después de `git checkout main && git pull`.

---

## Contexto

Hoy, en `/registro` (`resources/js/pages/registro/index.tsx`), el usuario primero tiene que buscar el paciente. El formulario aparece bloqueado (`mode === 'search'`) hasta que elige un resultado o pulsa «Registrar como paciente nuevo».

Ese paso sobra. Antes de llegar al formulario ya está el listado de **Pacientes** (`/pacientes`), con su buscador y su panel de detalle:
- para un paciente **existente**, se busca en el listado y desde su panel se pulsa «Nueva atención», que lleva a `/registro?paciente={id}`;
- «**Nuevo paciente**» debe llevar **directo al formulario vacío y habilitado**.

Lee `CLAUDE.md` y síguelo.

## Reglas

- Rama: créala desde `main` **recién actualizado** con el nombre `feat/registro-directo`. Abre un PR y **no lo mezcles**.
- Haz un commit por paso y empieza cada cambio con un test que falle.
- Prohibido:
  - cambiar la validación del backend que evita duplicados (`UniqueDocumentNumber`);
  - tocar `design/` o `components/ui/`;
  - instalar dependencias;
  - usar `as any`, `@ts-ignore` o `eslint-disable`;
  - escribir hex o `style={{` estáticos.
- **Tests existentes:** este cambio quita a propósito el modo «búsqueda». Puedes eliminar o reescribir los tests que validan ese modo, sobre todo en `registro-autocomplete.test.tsx`, pero **lista en el PR cada test eliminado o reescrito y explica por qué**. Los demás tests de Registro deben seguir pasando sin cambiar su lógica: `registro-age`, `registro-open-turn`, `registro-adjustments` y `RegisterArrivalTest`.

## Paso 1 — Dos modos en lugar de tres

`registro/index.tsx` debe tener solo dos modos:

| URL | Modo | Comportamiento |
|---|---|---|
| `/registro` | `new` | Formulario **vacío y habilitado** desde el inicio. Breadcrumb: «Nuevo paciente». |
| `/registro?paciente={id}` | `existing` | Igual que hoy: datos precargados, aviso de atención abierta si aplica, y el breadcrumb «Nueva atención». |

Qué cambia:
- Elimina:
  - el buscador del formulario;
  - el modo `search`, junto con su texto de ayuda «Busca un paciente o elige…» y el aviso «Busca primero por cédula…»;
  - el botón «Registrar como paciente nuevo»;
  - el enlace «Volver a buscar» o `handleChangePatient`.
- En modo `existing`, sustituye «Cambiar paciente» o «Volver a buscar» por un enlace «Volver a pacientes» que lleve a `/pacientes`.
- Quita el texto superior «Busca primero por cédula. Si el paciente no existe…». Pon en su lugar un subtítulo según el modo:
  - `new`: «Completa los datos del paciente y crea su primera atención.»
  - `existing`: «Crea una nueva atención para este paciente.»
- Elimina el código que quede sin uso: estado del buscador, imports, tipos y la llamada a `/registro/pacientes/buscar` **desde esta página**. **No** elimines la ruta, porque la usan otros módulos.

Tests (Vitest):
- `/registro` sin `paciente` muestra el formulario habilitado, sin buscador. Los campos Nombres, Cédula y Médico se pueden editar sin interacción previa.
- Con `patient` en las props, los datos aparecen precargados y está el enlace «Volver a pacientes».

## Paso 2 — Red de seguridad contra duplicados (sin bloquear)

Al quitar la búsqueda previa aumenta el riesgo de registrar dos veces al mismo paciente. El backend ya lo impide por cédula (`UniqueDocumentNumber`), pero hoy el usuario solo se entera **al guardar**, después de llenar todo el formulario.

Agrega un aviso temprano:
- En modo `new`, cuando el número de documento queda **completo** (la máscara de cédula `000-0000000-0` se llena, o el pasaporte tiene al menos 6 caracteres), consulta en segundo plano el endpoint existente `/registro/pacientes/buscar?q={documento}`, que ya busca por hash exacto. Usa debounce de unos 400 ms.
- Si hay coincidencia, muestra un `AlertBanner` variante `warning` debajo del campo:

  > «Ya existe un paciente con este documento: **{Nombre}** ({edad} años). [Ver ficha] [Crear atención para este paciente]»

  - «Ver ficha» lleva a `/pacientes?paciente={id}`.
  - «Crear atención para este paciente» lleva a `/registro?paciente={id}`.
- **No bloquees el formulario.** El aviso solo informa; el backend sigue validando al guardar.
- No consultes con tipo de documento `no_tiene`.

Tests (Vitest):
- Con un documento incompleto no se consulta.
- Con un documento completo se consulta una sola vez, gracias al debounce.
- Con coincidencia aparecen el aviso y los dos enlaces con las URL correctas.
- Sin coincidencia no aparece nada.

## Paso 3 — Estado vacío del listado de Pacientes (opcional, pero recomendado)

En `/pacientes`, cuando una búsqueda no encuentra resultados, el botón «Registrar paciente nuevo» debe pasar lo buscado al formulario:
- si lo buscado son solo dígitos (con o sin guiones), va a `/registro?documento={valor}`, y el formulario lo pone en «No. de documento» con tipo Cédula;
- si es texto, va a `/registro?nombre={valor}`, y el formulario lo pone en «Nombres».

Valida y sanea los parámetros en `RegistroController::create`: limita la longitud y quita etiquetas.

Tests:
- Pest: `create` acepta y sanea los parámetros.
- Vitest: el formulario los precarga.

## Antes de abrir el PR

- Los 7 comandos deben terminar con **código 0**. Verifica el lint con `npm run lint; echo $?`.
  ```bash
  vendor/bin/pint --test && vendor/bin/phpstan analyse --level=6 && vendor/bin/pest
  npm run types:check && npm run lint && npm run test && npm run build
  ```
- `registro/index.tsx` debería **reducirse**. Indica en el PR las líneas antes y después.
- La descripción del PR debe incluir:
  - los tests eliminados o reescritos, con su motivo;
  - la salida real de los comandos.
- No incluyas capturas: la revisión visual la hago yo.
