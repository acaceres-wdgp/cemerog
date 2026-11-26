/**
 * Caja › Facturas: period, KPIs, state tabs, filters, the table with its
 * pages and totals, and the invoice detail on the side.
 */
import React from 'react';
import { fireEvent, render, screen, within, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGet, mockVisit, page } = vi.hoisted(() => ({
    mockGet: vi.fn(),
    mockVisit: vi.fn(),
    page: {
        props: {
            errors: {},
            permissions: [
                'module.caja.access',
                'module.cxc.access',
                'module.pacientes.access',
            ] as string[],
        },
    },
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    router: { get: mockGet, visit: mockVisit },
    usePage: () => page,
}));

import FacturasIndex from '@/pages/facturas/index';
import type {
    FacturasProps,
    InvoiceListDetail,
    InvoiceListRow,
} from '@/pages/facturas/types';

const row = (overrides: Partial<InvoiceListRow> = {}): InvoiceListRow => ({
    id: 4,
    number: 'F-0000004',
    status: 'pendiente',
    issued_on: '26/11/2026',
    issued_time: '9:40 AM',
    patient: {
        id: 1,
        full_name: 'Marisol Hernández Vargas',
        document_number: '031-0567812-4',
    },
    area: 'Emergencia',
    condition: 'Crédito',
    total: 2000000,
    paid_amount: 155000,
    balance: 1845000,
    cashier: 'Rosa Castillo',
    ...overrides,
});

const kpis = {
    billed: 2300000,
    billed_count: 2,
    collected: 455000,
    pending: 1845000,
    pending_count: 1,
    voided: 80000,
    voided_count: 1,
};

const detail: InvoiceListDetail = {
    id: 4,
    number: 'F-0000004',
    status: 'pendiente',
    issued_at: '26/11/2026 9:40 AM',
    total: 2000000,
    paid_amount: 155000,
    balance: 1845000,
    credit_due_date: '10/12/2026',
    patient: {
        id: 1,
        full_name: 'Marisol Hernández Vargas',
        expediente_number: 'P-00001',
        document_number: '031-0567812-4',
    },
    service_date: '26/11/2026',
    issued_by: 'Rosa Castillo',
    subtotal: 2000000,
    discount_type: null,
    discount_value: null,
    discount_amount: 0,
    discount_reason: null,
    credit_note: null,
    receipts: [
        {
            id: 31,
            number: 'R-0031',
            created_at: '26/11/2026 9:41 AM',
            created_by: 'Rosa Castillo',
            total: 155000,
            voided: false,
            void_reason: null,
            payments: [
                {
                    method: 'efectivo',
                    amount: 155000,
                    cash_received: null,
                    change_given: null,
                    reference: null,
                },
            ],
        },
    ],
    void_reason: null,
    voided_by: null,
    voided_at: null,
    lines: [
        {
            id: 1,
            date: '26/11/2026',
            area: 'Emergencia',
            description: 'Consulta de emergencia',
            quantity: 1,
            unit_price: 1500000,
            total: 1500000,
            doctor: null,
        },
        {
            id: 2,
            date: '26/11/2026',
            area: 'Farmacia',
            description: 'Dipirona ampolla',
            quantity: 2,
            unit_price: 250000,
            total: 500000,
            doctor: null,
        },
    ],
    area: 'Emergencia',
    condition: 'Crédito',
};

const props = (overrides: Partial<FacturasProps> = {}): FacturasProps => ({
    filters: {
        periodo: 'mes',
        estado: 'todas',
        area: '',
        condicion: '',
        cajero: '',
        q: '',
    },
    period_label: 'Noviembre 2026',
    invoices: {
        data: [
            row(),
            row({
                id: 5,
                number: 'F-0000005',
                status: 'pagada',
                patient: {
                    id: 2,
                    full_name: 'Gina Seis',
                    document_number: '001-0000000-1',
                },
                area: 'Consulta',
                condition: 'Contado',
                total: 300000,
                paid_amount: 300000,
                balance: 0,
            }),
            row({
                id: 6,
                number: 'F-0000006',
                status: 'anulada',
                patient: {
                    id: 3,
                    full_name: 'Hugo Siete',
                    document_number: '001-0000000-2',
                },
                condition: 'Contado',
                total: 80000,
                paid_amount: 0,
                balance: 0,
            }),
        ],
        current_page: 1,
        last_page: 2,
        from: 1,
        to: 15,
        total: 18,
    },
    kpis,
    totals: kpis,
    counts: { todas: 18, pendiente: 6, pagada: 11, anulada: 1 },
    areas: ['Cirugía', 'Consulta', 'Emergencia', 'Otros'],
    cashiers: [
        { id: 7, name: 'Juan Peña' },
        { id: 8, name: 'Rosa Castillo' },
    ],
    selected_invoice: null,
    ...overrides,
});

/** The query of the last visit */
const lastQuery = () => {
    const url = String(mockGet.mock.calls.at(-1)?.[0]);
    return Object.fromEntries(new URL(url, 'http://x').searchParams);
};

beforeEach(() => {
    mockGet.mockReset();
    mockVisit.mockReset();
});
afterEach(() => vi.useRealTimers());

describe('Facturas', () => {
    it('shows the period, the KPIs and the invoices with their state', () => {
        render(<FacturasIndex {...props()} />);

        expect(
            screen.getByRole('button', { name: 'Este mes' }),
        ).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByText('Noviembre 2026')).toBeTruthy();

        const kpi = (label: string) =>
            screen.getByRole('group', { name: label }).textContent;
        expect(kpi('Facturado')).toContain('RD$23,000.00');
        expect(kpi('Facturado')).toContain('2 facturas');
        expect(kpi('Cobrado')).toContain('20 % de lo facturado');
        expect(kpi('Pendiente de cobro')).toContain('1 con balance');
        expect(kpi('Anulado')).toContain('1 anulada');

        expect(screen.getByRole('button', { name: /Todas 18/ })).toBeTruthy();
        expect(screen.getByText('18 facturas')).toBeTruthy();

        const table = screen.getByRole('table');
        expect(
            within(table).getByText('Marisol Hernández Vargas'),
        ).toBeTruthy();
        expect(within(table).getByText('Con balance')).toBeTruthy();
        expect(within(table).getByText('Saldada')).toBeTruthy();
        expect(within(table).getByText('Anulada')).toBeTruthy();
        // A voided invoice paid nothing and owes nothing
        const voided = within(table).getByText('Hugo Siete').closest('tr')!;
        expect(within(voided).getAllByText('—')).toHaveLength(2);

        expect(screen.getByText('Mostrando 1–15 de 18')).toBeTruthy();
        expect(screen.getByText('Página 1 de 2')).toBeTruthy();
    });

    it('changes the period, the state and the filters on the server, from page 1', () => {
        render(
            <FacturasIndex
                {...props({
                    invoices: { ...props().invoices, current_page: 2 },
                })}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: '7 días' }));
        expect(lastQuery()).toEqual({ periodo: 'semana' });

        fireEvent.click(screen.getByRole('button', { name: /Con balance 6/ }));
        expect(lastQuery()).toEqual({ estado: 'pendiente' });

        fireEvent.change(screen.getByLabelText('Área'), {
            target: { value: 'Cirugía' },
        });
        expect(lastQuery()).toEqual({ area: 'Cirugía' });

        fireEvent.change(screen.getByLabelText('Condición'), {
            target: { value: 'credito' },
        });
        fireEvent.change(screen.getByLabelText('Cajero'), {
            target: { value: '7' },
        });
        expect(lastQuery()).toEqual({ cajero: '7' });
    });

    it('searches after typing and clears the filters', () => {
        vi.useFakeTimers();
        render(
            <FacturasIndex
                {...props({
                    filters: { ...props().filters, area: 'Consulta' },
                })}
            />,
        );

        fireEvent.change(
            screen.getByRole('searchbox', { name: 'Buscar factura' }),
            {
                target: { value: 'marisol' },
            },
        );
        expect(mockGet).not.toHaveBeenCalled();
        act(() => {
            vi.advanceTimersByTime(400);
        });
        expect(lastQuery()).toEqual({ area: 'Consulta', q: 'marisol' });

        fireEvent.click(
            screen.getByRole('button', { name: 'Limpiar filtros' }),
        );
        expect(lastQuery()).toEqual({});
    });

    it('moves between pages keeping the filters', () => {
        render(
            <FacturasIndex
                {...props({
                    filters: { ...props().filters, estado: 'pagada' },
                })}
            />,
        );

        expect(
            screen.getByRole('button', { name: 'Página anterior' }),
        ).toBeDisabled();
        fireEvent.click(
            screen.getByRole('button', { name: 'Página siguiente' }),
        );
        expect(lastQuery()).toEqual({ estado: 'pagada', page: '2' });
    });

    it('says when nothing matches', () => {
        render(
            <FacturasIndex
                {...props({
                    invoices: {
                        data: [],
                        current_page: 1,
                        last_page: 1,
                        from: null,
                        to: null,
                        total: 0,
                    },
                })}
            />,
        );

        expect(
            screen.getByText('No hay facturas para este filtro.'),
        ).toBeTruthy();
    });

    it('opens the detail of an invoice from the server', () => {
        render(<FacturasIndex {...props()} />);

        fireEvent.click(screen.getByRole('button', { name: 'F-0000004' }));

        const [url, , options] = mockGet.mock.calls.at(-1)!;
        expect(String(url)).toContain('factura=4');
        expect(options).toMatchObject({ only: ['selected_invoice'] });
    });

    it('shows the detail with payments, history and its actions', () => {
        render(<FacturasIndex {...props({ selected_invoice: detail })} />);

        const drawer = screen.getByRole('dialog', {
            name: /Factura F-0000004/,
        });
        expect(
            within(drawer).getByText(/Crédito · compromiso 10\/12\/2026/),
        ).toBeTruthy();
        expect(within(drawer).getByText('031-0567812-4')).toBeTruthy();
        expect(
            within(drawer).getByText(/Atención del 26\/11\/2026 · Emergencia/),
        ).toBeTruthy();
        expect(within(drawer).getByText('Dipirona ampolla')).toBeTruthy();
        expect(within(drawer).getByText('RD$18,450.00')).toBeTruthy();
        expect(
            within(drawer).getAllByText(/Recibo R-0031/).length,
        ).toBeGreaterThan(0);
        expect(
            within(drawer).getByRole('link', {
                name: 'Reimprimir recibo R-0031',
            }),
        ).toHaveAttribute('href', '/facturacion/recibos/31/imprimir');
        expect(within(drawer).getByText('Factura emitida')).toBeTruthy();
        expect(
            within(drawer).getByText('Pago RD$1,550.00 · Efectivo'),
        ).toBeTruthy();

        expect(
            within(drawer).getByRole('link', { name: /Imprimir factura/ }),
        ).toHaveAttribute('href', '/facturacion/facturas/4/imprimir');
        expect(
            within(drawer).getByRole('link', { name: /Ver paciente/ }),
        ).toHaveAttribute('href', '/pacientes/1');
        // Paying is done in Cuentas por cobrar, with this invoice loaded
        expect(
            within(drawer).getByRole('link', { name: /Registrar pago/ }),
        ).toHaveAttribute('href', '/cuentas-por-cobrar?factura=F-0000004');
    });

    it('a voided invoice shows its reason and cannot be paid', () => {
        render(
            <FacturasIndex
                {...props({
                    selected_invoice: {
                        ...detail,
                        status: 'anulada',
                        balance: 0,
                        receipts: [],
                        paid_amount: 0,
                        void_reason: 'Error en los cargos',
                        voided_by: 'Admin',
                        voided_at: '26/11/2026 11:40 AM',
                    },
                })}
            />,
        );

        const drawer = screen.getByRole('dialog');
        expect(within(drawer).getByText(/Error en los cargos/)).toBeTruthy();
        expect(within(drawer).getByText('Sin pagos registrados.')).toBeTruthy();
        expect(within(drawer).getByText('Factura anulada')).toBeTruthy();
        expect(
            within(drawer).queryByRole('link', { name: /Registrar pago/ }),
        ).toBeNull();
    });

    it('hides the actions the user has no access to', () => {
        page.props.permissions = ['module.caja.access'];
        render(<FacturasIndex {...props({ selected_invoice: detail })} />);

        const drawer = screen.getByRole('dialog');
        expect(
            within(drawer).queryByRole('link', { name: /Ver paciente/ }),
        ).toBeNull();
        expect(
            within(drawer).queryByRole('link', { name: /Registrar pago/ }),
        ).toBeNull();
        page.props.permissions = [
            'module.caja.access',
            'module.cxc.access',
            'module.pacientes.access',
        ];
    });
});
