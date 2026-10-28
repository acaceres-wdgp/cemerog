<?php

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    // Seed all permissions and roles needed
    $modules = [
        'inicio', 'tablero', 'registro', 'citas', 'consulta', 'emergencia',
        'internamiento', 'cirugia', 'lab', 'img', 'impresos',
        'caja', 'cxc', 'cuadre', 'almacen', 'entrada',
        'admin', 'doctores', 'analisis', 'imgcat', 'precios', 'habs', 'tema',
    ];

    foreach ($modules as $module) {
        Permission::firstOrCreate(['name' => "module.{$module}.access", 'guard_name' => 'web']);
    }

    $roleModules = [
        'administrador' => [
            'inicio', 'tablero', 'registro', 'citas', 'consulta', 'emergencia',
            'internamiento', 'cirugia', 'lab', 'img', 'impresos',
            'caja', 'cxc', 'cuadre', 'almacen', 'entrada',
            'admin', 'doctores', 'analisis', 'imgcat', 'precios', 'habs', 'tema',
        ],
        'medico' => ['inicio', 'tablero', 'citas', 'consulta', 'emergencia', 'internamiento', 'cirugia', 'lab', 'img', 'impresos'],
        'secretaria' => ['inicio', 'tablero', 'registro', 'citas', 'impresos'],
    ];

    foreach ($roleModules as $roleName => $rolePerms) {
        $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
        $permissions = collect($rolePerms)->map(fn ($m) => "module.{$m}.access");
        $role->syncPermissions($permissions->toArray());
    }

    $this->admin = User::factory()->create();
    $this->admin->givePermissionTo('module.admin.access');
});

// ─── Index ────────────────────────────────────────────────────────────────────

test('admin can list users and gets correct Inertia props', function () {
    $response = $this->actingAs($this->admin)
        ->get('/admin/usuarios');

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/index')
            ->has('users')
            ->has('roles')
            ->has('permissions')
        );
});

test('non-admin gets 403 on index', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/admin/usuarios')
        ->assertForbidden();
});

test('index returns users with roles and last_activity', function () {
    $otherUser = User::factory()->create(['name' => 'Test User']);
    $otherUser->assignRole('medico');

    $response = $this->actingAs($this->admin)
        ->get('/admin/usuarios');

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('users', fn ($users) => $users
                ->has(0, fn ($user) => $user
                    ->has('id')
                    ->has('name')
                    ->has('username')
                    ->has('email')
                    ->has('is_active')
                    ->has('roles')
                    ->has('permissions')
                    ->has('all_permissions')
                    ->has('last_activity')
                    ->etc()
                )
                ->etc()
            )
        );
});

test('index returns all available roles', function () {
    $response = $this->actingAs($this->admin)
        ->get('/admin/usuarios');

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('roles', fn ($roles) => $roles
                ->has(0, fn ($role) => $role
                    ->has('name')
                    ->has('label')
                    ->has('permissions')
                    ->etc()
                )
                ->etc()
            )
        );
});

test('index returns all available permissions', function () {
    $response = $this->actingAs($this->admin)
        ->get('/admin/usuarios');

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('permissions', fn ($perms) => $perms
                ->has(0, fn ($perm) => $perm
                    ->has('name')
                    ->has('label')
                    ->has('module')
                    ->etc()
                )
                ->etc()
            )
        );
});

// ─── Store ────────────────────────────────────────────────────────────────────

test('admin can create a user', function () {
    $this->actingAs($this->admin)
        ->post('/admin/usuarios', [
            'name' => 'Nuevo Usuario',
            'username' => 'nuevo.usuario',
            'email' => null,
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'roles' => [],
            'permissions' => [],
        ])
        ->assertRedirect(route('admin'))
        ->assertSessionHas('inertia.flash_data.toast.type', 'success')
        ->assertSessionHas('inertia.flash_data.toast.message', 'Usuario creado exitosamente.');

    $this->assertDatabaseHas('users', [
        'username' => 'nuevo.usuario',
        'name' => 'Nuevo Usuario',
    ]);
});

test('non-admin gets 403 on store', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/admin/usuarios', [
            'name' => 'Test',
            'username' => 'test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
        ->assertForbidden();
});

test('store assigns roles to user', function () {
    $this->actingAs($this->admin)
        ->post('/admin/usuarios', [
            'name' => 'Doctor Nuevo',
            'username' => 'doctor.nuevo',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'roles' => ['medico'],
            'permissions' => [],
        ])
        ->assertRedirect(route('admin'));

    $user = User::where('username', 'doctor.nuevo')->first();
    expect($user->hasRole('medico'))->toBeTrue();
});

test('store assigns direct permissions to user', function () {
    $this->actingAs($this->admin)
        ->post('/admin/usuarios', [
            'name' => 'Usuario Perm',
            'username' => 'usuario.perm',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'roles' => [],
            'permissions' => ['module.registro.access'],
        ])
        ->assertRedirect(route('admin'));

    $user = User::where('username', 'usuario.perm')->first();
    expect($user->hasDirectPermission('module.registro.access'))->toBeTrue();
});

test('store validates required fields', function () {
    $this->actingAs($this->admin)
        ->post('/admin/usuarios', [])
        ->assertSessionHasErrors(['name', 'username', 'password']);
});

test('store rejects duplicate username', function () {
    User::factory()->create(['username' => 'existing.user']);

    $this->actingAs($this->admin)
        ->post('/admin/usuarios', [
            'name' => 'Another User',
            'username' => 'existing.user',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
        ->assertSessionHasErrors(['username']);
});

test('store rejects password shorter than 8 characters', function () {
    $this->actingAs($this->admin)
        ->post('/admin/usuarios', [
            'name' => 'Test User',
            'username' => 'test.user',
            'password' => 'short',
            'password_confirmation' => 'short',
        ])
        ->assertSessionHasErrors(['password']);
});

test('store rejects password mismatch', function () {
    $this->actingAs($this->admin)
        ->post('/admin/usuarios', [
            'name' => 'Test User',
            'username' => 'test.user2',
            'password' => 'password123',
            'password_confirmation' => 'different123',
        ])
        ->assertSessionHasErrors(['password']);
});

test('store rejects invalid username characters', function () {
    $this->actingAs($this->admin)
        ->post('/admin/usuarios', [
            'name' => 'Test User',
            'username' => 'invalid username!',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
        ->assertSessionHasErrors(['username']);
});

// ─── Update ───────────────────────────────────────────────────────────────────

test('admin can update a user', function () {
    $user = User::factory()->create(['name' => 'Original Name']);

    $this->actingAs($this->admin)
        ->put("/admin/usuarios/{$user->id}", [
            'name' => 'Updated Name',
            'username' => $user->username,
            'email' => null,
            'is_active' => true,
            'roles' => [],
            'permissions' => [],
        ])
        ->assertRedirect(route('admin'))
        ->assertSessionHas('inertia.flash_data.toast.type', 'success')
        ->assertSessionHas('inertia.flash_data.toast.message', 'Usuario actualizado exitosamente.');

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'name' => 'Updated Name',
    ]);
});

test('non-admin gets 403 on update', function () {
    $noAdmin = User::factory()->create();
    $target = User::factory()->create();

    $this->actingAs($noAdmin)
        ->put("/admin/usuarios/{$target->id}", [
            'name' => 'Changed',
            'username' => $target->username,
        ])
        ->assertForbidden();
});

test('update allows keeping same username', function () {
    $user = User::factory()->create(['username' => 'same.username']);

    $this->actingAs($this->admin)
        ->put("/admin/usuarios/{$user->id}", [
            'name' => 'Same User',
            'username' => 'same.username',
            'email' => null,
            'is_active' => true,
            'roles' => [],
            'permissions' => [],
        ])
        ->assertRedirect(route('admin'));

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'username' => 'same.username',
    ]);
});

test('update rejects duplicate username of another user', function () {
    User::factory()->create(['username' => 'taken.name']);
    $user = User::factory()->create(['username' => 'original.name']);

    $this->actingAs($this->admin)
        ->put("/admin/usuarios/{$user->id}", [
            'name' => $user->name,
            'username' => 'taken.name',
            'is_active' => true,
            'roles' => [],
            'permissions' => [],
        ])
        ->assertSessionHasErrors(['username']);
});

test('update syncs roles', function () {
    $user = User::factory()->create();
    $user->assignRole('medico');

    $this->actingAs($this->admin)
        ->put("/admin/usuarios/{$user->id}", [
            'name' => $user->name,
            'username' => $user->username,
            'is_active' => true,
            'roles' => ['secretaria'],
            'permissions' => [],
        ])
        ->assertRedirect(route('admin'));

    $user->refresh();
    expect($user->hasRole('medico'))->toBeFalse();
    expect($user->hasRole('secretaria'))->toBeTrue();
});

test('update returns 404 for non-existent user', function () {
    $this->actingAs($this->admin)
        ->put('/admin/usuarios/9999', [
            'name' => 'Test',
            'username' => 'test',
            'is_active' => true,
            'roles' => [],
            'permissions' => [],
        ])
        ->assertNotFound();
});

// ─── Toggle Active ─────────────────────────────────────────────────────────────

test('admin can toggle user active status', function () {
    $user = User::factory()->create(['is_active' => true]);

    $this->actingAs($this->admin)
        ->patch("/admin/usuarios/{$user->id}/toggle")
        ->assertRedirect(route('admin'))
        ->assertSessionHas('inertia.flash_data.toast.type', 'success');

    expect($user->fresh()->is_active)->toBeFalse();
    expect(session('inertia.flash_data.toast.message'))->toBe('Usuario desactivado exitosamente.');
});

test('admin can re-activate an inactive user', function () {
    $user = User::factory()->create(['is_active' => false]);

    $this->actingAs($this->admin)
        ->patch("/admin/usuarios/{$user->id}/toggle")
        ->assertRedirect(route('admin'));

    expect($user->fresh()->is_active)->toBeTrue();
});

test('non-admin gets 403 on toggle', function () {
    $noAdmin = User::factory()->create();
    $target = User::factory()->create();

    $this->actingAs($noAdmin)
        ->patch("/admin/usuarios/{$target->id}/toggle")
        ->assertForbidden();
});

// ─── Change Password ──────────────────────────────────────────────────────────

test('admin can change a user password', function () {
    $user = User::factory()->create();

    $this->actingAs($this->admin)
        ->patch("/admin/usuarios/{$user->id}/password", [
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ])
        ->assertRedirect(route('admin'))
        ->assertSessionHas('inertia.flash_data.toast.type', 'success')
        ->assertSessionHas('inertia.flash_data.toast.message', 'Contraseña actualizada exitosamente.');
});

test('change password sets must_change_password when checkbox is checked', function () {
    $user = User::factory()->create(['must_change_password' => false]);

    $this->actingAs($this->admin)
        ->patch("/admin/usuarios/{$user->id}/password", [
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
            'must_change_password' => true,
        ])
        ->assertRedirect(route('admin'));

    expect($user->fresh()->must_change_password)->toBeTrue();
});

test('change password does not force change when checkbox unchecked', function () {
    $user = User::factory()->create(['must_change_password' => false]);

    $this->actingAs($this->admin)
        ->patch("/admin/usuarios/{$user->id}/password", [
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ])
        ->assertRedirect(route('admin'));

    expect($user->fresh()->must_change_password)->toBeFalse();
});

test('change password rejects passwords shorter than 8 characters', function () {
    $user = User::factory()->create();

    $this->actingAs($this->admin)
        ->patch("/admin/usuarios/{$user->id}/password", [
            'password' => 'short',
            'password_confirmation' => 'short',
        ])
        ->assertSessionHasErrors(['password']);
});

test('change password rejects mismatched passwords', function () {
    $user = User::factory()->create();

    $this->actingAs($this->admin)
        ->patch("/admin/usuarios/{$user->id}/password", [
            'password' => 'newpassword123',
            'password_confirmation' => 'differentpassword',
        ])
        ->assertSessionHasErrors(['password']);
});

test('non-admin gets 403 on change password', function () {
    $noAdmin = User::factory()->create();
    $target = User::factory()->create();

    $this->actingAs($noAdmin)
        ->patch("/admin/usuarios/{$target->id}/password", [
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ])
        ->assertForbidden();
});
