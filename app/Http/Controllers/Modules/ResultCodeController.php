<?php

namespace App\Http\Controllers\Modules;

use App\Actions\Results\GenerateResultAccessCode;
use App\Actions\Results\RegenerateResultAccessCode;
use App\Actions\Results\ResultCode;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\User;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Facturación › «Código de resultados»: a new code for a patient who lost it.
 * The previous one stops working.
 */
class ResultCodeController extends Controller
{
    public function regenerate(Request $request, Invoice $invoice, RegenerateResultAccessCode $action): RedirectResponse
    {
        abort_unless(GenerateResultAccessCode::accountHasResults($invoice->account), 404);
        /** @var User $user */
        $user = $request->user();

        $code = $action->handle($invoice->account, $user);
        Toast::success('Código nuevo: '.ResultCode::format($code->code_encrypted).'. El anterior ya no funciona.');

        return back();
    }
}
