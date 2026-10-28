# Prompt 01c — Citas: ajustes finales al PR #8

> Pégalo en Claude Code en la raíz de `cemerog`.

---

Trabaja en la rama `refactor/citas-tokens` (`git checkout refactor/citas-tokens && git pull`) y sube los commits al mismo PR #8. No lo mezcles. Sigue `CLAUDE.md`.

La revisión visual (antes en `main` y después en esta rama, con los mismos datos, a 1280×900) dio esto:
- La vista de hoy, la de días futuros y el día sin citas se ven **iguales**. Hay como mucho 1 px de diferencia vertical, que es aceptable.
- **El modal "Nueva cita" cambió de aspecto** al pasar a `FormDialog`.

Quedan dos cosas por corregir.

## 1. El lint no está en verde

`npm run lint` (`vp check`) falla por **formato** en:
- `resources/js/pages/citas/components/PatientSearch.tsx`
- `resources/js/pages/pacientes/index.tsx`
- `resources/js/pages/registro/index.tsx`

Además, la descripción del PR dice "pass (125 files, 2 warnings)", pero en este proyecto los avisos cuentan como fallo (`denyWarnings: true`).

Haz lo siguiente:
1. Corre `npm run check:fix` y haz un commit **solo de formato**.
2. Corrige los avisos que queden.
3. Confirma que `npm run lint` termina con **código de salida 0** (`npm run lint; echo $?` debe imprimir `0`).

## 2. El modal debe verse como antes (y como el prototipo)

Diferencias entre el modal original y el `FormDialog` actual:

| | Antes (original y prototipo) | Ahora (`FormDialog`) |
|---|---|---|
| Fondo de la tarjeta | blanco (`card-bg`) | verdoso (`bg-background`, el fondo de la app) |
| Fondo de los inputs | blanco | verdoso, porque se ve el fondo de la tarjeta |
| Overlay | claro, translúcido | negro al 80 % (`bg-black/80` de shadcn) |
| Radio de la tarjeta | ~14 px | ~8 px |
| Botón cerrar (×) | cuadrado de 30 px con fondo `secondary-bg` | × sin fondo de shadcn |
| Asterisco de requerido | color del texto | rojo |

Corrígelo **en `FormDialog`**, para que todos los modales futuros salgan bien, sin tocar `components/ui/`, que no se modifica:
1. Tarjeta: fondo `bg-card-bg`, borde `border-card-border`, radio de 14 px y la sombra del original.
2. Overlay: en vez de usar el `DialogContent` de shadcn tal cual, compón `FormDialog` con las primitivas exportadas (`DialogPortal`, `DialogOverlay` con `className` propio y el contenido de Radix) para poder darle el overlay del original. Revisa en `origin/main` el `NuevaCitaModal` original para copiar el color y la opacidad exactos, y crea un token si hace falta (por ejemplo, `--color-overlay`).
3. Botón cerrar igual al original. Si el de shadcn no se puede ocultar, ocúltalo y pon el propio.
4. El asterisco de requerido con el mismo color que antes.
5. Agrega en `components/cemerog/__tests__/FormDialog.test.tsx` un test que fije estas clases: fondo de la tarjeta, overlay y radio.

Los tests de caracterización de citas (`citas-index.test.tsx`) deben seguir pasando **sin cambios de lógica**.

## Capturas

No hace falta que las generes: la comparación visual la hago yo al revisar. **Quita de la descripción del PR la sección "Capturas pendientes".**

## Antes de subir

Los 7 comandos deben terminar con código 0, y en la descripción del PR debes poner su salida **real**, sin resumirla con "pass" si hubo avisos:
```bash
vendor/bin/pint --test
vendor/bin/phpstan analyse --level=6
vendor/bin/pest
npm run types:check
npm run lint
npm run test
npm run build
```
