<?php

use App\Models\Deal;
use App\Models\WaybillManifest;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('a driver location ping is accepted at the API route used by the web client', function () {
    $deal = Deal::create([
        'short_code' => 'CF-DRIVER-PING',
        'vendor_name' => 'Confam Vendor',
        'vendor_phone' => '08012345678',
        'vendor_bank_code' => '044',
        'vendor_account_number' => '0123456789',
        'vendor_account_name' => 'CONFAM VENDOR',
        'vendor_manage_token' => str_repeat('v', 48),
        'buyer_phone' => '08098765432',
        'buyer_email' => 'buyer@example.com',
        'item_title' => 'Test parcel',
        'item_amount_kobo' => 100000,
        'platform_fee_kobo' => 5000,
        'total_payable_kobo' => 100000,
        'delivery_mode' => 'INTERSTATE_WAYBILL',
        'status' => 'DISPATCHED_IN_TRANSIT',
    ]);

    $manifest = WaybillManifest::create([
        'deal_id' => $deal->id,
        'transport_company' => 'Confam Dispatch',
        'driver_phone' => '08011112222',
        'destination_park' => 'Lagos',
        'driver_ping_token' => 'DRV-QFOXHL1CQYQO6G9H',
    ]);

    $this->postJson("/api/v1/driver/{$manifest->driver_ping_token}/ping", [
        'lat' => 6.5244,
        'lng' => 3.3792,
    ])
        ->assertOk()
        ->assertJsonPath('message', 'Transit location ping confamed! Buyer tracking updated.')
        ->assertJsonStructure(['last_pinged_at']);

    $this->assertDatabaseHas('waybill_manifests', [
        'id' => $manifest->id,
        'last_known_lat' => 6.5244,
        'last_known_lng' => 3.3792,
        'last_location_label' => 'Live GPS Transit Ping Verified',
    ]);
});
