# Prompt 18 — Cuenta del día, cargos y honorarios del médico

> Pégalo **después** de mezclar el PR del Prompt 17.

---

## Reglas de negocio
1. **Precio de consulta por médico** (`doctors.consultation_price`, centavos). Una especialidad tiene varios médicos con precios distintos.
2. **Honorarios**: monto **fijo** por consulta por médico (`doctors.consultation_fee`, centavos). Se le paga **por lo facturado**. La liquidación (reporte y pago) se hará más adelante; ahora solo se **guardan los datos**.
3. **Una cuenta por paciente por día** («jornada»): suma todo lo que consume ese día, aunque vea a varios médicos. Si la cuenta del día ya fue facturada y el paciente vuelve, se abre otra.
4. Al **registrar una atención** (Registro o walk-in del Tablero) se obtiene/crea la cuenta del día y se agrega el **cargo de consulta** con el precio del médico **de ese momento** y su honorario **de ese momento** (si cambian después, lo cargado no cambia).
5. **Visibilidad en Consulta (pestaña «Órdenes y cargos»)**: el médico que es también administrador ve **todos** los cargos de la cuenta; un médico que no es administrador ve **solo los cargos que él generó**. El administrador no médico no ve Consulta; verá la cuenta en Facturación (más adelante).
6. Al **dar de alta** (Prompt 16), si el paciente no tiene otras atenciones abiertas ese día, la cuenta pasa a `pendiente_facturar`.
7. Sin seguros (ARS) por ahora.

Dinero **siempre en centavos** (int). Lee `CLAUDE.md` y síguelo.

## Reglas
- Rama `feat/cuenta-cargos` desde `main` recién actualizado. PR, no lo mezcles. TDD, un commit por paso.
- Migraciones nuevas con test de reversión. Prohibido: floats para dinero, instalar dependencias, `as any`/`@ts-ignore`/`eslint-disable`, hex o `style={{` estáticos. Muestra montos con `formatMoney()` / `MoneyText`.

## Lecciones de los PR anteriores (obligatorio)
Estos errores aparecieron en las revisiones de los prompts 13–17. Evítalos desde el principio:
- **Inertia, no `fetch`.** Todo guardado usa `router.post/put/patch` con las rutas de **Wayfinder**, y el backend responde con redirect + `Toast`. Nada de `JsonResponse` ni de tokens XSRF a mano. Los errores de validación se muestran desde `errors`.
- **Los tests reflejan la respuesta real del servidor.** No simules respuestas que el backend no envía. Si la pantalla necesita un dato (un id, una lista), comprueba en Pest que el backend lo envía en las props.
- **Registros clínicos y financieros:** las claves foráneas a `patients`, `doctors` y `users` usan `restrictOnDelete`.
- **Migraciones:** con la fecha de hoy, y su test de reversión con `--path` (nunca `--step`). Antes de abrir el PR, `git status` debe estar limpio: si renombras o borras un archivo, que el cambio quede en el commit.
- **Tests de límites válidos:** además del redirect, verifica `assertSessionHasNoErrors()` y el dato guardado.
- **Lint:** los avisos cuentan como fallo. `npm run lint; echo $?` debe imprimir `0`, y no describas un aviso como «preexistente» sin comprobarlo en `main`.
- **Tamaño:** ningún archivo pasa de ~250 líneas.
- **Concurrencia en la cuenta del día:** dos registros simultáneos del mismo paciente no deben crear dos cuentas abiertas. En `GetOrOpenDailyAccount`, bloquea con `lockForUpdate()` dentro de la transacción (por ejemplo, sobre la fila del paciente) y agrega un test.

## Paso 1 — Precio y honorario del médico
- Migración: `doctors.consultation_price` y `doctors.consultation_fee` (unsigned int, centavos, default 0). Para los médicos existentes, inicializa `consultation_price` con el `consultation_price` de su especialidad.
- Formulario de médico: campos «Precio de consulta» y «Honorario por consulta» (RD$), con validación (honorario ≤ precio).

## Paso 2 — Modelo de cuenta y cargos
- `accounts`: `id`, `patient_id`, `service_date` (fecha), `status` (`abierta` | `pendiente_facturar` | `facturada` | `anulada`), `opened_at`, `closed_at` nullable, timestamps. Índice por (`patient_id`, `service_date`, `status`).
- `account_charges`: `id`, `account_id`, `turn_id` nullable, `doctor_id` nullable (quien generó el cargo), `created_by` (user), `type` (`consulta` | `laboratorio` | `imagen` | `medicamento` | `procedimiento` | `otro`), `description`, `quantity` (int), `unit_price` (centavos), `total` (centavos), `doctor_fee` (centavos, nullable — honorario guardado en el momento), `source_type`/`source_id` nullable (polimórfico, para órdenes futuras), timestamps.
- Acción `GetOrOpenDailyAccount(patient, date)` y acción `AddConsultationCharge(turn)`.

## Paso 3 — Cargo automático al registrar la atención
En `RegisterArrival` (y por tanto Registro, walk-in del Tablero y «Asignar turno» desde cita), dentro de la misma transacción: cuenta del día + cargo de consulta (`type = consulta`, `doctor_id` del turno, `unit_price = doctor.consultation_price`, `doctor_fee = doctor.consultation_fee`). Paciente con dos médicos el mismo día → **una** cuenta con **dos** cargos.

## Paso 4 — Pestaña «Órdenes y cargos» (según el diseño)
Panel **Cargos a la cuenta** (Descripción / Cant. / Importe, **Total acumulado**) con datos reales y la regla de visibilidad 5 aplicada **en el backend** (no solo ocultando en el frontend). El panel **Órdenes** queda vacío con «No hay órdenes para esta consulta.» hasta Laboratorio.

## Paso 5 — Alta → pendiente de facturar
Al crear un `discharge`, si no quedan turnos abiertos del paciente ese día, la cuenta pasa a `pendiente_facturar`.

## Tests (Pest)
- Registrar atención crea la cuenta del día y el cargo con precio y honorario del médico en ese momento; cambiar luego el precio no altera el cargo.
- Dos atenciones el mismo día (médicos distintos) → una cuenta, dos cargos.
- Cuenta facturada + nueva atención ese día → nueva cuenta.
- Visibilidad: médico administrador ve todos; médico no administrador ve solo los suyos; administrador no médico no accede.
- Alta con otra atención abierta → cuenta sigue `abierta`; alta de la última → `pendiente_facturar`.
- Todos los montos son enteros (centavos).
- Vitest: el panel muestra filas y total con `formatMoney`.

## Documentación
ADR en `docs/DECISIONS.md`: «Cuenta diaria por paciente; precio y honorario por médico guardados en cada cargo; honorarios por lo facturado». Actualiza `docs/DOMAIN.md` y `docs/MODULES.md` (dependencia: liquidación de honorarios y Facturación).

## Antes de abrir el PR
7 comandos con **código 0**. Salida real en el PR. No incluyas capturas.
