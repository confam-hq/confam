<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\EscrowStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\CreateDealRequest;
use App\Http\Resources\Api\V1\DealResource;
use App\Models\Deal;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class DealController extends Controller
{
    public function store(CreateDealRequest $request): JsonResponse
    {
        abort_unless($request->user()->role === 'vendor', 403);

        $data = $request->validated();

        $itemAmountKobo = (int) round(((float) $data['item_amount_naira']) * 100);
        $waybillFeeKobo = (int) round(((float) ($data['waybill_fee_naira'] ?? 0)) * 100);

        // The 5% platform fee is deducted from the vendor's payout, not added to the buyer's total.
        $subtotalKobo    = $itemAmountKobo + $waybillFeeKobo;
        $platformFeeKobo = intdiv($subtotalKobo, 20) + (($subtotalKobo % 20) >= 10 ? 1 : 0);
        $totalPayableKobo = $subtotalKobo;

        do {
            $shortCode = 'CF-' . strtoupper(Str::random(5));
        } while (Deal::where('short_code', $shortCode)->exists());

        $vendorManageToken = Str::random(48);

        $deal = Deal::create([
            'short_code'            => $shortCode,
            'vendor_user_id'        => auth('sanctum')->id(),
            'vendor_name'           => $data['vendor_name'],
            'vendor_phone'          => $data['vendor_phone'],
            'vendor_email'          => $data['vendor_email'] ?? null,
            'vendor_bank_code'      => $data['vendor_bank_code'],
            'vendor_bank_name'      => $data['vendor_bank_name'] ?? 'Nigerian Bank',
            'vendor_account_number' => $data['vendor_account_number'],
            'vendor_account_name'   => $data['vendor_account_name'],
            'vendor_manage_token'   => $vendorManageToken,
            'buyer_name'            => $data['buyer_name'] ?? null,
            'buyer_phone'           => $data['buyer_phone'],
            'buyer_email'           => $data['buyer_email'],
            'item_title'            => $data['item_title'],
            'item_description'      => $data['item_description'] ?? null,
            'item_amount_kobo'      => $itemAmountKobo,
            'waybill_fee_kobo'      => $waybillFeeKobo,
            'platform_fee_kobo'     => $platformFeeKobo,
            'platform_fee_payer'    => 'VENDOR',
            'total_payable_kobo'    => $totalPayableKobo,
            'delivery_mode'         => $data['delivery_mode'],
            'status'                => EscrowStatus::AWAITING_PAYMENT,
        ]);

        return response()->json([
            'message'             => 'Confam link generated.',
            'vendor_manage_token' => $vendorManageToken,
            'deal'                => new DealResource($deal->load(['proofArtifact', 'waybillManifest', 'ledgers'])),
        ], 201);
    }

    public function show(string $short_code): JsonResponse
    {
        $deal = Deal::with(['proofArtifact', 'waybillManifest', 'ledgers'])
            ->where('short_code', strtoupper($short_code))
            ->firstOrFail();

        return response()->json([
            'deal' => new DealResource($deal),
        ]);
    }
}