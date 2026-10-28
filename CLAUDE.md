# CEMEROG – Guía para Claude Code

Sistema de gestión clínica para Dres. Rodríguez & Guzmán (República Dominicana).

## Stack

- **Backend**: Laravel 13, PHP 8.4+, MySQL 8 (SQLite en tests)
- **Frontend**: Inertia 3, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Auth**: username + password (sin email, sin registro público)
- **Roles**: spatie/laravel-permission – 8 roles
- **Tests**: Pest (backend) + Vitest + RTL (frontend)

## Comandos clave

```bash
php artisan serve               # Servidor de desarrollo
npm run dev                     # Vite (hot reload)

php artisan migrate             # Aplicar migraciones
php artisan db:seed             # Seeders (roles + admin)
php artisan migrate:fresh --seed  # Reset completo

vendor/bin/pest                 # Tests PHP
npm run test                    # Vitest

vendor/bin/pint                 # Fix code style
vendor/bin/phpstan analyse --level=6  # Análisis estático
```

## Regla de oro: TDD obligatorio

**Ninguna funcionalidad sin tests.** El flujo estándar es:

1. Escribe el test (fallando)
2. Implementa el código mínimo para pasar
3. Refactoriza manteniendo verde
4. Abre un PR – tests y checks locales en verde (`vendor/bin/pest`, `npm run test`, `npm run types:check`, `npm run lint`)

## Arquitectura (resumen)

```
app/
  Actions/          # Clases de un solo propósito (CreatePatient, etc.)
  Http/
    Controllers/
      Auth/         # Login, ChangePassword
      Modules/      # Un controller por módulo
    Middleware/
    Requests/       # Form Requests
  Models/
  Policies/
resources/js/
  components/
    cemerog/        # Librería de componentes CEMEROG
    ui/             # shadcn/ui (no modificar)
  layouts/app/      # AppLayout con sidebar + topbar
  lib/              # money.ts, navigation.ts, utils
  pages/
    auth/           # Login, ChangePassword
    <modulo>/       # index.tsx por módulo
  types/
```

## Convenciones

| Concepto              | Regla                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dinero                | Siempre en **centavos** (int). Usar `formatMoney()` para mostrar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Fechas display        | `dd/MM/yyyy` con `date-fns` locale `es`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Fechas DB             | UTC ISO 8601                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Idioma UI             | Español (es-DO)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Idioma código         | Inglés (variables, métodos, tests)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| IDs                   | Auto-increment en DB; nunca exponer en URLs de lectura pública                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Rutas                 | Kebab-case, en español (`/registro-paciente`, `/cuadre-de-caja`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Permisos              | `module.<key>.access` – verificar SIEMPRE en controlador Y frontend                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| PII (datos sensibles) | Cédula (`document_number`) y teléfono (`phone`) se cifran con **`App\Support\Pii::encrypt`** (usa `Crypt::encryptString`, sin serializar). El correo (`email`) usa el cast `'encrypted'` de Eloquent (también `encryptString`). **Nunca** combinar un cast `encrypted` con un `Attribute` sobre la misma columna — produce doble cifrado o fallo al descifrar. Para `document_number` usar **`Pii::documentHash($type, $number)`** (normalización por tipo: solo dígitos para cédula, mayúsculas [A-Z0-9] para pasaporte/cedula\_extranjera/no\_tiene). Para `phone` usar `Pii::hash()` (solo dígitos). Nunca usar `LIKE` sobre columnas cifradas. Ver ADR-014. |

## Tokens de diseño

- Primary: `#2E8B3E` · Hover: `#277a35`
- Accent: `#8CC63F` · Accent bg: `#EEF6E2`
- App bg: `#F3F7F2` · Card: `#FFFFFF` · Border: `#e3e9e3`
- Error: `#b91c1c` sobre `#fef2f2`
- Sidebar temas: Carbón `#2A2E2C` · Pizarra `#1F2B33` · Verde bosque `#173F26`
- Tipografía: Instrument Sans (UI) · Bitter (títulos)
- Botones: h-9, px-[14px]

## Prototipo HTML

Referencia visual en `design/CEMEROG v6.dc.html`. Ábrelo en un navegador.
No modificar nada dentro de `design/`.

## Lo que NO hacer

- No usar `email` como credencial de login
- No exponer rutas de registro ni recuperación de contraseña
- No guardar dinero como float (siempre centavos enteros)
- No usar `make:auth` de Laravel (ya configurado)
- No crear migraciones sin sus tests de reversión
- No mergear a `main` sin tests y checks locales en verde (`vendor/bin/pest`, `npm run test`, `npm run types:check`, `npm run lint`)
- No instalar dependencias sin documentarlas aquí o en `docs/DECISIONS.md`
- No envolver páginas en `<AppLayout>`: el layout se aplica globalmente en `app.tsx` mediante `createInertiaApp({ layout })`
- No combinar un cast `encrypted` con un `Attribute` sobre la misma columna en Eloquent — produce doble cifrado o fallo al descifrar (ver ADR-010)
- No borrar pacientes con `forceDelete` ni `DB::delete`; usar siempre `$patient->delete()` (soft delete) para preservar integridad referencial con turns y citas (ver ADR-012)
- No escribir colores hex ni `style={{…}}` en `resources/js/pages/`. Usar los tokens de `resources/css/app.css` (`bg-primary`, `text-text-secondary`, `border-divider`…) y los componentes de `components/cemerog/`. Solo se permite `style` para valores calculados en tiempo de ejecución (p. ej. el tamaño de un avatar). Las páginas migradas están protegidas por `resources/js/__tests__/no-hardcoded-hex.test.ts`
- No hacer commits de más de ~400 líneas de código de producción; dividir en PRs
- No mezclar ramas a `main` en local; siempre por PR en GitHub
- No usar `->with('flash', …)` ni `->with('success', …)` para mensajes al usuario; usar siempre `Inertia::flash('toast', …)` (o `Toast::success`/`Toast::error` de `App\Support\Toast`)

## Módulos y permisos

Ver `docs/MODULES.md` para la tabla completa de módulos, roles y estado.

## Tests

Ver `docs/TESTING.md` para la guía completa con ejemplos.
