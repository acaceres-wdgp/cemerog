# Prompt 20 — Perfil del paciente (historial clínico + cuentas)

> Pégalo **después** de mezclar el PR del Prompt 19 (`git checkout main && git pull`).

---

Adaptado del prompt de Claude Design «Prompt 07 — Perfil del paciente» a lo que hoy existe en el repo y a sus reglas. Lee `CLAUDE.md` y la sección **«Lecciones de los PR anteriores»** de `docs/prompts/PROMPT-18-cuenta-cargos-honorarios.md`, y síguelas.

**Referencia visual:** `design/CEMEROG v6.dc.html`, en **Recepción › Pacientes**. Desde el panel lateral, el botón **Ver perfil** abre la pantalla **Perfil del paciente**. Copia de ahí la estructura, los textos y los espaciados, pero con **tokens y componentes de `components/cemerog/`**: nada de hex ni `style={{` estáticos, aunque el diseño los use.

## Reglas
- **Rama:** `feat/perfil-paciente`, desde `main` recién actualizado. Abre un PR y **no lo mezcles**.
- Haz un commit por paso, empezando por el test que falla.
- **Prohibido:**
  - instalar dependencias;
  - usar `as any`, `@ts-ignore`, `eslint-disable` o `@phpstan-ignore`;
  - escribir hex o `style={{` estáticos;
  - pasar de ~250 líneas por archivo;
  - modificar `design/` o `components/ui/`.
- Trabaja **en esta rama, sin worktrees ni subagentes**. Al terminar, haz `git push` y comprueba con `git status` que no quedan cambios sin commit.
- Es una pantalla **de solo lectura**: las acciones llevan a los módulos que ya existen.

## 1. Entrada desde Pacientes
En el pie del panel lateral de `pages/pacientes/index.tsx`, los botones van en este orden:
1. **Editar** (secundario).
2. **Ver perfil** (secundario, con `ChevronRight`). Es un `<Link>` de Inertia con la ruta de Wayfinder `pacientes.show`.
3. **Nueva atención** (primario).

## 2. Ruta, permisos y breadcrumb
- **Ruta:** `GET /pacientes/{patient}` → `PacientesController@show`, con el nombre `pacientes.show`, dentro del grupo `permission:module.pacientes.access`. Usa route model binding y `->whereNumber('patient')`, para que no choque con `/pacientes/buscar`.
- **Acceso:** cualquier usuario con `module.pacientes.access` ve la parte clínica. El médico puede ver a cualquier paciente (prompt 19).
- **Breadcrumb:** `Recepción › Pacientes › Perfil del paciente`, con «Pacientes» como enlace. Usa el mecanismo de breadcrumb que ya tiene `layouts/app`. «Pacientes» debe quedar activo en el sidebar para `/pacientes/*`; revisa `activeFor` en `lib/navigation.ts`.
- **Finanzas:** solo con `module.caja.access` o el rol `administrador`. Sin ese permiso, el controlador **no envía** los datos financieros. Ocultarlos en la pantalla no basta. El médico no administrador no ve nada financiero.

## 3. Datos: la Action `App\Actions\Patients\BuildPatientProfile`
Sin lógica en el controlador. Evita N+1 con eager loading y sumas agregadas.
- **Paciente:** nombre, sexo, edad, expediente `P-00000`, tipo y número de documento (desencriptados como en el grid), fecha de nacimiento, teléfono, dirección, contacto de emergencia, fecha de registro, tipo de sangre y alergias.
- **Antecedentes:** usa la tabla que **ya existe**, `patient_antecedents` (`personales`, `quirurgicos`, `medicamentos`, `familiares`, `alergias`). **No** agregues columnas a `patients`. Si un antecedente está vacío, muestra «Ninguno conocido».
- **Atenciones:** los turnos del paciente, del más reciente al más antiguo, paginados de 20 en 20 en el servidor. Cada uno con:
  - número de turno, fecha, tipo (hoy solo «Consulta») y médico;
  - estado (incluido «No asistió»);
  - motivo y diagnóstico de su nota, si la hay;
  - alta: tipo y diagnóstico de egreso.
- **Historial clínico:** usa la Action `BuildClinicalHistory` del prompt 19. **No** dupliques la lógica.
- **Recetas:** fecha, médico, diagnóstico y medicamentos con la instrucción redactada. El botón para reimprimir usa la impresión de receta que ya existe. Esa ruta exige un médico activo (`canAttendPatients`), así que el backend envía un flag `can_print` y el botón solo aparece si es verdadero.
- **Análisis e imágenes:** todavía no existen. Devuelve una colección vacía con `// TODO(lab)` y muestra un estado vacío. No inventes tablas.
- **Finanzas** (solo con permiso): las **cuentas del día** (`accounts`) del paciente. Cada una con su fecha, estado (abierta, pendiente de facturar, facturada o anulada), sus cargos (descripción, cantidad, importe y médico) y su total. Totales:
  - **Total cargado:** suma de las cuentas que no están anuladas.
  - **Pendiente de facturar:** suma de las cuentas abiertas y pendientes de facturar.
  - **Facturas y pagos:** todavía no existen. Van vacíos, con el texto «Disponible cuando se implemente Caja» y un `// TODO(caja)`.
- Montos siempre en centavos (int). En la pantalla, muéstralos con `formatMoney()` o `MoneyText`.

## 4. Página `resources/js/pages/pacientes/show.tsx`
- **Barra superior:**
  - a la izquierda, «← Pacientes»;
  - a la derecha, «Editar datos» (secundario) y «Nueva atención» (primario), con los mismos permisos que en el grid.
- **Encabezado:**
  - avatar con iniciales;
  - nombre en Bitter de 22px;
  - `Sexo · edad · Expediente`;
  - chips: tipo de sangre; alergia en rojo o «Sin alergias conocidas»; antecedentes personales en ámbar.
- **Indicadores:** Atenciones y Última atención. Con permiso de finanzas, además Total cargado y Pendiente de facturar; este último en rojo si es mayor que 0.
- **Pestañas con contador:** Resumen · Historial clínico · Recetas · Análisis e imágenes · Finanzas (esta solo con permiso). La pestaña activa va en la URL (`?tab=historial`), con `router.get` y `preserveState`.
  - **Resumen:**
    - a la izquierda, Datos personales y Antecedentes;
    - a la derecha, las últimas 4 atenciones («Ver historial completo» abre esa pestaña) y, con permiso, un resumen de las cuentas pendientes.
  - **Historial clínico:** el mismo componente del prompt 19, con sus filtros. **Reutilízalo**, no lo copies.
  - **Recetas:** tarjetas con los medicamentos y el botón de reimprimir.
  - **Análisis e imágenes:** estado vacío.
  - **Finanzas:**
    - un aviso si hay monto pendiente de facturar;
    - la tabla de cuentas, con sus cargos y sus totales;
    - las secciones de Facturas y Pagos, vacías con el aviso de Caja.
- Todas las secciones tienen estado vacío.
- Es responsiva: `flex-wrap`, `grid` con `minmax` y las tablas dentro de `overflow-x-auto`.
- Divide la página en componentes, en `pages/pacientes/components/perfil/`.

## 5. Tests
**Pest:**
- el administrador recibe 200 con todas las props, incluida `finanzas`;
- el médico no administrador recibe 200 **sin** la prop `finanzas`;
- un usuario sin `module.pacientes.access` recibe 403;
- un id inexistente devuelve 404;
- `/pacientes/buscar` sigue funcionando (no choca con la ruta nueva);
- los totales son correctos: una cuenta anulada no suma, y una abierta más una pendiente de facturar suman en «Pendiente de facturar»;
- `can_print` es falso para un usuario sin médico activo.

**Unit:** `BuildPatientProfile` con atenciones, recetas y cuentas en varios estados.

**Vitest:**
- el panel de Pacientes muestra «Ver perfil» con el `href` correcto;
- cambiar de pestaña actualiza `?tab=`;
- sin `finanzas`, no aparecen ni la pestaña ni los indicadores de dinero;
- sin `can_print`, no aparece el botón de reimprimir.

## Antes de abrir el PR
Los 7 comandos deben terminar con **código 0**. Pega la salida **real** en la descripción del PR.

Prueba en Herd:
1. Entra como administrador, abre Pacientes → Ver perfil y recorre las 5 pestañas.
2. Entra como médico no administrador y comprueba que no aparece nada financiero.
3. Comprueba que la consola del navegador queda limpia.
