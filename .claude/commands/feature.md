# /feature – Implementar una característica con TDD

## Uso

```
/feature <descripción de la característica>
```

Ejemplo:

```
/feature Crear formulario de registro de pacientes con validación de cédula
```

---

## Flujo TDD obligatorio

Cuando ejecutes este comando, sigue estos pasos en orden:

### 1. Entender la característica

- Leer `docs/DOMAIN.md` para reglas de negocio relevantes.
- Leer `docs/MODULES.md` para identificar el módulo afectado.
- Revisar el prototipo en `design/CEMEROG v6.dc.html` si tiene interfaz.

### 2. Escribir los tests PRIMERO (Failing)

**Backend (Pest)**:

```bash
# Crear archivo de test
php artisan make:test Feature/<Modulo>/<NombreTest>
```

Incluir:

- Test de acceso sin autenticación → 401/redirect
- Test de acceso sin permiso → 403
- Test del caso feliz
- Test de casos de error/validación
- Test de casos de borde

**Frontend (Vitest)**:

```bash
# Crear test junto al componente
touch resources/js/components/cemerog/__tests__/<Componente>.test.tsx
```

Incluir:

- Render básico sin crash
- Interacciones de usuario
- Estados (loading, error, empty)

### 3. Verificar que los tests fallan

```bash
# Backend
vendor/bin/pest tests/Feature/<Modulo>/<NombreTest>.php

# Frontend
npx vitest run resources/js/...
```

Los tests deben **fallar** antes de implementar.

### 4. Implementar el mínimo necesario

**Backend**:

- Migration (si corresponde)
- Model + Factory actualizada
- Form Request con validación
- Action class con lógica
- Policy si corresponde
- Controller delgado
- Ruta en `routes/web.php`

**Frontend**:

- Componente(s) en `components/cemerog/` si son reutilizables
- Página en `pages/<modulo>/`
- Usar `AppLayout` como wrapper
- Usar `PageHeader` + contenido

### 5. Verificar que los tests pasan

```bash
vendor/bin/pest tests/Feature/<Modulo>/<NombreTest>.php
npx vitest run
```

### 6. Refactorizar (con tests verdes)

- Eliminar código duplicado
- Asegurar que los nombres son claros
- Verificar convenciones de `CLAUDE.md`

### 7. Correr suite completa

```bash
vendor/bin/pest
npx vitest run
vendor/bin/pint --test
vendor/bin/phpstan analyse --level=6
```

### 8. Crear commit

```bash
git add <archivos específicos>
git commit -m "feat(<modulo>): <descripción concisa en inglés>"
```

---

## Checklist antes de PR

- [ ] Tests pasan (`vendor/bin/pest`)
- [ ] TypeScript sin errores (`npx tsc --noEmit`)
- [ ] ESLint sin warnings (`npm run lint`)
- [ ] Pint sin errores (`vendor/bin/pint --test`)
- [ ] Larastan nivel 6 (`vendor/bin/phpstan analyse --level=6`)
- [ ] Build pasa (`npm run build`)
- [ ] UI revisada en `design/CEMEROG v6.dc.html`
- [ ] Permisos verificados en controlador
- [ ] Dinero en centavos (no floats)
- [ ] Fechas con `date-fns` locale `es`

---

## Notas importantes

- **Nunca** implementar sin tests.
- **Nunca** modificar `design/` (es solo referencia).
- **Nunca** usar `any` en TypeScript.
- Dinero = centavos enteros siempre.
- Crear PR hacia `main` cuando los tests y checks locales estén en verde.
