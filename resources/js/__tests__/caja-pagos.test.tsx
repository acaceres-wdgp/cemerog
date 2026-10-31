/**
 * «Registrar pago» on an issued invoice: transfer number, partial payment,
 * credit and the shift requirement.
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
    },
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    router: { post: mockPost, get: vi.fn() },
    usePage: () => page,
}));

import AccountPanel from '@/pages/caja/components/AccountPanel';
import type { InvoiceDetail } from '@/pages/caja/types';

const invoice: InvoiceDetail = {
    id: 9,
    number: 'F-0000009',
    status: 'pendiente',
    issued_at: '31/10/2026 10:00',
    total: 200000,
    paid_amount: 0,
    balance: 200000,
    credit_due_date: null,
    patient: {
        id: 1,
        full_name: 'Ana Torres',
        expediente_number: 'P-00001',
        document_number: '001',
    },
    service_date: '31/10/2026',
    issued_by: 'Rosa Castillo',
    subtotal: 200000,
    discount_type: null,
    discount_value: null,
    discount_amount: 0,
    discount_reason: null,
    credit_note: null,
    receipts: [],
    void_reason: null,
    voided_by: null,
    voided_at: null,
    lines: [
        {
            id: 1,
            date: '31/10/2026',
            area: 'Consulta',
            description: 'Consulta',
            quantity: 1,
            unit_price: 200000,
            total: 200000,
            doctor: null,
        },
    ],
};

const myShift = {
    id: 1,
    opened_by: 'Rosa Castillo',
    opened_at: '31/10/2026 08:00',
    mine: true,
    can_operate: true,
    pending_close: false,
};

function openPayment() {
    render(<AccountPanel invoice={invoice} canVoid={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pago' }));
    return screen.getByRole('dialog');
}

describe('Registrar pago', () => {
    beforeEach(() => {
        mockPost.mockClear();
        page.props.cash_shift = myShift;
    });

    it('another cashier shift blocks collecting', () => {
        page.props.cash_shift = {
            ...myShift,
            mine: false,
            can_operate: false,
            opened_by: 'Kenia Marte',
        };
        render(<AccountPanel invoice={invoice} canVoid={false} />);

        expect(
            screen.getByText(/La caja está abierta por Kenia Marte/),
        ).toBeTruthy();
        expect(
            screen.queryByRole('button', { name: 'Registrar pago' }),
        ).toBeNull();
    });

    it('a transfer needs its number', () => {
        const dialog = openPayment();

        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Transferencia' }),
        );
        const submit = within(dialog).getByRole('button', {
            name: 'Registrar pago',
        });
        expect(submit).toBeDisabled();

        fireEvent.change(
            within(dialog).getByLabelText(/Número de la transferencia/),
            { target: { value: 'TRX-778' } },
        );
        fireEvent.click(submit);
        expect(mockPost).toHaveBeenCalledWith(
            '/facturacion/facturas/9/pagos',
            {
                payments: [
                    {
                        method: 'transferencia',
                        amount: 200000,
                        reference: 'TRX-778',
                    },
                ],
            },
            expect.anything(),
        );
    });

    it('a partial payment is allowed and leaves a balance', () => {
        const dialog = openPayment();

        fireEvent.change(within(dialog).getByLabelText(/Monto \(RD\$\)/), {
            target: { value: '500' },
        });
        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Registrar pago' }),
        );
        expect(mockPost).toHaveBeenCalledWith(
            '/facturacion/facturas/9/pagos',
            { payments: [{ method: 'efectivo', amount: 50000 }] },
            expect.anything(),
        );
    });

    it('credit with a down payment by card', () => {
        const dialog = openPayment();

        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Crédito' }),
        );
        fireEvent.change(within(dialog).getByLabelText(/Abono inicial/), {
            target: { value: '500' },
        });
        fireEvent.click(
            within(dialog).getAllByRole('button', { name: 'Tarjeta' }).at(-1)!,
        );
        fireEvent.change(
            within(dialog).getByLabelText(/Fecha compromiso de pago/),
            { target: { value: '2026-11-15' } },
        );
        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Registrar crédito' }),
        );

        expect(mockPost).toHaveBeenCalledWith(
            '/facturacion/facturas/9/pagos',
            {
                payments: [{ method: 'tarjeta', amount: 50000 }],
                credit: { due_date: '2026-11-15', note: null },
            },
            expect.anything(),
        );
    });

    it('does not allow paying more than the balance', () => {
        const dialog = openPayment();

        fireEvent.change(within(dialog).getByLabelText(/Monto \(RD\$\)/), {
            target: { value: '2500' },
        });
        expect(
            within(dialog).getByText(/No puede pasar del balance/),
        ).toBeTruthy();
        expect(
            within(dialog).getByRole('button', { name: 'Registrar pago' }),
        ).toBeDisabled();
    });
});
