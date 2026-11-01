/**
 * Cirugía: agenda semanal, detalle, programar y catálogo; ingreso para cirugía.
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPost, mockGet, mockPut } = vi.hoisted(() => ({
    mockPost: vi.fn(),
    mockGet: vi.fn(),
    mockPut: vi.fn(),
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    router: {
        post: mockPost,
        get: mockGet,
        put: mockPut,
        visit: vi.fn(),
        delete: vi.fn(),
    },
    usePage: () => ({ props: { errors: {} } }),
}));

import AdminCirugiasIndex from '@/pages/admin-cirugias/index';
import CirugiaIndex from '@/pages/cirugia/index';
import type { SurgeryBlock } from '@/pages/cirugia/types';
import AdmitDialog from '@/components/internamiento/AdmitDialog';

const options = {
    procedures: [
        {
            id: 1,
            code: 'Q-01',
            name: 'Apendicectomía',
            price: 3500000,
            duration_minutes: 90,
        },
        {
            id: 2,
            code: 'Q-02',
            name: 'Colecistectomía laparoscópica',
            price: 5500000,
            duration_minutes: 120,
        },
    ],
    operating_rooms: [{ id: 1, name: 'Quirófano 1' }],
    doctors: [
        { id: 5, name: 'Dra. Mildred Guzmán', specialty: 'Cirugía General' },
        { id: 6, name: 'Dr. Ramón Peralta', specialty: 'Anestesiología' },
    ],
};

const block = (o: Partial<SurgeryBlock>): SurgeryBlock => ({
    id: 1,
    number: 'Q-000001',
    procedure: 'Colecistectomía laparoscópica',
    price: 5500000,
    status: 'programada',
    patient: { id: 3, full_name: 'Ana Lucía Gómez Reyes' },
    surgeon: 'Dra. Mildred Guzmán',
    surgeon_id: 5,
    anesthetist: 'Dr. Ramón Peralta',
    operating_room: 'Quirófano 1',
    operating_room_id: 1,
    room: 'Hab. 5 · Cama única',
    date: '2026-11-11',
    date_label: 'Mié 11/11/2026',
    start: '08:00',
    end: '10:00',
    duration_minutes: 120,
    notes: null,
    cancel_reason: null,
    ...o,
});

const surgeries = [
    block({}),
    block({
        id: 2,
        number: 'Q-000002',
        procedure: 'Legrado uterino',
        status: 'quirofano',
        date: '2026-11-09',
        start: '09:00',
        end: '10:00',
        room: 'Ambulatoria',
    }),
    block({
        id: 3,
        number: 'Q-000003',
        procedure: 'Escisión de lipoma',
        status: 'cancelada',
        date: '2026-11-10',
        start: '10:00',
        end: '11:00',
        cancel_reason: 'Fiebre',
    }),
];

const renderAgenda = (
    props: Partial<React.ComponentProps<typeof CirugiaIndex>> = {},
) =>
    render(
        <CirugiaIndex
            week_start="2026-11-09"
            today="2026-11-09"
            surgeries={surgeries}
            options={options}
            can_schedule
            can_advance
            {...props}
        />,
    );

beforeEach(() => {
    mockPost.mockReset();
    mockGet.mockReset();
    mockPut.mockReset();
});

describe('Cirugía · agenda', () => {
    it('shows the week with each surgery and the count by status', () => {
        renderAgenda();

        expect(screen.getByText('9 – 15 noviembre 2026')).toBeTruthy();
        expect(
            screen.getByTitle('Legrado uterino · Ana Lucía Gómez Reyes'),
        ).toBeTruthy();
        // Legend: how many of each status this week
        expect(document.body.textContent).toContain(
            'Programada1En quirófano1Realizada0Cancelada1',
        );
    });

    it('navigates weeks', () => {
        renderAgenda();
        fireEvent.click(
            screen.getByRole('button', { name: 'Semana siguiente' }),
        );

        expect(mockGet).toHaveBeenCalledWith(
            '/cirugia?semana=2026-11-16',
            {},
            expect.anything(),
        );
    });

    it('the selected surgery shows its data and moves forward', () => {
        renderAgenda();

        // The first one is selected
        expect(screen.getByText('Mié 11/11/2026 · 08:00 – 10:00')).toBeTruthy();
        expect(screen.getByText('Hab. 5 · Cama única')).toBeTruthy();
        fireEvent.click(
            screen.getByRole('button', { name: 'Pasar a quirófano' }),
        );
        expect(mockPost).toHaveBeenCalledWith(
            '/cirugia/1/avanzar',
            {},
            expect.anything(),
        );

        fireEvent.click(
            screen.getByTitle('Legrado uterino · Ana Lucía Gómez Reyes'),
        );
        expect(
            screen.getByRole('button', { name: 'Marcar como realizada' }),
        ).toBeTruthy();
        expect(
            screen.queryByRole('button', { name: /Reprogramar/ }),
        ).toBeNull();
    });

    it('a scheduled surgery is rescheduled', () => {
        renderAgenda();
        fireEvent.click(screen.getByRole('button', { name: /Reprogramar/ }));

        const dialog = screen.getByRole('dialog');
        fireEvent.change(within(dialog).getByLabelText(/Hora/), {
            target: { value: '14:00' },
        });
        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Reprogramar' }),
        );
        expect(mockPut).toHaveBeenCalledWith(
            '/cirugia/1',
            {
                operating_room_id: 1,
                date: '2026-11-11',
                time: '14:00',
                duration_minutes: 120,
            },
            expect.anything(),
        );
    });

    it('nursing only moves surgeries forward', () => {
        renderAgenda({ can_schedule: false });

        expect(
            screen.queryByRole('button', { name: /Programar cirugía/ }),
        ).toBeNull();
        expect(
            screen.queryByRole('button', { name: /Reprogramar/ }),
        ).toBeNull();
        expect(
            screen.getByRole('button', { name: 'Pasar a quirófano' }),
        ).toBeTruthy();
    });

    it('«Programar cirugía» takes the procedure duration', () => {
        renderAgenda();
        fireEvent.click(
            screen.getByRole('button', { name: /Programar cirugía/ }),
        );

        const dialog = screen.getByRole('dialog');
        fireEvent.change(within(dialog).getByLabelText(/Procedimiento/), {
            target: { value: '1' },
        });
        expect(
            (within(dialog).getByLabelText(/Duración/) as HTMLInputElement)
                .value,
        ).toBe('90');
        expect(within(dialog).getByText(/Q-01 · RD\$35,000.00/)).toBeTruthy();
        expect(
            within(dialog).getByRole('button', { name: 'Programar' }),
        ).toBeDisabled();
    });
});

describe('Ingreso para cirugía', () => {
    it('admits and schedules in one step', () => {
        render(
            <AdmitDialog
                open
                onOpenChange={() => undefined}
                options={{
                    beds: [
                        {
                            id: 9,
                            label: 'Hab. 5 · Cama única',
                            type: 'Privada',
                            daily_price: 350000,
                        },
                    ],
                    doctors: options.doctors,
                    default_doctor_id: 5,
                    surgery: options,
                }}
                patient={{ id: 3, full_name: 'Ana Lucía Gómez Reyes' }}
            />,
        );
        fireEvent.click(
            screen.getByRole('tab', { name: 'Ingreso para cirugía' }),
        );
        fireEvent.change(screen.getByLabelText(/Diagnóstico de ingreso/), {
            target: { value: 'K80.2 Colelitiasis' },
        });
        fireEvent.change(screen.getByLabelText(/Procedimiento/), {
            target: { value: '2' },
        });
        fireEvent.change(screen.getByLabelText(/Fecha/), {
            target: { value: '2026-11-11' },
        });
        fireEvent.click(
            screen.getByRole('button', { name: 'Ingresar y programar' }),
        );

        expect(mockPost).toHaveBeenCalledWith(
            '/internamiento/ingresos',
            expect.objectContaining({
                bed_id: 9,
                surgery: expect.objectContaining({
                    surgery_procedure_id: 2,
                    surgeon_id: 5,
                    date: '2026-11-11',
                    duration_minutes: 120,
                    operating_room_id: 1,
                }),
            }),
            expect.anything(),
        );
    });
});

describe('Catálogo de cirugías', () => {
    it('lists procedures and adds an operating room', () => {
        render(
            <AdminCirugiasIndex
                procedures={[
                    {
                        id: 1,
                        code: 'Q-01',
                        name: 'Apendicectomía',
                        price: 3500000,
                        duration_minutes: 90,
                        is_active: true,
                    },
                ]}
                operating_rooms={[
                    { id: 1, name: 'Quirófano 1', is_active: true },
                ]}
                next_code="Q-02"
            />,
        );

        expect(screen.getByText('RD$35,000.00')).toBeTruthy();
        fireEvent.change(screen.getByLabelText('Nuevo quirófano'), {
            target: { value: 'Quirófano 2' },
        });
        fireEvent.click(
            screen.getByRole('button', { name: /Agregar quirófano/ }),
        );
        expect(mockPost).toHaveBeenCalledWith(
            '/admin/cirugias/quirofanos',
            { name: 'Quirófano 2' },
            expect.anything(),
        );
    });
});
