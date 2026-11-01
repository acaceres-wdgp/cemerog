/**
 * Internamiento: mapa de camas, ficha del internado y Habitaciones y camas.
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPost, mockVisit, mockPut, mockDelete } = vi.hoisted(() => ({
    mockPost: vi.fn(),
    mockVisit: vi.fn(),
    mockPut: vi.fn(),
    mockDelete: vi.fn(),
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
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
    router: {
        post: mockPost,
        visit: mockVisit,
        put: mockPut,
        delete: mockDelete,
        get: vi.fn(),
    },
    usePage: () => ({
        props: { errors: {}, auth: { user: { name: 'Lic. Yaniris Cabrera' } } },
    }),
}));

import HabsIndex from '@/pages/habs/index';
import InternamientoIndex from '@/pages/internamiento/index';
import InternamientoShow from '@/pages/internamiento/show';
import type { MapRoom } from '@/pages/internamiento/types';

const options = {
    beds: [
        {
            id: 2,
            label: 'Hab. 2 · Cama B',
            type: 'Semiprivada',
            daily_price: 250000,
        },
        {
            id: 3,
            label: 'Hab. 1 · Cama única',
            type: 'Privada',
            daily_price: 350000,
        },
    ],
    doctors: [
        {
            id: 1,
            name: 'Dr. Franklin Rodríguez',
            specialty: 'Medicina General',
        },
    ],
    default_doctor_id: 1,
};

const rooms: MapRoom[] = [
    {
        id: 2,
        name: 'Hab. 2',
        type: 'Semiprivada',
        daily_price: 250000,
        beds: [
            {
                id: 1,
                name: 'Cama A',
                label: 'Hab. 2 · Cama A',
                status: 'ocupada',
                cleaning_since: null,
                admission: {
                    id: 7,
                    number: 'IN-000007',
                    status: 'internado',
                    patient: { id: 3, full_name: 'Luis Miguel Estévez' },
                    diagnosis: 'J18.9 Neumonía, no especificada',
                    day: 3,
                    doctor: 'Dr. Franklin Rodríguez',
                    admitted_at: '08/11/2026 19:40',
                },
            },
            {
                id: 2,
                name: 'Cama B',
                label: 'Hab. 2 · Cama B',
                status: 'libre',
                cleaning_since: null,
                admission: null,
            },
        ],
    },
    {
        id: 3,
        name: 'Hab. 3',
        type: 'Semiprivada',
        daily_price: 250000,
        beds: [
            {
                id: 4,
                name: 'Cama única',
                label: 'Hab. 3 · Cama única',
                status: 'limpieza',
                cleaning_since: '08:40',
                admission: null,
            },
        ],
    },
];

beforeEach(() => {
    mockPost.mockReset();
    mockVisit.mockReset();
    mockPut.mockReset();
});

describe('Internamiento · mapa', () => {
    it('shows each bed with its patient, filters and opens the ficha', () => {
        render(
            <InternamientoIndex rooms={rooms} admission_options={options} />,
        );

        expect(screen.getByText('Luis Miguel Estévez')).toBeTruthy();
        expect(screen.getByText('Día 3 · Dr. Franklin Rodríguez')).toBeTruthy();
        expect(
            screen.getByRole('tab', { name: /Libres/ }).textContent,
        ).toContain('1');

        fireEvent.click(screen.getByText('Luis Miguel Estévez'));
        expect(mockVisit).toHaveBeenCalledWith('/internamiento/7');
    });

    it('a free bed starts a direct admission with that bed', () => {
        render(
            <InternamientoIndex rooms={rooms} admission_options={options} />,
        );
        fireEvent.click(
            screen.getByRole('button', { name: /Hab. 2 · Cama B · Libre/ }),
        );

        const dialog = screen.getByRole('dialog');
        expect(
            within(dialog).getByPlaceholderText(/Buscar por nombre/),
        ).toBeTruthy();
        expect(
            within(dialog).getByRole('radio', { name: /Hab. 2 · Cama B/ }),
        ).toHaveAttribute('aria-checked', 'true');
        expect(
            within(dialog).getByRole('button', { name: 'Confirmar ingreso' }),
        ).toBeDisabled();
    });

    it('a bed in cleaning is marked ready', () => {
        render(
            <InternamientoIndex rooms={rooms} admission_options={options} />,
        );
        fireEvent.click(screen.getByRole('button', { name: /Marcar lista/ }));

        expect(mockPost).toHaveBeenCalledWith(
            '/internamiento/camas/4/lista',
            {},
            expect.anything(),
        );
    });
});

const admission = {
    id: 7,
    number: 'IN-000007',
    status: 'internado' as const,
    diagnosis: 'J18.9 Neumonía, no especificada',
    day: 3,
    doctor: 'Dr. Franklin Rodríguez',
    admitted_at: '08/11/2026 19:40',
    origin: 'Emergencia',
    treatment: 'Ceftriaxona 1 g IV cada 12 horas.',
    bed_label: 'Hab. 2 · Cama A',
    room_type: 'Semiprivada',
    daily_price: 250000,
    discharged_at: null,
    patient: {
        id: 3,
        full_name: 'Luis Miguel Estévez',
        age: 73,
        sex: 'M',
        document_number: '044-0901234-6',
        expediente_number: 'P-00003',
        allergies: 'Penicilina',
        blood_type: 'O+',
    },
};

const charges = {
    charges: [
        {
            id: 1,
            date: '08/11/2026',
            description: 'Emergencia',
            area: 'Emergencia',
            quantity: 1,
            unit_price: 150000,
            total: 150000,
        },
    ],
    room: [
        {
            bed_label: 'Hab. 2 · Cama A',
            room_type: 'Semiprivada',
            daily_price: 250000,
            days: 3,
            total: 750000,
        },
    ],
    room_charged: false,
    by_area: { Emergencia: 150000, Habitación: 750000 },
    total: 900000,
};

describe('Internamiento · ficha', () => {
    const renderShow = () =>
        render(
            <InternamientoShow
                admission={admission}
                charges={charges}
                free_beds={options.beds}
                can_discharge
                notes={[
                    {
                        id: 1,
                        body: 'Paciente estable.',
                        shift: 'mañana',
                        author: 'Lic. Yaniris Cabrera',
                        at: '10/11/2026 09:14',
                    },
                ]}
            />,
        );

    it('shows the patient, bed, day, allergies and the initial treatment', () => {
        renderShow();

        expect(screen.getByText('Internado · Día 3')).toBeTruthy();
        expect(
            screen.getByText(
                /Hab. 2 · Cama A · Semiprivada · RD\$2,500.00 \/ día/,
            ),
        ).toBeTruthy();
        expect(screen.getByText('Alergias: Penicilina')).toBeTruthy();
        expect(
            screen.getByText('Ceftriaxona 1 g IV cada 12 horas.'),
        ).toBeTruthy();
    });

    it('accumulated charges include the room so far, charged at discharge', () => {
        renderShow();
        fireEvent.click(screen.getByRole('tab', { name: /Cargos acumulados/ }));

        expect(
            screen.getByText(
                /Habitación Semiprivada · Hab. 2 · Cama A \(3 días hasta hoy\)/,
            ),
        ).toBeTruthy();
        expect(screen.getByText('RD$9,000.00')).toBeTruthy();
        expect(
            screen.getByText(/la habitación se carga al dar el alta/),
        ).toBeTruthy();
    });

    it('writes a nursing note', () => {
        renderShow();
        fireEvent.click(
            screen.getByRole('tab', { name: /Notas de enfermería/ }),
        );

        expect(
            screen.getByText('Lic. Yaniris Cabrera · Turno mañana'),
        ).toBeTruthy();
        fireEvent.change(screen.getByLabelText('Nueva nota'), {
            target: { value: 'Tolera vía oral.' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Guardar nota/ }));
        expect(mockPost).toHaveBeenCalledWith(
            '/internamiento/7/notas',
            { body: 'Tolera vía oral.' },
            expect.anything(),
        );
    });

    it('changes room to a free bed with a reason', () => {
        renderShow();
        fireEvent.click(
            screen.getByRole('button', { name: /Cambiar habitación/ }),
        );

        const dialog = screen.getByRole('dialog');
        fireEvent.click(
            within(dialog).getByRole('radio', { name: /Hab. 1 · Cama única/ }),
        );
        fireEvent.change(within(dialog).getByLabelText(/Motivo del traslado/), {
            target: { value: 'Aislamiento' },
        });
        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Confirmar cambio' }),
        );
        expect(mockPost).toHaveBeenCalledWith(
            '/internamiento/7/traslado',
            { bed_id: 3, reason: 'Aislamiento' },
            expect.anything(),
        );
    });

    it('a discharged stay is read-only', () => {
        render(
            <InternamientoShow
                admission={{
                    ...admission,
                    status: 'alta',
                    discharged_at: '11/11/2026 11:00',
                }}
                charges={{ ...charges, room: [], room_charged: true }}
            />,
        );

        expect(screen.getByText('Alta 11/11/2026 11:00')).toBeTruthy();
        expect(screen.queryByRole('button', { name: /Dar alta/ })).toBeNull();
        expect(
            screen.queryByRole('button', { name: /Cambiar habitación/ }),
        ).toBeNull();
    });
});

describe('Habitaciones y camas', () => {
    const types = [
        { id: 1, name: 'Privada', daily_price: 350000, rooms: 1 },
        { id: 2, name: 'Suite', daily_price: 500000, rooms: 0 },
    ];
    const adminRooms = [
        {
            id: 1,
            name: 'Hab. 1',
            type_id: 1,
            type: 'Privada',
            daily_price: 350000,
            beds: [
                {
                    id: 1,
                    name: 'Cama única',
                    status: 'libre' as const,
                    patient: null,
                },
            ],
        },
    ];

    it('lists rooms with their beds and edits a type price', () => {
        render(<HabsIndex types={types} rooms={adminRooms} />);

        expect(
            screen.getByText('1 habitación · 1 cama · 1 libre'),
        ).toBeTruthy();
        fireEvent.change(screen.getByLabelText('Precio por día de Privada'), {
            target: { value: '3,800' },
        });
        fireEvent.click(
            screen.getByRole('button', { name: 'Guardar Privada' }),
        );
        expect(mockPut).toHaveBeenCalledWith(
            '/admin/habitaciones/tipos/1',
            { name: 'Privada', daily_price: 380000 },
            expect.anything(),
        );
        expect(
            screen.getByRole('button', { name: 'Eliminar Privada' }),
        ).toBeDisabled();
    });

    it('creates a room with two beds', () => {
        render(<HabsIndex types={types} rooms={adminRooms} />);
        fireEvent.click(
            screen.getByRole('button', { name: /Nueva habitación/ }),
        );

        const dialog = screen.getByRole('dialog');
        expect(
            (within(dialog).getByLabelText(/Habitación/) as HTMLInputElement)
                .value,
        ).toBe('Hab. 2');
        fireEvent.click(within(dialog).getByRole('tab', { name: '2 camas' }));
        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Crear habitación' }),
        );
        expect(mockPost).toHaveBeenCalledWith(
            '/admin/habitaciones',
            { name: 'Hab. 2', room_type_id: 1, beds: 2 },
            expect.anything(),
        );
    });
});
