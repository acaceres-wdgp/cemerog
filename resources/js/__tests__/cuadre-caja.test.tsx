/**
 * Cash register shift: closing form, cuadre page and topbar indicator.
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
    router: { post: mockPost, get: mockGet },
    usePage: () => page,
}));

import CuadreIndex from '@/pages/cuadre/index';
import CashShiftIndicator from '@/components/caja/CashShiftIndicator';
import type { CashShiftView, CuadreProps } from '@/pages/cuadre/types';

const DENOMINATIONS = [2000, 1000, 500, 200, 100, 50, 25, 10, 5, 1];

/** RD$1,000 float, RD$2,000 cash, RD$1,000 card and RD$500 transfer */
const openShift: CashShiftView = {
    id: 7,
    status: 'abierto',
    opened_by: 'Kenia Marte',
    opened_at: '31/10/2026 08:00',
    closed_by: null,
    closed_at: null,
    pending_close: false,
    can_operate: true,
    summary: {
        opening: 100000,
        income: { efectivo: 200000, tarjeta: 100000, transferencia: 50000 },
        transactions: { efectivo: 1, tarjeta: 1, transferencia: 1 },
        withdrawals: 0,
        expected_cash: 300000,
    },
    counted: null,
    difference: null,
    close_note: null,
    movements: [
        {
            id: 1,
            receipt_id: 1,
            time: '09:10',
            receipt: 'R-0001',
            patient: 'Ana Torres',
            concept: 'Pago de F-0000001',
            method: 'efectivo',
            amount: 200000,
            voided: false,
        },
        {
            id: 2,
            receipt_id: 2,
            time: '09:40',
            receipt: 'R-0002',
            patient: 'Luis Gómez',
            concept: 'Pago de F-0000002',
            method: 'tarjeta',
            amount: 100000,
            voided: false,
        },
        {
            id: 3,
            receipt_id: 2,
            time: '09:40',
            receipt: 'R-0002',
            patient: 'Luis Gómez',
            concept: 'Pago de F-0000002',
            method: 'transferencia',
            amount: 50000,
            voided: false,
        },
    ],
    withdrawals: [],
};

const props = (overrides: Partial<CuadreProps> = {}): CuadreProps => ({
    shift: openShift,
    shifts: [
        { id: 7, label: 'Hoy · Mañana', status: 'abierto' },
        { id: 6, label: '30/10 · Tarde', status: 'cerrado' },
    ],
    denominations: DENOMINATIONS,
    ...overrides,
});

const count = (label: string, n: string) =>
    fireEvent.change(screen.getByLabelText(`Cantidad de ${label}`), {
        target: { value: n },
    });

describe('Cuadre de caja', () => {
    beforeEach(() => {
        mockPost.mockClear();
        mockGet.mockClear();
        page.props.cash_shift = null;
    });

    it('without an open shift offers to open one', () => {
        render(<CuadreIndex {...props({ shift: null, shifts: [] })} />);

        expect(screen.getByText(/Aún no se ha abierto el turno/)).toBeTruthy();
        expect(
            screen.getByRole('button', { name: 'Abrir turno' }),
        ).toBeTruthy();
    });

    it('shows the stats, expected per method and the movements of the shift', () => {
        render(<CuadreIndex {...props()} />);

        expect(screen.getByText('Fondo de apertura')).toBeTruthy();
        expect(screen.getByText('Ingresos del turno')).toBeTruthy();
        expect(screen.getByText('2 recibos')).toBeTruthy();
        expect(screen.getByText('Esperado vs. contado')).toBeTruthy();
        expect(screen.getByText('3 movimientos')).toBeTruthy();
        expect(screen.getAllByText('R-0002')).toHaveLength(2);
        expect(screen.getByText('Abierto')).toBeTruthy();
        // Card and transfer start at what is expected; cash is still uncounted
        expect(screen.getByLabelText('Contado Tarjeta')).toHaveValue('1000.00');
        expect(screen.getByText('Diferencia · faltante')).toBeTruthy();
    });

    it('counting the exact cash squares the register and closes after confirming', () => {
        render(<CuadreIndex {...props()} />);

        count('RD$2,000', '1');
        count('RD$1,000', '1');
        expect(screen.getByText('Diferencia · cuadrado')).toBeTruthy();
        expect(screen.getByLabelText('Contado Efectivo')).toHaveValue(
            '3,000.00',
        );

        fireEvent.click(screen.getByRole('button', { name: 'Cerrar turno' }));
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByText('¿Caja cuadrada?')).toBeTruthy();
        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Cerrar turno' }),
        );

        expect(mockPost).toHaveBeenCalledWith(
            '/cuadre-de-caja/cerrar',
            {
                counted_cash: 300000,
                denominations: { '1000': 1, '2000': 1 },
                counted_card: 100000,
                counted_transfer: 50000,
                close_note: null,
                confirmed: true,
            },
            expect.anything(),
        );
    });

    it('a difference, also in card, needs an observation before closing', () => {
        render(<CuadreIndex {...props()} />);

        count('RD$2,000', '1');
        count('RD$1,000', '1');
        fireEvent.change(screen.getByLabelText('Contado Tarjeta'), {
            target: { value: '900' },
        });
        expect(screen.getByText('Diferencia · faltante')).toBeTruthy();

        const close = screen.getByRole('button', { name: 'Cerrar turno' });
        expect(close).toBeDisabled();
        fireEvent.change(screen.getByLabelText(/Observaciones del cierre/), {
            target: { value: 'Datáfono con un pago menos' },
        });
        expect(close).not.toBeDisabled();
    });

    it('another cashier cannot close the shift', () => {
        render(
            <CuadreIndex
                {...props({ shift: { ...openShift, can_operate: false } })}
            />,
        );

        expect(
            screen.queryByRole('button', { name: 'Cerrar turno' }),
        ).toBeNull();
        expect(
            screen.getByText(/Solo Kenia Marte o un administrador/),
        ).toBeTruthy();
    });

    it('a closed shift shows what was counted, read-only, and its report', () => {
        const closed: CashShiftView = {
            ...openShift,
            id: 6,
            status: 'cerrado',
            can_operate: false,
            closed_by: 'Kenia Marte',
            closed_at: '30/10/2026 18:00',
            counted: {
                cash: 280000,
                card: 100000,
                transfer: 50000,
                denominations: { '2000': 1, '500': 1, '200': 1, '100': 1 },
            },
            difference: -20000,
            close_note: 'Faltante por cambio',
        };
        render(<CuadreIndex {...props({ shift: closed })} />);

        expect(screen.getByText('Cerrado')).toBeTruthy();
        expect(
            screen.getByText(/Turno cerrado el 30\/10\/2026 18:00/),
        ).toBeTruthy();
        expect(screen.getByText('Faltante por cambio')).toBeTruthy();
        expect(screen.getByLabelText('Cantidad de RD$2,000')).toHaveAttribute(
            'readonly',
        );
        expect(
            screen.getByRole('link', { name: /Imprimir reporte/ }),
        ).toHaveAttribute('href', '/cuadre-de-caja/turnos/6/reporte');
        expect(
            screen.queryByRole('button', { name: 'Cerrar turno' }),
        ).toBeNull();
    });

    it('picking another shift loads it', () => {
        render(<CuadreIndex {...props()} />);

        fireEvent.click(screen.getByRole('tab', { name: /30\/10 · Tarde/ }));
        expect(mockGet).toHaveBeenCalledWith(
            '/cuadre-de-caja?turno=6',
            {},
            expect.anything(),
        );
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
