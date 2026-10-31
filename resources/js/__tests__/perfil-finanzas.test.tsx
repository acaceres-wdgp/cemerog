/**
 * Patient profile · Finanzas: invoices with balance and payments received.
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { page } = vi.hoisted(() => ({
    page: {
        props: {
            errors: {},
            permissions: ['module.caja.access'] as string[],
            cash_shift: null,
        },
        flash: {},
    },
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    router: { get: vi.fn(), post: vi.fn() },
    usePage: () => page,
}));

import FinanzasTab from '@/pages/pacientes/components/perfil/FinanzasTab';
import type { Finanzas } from '@/pages/pacientes/components/perfil/types';

const finanzas: Finanzas = {
    cuentas: [],
    total_cargado: 380000,
    pendiente_facturar: 0,
    facturas: [
        {
            id: 2,
            number: 'F-0000002',
            issued_on: '30/10/2026',
            total: 80000,
            paid_amount: 80000,
            balance: 0,
            status: 'pagada',
            credit_due_date: null,
        },
        {
            id: 1,
            number: 'F-0000001',
            issued_on: '20/10/2026',
            total: 300000,
            paid_amount: 150000,
            balance: 150000,
            status: 'pendiente',
            credit_due_date: null,
        },
    ],
    pagos: [
        {
            id: 3,
            number: 'R-0003',
            date: '30/10/2026',
            invoice_id: 2,
            invoice_number: 'F-0000002',
            methods: 'Transferencia',
            amount: 80000,
            kind: 'Pago total',
            voided: false,
        },
        {
            id: 2,
            number: 'R-0002',
            date: '25/10/2026',
            invoice_id: 1,
            invoice_number: 'F-0000001',
            methods: 'Tarjeta',
            amount: 50000,
            kind: 'Abono parcial',
            voided: false,
        },
    ],
    total_facturado: 380000,
    total_pagado: 230000,
    saldo: 150000,
};

describe('Finanzas del paciente', () => {
    it('lists the invoices, the totals and every payment received', () => {
        render(<FinanzasTab finanzas={finanzas} patientName="Ana Torres" />);

        expect(screen.getByText(/El paciente adeuda/)).toBeTruthy();
        const invoices = screen.getByText('Facturas').closest('section')!;
        expect(within(invoices).getByText('Saldada')).toBeTruthy();
        expect(within(invoices).getByText('Con balance')).toBeTruthy();
        // Only the invoice with a balance can be collected
        expect(
            within(invoices).getAllByRole('button', { name: 'Registrar pago' }),
        ).toHaveLength(1);

        const payments = screen
            .getByText('Pagos recibidos')
            .closest('section')!;
        expect(within(payments).getByText('Abono parcial')).toBeTruthy();
        expect(
            within(payments).getByRole('link', { name: 'R-0003' }),
        ).toHaveAttribute('href', '/facturacion/recibos/3/imprimir');
    });

    it('without Caja access there is no «Registrar pago»', () => {
        page.props.permissions = [];
        render(<FinanzasTab finanzas={finanzas} patientName="Ana Torres" />);

        expect(
            screen.queryByRole('button', { name: 'Registrar pago' }),
        ).toBeNull();
        page.props.permissions = ['module.caja.access'];
    });
});
