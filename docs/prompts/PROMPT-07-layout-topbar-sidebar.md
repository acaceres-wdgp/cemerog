# Prompt 07 — Layout: barra superior y tarjeta "Turno actual" como en el prototipo

> Pégalo **después** de mezclar los PR de los Prompts 04 y 06 (`git checkout main && git pull`).

---

Ajusta `resources/js/layouts/app/app-layout.tsx` (463 líneas, 32 hex, 12 `style={{`) para que la barra superior y la barra lateral se parezcan al prototipo (`design/CEMEROG v6.dc.html` y `design/README.md`). Lee `CLAUDE.md`.

## Reglas
- **Rama:** créala desde `main` **recién actualizado**, con el nombre `feat/layout-prototipo`. Abre un PR y **no lo mezcles**.
- **Prohibido:**
  - Tocar `design/` o `components/ui/`.
  - Instalar dependencias.
  - Usar `as any`, `@ts-ignore` o `eslint-disable`.
  - Escribir hex o `style={{` estáticos.

## Commits
1. **Tests de caracterización del layout.** Antes de cambiar nada, cubre:
   - qué elementos del menú ve cada rol;
   - el elemento activo;
   - el menú de usuario con "Cerrar sesión";
   - el tema de la barra lateral;
   - colapsar y expandir.
2. **Partir y migrar a tokens.** Divide `app-layout.tsx` en componentes (`Sidebar`, `Topbar`, `UserMenu`, `ThemeSwitcher`…) en `resources/js/layouts/app/components/`, y migra sus hex a tokens **sin cambio visual**. Agrega `layouts/` al test anti-hex.
3. **Barra superior, como en el prototipo:**
   - **Buscador:** placeholder "Buscar paciente o No. de atención…". Al escribir 3 o más caracteres, usa `PatientSearch` y lleva al panel del paciente en `/pacientes?paciente=…`. Quita el `⌘K` si no funciona.
   - **Reloj:** hora y fecha (por ejemplo "9:14 a. m." y "25 oct."), con `date-fns` y locale `es`. Se actualiza cada minuto; prueba que se actualiza con timers falsos.
   - **Usuario:** avatar con iniciales, nombre y **rol** debajo (por ejemplo "Dr. Franklin · Médico"), con chevron que abre el menú actual.
   - **No** agregues el indicador de turno de caja: se hará con el módulo Caja.
4. **Tarjeta "Turno actual" en la barra lateral** (solo si el usuario tiene `doctor` en los datos compartidos, del Prompt 06):
   - **Contenido:** "Turno actual **T-NN**", "N pacientes en espera · {consultorio}" y el botón "Llamar siguiente", con el aspecto del prototipo.
   - **Datos:** se toman de la cola de hoy **del médico vinculado**. Agrégalos a los datos compartidos de forma **perezosa** (lazy prop de Inertia) para no consultar en cada página a usuarios sin médico.
   - **"Llamar siguiente":** pone en `en_consulta` el próximo turno en `espera` de ese médico, según `turn_order`, usando la ruta existente `turnos.status` o una acción nueva con su test. Si no hay nadie en espera, el botón queda deshabilitado con el texto "Sin pacientes en espera".
   - **Colapsada:** con la barra lateral colapsada, la tarjeta se reduce a un ícono con un badge del número en espera.
   - **Tests de feature:**
     - solo el médico vinculado ve su cola;
     - "Llamar siguiente" toma el turno correcto;
     - no afecta las colas de otros médicos.

## Antes de abrir el PR
- Los 7 comandos deben terminar con **código 0**. Comprueba el lint con `npm run lint; echo $?`.
- En la descripción del PR pon números reales: hex y `style` del layout antes y después.
- No incluyas capturas: la comparación visual la hago yo.
