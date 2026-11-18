<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\DealResource;
use App\Models\Deal;
use App\Services\Escrow\EscrowStateMachine;
use App\Services\Escrow\PaystackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaystackController extends Controller
{
    public function __construct(
        private PaystackService $paystackService,
        private EscrowStateMachine $stateMachine
    ) {}

    public function initialize(Request $request, string $short_code): JsonResponse
    {
        $deal = Deal::where('short_code', strtoupper($short_code))->firstOrFail();
        $data = $request->validate([
            'email'        => ['sometimes', 'required', 'email', 'max:120'],
            'callback_url' => ['sometimes', 'required', 'url'],
        ]);

        $frontendUrl = rtrim((string) env('FRONTEND_URL', 'http://localhost:5173'), '/');
        $callbackUrl = $data['callback_url'] ?? "{$frontendUrl}/deal/{$deal->short_code}";

        $checkoutData = $this->paystackService->initializeEscrowPayment(
            $deal,
            $callbackUrl,
            $data['email'] ?? $deal->buyer_email,
        );

        return response()->json([
            'message'  => 'Paystack escrow checkout initialized.',
            'checkout' => $checkoutData,
        ]);
    }

    /**
     * Buyer frontend calls this on redirect back from Paystack (or in demo/mock mode)
     * to immediately verify payment and receive the 4-digit Release OTP once.
     */
    public function verifyCallback(Request $request, string $short_code): JsonResponse
    {
        $deal = Deal::where('short_code', strtoupper($short_code))->firstOrFail();
        $reference = (string) $request->input('reference', $deal->paystack_reference);

        $this->paystackService->verifyTransaction($reference);
        $result = $this->stateMachine->markAsFunded($deal, $reference);

        return response()->json([
            'message'           => 'Escrow funded and locked.',
            'buyer_release_otp' => $result['plain_otp'], // Displayed once to the buyer to save!
            'deal'              => new DealResource($result['deal']->load(['proofArtifact', 'waybillManifest', 'ledgers'])),
        ]);
    }

    public function webhook(Request $request): JsonResponse
    {
        $rawPayload = $request->getContent();
        $signature  = $request->header('x-paystack-signature');

        if (! $this->paystackService->isValidWebhookSignature($rawPayload, $signature)) {
            return response()->json(['message' => 'Invalid HMAC webhook signature.'], 401);
        }

        $payload = $request->json()->all();

        if (($payload['event'] ?? '') === 'charge.success') {
            $reference = data_get($payload, 'data.reference');
            $shortCode = data_get($payload, 'data.metadata.deal_short_code');

            $deal = Deal::where('paystack_reference', $reference)
                ->orWhere('short_code', $shortCode)
                ->first();

            if ($deal) {
                $this->stateMachine->markAsFunded($deal, (string) $reference);
            }
        }

        return response()->json(['status' => 'ok']);
    }
}