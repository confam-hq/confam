<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\AdminController;
use App\Http\Controllers\Api\V1\BankVerifyController;
use App\Http\Controllers\Api\V1\DealController;
use App\Http\Controllers\Api\V1\PaystackController;
use App\Http\Controllers\Api\V1\ProofAndWaybillController;
use App\Http\Controllers\Api\V1\DriverPingController;
use App\Http\Controllers\Api\V1\SettlementController;

Route::prefix('v1')->group(function () {
    Route::get('/health', fn () => response()->json([
        'status'    => 'confamed',
        'service'   => 'Confam Escrow & Waybill API v1',
        'timestamp' => now()->toIso8601String(),
    ]));

    // Auth & Bank Account Resolution
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::get('/banks', [BankVerifyController::class, 'listBanks']);
    Route::post('/banks/resolve', [BankVerifyController::class, 'resolveAccount']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/vendor/me', [AuthController::class, 'me']);
        Route::patch('/vendor/profile', [AuthController::class, 'updateProfile']);
        Route::get('/vendor/deals', [AuthController::class, 'myDeals']);
        Route::get('/buyer/deals', [AuthController::class, 'myPurchases']);
        Route::post('/deals', [DealController::class, 'store']);
        Route::post('/deals/{short_code}/proof', [ProofAndWaybillController::class, 'uploadProof']);
        Route::post('/deals/{short_code}/parse-waybill', [ProofAndWaybillController::class, 'parseWaybill']);
        Route::post('/deals/{short_code}/dispatch', [ProofAndWaybillController::class, 'dispatchDeal']);
        Route::post('/deals/{short_code}/release', [SettlementController::class, 'releaseWithOtp']);
        Route::post('/deals/{short_code}/confirm-delivery', [SettlementController::class, 'confirmDelivery']);
        Route::post('/deals/{short_code}/dispute', [SettlementController::class, 'freezeDispute']);
        Route::get('/admin/disputes', [AdminController::class, 'disputes']);
        Route::get('/admin/revenue', [AdminController::class, 'revenue']);
        Route::post('/admin/disputes/{short_code}/resolve', [AdminController::class, 'resolveDispute']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
    });

    // 1. Deal Creation & Public Deal Room
    Route::get('/deals/{short_code}', [DealController::class, 'show']);

    // 2. Paystack Checkout, Callback Verification & HMAC Webhook
    Route::post('/deals/{short_code}/pay', [PaystackController::class, 'initialize']);
    Route::post('/deals/{short_code}/verify-payment', [PaystackController::class, 'verifyCallback']);
    Route::post('/webhooks/paystack', [PaystackController::class, 'webhook']);

    // 3. AI Waybill OCR & Live Proof-of-Pack Upload
    // 4. Zero-Install 1-Tap Driver Location Ping
    Route::get('/driver/{ping_token}', [DriverPingController::class, 'show']);
    Route::post('/driver/{ping_token}/ping', [DriverPingController::class, 'storePing']);

});