<?php

namespace App\Services\Escrow;

use App\Models\Deal;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class OtpSecurityService
{
    /**
     * Generates a 4-digit OTP, stores its bcrypt hash on the Deal, and returns the plain OTP once.
     */
    public function issueReleaseOtp(Deal $deal): string
    {
        $plainOtp = str_pad((string) random_int(1000, 9999), 4, '0', STR_PAD_LEFT);

        $deal->update([
            'release_otp_hash' => Hash::make($plainOtp),
            'otp_attempts'     => 0,
            'otp_locked_until' => null,
        ]);

        return $plainOtp;
    }

    /**
     * Verifies the 4-digit OTP with strict 5-attempt rate-limiting.
     */
    public function verifyOrFail(Deal $deal, string $submittedOtp): void
    {
        if ($deal->otp_locked_until && $deal->otp_locked_until->isFuture()) {
            $minutes = now()->diffInMinutes($deal->otp_locked_until) + 1;
            throw ValidationException::withMessages([
                'otp' => ["Too many failed OTP attempts. Escrow release is locked for {$minutes} minute(s)."],
            ]);
        }

        if (! $deal->release_otp_hash || ! Hash::check($submittedOtp, $deal->release_otp_hash)) {
            $attempts = $deal->otp_attempts + 1;
            $lockUntil = $attempts >= 5 ? now()->addMinutes(15) : null;

            $deal->update([
                'otp_attempts'     => $attempts,
                'otp_locked_until' => $lockUntil,
            ]);

            $remaining = max(0, 5 - $attempts);
            throw ValidationException::withMessages([
                'otp' => $remaining > 0
                    ? ["Invalid Release OTP. {$remaining} attempt(s) remaining before temporary security lock."]
                    : ['Maximum OTP attempts exceeded. Escrow locked for 15 minutes.'],
            ]);
        }

        // Reset counters on success
        $deal->update([
            'otp_attempts'     => 0,
            'otp_locked_until' => null,
        ]);
    }
}