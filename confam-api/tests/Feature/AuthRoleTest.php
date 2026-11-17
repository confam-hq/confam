<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('new users receive a vendor role in registration and login responses', function () {
    $credentials = [
        'name' => 'Confam Vendor',
        'email' => 'vendor@example.com',
        'phone' => '08012345678',
        'password' => 'password123',
        'role' => 'admin',
    ];

    $this->postJson('/api/v1/auth/register', $credentials)
        ->assertCreated()
        ->assertJsonPath('user.role', 'vendor');

    $this->assertDatabaseHas('users', [
        'email' => $credentials['email'],
        'role' => 'vendor',
    ]);

    $this->postJson('/api/v1/auth/login', [
        'email' => $credentials['email'],
        'password' => $credentials['password'],
    ])
        ->assertOk()
        ->assertJsonPath('user.role', 'vendor');
});
