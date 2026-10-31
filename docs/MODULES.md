# Módulos – CEMEROG

## Tabla de módulos

| Clave         | Ruta                     | Componente          | Roles con acceso                                         | Estado                 | Orden impl. |
| ------------- | ------------------------ | ------------------- | -------------------------------------------------------- | ---------------------- | ----------- |
| inicio        | /inicio                  | inicio/index        | admin, medico, secretaria, caja                          | Esqueleto              | 1           |
| tablero       | /tablero                 | tablero/index       | admin, medico, enfermeria, secretaria, caja              | Terminado              | 2           |
| pacientes     | /pacientes               | pacientes/index     | admin, medico, secretaria                                | Terminado              | 2b          |
| registro      | /registro                | registro/index      | admin, secretaria                                        | Sin entrada en sidebar | 3           |
| citas         | /citas                   | citas/index         | admin, medico, secretaria                                | Terminado              | 4           |
| consulta      | /consulta                | consulta/index      | medico (ver nota)                                        | Terminado              | 5           |
| emergencia    | /emergencia              | emergencia/index    | admin, medico, enfermeria                                | Esqueleto              | 6           |
| internamiento | /internamiento           | internamiento/index | admin, medico, enfermeria                                | Esqueleto              | 7           |
| cirugia       | /cirugia                 | cirugia/index       | admin, medico, enfermeria                                | Esqueleto              | 8           |
| lab           | /laboratorio             | lab/index           | admin, medico, bioanalista                               | Esqueleto              | 9           |
| img           | /imagenes                | img/index           | admin, medico, imagenes                                  | Esqueleto              | 10          |
| impresos      | /impresos                | impresos/index      | admin, medico, enfermeria, secretaria, bioanalista, caja | Esqueleto              | 11          |
| caja          | /facturacion             | caja/index          | admin, caja, secretaria                                  | Terminado              | 12          |
| cxc           | /cuentas-por-cobrar      | cxc/index           | admin, caja, secretaria                                  | Terminado              | 13          |
| cuadre        | /cuadre-de-caja          | cuadre/index        | admin, caja, secretaria                                  | Terminado              | 14          |
| almacen       | /almacen                 | almacen/index       | admin, almacen                                           | Esqueleto              | 15          |
| entrada       | /entrada-mercancia       | entrada/index       | admin, almacen                                           | Esqueleto              | 16          |
| admin         | /admin/usuarios          | admin/index         | admin                                                    | Esqueleto              | 17          |
| doctores      | /admin/doctores          | doctores/index      | admin                                                    | Esqueleto              | 18          |
| analisis      | /admin/analisis          | analisis/index      | admin                                                    | Esqueleto              | 19          |
| imgcat        | /admin/imagenes-catalogo | imgcat/index        | admin                                                    | Esqueleto              | 20          |
| precios       | /admin/precios           | precios/index       | admin                                                    | Esqueleto              | 21          |
| habs          | /admin/habitaciones      | habs/index          | admin                                                    | Esqueleto              | 22          |
| tema          | /admin/tema              | tema/index          | admin                                                    | Esqueleto              | 23          |

### Nota sobre `registro`

El módulo `registro` (/registro) no aparece en el sidebar. Se accede únicamente desde botones explícitos:

- "Nuevo paciente" en /pacientes
- "Nueva atención" en el panel lateral de /pacientes
- Accesos directos del Tablero, Inicio y Citas

El ítem "Pacientes" en el sidebar usa `activeFor: ['/registro']` para mantenerse resaltado cuando el usuario navega a /registro.

#### Rutas del módulo registro

| Método | Ruta                            | Nombre                    | Descripción                                     |
| ------ | ------------------------------- | ------------------------- | ----------------------------------------------- |
| GET    | /registro                       | registro                  | Formulario de registro + nueva atención         |
| POST   | /registro                       | registro.store            | Crear paciente + turno (`RegisterArrival`)      |
| POST   | /registro/pacientes             | registro.pacientes.store  | Crear paciente **sin turno** (`CreatePatient`)  |
| GET    | /registro/pacientes/buscar      | registro.pacientes.buscar | Búsqueda de pacientes existentes                |
| GET    | /registro/pacientes/existe      | registro.pacientes.exists | Verificar existencia por documento (duplicados) |
| GET    | /registro/pacientes/{id}/editar | registro.pacientes.edit   | Formulario de edición de paciente               |
| PUT    | /registro/pacientes/{id}        | registro.pacientes.update | Actualizar datos del paciente                   |

## Roles

| Rol           | Descripción               | Módulos                                                                                                                                                                                          |
| ------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| administrador | Acceso administrativo     | inicio, tablero, pacientes, registro, citas, emergencia, internamiento, cirugia, lab, img, impresos, caja, cxc, cuadre, almacen, entrada, admin, doctores, analisis, imgcat, precios, habs, tema |
| medico        | Atención médica completa  | inicio, tablero, pacientes, citas, consulta, emergencia, internamiento, cirugia, lab, img, impresos                                                                                              |
| enfermeria    | Atención clínica de apoyo | tablero, emergencia, internamiento, cirugia, impresos                                                                                                                                            |
| secretaria    | Recepción y agendamiento  | inicio, tablero, pacientes, registro, citas, impresos, caja, cxc, cuadre                                                                                                                         |
| bioanalista   | Laboratorio               | lab, impresos                                                                                                                                                                                    |
| imagenes      | Estudios de imagen        | img                                                                                                                                                                                              |
| caja          | Facturación y cobros      | inicio, tablero, caja, cxc, cuadre, impresos                                                                                                                                                     |
| almacen       | Inventario                | almacen, entrada                                                                                                                                                                                 |

### Nota sobre `consulta` y el rol `administrador`

El módulo `consulta` requiere **dos condiciones** simultáneas:

1. Permiso `module.consulta.access` (lo tiene el rol `medico`, no `administrador`).
2. Usuario vinculado a un médico activo en la tabla `doctors` (middleware `attend-patients`).

El propietario (dueño de la clínica) accede a Consulta porque tiene **ambos roles** (`administrador` + `medico`) y está vinculado a su propio registro de médico. Un administrador puro (sin doctor activo vinculado) no puede entrar a `/consulta`. Ver ADR-015.

## Permisos

Formato: `module.<clave>.access`

Cada permiso se verifica:

1. En el controlador: `middleware('attend-patients')` para `/consulta`; `middleware('permission:module.<clave>.access')` para los demás
2. En la navegación: filtrado por la lista de permisos del usuario

## Página de inicio por rol

Tras iniciar sesión, cada usuario aterriza en el primer módulo al que tiene acceso, siguiendo el orden de la columna "Orden impl.". Lo calcula `App\Actions\ResolveHomeRoute`. Un usuario sin módulos aterriza en `/settings/profile`.

Al agregar un módulo nuevo, añádelo en `resources/js/lib/navigation.ts` y también en la lista de `ResolveHomeRoute`.

## Dependencias pendientes

| Funcionalidad                        | Dependencia                                           | Estado              |
| ------------------------------------ | ----------------------------------------------------- | ------------------- |
| Consulta → _Ordenar estudios_        | Habilitar al terminar Laboratorio (e Imágenes)        | Botón deshabilitado |
| Consulta → _Pasar a emergencia_      | Habilitar con Emergencia                              | Botón deshabilitado |
| Consulta → _Ingresar_                | Habilitar con Internamiento                           | Botón deshabilitado |
| Facturación → leer cuentas           | Depende de `accounts` con `status=pendiente_facturar` | Tabla disponible    |
| Honorarios → liquidación por período | Depende de `account_charges.doctor_fee` acumulado     | Dato disponible     |

## Usuarios y contraseñas

Solo el administrador gestiona los accesos y las contraseñas. Los usuarios no tienen ajustes de seguridad propios.

- **Toda contraseña que asigna el administrador es temporal.** Al crear un usuario y al cambiarle la contraseña desde `/admin/usuarios`, se guarda `must_change_password = true`.
- Con `must_change_password = true`, el middleware `ensure.password.changed` lleva al usuario a `/password/change-required` en su siguiente petición, aunque ya tenga la sesión abierta. No puede usar ningún módulo ni `/settings` hasta cambiarla.
- El usuario solo cambia su contraseña en ese momento. `/password/change-required` redirige a su página de inicio si no tiene una contraseña temporal.
- Así, el administrador controla quién entra pero no conoce la contraseña definitiva de nadie.
- Los usuarios no pueden borrar su propia cuenta. Para dar de baja a alguien, el administrador desactiva su usuario (`is_active = false`), y su sesión se cierra en la siguiente petición.
