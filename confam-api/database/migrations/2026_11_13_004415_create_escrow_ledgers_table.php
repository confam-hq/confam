<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('escrow_ledgers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deal_id')->constrained('deals')->cascadeOnDelete();
            $table->string('event_type', 50); 
            $table->string('direction', 10);  
            $table->unsignedBigInteger('amount_kobo');
            $table->string('idempotency_key', 100)->unique();
            $table->string('actor_role', 30)->default('SYSTEM'); 
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('escrow_ledgers');
    }
};