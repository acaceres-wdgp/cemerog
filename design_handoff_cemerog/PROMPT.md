# Prompt para Claude Code — Fase 0: estructura de CEMEROG

> **Antes de pegar el prompt:**
> 1. `git clone https://github.com/acaceres-wdgp/cemerog.git && cd cemerog`
> 2. Copia esta carpeta de handoff completa a `design/` en la raíz del repo (el prototipo, `support.js`, `README.md`, `assets/`).
> 3. Abre Claude Code en la raíz del repo y pega todo lo que está debajo de la línea.

---

Vas a crear la base del proyecto **CEMEROG**, un sistema de gestión clínica para un centro médico en República Dominicana (Dres. Rodríguez & Guzmán). El repositorio es `https://github.com/acaceres-wdgp/cemerog.git` y ya está clonado en el directorio actual.

En esta fase **solo** se arma la estructura: proyecto, contexto para agentes, sistema de diseño, layout, autenticación, roles y un esqueleto vacío por módulo. **No implementes lógica de negocio.** Después agregaré cada funcionalidad una por una, con TDD, usando las pantallas del prototipo como referencia.

**Referencia de diseño:** `design/CEMEROG v6.dc.html` (ábrelo en el navegador; necesita `design/support.js` al lado). El selector de rol y los Tweaks permiten ver cada rol y estado. `design/README.md` tiene tokens, navegación, roles, reglas de formato y el resumen funcional de cada pantalla. Es **referencia visual y funcional, no código para copiar**: recréalo con los componentes del stack. **No borres ni modifiques nada dentro de `design/`.**

## 1. Stack (no lo cambies sin preguntarme)

- **Laravel 12** con el **starter kit oficial de React** (Inertia 2, React 19, TypeScript, Tailwind CSS 4, shadcn/ui). Si el repo está vacío, crea el proyecto con `laravel new` (opción React, Pest) en una carpeta temporal y mueve el contenido a la raíz conservando `.git` y `design/`.
- **Base de datos:** MySQL 8 en local y producción. Tests con SQLite en memoria (`:memory:`) salvo que algo requiera MySQL; en ese caso documéntalo.
- **Backend:** `spatie/laravel-permission`, `spatie/laravel-activitylog`, `larastan/larastan` (nivel 6+), `laravel/pint`.
- **Tests:** Pest (Unit + Feature), **Vitest + React Testing Library** para componentes y hooks, **Pest browser testing** (Playwright) solo para smoke E2E.
- **Frontend:** ESLint + Prettier del kit, `lucide-react`, `sonner` (toasts), `date-fns` con locale `es`, TanStack Table para tablas.
- **Idioma:** UI en español (es-DO). Código, tablas, columnas, clases, rutas y nombres de tests en **inglés**. Textos de backend en `lang/es`. Zona horaria `America/Santo_Domingo`, locale `es`.

## 2. Entorno local y despliegue

- **Local:** debe funcionar con `composer run dev` (servidor + Vite + queue + logs). Documenta en el README cómo hacerlo con Laravel Herd y con PHP/MySQL nativos. No uses Docker como requisito.
- **Producción: Laravel Forge** (lo configuraré yo). Deja el proyecto listo para Forge:
  - `.env.example` completo y comentado (APP_*, DB_* MySQL, `SESSION_DRIVER=database`, `QUEUE_CONNECTION=database`, `CACHE_STORE=database`, `MAIL_MAILER=log` porque **no habrá envío de correos por ahora**, `APP_TIMEZONE`, `APP_LOCALE=es`).
  - Migraciones de `sessions`, `jobs`, `cache` incluidas.
  - `docs/DEPLOYMENT.md` con: requisitos del servidor (PHP 8.3+, MySQL 8, Node 20+), **script de deploy sugerido para Forge** (`composer install --no-dev --optimize-autoloader`, `npm ci && npm run build`, `php artisan migrate --force`, `optimize`, `queue:restart`), configuración del worker de colas y del scheduler (`schedule:run`), checklist del primer despliegue (APP_KEY, seeders permitidos en producción solo para roles/permisos y el admin inicial) y cómo hacer rollback.
  - Seeders separados: `RolesAndPermissionsSeeder` y `AdminUserSeeder` (seguros para producción, idempotentes) y `DemoSeeder` (solo local).

## 3. Archivos de contexto para agentes (obligatorio, créalos primero)

Crea estos archivos. Son la memoria del proyecto: **en cada sesión futura Claude Code debe leer `CLAUDE.md` y seguirlo.** Escríbelos completos, no como plantillas vacías.

### 3.1 `CLAUDE.md` (raíz)
Corto (máx. ~150 líneas), directo y con enlaces a `docs/`. Debe contener:
- Qué es el proyecto, el stack y los comandos clave (dev, test, lint, types, phpstan, pint, build).
- **Regla de oro: ninguna funcionalidad se da por terminada sin tests.** Cada funcionalidad nueva o cambio de comportamiento lleva sus Unit tests y Feature tests (y Vitest si toca UI con lógica). Bugs: primero un test que lo reproduzca.
- Flujo TDD obligatorio: listar casos de prueba → pedirme OK → test rojo → código mínimo → verde → refactor → suite completa en verde.
- Arquitectura y dónde va cada cosa (resumen de `docs/ARCHITECTURE.md`).
- Convenciones: dinero en centavos, formato de fechas y códigos, idioma, nombres.
- Cómo usar el prototipo: "para la funcionalidad X, abre `design/CEMEROG v6.dc.html` en el menú Sección › Página; replica layout, textos y estados; los datos del prototipo son ficticios".
- Antes de terminar cada tarea: correr `composer test`, `npm run test`, `npm run lint`, `npm run types`, `./vendor/bin/phpstan analyse`, `./vendor/bin/pint --test`, y actualizar `docs/MODULES.md` y, si aplica, `docs/DECISIONS.md`.
- Qué **no** hacer: no cambiar el stack, no tocar `design/`, no hacer commits con tests en rojo, no saltarse Form Requests/Policies, no lógica de negocio en controladores ni en componentes React, no `any` en TypeScript.

### 3.2 `docs/TESTING.md` — buenas prácticas de testing
Debe cubrir, con ejemplos de código Pest y Vitest del propio proyecto:
- **Pirámide:** muchos Unit (Actions, Value Objects, Enums, helpers, cálculos), Feature para cada endpoint (HTTP + autorización + validación + efectos en BD), pocos E2E.
- **Qué testear siempre en una funcionalidad:** camino feliz; cada regla de validación; autorización (rol permitido y **cada rol no permitido → 403**); casos límite (vacío, cero, máximos, fechas límite); efectos secundarios (registros creados, inventario descontado, cargos generados, activity log); idempotencia cuando aplique.
- **Estructura AAA** (Arrange, Act, Assert), **un comportamiento por test**, nombres descriptivos en inglés tipo `it('rejects a payment when the cash shift is closed')`.
- **Independencia:** `RefreshDatabase`, nada de orden entre tests, sin dependencia de la hora real (`$this->travelTo()` / `Carbon::setTestNow()`, `vi.useFakeTimers()`), sin red.
- **Factories** con estados expresivos (`Patient::factory()->withAllergy('Penicilina')`), nunca datos hardcodeados repetidos; datasets de Pest para tablas de casos (p. ej. rangos de signos vitales, permisos por rol).
- **Mocks solo en los bordes** (servicios externos, filesystem, colas, notificaciones con `Queue::fake()`, `Storage::fake()`); no mockear el código propio que se está probando.
- **Dinero y cálculos:** tests con centavos y redondeo; nunca floats.
- **Frontend:** RTL consultando por rol/label/texto visible (no por clases), `userEvent`, accesibilidad básica; tests de hooks y helpers puros; nada de snapshots grandes.
- **Cobertura:** objetivo ≥ 80 % en `app/Actions`, `app/Domain` / `app/Support` y helpers de `resources/js/lib`; la cobertura no reemplaza buenos casos. Comandos para medir.
- **Checklist por PR** (copiable) y **antipatrones** a evitar (tests que prueban el framework, asserts débiles, sleeps, tests que pasan sin la implementación).

### 3.3 `docs/ARCHITECTURE.md`
- Backend: controladores delgados; lógica en **Actions** (`app/Actions/<Domain>/<Verb><Noun>.php`, un método `handle`); **Form Requests** para validación; **Policies** para autorización; **Enums** de PHP para estados; DTOs (`app/Data`) cuando haya más de 3–4 parámetros; transacciones en Actions que escriben varias tablas; eventos de dominio solo si hay más de un consumidor.
- Frontend: `resources/js/pages/<module>/…` (páginas Inertia), `components/ui` (shadcn), `components/cemerog` (componentes de dominio reutilizables), `hooks/`, `lib/` (helpers puros: `formatMoney`, fechas, códigos), `types/`.
- Estados compartidos: un enum PHP es la fuente de verdad y se expone a TS (tipos generados o un archivo `types/enums.ts` mantenido con un test que verifique que coinciden).
- Auditoría con activitylog en modelos sensibles (pagos, facturas, inventario, usuarios, turnos de caja).
- Diagrama de carpetas.

### 3.4 `docs/DOMAIN.md`
Glosario (atención, turno de cola, turno de caja, cuenta, cargo, factura, recibo, crédito, CxC, orden de lab/imagen, cubículo, cama, etc.) y las **reglas de negocio ya decididas** que aparecen en `design/README.md` → *Screens*, organizadas por módulo. Marca cada regla como "pendiente de implementar". Incluye las reglas de formato (moneda, fechas, cédula, códigos A-/F-/R-/L-/I-/T-).

### 3.5 `docs/MODULES.md`
Tabla de los módulos de la navegación (clave, ruta, roles con acceso, pantalla de referencia en el prototipo, estado: `esqueleto` / `en progreso` / `terminado`, enlaces a tests). Se actualiza al terminar cada funcionalidad. Incluye el orden sugerido de implementación (sección 6).

### 3.6 `docs/DECISIONS.md`
Registro de decisiones (formato ADR corto: fecha, contexto, decisión, consecuencias). Empieza con: stack elegido; login por **usuario** en vez de email; sin envío de correos por ahora; dinero en centavos; una sola clínica (sin multi-sede); Forge para despliegue.

### 3.7 Comando reutilizable `.claude/commands/feature.md`
Un slash command `/feature` que reciba el nombre de la funcionalidad y ejecute el flujo de la sección 6 (plantilla de funcionalidad). Debe recordar leer `CLAUDE.md`, `docs/TESTING.md`, `docs/DOMAIN.md` y la pantalla del prototipo antes de empezar.

## 4. Tareas de la Fase 0

### 4.1 Tema y tokens
- En `resources/css/app.css` reemplaza las variables de shadcn por los tokens de `design/README.md` (primary `#2E8B3E`, accent `#EEF6E2`/`#8CC63F`, fondo `#F3F7F2`, bordes, radios, sombras, anillo de foco) y los **9 estados de atención** y los 5 niveles de triaje como variables expuestas con `@theme`.
- Fuentes: **Instrument Sans** (UI, 14px, line-height 1.45) y **Bitter** (títulos y marca).
- Solo modo claro: desactiva el selector de apariencia del kit.

### 4.2 Autenticación (adaptar el kit)
- **Login con `username` + contraseña**, no con email. Agrega la columna `username` (única, minúsculas, sin espacios) a `users`; `email` queda nullable y no se usa en la UI.
- **Quita** registro público, verificación de email y "olvidé mi contraseña" por correo. El texto del login dice que el administrador restablece la contraseña.
- Columna `must_change_password` (bool). Middleware que, si está activa, redirige toda ruta autenticada a `/password/change-required` ("Crea tu contraseña": mín. 8 caracteres, al menos un número, confirmación). Al guardar, se desactiva la bandera.
- Usuarios inactivos (`is_active=false`) no pueden iniciar sesión (mensaje claro).
- "Cambiar mi contraseña" en el menú de usuario (pide la actual).
- Rate limiting de login (el del kit).
- Estilo de login según el prototipo (botón *Cerrar sesión* del menú de usuario → pantalla de login): panel de marca a la izquierda en pantallas anchas, tarjeta de formulario centrada.
- **Tests:** login por username, credenciales inválidas, usuario inactivo, redirección por `must_change_password`, reglas de la nueva contraseña, cambio de contraseña propia, que `/register` y `/forgot-password` no existan.

### 4.3 Roles y permisos
- Roles: `Administrador`, `Médico`, `Enfermería`, `Secretaría/recepción`, `Bioanalista`, `Imágenes`, `Caja`, `Almacén`. Un usuario puede tener **varios roles**.
- Un permiso `module.<key>.access` por módulo (claves y asignación en `design/README.md` → *Navegación y roles*, incluidos `analisis` e `imgcat`). El Administrador tiene todos.
- Middleware de permiso por ruta (403 si no tiene acceso) y módulos permitidos compartidos en `HandleInertiaRequests`.
- `AdminUserSeeder`: crea el administrador inicial con usuario y contraseña tomados de `.env` (`ADMIN_USERNAME`, `ADMIN_PASSWORD`) y `must_change_password=true`.
- `DemoSeeder` (solo local): un usuario por rol, contraseña `password`.
- **Tests:** dataset por rol con los módulos que ve y 403 en el resto.

### 4.4 Layout
- `AppLayout` con **sidebar oscuro colapsable** (logo, nombre y subtítulo o solo iconos), tres temas (Carbón `#2A2E2C`, Pizarra `#1F2B33`, Verde bosque `#173F26`), ítems agrupados por sección y **filtrados por permisos**. Estado colapsado en cookie.
- Topbar: breadcrumb (Sección › Página) con fecha, búsqueda global (solo UI), notificaciones (solo UI), espacio reservado para el **indicador de turno de caja** (solo UI por ahora) y menú de usuario (nombre, usuario, roles, Cambiar mi contraseña, Cerrar sesión). El breadcrumb no debe cortarse en pantallas estrechas.
- **Tests:** Vitest del filtrado del sidebar y del menú de usuario.

### 4.5 Librería de componentes (`components/cemerog`)
Cada uno con tests de Vitest y visible en `/dev/components` (solo en `local`):

| Componente | Base | Notas |
|---|---|---|
| `StatusBadge` | — | 9 estados de atención (enum compartido) |
| `TriageBadge` | — | Niveles I–V |
| `StatCard` | Card | Valor sin desbordar (tabular-nums) |
| `SegmentedControl` | — | Píldoras con contador opcional |
| `FilterChips` | — | Selección única o múltiple |
| `PageHeader` | — | Título, subtítulo, acciones |
| `Panel` | Card | Encabezado con título/acciones y cuerpo |
| `DataTable` | Table + TanStack | Encabezado verde claro, `nowrap` en códigos, vacío, **paginación del servidor** (Laravel paginator) y búsqueda |
| `FormField` | Label + Input/Textarea/Select | Error, ayuda, requerido |
| `PasswordInput` | Input | Mostrar/ocultar, generador opcional |
| `MoneyText` / `formatMoney` | — | `RD$1,000.00` desde centavos |
| `AlertBanner` | Alert | danger / warning / info |
| `EmptyState` | — | Ícono, texto, acción |
| `VitalsGrid` | — | Fuera de rango resaltado |
| `ClinicalHistoryList` | — | Lista expandible con filtros |
| `PrintablePage` | — | Carta, `@media print` |
| `ConfirmDialog` | Dialog | Acciones destructivas |
| `FormDialog` | Dialog | Encabezado, cuerpo con scroll, pie fijo; nunca se corta en pantallas pequeñas |

Botones con las variantes del README (primario, secundario, destructivo).

### 4.6 Esqueleto de módulos
**Una ruta, un controlador y una página Inertia vacía por módulo** de la navegación (incluye `analisis` e `imgcat`). Cada página lleva su `PageHeader` y un `EmptyState` "En construcción" que indica la pantalla de referencia del prototipo. Cada ruta con su middleware y un Feature test de acceso. **Sin modelos ni migraciones de negocio.**

### 4.7 Calidad y CI
- GitHub Actions en el repo: Pint (`--test`), Larastan, Pest (con MySQL o SQLite), ESLint, `tsc --noEmit`, Vitest y `npm run build`. Debe correr en cada push y PR a `main`.
- `composer test` corre Pest; `npm run test` corre Vitest.
- `README.md` del repo: requisitos, instalación local, variables de entorno, comandos, cómo correr tests, enlace a `docs/`.
- Commits pequeños con Conventional Commits (`chore:`, `feat:`, `test:`, `docs:`, `refactor:`). Al final, push a una rama `phase-0` y dime para abrir el PR.

## 5. Criterio de terminado de la Fase 0
- `CLAUDE.md` y todos los archivos de `docs/` y `.claude/commands/feature.md` existen y están completos.
- Login por usuario funciona; el flujo de cambio de contraseña obligatorio funciona; no hay registro ni recuperación por correo.
- Cada rol ve solo sus módulos; las rutas ajenas devuelven 403.
- `/dev/components` muestra todos los componentes con el look del prototipo.
- Toda la suite, Larastan, Pint, ESLint, tipos y build pasan en local y en CI.
- `docs/DEPLOYMENT.md` permite desplegar en Forge sin preguntas.

Al terminar, dame un resumen de lo creado, los comandos para levantarlo y una lista de dudas o pendientes. **No empieces ninguna funcionalidad de negocio.**

---

## 6. Plantilla para cada funcionalidad siguiente

> Úsala (o el comando `/feature`) cada vez que agregues una funcionalidad.

```
Funcionalidad: <nombre, ej. "Registro de pacientes">
Pantalla de referencia: design/CEMEROG v6.dc.html → "<Sección> › <Página>"
Reglas de negocio: ver docs/DOMAIN.md → <módulo>, más:
- <regla adicional>
Fuera de alcance: <lo que NO se hace ahora>

Pasos:
1. Lee CLAUDE.md, docs/TESTING.md, docs/DOMAIN.md y la pantalla de referencia.
2. Propón el modelo de datos y la lista de casos de prueba (Unit + Feature + Vitest). Espera mi OK.
3. TDD: migración/modelo/factory → Action (Unit) → Request/Policy/Controller (Feature) → página y componentes (Vitest).
4. Reusa components/cemerog; si falta uno, créalo ahí con su test y agrégalo a /dev/components.
5. Datos de demo en DemoSeeder.
6. Corre toda la suite y las herramientas de calidad.
7. Actualiza docs/MODULES.md (estado), docs/DOMAIN.md (reglas implementadas) y docs/DECISIONS.md si decidiste algo.
8. Resume cambios, tests agregados y pendientes.
```

**Orden sugerido:** Usuarios y roles → Catálogos (análisis, imágenes, precios, especialidades y doctores, habitaciones) → Registro de pacientes → Tablero de atenciones y Citas → Consulta → Emergencia → Laboratorio → Imágenes → Internamiento y Cirugía → Inventario → Facturación, turno de caja, CxC y Cuadre → Documentos imprimibles → Inicio por rol.
