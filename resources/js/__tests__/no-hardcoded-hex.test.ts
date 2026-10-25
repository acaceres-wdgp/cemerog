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
const COMPONENTS_DIR = join(import.meta.dirname, '../components/cemerog');
const LAYOUTS_DIR = join(import.meta.dirname, '../layouts');

/**
 * Files explicitly excluded from the scan (e.g. runtime palettes).
 * Paths are relative to their respective root directory.
 */
const EXCLUDED_FILES = new Set<string>(['palettes.ts']);

/**
 * Pages/directories that have been fully migrated to design tokens.
 * Entries ending in '/' are scanned recursively for all .ts and .tsx files.
 * Add new entries here after migrating a page or directory.
 */
const CLEAN_PAGES = [
    'pacientes/index.tsx',
    'registro/index.tsx',
    'registro/edit.tsx',
    'registro/components/',
    'citas/',
    'tablero/',
];

// Matches a 3- or 6-digit hex color, e.g. #2E8B3E or #333
const HEX_COLOR_RE = /#[0-9a-fA-F]{3,6}\b/;

/**
 * Resolve an entry to a list of absolute file paths.
 * If the entry ends with '/', scan recursively for .ts/.tsx files.
 * Supports an optional base directory (defaults to PAGES_DIR).
 */
function resolveEntry(
    entry: string,
    baseDir = PAGES_DIR,
): { abs: string; rel: string }[] {
    if (entry.endsWith('/')) {
        const dir = join(baseDir, entry);
        return collectFiles(dir, baseDir);
    }
    return [{ abs: join(baseDir, entry), rel: entry }];
}

function collectFiles(
    dir: string,
    baseDir = PAGES_DIR,
): { abs: string; rel: string }[] {
    const results: { abs: string; rel: string }[] = [];
    const entries = readdirSync(dir);
    for (const name of entries) {
        const abs = join(dir, name);
        const rel = relative(baseDir, abs);
        const stat = statSync(abs);
        if (stat.isDirectory()) {
            results.push(...collectFiles(abs, baseDir));
        } else if (name.endsWith('.ts') || name.endsWith('.tsx')) {
            if (!EXCLUDED_FILES.has(name) && !EXCLUDED_FILES.has(rel)) {
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

// ── layouts/ scan ────────────────────────────────────────────────────────────
// Scans all .ts/.tsx files in the layouts directory.

const LAYOUT_FILES = collectFiles(LAYOUTS_DIR, LAYOUTS_DIR).filter(
    ({ rel }) => !rel.includes('__tests__'),
);

for (const { abs, rel } of LAYOUT_FILES) {
    const lines = readFileSync(abs, 'utf-8').split('\n');

    // ── Test 1: no hardcoded hex colors ──────────────────────────────────
    const hexViolations: { line: number; text: string }[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^\s*(\/\/|\/\*|\*)/.test(line)) continue;
        const stripped = line.replace(/font-\['[^']+'\]/g, '');
        if (HEX_COLOR_RE.test(stripped)) {
            hexViolations.push({ line: i + 1, text: line.trim() });
        }
    }

    test(`layouts/${rel} no hardcoded hex colors`, () => {
        expect(hexViolations).toEqual([]);
    });

    // ── Test 2: no static style={{ ───────────────────────────────────────
    const styleViolations: { line: number; text: string }[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.includes('style={{')) continue;

        if (line.includes('// dynamic-style:')) continue;

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

    test(`layouts/${rel} no static style={{ (use Tailwind tokens instead)`, () => {
        expect(styleViolations).toEqual([]);
    });
}

// ── components/cemerog/ scan ──────────────────────────────────────────────────
// Scans all .ts/.tsx files in the cemerog component library, excluding palettes.ts.
// Tests will fail until the full token migration is complete.

const CEMEROG_FILES = collectFiles(COMPONENTS_DIR, COMPONENTS_DIR).filter(
    ({ rel }) => !rel.includes('__tests__'),
);

for (const { abs, rel } of CEMEROG_FILES) {
    const lines = readFileSync(abs, 'utf-8').split('\n');

    // ── Test 1: no hardcoded hex colors ──────────────────────────────────
    const hexViolations: { line: number; text: string }[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^\s*(\/\/|\/\*|\*)/.test(line)) continue;
        const stripped = line.replace(/font-\['[^']+'\]/g, '');
        if (HEX_COLOR_RE.test(stripped)) {
            hexViolations.push({ line: i + 1, text: line.trim() });
        }
    }

    test(`cemerog/${rel} no hardcoded hex colors`, () => {
        expect(hexViolations).toEqual([]);
    });

    // ── Test 2: no static style={{ ───────────────────────────────────────
    const styleViolations: { line: number; text: string }[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.includes('style={{')) continue;

        if (line.includes('// dynamic-style:')) continue;

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

    test(`cemerog/${rel} no static style={{ (use Tailwind tokens instead)`, () => {
        expect(styleViolations).toEqual([]);
    });
}
