# Prompt 11 — Las citas de días futuros no aparecen en `/citas?date=…`

> Pégalo en Claude Code en la raíz de `cemerog`, después de `git checkout main && git pull`.

---

## Problema

Si se crea una cita para un día futuro y se abre `/citas?date=AAAA-MM-DD`, la cita **no aparece**. La causa:

1. `appointments.appointment_time` es de tipo `TIME`. En **MySQL** el valor llega como `"09:00:00"`. En **SQLite**, que es la base de los tests, llega como `"09:00"`; por eso los tests no lo detectan.
2. `CitasController::index` y `TableroController` envían `appointment_time` tal cual llega de la base.
3. La vista de días futuros (`resources/js/pages/citas/index.tsx` → `bySlot`, y `components/FutureRows.tsx`) busca cada cita por franja con `bySlot[slot]`, donde `slot` es `"09:00"`. Como `"09:00:00" !== "09:00"`, la cita no aparece en ninguna franja. Tampoco entra en `noSlot`, porque sí tiene hora.

En la misma vista hay **dos errores más**:

4. `bySlot` se arma con `Object.fromEntries(...)`, que deja **una sola cita por hora**. Si dos médicos tienen cita a las 09:00, una de las dos desaparece.
5. Una cita con una hora **fuera de** `SLOTS` (por ejemplo `10:15` o `16:00`) nunca se muestra.

Además, en la vista de hoy (`TodayRows`) y en el Tablero (`CitasHoyPanel`) la hora se ve como `09:00:00`.

Lee `CLAUDE.md` y síguelo.

## Reglas

- **Rama:** `fix/citas-hora`, creada desde `main` **recién actualizado**. Abre un PR y **no lo mezcles**.
- Haz un commit por paso, empezando por un test que falle.
- **Prohibido:**
  - cambiar el tipo de la columna o crear migraciones;
  - instalar dependencias;
  - usar `as any`, `@ts-ignore` o `eslint-disable`;
  - escribir hex o `style={{` estáticos.
- **Tests existentes:** los de caracterización de Citas y Tablero deben seguir pasando. Solo puedes **agregar** casos.

## Paso 1 — Backend: la hora siempre en formato `HH:MM`

- En el modelo `Appointment`, haz que `appointment_time` se lea **siempre** como `HH:MM`, con un accessor (`Attribute::get`) que recorte `HH:MM:SS` a `HH:MM` y deje `null` como `null`. Así sirve para todos los usos: Citas, Tablero y lo que venga después.
- **Test Pest:** inserta una cita con `DB::table('appointments')->insert([... 'appointment_time' => '09:00:00' ...])`, simulando lo que devuelve MySQL, y verifica que:
  - el modelo devuelve `'09:00'`;
  - `GET /citas?date=…` envía `appointment_time = '09:00'` en las props de Inertia;
  - `GET /tablero` envía también `'09:00'`.
- El test debe **fallar** antes del cambio.

## Paso 2 — Frontend: varias citas por franja y horas fuera de franja

En la vista de días futuros:

- **Varias citas a la misma hora.** Reemplaza `bySlot` (una cita por franja) por un **agrupado** `Record<string, AppointmentRow[]>`. En una franja con varias citas se muestran **todas**: una fila por cita, y la hora solo en la primera.
- **Horas fuera de las franjas.** Las citas con hora que no está en `SLOTS` se intercalan **en orden cronológico** entre las franjas. Por ejemplo, 10:15 va entre 10:00 y 10:30, y 16:00 va después de 15:00.
- **Normalización defensiva.** Antes de agrupar, recorta la hora a `HH:MM` en el frontend también (`slice(0, 5)`), por si llega con segundos desde otra fuente.
- **Sin hora.** Las citas sin hora (`noSlot`) siguen al final, como hoy.
- **Aspecto.** No cambies el aspecto de las filas ni de las franjas vacías («+ Disponible»).

**Tests (Vitest)**, en `citas-index.test.tsx` o en un archivo nuevo:
- Una cita con `appointment_time: '09:00:00'` en un día futuro aparece en la franja 09:00.
- Dos citas a las 09:00 con médicos distintos aparecen las dos.
- Una cita a las 10:15 aparece entre 10:00 y 10:30.
- Una cita a las 16:00 aparece después de 15:00.

## Paso 3 — Hora visible sin segundos

Con el Paso 1 ya debería verse `09:00` en `TodayRows` y `CitasHoyPanel`. Agrega un test en cada uno con `appointment_time: '09:00'` que verifique el texto `09:00` y que **no** aparezca `09:00:00`.

## Antes de abrir el PR

Los 7 comandos deben terminar con **código 0**; comprueba el lint con `npm run lint; echo $?`.
```bash
vendor/bin/pint --test && vendor/bin/phpstan analyse --level=6 && vendor/bin/pest
npm run types:check && npm run lint && npm run test && npm run build
```

Pruébalo también **en local con MySQL**, que es la configuración que usa Herd:
1. Crea una cita para mañana a las 09:00.
2. Crea otra a la misma hora con otro médico.
3. Crea una a las 10:15.
4. Abre `/citas?date={mañana}` y confirma que se ven las tres.

Escribe en la descripción del PR que hiciste esta prueba y pega la salida real de los comandos.
