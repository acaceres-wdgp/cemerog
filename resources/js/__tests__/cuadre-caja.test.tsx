/**
 * Cash register shift: closing form, cuadre page and topbar indicator.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPost, page } = vi.hoisted(() => ({
    mockPost: vi.fn(),
    page: {
        props: {
            errors: {} as Record<string, string>,
            permissions: ['module.caja.access', 'module.cuadre.access'],
            cash_shift: null as unknown,
        },
    },
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    Link: ({
        children,
        href,
        className,
    }: {
        children: React.ReactNode;
        href: string;
        className?: string;
    }) => (
        <a href={href} className={className}>
            {children}
        </a>
    ),
    router: { post: mockPost },
    usePage: () => page,
}));

import CuadreIndex from '@/pages/cuadre/index';
import CashShiftIndicator from '@/components/caja/CashShiftIndicator';
import type { OpenShift } from '@/pages/cuadre/types';

const openShift: OpenShift = {
    id: 1,
    opened_by: 'Kenia Marte',
    opened_at: '31/10/2026 08:00',
    pending_close: false,
    can_operate: true,
    summary: {
        opening: 500000,
        income: { efectivo: 0, tarjeta: 0, transferencia: 0 },
        withdrawals: 0,
        expected_cash: 500000,
    },
    withdrawals: [],
    receipts: [],
};

describe('Cuadre de caja', () => {
    beforeEach(() => {
        mockPost.mockClear();
        page.props.cash_shift = null;
    });

    it('without an open shift offers to open one', () => {
        render(<CuadreIndex shift={null} history={[]} denominations={[]} />);

        expect(
            screen.getByText('No hay un turno de caja abierto'),
        ).toBeTruthy();
        expect(
            screen.getByRole('button', { name: 'Abrir turno' }),
        ).toBeTruthy();
    });

    it('shows the shortage and asks for a note before closing', () => {
        render(
            <CuadreIndex shift={openShift} history={[]} denominations={[]} />,
        );

        fireEvent.change(screen.getByLabelText(/Monto \(RD\$\)/), {
            target: { value: '4800' },
        });
        expect(screen.getByRole('status').textContent).toMatch(/Faltante/);

        fireEvent.click(screen.getByRole('checkbox'));
        const close = screen.getByRole('button', { name: 'Cerrar turno' });
        expect(close).toBeDisabled();

        fireEvent.change(screen.getByLabelText(/Explica la diferencia/), {
            target: { value: 'Se dio mal un cambio' },
        });
        expect(close).not.toBeDisabled();

        fireEvent.click(close);
        expect(mockPost).toHaveBeenCalledWith(
            '/cuadre-de-caja/cerrar',
            {
                counted_cash: 480000,
                close_note: 'Se dio mal un cambio',
                confirmed: true,
            },
            expect.anything(),
        );
    });

    it('closes without a note when the count matches', () => {
        render(
            <CuadreIndex shift={openShift} history={[]} denominations={[]} />,
        );

        fireEvent.change(screen.getByLabelText(/Monto \(RD\$\)/), {
            target: { value: '5000' },
        });
        expect(screen.getByRole('status').textContent).toMatch(/Cuadrado/);
        expect(screen.queryByLabelText(/Explica la diferencia/)).toBeNull();

        fireEvent.click(screen.getByRole('checkbox'));
        fireEvent.click(screen.getByRole('button', { name: 'Cerrar turno' }));
        expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it('sends the count by denomination', () => {
        render(
            <CuadreIndex shift={openShift} history={[]} denominations={[]} />,
        );

        fireEvent.click(screen.getByText('Por denominación'));
        fireEvent.change(screen.getByLabelText('Cantidad de RD$2000'), {
            target: { value: '2' },
        });
        fireEvent.change(screen.getByLabelText('Cantidad de RD$1000'), {
            target: { value: '1' },
        });
        fireEvent.click(screen.getByRole('checkbox'));
        fireEvent.click(screen.getByRole('button', { name: 'Cerrar turno' }));

        expect(mockPost).toHaveBeenCalledWith(
            '/cuadre-de-caja/cerrar',
            {
                denominations: { '2000': 2, '1000': 1 },
                close_note: null,
                confirmed: true,
            },
            expect.anything(),
        );
    });

    it('another cashier cannot close the shift', () => {
        render(
            <CuadreIndex
                shift={{ ...openShift, can_operate: false }}
                history={[]}
                denominations={[]}
            />,
        );

        expect(
            screen.queryByRole('button', { name: 'Cerrar turno' }),
        ).toBeNull();
        expect(
            screen.getByText(/Solo Kenia Marte o un administrador/),
        ).toBeTruthy();
    });
});

describe('CashShiftIndicator', () => {
    it('shows the closed register with an Abrir turno action', () => {
        page.props.cash_shift = null;
        render(<CashShiftIndicator />);

        expect(screen.getByText(/Caja cerrada · Abrir turno/)).toBeTruthy();
    });

    it('shows who has the register open and links to the cuadre', () => {
        page.props.cash_shift = {
            id: 1,
            opened_by: 'Kenia Marte',
            opened_at: '31/10/2026 08:00',
            mine: false,
            can_operate: false,
            pending_close: false,
        };
        render(<CashShiftIndicator />);

        expect(
            screen.getByRole('link', { name: /Caja abierta · Kenia Marte/ }),
        ).toHaveAttribute('href', '/cuadre-de-caja');
    });

    it('warns when the shift was left open from a previous day', () => {
        page.props.cash_shift = {
            id: 1,
            opened_by: 'Kenia Marte',
            opened_at: '30/10/2026 08:00',
            mine: true,
            can_operate: true,
            pending_close: true,
        };
        render(<CashShiftIndicator />);

        expect(screen.getByText('Caja pendiente de cierre')).toBeTruthy();
    });
});
