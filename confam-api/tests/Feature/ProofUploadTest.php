<?php

use App\Models\Deal;
use App\Models\User;
use App\Services\Ai\ProofAuditService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

test('a vendor can upload verified proof for their funded deal', function () {
    Storage::fake('public');

    $vendor = User::create([
        'name' => 'Confam Vendor',
        'email' => 'vendor@example.com',
        'phone' => '08012345678',
        'password' => 'password123',
    ]);
    $otherVendor = User::create([
        'name' => 'Other Vendor',
        'email' => 'other@example.com',
        'phone' => '08087654321',
        'password' => 'password123',
    ]);
    $deal = Deal::create([
        'short_code' => 'CF-PROOF',
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
        'platform_fee_kobo' => 1500,
        'total_payable_kobo' => 101500,
        'delivery_mode' => 'INTERSTATE_WAYBILL',
        'status' => 'FUNDED_LOCKED',
    ]);

    $this->mock(ProofAuditService::class)
        ->shouldReceive('auditPackingVideo')
        ->once()
        ->andReturn([
            'confidence_score' => 98,
            'item_matched' => true,
            'audit_summary' => 'Test proof verified.',
        ]);

    $this->actingAs($otherVendor, 'sanctum')
        ->postJson("/api/v1/deals/{$deal->short_code}/proof")
        ->assertForbidden();

    $invalidVideo = UploadedFile::fake()->create('proof.webm', 10, 'video/webm');
    $this->actingAs($vendor, 'sanctum')
        ->post("/api/v1/deals/{$deal->short_code}/proof", [
            'proof_video' => $invalidVideo,
            'client_sha256_hash' => str_repeat('0', 64),
        ])
        ->assertUnprocessable();

    $video = UploadedFile::fake()->create('proof.webm', 10, 'video/webm');
    $sha256 = hash_file('sha256', $video->getRealPath());
    $response = $this->actingAs($vendor, 'sanctum')
        ->post("/api/v1/deals/{$deal->short_code}/proof", [
            'proof_video' => $video,
            'client_sha256_hash' => $sha256,
        ]);

    $response->assertOk()
        ->assertJsonPath('deal.short_code', $deal->short_code)
        ->assertJsonPath('deal.proof_artifact.video_sha256_hash', $sha256);

    $artifact = $deal->fresh()->proofArtifact;
    Storage::disk('public')->assertExists($artifact->video_path);
});
