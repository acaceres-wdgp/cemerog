/**
 * Cuentas por cobrar: aging cards, search, the table and «Registrar pago».
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPost, page } = vi.hoisted(() => ({
    mockPost: vi.fn(),
    page: {
        props: {
            errors: {} as Record<string, string>,
            cash_shift: null as unknown,
        },
        flash: {} as Record<string, unknown>,
    },
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    router: { get: vi.fn(), post: mockPost },
    usePage: () => page,
}));

import CxcIndex from '@/pages/cxc/index';
import type { ReceivableRow } from '@/pages/cxc/types';

const myShift = {
    id: 1,
    opened_by: 'Rosa Castillo',
    opened_at: '31/10/2026 08:00',
    mine: true,
    can_operate: true,
    pending_close: false,
};

const invoice = (
    id: number,
    days: number,
    balance: number,
    name: string,
    cedula: string,
): ReceivableRow => ({
    id,
    number: `F-000000${id}`,
    issued_on: '01/10/2026',
    days,
    total: balance + 100000,
    paid_amount: 100000,
    balance,
    credit_due_date: null,
    overdue: false,
    patient: {
        id,
        full_name: name,
        document_number: cedula,
        phone: '809-222-3367',
    },
});

const invoices = [
    invoice(1, 10, 200000, 'Juan Pérez', '001-0000001-1'),
    invoice(2, 154, 340000, 'Ana Tejada', '031-0889012-4'),
    invoice(3, 45, 150000, 'Yesenia Brito', '031-0567234-9'),
];

describe('Cuentas por cobrar', () => {
    beforeEach(() => {
        mockPost.mockClear();
        page.props.cash_shift = myShift;
        page.flash = {};
    });

    it('summarises the balance and lists the invoices oldest first', () => {
        render(<CxcIndex invoices={invoices} />);

        expect(
            screen.getByText(
                /3 facturas con balance · total por cobrar RD\$6,900\.00/,
            ),
        ).toBeTruthy();
        const rows = screen.getAllByRole('row').slice(1);
        expect(within(rows[0]).getByText('Ana Tejada')).toBeTruthy();
        expect(within(rows[0]).getByText('Más de 90 días')).toBeTruthy();
        expect(
            within(rows[0]).getByText('031-0889012-4 · 809-222-3367'),
        ).toBeTruthy();
        expect(within(rows[2]).getByText('0 – 30 días')).toBeTruthy();
    });

    it('an aging card filters the table and the filtered balance', () => {
        render(<CxcIndex invoices={invoices} />);

        fireEvent.click(screen.getByRole('button', { name: /31 – 60 días/ }));
        expect(screen.getAllByRole('row')).toHaveLength(2);
        expect(screen.getByText('Yesenia Brito')).toBeTruthy();
        expect(
            screen.getByText('Balance filtrado').nextSibling?.textContent,
        ).toBe('RD$1,500.00');
    });

    it('searches by name, cédula without dashes or invoice number', () => {
        render(<CxcIndex invoices={invoices} />);
        const search = screen.getByLabelText(
            'Buscar paciente, cédula o factura',
        );

        fireEvent.change(search, { target: { value: '0310889012' } });
        expect(screen.getAllByRole('row')).toHaveLength(2);
        expect(screen.getByText('Ana Tejada')).toBeTruthy();

        fireEvent.change(search, { target: { value: 'F-0000003' } });
        expect(screen.getByText('Yesenia Brito')).toBeTruthy();

        fireEvent.change(search, { target: { value: 'nadie' } });
        expect(
            screen.getByText('No hay facturas con balance para este filtro.'),
        ).toBeTruthy();
    });

    it('«Registrar pago» opens the payment with the four methods and records an installment', () => {
        render(<CxcIndex invoices={invoices} />);

        const row = screen.getByText('Ana Tejada').closest('tr')!;
        fireEvent.click(
            within(row).getByRole('button', { name: 'Registrar pago' }),
        );
        const dialog = screen.getByRole('dialog');
        expect(
            within(dialog).getByText(
                /F-0000002 · Ana Tejada · Balance pendiente: RD\$3,400\.00/,
            ),
        ).toBeTruthy();
        for (const method of [
            'Efectivo',
            'Tarjeta',
            'Transferencia',
            'Crédito',
        ]) {
            expect(
                within(dialog).getByRole('button', { name: method }),
            ).toBeTruthy();
        }

        fireEvent.change(within(dialog).getByLabelText(/Monto \(RD\$\)/), {
            target: { value: '2000' },
        });
        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Registrar pago' }),
        );
        expect(mockPost).toHaveBeenCalledWith(
            '/facturacion/facturas/2/pagos',
            { payments: [{ method: 'efectivo', amount: 200000 }] },
            expect.anything(),
        );
    });

    it('without an open shift, «Registrar pago» opens the shift first', () => {
        page.props.cash_shift = null;
        render(<CxcIndex invoices={invoices} />);

        fireEvent.click(
            screen.getAllByRole('button', { name: 'Registrar pago' })[0],
        );
        expect(screen.getByText('Abrir turno de caja')).toBeTruthy();
    });

    it('offers to print the receipt just generated', () => {
        page.flash = { receipt: { id: 12, number: 'R-0012' } };
        render(<CxcIndex invoices={invoices} />);

        expect(screen.getByText('R-0012')).toBeTruthy();
        expect(
            screen.getByRole('link', { name: /Imprimir recibo/ }),
        ).toHaveAttribute('href', '/facturacion/recibos/12/imprimir');
    });
});
