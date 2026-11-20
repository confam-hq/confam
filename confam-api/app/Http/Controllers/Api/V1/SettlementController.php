<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\DealResource;
use App\Models\Deal;
use App\Services\Escrow\EscrowStateMachine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettlementController extends Controller
{
    public function __construct(private EscrowStateMachine $stateMachine) {}

    public function releaseWithOtp(Request $request, string $short_code): JsonResponse
    {
        $validated = $request->validate([
            'otp' => ['required', 'string', 'digits:4'],
        ]);

        $deal = Deal::where('short_code', strtoupper($short_code))->firstOrFail();
        $this->authorizeBuyer($request, $deal);

        $settledDeal = $this->stateMachine->releaseFundsWithOtp($deal, $validated['otp']);

        return response()->json([
            'message' => 'OTP Confamed! Escrow funds released to vendor bank account.',
            'deal'    => new DealResource($settledDeal),
        ]);
    }

    public function confirmDelivery(Request $request, string $short_code): JsonResponse
    {
        $deal = Deal::where('short_code', strtoupper($short_code))->firstOrFail();
        $this->authorizeBuyer($request, $deal);

        $settledDeal = $this->stateMachine->confirmDelivery($deal);

        return response()->json([
            'message' => 'Delivery confirmed in good condition. Vendor payout has been released.',
            'deal'    => new DealResource($settledDeal),
        ]);
    }

    public function freezeDispute(Request $request, string $short_code): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:10', 'max:1000'],
        ]);

        $deal = Deal::where('short_code', strtoupper($short_code))->firstOrFail();
        $user = $request->user();
        $isBuyer = $user->role === 'buyer'
            && strcasecmp($deal->buyer_email, $user->email) === 0;
        $isVendor = $user->role === 'vendor'
            && ((int) $deal->vendor_user_id === (int) $user->id
                || ($deal->vendor_user_id === null
                    && $deal->vendor_email !== null
                    && strcasecmp($deal->vendor_email, $user->email) === 0));
        abort_unless($isBuyer || $isVendor, 403);

        $frozenDeal = $this->stateMachine->freezeForDispute(
            $deal,
            $validated['reason'],
            $isVendor ? 'VENDOR' : 'BUYER'
        );

        return response()->json([
            'message' => 'Escrow funds frozen for dispute arbitration.',
            'deal'    => new DealResource($frozenDeal),
        ]);
    }

    private function authorizeBuyer(Request $request, Deal $deal): void
    {
        $user = $request->user();
        abort_unless(
            $user->role === 'buyer' && strcasecmp($deal->buyer_email, $user->email) === 0,
            403
        );
    }
}