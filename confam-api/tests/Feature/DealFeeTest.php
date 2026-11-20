<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('the 5 percent vendor fee is withheld without increasing the buyer total', function () {
    $vendor = User::create([
        'name' => 'Confam Vendor',
        'email' => 'vendor@example.com',
        'phone' => '08012345678',
        'password' => 'password123',
    ]);

    $response = $this->actingAs($vendor, 'sanctum')->postJson('/api/v1/deals', [
        'vendor_name' => $vendor->name,
        'vendor_phone' => $vendor->phone,
        'vendor_email' => $vendor->email,
        'vendor_bank_code' => '044',
        'vendor_bank_name' => 'Test Bank',
        'vendor_account_number' => '0123456789',
        'vendor_account_name' => $vendor->name,
        'buyer_phone' => '08098765432',
        'buyer_email' => 'buyer@example.com',
        'item_title' => 'Test item',
        'item_amount_naira' => 1000.19,
        'waybill_fee_naira' => 200,
        'delivery_mode' => 'INTERSTATE_WAYBILL',
    ]);

    $response->assertCreated()
        ->assertJsonPath('deal.financials.item_amount_kobo', 100019)
        ->assertJsonPath('deal.financials.waybill_fee_kobo', 20000)
        ->assertJsonPath('deal.financials.platform_fee_kobo', 6001)
        ->assertJsonPath('deal.financials.platform_fee_payer', 'vendor')
        ->assertJsonPath('deal.financials.total_payable_kobo', 120019);
});
