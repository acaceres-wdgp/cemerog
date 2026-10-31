/**
 * Emergencia › Tablero: patients, cubicle map and filter.
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { mockVisit } = vi.hoisted(() => ({ mockVisit: vi.fn() }));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    router: { visit: mockVisit, get: vi.fn(), post: vi.fn() },
    usePage: () => ({ props: { errors: {} } }),
}));

import EmergenciaIndex from '@/pages/emergencia/index';
import type { CubicleCell, EmergencyRow } from '@/pages/emergencia/types';
import { elapsed } from '@/pages/emergencia/types';

const minutesAgo = (m: number) =>
    new Date(Date.now() - m * 60000).toISOString();

const row = (
    id: number,
    name: string,
    cubicle: [number, string],
    minutes: number,
    incomplete = false,
): EmergencyRow => ({
    id,
    number: `E-00000${id}`,
    status: 'activa',
    arrived_at: minutesAgo(minutes),
    arrived_time: '09:05',
    reason: 'Dolor torácico',
    doctor: 'Dr. Franklin Rodríguez',
    last_vital: null,
    last_vital_time: null,
    cubicle: { id: cubicle[0], name: cubicle[1] },
    patient: {
        id,
        full_name: name,
        sex: 'F',
        age: null,
        document_number: null,
        profile_incomplete: incomplete,
    },
});

const emergencies = [
    row(1, 'N.N. Sin identificar', [1, 'Cub. 1'], 70, true),
    row(2, 'Ana Torres', [2, 'Cub. 2'], 10),
];
const cubicles: CubicleCell[] = [
    { id: 1, name: 'Cub. 1', emergency_id: 1, patient: 'N.N.' },
    { id: 2, name: 'Cub. 2', emergency_id: 2, patient: 'Ana' },
    { id: 3, name: 'Cub. 3', emergency_id: null, patient: null },
];

describe('Tablero de Emergencia', () => {
    it('summarises and lists every patient in emergency', () => {
        render(
            <EmergenciaIndex emergencies={emergencies} cubicles={cubicles} />,
        );

        expect(
            screen.getByText(
                /2 pacientes en emergencia · 1 cubículo libre · tiempo promedio 40 min/,
            ),
        ).toBeTruthy();
        expect(screen.getByText('Perfil incompleto')).toBeTruthy();
        expect(screen.getByText('1 h 10 min')).toBeTruthy();
        expect(screen.getAllByText('Edad sin registrar · F')).toHaveLength(2);
    });

    it('filters by cubicle', () => {
        render(
            <EmergenciaIndex emergencies={emergencies} cubicles={cubicles} />,
        );

        fireEvent.change(screen.getByLabelText('Filtrar por cubículo'), {
            target: { value: '2' },
        });
        expect(screen.queryByText('N.N. Sin identificar')).toBeNull();
        expect(screen.getByText('Ana Torres')).toBeTruthy();

        fireEvent.change(screen.getByLabelText('Filtrar por cubículo'), {
            target: { value: '3' },
        });
        expect(
            screen.getByText('No hay pacientes en ese cubículo.'),
        ).toBeTruthy();
    });

    it('a patient row or an occupied cubicle opens the detail; a free cubicle the admission', () => {
        render(
            <EmergenciaIndex emergencies={emergencies} cubicles={cubicles} />,
        );

        fireEvent.click(screen.getByText('Ana Torres'));
        expect(mockVisit).toHaveBeenCalledWith('/emergencia/2');

        expect(screen.getByRole('link', { name: /^Cub\. 1/ })).toHaveAttribute(
            'href',
            '/emergencia/1',
        );
        expect(screen.getByRole('link', { name: /^Cub\. 3/ })).toHaveAttribute(
            'href',
            '/emergencia/ingreso?cubiculo=3',
        );
    });

    it('without patients says so', () => {
        render(<EmergenciaIndex emergencies={[]} cubicles={cubicles} />);
        expect(
            screen.getByText('No hay pacientes en emergencia.'),
        ).toBeTruthy();
        expect(
            within(screen.getByText(/en emergencia ·/)).queryByText(/promedio/),
        ).toBeNull();
    });

    it('formats the elapsed time', () => {
        const now = Date.now();
        expect(elapsed(new Date(now - 5 * 60000).toISOString(), now)).toBe(
            '5 min',
        );
        expect(elapsed(new Date(now - 125 * 60000).toISOString(), now)).toBe(
            '2 h 05 min',
        );
    });
});
