<?php

use App\Models\Deal;
use App\Models\ProofArtifact;
use App\Models\User;
use App\Services\Ai\WaybillOcrService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

test('vendor can scan a receipt and dispatch using previously verified proof', function () {
    Storage::fake('public');

    $vendor = User::create([
        'name' => 'Confam Vendor',
        'email' => 'vendor@example.com',
        'phone' => '08012345678',
        'password' => 'password123',
        'role' => 'vendor',
    ]);
    $deal = Deal::create([
        'short_code' => 'CF-WAYBILL',
        'vendor_user_id' => $vendor->id,
        'vendor_name' => $vendor->name,
        'vendor_phone' => $vendor->phone,
        'vendor_email' => $vendor->email,
        'vendor_bank_code' => '044',
        'vendor_account_number' => '0123456789',
        'vendor_account_name' => $vendor->name,
        'vendor_manage_token' => Str::random(48),
        'buyer_phone' => '08098765432',
        'buyer_email' => 'buyer@example.com',
        'item_title' => 'Test item',
        'item_amount_kobo' => 100000,
        'platform_fee_kobo' => 5000,
        'total_payable_kobo' => 100000,
        'delivery_mode' => 'INTERSTATE_WAYBILL',
        'status' => 'FUNDED_LOCKED',
    ]);
    ProofArtifact::create([
        'deal_id' => $deal->id,
        'video_path' => 'proofs/CF-WAYBILL/proof.webm',
        'video_sha256_hash' => str_repeat('a', 64),
        'captured_at_utc' => now()->utc(),
    ]);

    $this->mock(WaybillOcrService::class)
        ->shouldReceive('parseReceipt')
        ->once()
        ->andReturn([
            'transport_company' => 'Test Transport',
            'waybill_number' => 'WB-123',
            'driver_phone' => '08012345678',
            'vehicle_plate' => 'ABC-123',
            'origin_park' => 'Onitsha',
            'destination_park' => 'Awka',
            'is_valid_receipt' => true,
            'ai_summary_note' => 'Receipt details extracted.',
        ]);

    $otherVendor = User::create([
        'name' => 'Other Vendor',
        'email' => 'other@example.com',
        'phone' => '08087654321',
        'password' => 'password123',
        'role' => 'vendor',
    ]);
    $this->actingAs($otherVendor, 'sanctum')
        ->post('/api/v1/deals/CF-WAYBILL/parse-waybill', [
            'receipt_image' => UploadedFile::fake()->image('receipt.jpg'),
        ])
        ->assertForbidden();

    $this->actingAs($vendor, 'sanctum')
        ->post('/api/v1/deals/CF-WAYBILL/parse-waybill', [
            'receipt_image' => UploadedFile::fake()->image('receipt.jpg'),
        ])
        ->assertOk()
        ->assertJsonPath('ocr.waybill_number', 'WB-123');

    $this->actingAs($vendor, 'sanctum')
        ->post('/api/v1/deals/CF-WAYBILL/dispatch', [
            'receipt_image' => UploadedFile::fake()->image('receipt.jpg'),
            'transport_company' => 'Test Transport',
            'waybill_number' => 'WB-123',
            'driver_phone' => '08012345678',
            'vehicle_plate' => 'ABC-123',
            'origin_park' => 'Onitsha',
            'destination_park' => 'Awka',
            'ai_ocr_summary' => 'Receipt details extracted.',
        ])
        ->assertOk()
        ->assertJsonPath('deal.status', 'DISPATCHED_IN_TRANSIT')
        ->assertJsonPath('deal.waybill_manifest.waybill_number', 'WB-123');

    expect($deal->fresh()->waybillManifest)->not->toBeNull();
});

