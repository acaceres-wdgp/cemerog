/**
 * The browser offers the page title as the name of the saved PDF, so every
 * printable document sets a title that tells it apart («Factura F-0000008 -
 * Ana Torres») instead of the bare app name.
 */
import { describe, expect, it } from 'vitest';
import { PRINTABLE_PAGES } from '@/layouts/resolve-layout';
import { documentTitle, fileDate, printFileName } from '@/lib/print';

const pages = import.meta.glob('../pages/**/*.tsx', {
    query: '?raw',
    import: 'default',
    eager: true,
});

const source = (name: string) => pages[`../pages/${name}.tsx`] as string;

describe('printFileName', () => {
    it('joins the parts with « - » and skips the empty ones', () => {
        expect(printFileName('Factura', 'F-0000008', 'Ana Torres')).toBe(
            'Factura - F-0000008 - Ana Torres',
        );
        expect(printFileName('Receta', null, 'Ana Torres', '')).toBe(
            'Receta - Ana Torres',
        );
    });

    it('drops the characters a file name cannot have', () => {
        expect(printFileName('Rayos X: tórax/AP', 'Ana "La" Torres')).toBe(
            'Rayos X tórax AP - Ana La Torres',
        );
    });
});

describe('fileDate', () => {
    it('turns a clinic date (dd/MM/yyyy, with or without time) into yyyy-MM-dd', () => {
        expect(fileDate('28/11/2026')).toBe('2026-11-28');
        expect(fileDate('26/11/2026 9:40 AM')).toBe('2026-11-26');
    });

    it('leaves out what is not a date', () => {
        expect(fileDate(null)).toBeNull();
        expect(fileDate('')).toBeNull();
        expect(fileDate('mañana')).toBeNull();
    });
});

describe('documentTitle', () => {
    it('adds the app name to the title of a screen', () => {
        expect(documentTitle('Iniciar sesión', 'auth/login', 'CEMEROG')).toBe(
            'Iniciar sesión - CEMEROG',
        );
        expect(documentTitle('', 'caja/index', 'CEMEROG')).toBe('CEMEROG');
    });

    it.each([...PRINTABLE_PAGES, 'portal/estudio'])(
        'keeps the title of %s as is: it is the name of the file',
        (name) => {
            expect(documentTitle('Factura - F-1', name, 'CEMEROG')).toBe(
                'Factura - F-1',
            );
        },
    );
});

describe('printable pages', () => {
    it.each([...PRINTABLE_PAGES, 'portal/estudio'])(
        '%s names its file',
        (name) => {
            expect(source(name)).toMatch(/<Head\s+title=\{printFileName\(/);
        },
    );
});
