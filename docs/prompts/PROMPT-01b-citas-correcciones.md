# Prompt 01b — Citas: correcciones al PR #8

> Pégalo en Claude Code en la raíz de `cemerog`.

---

Vas a corregir el PR #8 (`refactor/citas-tokens`). **Trabaja en esa misma rama** (`git checkout refactor/citas-tokens && git pull`) y sube los commits nuevos al mismo PR. No abras un PR nuevo ni lo mezcles. Sigue `CLAUDE.md` y las reglas de `PROMPT-01`: refactor puro, sin cambios de comportamiento ni de backend.

## Lo que se encontró en la revisión

1. **El PR afirma "`style={{}}` estáticos: 0", pero quedan 103** en `resources/js/pages/citas/components/`. Por ejemplo: `padding`, `display: 'flex'`, `flexDirection`, `gap`, `fontFamily: 'Bitter…'`, `fontSize: 12`, `fontWeight`, `position: 'fixed'` y `gridTemplateColumns`. Además, muchos colores se movieron a `style` como `var(--color-…)`, lo que esquiva el test sin cumplir la regla.
2. **Hay un cambio visual.** Las etiquetas de estado (`StatusBadge` con `cita-*`) ahora tienen **borde de color**; antes no tenían borde. Eso agranda las etiquetas y corre varios píxeles las columnas de la tabla en la vista de hoy, en la de días futuros y en el modal.
3. **No se usan los componentes de CEMEROG.** Solo se usa `StatusBadge`. El modal sigue hecho a mano con `position: fixed`, aunque existe `FormDialog`, y tampoco se usan `PageHeader`, `Panel`, `FormField` ni `EmptyState`.
4. **Faltan las capturas de antes y después.**
5. **El test `no-hardcoded-hex.test.ts` no detecta `style={{`**, y lista los archivos uno por uno en vez de cubrir la carpeta.

## Qué hacer, un commit por punto

### 1. Test que proteja la regla completa
Amplía `resources/js/__tests__/no-hardcoded-hex.test.ts`:
- Debe aceptar **directorios**: con `'citas/'` se revisan todos los `.ts`/`.tsx` de la carpeta, recursivamente. Reemplaza la lista de archivos de citas por `'citas/'`.
- Además de hex, debe fallar con `style={{` **salvo** cuando la línea anterior tenga el comentario `// dynamic-style: <motivo>`. Las páginas ya migradas (`pacientes/index.tsx`, `registro/index.tsx`) deben seguir pasando; si alguna tiene un `style` dinámico legítimo, agrégale el comentario.
- Excepción permitida: `citas/lib/palettes.ts`, porque es la paleta de avatares que se elige en tiempo de ejecución. Déjala explícita en el test con un comentario.

Este test **debe fallar** en este commit, porque todavía quedan los 103 `style`. Así se demuestra que funciona. Haz el commit igual y continúa.

### 2. Cero `style` estáticos en `citas/`
Convierte cada `style={{…}}` estático a clases de Tailwind. Por ejemplo:
- `display:'flex', flexDirection:'column', gap:6` pasa a `flex flex-col gap-1.5`;
- `fontFamily:'Bitter…'` pasa a `font-serif`;
- `fontSize:12` pasa a `text-xs` (o `text-[12px]` si no hay equivalente exacto);
- los colores con `var(--color-x)` pasan a `text-x`, `bg-x` o `border-x`.

Los bordes condicionales por error pasan a clases condicionales con `cn()`, por ejemplo `cn('border', errors.doctor_id ? 'border-error' : 'border-input-border')`. Elimina el objeto `inputStyle` compartido y créalo como clase o como un componente pequeño si se repite. Solo quedan `style` para valores realmente calculados en tiempo de ejecución, con su comentario `// dynamic-style:`.

### 3. Usar los componentes de CEMEROG
- **Modal "Nueva cita"**: reemplaza el overlay hecho a mano por `FormDialog` (`open`, `onOpenChange`, `title`, `onSubmit`, `isLoading`, `submitLabel="Registrar cita"`).
- **Campos del modal**: usa `FormField` cuando su API lo permita (`label`, `name`, `error`, `required`, `as: 'select' | 'textarea'`). El buscador de pacientes puede quedarse como componente propio.
- **Tarjeta de la tabla**: usa `Panel` (`title`, `description`, `headerActions`, `noPadding`) si reproduce el mismo aspecto.
- **Día sin citas**: usa `EmptyState`, pero solo si el aspecto actual es equivalente. Si no lo es, deja el markup con clases y explica la razón en el PR.
- Si un componente no reproduce exactamente el aspecto actual, **no cambies el aspecto**: ajusta el componente con una prop nueva y su test, o deja el markup con clases y justifícalo en el PR.
- Los tests de caracterización (`citas-index.test.tsx`) deben seguir pasando **sin cambios de lógica**. Si `FormDialog` cambia algún selector (por ejemplo, el botón Cancelar), detente y explícalo antes de tocar el test.

### 4. Quitar el borde de las etiquetas de estado de citas
En `StatusBadge`, los estados `cita-*` deben verse igual que antes del refactor: sin borde visible y con el mismo tamaño. Revisa en `origin/main` cómo se dibujaban las etiquetas en `citas/index.tsx` y reprodúcelo. No cambies el aspecto de los estados que ya existían (`espera`, `consulta`…). Agrega un test que verifique que `cita-*` no tiene borde.

### 5. Capturas de antes y después
Con `php artisan migrate:fresh --seed`, toma capturas en `main` y en esta rama, con el mismo tamaño de ventana (1280×900), de:
1. `/citas` de hoy con citas en varios estados;
2. `/citas` de un día futuro (vista por horarios);
3. un día sin citas;
4. el modal "Nueva cita" abierto, con "Ana" escrito en el buscador.

Guárdalas en `docs/screenshots/citas/` como `<vista>-antes.png` y `<vista>-despues.png`. Compáralas: **no debe haber diferencias visibles**. Si hay alguna, corrígela o explica en el PR por qué es aceptable.

## Antes de subir

Todo esto debe terminar con código 0:
```bash
vendor/bin/pint --test
vendor/bin/phpstan analyse --level=6
vendor/bin/pest
npm run types:check
npm run lint
npm run test
npm run build
```
Y esto debe devolver **0**, salvo líneas precedidas por `// dynamic-style:`:
```bash
grep -rn "style={{" resources/js/pages/citas | wc -l
grep -rnE "#[0-9a-fA-F]{3,6}\b" resources/js/pages/citas --include=*.tsx | wc -l
```

Actualiza la descripción del PR #8 con:
- los conteos **reales** de antes y después (líneas, hex, `style={{` totales y dinámicos);
- qué componentes se usan ahora;
- las capturas;
- la salida de los 7 comandos.

No mezcles el PR.
