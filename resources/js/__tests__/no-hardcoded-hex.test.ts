/**
 * Regression test: cleaned pages must not contain hardcoded hex color literals
 * or static style={{ usages.
 *
 * All colors must use the design tokens defined in resources/css/app.css.
 * All layout/spacing must use Tailwind utility classes.
 *
 * Add a file or directory to CLEAN_PAGES once its hex colors and style={{
 * usages have been migrated to tokens.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { expect, test } from 'vitest';

const PAGES_DIR = join(import.meta.dirname, '../pages');
const COMPONENTS_DIR = join(import.meta.dirname, '../components');

/**
 * Files explicitly excluded from the scan (e.g. runtime palettes).
 * Paths are relative to PAGES_DIR.
 */
const EXCLUDED_FILES = new Set([
    // dynamic-style: avatar color palette selected at runtime from doctor ID
    'citas/lib/palettes.ts',
]);

/**
 * Pages/directories that have been fully migrated to design tokens.
 * Entries ending in '/' are scanned recursively for all .ts and .tsx files.
 * Add new entries here after migrating a page or directory.
 */
const CLEAN_PAGES = ['pacientes/index.tsx', 'registro/index.tsx', 'citas/'];

// Matches a 3- or 6-digit hex color, e.g. #2E8B3E or #333
const HEX_COLOR_RE = /#[0-9a-fA-F]{3,6}\b/;

/**
 * Resolve an entry to a list of absolute file paths.
 * If the entry ends with '/', scan recursively for .ts/.tsx files.
 */
function resolveEntry(entry: string): { abs: string; rel: string }[] {
    if (entry.endsWith('/')) {
        const dir = join(PAGES_DIR, entry);
        return collectFiles(dir, entry);
    }
    return [{ abs: join(PAGES_DIR, entry), rel: entry }];
}

function collectFiles(
    dir: string,
    prefix: string,
): { abs: string; rel: string }[] {
    const results: { abs: string; rel: string }[] = [];
    const entries = readdirSync(dir);
    for (const name of entries) {
        const abs = join(dir, name);
        const rel = relative(PAGES_DIR, abs);
        const stat = statSync(abs);
        if (stat.isDirectory()) {
            results.push(...collectFiles(abs, prefix));
        } else if (name.endsWith('.ts') || name.endsWith('.tsx')) {
            if (!EXCLUDED_FILES.has(rel)) {
                results.push({ abs, rel });
            }
        }
    }
    return results;
}

for (const entry of CLEAN_PAGES) {
    const files = resolveEntry(entry);

    for (const { abs, rel } of files) {
        const lines = readFileSync(abs, 'utf-8').split('\n');

        // ── Test 1: no hardcoded hex colors ──────────────────────────────────
        const hexViolations: { line: number; text: string }[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Skip pure comment lines
            if (/^\s*(\/\/|\/\*|\*)/.test(line)) continue;
            // Skip arbitrary font values like font-['Bitter']
            const stripped = line.replace(/font-\['[^']+'\]/g, '');
            if (HEX_COLOR_RE.test(stripped)) {
                hexViolations.push({ line: i + 1, text: line.trim() });
            }
        }

        test(`${rel} no hardcoded hex colors`, () => {
            expect(hexViolations).toEqual([]);
        });

        // ── Test 2: no static style={{ ───────────────────────────────────────
        // Fails if a line contains `style={{` AND neither:
        //   - the current line contains `// dynamic-style:` (inline comment), nor
        //   - the previous non-empty line starts with `// dynamic-style:`
        const styleViolations: { line: number; text: string }[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line.includes('style={{')) continue;

            // Allow inline comment on same line
            if (line.includes('// dynamic-style:')) continue;

            // Find the previous non-empty line
            let prevLineText = '';
            for (let j = i - 1; j >= 0; j--) {
                if (lines[j].trim() !== '') {
                    prevLineText = lines[j].trim();
                    break;
                }
            }

            if (!prevLineText.startsWith('// dynamic-style:')) {
                styleViolations.push({ line: i + 1, text: line.trim() });
            }
        }

        test(`${rel} no static style={{ (use Tailwind tokens instead)`, () => {
            expect(styleViolations).toEqual([]);
        });
    }
}
