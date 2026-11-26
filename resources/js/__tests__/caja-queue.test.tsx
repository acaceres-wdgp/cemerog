/**
 * «Cuentas en caja» (Facturación): search, tabs Por cobrar / En atención /
 * Saldadas, groups with their counts and the total at the foot.
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CajaQueue from '@/pages/caja/components/CajaQueue';
import type { BillableAccount, InvoiceSummary } from '@/pages/caja/types';

const account = (
    id: number,
    name: string,
    total: number,
    status: BillableAccount['status'] = 'pendiente_facturar',
): BillableAccount => ({
    id,
    service_date: '26/11/2026',
    status,
    patient: { id, full_name: name, expediente_number: `P-0000${id}` },
    charges: [],
    total,
});

const invoice = (
    id: number,
    name: string,
    status: InvoiceSummary['status'],
    total: number,
    balance: number,
    credit_due_date: string | null = null,
): InvoiceSummary => ({
    id,
    number: `F-000000${id}`,
    status,
    patient: name,
    issued_at: '25/11/2026 9:40 AM',
    total,
    paid_amount: total - balance,
    balance,
    credit_due_date,
});

const pending = [
    account(1, 'Pedro Batista Ureña', 642500),
    account(2, 'Rafael Cruz Bueno', 130000),
];
const inCare = [account(3, 'Frank Olivares', 400000, 'abierta')];
const invoices = [
    invoice(4, 'Marisol Hernández Vargas', 'pendiente', 2000000, 1845000),
    invoice(5, 'Fermín Perdomo', 'pendiente', 80000, 80000, '07/12/2026'),
    invoice(6, 'Gina Seis', 'pagada', 300000, 0),
    invoice(7, 'Hugo Siete', 'anulada', 165000, 165000),
];

function renderQueue(onSelect = vi.fn()) {
    render(
        <CajaQueue
            pending={pending}
            inCare={inCare}
            invoices={invoices}
            selection={{ kind: 'account', id: 1 }}
            onSelect={onSelect}
        />,
    );

    return onSelect;
}

const queue = () => screen.getByRole('region', { name: 'Cuentas en caja' });
const rows = () =>
    within(queue())
        .getAllByRole('button')
        .filter((b) => b.hasAttribute('data-row'));

describe('Cuentas en caja', () => {
    it('opens on «Por cobrar»: pending accounts and invoices with balance, grouped', () => {
        renderQueue();

        expect(screen.getByText('7 en caja')).toBeTruthy();
        expect(
            screen.getByRole('button', { name: /Por cobrar 4/ }),
        ).toHaveAttribute('aria-pressed', 'true');
        expect(
            screen.getByRole('button', { name: /En atención 1/ }),
        ).toBeTruthy();
        expect(screen.getByRole('button', { name: /Saldadas 2/ })).toBeTruthy();

        expect(screen.getByText('Pendientes de facturar')).toBeTruthy();
        expect(screen.getByText('Facturadas con balance')).toBeTruthy();
        expect(screen.queryByText('Frank Olivares')).toBeNull();
        expect(rows()).toHaveLength(4);

        // Invoices show their balance, the number and when they are due
        expect(screen.getByText('RD$18,450.00')).toBeTruthy();
        expect(screen.getByText('F-0000004')).toBeTruthy();
        expect(screen.getByText('Compromiso 07/12')).toBeTruthy();
        expect(screen.getByText('Facturada 25/11')).toBeTruthy();

        expect(screen.getByText('Total por cobrar')).toBeTruthy();
        expect(screen.getByText('4 cuentas')).toBeTruthy();
        // 6,425 + 1,300 + 18,450 + 800
        expect(screen.getByText('RD$26,975.00')).toBeTruthy();
    });

    it('marks the selected account and selects another one', () => {
        const onSelect = renderQueue();

        expect(
            screen.getByRole('button', { name: /Pedro Batista Ureña/ }),
        ).toHaveAttribute('aria-current', 'true');

        fireEvent.click(screen.getByRole('button', { name: /Marisol/ }));
        expect(onSelect).toHaveBeenCalledWith({ kind: 'invoice', id: 4 });
    });

    it('shows the accounts in care and the settled invoices in their tabs', () => {
        renderQueue();

        fireEvent.click(screen.getByRole('button', { name: /En atención 1/ }));
        expect(rows()).toHaveLength(1);
        expect(screen.getByText('Frank Olivares')).toBeTruthy();
        expect(screen.getByText('Acumulado en atención')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: /Saldadas 2/ }));
        expect(screen.getByText('Saldadas hoy')).toBeTruthy();
        expect(screen.getByText('Anuladas hoy')).toBeTruthy();
        expect(screen.getByText('Cobrado hoy')).toBeTruthy();
        // A voided invoice is not money collected
        expect(
            within(screen.getByTestId('queue-total')).getByText('RD$3,000.00'),
        ).toBeTruthy();
    });

    it('searches every account by patient or invoice number, ignoring accents', () => {
        renderQueue();
        const search = screen.getByRole('searchbox', { name: 'Buscar cuenta' });

        fireEvent.change(search, { target: { value: 'hernandez' } });
        expect(rows()).toHaveLength(1);
        expect(
            screen.getByText('1 resultado en todas las cuentas'),
        ).toBeTruthy();

        fireEvent.change(search, { target: { value: 'f-0000006' } });
        expect(screen.getByText('Gina Seis')).toBeTruthy();
        expect(screen.getByText('Total de resultados')).toBeTruthy();

        fireEvent.change(search, { target: { value: 'olivares' } });
        expect(screen.getByText('Frank Olivares')).toBeTruthy();

        fireEvent.change(search, { target: { value: 'zzz' } });
        expect(screen.getByText('No hay cuentas que coincidan.')).toBeTruthy();

        fireEvent.click(
            screen.getByRole('button', { name: 'Limpiar búsqueda' }),
        );
        expect(search).toHaveValue('');
        expect(rows()).toHaveLength(4);
    });

    it('moves to the tab of an account selected from outside', () => {
        const { rerender } = render(
            <CajaQueue
                pending={pending}
                inCare={inCare}
                invoices={invoices}
                selection={{ kind: 'account', id: 1 }}
                onSelect={vi.fn()}
            />,
        );

        // The invoice just emitted and fully paid
        rerender(
            <CajaQueue
                pending={pending}
                inCare={inCare}
                invoices={invoices}
                selection={{ kind: 'invoice', id: 6 }}
                onSelect={vi.fn()}
            />,
        );

        expect(
            screen.getByRole('button', { name: /Saldadas 2/ }),
        ).toHaveAttribute('aria-pressed', 'true');
        expect(
            screen.getByRole('button', { name: /Gina Seis/ }),
        ).toHaveAttribute('aria-current', 'true');
    });
});
