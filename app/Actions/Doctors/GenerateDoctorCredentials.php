<?php

namespace App\Actions\Doctors;

use App\Models\User;

/**
 * Generates system credentials for a doctor user.
 *
 * Returns ['user' => User, 'plainPassword' => string]
 */
class GenerateDoctorCredentials
{
    /** Readable alphabet: no ambiguous chars (0, O, l, 1) */
    private const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';

    /**
     * Create a new User with role `medico` for the given doctor name.
     *
     * @return array{user: User, plainPassword: string}
     */
    public function handle(string $doctorName): array
    {
        $username = $this->previewUsername($doctorName);
        $plainPassword = $this->generatePassword();

        $user = User::create([
            'name' => $this->stripPrefix($doctorName),
            'username' => $username,
            'password' => $plainPassword,
            'is_active' => true,
            'must_change_password' => true,
        ]);

        $user->assignRole('medico');

        return ['user' => $user, 'plainPassword' => $plainPassword];
    }

    /**
     * Compute the username that would be generated for the given name,
     * including numeric suffix if there are collisions.
     * This is public to allow unit-testing the normalization logic.
     */
    public function previewUsername(string $doctorName): string
    {
        $base = $this->buildBaseUsername($doctorName);

        if (! User::where('username', $base)->exists()) {
            return $base;
        }

        $suffix = 2;
        while (User::where('username', $base.$suffix)->exists()) {
            $suffix++;
        }

        return $base.$suffix;
    }

    /**
     * Generate a 10-character readable random password.
     * Alphabet excludes 0, O, l, 1 to avoid ambiguity.
     */
    public function generatePassword(): string
    {
        $alphabet = str_split(self::ALPHABET);
        $length = count($alphabet);
        $password = '';

        for ($i = 0; $i < 10; $i++) {
            $password .= $alphabet[random_int(0, $length - 1)];
        }

        return $password;
    }

    /**
     * Particles that are skipped when looking for the first surname.
     * Common in Dominican Republic and Spanish-speaking world.
     */
    private const PARTICLES = ['de', 'del', 'la', 'las', 'los', 'y'];

    /**
     * Build the base username (no suffix) from a doctor name.
     * Format: first letter of first name + first non-particle surname, lowercased, no accents.
     * Strips Dr./Dra. prefix, skips particles (de, del, la, las, los, y),
     * and strips hyphens/apostrophes from the chosen surname.
     *
     * Compound first names: when 4+ words and words[1] is not a particle,
     * treat words[0..1] as the first name and start searching for the surname at index 2.
     */
    private function buildBaseUsername(string $doctorName): string
    {
        $name = $this->stripPrefix($doctorName);

        // Split into words
        $words = preg_split('/\s+/', trim($name));
        $words = array_values(array_filter($words));

        if (count($words) === 0) {
            return 'medico';
        }

        // First letter of first name (always the first word)
        $firstLetter = mb_strtolower(mb_substr($words[0], 0, 1));

        // Determine starting search index for surname.
        // For 4+ words: if words[1] is NOT a particle, we have a compound first name
        // (e.g. "María Isabel Pérez Torres") → start at index 2.
        // Otherwise: start at index 1 and skip any particles.
        $start = 1;
        if (count($words) >= 4 && ! in_array(mb_strtolower($words[1]), self::PARTICLES, true)) {
            $start = 2;
        }

        // Walk from $start, skip particles, take first non-particle word as surname
        $surname = null;
        for ($i = $start; $i < count($words); $i++) {
            $lower = mb_strtolower($words[$i]);
            if (! in_array($lower, self::PARTICLES, true)) {
                $surname = $words[$i];
                break;
            }
        }

        if ($surname === null) {
            $surname = $words[0];
        }

        // Strip hyphens, apostrophes, and any non-alphanumeric after normalization
        $base = $firstLetter.mb_strtolower($surname);
        $base = $this->removeAccents($base);
        $base = preg_replace('/[^a-z0-9]/', '', $base) ?? $base;

        return $base;
    }

    /**
     * Strip Dr. / Dra. prefix from a name.
     */
    private function stripPrefix(string $name): string
    {
        return preg_replace('/^Dr[a]?\.\s+/iu', '', trim($name)) ?? trim($name);
    }

    /**
     * Convert accented characters to ASCII equivalents.
     */
    private function removeAccents(string $value): string
    {
        $accents = [
            'à' => 'a', 'á' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a', 'å' => 'a',
            'è' => 'e', 'é' => 'e', 'ê' => 'e', 'ë' => 'e',
            'ì' => 'i', 'í' => 'i', 'î' => 'i', 'ï' => 'i',
            'ò' => 'o', 'ó' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o',
            'ù' => 'u', 'ú' => 'u', 'û' => 'u', 'ü' => 'u',
            'ý' => 'y', 'ÿ' => 'y',
            'ñ' => 'n', 'ç' => 'c',
        ];

        return strtr($value, $accents);
    }
}
