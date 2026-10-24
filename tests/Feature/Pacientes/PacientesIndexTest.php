<?php

use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\Turn;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->user->givePermissionTo('module.pacientes.access');
});

// A1 – filters object with defaults when no params
test('GET /pacientes sin parámetros devuelve filters con claves y valores por defecto', function () {
    $this->actingAs($this->user)
        ->get('/pacientes')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('pacientes/index')
            ->where('filters.q', '')
            ->where('filters.filter', 'todos')
            ->where('filters.sort', 'ultima_atencion')
        );
});

// A1b – invalid filter value falls back to default
test('filtro inválido se normaliza al valor por defecto', function () {
    $this->actingAs($this->user)
        ->get('/pacientes?filter=invalid&sort=invalid')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filters.filter', 'todos')
            ->where('filters.sort', 'ultima_atencion')
        );
});

// A2 – pagination 15 per page
test('lista pagina 15 pacientes por página', function () {
    Patient::factory()->count(20)->create();

    $this->actingAs($this->user)
        ->get('/pacientes')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('pacientes/index')
            ->where('patients.per_page', 15)
            ->where('patients.total', 20)
        );
});

// A3 – search by partial name
test('búsqueda por nombre parcial devuelve coincidencias', function () {
    Patient::factory()->create(['first_names' => 'Carla', 'last_names' => 'Torres']);
    Patient::factory()->create(['first_names' => 'Pedro', 'last_names' => 'Gómez']);

    $this->actingAs($this->user)
        ->get('/pacientes?q=Carl')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('patients.total', 1)
        );
});

// A4 – search by two words (AND)
test('búsqueda con dos palabras aplica AND entre palabras', function () {
    Patient::factory()->create(['first_names' => 'María', 'last_names' => 'García']);
    Patient::factory()->create(['first_names' => 'Pedro', 'last_names' => 'García']);

    $q = rawurlencode('María García'); // → Mar%C3%ADa%20Garc%C3%ADa
    $this->actingAs($this->user)
        ->get("/pacientes?q={$q}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('patients.total', 1)
        );
});

// A5 – search by cedula with hyphens
test('búsqueda por cédula con guiones encuentra el paciente', function () {
    Patient::factory()->create(['document_number' => '031-0234567-8']);

    $this->actingAs($this->user)
        ->get('/pacientes?q=031-0234567-8')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('patients.total', 1));
});

// A6 – search by cedula without hyphens (normalization)
test('búsqueda por cédula sin guiones encuentra el mismo paciente', function () {
    Patient::factory()->create(['document_number' => '031-0234567-8']);

    $this->actingAs($this->user)
        ->get('/pacientes?q=03102345678')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('patients.total', 1));
});

// A7 – search by phone with formatting
test('búsqueda por teléfono con formato encuentra el paciente', function () {
    $patient = Patient::factory()->create(['phone' => '809-555-0001']);

    $this->actingAs($this->user)
        ->get('/pacientes?q=8095550001')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('patients.total', 1));
});

// A8 – less than 3 chars returns all (no search applied)
test('búsqueda con menos de 3 caracteres no filtra', function () {
    Patient::factory()->count(5)->create();

    $this->actingAs($this->user)
        ->get('/pacientes?q=ab')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('patients.total', 5));
});

// A9 – filter atendidos_hoy
test('filtro atendidos_hoy devuelve pacientes con turno hoy', function () {
    $specialty = Specialty::factory()->create();
    $doctor = Doctor::factory()->create(['specialty_id' => $specialty->id, 'is_active' => true]);

    $patientToday = Patient::factory()->create();
    $patientOther = Patient::factory()->create();

    Turn::factory()->create([
        'patient_id' => $patientToday->id,
        'doctor_id' => $doctor->id,
        'arrived_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->get('/pacientes?filter=atendidos_hoy')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('patients.total', 1));
});

// A10 – filter con_alergias
test('filtro con_alergias devuelve solo pacientes con alergias', function () {
    Patient::factory()->create(['allergies' => 'Penicilina']);
    Patient::factory()->create(['allergies' => null]);
    Patient::factory()->create(['allergies' => null]);

    $this->actingAs($this->user)
        ->get('/pacientes?filter=con_alergias')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('patients.total', 1));
});

// A11 – filter sin_atenciones
test('filtro sin_atenciones devuelve pacientes sin ningún turno', function () {
    $specialty = Specialty::factory()->create();
    $doctor = Doctor::factory()->create(['specialty_id' => $specialty->id, 'is_active' => true]);

    $withTurn = Patient::factory()->create();
    Patient::factory()->count(2)->create(); // sin turnos

    Turn::factory()->create(['patient_id' => $withTurn->id, 'doctor_id' => $doctor->id]);

    $this->actingAs($this->user)
        ->get('/pacientes?filter=sin_atenciones')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('patients.total', 2));
});

// A12 – sort nombre
test('orden nombre ordena por apellidos asc', function () {
    Patient::factory()->create(['first_names' => 'Ana', 'last_names' => 'Zuniga']);
    Patient::factory()->create(['first_names' => 'Pedro', 'last_names' => 'Avila']);

    $this->actingAs($this->user)
        ->get('/pacientes?sort=nombre')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('patients.data.0.last_names', 'Avila')
        );
});

// A13 – sort registro
test('orden registro ordena por created_at asc', function () {
    $old = Patient::factory()->create(['created_at' => now()->subDays(5)]);
    $new = Patient::factory()->create(['created_at' => now()]);

    $this->actingAs($this->user)
        ->get('/pacientes?sort=registro')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('patients.data.0.id', $old->id)
        );
});

// A15 – detail panel with ?paciente={id}
test('panel lateral con paciente válido devuelve selected', function () {
    $patient = Patient::factory()->create();

    $this->actingAs($this->user)
        ->get("/pacientes?paciente={$patient->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('selected')
            ->where('selected.id', $patient->id)
            ->where('selected.expediente_number', 'P-'.str_pad($patient->id, 5, '0', STR_PAD_LEFT))
        );
});

// A16 – detail panel with invalid id returns null (no 404 — panel just doesn't open)
test('panel lateral con id inexistente devuelve selected nulo', function () {
    $this->actingAs($this->user)
        ->get('/pacientes?paciente=99999')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('selected', null));
});
