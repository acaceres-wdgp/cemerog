<?php

namespace App\Support;

class AllergyChecker
{
    /**
     * Normalize a string for allergy comparison:
     * removes accents and lowercases (caller can lowercase after).
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
}
