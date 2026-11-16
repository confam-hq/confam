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

        $settledDeal = $this->stateMachine->releaseFundsWithOtp($deal, $validated['otp']);

        return response()->json([
            'message' => 'OTP Confamed! Escrow funds released to vendor bank account.',
            'deal'    => new DealResource($settledDeal),
        ]);
    }

    public function freezeDispute(Request $request, string $short_code): JsonResponse
    {
        $validated = $request->validate([
            'reason'     => ['required', 'string', 'min:10', 'max:1000'],
            'actor_role' => ['nullable', 'string', 'in:BUYER,VENDOR'],
        ]);

        $deal = Deal::where('short_code', strtoupper($short_code))->firstOrFail();

        $frozenDeal = $this->stateMachine->freezeForDispute(
            $deal,
            $validated['reason'],
            $validated['actor_role'] ?? 'BUYER'
        );

        return response()->json([
            'message' => 'Escrow funds frozen for dispute arbitration.',
            'deal'    => new DealResource($frozenDeal),
        ]);
    }
}