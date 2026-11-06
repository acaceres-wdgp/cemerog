/**
 * Printing must output only the expected document: never the sidebar, the
 * topbar, page navigation, or action buttons. jsdom does not apply @media print,
 * so these check the markup that drives it; the PDFs are verified in the browser.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react';
import FormDialog from '@/components/cemerog/FormDialog';
import AppLayout from '@/layouts/app/app-layout';
import ImpresosIndex from '@/pages/impresos';

vi.mock('@inertiajs/react', () => ({
    usePage: () => ({
        url: '/impresos',
        component: 'impresos/index',
        props: {
            auth: { user: { id: 1, name: 'Ana', username: 'ana', roles: [] } },
            permissions: [],
            sidebarOpen: true,
            sidebarTheme: 'carbon',
            can_attend: false,
            queue: null,
            cash_shift: null,
            flash: {},
        },
    }),
    router: { post: vi.fn(), visit: vi.fn(), on: vi.fn(() => vi.fn()) },
    Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
    Head: () => null,
}));

afterEach(cleanup);

describe('AppLayout when printing', () => {
    it('hides the sidebar and the topbar', () => {
        const { container } = render(<AppLayout>doc</AppLayout>);

        expect(container.querySelector('aside')).toHaveClass('print:hidden');
        expect(container.querySelector('header')).toHaveClass('print:hidden');
    });

    it('lets the content flow across pages', () => {
        const { container } = render(<AppLayout>doc</AppLayout>);
        const main = container.querySelector('main');

        expect(main).toHaveClass('print:overflow-visible', 'print:p-0');
        expect(container.firstElementChild).toHaveClass(
            'print:block',
            'print:h-auto',
            'print:overflow-visible',
        );
    });
});

describe('Impresos when printing', () => {
    it('hides everything but the document', () => {
        render(<ImpresosIndex />);

        // Inline display styles beat print:hidden, so these need the ! variant
        const hiddenAncestor = (el: HTMLElement) =>
            el.closest('.print\\:hidden, .print\\:\\!hidden');

        expect(
            hiddenAncestor(screen.getByRole('heading', { name: 'Impresos' })),
        ).not.toBeNull();
        expect(
            hiddenAncestor(
                screen.getByRole('button', { name: /Indicaciones/ }),
            ),
        ).not.toBeNull();
        expect(
            hiddenAncestor(screen.getByRole('button', { name: /Imprimir/ })),
        ).not.toBeNull();
        expect(
            screen
                .getByRole('button', { name: /Indicaciones/ })
                .closest('.print\\:\\!hidden'),
        ).not.toBeNull();

        const area = document.querySelector<HTMLElement>('[data-print-area]');
        expect(area).not.toBeNull();
        expect(hiddenAncestor(area as HTMLElement)).toBeNull();
    });
});

describe('Impresos without a preview', () => {
    it('does not print the placeholder', () => {
        render(<ImpresosIndex />);
        fireEvent.click(screen.getByRole('button', { name: /Indicaciones/ }));

        expect(
            screen
                .getByText('Selecciona un documento para previsualizar')
                .closest('.print\\:\\!hidden'),
        ).not.toBeNull();
    });
});

describe('Credentials dialog when printing', () => {
    it('hides the dialog chrome but keeps the title and the body', () => {
        render(
            <FormDialog
                open
                onOpenChange={() => {}}
                title="Credenciales"
                description="Entrégalas"
                footer={<button type="button">Imprimir</button>}
            >
                <p>Usuario</p>
            </FormDialog>,
        );
        const dialog = screen.getByRole('dialog');

        expect(
            within(dialog).getByRole('button', { name: 'Imprimir' })
                .parentElement,
        ).toHaveClass('print:hidden');
        expect(within(dialog).getByLabelText('Cerrar')).toHaveClass(
            'print:hidden',
        );
        expect(within(dialog).getByText('Entrégalas')).toHaveClass(
            'print:hidden',
        );
        expect(
            within(dialog).getByText('Usuario').closest('.print\\:hidden'),
        ).toBeNull();
    });

    it('prints only the dialog', () => {
        const source = readFileSync(
            join(import.meta.dirname, '../pages/doctores/index.tsx'),
            'utf8',
        );

        expect(source).toContain('body > *:not([role="dialog"])');
    });
});

describe('Printable documents', () => {
    it('PrintablePage does not force a letter height', () => {
        const source = readFileSync(
            join(
                import.meta.dirname,
                '../components/cemerog/PrintablePage.tsx',
            ),
            'utf8',
        );

        expect(source).toMatch(/min-h-\[1056px\][^`]*print:min-h-0/);
    });

    it.each([
        'consulta/receta-imprimir',
        'lab/imprimir',
        'img/imprimir',
        'caja/factura-imprimir',
        'caja/recibo-imprimir',
        'cuadre/reporte',
    ])('%s does not force a screen height, which adds a blank page', (name) => {
        const source = readFileSync(
            join(import.meta.dirname, `../pages/${name}.tsx`),
            'utf8',
        );

        expect(source).toMatch(/printable-root[^"]*print:min-h-0/);
    });
});
