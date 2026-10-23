<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Initial administrator
    |--------------------------------------------------------------------------
    |
    | Credentials used by AdminUserSeeder to create the first administrator.
    | The password is temporary: it must be changed on first login.
    |
    */

    'admin' => [
        'username' => env('ADMIN_USERNAME', 'admin'),
        'password' => env('ADMIN_PASSWORD', 'Admin123!'),
    ],

];
