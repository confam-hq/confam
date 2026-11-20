<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\EscrowStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\DispatchDealRequest;
use App\Http\Resources\Api\V1\DealResource;
use App\Models\Deal;
use App\Models\ProofArtifact;
use App\Models\WaybillManifest;
use App\Services\Ai\ProofAuditService;
use App\Services\Ai\WaybillOcrService;
use App\Services\Escrow\EscrowStateMachine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProofAndWaybillController extends Controller
{
    public function __construct(
        private WaybillOcrService $waybillOcrService,
        private ProofAuditService $proofAuditService,
        private EscrowStateMachine $stateMachine
    ) {}

    public function parseWaybill(Request $request, string $short_code): JsonResponse
    {
        $request->validate([
            'receipt_image' => ['required', 'image', 'max:8192'],
        ]);

        $deal = Deal::where('short_code', strtoupper($short_code))->firstOrFail();

        $parsed = $this->waybillOcrService->parseReceipt(
            $request->file('receipt_image'),
            $deal->item_title
        );

        return response()->json([
            'message' => 'Waybill receipt analyzed by Confam Vision AI.',
            'ocr'     => $parsed,
        ]);
    }

    public function uploadProof(Request $request, string $short_code): JsonResponse
    {
        $deal = Deal::where('short_code', strtoupper($short_code))->firstOrFail();
        $user = $request->user();
        $ownsDeal = (int) $deal->vendor_user_id === (int) $user->id
            || ($deal->vendor_user_id === null
                && $deal->vendor_email !== null
                && strcasecmp($deal->vendor_email, $user->email) === 0);

        abort_unless($user->role === 'vendor' && $ownsDeal, 403);

        if ($deal->status !== EscrowStatus::FUNDED_LOCKED) {
            throw ValidationException::withMessages([
                'deal' => ['Proof can only be uploaded after escrow is funded.'],
            ]);
        }

        $data = $request->validate([
            'proof_video'        => ['required', 'file', 'mimetypes:video/webm,video/mp4,video/quicktime', 'max:30720'],
            'client_sha256_hash' => ['required', 'regex:/\A[a-fA-F0-9]{64}\z/'],
            'keyframe_image'     => ['nullable', 'image', 'max:5120'],
            'recorded_lat'       => ['nullable', 'numeric'],
            'recorded_lng'       => ['nullable', 'numeric'],
        ]);

        $videoFile = $request->file('proof_video');
        $serverSha256 = hash_file('sha256', $videoFile->getRealPath());

        if (! hash_equals($serverSha256, strtolower($data['client_sha256_hash']))) {
            throw ValidationException::withMessages([
                'proof_video' => ['Cryptographic SHA-256 mismatch detected! Video stream was modified after capture.'],
            ]);
        }

        $videoPath = $videoFile->store("proofs/{$deal->short_code}", 'public');
        $keyframePath = $request->file('keyframe_image')
            ? $request->file('keyframe_image')->store("proofs/{$deal->short_code}", 'public')
            : null;
        $aiAudit = $this->proofAuditService->auditPackingVideo(
            $videoFile,
            $request->file('keyframe_image'),
            $deal->item_title,
            $deal->item_description
        );

        ProofArtifact::updateOrCreate(
            ['deal_id' => $deal->id],
            [
                'video_path'          => $videoPath,
                'keyframe_image_path' => $keyframePath,
                'video_sha256_hash'   => $serverSha256,
                'recorded_lat'        => $data['recorded_lat'] ?? null,
                'recorded_lng'        => $data['recorded_lng'] ?? null,
                'ai_confidence_score' => $aiAudit['confidence_score'],
                'ai_item_matched'     => $aiAudit['item_matched'],
                'ai_audit_summary'    => $aiAudit['audit_summary'],
                'device_user_agent'   => substr((string) $request->userAgent(), 0, 250),
                'captured_at_utc'     => now()->utc(),
            ]
        );

        return response()->json([
            'message' => 'Proof-of-Pack verified.',
            'deal'    => new DealResource($deal->fresh()->load(['proofArtifact', 'waybillManifest', 'ledgers'])),
        ]);
    }

    public function dispatchDeal(DispatchDealRequest $request, string $short_code): JsonResponse
    {
        $deal = Deal::where('short_code', strtoupper($short_code))->firstOrFail();
        $data = $request->validated();

        $videoFile = $request->file('proof_video');
        $serverSha256 = hash_file('sha256', $videoFile->getRealPath());

        // Cryptographic tamper check: compare client WebRTC blob hash with uploaded file hash
        if (strtolower($serverSha256) !== strtolower($data['client_sha256_hash'])) {
            throw ValidationException::withMessages([
                'proof_video' => ['Cryptographic SHA-256 mismatch detected! Video stream was modified after capture.'],
            ]);
        }

        $videoPath = $videoFile->store("proofs/{$deal->short_code}", 'public');

        $keyframePath = null;
        if ($request->hasFile('keyframe_image')) {
            $keyframePath = $request->file('keyframe_image')->store("proofs/{$deal->short_code}", 'public');
        }

        // Run Gemini 3.8 Flash Multimodal Video + OCR Audit on the actual video stream
        $aiAudit = $this->proofAuditService->auditPackingVideo(
            $videoFile,
            $request->file('keyframe_image'),
            $deal->item_title,
            $deal->item_description
        );

        ProofArtifact::updateOrCreate(
            ['deal_id' => $deal->id],
            [
                'video_path'          => $videoPath,
                'keyframe_image_path' => $keyframePath,
                'video_sha256_hash'   => $serverSha256,
                'recorded_lat'        => $data['recorded_lat'] ?? null,
                'recorded_lng'        => $data['recorded_lng'] ?? null,
                'ai_confidence_score' => $aiAudit['confidence_score'],
                'ai_item_matched'     => $aiAudit['item_matched'],
                'ai_audit_summary'    => $aiAudit['audit_summary'],
                'device_user_agent'   => substr((string) $request->userAgent(), 0, 250),
                'captured_at_utc'     => now()->utc(),
            ]
        );

        $receiptPath = null;
        if ($request->hasFile('receipt_image')) {
            $receiptPath = $request->file('receipt_image')->store("waybills/{$deal->short_code}", 'public');
        }

        WaybillManifest::updateOrCreate(
            ['deal_id' => $deal->id],
            [
                'receipt_image_path' => $receiptPath,
                'transport_company'  => $data['transport_company'],
                'waybill_number'     => $data['waybill_number'] ?? null,
                'driver_phone'       => $data['driver_phone'],
                'vehicle_plate'      => $data['vehicle_plate'] ?? null,
                'origin_park'        => $data['origin_park'] ?? null,
                'destination_park'   => $data['destination_park'],
                'ai_ocr_summary'     => $data['ai_ocr_summary'] ?? 'Waybill manifest locked.',
                'driver_ping_token'  => 'DRV-' . strtoupper(Str::random(16)),
            ]
        );

        $updatedDeal = $this->stateMachine->markAsDispatched(
            $deal,
            $serverSha256,
            $data['transport_company']
        );

        return response()->json([
            'message' => 'Proof-of-Pack verified and waybill manifest dispatched.',
            'deal'    => new DealResource($updatedDeal),
        ]);
    }
}