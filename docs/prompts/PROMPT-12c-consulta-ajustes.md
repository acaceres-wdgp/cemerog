# Prompt 12c — Ajustes al PR #21 (tokens de Consulta)

> Pégalo en Claude Code en la raíz de `cemerog`.

---

Trabaja en la misma rama del PR #21 (`git checkout refactor/consulta-tokens && git pull`). Sube los commits al mismo PR y **no lo mezcles**. Sigue `CLAUDE.md`.

## 1. Los 6 `style={{` marcados como «dinámicos» no lo son

El comentario `// dynamic-style:` es solo para valores **calculados en tiempo de ejecución**, como un tamaño o un color que sale de una paleta indexada por ID. Elegir entre **dos tokens** según una condición **no** es dinámico: se resuelve con clases.

Archivos afectados:
- `QueueSelector.tsx`: 2 casos, fila activa y badge según estado.
- `NotaClinica.tsx`: color del placeholder de diagnósticos.
- `HistorialPanel.tsx`: entrada seleccionada.
- `AntecedentesPanel.tsx`: color de alergias.
- `ConsultaActions.tsx`: pestaña activa.

Qué hacer:
- Reemplaza los 6 por `cn('…', condición ? 'bg-list-row-bg' : 'bg-card-bg')` o equivalente, con el **mismo aspecto**.
- Si ya existe `SegmentedControl` y reproduce exactamente las pestañas de `ConsultaActions`, úsalo. Si no las reproduce, deja las clases.

## 2. Que el test anti-hex lo detecte la próxima vez

En `resources/js/__tests__/no-hardcoded-hex.test.ts`:
- Haz que **falle** cuando un `style={{` contenga `var(--color-`, **aunque** tenga el comentario `// dynamic-style:`. Los colores siempre se escriben con clases.
- Corre el test contra **todas** las carpetas ya migradas: pacientes, registro, citas, tablero, consulta, `layouts/` y `components/cemerog/`.
- Si aparece algún caso en otras carpetas, corrígelo igual, con `cn()` y clases.

## 3. La caja del IMC cambió de aspecto

**Antes:** la caja del IMC tenía **borde punteado** y fondo claro, como una caja de solo lectura.
**Ahora:** tiene fondo gris sólido.

Restaura el aspecto original, borde punteado y mismo fondo, usando tokens.

## Antes de subir

- Los 7 comandos deben terminar con **código 0**. Verifica el lint con `npm run lint; echo $?`.
- Este comando debe dar **0** (o solo valores realmente dinámicos, como tamaños, sin colores):
  ```bash
  grep -rn -A6 "style={{" resources/js/pages resources/js/layouts resources/js/components/cemerog | grep -c "var(--color-"
  ```
- Actualiza la descripción del PR. No lo mezcles.
