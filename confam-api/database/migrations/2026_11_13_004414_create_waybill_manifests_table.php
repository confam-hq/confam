<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('waybill_manifests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deal_id')->constrained('deals')->cascadeOnDelete();
            $table->string('receipt_image_path')->nullable();
            $table->string('transport_company', 120); 
            $table->string('waybill_number', 80)->nullable();
            $table->string('driver_phone', 25);
            $table->string('vehicle_plate', 30)->nullable();
            $table->string('origin_park', 120)->nullable();
            $table->string('destination_park', 120);
            $table->string('ai_ocr_summary', 255)->nullable();

            // Zero-Install 1-Tap Driver Geolocation Ping
            $table->string('driver_ping_token', 48)->unique()->index();
            $table->decimal('last_known_lat', 10, 7)->nullable();
            $table->decimal('last_known_lng', 10, 7)->nullable();
            $table->string('last_location_label', 140)->nullable();
            $table->timestamp('last_pinged_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waybill_manifests');
    }
};