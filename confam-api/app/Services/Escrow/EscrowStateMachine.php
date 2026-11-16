<?php

namespace App\Services\Escrow;

use App\Enums\EscrowStatus;
use App\Models\Deal;
use App\Models\EscrowLedger;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class EscrowStateMachine
{
    public function __construct(
        private OtpSecurityService $otpService,
        private PaystackService $paystackService
    ) {}

    /**
     * Step 2: Lock Buyer Funds in Escrow & Issue 4-Digit Release OTP
     */
    public function markAsFunded(Deal $deal, string $paymentReference): array
    {
        return DB::transaction(function () use ($deal, $paymentReference) {
            $deal = Deal::whereKey($deal->id)->firstOrFail();

            // Idempotency guard if webhook + redirect fire simultaneously
            if ($deal->status !== EscrowStatus::AWAITING_PAYMENT) {
                return ['deal' => $deal, 'plain_otp' => null];
            }

            $plainOtp = $this->otpService->issueReleaseOtp($deal);

            $deal->update([
                'status'             => EscrowStatus::FUNDED_LOCKED,
                'paystack_reference' => $paymentReference,
                'funded_at'          => now(),
            ]);

            EscrowLedger::firstOrCreate(
                ['idempotency_key' => "FUNDED_{$deal->short_code}_{$paymentReference}"],
                [
                    'deal_id'     => $deal->id,
                    'event_type'  => 'COLLECTION_LOCKED',
                    'direction'   => 'CREDIT',
                    'amount_kobo' => $deal->total_payable_kobo,
                    'actor_role'  => 'BUYER',
                    'metadata'    => [
                        'paystack_reference' => $paymentReference,
                        'note'               => 'Buyer funds locked in Confam Escrow Vault.',
                    ],
                ]
            );

            return ['deal' => $deal->fresh(), 'plain_otp' => $plainOtp];
        });
    }

    /**
     * Step 3: Transition to Dispatched after Proof-of-Pack + Waybill Manifest Upload
     */
    public function markAsDispatched(Deal $deal, string $videoHash, ?string $transportCompany): Deal
    {
        return DB::transaction(function () use ($deal, $videoHash, $transportCompany) {
            if ($deal->status !== EscrowStatus::FUNDED_LOCKED) {
                throw ValidationException::withMessages([
                    'status' => ['Deal must be in FUNDED_LOCKED state before dispatching.'],
                ]);
            }

            $deal->update([
                'status'        => EscrowStatus::DISPATCHED_IN_TRANSIT,
                'dispatched_at' => now(),
            ]);

            // Ghost-Buyer Waybill Shield ledger entry
            if ($deal->waybill_fee_kobo > 0) {
                EscrowLedger::firstOrCreate(
                    ['idempotency_key' => "WAYBILL_SHIELD_{$deal->short_code}"],
                    [
                        'deal_id'     => $deal->id,
                        'event_type'  => 'WAYBILL_SHIELD_ACTIVE',
                        'direction'   => 'CREDIT',
                        'amount_kobo' => $deal->waybill_fee_kobo,
                        'actor_role'  => 'VENDOR',
                        'metadata'    => [
                            'video_sha256'      => $videoHash,
                            'transport_company' => $transportCompany,
                            'note'              => 'Proof-of-Pack verified; vendor waybill fee protected against ghost buyer.',
                        ],
                    ]
                );
            }

            return $deal->fresh(['proofArtifact', 'waybillManifest', 'ledgers']);
        });
    }

    /**
     * Step 5A: Verify Buyer 4-Digit OTP & Settle Vendor Immediately
     */
    public function releaseFundsWithOtp(Deal $deal, string $otp): Deal
    {
        if (! in_array($deal->status, [EscrowStatus::DISPATCHED_IN_TRANSIT, EscrowStatus::FUNDED_LOCKED], true)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot release funds when deal status is {$deal->status->value}."],
            ]);
        }

        // Verify OTP outside main state write so failed attempt increments persist even when throwing
        $this->otpService->verifyOrFail($deal, $otp);

        return DB::transaction(function () use ($deal) {
            $vendorPayoutKobo = $deal->item_amount_kobo + $deal->waybill_fee_kobo;

            $transferCode = $this->paystackService->disburseVendorPayout(
                $deal,
                $vendorPayoutKobo,
                "Confam Escrow Settlement #{$deal->short_code}"
            );

            $deal->update([
                'status'                 => EscrowStatus::COMPLETED_RELEASED,
                'paystack_transfer_code' => $transferCode,
                'completed_at'           => now(),
            ]);

            EscrowLedger::firstOrCreate(
                ['idempotency_key' => "SETTLED_{$deal->short_code}"],
                [
                    'deal_id'     => $deal->id,
                    'event_type'  => 'FINAL_PAYOUT_SETTLED',
                    'direction'   => 'DEBIT',
                    'amount_kobo' => $vendorPayoutKobo,
                    'actor_role'  => 'BUYER',
                    'metadata'    => [
                        'transfer_code'       => $transferCode,
                        'vendor_bank'         => $deal->vendor_bank_name,
                        'vendor_account_mask' => '******' . substr($deal->vendor_account_number, -4),
                        'note'                => '4-digit OTP verified by buyer. Instant payout dispatched to vendor.',
                    ],
                ]
            );

            return $deal->fresh(['proofArtifact', 'waybillManifest', 'ledgers']);
        });
    }

    /**
     * Step 5B: Freeze Funds into Dispute if Package Does Not Match Proof-of-Pack
     */
    public function freezeForDispute(Deal $deal, string $reason, string $actorRole = 'BUYER'): Deal
    {
        return DB::transaction(function () use ($deal, $reason, $actorRole) {
            if ($deal->status === EscrowStatus::COMPLETED_RELEASED) {
                throw ValidationException::withMessages([
                    'status' => ['Deal has already been settled and released.'],
                ]);
            }

            $deal->update([
                'status'         => EscrowStatus::DISPUTE_FROZEN,
                'dispute_reason' => $reason,
                'disputed_at'    => now(),
            ]);

            EscrowLedger::firstOrCreate(
                ['idempotency_key' => "DISPUTE_{$deal->short_code}_" . now()->timestamp],
                [
                    'deal_id'     => $deal->id,
                    'event_type'  => 'DISPUTE_HOLD',
                    'direction'   => 'DEBIT',
                    'amount_kobo' => $deal->total_payable_kobo,
                    'actor_role'  => $actorRole,
                    'metadata'    => [
                        'reason' => $reason,
                        'note'   => 'Escrow frozen pending Proof-of-Pack SHA-256 video arbitration.',
                    ],
                ]
            );

            return $deal->fresh(['proofArtifact', 'waybillManifest', 'ledgers']);
        });
    }
}