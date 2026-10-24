<?php

use App\Actions\ResolveHomeRoute;
use App\Http\Controllers\Auth\ChangePasswordController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Modules\AdminController;
use App\Http\Controllers\Modules\AlmacenController;
use App\Http\Controllers\Modules\AnalisisController;
use App\Http\Controllers\Modules\CajaController;
use App\Http\Controllers\Modules\CirugiaController;
use App\Http\Controllers\Modules\CitasController;
use App\Http\Controllers\Modules\ConsultaController;
use App\Http\Controllers\Modules\CuadreController;
use App\Http\Controllers\Modules\CxcController;
use App\Http\Controllers\Modules\DoctoresController;
use App\Http\Controllers\Modules\EmergenciaController;
use App\Http\Controllers\Modules\EntradaController;
use App\Http\Controllers\Modules\HabsController;
use App\Http\Controllers\Modules\ImgcatController;
use App\Http\Controllers\Modules\ImgController;
use App\Http\Controllers\Modules\ImpresosController;
use App\Http\Controllers\Modules\InicioController;
use App\Http\Controllers\Modules\InternamientoController;
use App\Http\Controllers\Modules\LabController;
use App\Http\Controllers\Modules\PacientesController;
use App\Http\Controllers\Modules\PreciosController;
use App\Http\Controllers\Modules\RegistroController;
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

    // Pacientes – listing and detail panel
    Route::prefix('/pacientes')->middleware('permission:module.pacientes.access')->group(function () {
        Route::get('/', [PacientesController::class, 'index'])->name('pacientes');
        Route::get('/buscar', [PacientesController::class, 'search'])->name('pacientes.buscar');
    });

    // Registro – unified search + register + turn creation
    Route::prefix('/registro')->middleware('permission:module.registro.access')->group(function () {
        Route::get('/', [RegistroController::class, 'create'])->name('registro');
        Route::post('/', [RegistroController::class, 'store'])->name('registro.store');

        // Patient search endpoint (shared with /citas)
        Route::get('/pacientes/buscar', [PacientesController::class, 'search'])->name('registro.pacientes.buscar');

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

    // Atencion clinica
    Route::prefix('/consulta')->middleware('permission:module.consulta.access')->group(function () {
        Route::get('/', [ConsultaController::class, 'index'])->name('consulta');
        Route::post('/', [ConsultaController::class, 'store'])->name('consulta.store');
        Route::patch('/turnos/{turn}/alta', [ConsultaController::class, 'alta'])->name('consulta.alta');
        Route::patch('/antecedentes/{patient}', [ConsultaController::class, 'updateAntecedents'])->name('consulta.antecedentes');
    });

    Route::get('/emergencia', [EmergenciaController::class, 'index'])
        ->middleware('permission:module.emergencia.access')
        ->name('emergencia');

    Route::get('/internamiento', [InternamientoController::class, 'index'])
        ->middleware('permission:module.internamiento.access')
        ->name('internamiento');

    Route::get('/cirugia', [CirugiaController::class, 'index'])
        ->middleware('permission:module.cirugia.access')
        ->name('cirugia');

    // Servicios
    Route::get('/laboratorio', [LabController::class, 'index'])
        ->middleware('permission:module.lab.access')
        ->name('lab');

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

    Route::get('/cuentas-por-cobrar', [CxcController::class, 'index'])
        ->middleware('permission:module.cxc.access')
        ->name('cxc');

    Route::get('/cuadre-de-caja', [CuadreController::class, 'index'])
        ->middleware('permission:module.cuadre.access')
        ->name('cuadre');

    // Inventario
    Route::get('/almacen', [AlmacenController::class, 'index'])
        ->middleware('permission:module.almacen.access')
        ->name('almacen');

    Route::get('/entrada-mercancia', [EntradaController::class, 'index'])
        ->middleware('permission:module.entrada.access')
        ->name('entrada');

    // Administracion
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
    });

    Route::get('/admin/analisis', [AnalisisController::class, 'index'])
        ->middleware('permission:module.analisis.access')
        ->name('analisis');

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
