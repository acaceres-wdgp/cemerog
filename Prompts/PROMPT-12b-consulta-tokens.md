# Prompt 12b — Consulta: tokens y componentes (sin cambio visual)

> Pégalo **después** de mezclar el PR del 12a (`git checkout main && git pull`).

---

Consulta ya está partida en `resources/js/pages/consulta/`. Ahora migra sus estilos (unos 137 hex y 163 `style={{`) a tokens y componentes de CEMEROG, como se hizo en Citas y Tablero. **Cero cambios visuales y de comportamiento.** Lee `CLAUDE.md`.

## Reglas
- **Rama:** créala desde `main` **recién actualizado**, con el nombre `refactor/consulta-tokens`. Abre un PR y **no lo mezcles**.
- **Archivos que puedes tocar:** solo `resources/js/pages/consulta/`, `resources/js/components/cemerog/`, `resources/css/app.css` y `resources/js/__tests__/`.
- **Prohibido:**
  - mover colores a `style={{ color: 'var(--…)' }}`;
  - cambiar la lógica de `consulta-index.test.tsx`;
  - tocar el backend o `components/ui/`;
  - instalar dependencias;
  - usar `as any`, `@ts-ignore` o `eslint-disable`.

## Commits, en orden
1. **Test anti-hex en rojo.** Agrega `'consulta/'` a `resources/js/__tests__/no-hardcoded-hex.test.ts`. Ese test ya revisa directorios completos y detecta `style={{`. Debe **fallar** en este commit.
2. **Colores a tokens.** Pasa los colores a los tokens de `resources/css/app.css`. Antes de crear un token, busca si ya existe uno con el mismo valor; si creas alguno, ponle un nombre semántico.
3. **Componentes de CEMEROG donde encajen sin cambiar el aspecto.**
   - El encabezado de alergias y los avisos usan `AlertBanner`.
   - Los estados usan `StatusBadge`.
   - Los modales usan `FormDialog`.
   - Las tarjetas usan `Panel`.
   - Los campos usan `FormField`.
   - Si un componente no reproduce el aspecto exacto, ajústalo con una prop nueva y su test, o deja el markup con clases y justifícalo en el PR.
4. **Cero `style={{` estáticos.** Solo se permiten los dinámicos, con el comentario `// dynamic-style: <motivo>` en la línea anterior.

## Antes de abrir el PR
- Los 7 comandos deben terminar con **código 0**. Comprueba el lint con `npm run lint; echo $?`.
- Estos dos comandos deben dar **0**:
  ```bash
  grep -rn "style={{" resources/js/pages/consulta | wc -l   # excluyendo los // dynamic-style:
  grep -rnE "#[0-9a-fA-F]{3,6}\b" resources/js/pages/consulta --include=*.tsx | wc -l
  ```
- La descripción del PR debe incluir:
  - una tabla de antes y después con números reales;
  - los componentes usados y los que no, con el motivo;
  - los tokens nuevos;
  - la salida de los comandos.
- No incluyas capturas.
