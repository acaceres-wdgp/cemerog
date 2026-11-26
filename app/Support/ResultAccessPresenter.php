<?php

namespace App\Support;

use App\Actions\Results\GenerateResultAccessCode;
use App\Actions\Results\ResultCode;
use App\Models\Account;
use App\Models\ResultAccessCode;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

/**
 * The results code of an account as printed on the invoice and the receipt
 * and shown in Facturación: the code, the portal link and its QR (SVG made
 * on the server).
 */
class ResultAccessPresenter
{
    /** @return array{code: string, url: string, display_url: string, qr: string, expires_on: string}|null */
    public static function forAccount(Account $account): ?array
    {
        $code = GenerateResultAccessCode::currentFor($account);

        return $code ? self::present($code) : null;
    }

    /** @return array{code: string, url: string, display_url: string, qr: string, expires_on: string} */
    public static function present(ResultAccessCode $code): array
    {
        $plain = ResultCode::format($code->code_encrypted);
        $url = route('portal', ['c' => $plain]);

        return [
            'code' => $plain,
            'url' => $url,
            // What fits on paper: host and path, no scheme
            'display_url' => preg_replace('#^https?://#', '', route('portal')) ?? route('portal'),
            'qr' => 'data:image/svg+xml;base64,'.base64_encode(self::qr($url)),
            'expires_on' => $code->expires_at->format('d/m/Y'),
        ];
    }

    private static function qr(string $text): string
    {
        $writer = new Writer(new ImageRenderer(new RendererStyle(160, 1), new SvgImageBackEnd));

        return $writer->writeString($text);
    }
}
