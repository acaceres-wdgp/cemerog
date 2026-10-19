<?php

use App\Http\Controllers\Auth\ChangePasswordController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Modules\AdminController;
use App\Http\Controllers\Modules\AlmacenController;
use App\Http\Controllers\Modules\AnalisisController;
use App\Http\Controllers\Modules\CajaController;
use App\Http\Controllers\Modules\CitasController;
use App\Http\Controllers\Modules\CirugiaController;
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
use App\Http\Controllers\Modules\PreciosController;
use App\Http\Controllers\Modules\RegistroController;
use App\Http\Controllers\Modules\TableroController;
use App\Http\Controllers\Modules\TemaController;
use Illuminate\Support\Facades\Route;

// Root redirect
Route::get('/', fn () => redirect()->route('login'));

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
    Route::get('/tablero', [TableroController::class, 'index'])
        ->middleware('permission:module.tablero.access')
        ->name('tablero');

    Route::get('/registro', [RegistroController::class, 'index'])
        ->middleware('permission:module.registro.access')
        ->name('registro');

    Route::get('/citas', [CitasController::class, 'index'])
        ->middleware('permission:module.citas.access')
        ->name('citas');

    // Atencion clinica
    Route::get('/consulta', [ConsultaController::class, 'index'])
        ->middleware('permission:module.consulta.access')
        ->name('consulta');

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
    Route::get('/admin/usuarios', [AdminController::class, 'index'])
        ->middleware('permission:module.admin.access')
        ->name('admin');

    Route::get('/admin/doctores', [DoctoresController::class, 'index'])
        ->middleware('permission:module.doctores.access')
        ->name('doctores');

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
