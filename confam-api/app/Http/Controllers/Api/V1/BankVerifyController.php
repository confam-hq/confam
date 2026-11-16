<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Escrow\PaystackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class BankVerifyController extends Controller
{
    public function __construct(private PaystackService $paystackService) {}

    public function listBanks(): JsonResponse
    {
        return response()->json([
            'banks' => $this->paystackService->listBanks(),
        ]);
    }

    public function resolveAccount(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'account_number' => ['required', 'string', 'digits:10'],
            'bank_code'      => ['required', 'string'],
        ]);

        try {
            $resolved = $this->paystackService->resolveAccount(
                $validated['account_number'],
                $validated['bank_code']
            );

            return response()->json([
                'status' => 'confamed',
                'data'   => $resolved,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}