# Prompt 02a — Tablero: tests de caracterización y partir el archivo

> Pégalo en Claude Code en la raíz de `cemerog`, con `main` actualizado (`git checkout main && git pull`).

---

Vas a preparar el refactor del **Tablero de atenciones** (`resources/js/pages/tablero/index.tsx`, 1.784 líneas). Este PR **solo mueve código**: no cambia clases, colores, estilos ni comportamiento. Los tokens van en otro PR. Lee `CLAUDE.md` y usa como modelo la estructura de `resources/js/pages/citas/`.

## Reglas

- Trabaja en la rama `refactor/tablero-02a-partir`, creada desde `main`. Abre un PR. **No lo mezcles.**
- Haz exactamente dos commits:
  1. los tests;
  2. la partición del archivo.
- Solo puedes tocar `resources/js/pages/tablero/` y `resources/js/__tests__/tablero-index.test.tsx`.
- **Prohibido:**
  - Cambiar cualquier `className`, `style` o color.
  - Renombrar textos.
  - Cambiar lógica.
  - Tocar el backend o `components/`.
  - Instalar dependencias.
  - Usar `as any`, `@ts-ignore` o `eslint-disable`.
- Cada línea JSX movida debe quedar **idéntica** a la original. Lo único que cambia son los imports, las exportaciones y las props necesarias para pasar datos entre componentes.

## Commit 1 — Tests de caracterización

Crea `resources/js/__tests__/tablero-index.test.tsx`, con el mismo estilo que `citas-index.test.tsx`, que fije el comportamiento actual:
- Muestra los turnos con número, paciente, médico y estado (`espera` / `en_consulta`), y los contadores de cada pestaña.
- Las pestañas de turnos (todas, en espera, en consulta) filtran bien.
- Las pestañas de citas del día filtran bien, y una cita con `has_turn` no aparece como pendiente.
- "Llamar siguiente", o la acción equivalente, hace `router.patch` al turno correcto con el estado correcto.
- Subir y bajar un turno hace `router.patch` con la dirección correcta.
- "Asignar turno" desde una cita hace `router.post` con el payload correcto.
- "Marcar no asistió" hace `router.patch` correctamente.
- El modal "Agregar turno" se abre y se cierra. Con un paciente y un médico elegidos, envía `router.post` con el payload correcto. Sin ellos, muestra los errores de validación.
- El buscador de pacientes del modal no consulta con menos de 2 caracteres y sí con 2 o más.

Los tests deben pasar con el código actual.

## Commit 2 — Partir el archivo

Crea dentro de `resources/js/pages/tablero/`:
- `types.ts` con los tipos `TurnRow`, `CitaRow`, `DoctorOption`, `PatientResult` y `Props`;
- `lib/` con las constantes y helpers, como `TYPE_LABELS`;
- `components/`, con al menos:
  - `AgregarTurnoModal`;
  - `PatientSearch`, que por ahora se queda aquí aunque esté duplicado con Citas: se unifica en el PR 02b;
  - la lista o tabla de turnos y sus filas;
  - el panel de citas del día;
  - la barra de pestañas y acciones.

**Meta:** `index.tsx` por debajo de ~150 líneas y ningún archivo por encima de ~250.

Los tests del commit 1 deben seguir pasando **sin modificarse**.

## Antes de abrir el PR

Los 7 comandos deben terminar con **código de salida 0**. Los avisos del lint cuentan como fallo; verifícalo con `npm run lint; echo $?`.
```bash
vendor/bin/pint --test
vendor/bin/phpstan analyse --level=6
vendor/bin/pest
npm run types:check
npm run lint
npm run test
npm run build
```

En la descripción del PR pon:
- la lista de archivos nuevos con sus líneas (`wc -l`);
- la salida real de los 7 comandos;
- la confirmación de que no cambió ninguna clase ni ningún estilo.

No incluyas capturas: la comparación visual la hago yo.
