<?php

use App\Models\Deal;
use App\Services\Escrow\PaystackService;
use Illuminate\Support\Facades\Http;
use RuntimeException;

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

test('a failed Paystack bank list request is surfaced instead of returning an empty list', function () {
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

    expect(fn () => app(PaystackService::class)->listBanks())
        ->toThrow(RuntimeException::class, 'Could not load Nigerian banks: Invalid key');
});

