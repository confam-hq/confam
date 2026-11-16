<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProofArtifact extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'recorded_lat'        => 'float',
            'recorded_lng'        => 'float',
            'ai_confidence_score' => 'integer',
            'ai_item_matched'     => 'boolean',
            'captured_at_utc'     => 'datetime',
        ];
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class);
    }
}