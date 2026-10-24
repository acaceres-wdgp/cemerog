/**
 * Regression test: cleaned pages must not contain hardcoded hex color literals.
 * All colors must use the design tokens defined in resources/css/app.css.
 *
 * Add a file or directory to CLEAN_PAGES once its hex colors have been migrated
 * to tokens. Directories are scanned recursively for *.tsx and *.ts files.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { expect, test } from 'vitest';

const PAGES_DIR = join(import.meta.dirname, '../pages');

/**
 * Pages / directories that have been fully migrated to design tokens.
 * Add new entries here after migrating a page.
 */
const CLEAN_PAGES = ['pacientes/index.tsx', 'registro/index.tsx', 'tablero/'];

// Matches a 3- or 6-digit hex color, e.g. #2E8B3E or #333
const HEX_COLOR_RE = /#[0-9a-fA-F]{3,6}\b/;

/** Collect all .tsx/.ts files under a directory recursively */
function collectFiles(dir: string): string[] {
    const results: string[] = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
            results.push(...collectFiles(full));
        } else if (/\.(tsx?|ts)$/.test(entry)) {
            results.push(full);
        }
    }
    return results;
}

for (const relative of CLEAN_PAGES) {
    const fullPath = join(PAGES_DIR, relative);
    const isDir = relative.endsWith('/');
    const files = isDir ? collectFiles(fullPath) : [fullPath];

    for (const file of files) {
        const fileRelative = file.replace(PAGES_DIR + '/', '');
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

        test(`${fileRelative} no hardcoded hex colors`, () => {
            expect(violations).toEqual([]);
        });
    }
}
