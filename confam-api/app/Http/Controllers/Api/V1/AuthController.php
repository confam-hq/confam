<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\DealResource;
use App\Models\Deal;
use App\Models\User;
use App\Services\Escrow\PaystackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'           => ['required', 'string', 'max:120'],
            'email'          => ['required', 'email', 'unique:users,email'],
            'phone'          => ['required', 'string', 'max:20', 'unique:users,phone'],
            'password'       => ['required', 'string', 'min:6'],
            'role'           => ['sometimes', 'in:buyer,vendor'],
            'bank_code'      => ['nullable', 'string', 'max:15'],
            'bank_name'      => ['nullable', 'string', 'max:100'],
            'account_number' => ['nullable', 'string', 'digits:10'],
            'account_name'   => ['nullable', 'string', 'max:120'],
        ]);

        $validated['role'] = $validated['role'] ?? 'vendor';
        $user = User::create($validated);
        $token = $user->createToken('confam-spa-token')->plainTextToken;

        return response()->json([
            'message' => 'Confam account created.',
            'token'   => $token,
            'user'    => $user,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials provided.'],
            ]);
        }

        $token = $user->createToken('confam-spa-token')->plainTextToken;

        return response()->json([
            'message' => 'Logged in successfully.',
            'token'   => $token,
            'user'    => $user,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()]);
    }

    public function updateProfile(Request $request, PaystackService $paystackService): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->role === 'vendor', 403);

        $validated = $request->validate([
            'name'           => ['required', 'string', 'max:120'],
            'phone'          => ['required', 'string', 'max:20', Rule::unique('users', 'phone')->ignore($user->id)],
            'bank_code'      => ['required', 'string', 'max:15'],
            'bank_name'      => ['required', 'string', 'max:100'],
            'account_number' => ['required', 'string', 'digits:10'],
        ]);

        $payoutDetailsChanged = $user->bank_code !== $validated['bank_code']
            || $user->account_number !== $validated['account_number'];
        try {
            $account = $paystackService->resolveAccount(
                $validated['account_number'],
                $validated['bank_code']
            );
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }
        $accountName = $account['account_name'] ?? null;

        if (! is_string($accountName) || trim($accountName) === '') {
            throw ValidationException::withMessages([
                'account_number' => ['Could not verify the payout account.'],
            ]);
        }

        $user->update([
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'bank_code' => $validated['bank_code'],
            'bank_name' => $validated['bank_name'],
            'account_number' => $validated['account_number'],
            'account_name' => $accountName,
            'paystack_recipient_code' => $payoutDetailsChanged ? null : $user->paystack_recipient_code,
        ]);

        return response()->json(['user' => $user->fresh()]);
    }

    public function myDeals(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->role === 'vendor', 403);
        $deals = Deal::query()
            ->where(function ($query) use ($user) {
                $query->where('vendor_user_id', $user->id)
                    ->orWhere(function ($query) use ($user) {
                        $query->whereNull('vendor_user_id')
                            ->whereRaw('LOWER(vendor_email) = ?', [strtolower($user->email)]);
                    });
            })
            ->with(['proofArtifact', 'waybillManifest', 'ledgers'])
            ->latest()
            ->get();

        return response()->json([
            'deals' => DealResource::collection($deals),
        ]);
    }

    public function myPurchases(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->role === 'buyer', 403);

        $deals = Deal::query()
            ->whereRaw('LOWER(buyer_email) = ?', [strtolower($user->email)])
            ->with(['proofArtifact', 'waybillManifest', 'ledgers'])
            ->latest()
            ->get();

        return response()->json([
            'deals' => DealResource::collection($deals),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out.']);
    }
}