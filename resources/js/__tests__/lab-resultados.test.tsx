/**
 * Lab results where the doctor works: Consulta (Órdenes y cargos, historial).
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { mockPost } = vi.hoisted(() => ({ mockPost: vi.fn() }));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    router: { post: mockPost, get: vi.fn() },
    usePage: () => ({ props: { errors: {} } }),
}));

import type { LabOrderSummary } from '@/components/lab/types';
import CuentaOrdenesTab from '@/pages/consulta/components/CuentaOrdenesTab';
import HistorialDetail from '@/pages/consulta/components/HistorialDetail';
import type { ClinicalEntry } from '@/pages/consulta/types';

const order = (o: Partial<LabOrderSummary>): LabOrderSummary => ({
    id: 3,
    number: 'L-0003',
    status: 'validada',
    ordered_at: '01/11/2026 08:10',
    ordered_time: '08:10',
    tests: ['Glucosa en ayunas'],
    total: 25000,
    indication: null,
    cancel_reason: null,
    validated_at: '01/11/2026 09:00',
    results: [
        {
            test: 'Glucosa en ayunas',
            name: 'Glucosa en ayunas',
            value: '150',
            reference: '70 – 100 mg/dL',
            out_of_range: true,
        },
    ],
    ...o,
});

describe('Resultados de laboratorio en Consulta', () => {
    it('«Órdenes y cargos» lists the orders with their status and the validated results', () => {
        render(
            <CuentaOrdenesTab
                charges={[]}
                chargesTotal={0}
                labOrders={[
                    order({}),
                    order({
                        id: 4,
                        number: 'L-0004',
                        status: 'ordenada',
                        results: [],
                        validated_at: null,
                        tests: ['PCR'],
                    }),
                ]}
            />,
        );

        expect(screen.getByText('Validada')).toBeTruthy();
        expect(screen.getByText('150 *')).toBeTruthy();
        expect(screen.getByText('70 – 100 mg/dL')).toBeTruthy();
        expect(screen.getByText('Ordenada')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
        const dialog = screen.getByRole('dialog');
        fireEvent.change(within(dialog).getByLabelText(/Motivo/), {
            target: { value: 'Otro laboratorio' },
        });
        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Cancelar orden' }),
        );
        expect(mockPost).toHaveBeenCalledWith(
            '/laboratorio/ordenes/4/cancelar',
            { reason: 'Otro laboratorio' },
            expect.anything(),
        );
    });

    it('the clinical history shows the results of a lab entry', () => {
        const entry: ClinicalEntry = {
            type: 'laboratorio',
            date: '2026-11-01T09:00:00-04:00',
            mine: true,
            doctor: {
                id: 1,
                full_name: 'Dr. Franklin Rodríguez',
                specialty: 'Medicina General',
            },
            lab: {
                number: 'L-0003',
                tests: ['Glucosa en ayunas'],
                results: order({}).results!,
            },
        };
        render(<HistorialDetail sel={entry} canPrint={false} />);

        expect(screen.getByText(/Resultados · L-0003/)).toBeTruthy();
        expect(screen.getByText('150 *')).toBeTruthy();
        expect(
            screen.getByText('* Fuera del rango de referencia.'),
        ).toBeTruthy();
    });
});
