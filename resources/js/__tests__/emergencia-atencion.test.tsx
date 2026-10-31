/**
 * Emergencia › detail: vital signs, medications and supplies.
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPost, mockPatch } = vi.hoisted(() => ({
    mockPost: vi.fn(),
    mockPatch: vi.fn(),
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    router: { post: mockPost, patch: mockPatch, get: vi.fn(), visit: vi.fn() },
    usePage: () => ({ props: { errors: {} } }),
}));

import EmergenciaShow from '@/pages/emergencia/show';
import type { EmergencyDetail } from '@/pages/emergencia/types';

const emergency: EmergencyDetail = {
    id: 4,
    number: 'E-000004',
    status: 'activa',
    arrived_at: new Date().toISOString(),
    arrived_time: '09:05',
    arrived_on: '31/10/2026 09:05',
    reason: 'Dificultad respiratoria',
    doctor: 'Dr. Franklin Rodríguez',
    last_vital: null,
    last_vital_time: null,
    cubicle: { id: 2, name: 'Cub. 2' },
    patient: {
        id: 9,
        full_name: 'José Tavárez',
        sex: 'M',
        age: null,
        document_number: null,
        profile_incomplete: true,
        document_type: 'no_tiene',
        birth_date: null,
        phone: null,
        allergies: null,
        blood_type: null,
        emergency_contact_name: null,
        expediente_number: 'P-00009',
    },
    account: { id: 1, total: 150000, charges_count: 1 },
};

const catalog = [
    {
        id: 1,
        code: 'MED-001',
        name: 'Dipirona 1 g/2 ml',
        presentation: 'Ampolla',
        kind: 'medicamento' as const,
        price: 15000,
        stock: 10,
    },
    {
        id: 2,
        code: 'INS-001',
        name: 'Gasa estéril 4x4',
        presentation: null,
        kind: 'insumo' as const,
        price: 2500,
        stock: 40,
    },
];

const renderShow = (overrides = {}) =>
    render(
        <EmergenciaShow
            emergency={emergency}
            vitals={[]}
            applications={[]}
            catalog={catalog}
            routes={['IV', 'IM', 'VO']}
            can_discharge={false}
            free_cubicles={[{ id: 3, name: 'Cub. 3' }]}
            {...overrides}
        />,
    );

describe('Detalle de Emergencia', () => {
    beforeEach(() => mockPost.mockClear());

    it('records a vital-sign reading', () => {
        renderShow();

        fireEvent.click(screen.getByRole('button', { name: /Registrar toma/ }));
        const save = screen.getByRole('button', { name: /Guardar toma/ });
        expect(save).toBeDisabled();
        for (const [label, value] of [
            ['Presión arterial', '145/90'],
            ['Frec. cardíaca', '98'],
            ['Frec. resp.', '22'],
            ['Temperatura', '38.4'],
            ['SpO₂', '93'],
        ]) {
            fireEvent.change(screen.getByLabelText(label), {
                target: { value },
            });
        }
        fireEvent.click(save);

        expect(mockPost).toHaveBeenCalledWith(
            '/emergencia/4/signos-vitales',
            {
                presion_arterial: '145/90',
                frecuencia_cardiaca: 98,
                frecuencia_respiratoria: 22,
                temp: 38.4,
                saturacion_o2: 93,
                glucemia: null,
            },
            expect.anything(),
        );
    });

    it('lists the readings with the latest values', () => {
        renderShow({
            vitals: [
                {
                    id: 2,
                    time: '09:40',
                    presion_arterial: '130/85',
                    frecuencia_cardiaca: 90,
                    frecuencia_respiratoria: 20,
                    temp: 37.9,
                    saturacion_o2: 95,
                    glucemia: null,
                    taken_by: 'Lic. Yaniris Cabrera',
                },
                {
                    id: 1,
                    time: '09:10',
                    presion_arterial: '145/90',
                    frecuencia_cardiaca: 98,
                    frecuencia_respiratoria: 22,
                    temp: 38.4,
                    saturacion_o2: 93,
                    glucemia: 110,
                    taken_by: 'Lic. Yaniris Cabrera',
                },
            ],
        });

        expect(screen.getByText('2 tomas · última 09:40')).toBeTruthy();
        expect(screen.getAllByText('Lic. Yaniris Cabrera')).toHaveLength(2);
    });

    it('applies a medication from the catalog with its route and charge', () => {
        renderShow();

        fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).queryByText('Gasa estéril 4x4')).toBeNull();
        fireEvent.click(
            within(dialog).getByRole('radio', { name: /Dipirona/ }),
        );
        fireEvent.click(within(dialog).getByRole('button', { name: 'Más' }));
        expect(within(dialog).getByText('RD$300.00')).toBeTruthy();
        fireEvent.change(within(dialog).getByLabelText(/Vía/), {
            target: { value: 'IM' },
        });
        fireEvent.click(
            within(dialog).getByRole('button', {
                name: 'Registrar aplicación',
            }),
        );

        expect(mockPost).toHaveBeenCalledWith(
            '/emergencia/4/aplicaciones',
            {
                kind: 'medicamento',
                quantity: 2,
                route: 'IM',
                inventory_item_id: 1,
            },
            expect.anything(),
        );
    });

    it('a medication brought by the patient is recorded without charge', () => {
        renderShow();

        fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
        const dialog = screen.getByRole('dialog');
        fireEvent.click(within(dialog).getByLabelText(/Lo trajo el paciente/));
        fireEvent.change(within(dialog).getByLabelText(/Medicamento/), {
            target: { value: 'Salbutamol propio' },
        });
        fireEvent.click(
            within(dialog).getByRole('button', {
                name: 'Registrar aplicación',
            }),
        );

        expect(mockPost).toHaveBeenCalledWith(
            '/emergencia/4/aplicaciones',
            {
                kind: 'medicamento',
                quantity: 1,
                route: 'IV',
                brought_by_patient: true,
                description: 'Salbutamol propio',
            },
            expect.anything(),
        );
    });

    it('registers a supply', () => {
        renderShow({
            applications: [
                {
                    id: 1,
                    kind: 'medicamento',
                    time: '09:12',
                    description: 'Dipirona 1 g/2 ml',
                    quantity: 1,
                    route: 'IV',
                    total: 15000,
                    brought_by_patient: false,
                    stock_left: 9,
                    applied_by: 'Lic. Yaniris Cabrera',
                },
            ],
        });
        expect(screen.getByText('−1 · quedan 9')).toBeTruthy();

        fireEvent.click(
            screen.getByRole('button', { name: 'Registrar insumo' }),
        );
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).queryByLabelText(/Vía/)).toBeNull();
        fireEvent.click(within(dialog).getByRole('radio', { name: /Gasa/ }));
        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Registrar insumo' }),
        );

        expect(mockPost).toHaveBeenCalledWith(
            '/emergencia/4/aplicaciones',
            { kind: 'insumo', quantity: 1, inventory_item_id: 2 },
            expect.anything(),
        );
    });

    it('procedures and lab orders are shown but not enabled yet', () => {
        renderShow();

        expect(
            screen.getByRole('button', { name: /Agregar procedimiento/ }),
        ).toBeDisabled();
        expect(screen.getByRole('button', { name: /Ordenar/ })).toBeDisabled();
    });

    it('only internar and cirugía are disabled; a nurse cannot discharge', () => {
        renderShow();

        expect(screen.getByRole('button', { name: /Internar/ })).toBeDisabled();
        expect(
            screen.getByRole('button', { name: /Ingreso para cirugía/ }),
        ).toBeDisabled();
        expect(screen.getByRole('button', { name: /Dar alta/ })).toBeDisabled();
        expect(
            screen.getByText(
                'Solo un médico o un administrador puede dar el alta',
            ),
        ).toBeTruthy();
    });

    it('the doctor discharges with the same dialog as Consulta', () => {
        renderShow({ can_discharge: true });

        fireEvent.click(screen.getByRole('button', { name: /Dar alta/ }));
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByText('Alta médica')).toBeTruthy();
        fireEvent.change(
            within(dialog).getByLabelText('Diagnóstico de egreso'),
            {
                target: { value: 'Crisis asmática resuelta' },
            },
        );
        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Confirmar alta' }),
        );

        expect(mockPost).toHaveBeenCalledWith(
            '/emergencia/4/alta',
            {
                type: 'recuperado',
                destination: null,
                reason: null,
                discharge_diagnosis: 'Crisis asmática resuelta',
            },
            expect.anything(),
        );
    });

    it('moves the patient to a free cubicle', () => {
        renderShow();

        fireEvent.click(
            screen.getByRole('button', { name: 'Cambiar cubículo' }),
        );
        const dialog = screen.getByRole('dialog');
        fireEvent.click(within(dialog).getByRole('button', { name: 'Mover' }));
        expect(mockPatch).toHaveBeenCalledWith(
            '/emergencia/4/cubiculo',
            { cubicle_id: 3 },
            expect.anything(),
        );
    });
});
