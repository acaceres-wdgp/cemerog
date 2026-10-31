/**
 * Cuentas por cobrar: totals, overdue filter and installments.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGet, mockPost, page } = vi.hoisted(() => ({
    mockGet: vi.fn(),
    mockPost: vi.fn(),
    page: {
        props: {
            errors: {} as Record<string, string>,
            cash_shift: {
                id: 1,
                opened_by: 'Rosa Castillo',
                opened_at: '31/10/2026 08:00',
                mine: true,
                can_operate: true,
                pending_close: false,
            },
        },
    },
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    router: { get: mockGet, post: mockPost },
    usePage: () => page,
}));

import CxcIndex from '@/pages/cxc/index';
import type { InvoiceDetail } from '@/pages/caja/types';

const row = {
    id: 3,
    number: 'F-0000003',
    status: 'pendiente' as const,
    patient: 'Juan Pérez',
    issued_at: '20/10/2026 09:00',
    total: 200000,
    paid_amount: 50000,
    balance: 150000,
    credit_due_date: '25/10/2026',
    overdue: true,
};

const detail: InvoiceDetail = {
    ...row,
    patient: {
        id: 2,
        full_name: 'Juan Pérez',
        expediente_number: 'P-00002',
        document_number: '001-0000000-1',
    },
    service_date: '20/10/2026',
    issued_by: 'Rosa Castillo',
    subtotal: 200000,
    discount_type: null,
    discount_value: null,
    discount_amount: 0,
    discount_reason: null,
    credit_note: 'Paga la quincena',
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

const totals = {
    receivable: 150000,
    overdue: 150000,
    count: 1,
    overdue_count: 1,
};

describe('Cuentas por cobrar', () => {
    beforeEach(() => {
        mockGet.mockClear();
        mockPost.mockClear();
    });

    it('shows the totals and marks overdue invoices', () => {
        render(
            <CxcIndex
                invoices={[row]}
                totals={totals}
                filter="todas"
                selected_invoice={null}
                can_void={false}
            />,
        );

        expect(screen.getAllByText('RD$1,500.00').length).toBeGreaterThan(0);
        expect(screen.getByText('Vencida')).toBeTruthy();
        expect(screen.getByText(/compromiso 25\/10\/2026/)).toBeTruthy();
    });

    it('filters by overdue through the URL and opens an invoice', () => {
        render(
            <CxcIndex
                invoices={[row]}
                totals={totals}
                filter="todas"
                selected_invoice={null}
                can_void={false}
            />,
        );

        fireEvent.click(screen.getByText('Vencidas'));
        expect(mockGet).toHaveBeenCalledWith(
            '/cuentas-por-cobrar?filtro=vencidas',
            {},
            expect.anything(),
        );

        fireEvent.click(screen.getByText('Juan Pérez'));
        expect(mockGet).toHaveBeenCalledWith(
            '/cuentas-por-cobrar?filtro=todas&factura=3',
            {},
            expect.objectContaining({ only: ['selected_invoice'] }),
        );
    });

    it('an installment keeps the existing due date', () => {
        render(
            <CxcIndex
                invoices={[row]}
                totals={totals}
                filter="todas"
                selected_invoice={detail}
                can_void={false}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Registrar pago' }));
        fireEvent.change(screen.getByLabelText('Monto (RD$)'), {
            target: { value: '500' },
        });
        expect(screen.getByLabelText(/Fecha compromiso de pago/)).toHaveValue(
            '2026-10-25',
        );

        fireEvent.click(
            screen.getAllByRole('button', { name: 'Registrar pago' }).at(-1)!,
        );
        expect(mockPost).toHaveBeenCalledWith(
            '/facturacion/facturas/3/pagos',
            {
                payments: [{ method: 'efectivo', amount: 50000 }],
                credit: { due_date: '2026-10-25', note: null },
            },
            expect.anything(),
        );
    });
});
