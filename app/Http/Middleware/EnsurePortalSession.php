<?php

namespace App\Http\Middleware;

use App\Models\ResultAccessCode;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * The results portal session: only the id of the code, and it ends after 15
 * minutes without use or when the code stops working. Independent of the
 * staff authentication.
 */
class EnsurePortalSession
{
    public const IDLE_MINUTES = 15;

    public function handle(Request $request, Closure $next): Response
    {
        $session = $request->session();
        $codeId = $session->get('portal.code_id');
        $lastSeen = (int) $session->get('portal.last_seen', 0);

        $code = $codeId ? ResultAccessCode::find($codeId) : null;
        $idle = now()->timestamp - $lastSeen > self::IDLE_MINUTES * 60;

        if ($code === null || $idle || ! $code->isUsable()) {
            if ($codeId) {
                self::forget($request);
                $session->flash('portal.expired', true);
            }

            return redirect()->route('portal');
        }

        $session->put('portal.last_seen', now()->timestamp);
        $request->attributes->set('portal_code', $code);

        return $next($request);
    }

    public static function forget(Request $request): void
    {
        $request->session()->forget(['portal.code_id', 'portal.last_seen']);
    }
}
