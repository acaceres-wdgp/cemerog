# Dominio de negocio – CEMEROG

Clínica médica privada "Dres. Rodríguez & Guzmán", República Dominicana.
Una sola sucursal. Moneda: peso dominicano (DOP).

---

## Glosario

| Término       | Definición                                      |
| ------------- | ----------------------------------------------- |
| Paciente      | Persona registrada que recibe atención          |
| Expediente    | Historial clínico completo del paciente         |
| Consulta      | Visita médica programada o de walk-in           |
| Emergencia    | Atención no programada, urgente                 |
| Internamiento | Hospitalización con cama asignada               |
| Cirugía       | Procedimiento quirúrgico programado             |
| Análisis      | Examen de laboratorio o imagen diagnóstica      |
| Factura       | Documento de cobro por servicios                |
| Cuadre        | Cierre diario de caja                           |
| CxC           | Cuentas por cobrar pendientes                   |
| Triaje        | Clasificación de urgencia (I–V)                 |
| Especialidad  | Área médica (Medicina general, Pediatría, etc.) |

---

## Módulos y reglas de negocio

### Inicio

- Dashboard resumen del día.
- Acceso para: Administrador, Médico, Secretaría, Caja.
- **Pendiente de implementar**: widgets de estadísticas en tiempo real.

### Tablero

- Vista kanban/lista de pacientes por estado (espera, consulta, internado, etc.).
- Estados de atención: espera, consulta, emergencia, internado, cirugia, pendiente, balance, saldada, cancelada.
- **Pendiente de implementar**: actualización en tiempo real con broadcasting.

### Pacientes

- Directorio permanente de todos los pacientes de la clínica.
- Búsqueda por nombre (AND entre palabras) o por número de documento/teléfono (hash exacto).
- Panel de detalle (Sheet) con datos personales, alergias, y últimas 4 atenciones.
- **Los expedientes son permanentes**: no existe borrado ni desactivación de pacientes. Una vez registrado, el paciente forma parte del historial clínico para siempre. Ver ADR-009.

### Registro de pacientes

- Flujo unificado: buscar primero → elegir paciente existente o registrar nuevo → crear turno de atención.
- Búsqueda con autocompletar (mínimo 3 caracteres, debounce 300 ms).
- Un paciente no puede tener más de una atención abierta el mismo día; el sistema muestra un aviso si intenta registrarse de nuevo.
- La creación del paciente y la asignación del turno ocurren en una sola transacción (`RegisterArrival`).
- `expediente_number` = `P-` + id con cero a la izquierda (5 dígitos mínimo).
- `document_number` y `phone` se guardan cifrados; se indexan mediante hash HMAC-SHA256 de solo los dígitos para búsquedas exactas entre distintos formatos de entrada.

### Citas

- Programación de consultas por médico y especialidad.
- Recordatorio y confirmación (futuro).
- **Pendiente de implementar**: calendario de citas por médico.

### Consulta

- Notas SOAP, diagnóstico CIE-10, prescripciones.
- Genera órdenes de laboratorio e imagen.
- **Pendiente de implementar**: formulario de consulta completo.

### Emergencia

- Flujo de triaje (I–V).
- Atención inmediata, puede derivar a internamiento o cirugía.
- **Pendiente de implementar**: tablero de triaje en tiempo real.

### Internamiento

- Asignación de cama/habitación.
- Seguimiento de evolución.
- **Pendiente de implementar**: gestión de habitaciones y camas.

### Cirugía

- Programación quirúrgica, equipo, anestesiólogo.
- **Pendiente de implementar**: agenda quirúrgica.

### Laboratorio

- Catálogo de análisis con precios.
- Registro de resultados, referencia de rangos normales.
- **Pendiente de implementar**: interfaz de carga de resultados.

### Imágenes

- Rayos X, ultrasonido, TAC, RMN.
- **Pendiente de implementar**: gestión de estudios de imagen.

### Facturación

- Factura por servicios prestados.
- Tipos de pago: efectivo, tarjeta, seguro.
- ITBIS aplicado según tipo de servicio.
- **Pendiente de implementar**: generación de facturas y recibos.

### Cuentas por cobrar

- Facturas pendientes de pago total o parcial.
- **Pendiente de implementar**: módulo de seguimiento de cobros.

### Cuadre de caja

- Cierre diario: efectivo, tarjeta, otros.
- Un solo cuadre por día por cajero.
- **Pendiente de implementar**: formulario de cuadre y reporte.

### Almacén (Catálogo)

- Inventario de insumos, medicamentos, materiales.
- **Pendiente de implementar**: catálogo y control de stock.

### Entrada de mercancía

- Registro de compras y entradas al inventario.
- **Pendiente de implementar**: formulario de entrada.

### Administración – Usuarios y roles

- CRUD de usuarios con asignación de roles.
- Contraseña temporal + cambio obligatorio en primer login.
- **Pendiente de implementar**: interfaz de gestión de usuarios.

### Administración – Doctores y especialidades

- Catálogo de médicos y sus especialidades.
- **Pendiente de implementar**: CRUD de doctores.

### Catálogos de precios

- Precios por servicio, análisis, estudio.
- **Pendiente de implementar**: editor de precios.

### Habitaciones y camas

- Catálogo de habitaciones, tipo de cama, tarifa.
- **Pendiente de implementar**: mapa de disponibilidad.

### Tema y estados

- Configuración del tema visual del sidebar.
- **Pendiente de implementar**: editor de estados de atención.

---

## Reglas generales del negocio

1. Un paciente puede estar en múltiples estados simultáneamente (consulta + laboratorio pendiente).
2. La factura se genera cuando el paciente está en estado "balance".
3. Una cuenta pasa a "saldada" cuando el saldo es 0.
4. El cuadre solo lo puede cerrar un usuario con rol "caja".
5. Los precios de servicios son configurables desde el catálogo de precios.
6. ITBIS: los servicios médicos están exentos; medicamentos al 18 %.
7. **Permanencia de pacientes**: los expedientes clínicos nunca se borran ni desactivan. Solo el administrador puede editar datos personales.
8. **Atención única diaria**: un paciente no puede tener dos atenciones abiertas el mismo día. El intento genera un error de validación con referencia al turno existente.
