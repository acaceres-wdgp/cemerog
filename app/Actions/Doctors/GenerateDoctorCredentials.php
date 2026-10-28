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
     * Build the base username (no suffix) from a doctor name.
     * Format: first letter of first name + first surname, lowercased, no accents.
     * Strips Dr./Dra. prefix and handles compound first names.
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

        // First surname: for compound names (4+ words) treat last 2 words as surnames
        // so surname index = count - 2. For 1-3 words, use word at index 1 (or 0).
        $surnameIndex = count($words) >= 4 ? count($words) - 2 : 1;
        $surname = $words[$surnameIndex] ?? $words[0];

        $base = $firstLetter.mb_strtolower($surname);

        return $this->removeAccents($base);
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
