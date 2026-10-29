# Prompt 15b — Ajustes al PR #27 (signos vitales en lb y ft/in)

> Pégalo en Claude Code en la raíz de `cemerog`.

---

Trabaja en la misma rama del PR #27 (`git checkout feat/signos-vitales-lb-ft && git pull`). Sube los commits al mismo PR y **no lo mezcles**. Sigue `CLAUDE.md`. Un commit por punto, empezando por el test que falla.

## 1. La talla se muestra mal: 5′7″ se guarda y se ve 5′6″ (bloqueante)

`cmToFeetInches` usa `Math.floor`. 5′7″ se guarda como 170 cm, pero 170 / 2.54 = 66.93 in se trunca a 66 y se muestra **5′6″**. El médico escribe una talla y el historial muestra otra. El PR cambió los tests para aceptar ese error («within 1 inch», «5′6″»). El prompt 15 pedía lo contrario: ida y vuelta **sin perder precisión visible** y que el historial muestre **5′7″**.

- Redondea el total de pulgadas con `Math.round` y luego separa pies y pulgadas. Si redondear da 12 pulgadas, el resultado tiene que pasar al pie siguiente.
- Devuelve los tests a lo que pedía el prompt: `cmToFeetInches(170)` → 5′7″, y el historial muestra `5′7″` para `talla: 170`.
- **Test de ida y vuelta exhaustivo:** para **toda** talla de 1′0″ a 7′11″, `cmToFeetInches(feetInchesToCm(ft, in))` devuelve exactamente los mismos pies y pulgadas.

## 2. El peso cambia al volver a mostrarlo: 154 lb se ve 154.1 lb (bloqueante)

El peso se guarda en kg × 10, y cada unidad equivale a unas 0.22 lb. Por eso 154 lb vuelve como 154.1 lb. El prompt 15 pedía ida y vuelta sin perder precisión visible.

- `kgTimes10ToLb` (o la función que da formato) redondea a la **media libra** más cercana: 154 → `154 lb`, 154.5 → `154.5 lb`. Así cualquier peso entero o con .5 vuelve exacto, porque el error máximo de almacenamiento (0.11 lb) es menor que 0.25.
- **Test exhaustivo:** para todo peso de 2 a 700 lb en pasos de 0.5, el valor mostrado después de guardar es igual al escrito.
- Corrige el test del historial: `peso: 699` → `154 lb`.

## 3. Falta el test de Pest de rangos y los errores del backend no se ven

- El PR cambió las reglas de `peso` y `talla` en `StoreConsultationRequest`, pero **no agregó ningún test de Pest**. Agrega:
  - `talla: 400` → 422.
  - `peso: 5000` → 422.
  - Los límites exactos válidos (`peso` 9 y 3175, `talla` 30 y 241) → se guardan.
- Hoy el formulario solo avisa en el frontend. Si el backend rechaza el valor, la página no muestra nada y la nota no se guarda. Muestra `errors.peso` debajo del campo de peso y `errors.talla` debajo de los de talla, con los tokens de error. Vale lo mismo para cualquier error de validación de la nota.
- **Test (Vitest):** con `errors.talla` en las props, el mensaje aparece en pantalla.
- Agrega el aviso de rango a **Pies** (1–7), igual que el de peso y pulgadas.

## 4. Código muerto

`computeImc` en `resources/js/pages/consulta/lib/helpers.ts` ya no se usa: lo reemplazó `computeImcFromMetric`. Elimínalo junto con sus tests, si los tiene.

## Antes de subir

Los 7 comandos deben terminar con **código 0**. Pega en la descripción del PR la salida **real**. No lo mezcles.
