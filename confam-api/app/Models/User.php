<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $attributes = [
        'role' => 'vendor',
    ];

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'bank_code',
        'bank_name',
        'account_number',
        'account_name',
        'paystack_recipient_code',
        'terms_accepted_at',
        'privacy_accepted_at',
        'avatar_path',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'paystack_recipient_code',
        'avatar_path',
    ];

    protected $appends = ['avatar_url'];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class, 'vendor_user_id');
    }

    public function getAvatarUrlAttribute(): ?string
    {
        return $this->avatar_path
            ? Storage::disk('public')->url($this->avatar_path)
            : null;
    }
}
