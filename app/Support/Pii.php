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
 *
 * Decryption is tolerant of three legacy ciphertext formats that may exist:
 *   1. encryptString (current)         → decryptString works directly.
 *   2. encrypt() serialized (legacy)   → decryptString gives s:N:"…"; we unserialize.
 *   3. Double-encrypted                → outer layer reveals inner ciphertext;
 *                                        we decrypt the inner layer as well.
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
     * Decrypt a PII string, tolerating three legacy ciphertext formats.
     *
     * @throws RuntimeException when the value cannot be recovered.
     */
    public static function decrypt(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        try {
            $plain = Crypt::decryptString($value);
        } catch (DecryptException $e) {
            throw new RuntimeException(
                'Pii::decrypt failed – value is not a valid ciphertext: '.$e->getMessage(),
                previous: $e,
            );
        }

        // Format 2: encrypt() serialized → decryptString gives s:N:"...";
        if (str_starts_with($plain, 's:')) {
            $unserialized = @unserialize($plain);
            if (is_string($unserialized)) {
                // The unserialized value may itself be another ciphertext (double-encrypted).
                if (self::looksEncrypted($unserialized)) {
                    try {
                        return Crypt::decryptString($unserialized);
                    } catch (DecryptException) {
                        // Treat as plain text
                    }
                }

                return $unserialized;
            }
        }

        // Format 3: encryptString(encryptString(...)) or encryptString(encrypt(...))
        if (self::looksEncrypted($plain)) {
            try {
                $inner = Crypt::decryptString($plain);

                // The inner may itself be a serialized string (legacy encrypt() was wrapped)
                if (str_starts_with($inner, 's:')) {
                    $unserialized = @unserialize($inner);
                    if (is_string($unserialized)) {
                        return $unserialized;
                    }
                }

                return $inner;
            } catch (DecryptException) {
                // Fall through and return plain as-is (shouldn't happen in practice)
            }
        }

        return $plain;
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

    /**
     * Check whether a string looks like a Crypt JSON payload
     * (base64-encoded JSON object with iv, value and mac keys).
     */
    private static function looksEncrypted(string $value): bool
    {
        $decoded = base64_decode($value, strict: true);
        if ($decoded === false) {
            return false;
        }

        $data = json_decode($decoded, associative: true);

        return is_array($data)
            && array_key_exists('iv', $data)
            && array_key_exists('value', $data)
            && array_key_exists('mac', $data);
    }
}
