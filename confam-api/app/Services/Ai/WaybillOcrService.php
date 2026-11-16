<?php

namespace App\Services\Ai;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

class WaybillOcrService
{
    public function parseReceipt(UploadedFile $image, string $expectedItemTitle = ''): array
    {
        $apiKey = (string) config('services.gemini.api_key');
        $model  = (string) config('services.gemini.model', 'gemini-2.5-flash');

        // Fallback if GEMINI_API_KEY is not yet set in local .env
        if (blank($apiKey) || str_starts_with($apiKey, 'your_google_gemini')) {
            return [
                'transport_company' => 'Peace Mass Transit (PMT)',
                'waybill_number'    => 'PMT-AWK-' . random_int(10000, 99999),
                'driver_phone'      => '0803' . random_int(1000000, 9999999),
                'vehicle_plate'     => 'ANR-' . random_int(100, 999) . 'AA',
                'origin_park'       => 'Upper Iweka Park, Onitsha',
                'destination_park'  => 'Unizik Tempsite Park, Awka',
                'is_valid_receipt'  => true,
                'ai_summary_note'   => 'AI OCR Demo Mode: Set GEMINI_API_KEY in .env for live vision extraction.',
            ];
        }

        $base64Image = base64_encode(file_get_contents($image->getRealPath()));
        $mimeType    = $image->getMimeType() ?: 'image/jpeg';

        $prompt = <<<PROMPT
        You are a Nigerian motor-park waybill & logistics OCR verification AI.
        Inspect this image of a waybill receipt, manifest, or package label (e.g., Peace Mass Transit, GUO Transport, ITC, GIG, ABC, or handwritten park ticket).
        Extract all visible fields accurately. If a field is missing or illegible, return null for that field.
        Context item being shipped: "{$expectedItemTitle}".
        PROMPT;

        $response = Http::timeout(18)->post(
            "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}",
            [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                            [
                                'inline_data' => [
                                    'mime_type' => $mimeType,
                                    'data'      => $base64Image,
                                ],
                            ],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'responseMimeType' => 'application/json',
                    'responseSchema'   => [
                        'type'       => 'OBJECT',
                        'properties' => [
                            'transport_company' => ['type' => 'STRING', 'nullable' => true],
                            'waybill_number'    => ['type' => 'STRING', 'nullable' => true],
                            'driver_phone'      => ['type' => 'STRING', 'nullable' => true],
                            'vehicle_plate'     => ['type' => 'STRING', 'nullable' => true],
                            'origin_park'       => ['type' => 'STRING', 'nullable' => true],
                            'destination_park'  => ['type' => 'STRING', 'nullable' => true],
                            'is_valid_receipt'  => ['type' => 'BOOLEAN'],
                            'ai_summary_note'   => ['type' => 'STRING'],
                        ],
                        'required' => ['is_valid_receipt', 'ai_summary_note'],
                    ],
                ],
            ]
        );

        if ($response->failed()) {
            return [
                'transport_company' => null,
                'waybill_number'    => null,
                'driver_phone'      => null,
                'vehicle_plate'     => null,
                'origin_park'       => null,
                'destination_park'  => null,
                'is_valid_receipt'  => false,
                'ai_summary_note'   => 'Manual entry enabled (AI Vision temporarily unreachable).',
            ];
        }

        $rawJson = data_get($response->json(), 'candidates.0.content.parts.0.text', '{}');

        return json_decode($rawJson, true) ?: [];
    }
}