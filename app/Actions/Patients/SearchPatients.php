<?php

namespace App\Actions\Patients;

use App\Models\Patient;
use App\Support\Pii;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Search patients by name, document number, or phone.
 *
 * Rules:
 *  - Minimum 3 characters; returns empty collection otherwise.
 *  - Pure-digit input (optionally formatted with hyphens, spaces, parentheses):
 *    exact match via document_number_hash (cedula normalisation) OR phone_hash.
 *  - Single alphanumeric term with at least one digit AND at least one ASCII letter
 *    (e.g. AB123456): exact match via document_number_hash (passport normalisation)
 *    OR name LIKE search.
 *  - Text input (names): LIKE search on first_names and last_names; each
 *    space-separated word narrows results (AND semantics).
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

        return $this->applyTo(Patient::query(), $q)
            ->orderBy('last_names')
            ->orderBy('first_names')
            ->limit($limit)
            ->get();
    }

    /**
     * Apply search WHERE conditions to an existing query builder.
     * Returns the query unchanged when $q is shorter than 3 characters.
     *
     * @param  Builder<Patient>  $query
     * @return Builder<Patient>
     */
    public function applyTo(Builder $query, string $q): Builder
    {
        $q = trim($q);

        if (mb_strlen($q) < 3) {
            return $query;
        }

        $digitsOnly = preg_replace('/[^\d]/', '', $q) ?? '';

        if ($digitsOnly !== '' && ! preg_match('/[a-zA-ZÀ-ÖØ-öø-ÿ]/', $q)) {
            $cedulaHash = Pii::documentHash('cedula', $q);
            $phoneHash = Pii::hash($digitsOnly);

            return $query->where(function ($inner) use ($cedulaHash, $phoneHash) {
                $inner->where('document_number_hash', $cedulaHash)
                    ->orWhere('phone_hash', $phoneHash);
            });
        }

        $words = preg_split('/\s+/', $q, -1, PREG_SPLIT_NO_EMPTY) ?: [$q];
        $isAlphanumericWithDigit = count($words) === 1
            && $digitsOnly !== ''
            && preg_match('/[a-zA-Z]/', $q)
            && ! preg_match('/[À-ÖØ-öø-ÿ]/', $q);

        if ($isAlphanumericWithDigit) {
            $passportHash = Pii::documentHash('pasaporte', $q);

            return $query->where(function ($outer) use ($passportHash, $words) {
                $outer->where('document_number_hash', $passportHash);
                $outer->orWhere(function ($nameQuery) use ($words) {
                    foreach ($words as $word) {
                        $nameQuery->where(function ($inner) use ($word) {
                            $inner->where('first_names', 'like', "%{$word}%")
                                ->orWhere('last_names', 'like', "%{$word}%");
                        });
                    }
                });
            });
        }

        foreach ($words as $word) {
            $query->where(function ($inner) use ($word) {
                $inner->where('first_names', 'like', "%{$word}%")
                    ->orWhere('last_names', 'like', "%{$word}%");
            });
        }

        return $query;
    }
}
