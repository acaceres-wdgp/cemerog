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

    preg_match_all('/^\| (\w+) \| [^|]+ \| ([^|]+) \|$/m', $section, $rows, PREG_SET_ORDER);
    $documented = collect($rows)
        ->reject(fn ($row) => $row[1] === 'Rol')
        ->mapWithKeys(fn ($row) => [$row[1] => trim($row[2]) === 'Todos'
            ? Permission::pluck('name')->sort()->values()->all()
            : collect(explode(',', $row[2]))->map(fn ($m) => 'module.'.trim($m).'.access')->sort()->values()->all(),
        ]);

    $seeded = Role::with('permissions')->get()
        ->mapWithKeys(fn ($role) => [$role->name => $role->permissions->pluck('name')->sort()->values()->all()]);

    expect($documented->sortKeys()->all())->toEqual($seeded->sortKeys()->all());
});
