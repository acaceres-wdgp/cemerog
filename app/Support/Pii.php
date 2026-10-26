<?php

namespace App\Support;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;
use RuntimeException;

/**
 * Helpers for encrypting / decrypting PII columns (phone, document_number).
 *
 * Always encrypts with Crypt::encryptString (no PHP serialization), consistent
 * with the 'encrypted' cast used for email.
 */
final class Pii
{
    /**
     * Encrypt a PII string using encryptString (no serialization).
     * Returns null for null / empty strings.
     */
    public static function encrypt(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return Crypt::encryptString($value);
    }

    /**
     * Decrypt a PII string encrypted with Crypt::encryptString.
     *
     * @throws RuntimeException when the value cannot be recovered.
     */
    public static function decrypt(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (DecryptException $e) {
            throw new RuntimeException(
                'Pii::decrypt failed – value is not a valid ciphertext: '.$e->getMessage(),
                previous: $e,
            );
        }
    }

    /**
     * Compute an HMAC-SHA256 hash for a document number, normalised by document type.
     *
     * Normalisation rules:
     *   - cedula:             digits only          (001-1234567-8 → 00112345678)
     *   - pasaporte /
     *     cedula_extranjera:  uppercase [A-Z0-9]   (ab-123 456 → AB123456)
     *   - no_tiene:           uppercase [A-Z0-9]   (GEN-ab12cd34 → GENAB12CD34)
     *
     * This guarantees that two passports / foreign IDs with the same characters
     * but different letters do NOT produce the same hash (unlike the old digits-only
     * approach that mapped AB123456 and XY123456 to the same value).
     */
    public static function documentHash(string $type, string $number): string
    {
        $normalized = match ($type) {
            'cedula' => preg_replace('/[^\d]/', '', $number) ?? $number,
            default => strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $number) ?? $number),
        };

        // Safety: if normalisation produced an empty string, fall back to full value.
        if ($normalized === '') {
            $normalized = $number;
        }

        return hash_hmac('sha256', $normalized, config('app.key'));
    }

    /**
     * Compute an HMAC-SHA256 hash over digits-only normalised value.
     *
     * @param  bool  $fallbackToFull  When true and no digits are found, hash the full string.
     *                                Used for document_number which may be alphanumeric.
     */
    public static function hash(?string $value, bool $fallbackToFull = false): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $digits = preg_replace('/[^\d]/', '', $value);

        if ($digits === null || $digits === '') {
            if ($fallbackToFull) {
                return hash_hmac('sha256', $value, config('app.key'));
            }

            return null;
        }

        return hash_hmac('sha256', $digits, config('app.key'));
    }
}
