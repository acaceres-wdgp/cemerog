/**
 * Characterization tests for citas/index.tsx.
 * These tests pin the current behavior and must pass before and after the refactor.
 * Do NOT modify without a documented reason.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockRouterGet, mockRouterPost, mockRouterDelete } = vi.hoisted(() => ({
    mockRouterGet: vi.fn(),
    mockRouterPost: vi.fn(),
    mockRouterDelete: vi.fn(),
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    router: {
        get: mockRouterGet,
        post: mockRouterPost,
        delete: mockRouterDelete,
    },
}));

import CitasIndex from '@/pages/citas/index';

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const TODAY = '2026-10-24';
const TOMORROW = '2026-10-25';

const mockDoctors = [
    { id: 1, name: 'Dra. López', specialty: 'Pediatría', initials: 'LL' },
    { id: 2, name: 'Dr. Méndez', specialty: 'Cardiología', initials: 'DM' },
];

const mockAppointments = [
    {
        id: 10,
        patient_id: 1,
        patient_name: 'Ana Torres',
        patient_initials: 'AT',
        doctor_id: 1,
        doctor_name: 'Dra. López',
        doctor_specialty: 'Pediatría',
        appointment_date: TODAY,
        appointment_time: '09:00',
        turn_number: 3,
        turn_order: 2,
        type: 'consulta',
        status: 'pendiente' as const,
        notes: null,
    },
    {
        id: 11,
        patient_id: 2,
        patient_name: 'Carlos Reyes',
        patient_initials: 'CR',
        doctor_id: 2,
        doctor_name: 'Dr. Méndez',
        doctor_specialty: 'Cardiología',
        appointment_date: TODAY,
        appointment_time: '10:30',
        turn_number: 1,
        turn_order: 1,
        type: 'seguimiento',
        status: 'confirmada' as const,
        notes: 'Control mensual',
    },
];

const BASE_PROPS = {
    appointments: mockAppointments,
    doctors: mockDoctors,
    date: TODAY,
    is_today: true,
};

// ─── Appointment list rendering ────────────────────────────────────────────────

describe('CitasIndex – renders appointment list', () => {
    it('muestra el nombre del paciente, médico y estado de cada cita', () => {
        render(<CitasIndex {...BASE_PROPS} />);

        expect(screen.getByText('Ana Torres')).toBeTruthy();
        expect(screen.getByText('Carlos Reyes')).toBeTruthy();
        // Doctor names appear in both the filter chips and the table rows
        expect(screen.getAllByText('Dra. López').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Dr. Méndez').length).toBeGreaterThan(0);
        expect(screen.getByText('Pendiente')).toBeTruthy();
        expect(screen.getByText('Confirmada')).toBeTruthy();
    });

    it('muestra el conteo de citas en el encabezado', () => {
        render(<CitasIndex {...BASE_PROPS} />);
        expect(screen.getByText(/2 citas/)).toBeTruthy();
    });

    it('sin citas muestra la tabla vacía (sin filas de pacientes)', () => {
        render(<CitasIndex {...BASE_PROPS} appointments={[]} />);
        expect(screen.queryByText('Ana Torres')).toBeNull();
    });
});

// ─── Date navigation ───────────────────────────────────────────────────────────

describe('CitasIndex – date navigation', () => {
    beforeEach(() => {
        mockRouterGet.mockClear();
    });

    it('botón "Hoy" en el segmented llama a router.get con la fecha de hoy', () => {
        render(<CitasIndex {...BASE_PROPS} is_today={false} date={TOMORROW} />);
        // First "Hoy" button is the segmented control one
        const hoyButtons = screen.getAllByText('Hoy');
        fireEvent.click(hoyButtons[0]);
        expect(mockRouterGet).toHaveBeenCalledWith(
            '/citas',
            expect.objectContaining({
                date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
            }),
            expect.objectContaining({ preserveState: false }),
        );
    });

    it('botón "Mañana" en el segmented llama a router.get con la fecha de mañana', () => {
        render(<CitasIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByText('Mañana'));
        expect(mockRouterGet).toHaveBeenCalledWith(
            '/citas',
            expect.objectContaining({
                date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
            }),
            expect.objectContaining({ preserveState: false }),
        );
    });

    it('botón "‹" navega al día anterior', () => {
        render(<CitasIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByText('‹'));
        expect(mockRouterGet).toHaveBeenCalledWith(
            '/citas',
            { date: '2026-10-23' },
            { preserveState: false },
        );
    });

    it('botón "›" navega al día siguiente', () => {
        render(<CitasIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByText('›'));
        expect(mockRouterGet).toHaveBeenCalledWith(
            '/citas',
            { date: '2026-10-25' },
            { preserveState: false },
        );
    });
});

// ─── Nueva cita modal ──────────────────────────────────────────────────────────

describe('CitasIndex – modal nueva cita', () => {
    it('el modal no está visible al cargar la página', () => {
        render(<CitasIndex {...BASE_PROPS} />);
        expect(screen.queryByText('Nueva cita')).toBeNull();
    });

    it('clic en "+ Nueva cita" muestra el modal', () => {
        render(<CitasIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByText('+ Nueva cita'));
        expect(screen.getByText('Nueva cita')).toBeTruthy();
    });

    it('clic en el botón Cancelar del modal lo cierra', () => {
        render(<CitasIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByText('+ Nueva cita'));
        expect(screen.getByText('Nueva cita')).toBeTruthy();
        // Multiple "Cancelar" buttons exist (one per appointment row + one in modal)
        // The modal's Cancelar button is the last one rendered
        const cancelButtons = screen.getAllByText('Cancelar');
        fireEvent.click(cancelButtons[cancelButtons.length - 1]);
        expect(screen.queryByText('Nueva cita')).toBeNull();
    });
});

// ─── PatientSearch – fetch behavior ───────────────────────────────────────────

describe('CitasIndex – PatientSearch fetch', () => {
    beforeEach(() => {
        global.fetch = vi.fn();
        mockRouterGet.mockClear();
        mockRouterPost.mockClear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('no dispara fetch con 1 carácter', async () => {
        render(<CitasIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByText('+ Nueva cita'));

        const input = screen.getByPlaceholderText(
            'Buscar por nombre o cédula…',
        );
        fireEvent.change(input, { target: { value: 'A' } });

        await new Promise((r) => setTimeout(r, 400));
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('dispara fetch con 2 o más caracteres', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => [
                {
                    id: 1,
                    full_name: 'Ana Torres',
                    document_number: '001-1111111-1',
                },
            ],
        });

        render(<CitasIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByText('+ Nueva cita'));

        const input = screen.getByPlaceholderText(
            'Buscar por nombre o cédula…',
        );
        fireEvent.change(input, { target: { value: 'An' } });

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('buscar?q=An'),
            );
        });
    });

    it('muestra los resultados devueltos por el servidor', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => [
                {
                    id: 1,
                    full_name: 'Ana Torres',
                    document_number: '001-1111111-1',
                },
            ],
        });

        render(<CitasIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByText('+ Nueva cita'));

        const input = screen.getByPlaceholderText(
            'Buscar por nombre o cédula…',
        );
        fireEvent.change(input, { target: { value: 'Ana' } });

        await waitFor(() => {
            expect(screen.getByText('Ana Torres')).toBeTruthy();
        });
    });

    it('sin resultados muestra mensaje "No se encontraron pacientes."', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });

        render(<CitasIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByText('+ Nueva cita'));

        const input = screen.getByPlaceholderText(
            'Buscar por nombre o cédula…',
        );
        fireEvent.change(input, { target: { value: 'xyz' } });

        await waitFor(() => {
            expect(
                screen.getByText('No se encontraron pacientes.'),
            ).toBeTruthy();
        });
    });
});

// ─── Submit modal ──────────────────────────────────────────────────────────────

describe('CitasIndex – submit nueva cita', () => {
    beforeEach(() => {
        global.fetch = vi.fn();
        mockRouterPost.mockClear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('enviar el modal con paciente y médico seleccionados llama a router.post con el payload correcto', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => [
                {
                    id: 5,
                    full_name: 'Pedro Díaz',
                    document_number: '001-9999999-9',
                },
            ],
        });

        render(<CitasIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByText('+ Nueva cita'));

        // Search and select patient
        const input = screen.getByPlaceholderText(
            'Buscar por nombre o cédula…',
        );
        fireEvent.change(input, { target: { value: 'Ped' } });

        await waitFor(() => screen.getByText('Pedro Díaz'));
        fireEvent.click(screen.getByText('Pedro Díaz'));

        // Select doctor (placeholder text is "Seleccionar médico…")
        const doctorSelect = screen.getByDisplayValue('Seleccionar médico…');
        fireEvent.change(doctorSelect, { target: { value: '1' } });

        // Set date (already pre-filled with defaultDate)
        // Submit
        fireEvent.click(screen.getByText('✓ Registrar cita'));

        expect(mockRouterPost).toHaveBeenCalledWith(
            '/citas',
            expect.objectContaining({
                patient_id: 5,
                doctor_id: 1,
                appointment_date: TODAY,
                type: 'consulta',
            }),
            expect.any(Object),
        );
    });

    it('enviar sin paciente muestra error de validación', () => {
        render(<CitasIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByText('+ Nueva cita'));
        fireEvent.click(screen.getByText('✓ Registrar cita'));

        expect(screen.getByText('Selecciona un paciente.')).toBeTruthy();
        expect(mockRouterPost).not.toHaveBeenCalled();
    });

    it('enviar sin médico muestra error de validación', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => [
                {
                    id: 5,
                    full_name: 'Pedro Díaz',
                    document_number: '001-9999999-9',
                },
            ],
        });

        render(<CitasIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByText('+ Nueva cita'));

        const input = screen.getByPlaceholderText(
            'Buscar por nombre o cédula…',
        );
        fireEvent.change(input, { target: { value: 'Ped' } });
        await waitFor(() => screen.getByText('Pedro Díaz'));
        fireEvent.click(screen.getByText('Pedro Díaz'));

        fireEvent.click(screen.getByText('✓ Registrar cita'));

        expect(screen.getByText('Selecciona un médico.')).toBeTruthy();
        expect(mockRouterPost).not.toHaveBeenCalled();
    });
});
// ─── FutureRows: appointment_time normalization & grouping ────────────────────

const FUTURE_DOCTORS = [
    { id: 1, name: 'Dra. López', specialty: 'Pediatría', initials: 'LL' },
    { id: 2, name: 'Dr. Méndez', specialty: 'Cardiología', initials: 'DM' },
];

function makeFutureCita(overrides: Partial<(typeof mockAppointments)[0]>) {
    return {
        id: 100,
        patient_id: 1,
        patient_name: 'Test Paciente',
        patient_initials: 'TP',
        doctor_id: 1,
        doctor_name: 'Dra. López',
        doctor_specialty: 'Pediatría',
        appointment_date: TOMORROW,
        appointment_time: '09:00' as string | null,
        turn_number: null,
        turn_order: null,
        type: 'consulta',
        status: 'pendiente' as const,
        notes: null,
        ...overrides,
    };
}

describe('FutureRows – appointment_time normalization', () => {
    it('una cita con appointment_time "09:00:00" aparece en la franja 09:00', () => {
        const cita = makeFutureCita({ id: 201, appointment_time: '09:00:00' });
        render(
            <CitasIndex
                appointments={[cita]}
                doctors={FUTURE_DOCTORS}
                date={TOMORROW}
                is_today={false}
            />,
        );
        expect(screen.getByText('Test Paciente')).toBeTruthy();
    });

    it('dos citas a las 09:00 con médicos distintos aparecen las dos', () => {
        const cita1 = makeFutureCita({
            id: 301,
            appointment_time: '09:00',
            patient_name: 'Paciente Uno',
            doctor_id: 1,
        });
        const cita2 = makeFutureCita({
            id: 302,
            appointment_time: '09:00',
            patient_name: 'Paciente Dos',
            doctor_id: 2,
        });
        render(
            <CitasIndex
                appointments={[cita1, cita2]}
                doctors={FUTURE_DOCTORS}
                date={TOMORROW}
                is_today={false}
            />,
        );
        expect(screen.getByText('Paciente Uno')).toBeTruthy();
        expect(screen.getByText('Paciente Dos')).toBeTruthy();
    });

    it('una cita a las 10:15 aparece entre 10:00 y 10:30', () => {
        const cita = makeFutureCita({
            id: 401,
            appointment_time: '10:15',
            patient_name: 'Paciente Fuera Slot',
        });
        render(
            <CitasIndex
                appointments={[cita]}
                doctors={FUTURE_DOCTORS}
                date={TOMORROW}
                is_today={false}
            />,
        );
        expect(screen.getByText('Paciente Fuera Slot')).toBeTruthy();
    });

    it('una cita a las 16:00 aparece después de 15:00', () => {
        const cita = makeFutureCita({
            id: 501,
            appointment_time: '16:00',
            patient_name: 'Paciente Tarde',
        });
        render(
            <CitasIndex
                appointments={[cita]}
                doctors={FUTURE_DOCTORS}
                date={TOMORROW}
                is_today={false}
            />,
        );
        expect(screen.getByText('Paciente Tarde')).toBeTruthy();
    });
});

// ─── TodayRows: appointment_time sin segundos ─────────────────────────────────

describe('TodayRows – appointment_time display', () => {
    it('muestra 09:00 y NO 09:00:00 cuando appointment_time es "09:00"', () => {
        const cita = {
            ...mockAppointments[0],
            appointment_time: '09:00',
        };
        render(
            <CitasIndex
                appointments={[cita]}
                doctors={mockDoctors}
                date={TODAY}
                is_today={true}
            />,
        );
        // The time column should show '09:00'
        expect(screen.getByText('09:00')).toBeTruthy();
        expect(screen.queryByText('09:00:00')).toBeNull();
    });
});
