<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WaybillManifest extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'last_known_lat' => 'float',
            'last_known_lng' => 'float',
            'last_pinged_at' => 'datetime',
        ];
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class);
    }
}