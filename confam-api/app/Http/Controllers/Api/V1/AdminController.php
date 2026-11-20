<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\EscrowStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\DealResource;
use App\Models\Deal;
use App\Models\EscrowLedger;
use App\Services\Escrow\EscrowStateMachine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function __construct(private EscrowStateMachine $stateMachine) {}

    public function disputes(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $deals = Deal::query()
            ->where('status', EscrowStatus::DISPUTE_FROZEN)
            ->with(['proofArtifact', 'waybillManifest', 'ledgers'])
            ->latest('disputed_at')
            ->get();

        return response()->json(['data' => DealResource::collection($deals)]);
    }

    public function revenue(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        return response()->json([
            'total' => EscrowLedger::where('event_type', 'COLLECTION_LOCKED')->sum('amount_kobo') / 100,
            'fees' => EscrowLedger::where('event_type', 'PLATFORM_FEE_RETAINED')->sum('amount_kobo') / 100,
            'settled' => EscrowLedger::where('event_type', 'FINAL_PAYOUT_SETTLED')->sum('amount_kobo') / 100,
        ]);
    }

    public function resolveDispute(Request $request, string $short_code): JsonResponse
    {
        $this->authorizeAdmin($request);
        $validated = $request->validate([
            'outcome' => ['required', 'in:release,refund'],
        ]);
        $deal = Deal::where('short_code', strtoupper($short_code))->firstOrFail();

        $resolvedDeal = $this->stateMachine->resolveDispute($deal, $validated['outcome']);

        return response()->json([
            'message' => $validated['outcome'] === 'refund'
                ? 'Buyer refund submitted.'
                : 'Dispute reviewed and vendor payout released.',
            'deal' => new DealResource($resolvedDeal),
        ]);
    }

    private function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user()->role === 'admin', 403);
    }
}
