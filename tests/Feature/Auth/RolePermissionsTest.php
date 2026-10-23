<?php

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

test('enfermeria can open impresos', function () {
    $user = User::factory()->create();
    $user->assignRole('enfermeria');

    $this->actingAs($user)->get('/impresos')->assertOk();
});

test('seeded roles match the roles table in docs/MODULES.md', function () {
    $markdown = file_get_contents(base_path('docs/MODULES.md'));
    $section = str($markdown)->after('## Roles')->before('## ')->toString();

    // Table rows: | rol | descripción | módulos |, whatever the column padding
    $documented = collect(explode("\n", $section))
        ->map(fn ($line) => array_map('trim', explode('|', trim($line))))
        ->filter(fn ($cells) => count($cells) === 5 && preg_match('/^[a-z]+$/', $cells[1]))
        ->mapWithKeys(fn ($cells) => [$cells[1] => $cells[3] === 'Todos'
            ? Permission::pluck('name')->sort()->values()->all()
            : collect(explode(',', $cells[3]))->map(fn ($m) => 'module.'.trim($m).'.access')->sort()->values()->all(),
        ]);

    $seeded = Role::with('permissions')->get()
        ->mapWithKeys(fn ($role) => [$role->name => $role->permissions->pluck('name')->sort()->values()->all()]);

    expect($documented->sortKeys()->all())->toEqual($seeded->sortKeys()->all());
});
