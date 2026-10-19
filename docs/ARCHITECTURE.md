# Arquitectura – CEMEROG

## Backend (Laravel 12)

### Patrones

| Capa | Propósito | Ejemplo |
|---|---|---|
| `Actions/` | Lógica de negocio de un solo propósito | `CreatePatientAction`, `GenerateInvoiceAction` |
| `Http/Requests/` | Validación y autorización de formularios | `StorePatientRequest` |
| `Policies/` | Autorización por modelo | `PatientPolicy`, `InvoicePolicy` |
| `Enums/` | Valores de dominio tipados | `PatientStatus`, `TriageLevel` |
| `DTOs/` | Objetos de transferencia de datos | `PatientData`, `VitalSignsData` |
| `Controllers/` | Orquestación HTTP (thin) | delegan a Actions |

### Reglas de backend

- Controllers solo hacen: validar → delegar a Action → responder.
- Actions no conocen HTTP ni Inertia.
- Toda consulta costosa va en un QueryObject o scope de Eloquent.
- Dinero: siempre en centavos (int). Nunca float.
- Auditoría: `spatie/laravel-activitylog` en modelos críticos.

### Auditoría

Agregar `LogsActivity` a modelos clave:

```php
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Invoice extends Model
{
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
```

### Estructura de carpetas (backend)

```
app/
├── Actions/
│   ├── Auth/
│   │   └── ChangePasswordAction.php
│   └── Patients/
│       └── CreatePatientAction.php
├── Console/
├── DTOs/
├── Enums/
├── Http/
│   ├── Controllers/
│   │   ├── Auth/
│   │   │   ├── LoginController.php
│   │   │   └── ChangePasswordController.php
│   │   └── Modules/
│   │       ├── InicioController.php
│   │       └── ... (un archivo por módulo)
│   ├── Middleware/
│   │   ├── EnsurePasswordChanged.php
│   │   └── HandleInertiaRequests.php
│   └── Requests/
│       └── Auth/
│           └── LoginRequest.php
├── Models/
│   └── User.php
└── Policies/
```

## Frontend (React 19 + TypeScript)

### Estructura de carpetas

```
resources/js/
├── app.tsx               # Punto de entrada Inertia
├── components/
│   ├── cemerog/          # Componentes CEMEROG (no usar shadcn aquí)
│   │   ├── StatusBadge.tsx
│   │   ├── TriageBadge.tsx
│   │   ├── StatCard.tsx
│   │   ├── PageHeader.tsx
│   │   ├── Panel.tsx
│   │   ├── DataTable.tsx
│   │   ├── FormField.tsx
│   │   └── ...
│   └── ui/               # shadcn/ui (no modificar)
├── hooks/                # Custom React hooks
├── layouts/
│   └── app/
│       └── app-layout.tsx  # Layout principal con sidebar + topbar
├── lib/
│   ├── money.ts          # Formato de dinero
│   ├── navigation.ts     # Definición de navegación
│   └── utils.ts          # cn() y utilidades
├── pages/
│   ├── auth/
│   │   ├── login.tsx
│   │   └── change-password.tsx
│   ├── dev/
│   │   └── components.tsx  # Galería (solo local)
│   └── <modulo>/
│       └── index.tsx
└── types/
    ├── auth.ts
    ├── global.d.ts
    └── index.ts
```

### Reglas de frontend

- Componentes en `cemerog/` son la fuente de verdad de diseño.
- No mezclar estilos inline con clases de Tailwind (usar uno u otro).
- Dinero: recibir en centavos del backend, mostrar con `<MoneyText centavos={...} />`.
- Fechas: usar `date-fns` con locale `es` siempre que se muestre al usuario.
- Permisos: validar en backend (obligatorio) y en frontend (opcional, para UX).
- Tipos: todos los props de componentes con TypeScript explícito, sin `any`.

### Props globales Inertia

```ts
// types/global.d.ts
interface PageProps {
    auth: { user: User | null };
    permissions: string[];
    name: string;
}
```
