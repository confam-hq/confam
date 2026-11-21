<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\DealResource;
use App\Models\Deal;
use App\Models\User;
use App\Notifications\AuthOtpNotification;
use App\Services\Escrow\PaystackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:20', 'unique:users,phone'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['sometimes', 'in:buyer,vendor'],
            'bank_code' => ['nullable', 'string', 'max:15'],
            'bank_name' => ['nullable', 'string', 'max:100'],
            'account_number' => ['nullable', 'string', 'digits:10'],
            'account_name' => ['nullable', 'string', 'max:120'],
            'terms_accepted' => ['required', 'accepted'],
            'privacy_accepted' => ['required', 'accepted'],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
        ]);

        $validated['role'] = $validated['role'] ?? 'vendor';
        $validated['terms_accepted_at'] = now();
        $validated['privacy_accepted_at'] = now();
        $avatar = $validated['avatar'] ?? null;
        unset($validated['terms_accepted'], $validated['privacy_accepted'], $validated['avatar']);

        $user = User::create($validated);
        if ($avatar) {
            $user->forceFill(['avatar_path' => $this->storeAvatar($avatar)])->save();
        }
        $this->sendOtp($user, 'email_verification', true);

        return response()->json([
            'message' => 'Confam account created. Check your email for a verification code.',
            'email' => $user->email,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials provided.'],
            ]);
        }

        if (! $user->email_verified_at) {
            throw ValidationException::withMessages([
                'email' => ['Verify your email address before signing in.'],
            ]);
        }

        $token = $user->createToken('confam-spa-token')->plainTextToken;

        return response()->json([
            'message' => 'Logged in successfully.',
            'token' => $token,
            'user' => $user,
        ]);
    }

    public function unlock(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string'],
        ]);
        if (! Hash::check($validated['password'], $request->user()->password)) {
            throw ValidationException::withMessages([
                'password' => ['The password is incorrect.'],
            ]);
        }

        return response()->json(['message' => 'Session unlocked.']);
    }

    public function resendVerificationCode(Request $request): JsonResponse
    {
        $validated = $request->validate(['email' => ['required', 'email']]);
        $user = User::where('email', $validated['email'])->first();

        if ($user && ! $user->email_verified_at) {
            $this->sendOtp($user, 'email_verification');
        }

        return response()->json([
            'message' => 'If the account needs verification, a code has been sent.',
        ]);
    }

    public function verifyEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'digits:6'],
        ]);
        $user = User::where('email', $validated['email'])->first();

        if (! $user || $user->email_verified_at) {
            throw ValidationException::withMessages(['code' => ['This verification code is invalid or expired.']]);
        }

        $this->verifyOtp($user, 'email_verification', $validated['code']);
        $user->forceFill(['email_verified_at' => now()])->save();
        $this->deleteOtp($user, 'email_verification');

        return response()->json(['message' => 'Email verified. You can now sign in.']);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate(['email' => ['required', 'email']]);
        $user = User::where('email', $validated['email'])->first();

        if ($user) {
            $this->sendOtp($user, 'password_reset');
        }

        return response()->json([
            'message' => 'If an account exists for that email, a password reset code has been sent.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'digits:6'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);
        $user = User::where('email', $validated['email'])->first();

        if (! $user) {
            throw ValidationException::withMessages(['code' => ['This reset code is invalid or expired.']]);
        }

        $this->verifyOtp($user, 'password_reset', $validated['code']);

        DB::transaction(function () use ($user, $validated) {
            $user->forceFill(['password' => $validated['password']])->save();
            $user->tokens()->delete();
            $this->deleteOtp($user, 'password_reset');
        });

        return response()->json(['message' => 'Password reset. You can now sign in.']);
    }

    public function sessions(Request $request): JsonResponse
    {
        $currentTokenId = $request->user()->currentAccessToken()?->getKey();
        $tokens = $request->user()->tokens()
            ->where(function ($query) {
                $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
            });
        if (config('sanctum.expiration') !== null) {
            $tokens->where('created_at', '>=', now()->subMinutes((int) config('sanctum.expiration')));
        }

        return response()->json([
            'current_token_id' => $currentTokenId,
            'sessions' => $tokens
                ->latest('created_at')
                ->get(['id', 'name', 'created_at', 'last_used_at']),
        ]);
    }

    public function revokeSession(Request $request, int $tokenId): JsonResponse
    {
        $currentTokenId = $request->user()->currentAccessToken()?->getKey();
        $deleted = $request->user()->tokens()->whereKey($tokenId)->delete();

        abort_unless($deleted, 404);

        return response()->json([
            'message' => 'Session revoked.',
            'current' => (int) $currentTokenId === $tokenId,
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
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['required', 'string', 'max:20', Rule::unique('users', 'phone')->ignore($user->id)],
            'bank_code' => ['required', 'string', 'max:15'],
            'bank_name' => ['required', 'string', 'max:100'],
            'account_number' => ['required', 'string', 'digits:10'],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
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

        $avatar = $validated['avatar'] ?? null;
        unset($validated['avatar']);
        $previousAvatar = $user->avatar_path;
        $profile = [
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'bank_code' => $validated['bank_code'],
            'bank_name' => $validated['bank_name'],
            'account_number' => $validated['account_number'],
            'account_name' => $accountName,
            'paystack_recipient_code' => $payoutDetailsChanged ? null : $user->paystack_recipient_code,
        ];
        if ($avatar) {
            $profile['avatar_path'] = $this->storeAvatar($avatar);
        }
        $user->update($profile);
        if ($avatar && $previousAvatar) {
            if (! Storage::disk('public')->delete($previousAvatar)) {
                report(new RuntimeException('An outdated profile avatar could not be removed.'));
            }
        }

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

    private function sendOtp(User $user, string $purpose, bool $allowImmediate = false): void
    {
        $existing = DB::table('auth_otp_codes')
            ->where('user_id', $user->id)
            ->where('purpose', $purpose)
            ->first();

        if (! $allowImmediate && $existing && now()->diffInSeconds($existing->created_at) < 60) {
            return;
        }

        $code = (string) random_int(100000, 999999);
        DB::table('auth_otp_codes')->updateOrInsert(
            ['user_id' => $user->id, 'purpose' => $purpose],
            [
                'code_hash' => Hash::make($code),
                'expires_at' => now()->addMinutes(10),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        Notification::route('mail', $user->email)->notify(new AuthOtpNotification($code, $purpose));
    }

    private function verifyOtp(User $user, string $purpose, string $code): void
    {
        $record = DB::table('auth_otp_codes')
            ->where('user_id', $user->id)
            ->where('purpose', $purpose)
            ->first();

        if (
            ! $record
            || now()->isAfter($record->expires_at)
            || ! Hash::check($code, $record->code_hash)
        ) {
            throw ValidationException::withMessages([
                'code' => ['This code is invalid or expired.'],
            ]);
        }
    }

    private function deleteOtp(User $user, string $purpose): void
    {
        DB::table('auth_otp_codes')
            ->where('user_id', $user->id)
            ->where('purpose', $purpose)
            ->delete();
    }

    private function storeAvatar(UploadedFile $avatar): string
    {
        $path = $avatar->storePublicly('avatars', 'public');
        if (! is_string($path) || $path === '') {
            throw new RuntimeException('The profile avatar could not be saved.');
        }

        return $path;
    }
}
