# Módulos – CEMEROG

## Tabla de módulos

| Clave         | Ruta                     | Componente          | Roles con acceso                                         | Estado    | Orden impl. |
| ------------- | ------------------------ | ------------------- | -------------------------------------------------------- | --------- | ----------- |
| inicio        | /inicio                  | inicio/index        | admin, medico, secretaria, caja                          | Esqueleto  | 1           |
| tablero       | /tablero                 | tablero/index       | admin, medico, enfermeria, secretaria, caja              | Terminado  | 2           |
| pacientes     | /pacientes               | pacientes/index     | admin, medico, secretaria                                | Terminado  | 2b          |
| registro      | /registro                | registro/index      | admin, secretaria                                        | Terminado  | 3           |
| citas         | /citas                   | citas/index         | admin, medico, secretaria                                | Esqueleto  | 4           |
| consulta      | /consulta                | consulta/index      | admin, medico                                            | Terminado  | 5           |
| emergencia    | /emergencia              | emergencia/index    | admin, medico, enfermeria                                | Esqueleto | 6           |
| internamiento | /internamiento           | internamiento/index | admin, medico, enfermeria                                | Esqueleto | 7           |
| cirugia       | /cirugia                 | cirugia/index       | admin, medico, enfermeria                                | Esqueleto | 8           |
| lab           | /laboratorio             | lab/index           | admin, medico, bioanalista                               | Esqueleto | 9           |
| img           | /imagenes                | img/index           | admin, medico, imagenes                                  | Esqueleto | 10          |
| impresos      | /impresos                | impresos/index      | admin, medico, enfermeria, secretaria, bioanalista, caja | Esqueleto | 11          |
| caja          | /facturacion             | caja/index          | admin, caja                                              | Esqueleto | 12          |
| cxc           | /cuentas-por-cobrar      | cxc/index           | admin, caja                                              | Esqueleto | 13          |
| cuadre        | /cuadre-de-caja          | cuadre/index        | admin, caja                                              | Esqueleto | 14          |
| almacen       | /almacen                 | almacen/index       | admin, almacen                                           | Esqueleto | 15          |
| entrada       | /entrada-mercancia       | entrada/index       | admin, almacen                                           | Esqueleto | 16          |
| admin         | /admin/usuarios          | admin/index         | admin                                                    | Esqueleto | 17          |
| doctores      | /admin/doctores          | doctores/index      | admin                                                    | Esqueleto | 18          |
| analisis      | /admin/analisis          | analisis/index      | admin                                                    | Esqueleto | 19          |
| imgcat        | /admin/imagenes-catalogo | imgcat/index        | admin                                                    | Esqueleto | 20          |
| precios       | /admin/precios           | precios/index       | admin                                                    | Esqueleto | 21          |
| habs          | /admin/habitaciones      | habs/index          | admin                                                    | Esqueleto | 22          |
| tema          | /admin/tema              | tema/index          | admin                                                    | Esqueleto | 23          |

## Roles

| Rol           | Descripción               | Módulos                                                                                  |
| ------------- | ------------------------- | ---------------------------------------------------------------------------------------- |
| administrador | Acceso total              | Todos                                                                                    |
| medico        | Atención médica completa  | inicio, tablero, pacientes, citas, consulta, emergencia, internamiento, cirugia, lab, img, impresos |
| enfermeria    | Atención clínica de apoyo | tablero, emergencia, internamiento, cirugia, impresos                                               |
| secretaria    | Recepción y agendamiento  | inicio, tablero, pacientes, registro, citas, impresos                                               |
| bioanalista   | Laboratorio               | lab, impresos                                                                            |
| imagenes      | Estudios de imagen        | img                                                                                      |
| caja          | Facturación y cobros      | inicio, tablero, caja, cxc, cuadre, impresos                                             |
| almacen       | Inventario                | almacen, entrada                                                                         |

## Permisos

Formato: `module.<clave>.access`

Cada permiso se verifica:

1. En el controlador: `middleware('permission:module.<clave>.access')`
2. En la navegación: filtrado por la lista de permisos del usuario

## Página de inicio por rol

Tras iniciar sesión, cada usuario aterriza en el primer módulo al que tiene acceso, siguiendo el orden de la columna "Orden impl.". Lo calcula `App\Actions\ResolveHomeRoute`. Un usuario sin módulos aterriza en `/settings/profile`.

Al agregar un módulo nuevo, añádelo en `resources/js/lib/navigation.ts` y también en la lista de `ResolveHomeRoute`.

## Usuarios y contraseñas

Solo el administrador gestiona los accesos y las contraseñas. Los usuarios no tienen ajustes de seguridad propios.

- **Toda contraseña que asigna el administrador es temporal.** Al crear un usuario y al cambiarle la contraseña desde `/admin/usuarios`, se guarda `must_change_password = true`.
- Con `must_change_password = true`, el middleware `ensure.password.changed` lleva al usuario a `/password/change-required` en su siguiente petición, aunque ya tenga la sesión abierta. No puede usar ningún módulo ni `/settings` hasta cambiarla.
- El usuario solo cambia su contraseña en ese momento. `/password/change-required` redirige a su página de inicio si no tiene una contraseña temporal.
- Así, el administrador controla quién entra pero no conoce la contraseña definitiva de nadie.
- Los usuarios no pueden borrar su propia cuenta. Para dar de baja a alguien, el administrador desactiva su usuario (`is_active = false`), y su sesión se cierra en la siguiente petición.
