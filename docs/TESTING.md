# Guía de Testing – CEMEROG

## Filosofía

- **TDD obligatorio**: tests primero, siempre.
- Un PR sin tests será rechazado en CI.
- Coverage target: 80 % de líneas en `app/`.

## Backend (Pest)

### Configuración

Tests usan SQLite `:memory:`. El archivo `phpunit.xml` ya tiene:

```xml
<env name="DB_CONNECTION" value="sqlite"/>
<env name="DB_DATABASE" value=":memory:"/>
```

### Base común (`tests/TestCase.php`)

Todos los tests heredan de `Tests\TestCase`, que ya:

- **Siembra roles y permisos** (`RolesAndPermissionsSeeder`) tras cada refresco de la base, así que `assignRole()` y `givePermissionTo()` funcionan sin preparar nada.
- **Desactiva Vite** (`withoutVite()`), así que las páginas Inertia se renderizan sin `npm run build` ni `npm run dev`.
- **Se niega a tocar una base que no sea SQLite en memoria.** Si un test con `RefreshDatabase` apunta a otra base, falla antes de ejecutar `migrate:fresh`.

`phpunit.xml` fuerza (`force="true"`) el entorno `testing` y SQLite en memoria, tanto en `<env>` como en `<server>`. Los tests usan siempre esa base, con `vendor/bin/pest`, `php artisan test` o `php artisan test --env=testing` (el de la CI). Sin ese forzado, `php artisan test` hereda el `.env` local y `RefreshDatabase` borraría la base MySQL de desarrollo.

### Tipos de test

| Tipo    | Carpeta          | Cuándo                              |
| ------- | ---------------- | ----------------------------------- |
| Unit    | `tests/Unit/`    | Clases de dominio, Actions, helpers |
| Feature | `tests/Feature/` | HTTP, auth, flujos completos        |

### Ejemplos Pest

```php
// tests/Feature/Auth/LoginTest.php
it('logs in with valid username and password', function () {
    $user = User::factory()->create([
        'username' => 'testuser',
        'password' => bcrypt('secret123'),
        'is_active' => true,
    ]);

    $response = $this->post('/login', [
        'username' => 'testuser',
        'password' => 'secret123',
    ]);

    $response->assertRedirect(route('inicio'));
    $this->assertAuthenticatedAs($user);
});

it('rejects inactive user', function () {
    $user = User::factory()->inactive()->create(['username' => 'inactive']);

    $this->post('/login', ['username' => 'inactive', 'password' => 'password'])
         ->assertSessionHasErrors('username');
});

it('redirects to change-password when must_change_password is true', function () {
    $user = User::factory()->mustChangePassword()->create(['username' => 'newuser']);

    $this->post('/login', ['username' => 'newuser', 'password' => 'password'])
         ->assertRedirect(route('password.change-required'));
});
```

```php
// tests/Feature/Modules/InicioTest.php
it('denies access without permission', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
         ->get(route('inicio'))
         ->assertForbidden();
});

it('allows access with permission', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('module.inicio.access');

    $this->actingAs($user)
         ->get(route('inicio'))
         ->assertOk()
         ->assertInertia(fn ($page) => $page->component('inicio/index'));
});
```

```php
// tests/Unit/Lib/MoneyTest.php
it('formats centavos to DOP currency', function () {
    expect(formatMoney(150050))->toBe('RD$1,500.50');
    expect(formatMoney(0))->toBe('RD$0.00');
    expect(formatMoney(-500))->toBe('-RD$5.00');
});
```

### Helpers de test

```php
// En tests que necesitan roles
use function Pest\Laravel\actingAs;

$admin = User::factory()->create()->assignRole('administrador');
actingAs($admin)->get(route('admin'))->assertOk();
```

### Factories

```php
// Crear usuario con rol
$medico = User::factory()->create()->assignRole('medico');

// Crear usuario inactivo
$inactivo = User::factory()->inactive()->create();

// Usuario que debe cambiar contraseña
$nuevo = User::factory()->mustChangePassword()->create();
```

## Frontend (Vitest + React Testing Library)

### Configuración

El `vite.config.ts` ya incluye configuración de Vitest. Los tests viven en:

- `resources/js/**/__tests__/` o junto al componente como `Component.test.tsx`

### Ejemplos Vitest + RTL

```tsx
// resources/js/components/cemerog/__tests__/StatusBadge.test.tsx
import { render, screen } from '@testing-library/react';
import StatusBadge from '../StatusBadge';

describe('StatusBadge', () => {
    it('renders espera state with correct label', () => {
        render(<StatusBadge state="espera" />);
        expect(screen.getByText('En espera')).toBeInTheDocument();
    });

    it('renders custom label', () => {
        render(<StatusBadge state="consulta" label="Pendiente de consulta" />);
        expect(screen.getByText('Pendiente de consulta')).toBeInTheDocument();
    });
});
```

```tsx
// resources/js/lib/__tests__/money.test.ts
import { describe, it, expect } from 'vitest';
import { formatMoney, parseMoney, sumMoney } from '../money';

describe('formatMoney', () => {
    it('formats 150050 centavos as RD$1,500.50', () => {
        expect(formatMoney(150050)).toContain('1,500.50');
    });
});

describe('parseMoney', () => {
    it('parses RD$1,500.50 to 150050', () => {
        expect(parseMoney('RD$1,500.50')).toBe(150050);
    });
});
```

### Setup global de RTL

```ts
// resources/js/test-setup.ts
import '@testing-library/jest-dom';
```

Referencia en `vite.config.ts`:

```ts
test: {
    setupFiles: ['./resources/js/test-setup.ts'],
    environment: 'jsdom',
}
```

## CI

Los tests corren automáticamente en cada push/PR. Ver `.github/workflows/ci.yml`.

## Smoke tests / E2E

Playwright solo para smoke tests críticos (login, crear paciente, factura). Pendiente de configurar en Fase 1+.
