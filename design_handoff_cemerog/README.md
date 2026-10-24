# Handoff: CEMEROG — Sistema de gestión clínica

## Overview
CEMEROG es el sistema interno de un centro médico (Dres. Rodríguez & Guzmán, República Dominicana). Cubre recepción, atención clínica (consulta, emergencia, internamiento y cirugía), laboratorio e imágenes, caja, inventario y administración. Cada rol ve solo sus módulos.

## About the Design Files
`CEMEROG v6.dc.html` es un **prototipo HTML de referencia**: muestra el aspecto y el comportamiento esperados, pero **no es código de producción**. La tarea es recrearlo en **Laravel 12 + Inertia + React + TypeScript + Tailwind 4 + shadcn/ui** con los patrones de ese stack. Ábrelo en un navegador junto a `support.js`. El selector de rol de la esquina permite ver la navegación de cada rol.

## Fidelity
**Alta fidelidad.** Los colores, la tipografía, el espaciado y los estados son finales. Los datos (pacientes, doctores, precios, exequátur, proveedores) son **ficticios**. El logo es provisional y de baja calidad, así que hay que reemplazarlo por el original.

## Design tokens

**Colores base**
- Primary `#2E8B3E` · hover `#277a35` · foreground `#FFFFFF`
- Brand accent `#8CC63F` (barritas de los encabezados de sección) · accent bg `#EEF6E2` · accent fg `#2f4a17`
- Texto `#333333` · título `#1f2d22` · muted `#71717a` · muted bg `#f4f4f5`
- Fondo de la app `#F3F7F2` · card `#FFFFFF` · borde de card `#e3e9e3` · borde de input `#e4e4e7` · divisor interno `#eef0ec` / `#f4f4f5`
- Encabezado de tabla: bg `#F6FAF1`, texto `#56693f`, 11.5px, 600, uppercase, letter-spacing .05em, alto 40px
- Error y valores fuera de rango `#b91c1c` sobre `#fef2f2` con borde `#fecaca`
- Sidebar (temas): Carbón `#2A2E2C`, Pizarra `#1F2B33`, Verde bosque `#173F26` (en este tema el logo usa bg `#8CC63F` y fg `#173F26`)

**Estados de la atención** (bg / fg / punto)
| clave | label | bg | fg | dot |
|---|---|---|---|---|
| espera | En espera | #FEF3C7 | #92400E | #D97706 |
| consulta | En consulta | #DBEAFE | #1E40AF | #2563EB |
| emergencia | En emergencia | #FEE2E2 | #991B1B | #DC2626 |
| internado | Internado | #EDE9FE | #5B21B6 | #7C3AED |
| cirugia | Internado por cirugía | #FCE7F3 | #9D174D | #DB2777 |
| pendiente | Pendiente de facturar | #FFEDD5 | #9A3412 | #EA580C |
| balance | Facturada (con balance) | #CFFAFE | #155E75 | #0891B2 |
| saldada | Saldada | #2E8B3E | #FFFFFF | #FFFFFF |
| cancelada | Cancelada | #F4F4F5 | #52525B | #A1A1AA |

**Triaje** (bg / fg): I Resucitación `#DC2626`/#fff · II Emergencia `#EA580C`/#fff · III Urgente `#F59E0B`/#3b2a00 · IV Menos urgente `#2E8B3E`/#fff · V No urgente `#2563EB`/#fff

**Tipografía**
- UI: Instrument Sans 400/500/600/700, base 14px, line-height 1.45
- Títulos y marca: Bitter 500/600/700. Títulos de card 16px/600 en `#1f2d22`; títulos de diálogo 19px
- Etiquetas de campo: 11px, 600, uppercase, letter-spacing .05em, `#71717a`
- Los números van con `font-variant-numeric: tabular-nums`

**Radios y sombras**
- `--radius` 0.625rem (10px) para inputs, botones y chips de fila; cards 14px; píldoras 999px; segmented 11px por fuera y 10px por dentro
- Sombra de card `0 1px 2px rgba(16,40,24,.03)`; toast `0 10px 30px rgba(0,0,0,.12)`
- Anillo de foco: borde `#2E8B3E` + `0 0 0 3px rgba(46,139,62,.18)`

**Botones** (alto 36px, padding 0 14px, gap 8px, ícono 16px, 500)
- Primario: bg `#2E8B3E`, texto blanco, sombra `0 1px 2px rgba(46,139,62,.3), inset 0 1px 0 rgba(255,255,255,.15)`, hover `#277a35`
- Secundario: bg `#F6F9F5`, borde `#dfe7df`, hover `#ECF2EB`
- Segmented: contenedor bg `#F3F7F2`, borde `#e3e9e3`, padding 3px; opción activa bg `#fff`, texto `#333` y sombra suave; inactiva transparente con texto `#71717a`; alto 30px

**Espaciado:** cards con padding 16–20px; gap de 16px entre cards y de 12–16px dentro de los formularios. Las cards usan flex-wrap con `min-width:0` para reacomodarse en pantallas estrechas.

**Toast:** abajo a la derecha (24px), 380px de ancho, ícono check verde, se cierra solo a los 3.2 s.

## Navegación y roles
| Sección | Clave | Página | Ícono lucide |
|---|---|---|---|
| General | inicio | Inicio (dashboard por rol) | House |
| Recepción | tablero | Tablero de atenciones | LayoutDashboard |
| | registro | Registro de pacientes | UserPlus |
| | citas | Citas | CalendarDays |
| Atención clínica | consulta | Consulta | Stethoscope |
| | emergencia | Emergencia | Siren |
| | internamiento | Internamiento | BedDouble |
| | cirugia | Cirugía | Scissors |
| Servicios | lab | Laboratorio | FlaskConical |
| | img | Imágenes | ScanLine |
| | impresos | Documentos imprimibles | Printer |
| Caja | caja | Facturación | Wallet |
| | cxc | Cuentas por cobrar | Receipt |
| | cuadre | Cuadre de caja | Coins |
| Inventario | almacen | Catálogo | Package |
| | entrada | Entrada de mercancía | PackagePlus |
| Administración | admin | Usuarios y roles | Users |
| | doctores | Doctores y especialidades | Stethoscope |
| | analisis | Catálogo de análisis | FlaskConical |
| | imgcat | Catálogo de imágenes | ScanLine |
| | precios | Catálogos de precios | Tag |
| | habs | Habitaciones y camas | BedDouble |
| | tema | Tema y estados | Palette |

**Módulos por rol**
- Administrador: todos
- Médico: inicio, tablero, citas, consulta, emergencia, internamiento, cirugia, lab, img, impresos
- Enfermería: tablero, emergencia, internamiento, cirugia
- Secretaría/recepción: inicio, tablero, registro, citas, impresos
- Bioanalista: lab, impresos
- Imágenes: img
- Caja: inicio, tablero, caja, cxc, cuadre, impresos
- Almacén: almacen, entrada

## Screens (resumen funcional)
- **Inicio de sesión:** usuario + contraseña (no email). Si el usuario tiene "cambio de contraseña pendiente", pasa a "Crea tu contraseña" (mín. 8, al menos un número, confirmación). No hay recuperación por correo: el administrador restablece.
- **Inicio:** dashboard según el rol (admin, recepción, médico, caja), con stat cards y listas del día.
- **Tablero de atenciones:** stat cards por estado, tabs y tabla de atenciones. Debajo, "Citas de hoy" con teléfono, llamar/WhatsApp, pasar a la cola o descartar.
- **Registro de pacientes:** primero busca por cédula, teléfono o nombre (autocompletar, avisa alergias y atención abierta); si no existe, se registra. Tipo de atención: Consulta (turno), Emergencia o **Solo análisis/imágenes** (sin consulta: elige estudios del catálogo, muestra preparación y total; crea órdenes con origen Ambulatorio y deja el cobro pendiente en caja).
- **Citas:** tabs Hoy / Mañana / Fecha (con selector), por doctor.
- **Consulta:** signos vitales editables con chequeo de rangos, antecedentes (formulario para paciente nuevo), nota clínica, diagnóstico CIE-10, receta (medicamento por medicamento con dosis, frecuencia y duración o "Continuo"; bloquea alergias; se guarda como registro del historial), órdenes, botón Guardar y "Cargar próximo paciente". Historial clínico a ancho completo con filtros por médico y tipo de registro.
- **Emergencia:** cubículos con triaje I–V; cada paciente abre su ficha con datos básicos editables, signos vitales con hora y gráficas, y aplicación de medicamentos que descuenta inventario y genera cargo.
- **Internamiento:** **solo pantalla de control** (los pacientes entran desde Consulta o Emergencia). Mapa de camas (libre, ocupada, limpieza); traslado por **drag & drop** con confirmación (la cama anterior queda en limpieza). Ficha del paciente: Medicamentos aplicados (enfermería aplica aquí), Laboratorio e imágenes de la estancia, Signos vitales, Notas de enfermería, Cargos acumulados; acciones Aplicar medicamento, Cambiar habitación, Dar alta.
- **Laboratorio:** tabs Órdenes de hoy (cola por estado) e **Historial de resultados** (búsqueda, filtro por prueba y fecha, paginación de 10). Botón "Orden sin consulta".
- **Imágenes:** tabla de estudios con búsqueda, fecha, filtro por estado y paginación; clic en una fila abre **la vista del paciente** con todos sus estudios y el editor del estudio seleccionado (adjuntar imágenes, hallazgos, conclusión, firma).
- **Documentos imprimibles:** receta, indicaciones, resultados y factura en formato carta.
- **Facturación:** solo la cuenta y la factura (sin perfil del paciente arriba ni "condición de pago"). Registrar pago: Efectivo, Tarjeta, Transferencia o **Crédito** (abono inicial opcional con su método, fecha compromiso obligatoria, nota; el resto va a Cuentas por cobrar).
- **Turno de caja:** para cobrar se necesita turno abierto. Al entrar con rol Caja sin turno aparece "Abrir turno" (turno y fondo de apertura por monto o denominación). Indicador de turno en el topbar y aviso en Inicio/Facturación/CxC/Cuadre. Facturar no exige turno; si se intenta cobrar sin turno, se abre la apertura y luego continúa el pago. Si el turno anterior no se cerró, queda "Pendiente de cierre" y el administrador ve una alerta.
- **Cuentas por cobrar** (abonos) y **Cuadre de caja** (por cajero y turno, esperado vs. contado, cierre).
- **Inventario:** catálogo con alertas de mínimo y vencimiento; entrada de mercancía por proveedor y lote, que permite **crear un producto nuevo** (medicamento/insumo, código automático, costo, precio, mínimo; detecta duplicados).
- **Administración:**
  - Usuarios y roles: nombre, **usuario** y contraseña (sin email), varios roles, "pedir cambio al iniciar sesión", restablecer contraseña (con generador), activar/desactivar. Cada usuario cambia su contraseña desde el menú de usuario.
  - Doctores y especialidades: formulario de especialidad (crear/renombrar, precio de consulta opcional).
  - **Catálogo de análisis:** código, nombre, categoría, precio, preparación y parámetros (numérico con unidad y rango, o texto con valor normal); activo/inactivo.
  - **Catálogo de imágenes:** código, nombre, modalidad, preparación, precio editable en la tabla; activo/inactivo.
  - Catálogos de precios (consultas, servicios, cirugías, tipos de habitación), habitaciones y camas, tema.

## Reglas de formato
- Moneda: `RD$1,000.00`, guardada en centavos.
- Fechas: `dd/MM/yyyy`, horas en 24 h (`08:31`).
- Cédula `000-0000000-0`; No. de atención `A-AAAA-NNNNNN`; factura `F-NNNNNNN`; recibo `R-NNNN`; orden de laboratorio `L-NNNN`; orden de imágenes `I-NNNN`; turno `T-NN`.
- Los códigos nunca se parten en dos líneas (`white-space: nowrap`).

## Assets
- `assets/logo-cemerog.png`: logo provisional, de baja resolución. Hay que pedir el original en SVG.
- Los iconos son de lucide (`lucide-react`).

## Files
- `CEMEROG v6.dc.html`: prototipo completo (necesita `support.js` en la misma carpeta).
- `PROMPT.md`: prompt para que Claude Code arme la estructura del proyecto (Fase 0), más una plantilla para cada funcionalidad.
