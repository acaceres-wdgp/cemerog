/**
 * Client-side allergy conflict checker. Mirror of App\Support\AllergyChecker::conflict().
 *
 * Rules:
 * 1. Split allergies by , ; / and the word " y "
 * 2. Ignore "none" responses and empty terms
 * 3. Ignore terms shorter than 4 characters
 * 4. Conflict if any word in the medication starts with the allergy term
 *    (accent-insensitive, case-insensitive). Also tries de-pluralized stem.
 */

const NONE_TERMS = new Set([
    'no',
    'ninguna',
    'ninguno',
    'niega',
    'n/a',
    'na',
    'nkda',
    'no conocidas',
    'no refiere',
    'desconoce',
]);

function normalize(text: string): string {
    return text
        .normalize('NFD')
        .replace(/\p{Mn}/gu, '')
        .toLowerCase();
}

/**
 * Returns true when medication conflicts with any allergy term in allergies.
 */
export function conflict(allergies: string, medication: string): boolean {
    if (allergies === '') return false;

    const rawTerms = allergies.split(/[,;/]|\s+y\s+/iu);

    const terms: string[] = [];
    for (const raw of rawTerms) {
        const normalized = normalize(raw.trim());
        if (normalized === '') continue;
        if (NONE_TERMS.has(normalized)) continue;
        if (normalized.length < 4) continue;
        terms.push(normalized);
    }

    if (terms.length === 0) return false;

    const medNormalized = normalize(medication);
    const medWords = medNormalized.split(/[^a-z]+/).filter(Boolean);

    for (const term of terms) {
        // De-pluralized stem: strip trailing 's' when term ends in 's' and length > 4
        const stem =
            term.endsWith('s') && term.length > 4 ? term.slice(0, -1) : term;

        for (const word of medWords) {
            if (
                word.startsWith(term) ||
                (stem !== term && word.startsWith(stem))
            ) {
                return true;
            }
        }
    }

    return false;
}
