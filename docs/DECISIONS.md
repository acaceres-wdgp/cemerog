# Decisiones de arquitectura (ADRs)

## ADR-001: Stack tecnológico

**Fecha**: 2026-10  
**Estado**: Aceptado

### Decisión

Laravel 12 + Inertia 2 + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui.

### Justificación

- Laravel es el estándar en el ecosistema PHP dominicano; facilita contratación.
- Inertia elimina la complejidad de una API REST separada para una app de una sola empresa.
- React + TypeScript: mejor ergonomía para formularios complejos clínicos.
- shadcn/ui: componentes de alta calidad sin vendor lock-in, personalizables.
- Tailwind CSS 4: mejor rendimiento y DX que versiones anteriores.

---

## ADR-002: Autenticación por username (no email)

**Fecha**: 2026-10  
**Estado**: Aceptado

### Decisión

Los usuarios se autentican con `username` y `password`. El email es opcional.

### Justificación

- Entorno clínico interno: los empleados no necesariamente tienen email corporativo.
- El username es más simple de recordar en contexto de rotación de personal.
- No hay recuperación de contraseña por email – el administrador lo resetea manualmente.
- Sin registro público: todos los usuarios los crea el administrador.

---

## ADR-003: Sin correo transaccional

**Fecha**: 2026-10  
**Estado**: Aceptado

### Decisión

No se implementa envío de correos (recuperación de contraseña, notificaciones, etc.).

### Justificación

- Clínica pequeña, gestión interna de credenciales.
- Reduce complejidad de infraestructura (sin SMTP, sin configuración de dominio).
- Si en el futuro se requiere, se puede agregar sin romper nada.

---

## ADR-004: Dinero en centavos (entero)

**Fecha**: 2026-10  
**Estado**: Aceptado

### Decisión

Todos los valores monetarios se almacenan como `INTEGER` en la base de datos, representando centavos.

### Justificación

- Evita errores de precisión de punto flotante en cálculos financieros.
- `150050` = RD$1,500.50 – fácil de razonar.
- Función `formatMoney(centavos)` centraliza el formato visual.
- Convención estándar en sistemas de facturación.

---

## ADR-005: Una sola clínica (sin multi-tenancy)

**Fecha**: 2026-10  
**Estado**: Aceptado

### Decisión

El sistema está diseñado para una sola clínica. No habrá multi-tenancy.

### Justificación

- El cliente es una clínica específica.
- Multi-tenancy agrega complejidad significativa sin beneficio actual.
- Si en el futuro se requiere multi-tenancy, se puede migrar con `stancl/tenancy`.

---

## ADR-006: Despliegue en Laravel Forge + DigitalOcean

**Fecha**: 2026-10  
**Estado**: Propuesto

### Decisión

Servidor administrado con Laravel Forge sobre un Droplet de DigitalOcean.

### Justificación

- Forge abstrae la configuración de servidor, Nginx, SSL, workers.
- DigitalOcean está disponible en la región de Nueva York (latencia aceptable desde RD).
- Alternativa evaluada: Railway – descartada por costo a escala.

---

## ADR-007: Spatie Permission para roles y permisos

**Fecha**: 2026-10  
**Estado**: Aceptado

### Decisión

Usar `spatie/laravel-permission` para gestión de roles y permisos.

### Justificación

- Solución madura y bien documentada.
- 8 roles predefinidos cubren todos los casos de uso.
- Permisos granulares `module.<key>.access` permiten control fino.
- Idempotente mediante `firstOrCreate` en seeders.

---

## ADR-008: Sin Laravel Fortify

**Fecha**: 2026-10  
**Estado**: Aceptado

### Decisión

Desinstalar `laravel/fortify`, que venía con el starter kit, junto con sus dependencias de passkeys y 2FA. La autenticación es código propio: `LoginController`, `LoginRequest` y `ChangePasswordController`.

### Justificación

- Solo el administrador gestiona accesos y contraseñas. No hay registro público, recuperación de contraseña, verificación de email, 2FA ni passkeys.
- Fortify ya tenía sus rutas desactivadas (`ignoreRoutes()`), pero su configuración mantenía activados el registro y la recuperación. Bastaba quitar esa línea para abrirlos.
- Sin la dependencia, esas funciones no pueden reactivarse por accidente. `NoPublicAuthRoutesTest` verifica que Fortify no está instalado y que sus rutas dan 404.

### Limpieza

- La migración `drop_passkeys_and_two_factor_columns` elimina la tabla `passkeys` y las 3 columnas de 2FA de `users`. Su `down()` las restaura, y `DropPasskeysAndTwoFactorTest` verifica ambos sentidos.
- `@laravel/passkeys` también se desinstaló de npm.
