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
            $deal = Deal::whereKey($deal->id)->lockForUpdate()->firstOrFail();
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

        return $this->settleToVendor(
            $deal,
            'BUYER',
            [EscrowStatus::DISPATCHED_IN_TRANSIT, EscrowStatus::FUNDED_LOCKED],
            '4-digit OTP verified by buyer.'
        );
    }

    public function confirmDelivery(Deal $deal): Deal
    {
        return $this->settleToVendor(
            $deal,
            'BUYER',
            [EscrowStatus::DISPATCHED_IN_TRANSIT],
            'Buyer confirmed receipt in good condition.'
        );
    }

    public function resolveDispute(Deal $deal, string $outcome): Deal
    {
        if ($outcome === 'release') {
            return $this->settleToVendor(
                $deal,
                'ADMIN',
                [EscrowStatus::DISPUTE_FROZEN],
                'Dispute reviewed and funds released to vendor by Confam admin.'
            );
        }

        if ($outcome !== 'refund') {
            throw ValidationException::withMessages([
                'outcome' => ['Choose whether to release funds or refund the buyer.'],
            ]);
        }

        return DB::transaction(function () use ($deal) {
            $lockedDeal = Deal::whereKey($deal->id)->lockForUpdate()->firstOrFail();
            if ($lockedDeal->status !== EscrowStatus::DISPUTE_FROZEN) {
                throw ValidationException::withMessages([
                    'status' => ['Only a frozen dispute can be refunded.'],
                ]);
            }

            $refundReference = $this->paystackService->refundBuyer($lockedDeal);
            $lockedDeal->update(['status' => EscrowStatus::REFUNDED]);

            EscrowLedger::firstOrCreate(
                ['idempotency_key' => "REFUND_{$lockedDeal->short_code}"],
                [
                    'deal_id'     => $lockedDeal->id,
                    'event_type'  => 'BUYER_REFUND',
                    'direction'   => 'DEBIT',
                    'amount_kobo' => $lockedDeal->total_payable_kobo,
                    'actor_role'  => 'ADMIN',
                    'metadata'    => [
                        'refund_reference' => $refundReference,
                        'reason'           => $lockedDeal->dispute_reason,
                    ],
                ]
            );

            return $lockedDeal->fresh(['proofArtifact', 'waybillManifest', 'ledgers']);
        });
    }

    private function settleToVendor(
        Deal $deal,
        string $actorRole,
        array $allowedStatuses,
        string $settlementNote
    ): Deal {
        return DB::transaction(function () use ($deal, $actorRole, $allowedStatuses, $settlementNote) {
            $lockedDeal = Deal::whereKey($deal->id)->lockForUpdate()->firstOrFail();
            if (! in_array($lockedDeal->status, $allowedStatuses, true)) {
                throw ValidationException::withMessages([
                    'status' => ['The deal is not ready for settlement.'],
                ]);
            }

            $grossPayoutKobo = $lockedDeal->item_amount_kobo + $lockedDeal->waybill_fee_kobo;
            $vendorPayoutKobo = $lockedDeal->platform_fee_payer === 'VENDOR'
                ? $grossPayoutKobo - $lockedDeal->platform_fee_kobo
                : $grossPayoutKobo;
            if ($vendorPayoutKobo < 0) {
                throw ValidationException::withMessages([
                    'status' => ['The platform fee exceeds the vendor proceeds.'],
                ]);
            }

            $transferCode = $this->paystackService->disburseVendorPayout(
                $lockedDeal,
                $vendorPayoutKobo,
                "Confam Escrow Settlement #{$lockedDeal->short_code}"
            );

            $lockedDeal->update([
                'status'                 => EscrowStatus::COMPLETED_RELEASED,
                'paystack_transfer_code' => $transferCode,
                'completed_at'           => now(),
            ]);

            EscrowLedger::firstOrCreate(
                ['idempotency_key' => "SETTLED_{$lockedDeal->short_code}"],
                [
                    'deal_id'     => $lockedDeal->id,
                    'event_type'  => 'FINAL_PAYOUT_SETTLED',
                    'direction'   => 'DEBIT',
                    'amount_kobo' => $vendorPayoutKobo,
                    'actor_role'  => $actorRole,
                    'metadata'    => [
                        'transfer_code'       => $transferCode,
                        'vendor_bank'         => $lockedDeal->vendor_bank_name,
                        'vendor_account_mask' => '******' . substr($lockedDeal->vendor_account_number, -4),
                        'note'                => $settlementNote,
                    ],
                ]
            );

            if ($lockedDeal->platform_fee_kobo > 0) {
                EscrowLedger::firstOrCreate(
                    ['idempotency_key' => "PLATFORM_FEE_{$lockedDeal->short_code}"],
                    [
                        'deal_id'     => $lockedDeal->id,
                        'event_type'  => 'PLATFORM_FEE_RETAINED',
                        'direction'   => 'DEBIT',
                        'amount_kobo' => $lockedDeal->platform_fee_kobo,
                        'actor_role'  => 'PLATFORM',
                        'metadata'    => [
                            'rate_percent' => $grossPayoutKobo > 0
                                ? round(($lockedDeal->platform_fee_kobo / $grossPayoutKobo) * 100, 2)
                                : 0,
                            'fee_payer' => strtolower($lockedDeal->platform_fee_payer),
                        ],
                    ]
                );
            }

            return $lockedDeal->fresh(['proofArtifact', 'waybillManifest', 'ledgers']);
        });
    }

    /**
     * Step 5B: Freeze Funds into Dispute if Package Does Not Match Proof-of-Pack
     */
    public function freezeForDispute(Deal $deal, string $reason, string $actorRole = 'BUYER'): Deal
    {
        return DB::transaction(function () use ($deal, $reason, $actorRole) {
            $lockedDeal = Deal::whereKey($deal->id)->lockForUpdate()->firstOrFail();
            if (! in_array($lockedDeal->status, [EscrowStatus::FUNDED_LOCKED, EscrowStatus::DISPATCHED_IN_TRANSIT], true)) {
                throw ValidationException::withMessages([
                    'status' => ['Only an active funded deal can be disputed.'],
                ]);
            }

            $lockedDeal->update([
                'status'         => EscrowStatus::DISPUTE_FROZEN,
                'dispute_reason' => $reason,
                'disputed_at'    => now(),
            ]);

            EscrowLedger::firstOrCreate(
                ['idempotency_key' => "DISPUTE_{$lockedDeal->short_code}"],
                [
                    'deal_id'     => $lockedDeal->id,
                    'event_type'  => 'DISPUTE_HOLD',
                    'direction'   => 'DEBIT',
                    'amount_kobo' => $lockedDeal->total_payable_kobo,
                    'actor_role'  => $actorRole,
                    'metadata'    => [
                        'reason' => $reason,
                        'note'   => 'Escrow frozen pending Proof-of-Pack SHA-256 video arbitration.',
                    ],
                ]
            );

            return $lockedDeal->fresh(['proofArtifact', 'waybillManifest', 'ledgers']);
        });
    }
}