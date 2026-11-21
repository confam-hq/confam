<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('terms_accepted_at')->nullable();
            $table->timestamp('privacy_accepted_at')->nullable();
        });

        DB::table('users')->whereNull('email_verified_at')->update(['email_verified_at' => now()]);

        Schema::create('auth_otp_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('purpose', 30);
            $table->string('code_hash');
            $table->timestamp('expires_at');
            $table->timestamps();
            $table->unique(['user_id', 'purpose']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auth_otp_codes');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['email_verified_at', 'terms_accepted_at', 'privacy_accepted_at']);
        });
    }
};
