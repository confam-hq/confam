<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
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
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'paystack_recipient_code',
    ];

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
}
