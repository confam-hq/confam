<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class DealResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');

        return [
            'short_code'    => $this->short_code,
            'share_url'     => "{$frontendUrl}/v/{$this->short_code}",
            'status'        => $this->status->value,
            'delivery_mode' => $this->delivery_mode->value,

            'item' => [
                'title'       => $this->item_title,
                'description' => $this->item_description,
            ],

            'financials' => [
                'item_amount_naira'   => $this->item_amount_kobo / 100,
                'waybill_fee_naira'   => $this->waybill_fee_kobo / 100,
                'platform_fee_naira'  => $this->platform_fee_kobo / 100,
                'total_payable_naira' => $this->total_payable_kobo / 100,
                'item_amount_kobo'    => $this->item_amount_kobo,
                'waybill_fee_kobo'    => $this->waybill_fee_kobo,
                'platform_fee_kobo'   => $this->platform_fee_kobo,
                'total_payable_kobo'  => $this->total_payable_kobo,
            ],

            'vendor' => [
                'name'           => $this->vendor_name,
                'phone_masked'   => substr($this->vendor_phone, 0, 4) . '***' . substr($this->vendor_phone, -3),
                'bank_name'      => $this->vendor_bank_name,
                'account_masked' => '******' . substr($this->vendor_account_number, -4),
                'account_name'   => $this->vendor_account_name,
            ],

            'buyer' => [
                'name'         => $this->buyer_name ?? 'Verified Buyer',
                'phone_masked' => substr($this->buyer_phone, 0, 4) . '***' . substr($this->buyer_phone, -3),
                'email'        => $this->buyer_email,
            ],

            'security' => [
                'otp_attempts'     => $this->otp_attempts,
                'otp_remaining'    => max(0, 5 - $this->otp_attempts),
                'is_otp_locked'    => $this->otp_locked_until && $this->otp_locked_until->isFuture(),
                'otp_locked_until' => $this->otp_locked_until?->toIso8601String(),
                'dispute_reason'   => $this->dispute_reason,
            ],

            'proof_artifact' => $this->whenLoaded('proofArtifact', function () {
                if (! $this->proofArtifact) {
                    return null;
                }
                /** @var \Illuminate\Filesystem\FilesystemAdapter $publicStorage */
                $publicStorage = Storage::disk('public');

                return [
                    'video_url'           => $publicStorage->url($this->proofArtifact->video_path),
                    'keyframe_url'        => $this->proofArtifact->keyframe_image_path
                        ? $publicStorage->url($this->proofArtifact->keyframe_image_path)
                        : null,
                    'video_sha256_hash'   => $this->proofArtifact->video_sha256_hash,
                    'recorded_lat'        => $this->proofArtifact->recorded_lat,
                    'recorded_lng'        => $this->proofArtifact->recorded_lng,
                    'ai_confidence_score' => $this->proofArtifact->ai_confidence_score,
                    'ai_item_matched'     => $this->proofArtifact->ai_item_matched,
                    'ai_audit_summary'    => $this->proofArtifact->ai_audit_summary,
                    'captured_at_utc'     => $this->proofArtifact->captured_at_utc?->toIso8601String(),
                ];
            }),

            'waybill_manifest' => $this->whenLoaded('waybillManifest', function () use ($frontendUrl) {
                if (! $this->waybillManifest) {
                    return null;
                }
                /** @var \Illuminate\Filesystem\FilesystemAdapter $publicStorage */
                $publicStorage = Storage::disk('public');

                return [
                    'receipt_image_url'   => $this->waybillManifest->receipt_image_path
                        ? $publicStorage->url($this->waybillManifest->receipt_image_path)
                        : null,
                    'transport_company'   => $this->waybillManifest->transport_company,
                    'waybill_number'      => $this->waybillManifest->waybill_number,
                    'driver_phone'        => $this->waybillManifest->driver_phone,
                    'vehicle_plate'       => $this->waybillManifest->vehicle_plate,
                    'origin_park'         => $this->waybillManifest->origin_park,
                    'destination_park'    => $this->waybillManifest->destination_park,
                    'ai_ocr_summary'      => $this->waybillManifest->ai_ocr_summary,
                    'driver_ping_url'     => "{$frontendUrl}/d/{$this->waybillManifest->driver_ping_token}",
                    'last_known_lat'      => $this->waybillManifest->last_known_lat,
                    'last_known_lng'      => $this->waybillManifest->last_known_lng,
                    'last_location_label' => $this->waybillManifest->last_location_label,
                    'last_pinged_at'      => $this->waybillManifest->last_pinged_at?->toIso8601String(),
                ];
            }),

            'ledgers' => $this->whenLoaded('ledgers', function () {
                return $this->ledgers->map(fn ($entry) => [
                    'id'          => $entry->id,
                    'event_type'  => $entry->event_type,
                    'direction'   => $entry->direction,
                    'amount_naira'=> $entry->amount_kobo / 100,
                    'actor_role'  => $entry->actor_role,
                    'metadata'    => $entry->metadata,
                    'created_at'  => $entry->created_at?->toIso8601String(),
                ]);
            }),

            'timestamps' => [
                'created_at'    => $this->created_at?->toIso8601String(),
                'funded_at'     => $this->funded_at?->toIso8601String(),
                'dispatched_at' => $this->dispatched_at?->toIso8601String(),
                'completed_at'  => $this->completed_at?->toIso8601String(),
                'disputed_at'   => $this->disputed_at?->toIso8601String(),
            ],
        ];
    }
}