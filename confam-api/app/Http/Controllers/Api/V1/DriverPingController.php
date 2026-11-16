<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\WaybillManifest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverPingController extends Controller
{
    public function show(string $ping_token): JsonResponse
    {
        $manifest = WaybillManifest::with('deal')
            ->where('driver_ping_token', $ping_token)
            ->firstOrFail();

        return response()->json([
            'short_code'          => $manifest->deal->short_code,
            'item_title'          => $manifest->deal->item_title,
            'transport_company'   => $manifest->transport_company,
            'waybill_number'      => $manifest->waybill_number,
            'destination_park'    => $manifest->destination_park,
            'buyer_phone_masked'  => substr($manifest->deal->buyer_phone, 0, 4) . '***' . substr($manifest->deal->buyer_phone, -3),
            'last_location_label' => $manifest->last_location_label,
            'last_pinged_at'      => $manifest->last_pinged_at?->toIso8601String(),
        ]);
    }

    public function storePing(Request $request, string $ping_token): JsonResponse
    {
        $validated = $request->validate([
            'lat'            => ['required', 'numeric'],
            'lng'            => ['required', 'numeric'],
            'location_label' => ['nullable', 'string', 'max:140'],
        ]);

        $manifest = WaybillManifest::where('driver_ping_token', $ping_token)->firstOrFail();

        $manifest->update([
            'last_known_lat'      => $validated['lat'],
            'last_known_lng'      => $validated['lng'],
            'last_location_label' => $validated['location_label'] ?? 'Live GPS Transit Ping Verified',
            'last_pinged_at'      => now(),
        ]);

        return response()->json([
            'message'        => 'Transit location ping confamed! Buyer tracking updated.',
            'last_pinged_at' => $manifest->last_pinged_at->toIso8601String(),
        ]);
    }
}