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

---

## ADR-009: Los pacientes son expedientes permanentes

**Fecha**: 2026-10  
**Estado**: Aceptado

### Decisión

No existe borrado ni desactivación de pacientes. Una vez creado, un expediente es permanente.

- Se eliminó `SoftDeletes` del modelo `Patient`.
- Se eliminaron las columnas `deleted_at` e `is_active` de la tabla `patients`.
- Se eliminó la ruta `DELETE /registro/pacientes/{patient}`.

### Justificación

- Los expedientes clínicos son documentos legales; borrarlos viola regulaciones de salud.
- La desactivación genera inconsistencias: un turno o consulta sin paciente referenciado.
- Si un paciente "deja de venir", simplemente no tiene atenciones nuevas; sigue visible en el historial.
- Simplifica la lógica de búsqueda y el ORM (sin `withTrashed`, sin scopes de `is_active`).

### Consecuencias

- El administrador puede editar datos personales (nombre, documento, teléfono) si hay un error.
- No hay forma de "archivar" o "desactivar" un paciente desde la interfaz.
- Las búsquedas devuelven todos los pacientes registrados históricamente.

---

## ADR-010: Hash de dígitos para document_number y phone

**Fecha**: 2026-10  
**Estado**: Aceptado

### Decisión

`document_number` y `phone` se almacenan cifrados con `encrypted` cast. Para búsquedas exactas e índices únicos se guardan columnas `document_number_hash` y `phone_hash` (HMAC-SHA256 de `config('app.key')`), calculadas sobre solo los dígitos del valor.

### Justificación

- Los campos cifrados no son consultables con `LIKE` en la base de datos.
- Al normalizar a solo dígitos antes de hashear, `031-0234567-8`, `03102345678` y `(031) 023-4567-8` producen el mismo hash → el sistema los reconoce como el mismo documento.
- HMAC-SHA256 (no SHA simple) evita ataques de preimagen con rainbow tables, usando la clave de la app como secreto.

### Consecuencias

- Al guardar un paciente, el mutador calcula automáticamente el hash.
- La regla `UniqueDocumentNumber` también normaliza a dígitos antes de hashear para consistencia.
- El backfill se ejecuta en la migración `add_phone_hash_to_patients` para registros existentes.

---

## ADR-011: Registro no aparece en el sidebar

**Contexto:** El módulo Registro (/registro) requiere siempre un flujo consciente (crear atención nueva o para paciente existente). Mostrarlo en el sidebar invitaba a ir directo sin pasar por la lista de pacientes, aumentando el riesgo de duplicados.

**Decisión:** Quitar "Registro de pacientes" del sidebar. La ruta /registro sigue existiendo y protegida por `module.registro.access`. Se accede únicamente desde botones explícitos: "Nuevo paciente" en /pacientes, "Nueva atención" en el panel lateral, y accesos del Tablero, Inicio y Citas.

**Consecuencias:** El sidebar de Recepción muestra: Tablero de atenciones, Pacientes y Citas. El ítem Pacientes usa `activeFor: ['/registro']` para mantenerse resaltado cuando el usuario navega a /registro.

---

## ADR-012: Restaurar soft deletes en pacientes

**Fecha**: 2026-10-24
**Estado**: Aceptado

### Contexto

La tabla `patients` originalmente tenía `deleted_at` (soft deletes). Una migración anterior eliminó la columna. Con el sistema en producción, necesitamos eliminar registros de pacientes sin perder la integridad referencial (turns, appointments, etc.).

### Decisión

Restaurar el trait `SoftDeletes` en `App\Models\Patient` mediante la migración `2026_10_24_300000_restore_soft_deletes_to_patients.php`.

Todos los endpoints que muestran listas de registros relacionados (`/tablero`, `/citas`) filtran con `->whereHas('patient')` para excluir filas huérfanas. El endpoint `/registro?paciente=` ignora silenciosamente pacientes eliminados (retorna `patient: null`) en lugar de 404, para evitar romper flujos de navegación con IDs en caché.

### Consecuencias

- `Patient::query()` y `Patient::find()` excluyen automáticamente registros con `deleted_at != null`.
- Los endpoints `/pacientes`, `/pacientes/buscar` y `/registro?paciente=` no requieren cambios adicionales gracias al scope automático de Eloquent.
- `TableroController` y `CitasController` añaden `->whereHas('patient')` para evitar null pointer en el mapeo `$t->patient->full_name`.
- Se cubre con 6 tests en `tests/Feature/Pacientes/SoftDeletesTest.php`.
