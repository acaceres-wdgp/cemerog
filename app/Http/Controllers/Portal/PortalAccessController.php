<?php

namespace App\Http\Controllers\Portal;

use App\Actions\Results\ResultCode;
use App\Http\Controllers\Controller;
use App\Http\Middleware\EnsurePortalSession;
use App\Models\ResultAccessCode;
use App\Models\ResultAccessLog;
use App\Support\Clinic;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Results portal › access: the code of the invoice plus the patient's birth
 * date (second factor). The error never says which of the two failed; five
 * failures lock the IP and the code for 15 minutes.
 */
class PortalAccessController extends Controller
{
    public const MAX_ATTEMPTS = 5;

    public const LOCK_SECONDS = 15 * 60;

    public function show(Request $request): Response
    {
        return Inertia::render('portal/acceso', [
            // From the QR or a link: it only fills in the code, never enters
            'prefill' => mb_substr((string) $request->query('c', ''), 0, 20),
            'locked' => RateLimiter::tooManyAttempts($this->ipKey($request), self::MAX_ATTEMPTS),
            'expired' => (bool) $request->session()->get('portal.expired', false),
            'clinic' => Clinic::info(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $code = ResultCode::normalize((string) $request->input('code'));
        $birthDate = $this->parseDate((string) $request->input('birth_date'));

        $ipKey = $this->ipKey($request);
        $codeKey = $code !== null ? 'portal:code:'.ResultAccessCode::hashCode($code) : null;

        if ($this->locked($ipKey, $codeKey)) {
            ResultAccessLog::record($request, 'locked');

            return $this->fail('bloqueado');
        }
        if ($code === null || $birthDate === null) {
            return $this->fail('incompleto');
        }

        $access = ResultAccessCode::with('patient')->where('code_hash', ResultAccessCode::hashCode($code))->first();
        $birthOk = $access !== null && $access->patient->birth_date?->toDateString() === $birthDate->toDateString();

        if (! $birthOk) {
            RateLimiter::hit($ipKey, self::LOCK_SECONDS);
            RateLimiter::hit((string) $codeKey, self::LOCK_SECONDS);
            ResultAccessLog::record($request, 'login_fail', $access?->id);
            if ($this->locked($ipKey, $codeKey)) {
                ResultAccessLog::record($request, 'locked', $access?->id);

                return $this->fail('bloqueado');
            }

            return $this->fail('datos', [
                'remaining' => min(
                    RateLimiter::remaining($ipKey, self::MAX_ATTEMPTS),
                    RateLimiter::remaining((string) $codeKey, self::MAX_ATTEMPTS),
                ),
            ]);
        }

        if (! $access->isUsable()) {
            ResultAccessLog::record($request, 'login_fail', $access->id, ['reason' => 'expired']);
            $ended = $access->revoked_at !== null && $access->revoked_at->lt($access->expires_at)
                ? $access->revoked_at
                : $access->expires_at;

            return $this->fail('vencido', ['date' => $ended->format('d/m/Y')]);
        }

        RateLimiter::clear($ipKey);
        RateLimiter::clear((string) $codeKey);
        $request->session()->regenerate();
        $request->session()->put('portal.code_id', $access->id);
        $request->session()->put('portal.last_seen', now()->timestamp);
        $access->update(['last_used_at' => now()]);
        ResultAccessLog::record($request, 'login_ok', $access->id);

        return redirect()->route('portal.results');
    }

    public function logout(Request $request): RedirectResponse
    {
        EnsurePortalSession::forget($request);
        $request->session()->regenerate();

        return redirect()->route('portal');
    }

    private function ipKey(Request $request): string
    {
        return 'portal:ip:'.$request->ip();
    }

    /**
     * The limiter changes on every hit, so this is not a pure function.
     *
     * @phpstan-impure
     */
    private function locked(string $ipKey, ?string $codeKey): bool
    {
        return RateLimiter::tooManyAttempts($ipKey, self::MAX_ATTEMPTS)
            || ($codeKey !== null && RateLimiter::tooManyAttempts($codeKey, self::MAX_ATTEMPTS));
    }

    /** @param  array<string, mixed>  $extra */
    private function fail(string $type, array $extra = []): RedirectResponse
    {
        Inertia::flash('access_error', ['type' => $type, ...$extra]);

        return redirect()->route('portal');
    }

    /** DD/MM/AAAA, a real date */
    private function parseDate(string $value): ?Carbon
    {
        if (! preg_match('#^(\d{2})/(\d{2})/(\d{4})$#', trim($value), $m) || ! checkdate((int) $m[2], (int) $m[1], (int) $m[3])) {
            return null;
        }

        return Carbon::createFromDate((int) $m[3], (int) $m[2], (int) $m[1])->startOfDay();
    }
}
