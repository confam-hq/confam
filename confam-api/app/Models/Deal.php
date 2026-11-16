<?php

namespace App\Models;

use App\Enums\DeliveryMode;
use App\Enums\EscrowStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Deal extends Model
{
    protected $guarded = ['id'];

    protected $hidden = [
        'release_otp_hash',
        'vendor_manage_token',
    ];

    protected function casts(): array
    {
        return [
            'status'             => EscrowStatus::class,
            'delivery_mode'      => DeliveryMode::class,
            'item_amount_kobo'   => 'integer',
            'waybill_fee_kobo'   => 'integer',
            'platform_fee_kobo'  => 'integer',
            'total_payable_kobo' => 'integer',
            'otp_attempts'       => 'integer',
            'otp_locked_until'   => 'datetime',
            'funded_at'          => 'datetime',
            'dispatched_at'      => 'datetime',
            'completed_at'       => 'datetime',
            'disputed_at'        => 'datetime',
        ];
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendor_user_id');
    }

    public function proofArtifact(): HasOne
    {
        return $this->hasOne(ProofArtifact::class);
    }

    public function waybillManifest(): HasOne
    {
        return $this->hasOne(WaybillManifest::class);
    }

    public function ledgers(): HasMany
    {
        return $this->hasMany(EscrowLedger::class)->oldest();
    }
}