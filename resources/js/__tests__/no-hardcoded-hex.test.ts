/**
 * Regression test: cleaned pages must not contain hardcoded hex color literals.
 * All colors must use the design tokens defined in resources/css/app.css.
 *
 * Add a file to CLEAN_PAGES once its hex colors have been migrated to tokens.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { expect, test } from 'vitest';

const PAGES_DIR = join(import.meta.dirname, '../pages');

/**
 * Pages that have been fully migrated to design tokens.
 * Add new entries here after migrating a page.
 */
const CLEAN_PAGES = ['pacientes/index.tsx', 'registro/index.tsx'];

// Matches a 3- or 6-digit hex color, e.g. #2E8B3E or #333
const HEX_COLOR_RE = /#[0-9a-fA-F]{3,6}\b/;

for (const relative of CLEAN_PAGES) {
    const file = join(PAGES_DIR, relative);
    const lines = readFileSync(file, 'utf-8').split('\n');
    const violations: { line: number; text: string }[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip pure comment lines
        if (/^\s*(\/\/|\/\*|\*)/.test(line)) continue;
        // Skip arbitrary font values like font-['Bitter']
        const stripped = line.replace(/font-\['[^']+'\]/g, '');
        if (HEX_COLOR_RE.test(stripped)) {
            violations.push({ line: i + 1, text: line.trim() });
        }
    }

    test(`${relative} no hardcoded hex colors`, () => {
        expect(violations).toEqual([]);
    });
}
