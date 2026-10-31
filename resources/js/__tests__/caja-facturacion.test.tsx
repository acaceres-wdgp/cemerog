/**
 * Facturación (as in the design): Cuentas en caja, the account card with
 * «Emitir factura», the emit dialog (discount + payment or credit) and the
 * invoice card with «Registrar pago».
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPost, mockGet, page } = vi.hoisted(() => ({
    mockPost: vi.fn(),
    mockGet: vi.fn(),
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
    router: { post: mockPost, get: mockGet },
    usePage: () => page,
}));

import CajaIndex from '@/pages/caja/index';
import { computeDiscount } from '@/pages/caja/components/DiscountFields';
import type {
    BillableAccount,
    CajaProps,
    InvoiceDetail,
} from '@/pages/caja/types';

const myShift = {
    id: 1,
    opened_by: 'Rosa Castillo',
    opened_at: '31/10/2026 08:00',
    mine: true,
    can_operate: true,
    pending_close: false,
};

const charge = (
    id: number,
    description: string,
    area: string,
    total: number,
) => ({
    id,
    date: '31/10/2026',
    area,
    description,
    quantity: 1,
    unit_price: total,
    total,
    doctor: null,
});

const account: BillableAccount = {
    id: 5,
    service_date: '31/10/2026',
    status: 'pendiente_facturar',
    patient: { id: 1, full_name: 'Ana Torres', expediente_number: 'P-00001' },
    charges: [
        charge(1, 'Consulta médica', 'Consulta', 150000),
        charge(2, 'Hemograma', 'Laboratorio', 50000),
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
    discount_type: 'porcentaje',
    discount_value: 10,
    discount_amount: 20000,
    discount_reason: 'Referido',
    credit_note: null,
    receipts: [],
    void_reason: null,
    voided_by: null,
    voided_at: null,
    lines: account.charges,
};

const props = (overrides: Partial<CajaProps> = {}): CajaProps => ({
    pending_accounts: [account],
    accounts_in_care: [],
    invoices: [],
    selected_invoice: null,
    can_void: false,
    ...overrides,
});

describe('computeDiscount', () => {
    it('computes percentage and amount discounts and rejects invalid ones', () => {
        expect(computeDiscount(200000, 'porcentaje', '10')).toBe(20000);
        expect(computeDiscount(200000, 'porcentaje', '100')).toBe(200000);
        expect(computeDiscount(200000, 'porcentaje', '101')).toBeNull();
        expect(computeDiscount(200000, 'monto', '500')).toBe(50000);
        expect(computeDiscount(200000, 'monto', '2500')).toBeNull();
    });
});

describe('Facturación', () => {
    beforeEach(() => {
        mockPost.mockClear();
        mockGet.mockClear();
        page.props.cash_shift = myShift;
    });

    it('lists the account in «Cuentas en caja» and shows its charges with area and totals', () => {
        render(<CajaIndex {...props()} />);

        expect(screen.getByText('Cuentas en caja')).toBeTruthy();
        expect(screen.getByText('Pendiente de facturar')).toBeTruthy();
        expect(screen.getByText('Cuenta por facturar')).toBeTruthy();
        expect(screen.getByText('Laboratorio')).toBeTruthy();
        expect(screen.getByText('Balance pendiente')).toBeTruthy();
        expect(screen.getByText('Aún no hay pagos registrados.')).toBeTruthy();
    });

    it('«Emitir factura» opens the dialog and emits and collects in cash', () => {
        render(<CajaIndex {...props()} />);

        fireEvent.click(screen.getByRole('button', { name: 'Emitir factura' }));
        const dialog = screen.getByRole('dialog');
        fireEvent.change(within(dialog).getByLabelText(/Efectivo recibido/), {
            target: { value: '2500' },
        });
        expect(within(dialog).getByText('RD$500.00')).toBeTruthy();

        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Emitir y cobrar' }),
        );
        expect(mockPost).toHaveBeenCalledWith(
            '/facturacion/cuentas/5/facturar',
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

    it('emits on credit with a down payment of 0 and a due date', () => {
        render(<CajaIndex {...props()} />);

        fireEvent.click(screen.getByRole('button', { name: 'Emitir factura' }));
        const dialog = screen.getByRole('dialog');
        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Crédito' }),
        );
        expect(within(dialog).getByText('Queda a crédito')).toBeTruthy();

        const submit = within(dialog).getByRole('button', {
            name: 'Emitir a crédito',
        });
        expect(submit).toBeDisabled();
        fireEvent.change(
            within(dialog).getByLabelText(/Fecha compromiso de pago/),
            {
                target: { value: '2026-11-15' },
            },
        );
        fireEvent.click(submit);

        expect(mockPost).toHaveBeenCalledWith(
            '/facturacion/cuentas/5/facturar',
            { payments: [], credit: { due_date: '2026-11-15', note: null } },
            expect.anything(),
        );
    });

    it('a discount needs a reason and lowers the amount to collect', () => {
        render(<CajaIndex {...props()} />);

        fireEvent.click(screen.getByRole('button', { name: 'Emitir factura' }));
        const dialog = screen.getByRole('dialog');
        fireEvent.click(within(dialog).getByLabelText('Aplicar descuento'));
        fireEvent.change(
            within(dialog).getByLabelText(/Porcentaje \(1 a 100\)/),
            { target: { value: '10' } },
        );
        expect(within(dialog).getByLabelText(/Monto \(RD\$\)/)).toHaveValue(
            '1800.00',
        );

        const submit = within(dialog).getByRole('button', {
            name: 'Emitir y cobrar',
        });
        expect(submit).toBeDisabled();
        fireEvent.change(
            within(dialog).getByLabelText(/Motivo del descuento/),
            { target: { value: 'Referido' } },
        );
        fireEvent.click(submit);

        expect(mockPost).toHaveBeenCalledWith(
            '/facturacion/cuentas/5/facturar',
            {
                discount_type: 'porcentaje',
                discount_value: 10,
                discount_reason: 'Referido',
                payments: [{ method: 'efectivo', amount: 180000 }],
            },
            expect.anything(),
        );
    });

    it('without an open shift, «Emitir factura» opens the shift first', () => {
        page.props.cash_shift = null;
        render(<CajaIndex {...props()} />);

        fireEvent.click(screen.getByRole('button', { name: 'Emitir factura' }));
        expect(screen.getByText('Abrir turno de caja')).toBeTruthy();
    });

    it('an account in care cannot be invoiced', () => {
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

    it('shows the issued invoice with its discount; only administrators void', () => {
        const { rerender } = render(
            <CajaIndex
                {...props({ pending_accounts: [], selected_invoice: invoice })}
            />,
        );

        expect(screen.getByText('Factura F-0000009 · Contado')).toBeTruthy();
        expect(screen.getByText('Descuento (10%)')).toBeTruthy();
        expect(
            screen.getByRole('button', { name: 'Registrar pago' }),
        ).toBeTruthy();
        expect(
            screen.queryByRole('button', { name: 'Anular factura' }),
        ).toBeNull();

        rerender(
            <CajaIndex
                {...props({
                    pending_accounts: [],
                    selected_invoice: invoice,
                    can_void: true,
                })}
            />,
        );
        expect(
            screen.getByRole('button', { name: 'Anular factura' }),
        ).toBeTruthy();
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
                            patient: 'Luis Gómez',
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

        fireEvent.click(screen.getByText('Luis Gómez'));
        expect(mockGet).toHaveBeenCalledWith(
            '/facturacion?factura=9',
            {},
            expect.objectContaining({ only: ['selected_invoice'] }),
        );
    });
});
