/**
 * Every printable document has an «Imprimir» button, hidden on paper, and
 * the shared clinic header (name, RNC, phone and address).
 */
import { describe, expect, it } from 'vitest';
import { PRINTABLE_PAGES } from '@/layouts/resolve-layout';

const pages = import.meta.glob('../pages/**/*.tsx', {
    query: '?raw',
    import: 'default',
    eager: true,
});

const source = (name: string) => pages[`../pages/${name}.tsx`] as string;

describe('printable pages', () => {
    it.each(PRINTABLE_PAGES)(
        '%s has a print button hidden on paper',
        (name) => {
            const src = source(name);
            expect(src, `${name} no existe`).toBeDefined();
            expect(src).toMatch(/onClick=\{\(\) => window\.print\(\)\}/);
            expect(src).toMatch(
                /print:hidden[^]*?window\.print\(\)[^]*?Imprimir/,
            );
        },
    );

    it.each(PRINTABLE_PAGES)('%s uses the shared clinic header', (name) => {
        expect(source(name)).toMatch(/<ClinicHeader\b/);
    });

    it.each(PRINTABLE_PAGES)(
        '%s shows the print button above the document, aligned with it',
        (name) => {
            const src = source(name);
            expect(src.indexOf('window.print()')).toBeLessThan(
                src.indexOf('<PrintablePage'),
            );
            expect(src).toMatch(
                /className="mx-auto mb-4 flex w-full max-w-\[816px\] print:hidden"/,
            );
        },
    );
});
