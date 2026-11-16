<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deals', function (Blueprint $table) {
            $table->id();
            $table->string('short_code', 16)->unique()->index(); 
            $table->foreignId('vendor_user_id')->nullable()->constrained('users')->nullOnDelete();

            // Guest / Instant Vendor Details & Management Token
            $table->string('vendor_name', 120);
            $table->string('vendor_phone', 20);
            $table->string('vendor_email', 120)->nullable();
            $table->string('vendor_bank_code', 15);
            $table->string('vendor_bank_name', 100)->nullable();
            $table->string('vendor_account_number', 15);
            $table->string('vendor_account_name', 120);
            $table->string('paystack_recipient_code', 60)->nullable();
            $table->string('vendor_manage_token', 64)->unique();

            // Buyer Contact Details (No Signup Required)
            $table->string('buyer_name', 120)->nullable();
            $table->string('buyer_phone', 20);
            $table->string('buyer_email', 120);

            // Deal Item & Financials (Stored in Kobo to prevent float rounding bugs)
            $table->string('item_title', 160);
            $table->text('item_description')->nullable();
            $table->unsignedBigInteger('item_amount_kobo');
            $table->unsignedBigInteger('waybill_fee_kobo')->default(0);
            $table->unsignedBigInteger('platform_fee_kobo'); 
            $table->unsignedBigInteger('total_payable_kobo');

            // State & Delivery Mode
            $table->string('delivery_mode', 30)->default('INTERSTATE_WAYBILL');
            $table->string('status', 35)->default('AWAITING_PAYMENT')->index();

            // Security & OTP Verification (Criterion #5)
            $table->string('release_otp_hash')->nullable();
            $table->unsignedTinyInteger('otp_attempts')->default(0);
            $table->timestamp('otp_locked_until')->nullable();

            // Paystack References & Timestamps
            $table->string('paystack_reference', 80)->unique()->nullable();
            $table->string('paystack_transfer_code', 80)->nullable();
            $table->text('dispute_reason')->nullable();
            $table->timestamp('funded_at')->nullable();
            $table->timestamp('dispatched_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('disputed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deals');
    }
};