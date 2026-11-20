<?php

use App\Models\Deal;
use App\Models\User;
use App\Services\Escrow\PaystackService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

function settlementUser(string $name, string $email, string $phone, string $role): User
{
    return User::create([
        'name' => $name,
        'email' => $email,
        'phone' => $phone,
        'password' => 'password123',
        'role' => $role,
    ]);
}

function settlementDeal(User $vendor, User $buyer, string $code, string $status): Deal
{
    return Deal::create([
        'short_code' => $code,
        'vendor_user_id' => $vendor->id,
        'vendor_name' => $vendor->name,
        'vendor_phone' => $vendor->phone,
        'vendor_email' => $vendor->email,
        'vendor_bank_code' => '044',
        'vendor_account_number' => '0123456789',
        'vendor_account_name' => $vendor->name,
        'vendor_manage_token' => Str::random(48),
        'buyer_name' => $buyer->name,
        'buyer_phone' => $buyer->phone,
        'buyer_email' => $buyer->email,
        'item_title' => 'Test item',
        'item_amount_kobo' => 100000,
        'waybill_fee_kobo' => 20000,
        'platform_fee_kobo' => 6000,
        'platform_fee_payer' => 'VENDOR',
        'total_payable_kobo' => 120000,
        'delivery_mode' => 'INTERSTATE_WAYBILL',
        'status' => $status,
        'paystack_reference' => 'CFM_' . $code,
    ]);
}

test('only the buyer can confirm delivery and the vendor receives the net payout', function () {
    $vendor = settlementUser('Confam Vendor', 'vendor@example.com', '08012345678', 'vendor');
    $buyer = settlementUser('Confam Buyer', 'buyer@example.com', '08098765432', 'buyer');
    $deal = settlementDeal($vendor, $buyer, 'CF-CONFIRM', 'DISPATCHED_IN_TRANSIT');

    $this->mock(PaystackService::class)
        ->shouldReceive('disburseVendorPayout')
        ->once()
        ->withArgs(fn (Deal $payoutDeal, int $amount) => $payoutDeal->is($deal) && $amount === 114000)
        ->andReturn('TRF_TEST_CONFIRM');

    $this->actingAs($buyer, 'sanctum')
        ->postJson("/api/v1/deals/{$deal->short_code}/confirm-delivery")
        ->assertOk()
        ->assertJsonPath('deal.status', 'COMPLETED_RELEASED');

    $this->assertDatabaseHas('escrow_ledgers', [
        'idempotency_key' => 'SETTLED_' . $deal->short_code,
        'amount_kobo' => 114000,
    ]);
    $this->assertDatabaseHas('escrow_ledgers', [
        'idempotency_key' => 'PLATFORM_FEE_' . $deal->short_code,
        'amount_kobo' => 6000,
    ]);

    $this->actingAs($vendor, 'sanctum')
        ->postJson("/api/v1/deals/{$deal->short_code}/confirm-delivery")
        ->assertForbidden();
});

test('legacy buyer-paid fee deals keep their original vendor payout', function () {
    $vendor = settlementUser('Confam Vendor', 'vendor@example.com', '08012345678', 'vendor');
    $buyer = settlementUser('Confam Buyer', 'buyer@example.com', '08098765432', 'buyer');
    $deal = settlementDeal($vendor, $buyer, 'CF-LEGACY-FEE', 'DISPATCHED_IN_TRANSIT');
    $deal->update([
        'platform_fee_payer' => 'BUYER',
        'total_payable_kobo' => 126000,
    ]);

    $this->mock(PaystackService::class)
        ->shouldReceive('disburseVendorPayout')
        ->once()
        ->withArgs(fn (Deal $payoutDeal, int $amount) => $payoutDeal->is($deal) && $amount === 120000)
        ->andReturn('TRF_TEST_LEGACY');

    $this->actingAs($buyer, 'sanctum')
        ->postJson("/api/v1/deals/{$deal->short_code}/confirm-delivery")
        ->assertOk();
});

test('vendor can flag buyer non-response and an admin can release a frozen deal', function () {
    $vendor = settlementUser('Confam Vendor', 'vendor@example.com', '08012345678', 'vendor');
    $buyer = settlementUser('Confam Buyer', 'buyer@example.com', '08098765432', 'buyer');
    $admin = settlementUser('Confam Admin', 'admin@example.com', '08011112222', 'admin');
    $deal = settlementDeal($vendor, $buyer, 'CF-NOREPLY', 'DISPATCHED_IN_TRANSIT');

    $this->mock(PaystackService::class)
        ->shouldReceive('disburseVendorPayout')
        ->once()
        ->andReturn('TRF_TEST_ADMIN');

    $this->actingAs($vendor, 'sanctum')
        ->postJson("/api/v1/deals/{$deal->short_code}/dispute", [
            'reason' => 'Buyer has not confirmed receipt after delivery.',
            'actor_role' => 'BUYER',
        ])
        ->assertOk()
        ->assertJsonPath('deal.status', 'DISPUTE_FROZEN');

    $this->assertDatabaseHas('escrow_ledgers', [
        'event_type' => 'DISPUTE_HOLD',
        'actor_role' => 'VENDOR',
    ]);

    $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/admin/disputes')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.short_code', $deal->short_code);

    $this->actingAs($admin, 'sanctum')
        ->postJson("/api/v1/admin/disputes/{$deal->short_code}/resolve", ['outcome' => 'release'])
        ->assertOk()
        ->assertJsonPath('deal.status', 'COMPLETED_RELEASED');
});

test('admin dispute refund is recorded only after the payment provider accepts it', function () {
    $vendor = settlementUser('Confam Vendor', 'vendor@example.com', '08012345678', 'vendor');
    $buyer = settlementUser('Confam Buyer', 'buyer@example.com', '08098765432', 'buyer');
    $admin = settlementUser('Confam Admin', 'admin@example.com', '08011112222', 'admin');
    $deal = settlementDeal($vendor, $buyer, 'CF-REFUND', 'DISPATCHED_IN_TRANSIT');

    $this->mock(PaystackService::class)
        ->shouldReceive('refundBuyer')
        ->once()
        ->andReturn('REF_TEST_BUYER');

    $this->actingAs($buyer, 'sanctum')
        ->postJson("/api/v1/deals/{$deal->short_code}/dispute", [
            'reason' => 'The received goods are damaged.',
        ])
        ->assertOk();

    $this->actingAs($admin, 'sanctum')
        ->postJson("/api/v1/admin/disputes/{$deal->short_code}/resolve", ['outcome' => 'refund'])
        ->assertOk()
        ->assertJsonPath('deal.status', 'REFUNDED');

    $this->assertDatabaseHas('escrow_ledgers', [
        'idempotency_key' => 'REFUND_' . $deal->short_code,
        'amount_kobo' => 120000,
    ]);
});
