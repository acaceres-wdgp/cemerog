/**
 * Emergencia › Ingreso rápido.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPost, page } = vi.hoisted(() => ({
    mockPost: vi.fn(),
    page: { props: { errors: {} as Record<string, string> } },
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    router: { post: mockPost, get: vi.fn() },
    usePage: () => page,
}));

import EmergenciaIngreso from '@/pages/emergencia/ingreso';

const props = {
    cubicles: [
        { id: 3, name: 'Cub. 3' },
        { id: 7, name: 'Observación' },
    ],
    doctors: [
        {
            id: 5,
            name: 'Dr. Franklin Rodríguez',
            specialty: 'Medicina General',
        },
    ],
    default_doctor_id: 5,
    emergency_fee: 150000,
    arrived_at: '31/10/2026 · 20:45',
};

const submit = () =>
    screen.getByRole('button', { name: /Registrar en emergencia/ });

describe('Ingreso rápido', () => {
    beforeEach(() => {
        mockPost.mockClear();
        vi.stubGlobal('fetch', vi.fn());
    });

    it('registers a new patient with the minimum data', () => {
        render(<EmergenciaIngreso {...props} />);

        expect(screen.getByText('RD$1,500.00')).toBeTruthy();
        expect(screen.queryByText(/Edad/)).toBeNull();
        expect(screen.queryByText(/Prioridad/)).toBeNull();
        expect(submit()).toBeDisabled();

        fireEvent.change(screen.getByLabelText(/Nombres/), {
            target: { value: 'José Ramón' },
        });
        fireEvent.change(screen.getByLabelText(/Apellidos/), {
            target: { value: 'Tavárez Cruz' },
        });
        fireEvent.change(screen.getByLabelText(/^Documento/), {
            target: { value: '031-0567812-4' },
        });
        fireEvent.click(screen.getByRole('tab', { name: 'Masculino' }));
        fireEvent.change(screen.getByLabelText(/Motivo de llegada/), {
            target: { value: 'Herida cortante' },
        });
        fireEvent.click(submit());

        expect(mockPost).toHaveBeenCalledWith(
            '/emergencia/ingreso',
            {
                identified: true,
                first_names: 'José Ramón',
                last_names: 'Tavárez Cruz',
                document_type: 'cedula',
                document_number: '031-0567812-4',
                sex: 'M',
                cubicle_id: 3,
                doctor_id: 5,
                reason: 'Herida cortante',
            },
            expect.anything(),
        );
    });

    it('an unidentified patient without a document needs only sex and reason', () => {
        render(<EmergenciaIngreso {...props} />);

        fireEvent.click(screen.getByLabelText(/Paciente no identificado/));
        fireEvent.click(screen.getByLabelText(/No trae documento/));
        expect(screen.getByText('N.N. · Sin identificar')).toBeTruthy();
        expect(screen.getByText('Nombre real')).toBeTruthy();
        expect(screen.getByText('Documento de identidad')).toBeTruthy();

        fireEvent.click(screen.getByRole('tab', { name: 'Femenino' }));
        fireEvent.change(screen.getByLabelText(/Cubículo/), {
            target: { value: '7' },
        });
        fireEvent.change(screen.getByLabelText(/Motivo de llegada/), {
            target: { value: 'Inconsciente' },
        });
        fireEvent.click(submit());

        expect(mockPost).toHaveBeenCalledWith(
            '/emergencia/ingreso',
            expect.objectContaining({
                identified: false,
                document_type: 'no_tiene',
                document_number: null,
                sex: 'F',
                cubicle_id: 7,
            }),
            expect.anything(),
        );
    });

    it('warns when there are no free cubicles', () => {
        render(<EmergenciaIngreso {...props} cubicles={[]} />);

        expect(screen.getByText('No hay cubículos libres.')).toBeTruthy();
    });
});
