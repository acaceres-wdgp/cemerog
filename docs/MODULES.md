# Módulos – CEMEROG

## Tabla de módulos

| Clave | Ruta | Componente | Roles con acceso | Estado | Orden impl. |
|---|---|---|---|---|---|
| inicio | /inicio | inicio/index | admin, medico, secretaria, caja | Esqueleto | 1 |
| tablero | /tablero | tablero/index | admin, medico, enfermeria, secretaria, caja | Esqueleto | 2 |
| registro | /registro | registro/index | admin, secretaria | Esqueleto | 3 |
| citas | /citas | citas/index | admin, medico, secretaria | Esqueleto | 4 |
| consulta | /consulta | consulta/index | admin, medico | Esqueleto | 5 |
| emergencia | /emergencia | emergencia/index | admin, medico, enfermeria | Esqueleto | 6 |
| internamiento | /internamiento | internamiento/index | admin, medico, enfermeria | Esqueleto | 7 |
| cirugia | /cirugia | cirugia/index | admin, medico, enfermeria | Esqueleto | 8 |
| lab | /laboratorio | lab/index | admin, medico, bioanalista | Esqueleto | 9 |
| img | /imagenes | img/index | admin, medico, imagenes | Esqueleto | 10 |
| impresos | /impresos | impresos/index | admin, medico, enfermeria, secretaria, bioanalista, caja | Esqueleto | 11 |
| caja | /facturacion | caja/index | admin, caja | Esqueleto | 12 |
| cxc | /cuentas-por-cobrar | cxc/index | admin, caja | Esqueleto | 13 |
| cuadre | /cuadre-de-caja | cuadre/index | admin, caja | Esqueleto | 14 |
| almacen | /almacen | almacen/index | admin, almacen | Esqueleto | 15 |
| entrada | /entrada-mercancia | entrada/index | admin, almacen | Esqueleto | 16 |
| admin | /admin/usuarios | admin/index | admin | Esqueleto | 17 |
| doctores | /admin/doctores | doctores/index | admin | Esqueleto | 18 |
| analisis | /admin/analisis | analisis/index | admin | Esqueleto | 19 |
| imgcat | /admin/imagenes-catalogo | imgcat/index | admin | Esqueleto | 20 |
| precios | /admin/precios | precios/index | admin | Esqueleto | 21 |
| habs | /admin/habitaciones | habs/index | admin | Esqueleto | 22 |
| tema | /admin/tema | tema/index | admin | Esqueleto | 23 |

## Roles

| Rol | Descripción | Módulos |
|---|---|---|
| administrador | Acceso total | Todos |
| medico | Atención médica completa | inicio, tablero, citas, consulta, emergencia, internamiento, cirugia, lab, img, impresos |
| enfermeria | Atención clínica de apoyo | tablero, emergencia, internamiento, cirugia |
| secretaria | Recepción y agendamiento | inicio, tablero, registro, citas, impresos |
| bioanalista | Laboratorio | lab, impresos |
| imagenes | Estudios de imagen | img |
| caja | Facturación y cobros | inicio, tablero, caja, cxc, cuadre, impresos |
| almacen | Inventario | almacen, entrada |

## Permisos

Formato: `module.<clave>.access`

Cada permiso se verifica:
1. En el controlador: `middleware('permission:module.<clave>.access')`
2. En la navegación: filtrado por la lista de permisos del usuario
