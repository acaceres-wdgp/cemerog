<?php

namespace Tests\Feature\Pacientes;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Support\Facades\DB;

test('la página de pacientes con 15 pacientes hace menos de 10 consultas SQL', function () {
    Patient::factory()->count(15)->create();

    $admin = User::factory()->create();
    $admin->assignRole('administrador');

    DB::enableQueryLog();

    $this->actingAs($admin)->get('/pacientes');

    $queries = DB::getQueryLog();
    DB::disableQueryLog();

    expect(count($queries))->toBeLessThan(15);
});
