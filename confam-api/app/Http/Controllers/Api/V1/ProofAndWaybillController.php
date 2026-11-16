<?php

namespace App\Http\Controllers\Api\V1;

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