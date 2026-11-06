/**
 * Printable documents carry no browser header/footer (date, tab title, URL,
 * page number). Chrome draws them in the page margins, so the documents print
 * on a named page without margins and keep their spacing inside the document.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import PrintablePage from '@/components/cemerog/PrintablePage';

const css = readFileSync(join(process.cwd(), 'resources/css/app.css'), 'utf8');

describe('printable page margins', () => {
    it('marks every printable document', () => {
        const { container } = render(<PrintablePage>Hola</PrintablePage>);
        expect(container.firstElementChild).toHaveAttribute(
            'data-printable-page',
        );
    });

    it('prints documents on a page without margins', () => {
        expect(css).toMatch(
            /@page\s+printable\s*\{[^}]*margin:\s*0\s*;[^}]*\}/,
        );
        expect(css).toMatch(
            /\[data-printable-page\]\s*\{[^}]*page:\s*printable\s*;/,
        );
    });

    it('keeps the spacing inside the document instead', () => {
        expect(css).toMatch(
            /\[data-printable-page\]\s*\{[^}]*padding:\s*\d+mm\s+\d+mm\s*!important;/,
        );
    });
});
