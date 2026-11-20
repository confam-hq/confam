<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\DealResource;
use App\Models\Deal;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'           => ['required', 'string', 'max:120'],
            'email'          => ['required', 'email', 'unique:users,email'],
            'phone'          => ['required', 'string', 'max:20', 'unique:users,phone'],
            'password'       => ['required', 'string', 'min:6'],
            'bank_code'      => ['nullable', 'string', 'max:15'],
            'bank_name'      => ['nullable', 'string', 'max:100'],
            'account_number' => ['nullable', 'string', 'digits:10'],
            'account_name'   => ['nullable', 'string', 'max:120'],
        ]);

        $user = User::create($validated);
        $token = $user->createToken('confam-spa-token')->plainTextToken;

        return response()->json([
            'message' => 'Vendor account confamed.',
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

    public function myDeals(Request $request): JsonResponse
    {
        $deals = $request->user()
            ->deals()
            ->with(['proofArtifact', 'waybillManifest', 'ledgers'])
            ->latest()
            ->get();

        return response()->json([
            'deals' => DealResource::collection($deals),
        ]);
    }

    public function myPurchases(Request $request): JsonResponse
    {
        $deals = Deal::query()
            ->where('buyer_email', $request->user()->email)
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