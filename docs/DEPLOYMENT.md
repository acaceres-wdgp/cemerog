# Guía de despliegue – CEMEROG

## Requisitos del servidor

- PHP 8.4+ con extensiones: `pdo_mysql`, `mbstring`, `xml`, `bcmath`, `intl`, `gd`
- MySQL 8+
- Node.js 22+ (solo para build de assets)
- Nginx 1.24+
- Composer 2.10+
- Supervisor (para workers de colas)
- Certbot / SSL

**Recomendado**: Laravel Forge en DigitalOcean (Ubuntu 24.04, 2 GB RAM mínimo).

---

## Variables de entorno (producción)

```env
APP_NAME=CEMEROG
APP_ENV=production
APP_KEY=                    # php artisan key:generate
APP_DEBUG=false
APP_URL=https://cemerog.tudominio.com
APP_TIMEZONE=America/Santo_Domingo
APP_LOCALE=es

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cemerog
DB_USERNAME=cemerog_user
DB_PASSWORD=<contraseña segura>

SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database

MAIL_MAILER=log             # Cambiar si se requiere correo

ADMIN_USERNAME=admin
ADMIN_PASSWORD=<contraseña muy segura>
```

---

## Script de deploy (Forge Deployment Script)

```bash
#!/bin/bash
set -e

cd /home/forge/cemerog

echo "==> Pulling latest code..."
git pull origin main

echo "==> Installing Composer dependencies..."
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction

echo "==> Running migrations..."
php artisan migrate --force

echo "==> Syncing permissions..."
php artisan cemerog:sync-permissions

echo "==> Clearing caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan icons:cache 2>/dev/null || true

echo "==> Installing npm dependencies & building assets..."
npm ci --prefer-offline
npm run build

echo "==> Restarting queue workers..."
php artisan queue:restart

echo "==> Reloading PHP-FPM..."
sudo -S service php8.4-fpm reload

echo "==> Deploy complete!"
```

---

## Worker de colas (Supervisor)

Forge genera esto automáticamente. Configuración de referencia:

```ini
[program:cemerog-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /home/forge/cemerog/artisan queue:work database --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
user=forge
numprocs=2
redirect_stderr=true
stdout_logfile=/home/forge/.forge/cemerog-worker.log
stopwaitsecs=3600
```

---

## Scheduler

Agregar al crontab del servidor (Forge lo hace automáticamente):

```cron
* * * * * forge php /home/forge/cemerog/artisan schedule:run >> /dev/null 2>&1
```

---

## Comando `cemerog:sync-permissions`

Ejecuta el seeder `RolesAndPermissionsSeeder` de forma segura sobre la base existente.
Usar cada vez que se agreguen permisos o roles nuevos (e.g., nuevo módulo).

- Es idempotente: no duplica permisos ni roles.
- Limpia la caché de Spatie Permission al terminar.
- Requiere `--force` implícito (no pide confirmación en producción).

---

## Checklist primer despliegue

- [ ] Crear servidor en Forge con Ubuntu 24.04
- [ ] Crear base de datos `cemerog` con usuario dedicado
- [ ] Configurar `.env` de producción
- [ ] `php artisan key:generate`
- [ ] `php artisan migrate`
- [ ] `php artisan db:seed` (crea roles, permisos y admin)
- [ ] Verificar que el admin puede iniciar sesión
- [ ] Verificar que el admin es redirigido a cambiar contraseña
- [ ] Configurar SSL con Certbot
- [ ] Activar worker de colas en Supervisor
- [ ] Activar scheduler en crontab
- [ ] Hacer prueba de humo de todos los módulos disponibles

---

## Rollback

En caso de problemas:

```bash
cd /home/forge/cemerog

# Volver al commit anterior
git revert HEAD --no-edit
git push origin main

# O hacer rollback manual
git reset --hard <commit-anterior>
php artisan migrate:rollback --step=1
composer install --no-dev --optimize-autoloader
npm run build
```

---

## Backup

- Base de datos: cron diario con `mysqldump` y upload a S3/DigitalOcean Spaces.
- Configurar en Forge > Database > Backups.
- Retención recomendada: 30 días.
