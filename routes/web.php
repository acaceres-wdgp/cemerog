<?php

use App\Actions\ResolveHomeRoute;
use App\Http\Controllers\Auth\ChangePasswordController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Modules\AdminController;
use App\Http\Controllers\Modules\AlmacenController;
use App\Http\Controllers\Modules\AnalisisController;
use App\Http\Controllers\Modules\CajaController;
use App\Http\Controllers\Modules\CashShiftController;
use App\Http\Controllers\Modules\CirugiaController;
use App\Http\Controllers\Modules\CitasController;
use App\Http\Controllers\Modules\ConsultaController;
use App\Http\Controllers\Modules\ConsultaTransferController;
use App\Http\Controllers\Modules\CuadreController;
use App\Http\Controllers\Modules\CxcController;
use App\Http\Controllers\Modules\DoctoresController;
use App\Http\Controllers\Modules\EmergenciaController;
use App\Http\Controllers\Modules\EmergencyCareController;
use App\Http\Controllers\Modules\EmergencyConfigController;
use App\Http\Controllers\Modules\EntradaController;
use App\Http\Controllers\Modules\HabsController;
use App\Http\Controllers\Modules\ImgcatController;
use App\Http\Controllers\Modules\ImgController;
use App\Http\Controllers\Modules\ImpresosController;
use App\Http\Controllers\Modules\InicioController;
use App\Http\Controllers\Modules\InternamientoController;
use App\Http\Controllers\Modules\InvoiceController;
use App\Http\Controllers\Modules\LabController;
use App\Http\Controllers\Modules\LabOrderController;
use App\Http\Controllers\Modules\PacientesController;
use App\Http\Controllers\Modules\PaymentController;
use App\Http\Controllers\Modules\PreciosController;
use App\Http\Controllers\Modules\PrescriptionController;
use App\Http\Controllers\Modules\RegistroController;
use App\Http\Controllers\Modules\SupplierController;
use App\Http\Controllers\Modules\TableroController;
use App\Http\Controllers\Modules\TemaController;
use App\Http\Controllers\Modules\TurnosController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Root redirect
Route::get('/', fn (Request $request, ResolveHomeRoute $resolveHomeRoute) => $request->user()
    ? redirect($resolveHomeRoute->handle($request->user()))
    : redirect()->route('login'));

// Auth routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store'])->name('login.store');
});

Route::middleware('auth')->post('/logout', [LoginController::class, 'destroy'])->name('logout');

// Password change required
Route::middleware('auth')->group(function () {
    Route::get('/password/change-required', [ChangePasswordController::class, 'create'])->name('password.change-required');
    Route::post('/password/change-required', [ChangePasswordController::class, 'store'])->name('password.change-required.store');
});

// App modules – all require auth + ensure password changed
Route::middleware(['auth', 'ensure.password.changed'])->group(function () {

    // General
    Route::get('/inicio', [InicioController::class, 'index'])
        ->middleware('permission:module.inicio.access')
        ->name('inicio');

    // Recepcion
    Route::prefix('/tablero')->middleware('permission:module.tablero.access')->group(function () {
        Route::get('/', [TableroController::class, 'index'])->name('tablero');
        Route::post('/turnos', [TurnosController::class, 'store'])->name('turnos.store');
        Route::patch('/turnos/{turn}/status', [TurnosController::class, 'updateStatus'])->name('turnos.status');
        Route::patch('/turnos/{turn}/reorder', [TurnosController::class, 'reorder'])->name('turnos.reorder');
    });

    // Doctor queue – "Llamar siguiente" (sidebar card)
    Route::post('/turnos/llamar-siguiente', [TurnosController::class, 'callNext'])->name('turnos.call-next');

    // Pacientes – listing and detail panel
    Route::prefix('/pacientes')->middleware('permission:module.pacientes.access')->group(function () {
        Route::get('/', [PacientesController::class, 'index'])->name('pacientes');
        Route::get('/buscar', [PacientesController::class, 'search'])->name('pacientes.buscar');
        Route::get('/{patient}', [PacientesController::class, 'show'])->whereNumber('patient')->name('pacientes.show');
    });

    // Registro – unified search + register + turn creation
    Route::prefix('/registro')->middleware('permission:module.registro.access')->group(function () {
        Route::get('/', [RegistroController::class, 'create'])->name('registro');
        Route::post('/', [RegistroController::class, 'store'])->name('registro.store');

        // Register patient without creating a turn
        Route::post('/pacientes', [RegistroController::class, 'storePatient'])->name('registro.pacientes.store');

        // Patient search endpoint (shared with /citas)
        Route::get('/pacientes/buscar', [PacientesController::class, 'search'])->name('registro.pacientes.buscar');

        // Exact-match existence check by document hash
        Route::get('/pacientes/existe', [PacientesController::class, 'exists'])->name('registro.pacientes.exists');

        // Patient edit – accessible from Pacientes sheet
        Route::get('/pacientes/{patient}/editar', [RegistroController::class, 'edit'])->name('registro.pacientes.edit');
        Route::put('/pacientes/{patient}', [RegistroController::class, 'update'])->name('registro.pacientes.update');
    });

    Route::prefix('/citas')->middleware('permission:module.citas.access')->group(function () {
        Route::get('/', [CitasController::class, 'index'])->name('citas');
        Route::get('/pacientes/buscar', [PacientesController::class, 'search'])->name('citas.pacientes.buscar');
        Route::post('/', [CitasController::class, 'store'])->name('citas.store');
        Route::put('/{appointment}', [CitasController::class, 'update'])->name('citas.update');
        Route::delete('/{appointment}', [CitasController::class, 'cancel'])->name('citas.cancel');
    });

    // Atencion clinica – requires module.consulta.access AND an active linked doctor
    Route::prefix('/consulta')->middleware('attend-patients')->group(function () {
        Route::get('/', [ConsultaController::class, 'index'])->name('consulta');
        Route::post('/', [ConsultaController::class, 'store'])->name('consulta.store');
        Route::post('/turnos/{turn}/alta', [ConsultaController::class, 'discharge'])->name('consulta.discharge');
        Route::post('/turnos/{turn}/laboratorio', [LabOrderController::class, 'storeFromTurn'])->name('consulta.lab.store');
        Route::post('/turnos/{turn}/emergencia', [ConsultaTransferController::class, 'toEmergency'])->name('consulta.emergencia');
        Route::patch('/antecedentes/{patient}', [ConsultaController::class, 'updateAntecedents'])->name('consulta.antecedentes');
        // Prescriptions
        Route::post('/turnos/{turn}/receta', [PrescriptionController::class, 'store'])->name('consulta.receta.store');
        Route::put('/turnos/{turn}/receta', [PrescriptionController::class, 'update'])->name('consulta.receta.update');
        Route::get('/recetas/{prescription}/imprimir', [PrescriptionController::class, 'print'])->name('consulta.receta.print');
    });

    Route::prefix('/emergencia')->middleware('permission:module.emergencia.access')->group(function () {
        Route::get('/', [EmergenciaController::class, 'index'])->name('emergencia');
        Route::get('/ingreso', [EmergenciaController::class, 'create'])->name('emergencia.ingreso');
        Route::post('/ingreso', [EmergenciaController::class, 'store'])->name('emergencia.ingreso.store');
        Route::get('/pacientes/buscar', [EmergenciaController::class, 'searchPatients'])->name('emergencia.pacientes.buscar');
        Route::get('/{emergency}', [EmergenciaController::class, 'show'])->whereNumber('emergency')->name('emergencia.show');
        Route::post('/{emergency}/signos-vitales', [EmergencyCareController::class, 'storeVitals'])->name('emergencia.vitals.store');
        Route::post('/{emergency}/aplicaciones', [EmergencyCareController::class, 'storeApplication'])->name('emergencia.applications.store');
        Route::post('/{emergency}/alta', [EmergencyCareController::class, 'discharge'])->name('emergencia.discharge');
        Route::post('/{emergency}/laboratorio', [LabOrderController::class, 'storeFromEmergency'])->name('emergencia.lab.store');
        Route::patch('/{emergency}/cubiculo', [EmergencyCareController::class, 'moveCubicle'])->name('emergencia.cubicle');
    });

    Route::get('/internamiento', [InternamientoController::class, 'index'])
        ->middleware('permission:module.internamiento.access')
        ->name('internamiento');

    Route::get('/cirugia', [CirugiaController::class, 'index'])
        ->middleware('permission:module.cirugia.access')
        ->name('cirugia');

    // Servicios
    Route::prefix('/laboratorio')->middleware('permission:module.lab.access')->group(function () {
        Route::get('/', [LabController::class, 'index'])->name('lab');
        Route::get('/ordenes/{order}', [LabController::class, 'show'])->name('lab.orders.show');
        Route::get('/ordenes/{order}/imprimir', [LabController::class, 'print'])->name('lab.orders.print');
        Route::post('/ordenes/{order}/muestra', [LabController::class, 'sample'])->name('lab.orders.sample');
        Route::post('/ordenes/{order}/resultados', [LabController::class, 'saveResults'])->name('lab.orders.results');
        Route::post('/ordenes/{order}/validar', [LabController::class, 'validateResults'])->name('lab.orders.validate');
        Route::post('/ordenes/{order}/entregar', [LabController::class, 'deliver'])->name('lab.orders.deliver');
    });

    Route::get('/imagenes', [ImgController::class, 'index'])
        ->middleware('permission:module.img.access')
        ->name('img');

    Route::get('/impresos', [ImpresosController::class, 'index'])
        ->middleware('permission:module.impresos.access')
        ->name('impresos');

    // Caja
    Route::get('/facturacion', [CajaController::class, 'index'])
        ->middleware('permission:module.caja.access')
        ->name('caja');
    Route::prefix('/facturacion')->middleware('permission:module.caja.access')->group(function () {
        Route::post('/cuentas/{account}/facturar', [InvoiceController::class, 'store'])->name('caja.invoices.store');
        Route::post('/facturas/{invoice}/anular', [InvoiceController::class, 'void'])->name('caja.invoices.void');
        Route::get('/facturas/{invoice}/imprimir', [InvoiceController::class, 'print'])->name('caja.invoices.print');
        Route::post('/facturas/{invoice}/pagos', [PaymentController::class, 'store'])->name('caja.payments.store');
        Route::post('/recibos/{receipt}/anular', [PaymentController::class, 'void'])->name('caja.receipts.void');
        Route::get('/recibos/{receipt}/imprimir', [PaymentController::class, 'print'])->name('caja.receipts.print');
    });

    Route::get('/cuentas-por-cobrar', [CxcController::class, 'index'])
        ->middleware('permission:module.cxc.access')
        ->name('cxc');

    Route::get('/cuadre-de-caja', [CuadreController::class, 'index'])
        ->middleware('permission:module.cuadre.access')
        ->name('cuadre');

    // Cash register shift: open and withdraw from Caja, close from Cuadre
    Route::post('/caja/turno', [CashShiftController::class, 'open'])
        ->middleware('permission:module.caja.access')
        ->name('caja.turno.open');
    Route::post('/caja/turno/retiros', [CashShiftController::class, 'withdraw'])
        ->middleware('permission:module.caja.access')
        ->name('caja.turno.withdraw');
    Route::post('/cuadre-de-caja/cerrar', [CashShiftController::class, 'close'])
        ->middleware('permission:module.cuadre.access')
        ->name('cuadre.close');
    Route::get('/cuadre-de-caja/turnos/{shift}/reporte', [CuadreController::class, 'report'])
        ->middleware('permission:module.cuadre.access')
        ->name('cuadre.report');

    // Laboratorio: cancel an order (Consulta, Emergencia or Laboratorio)
    Route::post('/laboratorio/ordenes/{order}/cancelar', [LabOrderController::class, 'cancel'])->name('lab.orders.cancel');

    // Inventario
    Route::prefix('/almacen')->middleware('permission:module.almacen.access')->group(function () {
        Route::get('/', [AlmacenController::class, 'index'])->name('almacen');
        Route::post('/articulos', [AlmacenController::class, 'store'])->name('almacen.items.store');
        Route::put('/articulos/{item}', [AlmacenController::class, 'update'])->name('almacen.items.update');
        Route::post('/articulos/{item}/ajustes', [AlmacenController::class, 'adjust'])->name('almacen.items.adjust');
        Route::get('/proveedores', [SupplierController::class, 'index'])->name('almacen.suppliers');
        Route::post('/proveedores', [SupplierController::class, 'store'])->name('almacen.suppliers.store');
        Route::put('/proveedores/{supplier}', [SupplierController::class, 'update'])->name('almacen.suppliers.update');
    });

    Route::prefix('/entrada-mercancia')->middleware('permission:module.entrada.access')->group(function () {
        Route::get('/', [EntradaController::class, 'index'])->name('entrada');
        Route::post('/', [EntradaController::class, 'store'])->name('entrada.store');
    });

    // Administracion
    Route::prefix('/admin/emergencia')->middleware('permission:module.admin.access')->group(function () {
        Route::get('/', [EmergencyConfigController::class, 'index'])->name('admin.emergencia');
        Route::put('/cargo', [EmergencyConfigController::class, 'updateFee'])->name('admin.emergencia.fee');
        Route::post('/cubiculos', [EmergencyConfigController::class, 'storeCubicle'])->name('admin.emergencia.cubicles.store');
        Route::put('/cubiculos/{cubicle}', [EmergencyConfigController::class, 'updateCubicle'])->name('admin.emergencia.cubicles.update');
    });

    Route::prefix('/admin/usuarios')->middleware('permission:module.admin.access')->group(function () {
        Route::get('/', [AdminController::class, 'index'])->name('admin');
        Route::post('/', [AdminController::class, 'store'])->name('admin.users.store');
        Route::put('/{user}', [AdminController::class, 'update'])->name('admin.users.update');
        Route::patch('/{user}/toggle', [AdminController::class, 'toggleActive'])->name('admin.users.toggle');
        Route::patch('/{user}/password', [AdminController::class, 'changePassword'])->name('admin.users.password');
    });

    Route::prefix('/admin/doctores')->middleware('permission:module.doctores.access')->group(function () {
        Route::get('/', [DoctoresController::class, 'index'])->name('doctores');
        Route::post('/especialidades', [DoctoresController::class, 'storeSpecialty'])->name('doctores.specialties.store');
        Route::put('/especialidades/{specialty}', [DoctoresController::class, 'updateSpecialty'])->name('doctores.specialties.update');
        Route::post('/', [DoctoresController::class, 'storeDoctor'])->name('doctores.store');
        Route::put('/{doctor}', [DoctoresController::class, 'updateDoctor'])->name('doctores.update');
        Route::patch('/{doctor}/toggle', [DoctoresController::class, 'toggleDoctor'])->name('doctores.toggle');
        Route::post('/{doctor}/reset-password', [DoctoresController::class, 'resetDoctorPassword'])->name('doctores.reset-password');
    });

    Route::prefix('/admin/analisis')->middleware('permission:module.analisis.access')->group(function () {
        Route::get('/', [AnalisisController::class, 'index'])->name('analisis');
        Route::post('/', [AnalisisController::class, 'store'])->name('analisis.store');
        Route::put('/{test}', [AnalisisController::class, 'update'])->name('analisis.update');
    });

    Route::get('/admin/imagenes-catalogo', [ImgcatController::class, 'index'])
        ->middleware('permission:module.imgcat.access')
        ->name('imgcat');

    Route::get('/admin/precios', [PreciosController::class, 'index'])
        ->middleware('permission:module.precios.access')
        ->name('precios');

    Route::get('/admin/habitaciones', [HabsController::class, 'index'])
        ->middleware('permission:module.habs.access')
        ->name('habs');

    Route::get('/admin/tema', [TemaController::class, 'index'])
        ->middleware('permission:module.tema.access')
        ->name('tema');
});

// Dev-only component gallery
if (app()->environment('local')) {
    Route::inertia('/dev/components', 'dev/components')->name('dev.components');
}

require __DIR__.'/settings.php';
