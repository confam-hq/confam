<?php

namespace App\Http\Requests\Api\V1;

use App\Enums\DeliveryMode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateDealRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vendor_name'           => ['required', 'string', 'max:120'],
            'vendor_phone'          => ['required', 'string', 'max:20'],
            'vendor_email'          => ['nullable', 'email', 'max:120'],
            'vendor_bank_code'      => ['required', 'string', 'max:15'],
            'vendor_bank_name'      => ['nullable', 'string', 'max:100'],
            'vendor_account_number' => ['required', 'string', 'digits:10'],
            'vendor_account_name'   => ['required', 'string', 'max:120'],

            'buyer_name'            => ['nullable', 'string', 'max:120'],
            'buyer_phone'           => ['required', 'string', 'max:20'],
            'buyer_email'           => ['required', 'email', 'max:120'],

            'item_title'            => ['required', 'string', 'max:160'],
            'item_description'      => ['nullable', 'string', 'max:2000'],
            'item_amount_naira'     => ['required', 'numeric', 'min:500'],
            'waybill_fee_naira'     => ['nullable', 'numeric', 'min:0'],
            'delivery_mode'         => ['required', Rule::enum(DeliveryMode::class)],
        ];
    }
}