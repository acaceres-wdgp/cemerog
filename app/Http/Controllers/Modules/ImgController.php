<?php

namespace App\Http\Controllers\Modules;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class ImgController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('img/index');
    }
}
