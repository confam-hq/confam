<?php

use App\Http\Controllers\Api\V1\AdminController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BankVerifyController;
use App\Http\Controllers\Api\V1\DealController;
use App\Http\Controllers\Api\V1\DriverPingController;
use App\Http\Controllers\Api\V1\PaystackController;
use App\Http\Controllers\Api\V1\ProofAndWaybillController;
use App\Http\Controllers\Api\V1\SettlementController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', fn () => response()->json([
        'status' => 'confamed',
        'service' => 'Confam Escrow & Waybill API v1',
        'timestamp' => now()->toIso8601String(),
    ]));

    // Auth & Bank Account Resolution
    Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/verification/resend', [AuthController::class, 'resendVerificationCode'])->middleware('throttle:5,1');
    Route::post('/auth/verification/verify', [AuthController::class, 'verifyEmail'])->middleware('throttle:10,1');
    Route::post('/auth/password/forgot', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('/auth/password/reset', [AuthController::class, 'resetPassword'])->middleware('throttle:10,1');
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
        Route::post('/auth/unlock', [AuthController::class, 'unlock'])->middleware('throttle:10,1');
        Route::get('/auth/sessions', [AuthController::class, 'sessions']);
        Route::delete('/auth/sessions/{tokenId}', [AuthController::class, 'revokeSession']);
        Route::get('/admin/disputes', [AdminController::class, 'disputes']);
        Route::get('/admin/revenue', [AdminController::class, 'revenue']);
        Route::get('/admin/overview', [AdminController::class, 'overview']);
        Route::get('/admin/users/dormant', [AdminController::class, 'dormantUsers']);
        Route::delete('/admin/users/{user}', [AdminController::class, 'deleteDormantUser']);
        Route::get('/admin/database/reset-status', [AdminController::class, 'databaseResetStatus']);
        Route::post('/admin/disputes/{short_code}/resolve', [AdminController::class, 'resolveDispute']);
        Route::post('/admin/database/reset', [AdminController::class, 'resetDatabase']);
        Route::get('/admin/database/backups/{fileName}', [AdminController::class, 'downloadDatabaseBackup'])
            ->where('fileName', '[A-Za-z0-9._-]+');
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
