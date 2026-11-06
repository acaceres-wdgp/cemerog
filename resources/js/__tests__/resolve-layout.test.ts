/**
 * Printable documents render without the app layout: their print CSS hides
 * everything under #app except `.printable-root`, so with the layout around
 * them the whole document was hidden and the PDF came out blank.
 */
import { describe, expect, it } from 'vitest';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import { PRINTABLE_PAGES, resolveLayout } from '@/layouts/resolve-layout';

const pages = import.meta.glob('../pages/**/*.tsx', {
    query: '?raw',
    import: 'default',
    eager: true,
});

/** «../pages/caja/factura-imprimir.tsx» → «caja/factura-imprimir» */
const pageName = (path: string) =>
    path.replace('../pages/', '').replace(/\.tsx$/, '');

describe('resolveLayout', () => {
    it.each([
        'consulta/receta-imprimir',
        'lab/imprimir',
        'img/imprimir',
        'caja/factura-imprimir',
        'caja/recibo-imprimir',
        'cuadre/reporte',
    ])('renders %s without a layout', (name) => {
        expect(resolveLayout(name)).toBeUndefined();
    });

    it('uses AuthLayout for auth pages', () => {
        expect(resolveLayout('auth/login')).toBe(AuthLayout);
    });

    it('uses AppLayout for every other page', () => {
        expect(resolveLayout('pacientes/index')).toBe(AppLayout);
        expect(resolveLayout('caja/index')).toBe(AppLayout);
    });

    it('lists every page that renders a printable document', () => {
        const printable = Object.entries(pages)
            .filter(
                ([path, src]) =>
                    !path.includes('__tests__') &&
                    !path.endsWith('.test.tsx') &&
                    (src as string).includes('printable-root'),
            )
            .map(([path]) => pageName(path))
            .sort();

        expect(printable.length).toBeGreaterThan(0);
        expect([...PRINTABLE_PAGES].sort()).toEqual(printable);
    });
});
