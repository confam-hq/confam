<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class DispatchDealRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vendor_manage_token' => ['nullable', 'string'],
            'proof_video'         => ['required', 'file', 'mimetypes:video/webm,video/mp4,video/quicktime', 'max:30720'], // max 30MB
            'keyframe_image'      => ['nullable', 'image', 'max:5120'],
            'client_sha256_hash'  => ['required', 'string', 'size:64'],
            'recorded_lat'        => ['nullable', 'numeric'],
            'recorded_lng'        => ['nullable', 'numeric'],

            // Waybill / Dispatch Fields
            'receipt_image'       => ['nullable', 'image', 'max:8192'],
            'transport_company'   => ['required', 'string', 'max:120'],
            'waybill_number'      => ['nullable', 'string', 'max:80'],
            'driver_phone'        => ['required', 'string', 'max:25'],
            'vehicle_plate'       => ['nullable', 'string', 'max:30'],
            'origin_park'         => ['nullable', 'string', 'max:120'],
            'destination_park'    => ['required', 'string', 'max:120'],
            'ai_ocr_summary'      => ['nullable', 'string', 'max:255'],
        ];
    }
}