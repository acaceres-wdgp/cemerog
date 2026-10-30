import { describe, it, expect } from 'vitest';
import { conflict } from '@/lib/allergy';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const cases =
    require('../../../../tests/fixtures/allergy-cases.json') as Array<{
        allergies: string;
        medication: string;
        expected: boolean;
        label: string;
    }>;

describe('allergy conflict – shared fixture', () => {
    for (const c of cases as Array<{
        allergies: string;
        medication: string;
        expected: boolean;
        label: string;
    }>) {
        it(c.label, () => {
            expect(conflict(c.allergies, c.medication)).toBe(c.expected);
        });
    }
});
