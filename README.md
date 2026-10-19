# CEMEROG

Sistema de gestión clínica para el Centro Médico Dres. Rodríguez & Guzmán (República Dominicana).

**Stack:** Laravel 12 · Inertia 2 · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui

---

## Requisitos

| Herramienta | Versión mínima |
|---|---|
| PHP | 8.3+ |
| MySQL | 8.0+ |
| Node.js | 20+ |
| Composer | 2.x |

---

## Instalación con Laravel Herd (recomendado para macOS)

[Laravel Herd](https://herd.laravel.com) provee PHP, MySQL y un servidor web de forma nativa, sin Docker.

1. Descarga e instala Herd desde `herd.laravel.com`. Incluye PHP 8.3+ y MySQL 8.

2. En Herd, agrega el directorio padre de este proyecto como sitio:
   - Abre Herd → General → Herd Path → agrega `~/Desktop` (o donde tengas el repo).
   - El proyecto quedará disponible en `http://cemerog.test`.

3. Crea la base de datos:
   - Herd incluye MySQL. Conéctate con Herd DB (TablePlus, Sequel Ace, o CLI):
     ```bash
     /Applications/Herd.app/Contents/Resources/bin/mysql -u root -e \
       "CREATE DATABASE cemerog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
     ```

4. Configura el entorno:
   ```bash
   cp .env.example .env
   ```
   Edita `.env`:
   ```env
   APP_URL=http://cemerog.test
   DB_HOST=127.0.0.1
   DB_DATABASE=cemerog
   DB_USERNAME=root
   DB_PASSWORD=        # Herd MySQL no tiene contraseña por defecto
   ```

5. Genera la clave de aplicación e instala dependencias:
   ```bash
   php artisan key:generate
   composer install
   npm install
   ```

6. Corre migraciones y seeders:
   ```bash
   php artisan migrate --seed
   ```

7. Inicia el servidor de desarrollo de assets:
   ```bash
   npm run dev
   ```
   El servidor PHP lo maneja Herd automáticamente. Abre `http://cemerog.test`.

---

## Instalación con PHP/MySQL nativos

1. Asegúrate de tener PHP 8.3+, MySQL 8, Node 20+ y Composer instalados.

2. Crea la base de datos:
   ```bash
   mysql -u root -p -e \
     "CREATE DATABASE cemerog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

3. Configura el entorno:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
   Edita `.env` con tus credenciales de MySQL.

4. Instala dependencias y corre migraciones:
   ```bash
   composer install
   npm install
   php artisan migrate --seed
   ```

5. Levanta todos los servicios con un solo comando:
   ```bash
   composer run dev
   ```
   Esto inicia el servidor PHP, Vite, el worker de colas y los logs simultáneamente.

---

## Comandos principales

| Comando | Descripción |
|---|---|
| `composer run dev` | Levanta servidor + Vite + queue + logs |
| `composer test` | Corre Pest (PHP tests) |
| `npm run test` | Corre Vitest (frontend tests) |
| `npm run lint` | ESLint |
| `npm run types` | TypeScript check (`tsc --noEmit`) |
| `./vendor/bin/phpstan analyse` | Análisis estático (nivel 6) |
| `./vendor/bin/pint` | Formatea el código PHP |
| `./vendor/bin/pint --test` | Verifica formato sin modificar |
| `npm run build` | Build de producción |

---

## Variables de entorno clave

| Variable | Descripción |
|---|---|
| `APP_TIMEZONE` | `America/Santo_Domingo` |
| `APP_LOCALE` | `es` |
| `ADMIN_USERNAME` | Usuario del administrador inicial |
| `ADMIN_PASSWORD` | Contraseña del administrador inicial |
| `DB_*` | Conexión MySQL |

Ver `.env.example` para la lista completa con comentarios.

---

## Tests

```bash
# PHP (Pest)
composer test

# Frontend (Vitest)
npm run test

# Con cobertura
composer test -- --coverage
npm run test -- --coverage
```

Los tests PHP usan SQLite en memoria (`:memory:`). No se requiere MySQL para correr tests.

---

## Documentación

| Documento | Descripción |
|---|---|
| `CLAUDE.md` | Guía para agentes de IA: stack, reglas, flujo TDD |
| `docs/ARCHITECTURE.md` | Arquitectura del sistema |
| `docs/DOMAIN.md` | Glosario y reglas de negocio |
| `docs/MODULES.md` | Estado de implementación por módulo |
| `docs/TESTING.md` | Guía de testing con ejemplos |
| `docs/DECISIONS.md` | Registro de decisiones (ADR) |
| `docs/DEPLOYMENT.md` | Guía de despliegue en Forge |

---

## Despliegue en producción

Ver `docs/DEPLOYMENT.md` para el script completo de deploy en Laravel Forge.

---

## Primer login

- URL: `/login`
- Usuario: valor de `ADMIN_USERNAME` en `.env` (por defecto: `admin`)
- Contraseña: valor de `ADMIN_PASSWORD` (por defecto: `Admin123!`)
- El sistema forzará un cambio de contraseña en el primer acceso.
