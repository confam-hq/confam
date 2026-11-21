<?php

use App\Models\Deal;
use App\Services\Escrow\PaystackService;
use Illuminate\Support\Facades\Http;
use RuntimeException;

test('test mode resolves bank accounts locally instead of making an unreliable live lookup', function () {
    config([
        'services.paystack.secret_key' => 'sk_test_example',
        'services.paystack.base_url' => 'https://api.paystack.co',
    ]);

    $resolved = app(PaystackService::class)->resolveAccount('0123456789', '058');

    expect($resolved)
        ->account_number->toBe('0123456789')
        ->account_name->toBe('CONFAM TEST VENDOR')
        ->bank_code->toBe('058')
        ->test_mode->toBeTrue();
});

test('test mode returns banks locally without calling Paystack', function () {
    config([
        'services.paystack.secret_key' => 'sk_test_example',
        'services.paystack.base_url' => 'https://api.paystack.co',
    ]);

    Http::fake();

    $banks = app(PaystackService::class)->listBanks();

    expect($banks)->not->toBeEmpty()
        ->and(collect($banks)->pluck('code'))->toContain('058')
        ->and(Http::recorded())->toBeEmpty();
});

test('test mode accepts a successful inline payment reference locally', function () {
    config([
        'services.paystack.secret_key' => 'sk_test_example',
        'services.paystack.base_url' => 'https://api.paystack.co',
    ]);

    Http::fake();

    $verified = app(PaystackService::class)->verifyTransaction('CFM_TEST_SUCCESS');

    expect($verified)
        ->status->toBe('success')
        ->reference->toBe('CFM_TEST_SUCCESS')
        ->mock->toBeTrue()
        ->and(Http::recorded())->toBeEmpty();
});

test('a failed live Paystack transfer is surfaced instead of recorded as a payout', function () {
    config([
        'services.paystack.secret_key' => 'sk_live_test_key',
        'services.paystack.base_url' => 'https://api.paystack.co',
    ]);
    Http::fake([
        'https://api.paystack.co/transfer' => Http::response([
            'status' => false,
            'message' => 'Insufficient balance',
        ], 400),
    ]);

    $deal = new Deal([
        'short_code' => 'CF-PAYOUT',
        'paystack_recipient_code' => 'RCP_TEST',
    ]);

    expect(fn () => app(PaystackService::class)->disburseVendorPayout($deal, 100000, 'Test payout'))
        ->toThrow(RuntimeException::class, 'Paystack vendor payout failed: Insufficient balance');
});

test('a failed Paystack bank list request falls back to Nigerian banks', function () {
    config([
        'services.paystack.secret_key' => 'sk_live_test_key',
        'services.paystack.base_url' => 'https://api.paystack.co',
    ]);
    Http::fake([
        'https://api.paystack.co/bank*' => Http::response([
            'status' => false,
            'message' => 'Invalid key',
        ], 401),
    ]);

    $banks = app(PaystackService::class)->listBanks();

    expect($banks)->not->toBeEmpty()
        ->and(collect($banks)->pluck('code'))->toContain('058');
});

