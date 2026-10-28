# Prompt 12a — Consulta: tests de caracterización y partir el archivo

> Pégalo en Claude Code en la raíz de `cemerog`, después de `git checkout main && git pull`.

---

`resources/js/pages/consulta/index.tsx` tiene **2.344 líneas** y concentra la cola, el encabezado del paciente, los antecedentes, la nota clínica, la receta, las órdenes y cargos, el historial y el alta. Antes de agregar funcionalidades hay que partirlo.

**Este PR solo mueve código:** no cambia ninguna clase, estilo, color, texto ni comportamiento. Los tokens se migran en el PR siguiente (12b). Lee `CLAUDE.md` y usa como modelo `resources/js/pages/citas/` y `resources/js/pages/tablero/`.

## Reglas
- **Rama:** créala desde `main` **recién actualizado**, con el nombre `refactor/consulta-partir`. Abre un PR y **no lo mezcles**.
- **Commits:** exactamente dos, en este orden:
  1. los tests;
  2. la partición.
- **Archivos que puedes tocar:** solo `resources/js/pages/consulta/` y `resources/js/__tests__/consulta-index.test.tsx`.
- **Prohibido:**
  - cambiar cualquier `className`, `style`, color, texto o lógica;
  - tocar el backend o `components/`;
  - instalar dependencias;
  - usar `as any`, `@ts-ignore` o `eslint-disable`.
- **Líneas movidas:** cada línea de JSX que muevas debe quedar **idéntica**. Solo cambian los imports, las exportaciones y las props necesarias para pasar datos entre componentes.

## Commit 1 — Tests de caracterización

Crea `resources/js/__tests__/consulta-index.test.tsx`, con el estilo de `citas-index.test.tsx` y `tablero-index.test.tsx`, que fije el comportamiento actual de la página:

- **Cola (`QueueSelector`):**
  - muestra los turnos en consulta y en espera;
  - elegir un paciente hace `router.get` con los parámetros correctos;
  - sin turnos, muestra «No hay pacientes en turno hoy.».
- **Sin paciente activo:** se muestra «Sin paciente activo».
- **Encabezado:** nombre, edad, sexo y la **alergia** destacada.
- **Antecedentes:** editarlos y guardar hace `router.patch('/consulta/antecedentes/{id}', …)` con el payload correcto.
- **Nota clínica:**
  - llenar los signos vitales, el motivo, la historia, el examen, el diagnóstico y el plan, y guardar, hace `router.post` con el payload actual: `peso` × 10, `talla` en cm, etc.;
  - el **IMC** mostrado para 70 kg y 170 cm es `24.2 Normal`.
- **Pestañas:** «Nota clínica», «Receta» y «Cuenta / Órdenes» cambian el contenido visible.
- **Receta (estado actual):** se pueden agregar y quitar filas de medicamento en pantalla.
- **Historial:**
  - muestra las consultas pasadas;
  - al elegir una se ve su detalle (diagnóstico, motivo y plan);
  - sin historial, muestra «Sin historial registrado».
- **Dar de alta:** la acción actual hace `router.patch` a la ruta de alta del turno correcto.

Estos tests deben pasar con el código actual y **no pueden cambiar de lógica** en el commit 2.

## Commit 2 — Partir el archivo

Crea dentro de `resources/js/pages/consulta/`:
- `types.ts`, con los tipos (`TurnItem`, `HistorialEntry`, el formulario de la nota…);
- `lib/`, con los helpers (`initials`, `computeImc`) y las constantes;
- `components/`, como mínimo con:
  - `QueueSelector`;
  - `PatientHeader`, separando `AntecedentesPanel` si es un bloque grande;
  - `NotaClinica`, dividida en `SignosVitales`, `DiagnosticoCie10` y el resto de los campos si pasa de ~250 líneas;
  - `RecetaTab`;
  - `CuentaOrdenesTab`;
  - `HistorialPanel`, separando lista y detalle;
  - `ConsultaActions`, para la barra de acciones y el alta.

**Meta:** `index.tsx` por debajo de ~200 líneas y ningún archivo por encima de ~250.

## Antes de abrir el PR
- Los 7 comandos deben terminar con **código 0**. Comprueba el lint con `npm run lint; echo $?`.
  ```bash
  vendor/bin/pint --test && vendor/bin/phpstan analyse --level=6 && vendor/bin/pest
  npm run types:check && npm run lint && npm run test && npm run build
  ```
- La descripción del PR debe incluir:
  - la lista de archivos nuevos con sus líneas (`wc -l`);
  - la salida real de los comandos;
  - la confirmación de que no cambió ninguna clase, estilo ni texto.
- No incluyas capturas: la comparación visual la hago yo.
