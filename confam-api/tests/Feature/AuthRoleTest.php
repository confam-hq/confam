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

test('vendor dashboard includes owned deals and legacy deals matching the vendor email', function () {
    $vendor = \App\Models\User::create([
        'name' => 'Confam Vendor',
        'email' => 'vendor@example.com',
        'phone' => '08012345678',
        'password' => 'password123',
    ]);

    $createDeal = function (array $attributes) {
        return \App\Models\Deal::create(array_merge([
            'short_code' => 'CF-' . \Illuminate\Support\Str::upper(\Illuminate\Support\Str::random(5)),
            'vendor_name' => 'Confam Vendor',
            'vendor_phone' => '08012345678',
            'vendor_bank_code' => '044',
            'vendor_account_number' => '0123456789',
            'vendor_account_name' => 'Confam Vendor',
            'vendor_manage_token' => \Illuminate\Support\Str::random(48),
            'buyer_phone' => '08098765432',
            'buyer_email' => 'buyer@example.com',
            'item_title' => 'Test item',
            'item_amount_kobo' => 100000,
            'platform_fee_kobo' => 1500,
            'total_payable_kobo' => 101500,
            'delivery_mode' => 'INTERSTATE_WAYBILL',
            'status' => 'AWAITING_PAYMENT',
        ], $attributes));
    };

    $createDeal([
        'short_code' => 'CF-OWNED',
        'vendor_user_id' => $vendor->id,
    ]);
    $createDeal([
        'short_code' => 'CF-LEGACY',
        'vendor_email' => 'Vendor@Example.com',
    ]);
    $createDeal([
        'short_code' => 'CF-OTHER',
        'vendor_email' => 'other@example.com',
    ]);

    $this->actingAs($vendor, 'sanctum')
        ->getJson('/api/v1/vendor/deals')
        ->assertOk()
        ->assertJsonCount(2, 'deals')
        ->assertJsonFragment(['short_code' => 'CF-OWNED'])
        ->assertJsonFragment(['short_code' => 'CF-LEGACY'])
        ->assertJsonMissing(['short_code' => 'CF-OTHER']);
});
