<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proof_artifacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deal_id')->constrained('deals')->cascadeOnDelete();
            $table->string('video_path');
            $table->string('keyframe_image_path')->nullable();
            $table->char('video_sha256_hash', 64); 
            $table->decimal('recorded_lat', 10, 7)->nullable();
            $table->decimal('recorded_lng', 10, 7)->nullable();
            $table->unsignedSmallInteger('ai_confidence_score')->nullable(); 
            $table->boolean('ai_item_matched')->default(true);
            $table->string('ai_audit_summary', 255)->nullable();
            $table->string('device_user_agent', 255)->nullable();
            $table->timestamp('captured_at_utc');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proof_artifacts');
    }
};