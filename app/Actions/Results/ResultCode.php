<?php

namespace App\Actions\Results;

/**
 * Format of the results codes: CMG-XXXX-XXXX, 8 characters of an alphabet
 * without look-alikes (no 0/O, 1/I/L).
 */
class ResultCode
{
    public const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

    public const LENGTH = 8;

    public const PREFIX = 'CMG';

    /** A new random code, normalized (8 characters, no prefix) */
    public static function random(): string
    {
        $code = '';
        for ($i = 0; $i < self::LENGTH; $i++) {
            $code .= self::ALPHABET[random_int(0, strlen(self::ALPHABET) - 1)];
        }

        return $code;
    }

    /**
     * What the patient typed, as stored: uppercase, without dashes or
     * spaces and without the optional «CMG» prefix. Null if it cannot be a
     * code.
     */
    public static function normalize(?string $input): ?string
    {
        $code = preg_replace('/[^A-Z0-9]/', '', mb_strtoupper((string) $input)) ?? '';
        if (strlen($code) === self::LENGTH + strlen(self::PREFIX) && str_starts_with($code, self::PREFIX)) {
            $code = substr($code, strlen(self::PREFIX));
        }

        return strlen($code) === self::LENGTH ? $code : null;
    }

    /** CMG-XXXX-XXXX, as printed */
    public static function format(string $normalized): string
    {
        return self::PREFIX.'-'.substr($normalized, 0, 4).'-'.substr($normalized, 4);
    }
}
