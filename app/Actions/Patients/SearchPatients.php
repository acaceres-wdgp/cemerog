<?php

namespace App\Actions\Patients;

use App\Models\Patient;
use Illuminate\Support\Collection;

/**
 * Search patients by name, document number, or phone.
 *
 * Rules:
 *  - Minimum 3 characters; returns empty collection otherwise.
 *  - Pure-digit input (optionally formatted with hyphens, spaces, parentheses):
 *    exact match via document_number_hash OR phone_hash (digits-only normalisation).
 *  - Text input: LIKE search on first_names and last_names; each space-separated
 *    word narrows results (AND semantics).
 *  - Limit: at most $limit results (default 10).
 */
class SearchPatients
{
    /**
     * @return Collection<int, Patient>
     */
    public function handle(string $query, int $limit = 10): Collection
    {
        $q = trim($query);

        if (mb_strlen($q) < 3) {
            return collect();
        }

        // Strip all non-digit characters to detect a numeric query
        $digitsOnly = preg_replace('/[^\d]/', '', $q) ?? '';

        // If the query has no letters, treat it as a document/phone number.
        if ($digitsOnly !== '' && ! preg_match('/[a-zA-ZÀ-ÖØ-öø-ÿ]/', $q)) {
            $hash = hash_hmac('sha256', $digitsOnly, config('app.key'));

            return Patient::query()
                ->where(function ($inner) use ($hash) {
                    $inner->where('document_number_hash', $hash)
                        ->orWhere('phone_hash', $hash);
                })
                ->limit($limit)
                ->get();
        }

        // Text search: split into words and apply AND between them.
        $words = preg_split('/\s+/', $q, -1, PREG_SPLIT_NO_EMPTY) ?: [$q];

        return Patient::query()
            ->where(function ($outer) use ($words) {
                foreach ($words as $word) {
                    $outer->where(function ($inner) use ($word) {
                        $inner->where('first_names', 'like', "%{$word}%")
                            ->orWhere('last_names', 'like', "%{$word}%");
                    });
                }
            })
            ->orderBy('last_names')
            ->orderBy('first_names')
            ->limit($limit)
            ->get();
    }
}
