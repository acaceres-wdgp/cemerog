/** Cuadre de caja del día: the document to print with every shift of the day */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ReporteDia, { type CashDay } from '@/pages/cuadre/reporte-dia';

const summary = (
    opening: number,
    efectivo: number,
    tarjeta: number,
    transferencia: number,
    withdrawals: number,
) => ({
    opening,
    income: { efectivo, tarjeta, transferencia },
    transactions: { efectivo: 1, tarjeta: 1, transferencia: 1 },
    withdrawals,
    expected_cash: opening + efectivo - withdrawals,
});

const day: CashDay = {
    date: '26/11/2026',
    label: 'jueves, 26 de noviembre de 2026',
    shifts: [
        {
            id: 1,
            label: 'Mañana',
            status: 'cerrado',
            opened_by: 'Kenia Marte',
            opened_at: '8:00 AM',
            closed_by: 'Kenia Marte',
            closed_at: '12:30 PM',
            summary: summary(100000, 200000, 0, 0, 50000),
            expected_cash: 250000,
            counted_cash: 240000,
            difference: -10000,
            close_note: 'Faltó un billete',
        },
        {
            id: 2,
            label: 'Tarde',
            status: 'abierto',
            opened_by: 'Rosa Castillo',
            opened_at: '2:00 PM',
            closed_by: null,
            closed_at: null,
            summary: summary(50000, 0, 100000, 50000, 0),
            expected_cash: 50000,
            counted_cash: null,
            difference: null,
            close_note: null,
        },
    ],
    open_shifts: 1,
    totals: {
        opening: 150000,
        income: { efectivo: 200000, tarjeta: 100000, transferencia: 50000 },
        collected: 350000,
        withdrawals: 50000,
        expected_cash: 300000,
        counted_cash: 240000,
        difference: -10000,
    },
    receipts: [
        {
            id: 1,
            number: 'R-0001',
            created_at: '26/11/2026 8:30 AM',
            created_by: 'Kenia Marte',
            total: 200000,
            voided: false,
            void_reason: null,
            shift: 'Mañana',
            time: '8:30 AM',
            invoice_number: 'F-0000001',
            patient: 'Ana Torres',
            payments: [
                {
                    method: 'efectivo',
                    amount: 200000,
                    cash_received: null,
                    change_given: null,
                    reference: null,
                },
            ],
        },
    ],
    withdrawals: [
        {
            id: 1,
            shift: 'Mañana',
            time: '11:00 AM',
            amount: 50000,
            reason: 'Depósito al banco',
            created_by: 'Kenia Marte',
        },
    ],
    billing: {
        count: 3,
        total: 430000,
        on_credit: 80000,
        discounts: 0,
        voided_count: 1,
        voided_total: 30000,
    },
};
const clinic = { name: 'Clínica', rnc: null, phone: null, address: null };

describe('Cuadre de caja del día', () => {
    it('shows the totals of the day, the shifts, receipts and withdrawals, with signatures', () => {
        render(
            <ReporteDia
                day={day}
                clinic={clinic}
                printed_by="Admin"
                printed_at="26/11/2026 5:00 PM"
            />,
        );

        expect(
            screen.getByRole('heading', { name: 'Cuadre de caja del día' }),
        ).toBeTruthy();
        expect(
            screen.getByText('jueves, 26 de noviembre de 2026'),
        ).toBeTruthy();
        expect(
            screen.getByText('Hay 1 turno abierto: sus cifras son parciales.'),
        ).toBeTruthy();

        const collected = screen.getByRole('region', { name: 'Cobrado' });
        expect(
            within(collected).getByText('Total cobrado').nextSibling
                ?.textContent,
        ).toBe('RD$3,500.00');
        const cash = screen.getByRole('region', { name: 'Efectivo en caja' });
        expect(
            within(cash).getByText('Diferencia').nextSibling?.textContent,
        ).toBe('Faltante RD$100.00');

        const billing = screen.getByRole('region', {
            name: 'Facturación del día',
        });
        expect(
            within(billing).getByText('Facturas emitidas (3)').nextSibling
                ?.textContent,
        ).toBe('RD$4,300.00');
        expect(within(billing).getByText('Facturas anuladas (1)')).toBeTruthy();

        const shifts = screen.getByRole('region', { name: 'Turnos' });
        expect(within(shifts).getByText('Faltó un billete')).toBeTruthy();
        expect(within(shifts).getByText('Abierto')).toBeTruthy();

        expect(
            within(screen.getByRole('region', { name: 'Recibos' })).getByText(
                'Ana Torres',
            ),
        ).toBeTruthy();
        expect(
            within(screen.getByRole('region', { name: 'Retiros' })).getByText(
                /Depósito al banco/,
            ),
        ).toBeTruthy();
        expect(screen.getByText('Recibido por (supervisor)')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Imprimir' })).toBeTruthy();
    });

    it('a day without shifts says so', () => {
        render(
            <ReporteDia
                day={{
                    ...day,
                    shifts: [],
                    open_shifts: 0,
                    receipts: [],
                    withdrawals: [],
                }}
                clinic={clinic}
            />,
        );

        expect(screen.getByText('No se abrió la caja este día.')).toBeTruthy();
    });
});
