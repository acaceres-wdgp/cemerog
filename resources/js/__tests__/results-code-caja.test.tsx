/**
 * The results portal code inside the clinic: the box with the QR on the
 * printed invoice, and «Código de resultados» in Facturación.
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPost, page } = vi.hoisted(() => ({
    mockPost: vi.fn(),
    page: { props: { errors: {}, cash_shift: null as unknown }, flash: {} },
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    router: { post: mockPost, get: vi.fn() },
    usePage: () => page,
}));

import AccountPanel from '@/pages/caja/components/AccountPanel';
import FacturaImprimir from '@/pages/caja/factura-imprimir';
import type { InvoiceDetail } from '@/pages/caja/types';

const access = {
    code: 'CMG-7K4P-29XQ',
    url: 'http://cemerog.test/resultados?c=CMG-7K4P-29XQ',
    display_url: 'cemerog.test/resultados',
    qr: 'data:image/svg+xml;base64,PHN2Zy8+',
    expires_on: '24/02/2027',
};

const invoice: InvoiceDetail = {
    id: 9,
    number: 'F-0000009',
    status: 'pagada',
    issued_at: '26/11/2026 10:00 AM',
    total: 150000,
    paid_amount: 150000,
    balance: 0,
    credit_due_date: null,
    patient: {
        id: 1,
        full_name: 'Rosa Peña',
        expediente_number: 'P-00001',
        document_number: '001',
    },
    service_date: '26/11/2026',
    issued_by: 'Caja',
    subtotal: 150000,
    discount_type: null,
    discount_value: null,
    discount_amount: 0,
    discount_reason: null,
    credit_note: null,
    receipts: [],
    void_reason: null,
    voided_by: null,
    voided_at: null,
    lines: [],
};
const clinic = { name: 'Clínica', rnc: null, phone: null, address: null };

beforeEach(() => mockPost.mockReset());

describe('printed invoice', () => {
    it('shows the QR, the portal link and the code', () => {
        render(
            <FacturaImprimir
                invoice={invoice}
                clinic={clinic}
                results_access={access}
            />,
        );

        const box = screen.getByRole('region', {
            name: 'Código de resultados',
        });
        expect(within(box).getByRole('img')).toHaveAttribute('src', access.qr);
        expect(within(box).getByText('cemerog.test/resultados')).toBeTruthy();
        expect(within(box).getByText('CMG-7K4P-29XQ')).toBeTruthy();
    });

    it('has no box without lab or imaging', () => {
        render(<FacturaImprimir invoice={invoice} clinic={clinic} />);

        expect(
            screen.queryByRole('region', { name: 'Código de resultados' }),
        ).toBeNull();
    });
});

describe('Facturación › Código de resultados', () => {
    it('shows the current code, reprints it and makes a new one after confirming', () => {
        render(
            <AccountPanel
                invoice={{ ...invoice, results: { code: access } }}
                canVoid={false}
            />,
        );

        fireEvent.click(
            screen.getByRole('button', { name: /Código de resultados/ }),
        );
        const dialog = screen.getByRole('dialog', {
            name: 'Código de resultados',
        });
        expect(within(dialog).getByText('CMG-7K4P-29XQ')).toBeTruthy();
        expect(
            within(dialog).getByText('Vigente hasta el 24/02/2027'),
        ).toBeTruthy();
        expect(
            within(dialog).getByRole('link', { name: /Reimprimir/ }),
        ).toHaveAttribute('href', '/facturacion/facturas/9/imprimir');

        fireEvent.click(
            within(dialog).getByRole('button', { name: /Generar uno nuevo/ }),
        );
        const confirm = screen.getByRole('dialog', {
            name: '¿Generar un código nuevo?',
        });
        expect(
            within(confirm).getByText(/CMG-7K4P-29XQ dejará de funcionar/),
        ).toBeTruthy();
        fireEvent.click(
            within(confirm).getByRole('button', {
                name: 'Generar código nuevo',
            }),
        );
        expect(mockPost).toHaveBeenCalledWith(
            '/facturacion/facturas/9/codigo-resultados',
            {},
            expect.anything(),
        );
    });

    it('is not offered for invoices without lab or imaging', () => {
        render(
            <AccountPanel
                invoice={{ ...invoice, results: null }}
                canVoid={false}
            />,
        );

        expect(
            screen.queryByRole('button', { name: /Código de resultados/ }),
        ).toBeNull();
    });
});
