<?php

use App\Actions\Doctors\GenerateDoctorCredentials;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ─── Username generation ──────────────────────────────────────────────────────

test('generates username from first letter of first name + first surname', function () {
    $action = new GenerateDoctorCredentials;

    $result = $action->previewUsername('Franklin Rodríguez Jorge');

    expect($result)->toBe('frodriguez');
});

test('strips Dr. prefix when generating username', function () {
    $action = new GenerateDoctorCredentials;

    expect($action->previewUsername('Dr. Franklin Rodríguez'))->toBe('frodriguez');
});

test('strips Dra. prefix when generating username', function () {
    $action = new GenerateDoctorCredentials;

    expect($action->previewUsername('Dra. Ana García López'))->toBe('agarcia');
});

test('normalizes accents when generating username', function () {
    $action = new GenerateDoctorCredentials;

    // é → e, á → a, etc.
    expect($action->previewUsername('José Martínez'))->toBe('jmartinez');
});

test('normalizes ñ when generating username', function () {
    $action = new GenerateDoctorCredentials;

    expect($action->previewUsername('Ingrid Muñoz'))->toBe('imunoz');
});

test('handles compound first name (uses first word)', function () {
    $action = new GenerateDoctorCredentials;

    expect($action->previewUsername('María Isabel Pérez Torres'))->toBe('mperez');
});

test('lowercases the generated username', function () {
    $action = new GenerateDoctorCredentials;

    expect($action->previewUsername('ANA GARCIA'))->toBe('agarcia');
});

// ─── Username collision resolution ───────────────────────────────────────────

test('appends 2 when base username already exists', function () {
    User::factory()->create(['username' => 'frodriguez']);

    $action = new GenerateDoctorCredentials;
    $result = $action->previewUsername('Franklin Rodríguez');

    expect($result)->toBe('frodriguez2');
});

test('appends 3 when frodriguez and frodriguez2 both exist', function () {
    User::factory()->create(['username' => 'frodriguez']);
    User::factory()->create(['username' => 'frodriguez2']);

    $action = new GenerateDoctorCredentials;
    $result = $action->previewUsername('Franklin Rodríguez');

    expect($result)->toBe('frodriguez3');
});

// ─── Password generation ──────────────────────────────────────────────────────

test('generated password is 10 characters long', function () {
    $action = new GenerateDoctorCredentials;

    $password = $action->generatePassword();

    expect(strlen($password))->toBe(10);
});

test('generated password only contains readable chars (no 0/O/l/1)', function () {
    $action = new GenerateDoctorCredentials;

    for ($i = 0; $i < 20; $i++) {
        $password = $action->generatePassword();
        expect($password)->not->toContain('0')
            ->and($password)->not->toContain('O')
            ->and($password)->not->toContain('l')
            ->and($password)->not->toContain('1');
    }
});

// ─── Full handle: creates user ────────────────────────────────────────────────

test('handle creates a user with role medico and must_change_password', function () {
    $action = new GenerateDoctorCredentials;

    $result = $action->handle('Dr. Franklin Rodríguez');

    expect($result['user']->id)->toBeInt();
    expect($result['user']->username)->toBe('frodriguez');
    expect($result['user']->must_change_password)->toBeTrue();
    expect($result['user']->is_active)->toBeTrue();
    expect($result['user']->hasRole('medico'))->toBeTrue();
    expect($result['plainPassword'])->toHaveLength(10);
});

test('handle returns the plain password (not hashed)', function () {
    $action = new GenerateDoctorCredentials;

    $result = $action->handle('Dra. Ana García');

    // The plain password returned should not match any known hash
    expect($result['plainPassword'])->not->toContain('$2y$');
    expect(strlen($result['plainPassword']))->toBe(10);
});

// ─── Fix 5: Particles in surnames ────────────────────────────────────────────

test('skips particle "de la" and uses first non-particle surname', function () {
    $action = new GenerateDoctorCredentials;

    // «María de la Cruz» → mcruz
    expect($action->previewUsername('María de la Cruz'))->toBe('mcruz');
});

test('skips particle "de los" and uses first non-particle surname', function () {
    $action = new GenerateDoctorCredentials;

    // «Juan de los Santos» → jsantos
    expect($action->previewUsername('Juan de los Santos'))->toBe('jsantos');
});

test('strips hyphens from compound surnames', function () {
    $action = new GenerateDoctorCredentials;

    // «Ana Pérez-Gómez» → aperezgomez
    expect($action->previewUsername('Ana Pérez-Gómez'))->toBe('aperezgomez');
});

test('strips apostrophes from surnames', function () {
    $action = new GenerateDoctorCredentials;

    // «Luis D\'Oleo» → ldoleo
    expect($action->previewUsername("Luis D'Oleo"))->toBe('ldoleo');
});

test('skips particle "del" and uses first non-particle surname', function () {
    $action = new GenerateDoctorCredentials;

    // «Carlos del Orbe» → corbe
    expect($action->previewUsername('Carlos del Orbe'))->toBe('corbe');
});

test('skips particle "y" between names', function () {
    $action = new GenerateDoctorCredentials;

    // «Ana y García López» — unusual but "y" is a particle → agarcia
    expect($action->previewUsername('Ana y García López'))->toBe('agarcia');
});
