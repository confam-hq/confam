<?php

use App\Models\User;
use App\Services\Escrow\PaystackService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('a vendor can update contact and verified payout details', function () {
    $vendor = User::create([
        'name' => 'Old Vendor Name',
        'email' => 'vendor-profile@example.com',
        'phone' => '08012345678',
        'password' => 'password123',
        'role' => 'vendor',
        'bank_code' => '011',
        'bank_name' => 'Old Bank',
        'account_number' => '1111111111',
        'account_name' => 'OLD ACCOUNT NAME',
        'paystack_recipient_code' => 'RCP_OLD',
    ]);

    $this->mock(PaystackService::class)
        ->shouldReceive('resolveAccount')
        ->once()
        ->with('2222222222', '044')
        ->andReturn(['account_name' => 'VERIFIED ACCOUNT NAME']);

    $this->actingAs($vendor, 'sanctum')
        ->patchJson('/api/v1/vendor/profile', [
            'name' => 'Updated Vendor Name',
            'phone' => '08012345678',
            'bank_code' => '044',
            'bank_name' => 'New Bank',
            'account_number' => '2222222222',
        ])
        ->assertOk()
        ->assertJsonPath('user.name', 'Updated Vendor Name')
        ->assertJsonPath('user.account_name', 'VERIFIED ACCOUNT NAME')
        ->assertJsonMissingPath('user.paystack_recipient_code');

    $this->assertDatabaseHas('users', [
        'id' => $vendor->id,
        'phone' => '08012345678',
        'bank_code' => '044',
        'bank_name' => 'New Bank',
        'account_number' => '2222222222',
        'account_name' => 'VERIFIED ACCOUNT NAME',
        'paystack_recipient_code' => null,
    ]);
});

test('a buyer cannot update vendor payout details', function () {
    $buyer = User::create([
        'name' => 'Confam Buyer',
        'email' => 'buyer-profile@example.com',
        'phone' => '08098765432',
        'password' => 'password123',
        'role' => 'buyer',
    ]);

    $this->actingAs($buyer, 'sanctum')
        ->patchJson('/api/v1/vendor/profile', [])
        ->assertForbidden();
});
