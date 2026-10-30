<?php

namespace App\Support;

class AllergyChecker
{
    /**
     * Terms that mean "no known allergies". Matched after normalization (no accents, lowercase).
     */
    private const NONE_TERMS = [
        'no', 'ninguna', 'ninguno', 'niega', 'n/a', 'na', 'nkda',
        'no conocidas', 'no refiere', 'desconoce',
    ];

    /**
     * Normalize a string for allergy comparison:
     * removes accents and lowercases.
     */
    public static function normalize(string $text): string
    {
        $normalized = \Normalizer::normalize($text, \Normalizer::FORM_D);
        if ($normalized === false) {
            $normalized = $text;
        }

        // Strip combining characters (accents)
        return (string) preg_replace('/\p{Mn}/u', '', $normalized);
    }

    /**
     * Returns true when $medication conflicts with any allergy term in $allergies.
     *
     * Rules:
     * 1. Split allergies by ,  ;  /  and the word « y »
     * 2. Ignore "none" responses (no, ninguna, nkda, etc.) and empty terms
     * 3. Ignore terms shorter than 4 characters
     * 4. Conflict if any WORD in the medication STARTS WITH the allergy term
     *    (accent-insensitive, case-insensitive)
     */
    public static function conflict(string $allergies, string $medication): bool
    {
        if ($allergies === '') {
            return false;
        }

        // Split on , ; / and the word " y "
        $rawTerms = preg_split('/[,;\/]|\s+y\s+/iu', $allergies) ?: [];

        $terms = [];
        foreach ($rawTerms as $raw) {
            $normalized = mb_strtolower(trim(self::normalize($raw)));
            if ($normalized === '') {
                continue;
            }
            // Ignore "none" phrases
            if (in_array($normalized, self::NONE_TERMS, true)) {
                continue;
            }
            // Ignore terms shorter than 4 characters
            if (mb_strlen($normalized) < 4) {
                continue;
            }
            $terms[] = $normalized;
        }

        if (empty($terms)) {
            return false;
        }

        $medNormalized = mb_strtolower(self::normalize($medication));

        // Split medication into words (any non-letter boundary)
        $medWords = preg_split('/[^a-z]/u', $medNormalized, -1, PREG_SPLIT_NO_EMPTY) ?: [];

        foreach ($terms as $term) {
            // Also try the de-pluralized stem (strip trailing 's' when term ends in it)
            $stem = mb_substr($term, -1) === 's' && mb_strlen($term) > 4
                ? mb_substr($term, 0, -1)
                : $term;

            foreach ($medWords as $word) {
                if (str_starts_with($word, $term) || ($stem !== $term && str_starts_with($word, $stem))) {
                    return true;
                }
            }
        }

        return false;
    }
}
