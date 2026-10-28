# Prompt 15 — Signos vitales en libras y pies/pulgadas; IMC; «Plan»

> Pégalo **después** de mezclar el PR del Prompt 14.

---

## Contexto
En la República Dominicana el peso se toma en **libras** y la talla en **pies y pulgadas**. Hoy el formulario pide `kg` y `cm`; el personal escribe libras en el campo de kilos y el IMC sale «Obesidad» para todos. Los datos actuales de consultas son **de prueba** (no hay que convertirlos).

Lee `CLAUDE.md` y síguelo.

## Reglas
- Rama `feat/signos-vitales-lb-ft` desde `main` recién actualizado. PR, no lo mezcles. TDD.
- **Almacenamiento**: se sigue guardando en métrico (`peso` = kg × 10, `talla` = cm) — estándar clínico para IMC e informes. La **interfaz** pide y muestra libras y pies/pulgadas. No crees migraciones.
- Prohibido: instalar dependencias, `as any`/`@ts-ignore`/`eslint-disable`, hex o `style={{` estáticos.

## Paso 1 — Conversión (lib con tests)
En `resources/js/pages/consulta/lib/units.ts` (o `resources/js/lib/units.ts`):
- `lbToKgTimes10(lb)`, `kgTimes10ToLb(v)` (1 lb = 0.45359237 kg), redondeo a 1 decimal en libras.
- `feetInchesToCm(ft, in)`, `cmToFeetInches(cm)` (1 in = 2.54 cm), pulgadas 0–11.
- `computeImc(pesoKgTimes10, tallaCm)` (fórmula actual, ya correcta en métrico).
Tests: 154 lb → 69.9 kg; 5′7″ → 170 cm; ida y vuelta sin perder precisión visible; IMC de 154 lb y 5′7″ ≈ 24.1 «Normal».

## Paso 2 — Formulario
- **Peso**: un campo en **lb**.
- **Talla**: dos campos, **pies** y **pulgadas** (0–11).
- **IMC**: calculado en vivo con la categoría (Bajo / Normal / Sobrepeso / Obesidad).
- **Rangos razonables** con aviso (no bloqueo) si se salen: peso 2–700 lb, talla 1′0″–7′11″; y validación en el backend (`StoreConsultationRequest`) de los valores convertidos.
- Al guardar se envía `peso` (kg × 10) y `talla` (cm) como hoy.

## Paso 3 — Mostrar en lb y pies en todos lados
Historial (detalle de consulta) e impresos muestran `154 lb` y `5′7″`.

## Paso 4 — «Plan e indicaciones» → «Plan»
Renombra la etiqueta del campo de la nota clínica a **«Plan»** (contenido clínico). Las indicaciones para el paciente irán en la Receta (Prompt 17). No cambies el nombre de la columna (`plan_tratamiento`).

## Paso 5 — Dividir `NotaClinica`
`NotaClinica.tsx` tiene ~540 líneas. Extrae `SignosVitales.tsx` y `DiagnosticoCie10.tsx` (y lo que haga falta) para que ningún archivo pase de ~250 líneas.

## Tests
- Vitest: escribir 154 lb y 5′7″ muestra IMC ≈ 24.1 Normal y envía `peso: 699`, `talla: 170`.
- Vitest: el historial muestra `154 lb` y `5′7″` para `peso: 699`, `talla: 170`.
- Pest: valores fuera de rango (p. ej. talla 400 cm) se rechazan.
- Los tests de caracterización de Consulta: actualiza **solo** los casos que dependen de las unidades (antes kg/cm) y explícalo en el PR.

## Antes de abrir el PR
7 comandos con **código 0**. Salida real en el PR.
