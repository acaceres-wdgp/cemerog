/**
 * Facturación: account preview with discount, issuing, invoice detail and void.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPost, mockGet, page } = vi.hoisted(() => ({
    mockPost: vi.fn(),
    mockGet: vi.fn(),
    page: { props: { errors: {} as Record<string, string> } },
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    router: { post: mockPost, get: mockGet },
    usePage: () => page,
}));

import CajaIndex from '@/pages/caja/index';
import { computeDiscount } from '@/pages/caja/components/InvoiceDraft';
import type {
    BillableAccount,
    CajaProps,
    InvoiceDetail,
} from '@/pages/caja/types';

const account: BillableAccount = {
    id: 5,
    service_date: '31/10/2026',
    status: 'pendiente_facturar',
    patient: { id: 1, full_name: 'Ana Torres', expediente_number: 'P-00001' },
    charges: [
        {
            id: 1,
            description: 'Consulta – Dr. Pérez',
            quantity: 1,
            unit_price: 150000,
            total: 150000,
            doctor: 'Dr. Pérez',
        },
        {
            id: 2,
            description: 'Hemograma',
            quantity: 1,
            unit_price: 50000,
            total: 50000,
            doctor: null,
        },
    ],
    total: 200000,
};

const invoice: InvoiceDetail = {
    id: 9,
    number: 'F-0000009',
    status: 'pendiente',
    issued_at: '31/10/2026 10:00',
    total: 180000,
    paid_amount: 0,
    balance: 180000,
    patient: {
        id: 1,
        full_name: 'Ana Torres',
        expediente_number: 'P-00001',
        document_number: '001-1234567-8',
    },
    service_date: '31/10/2026',
    issued_by: 'Rosa Castillo',
    subtotal: 200000,
    discount_type: 'porcentaje',
    discount_value: 10,
    discount_amount: 20000,
    discount_reason: 'Referido',
    credit_due_date: null,
    credit_note: null,
    receipts: [],
    void_reason: null,
    voided_by: null,
    voided_at: null,
    lines: account.charges,
};

function props(overrides: Partial<CajaProps> = {}): CajaProps {
    return {
        pending_accounts: [account],
        accounts_in_care: [],
        invoices: [],
        selected_invoice: null,
        can_void: false,
        ...overrides,
    };
}

describe('computeDiscount', () => {
    it('computes percentage and amount discounts and rejects invalid ones', () => {
        expect(computeDiscount(200000, 'porcentaje', '10')).toBe(20000);
        expect(computeDiscount(200000, 'porcentaje', '100')).toBe(200000);
        expect(computeDiscount(200000, 'porcentaje', '101')).toBeNull();
        expect(computeDiscount(200000, 'porcentaje', '7.5')).toBeNull();
        expect(computeDiscount(200000, 'monto', '500')).toBe(50000);
        expect(computeDiscount(200000, 'monto', '2500')).toBeNull();
        expect(computeDiscount(200000, 'monto', '')).toBe(0);
    });
});

describe('Facturación', () => {
    beforeEach(() => {
        mockPost.mockClear();
        mockGet.mockClear();
    });

    it('issues the invoice of the selected account without a discount', () => {
        render(<CajaIndex {...props()} />);

        expect(screen.getByText('Total')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Emitir factura' }));

        expect(mockPost).toHaveBeenCalledWith(
            '/facturacion/cuentas/5/facturar',
            {},
            expect.anything(),
        );
    });

    it('requires a reason for a discount and sends it', () => {
        render(<CajaIndex {...props()} />);

        fireEvent.click(screen.getByLabelText('Aplicar descuento'));
        fireEvent.change(screen.getByLabelText(/Porcentaje \(1 a 100\)/), {
            target: { value: '10' },
        });
        const emit = screen.getByRole('button', { name: 'Emitir factura' });
        expect(emit).toBeDisabled();

        fireEvent.change(screen.getByLabelText(/Motivo del descuento/), {
            target: { value: 'Paciente referido' },
        });
        expect(emit).not.toBeDisabled();
        expect(screen.getByText(/−RD\$\s?200\.00/)).toBeTruthy();

        fireEvent.click(emit);
        expect(mockPost).toHaveBeenCalledWith(
            '/facturacion/cuentas/5/facturar',
            {
                discount_type: 'porcentaje',
                discount_value: 10,
                discount_reason: 'Paciente referido',
            },
            expect.anything(),
        );
    });

    it('does not let an account still in care be invoiced', () => {
        render(
            <CajaIndex
                {...props({
                    pending_accounts: [],
                    accounts_in_care: [{ ...account, status: 'abierta' }],
                })}
            />,
        );

        fireEvent.click(screen.getByText('Ana Torres'));
        expect(screen.getByText(/sigue en atención/)).toBeTruthy();
        expect(
            screen.queryByRole('button', { name: 'Emitir factura' }),
        ).toBeNull();
    });

    it('shows the invoice with its discount; only administrators can void', () => {
        const { rerender } = render(
            <CajaIndex
                {...props({ pending_accounts: [], selected_invoice: invoice })}
            />,
        );

        expect(screen.getByText('Factura F-0000009')).toBeTruthy();
        expect(screen.getByText('Descuento (10%)')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Anular' })).toBeNull();

        rerender(
            <CajaIndex
                {...props({
                    pending_accounts: [],
                    selected_invoice: invoice,
                    can_void: true,
                })}
            />,
        );
        expect(screen.getByRole('button', { name: 'Anular' })).toBeTruthy();
    });

    it('loads an invoice from the server when picked in the list', () => {
        render(
            <CajaIndex
                {...props({
                    invoices: [
                        {
                            id: 9,
                            number: 'F-0000009',
                            status: 'pendiente',
                            patient: 'Ana Torres',
                            issued_at: '31/10/2026 10:00',
                            total: 180000,
                            paid_amount: 0,
                            balance: 180000,
                            credit_due_date: null,
                        },
                    ],
                })}
            />,
        );

        fireEvent.click(screen.getByText(/F-0000009 · Ana Torres/));
        expect(mockGet).toHaveBeenCalledWith(
            '/facturacion?factura=9',
            {},
            expect.objectContaining({ only: ['selected_invoice'] }),
        );
    });
});
