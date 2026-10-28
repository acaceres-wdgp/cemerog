# Prompt para Claude Code — Pendientes tras el saneamiento (24/10/2026)

> Pégalo en Claude Code en la raíz del repo, con `main` actualizado (`git pull`).

---

Vas a cerrar los pendientes que quedaron después del saneamiento de CEMEROG. **No agregues funcionalidades ni toques nada fuera de esta lista.** Lee primero `CLAUDE.md` y síguelo.

## Reglas

1. Trabaja en una sola rama, `fix/pendientes-saneamiento`, creada desde `main` actualizado. **No hagas commit directo a `main` ni mezcles la rama.** Al terminar, súbela y abre un PR en GitHub.
2. Haz un commit por punto, con mensaje en español con formato `tipo(alcance): descripción`.
3. **Prohibido:**
   - Tocar `design/`.
   - Instalar dependencias.
   - Usar `as any`, `as unknown as`, `@ts-ignore`, `eslint-disable` o `@phpstan-ignore`.
   - Borrar o saltar tests, salvo los del archivo que se elimina en el punto 3.
4. Antes de abrir el PR, corre todo esto. **Todo debe salir en verde (código de salida 0)** y debes pegar la salida resumida en la descripción del PR:
   ```bash
   vendor/bin/pint --test
   vendor/bin/phpstan analyse --level=6
   vendor/bin/pest
   npm run types:check
   npm run lint
   npm run test
   npm run build
   ```
   Ojo: `npm run lint` trata los avisos (warnings) como errores. "0 errors" con warnings sigue siendo rojo.

## 1. Lint en verde

`npm run lint` falla por imports sin usar:
- `resources/js/pages/pacientes/index.tsx`: `pacientes` (de `@/routes`), `format` (de `date-fns`), `es` (de `date-fns/locale`) y `Contact` (de `lucide-react`).
- `resources/js/__tests__/registro-autocomplete.test.tsx`: `act`.

Elimínalos y confirma que `npm run lint` termina con código 0.

## 2. Documentación: versión de PHP y reglas nuevas

1. En `CLAUDE.md` y en `README.md`, cambia **PHP 8.3+** por **PHP 8.4+** en todos los lugares, incluidos los requisitos y las instrucciones de Herd. `composer.lock` usa Symfony 8.1, que exige PHP ≥ 8.4.1, y con 8.3 `composer install` falla. Revisa también `docs/DEPLOYMENT.md`.
2. En `CLAUDE.md`, agrega a "Lo que NO hacer":
   - No escribir colores hex ni `style={{…}}` en `resources/js/pages/`. Usar los tokens de `resources/css/app.css` (`bg-primary`, `text-text-secondary`, `border-divider`…) y los componentes de `components/cemerog/`. Solo se permite `style` para valores calculados en tiempo de ejecución (por ejemplo, el tamaño de un avatar). Las páginas migradas están protegidas por `resources/js/__tests__/no-hardcoded-hex.test.ts`.
   - No hacer commits de más de ~400 líneas de código de producción; dividir en PRs.
   - No mezclar ramas a `main` en local; siempre por PR en GitHub.

## 3. Eliminar código muerto: `registro/create.tsx`

`resources/js/pages/registro/create.tsx` (unas 900 líneas) ya no se renderiza desde ningún controlador; el alta se hace en `registro/index.tsx`.
1. Confírmalo con `grep -rn "registro/create" app routes resources/js`.
2. Si no hay referencias, elimina el archivo y cualquier test, import o tipo que solo existiera para él.
3. Revisa si `registro/edit.tsx` duplica lógica que ya está en `registro/index.tsx`. **No lo refactorices**; solo menciónalo en el PR si es así.

## 4. Tipar `open_turn` sin enviar un campo falso

En `resources/js/pages/registro/index.tsx`, para que TypeScript aceptara `errors.open_turn`, se agregó `open_turn: ''` a los datos de `useForm`. Ahora ese campo vacío se envía al servidor en cada registro.

1. Primero escribe un test (Vitest) que compruebe que el payload enviado al registrar **no** incluye `open_turn`. Debe fallar con el código actual.
2. Quita `open_turn` de los datos del formulario.
3. Tipa el error correctamente, sin `as any`. Por ejemplo, define un tipo de errores que extienda los del formulario con `open_turn?: string` y lee `errors` a través de ese tipo. Otra opción es que el backend devuelva el error bajo una clave que ya exista en el formulario. Elige la opción más simple y explica tu elección en el PR.
4. Verifica que el aviso de "turno abierto" se sigue mostrando: el test Pest de `RegisterArrivalTest` que cubre `PatientHasOpenTurnException` debe seguir pasando. Si no existe un test de frontend que muestre el aviso, agrégalo.

## 5. Restaurar el test de reversión de `remove_soft_deletes_from_patients`

`CLAUDE.md` exige un test de reversión para cada migración. El de `2026_10_24_100000_remove_soft_deletes_from_patients.php` se borró al agregar `2026_10_24_300000_restore_soft_deletes_to_patients.php`.

1. En `tests/Feature/Database/PatientMigrationsTest.php`, agrega un test que ejecute `down()` y luego `up()` de `remove_soft_deletes_from_patients` en el orden correcto respecto a `restore_soft_deletes_to_patients`. La forma más fiable es incluir y ejecutar los archivos de migración directamente, como en los demás tests de `tests/Feature/Database/`.
2. Verifica las columnas `deleted_at` e `is_active` después de cada paso.
3. Al terminar el test, el esquema debe quedar como estaba, para no afectar otros tests.

## Entregable

- Un PR hacia `main` con un commit por punto.
- En la descripción del PR:
  - qué se cambió en cada punto;
  - la salida de los 7 comandos de verificación;
  - la nota sobre `registro/edit.tsx` si aplica.
- **No mezcles el PR**: lo reviso yo.
- Recuérdame al final que en mi máquina local debo correr `php artisan migrate:fresh --seed`, porque la migración `2026_10_24_200000_normalize_patient_pii_encryption` se eliminó después de haberse ejecutado.
