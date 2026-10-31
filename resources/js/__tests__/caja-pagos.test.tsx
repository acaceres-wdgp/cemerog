/**
 * Collecting an invoice: shift required, mixed methods, change, transfer
 * number and credit with a due date.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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

import InvoiceDetailPanel from '@/pages/caja/components/InvoiceDetailPanel';
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
        document_number: '001-1234567-8',
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
    render(<InvoiceDetailPanel invoice={invoice} canVoid={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pago' }));
}

describe('Cobro de una factura', () => {
    beforeEach(() => {
        mockPost.mockClear();
        page.props.cash_shift = myShift;
    });

    it('without an open shift offers to open one first', () => {
        page.props.cash_shift = null;
        render(<InvoiceDetailPanel invoice={invoice} canVoid={false} />);

        expect(
            screen.getByRole('button', { name: 'Abrir turno para cobrar' }),
        ).toBeTruthy();
        expect(
            screen.queryByRole('button', { name: 'Registrar pago' }),
        ).toBeNull();
    });

    it('another cashier shift blocks collecting', () => {
        page.props.cash_shift = {
            ...myShift,
            mine: false,
            can_operate: false,
            opened_by: 'Kenia Marte',
        };
        render(<InvoiceDetailPanel invoice={invoice} canVoid={false} />);

        expect(
            screen.getByText(/La caja está abierta por Kenia Marte/),
        ).toBeTruthy();
    });

    it('pays the balance in cash and shows the change', () => {
        openPayment();

        fireEvent.change(screen.getByLabelText(/Efectivo recibido/), {
            target: { value: '2500' },
        });
        expect(screen.getByText('Devuelta: RD$500.00')).toBeTruthy();

        fireEvent.click(
            screen.getAllByRole('button', { name: 'Registrar pago' }).at(-1)!,
        );
        expect(mockPost).toHaveBeenCalledWith(
            '/facturacion/facturas/9/pagos',
            {
                payments: [
                    {
                        method: 'efectivo',
                        amount: 200000,
                        cash_received: 250000,
                    },
                ],
            },
            expect.anything(),
        );
    });

    it('a mixed payment with a transfer needs the transfer number', () => {
        openPayment();

        fireEvent.change(screen.getByLabelText('Monto (RD$)'), {
            target: { value: '500' },
        });
        fireEvent.click(screen.getByText('+ Agregar otro método'));
        fireEvent.change(screen.getAllByLabelText('Método')[1], {
            target: { value: 'transferencia' },
        });

        const submit = screen
            .getAllByRole('button', { name: 'Registrar pago' })
            .at(-1)!;
        expect(submit).toBeDisabled();

        fireEvent.change(screen.getByLabelText(/Número de la transferencia/), {
            target: { value: 'TRX-778' },
        });
        expect(submit).not.toBeDisabled();

        fireEvent.click(submit);
        expect(mockPost).toHaveBeenCalledWith(
            '/facturacion/facturas/9/pagos',
            {
                payments: [
                    { method: 'efectivo', amount: 50000 },
                    {
                        method: 'transferencia',
                        amount: 150000,
                        reference: 'TRX-778',
                    },
                ],
            },
            expect.anything(),
        );
    });

    it('a partial payment asks for the credit due date', () => {
        openPayment();

        fireEvent.change(screen.getByLabelText('Monto (RD$)'), {
            target: { value: '500' },
        });
        expect(
            screen.getByText(/RD\$1,500\.00 quedan en cuentas por cobrar/),
        ).toBeTruthy();

        const submit = screen
            .getAllByRole('button', { name: 'Registrar pago' })
            .at(-1)!;
        expect(submit).toBeDisabled();

        fireEvent.change(screen.getByLabelText(/Fecha compromiso de pago/), {
            target: { value: '2026-11-15' },
        });
        fireEvent.click(submit);
        expect(mockPost).toHaveBeenCalledWith(
            '/facturacion/facturas/9/pagos',
            {
                payments: [{ method: 'efectivo', amount: 50000 }],
                credit: { due_date: '2026-11-15', note: null },
            },
            expect.anything(),
        );
    });

    it('does not allow paying more than the balance', () => {
        openPayment();

        fireEvent.change(screen.getByLabelText('Monto (RD$)'), {
            target: { value: '2500' },
        });
        expect(screen.getByText(/Pasa del balance/)).toBeTruthy();
        expect(
            screen.getAllByRole('button', { name: 'Registrar pago' }).at(-1),
        ).toBeDisabled();
    });
});
