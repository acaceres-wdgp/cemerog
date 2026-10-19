<?php

namespace App\Http\Controllers\Modules;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class ConsultaController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('consulta/index');
    }
}
