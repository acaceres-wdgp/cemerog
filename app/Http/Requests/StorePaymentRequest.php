<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\PaymentRules;
use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    use PaymentRules;

    public function authorize(): bool
    {
        return $this->user()->can('module.caja.access');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return $this->paymentRules();
    }
}
