/**
 * Laboratorio: cola de hoy, ingreso de resultados y validación.
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPost, mockVisit } = vi.hoisted(() => ({
    mockPost: vi.fn(),
    mockVisit: vi.fn(),
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    router: { post: mockPost, visit: mockVisit, get: vi.fn() },
    usePage: () => ({ props: { errors: {} } }),
}));

import LabIndex from '@/pages/lab/index';
import LabShow from '@/pages/lab/show';
import type { LabDetail, LabRow } from '@/pages/lab/types';

const row = (id: number, status: LabRow['status'], name: string): LabRow => ({
    id,
    number: `L-000${id}`,
    status,
    ordered_at: '01/11/2026 08:1' + id,
    ordered_time: '08:1' + id,
    ordered_date: '01/11/2026',
    tests: ['Hemograma completo', 'Glucosa en ayunas'],
    total: 55000,
    indication: null,
    cancel_reason: null,
    origin: 'Consulta',
    doctor: 'Dr. Franklin Rodríguez',
    patient: {
        id,
        full_name: name,
        age: 34,
        sex: 'F',
        document_number: '031-0456789-2',
    },
    has_out_of_range: false,
    validated_at: null,
});

const orders = [
    row(1, 'muestra', 'Rosa Peña'),
    row(2, 'ordenada', 'José Tavárez'),
    row(3, 'validada', 'Ana Gómez'),
];
const counts = {
    ordenada: 1,
    muestra: 1,
    ingresado: 0,
    validada: 1,
    entregada: 0,
    cancelada: 0,
};

describe('Cola de laboratorio', () => {
    beforeEach(() => {
        mockPost.mockClear();
        mockVisit.mockClear();
    });

    it('lists the orders by step, with the next action of each one', () => {
        render(<LabIndex view="hoy" orders={orders} counts={counts} />);

        expect(
            screen.getByText(
                /3 órdenes · 1 por tomar muestra · 1 por resultado o validación · 1 por entregar/,
            ),
        ).toBeTruthy();
        const rows = screen.getAllByRole('row').slice(1);
        expect(within(rows[0]).getByText('José Tavárez')).toBeTruthy();
        expect(within(rows[2]).getByText('Ana Gómez')).toBeTruthy();

        fireEvent.click(
            within(rows[0]).getByRole('button', { name: 'Tomar muestra' }),
        );
        expect(mockPost).toHaveBeenCalledWith(
            '/laboratorio/ordenes/2/muestra',
            {},
            expect.anything(),
        );
        fireEvent.click(
            within(rows[2]).getByRole('button', { name: 'Entregar' }),
        );
        expect(mockPost).toHaveBeenCalledWith(
            '/laboratorio/ordenes/3/entregar',
            {},
            expect.anything(),
        );
        expect(
            within(rows[1]).getByRole('link', { name: 'Ingresar resultados' }),
        ).toHaveAttribute('href', '/laboratorio/ordenes/1');
    });

    it('filters by status and opens an order', () => {
        render(<LabIndex view="hoy" orders={orders} counts={counts} />);

        fireEvent.click(screen.getByRole('tab', { name: /Validada/ }));
        expect(screen.getAllByRole('row')).toHaveLength(2);
        fireEvent.click(screen.getByText('Ana Gómez'));
        expect(mockVisit).toHaveBeenCalledWith('/laboratorio/ordenes/3');
    });
});

const detail = (o: Partial<LabDetail> = {}): LabDetail => ({
    ...row(1, 'ingresado', 'Rosa Peña'),
    sample_at: '01/11/2026 08:20',
    validated_by: null,
    delivered_at: null,
    can_validate: true,
    preparations: [],
    categories: [
        {
            category: 'Química',
            tests: ['Glucosa en ayunas'],
            results: [
                {
                    id: 11,
                    code: '130',
                    test: 'Glucosa en ayunas',
                    name: 'Glucosa en ayunas',
                    reference: '70 – 100 mg/dL',
                    value: '126',
                    out_of_range: true,
                },
            ],
        },
        {
            category: 'Serología',
            tests: ['Gestatest'],
            results: [
                {
                    id: 12,
                    code: '109',
                    test: 'Gestatest',
                    name: 'Gestatest',
                    reference: 'NEGATIVO',
                    value: null,
                    out_of_range: false,
                },
            ],
        },
    ],
    ...o,
});

describe('Ingreso de resultados', () => {
    beforeEach(() => mockPost.mockClear());

    it('shows the results by category with the out-of-range flag; validating needs every result', () => {
        render(<LabShow order={detail()} />);

        expect(screen.getByText('Química')).toBeTruthy();
        expect(screen.getByText('Fuera de rango')).toBeTruthy();
        expect(screen.getByText('1 valor fuera de rango')).toBeTruthy();
        expect(screen.getByText(/1 análisis sin resultado/)).toBeTruthy();
        const validate = screen.getByRole('button', { name: /Validar/ });
        expect(validate).toBeDisabled();

        fireEvent.change(screen.getByLabelText('Resultado de Gestatest'), {
            target: { value: 'Negativo' },
        });
        fireEvent.click(
            screen.getByRole('button', { name: 'Guardar resultados' }),
        );
        expect(mockPost).toHaveBeenCalledWith(
            '/laboratorio/ordenes/1/resultados',
            { results: { 11: '126', 12: 'Negativo' } },
            expect.anything(),
        );

        fireEvent.click(validate);
        expect(mockPost).toHaveBeenCalledWith(
            '/laboratorio/ordenes/1/validar',
            { results: { 11: '126', 12: 'Negativo' } },
            expect.anything(),
        );
    });

    it('a doctor saves but does not validate', () => {
        render(<LabShow order={detail({ can_validate: false })} />);
        expect(screen.queryByRole('button', { name: /Validar/ })).toBeNull();
    });

    it('a pending order asks to take the sample', () => {
        render(
            <LabShow order={detail({ status: 'ordenada', sample_at: null })} />,
        );

        expect(screen.getByText(/La muestra aún no se ha tomado/)).toBeTruthy();
        expect(
            screen.getByLabelText('Resultado de Glucosa en ayunas'),
        ).toHaveAttribute('readonly');
        fireEvent.click(
            screen.getByRole('button', { name: 'Registrar toma de muestra' }),
        );
        expect(mockPost).toHaveBeenCalledWith(
            '/laboratorio/ordenes/1/muestra',
            {},
            expect.anything(),
        );
    });

    it('a validated order is read only and can be delivered and printed', () => {
        render(
            <LabShow
                order={detail({
                    status: 'validada',
                    validated_by: 'Lic. Rubén Sosa',
                    validated_at: '01/11/2026 09:00',
                })}
            />,
        );

        expect(screen.getByText(/Validado por Lic. Rubén Sosa/)).toBeTruthy();
        expect(
            screen.queryByRole('button', { name: 'Guardar resultados' }),
        ).toBeNull();
        expect(
            screen.getByRole('link', { name: /Imprimir resultado/ }),
        ).toHaveAttribute('href', '/laboratorio/ordenes/1/imprimir');
        fireEvent.click(
            screen.getByRole('button', { name: /Marcar como entregado/ }),
        );
        expect(mockPost).toHaveBeenCalledWith(
            '/laboratorio/ordenes/1/entregar',
            {},
            expect.anything(),
        );
    });
});
