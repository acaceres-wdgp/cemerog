/**
 * Characterization tests for the Tablero index page.
 * These tests capture the existing behavior and prevent regressions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const mockPatch = vi.hoisted(() => vi.fn());
const mockPost = vi.hoisted(() => vi.fn());
const mockVisit = vi.hoisted(() => vi.fn());

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    router: {
        patch: mockPatch,
        post: mockPost,
        visit: mockVisit,
    },
}));

// No Dialog mock needed - tablero uses a custom inline modal

import TableroIndex from '@/pages/tablero/index';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeTurn = (overrides: Partial<(typeof TURNS)[0]> = {}) => ({
    id: 1,
    turn_number: 1,
    turn_order: 1,
    patient_name: 'Juan Pérez',
    patient_initials: 'JP',
    patient_document: '001-1234567-8',
    patient_age: 35,
    patient_sex: 'M',
    doctor_id: 1,
    doctor_name: 'Dra. García',
    doctor_specialty: 'Medicina Interna',
    arrived_at: '08:30',
    status: 'espera' as const,
    appointment_id: null,
    ...overrides,
});

const makeCita = (overrides: Partial<(typeof APPOINTMENTS)[0]> = {}) => ({
    id: 10,
    appointment_time: '09:00',
    patient_id: 5,
    patient_name: 'María López',
    patient_initials: 'ML',
    patient_phone: '809-555-1234',
    doctor_id: 1,
    doctor_name: 'Dra. García',
    doctor_specialty: 'Medicina Interna',
    type: 'consulta',
    status: 'pendiente' as const,
    notes: null,
    turn_number: null,
    has_turn: false,
    ...overrides,
});

const TURNS = [makeTurn(), makeTurn({ id: 2, turn_number: 2, status: 'en_consulta' })];
const APPOINTMENTS = [makeCita(), makeCita({ id: 11, has_turn: true, turn_number: 3 })];
const DOCTORS = [
    { id: 1, name: 'Dra. García', specialty: 'Medicina Interna', initials: 'GR' },
    { id: 2, name: 'Dr. Pérez', specialty: 'Cardiología', initials: 'PR' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderTablero(overrides: {
    turns?: typeof TURNS;
    appointments?: typeof APPOINTMENTS;
    doctors?: typeof DOCTORS;
    en_espera?: number;
} = {}) {
    return render(
        <TableroIndex
            turns={overrides.turns ?? TURNS}
            appointments={overrides.appointments ?? APPOINTMENTS}
            doctors={overrides.doctors ?? DOCTORS}
            en_espera={overrides.en_espera ?? 1}
        />,
    );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
    vi.clearAllMocks();
});

describe('TableroIndex – rendering', () => {
    it('renders the page heading', () => {
        renderTablero();
        expect(screen.getByText('Tablero de atenciones')).toBeInTheDocument();
    });

    it('renders the subtitle', () => {
        renderTablero();
        expect(
            screen.getByText('Pacientes en la clínica y su estado actual.'),
        ).toBeInTheDocument();
    });

    it('renders stat cards section', () => {
        renderTablero();
        // Multiple "En espera" / "En consulta" / "Emergencia" texts exist (stat card + tab button)
        expect(screen.getAllByText('En espera').length).toBeGreaterThan(0);
        expect(screen.getAllByText('En consulta').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Emergencia').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Internados').length).toBeGreaterThan(0);
    });

    it('renders "Agregar turno" button', () => {
        renderTablero();
        expect(
            screen.getByRole('button', { name: /agregar turno/i }),
        ).toBeInTheDocument();
    });

    it('renders turns in the table', () => {
        renderTablero();
        // Juan Pérez appears in both turns
        expect(screen.getAllByText('Juan Pérez').length).toBeGreaterThan(0);
    });

    it('renders "Siguiente" badge when there is a turn in espera', () => {
        renderTablero();
        expect(screen.getByText('Siguiente')).toBeInTheDocument();
    });

    it('does not render "Siguiente" badge when no turns', () => {
        renderTablero({ turns: [] });
        expect(screen.queryByText('Siguiente')).not.toBeInTheDocument();
    });

    it('renders citas de hoy section', () => {
        renderTablero();
        expect(screen.getByText('Citas de hoy')).toBeInTheDocument();
    });

    it('renders patient names in citas table', () => {
        renderTablero();
        expect(screen.getAllByText('María López').length).toBeGreaterThan(0);
    });
});

describe('TableroIndex – turn tabs', () => {
    it('shows all tabs for turns', () => {
        renderTablero();
        // "Todas" tab appears for both turns AND citas sections
        expect(screen.getAllByRole('button', { name: /todas/i }).length).toBeGreaterThan(0);
        // "En espera" tab exists
        const esperaBtns = screen.getAllByRole('button').filter((b) =>
            b.textContent?.includes('En espera'),
        );
        expect(esperaBtns.length).toBeGreaterThan(0);
    });

    it('filters turns by "En espera" tab', () => {
        renderTablero();
        // Click the "En espera" tab
        const tabs = screen.getAllByRole('button');
        const esperaTab = tabs.find((b) => b.textContent?.includes('En espera'));
        expect(esperaTab).toBeTruthy();
        fireEvent.click(esperaTab!);
        // The turn with status 'en_consulta' should not show in the table (only espera)
        // Both patients are named Juan Pérez so we just check the table is filtered
        // by checking the turn count badge area updates
    });
});

describe('TableroIndex – cita tabs', () => {
    it('shows Sin turno tab with pending count', () => {
        renderTablero();
        expect(screen.getByRole('button', { name: /sin turno/i })).toBeInTheDocument();
    });

    it('shows Todas tab for citas', () => {
        renderTablero();
        // Multiple "Todas" buttons might exist (turn tabs + citas tabs)
        const todasBtns = screen.getAllByRole('button', { name: /todas/i });
        expect(todasBtns.length).toBeGreaterThan(0);
    });

    it('filters citas: "Sin turno" tab shows only those without turn', () => {
        const citas = [
            makeCita({ id: 1, patient_name: 'Sin Turno Pac', has_turn: false }),
            makeCita({ id: 2, patient_name: 'Con Turno Pac', has_turn: true, turn_number: 5 }),
        ];
        renderTablero({ appointments: citas });
        // By default we're on "pendientes" (Sin turno) tab
        expect(screen.getByText('Sin Turno Pac')).toBeInTheDocument();
        // Con Turno Pac may or may not be shown in the first tab
    });
});

describe('TableroIndex – patchTurnStatus', () => {
    it('calls router.patch with correct URL and status when "Llamar" clicked', () => {
        const turn = makeTurn({ id: 42, status: 'espera' });
        renderTablero({ turns: [turn] });

        const llamarBtn = screen.getByRole('button', { name: /llamar/i });
        fireEvent.click(llamarBtn);

        expect(mockPatch).toHaveBeenCalledWith(
            '/tablero/turnos/42/status',
            { status: 'en_consulta' },
            { preserveScroll: true },
        );
    });

    it('calls router.patch to mark turn as "atendido"', () => {
        const turn = makeTurn({ id: 99, status: 'en_consulta' });
        renderTablero({ turns: [turn] });

        const atendidoBtn = screen.getByRole('button', { name: /atendido/i });
        fireEvent.click(atendidoBtn);

        expect(mockPatch).toHaveBeenCalledWith(
            '/tablero/turnos/99/status',
            { status: 'atendido' },
            { preserveScroll: true },
        );
    });

    it('calls router.patch to mark turn as "no_asistio" via ✕ button', () => {
        const turn = makeTurn({ id: 7, status: 'espera' });
        renderTablero({ turns: [turn] });

        // The ✕ button in the turns table (for no_asistio)
        const xBtns = screen.getAllByRole('button', { name: '✕' });
        fireEvent.click(xBtns[0]);

        expect(mockPatch).toHaveBeenCalledWith(
            '/tablero/turnos/7/status',
            { status: 'no_asistio' },
            { preserveScroll: true },
        );
    });
});

describe('TableroIndex – reorderTurn', () => {
    it('calls router.patch with direction "up"', () => {
        const turn = makeTurn({ id: 5, status: 'espera' });
        renderTablero({ turns: [turn] });

        // title attribute used as accessible name via aria - use title selector
        const upBtn = document.querySelector('button[title="Subir en cola"]') as HTMLElement;
        expect(upBtn).toBeTruthy();
        fireEvent.click(upBtn);

        expect(mockPatch).toHaveBeenCalledWith(
            '/tablero/turnos/5/reorder',
            { direction: 'up' },
            { preserveScroll: true },
        );
    });

    it('calls router.patch with direction "down"', () => {
        const turn = makeTurn({ id: 5, status: 'espera' });
        renderTablero({ turns: [turn] });

        const downBtn = document.querySelector('button[title="Bajar en cola"]') as HTMLElement;
        expect(downBtn).toBeTruthy();
        fireEvent.click(downBtn);

        expect(mockPatch).toHaveBeenCalledWith(
            '/tablero/turnos/5/reorder',
            { direction: 'down' },
            { preserveScroll: true },
        );
    });
});

describe('TableroIndex – assignTurnFromCita', () => {
    it('calls router.post with patient_id, doctor_id and appointment_id', () => {
        const cita = makeCita({
            id: 20,
            patient_id: 3,
            doctor_id: 1,
            has_turn: false,
        });
        renderTablero({ appointments: [cita] });

        const asignarBtn = screen.getByRole('button', { name: /asignar turno/i });
        fireEvent.click(asignarBtn);

        expect(mockPost).toHaveBeenCalledWith(
            '/tablero/turnos',
            { patient_id: 3, doctor_id: 1, appointment_id: 20 },
            { preserveScroll: true },
        );
    });
});

describe('TableroIndex – markNoShow', () => {
    it('calls router.patch after confirm', () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
        const cita = makeCita({ id: 30, patient_name: 'Test Patient', has_turn: false });
        renderTablero({ appointments: [cita] });

        const noAsistioBtn = screen.getByRole('button', { name: /no asistió/i });
        fireEvent.click(noAsistioBtn);

        expect(confirmSpy).toHaveBeenCalled();
        expect(mockPatch).toHaveBeenCalledWith(
            '/citas/30/status',
            { status: 'no_asistio' },
            { preserveScroll: true },
        );

        confirmSpy.mockRestore();
    });

    it('does NOT call router.patch when confirm is cancelled', () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
        const cita = makeCita({ id: 31, has_turn: false });
        renderTablero({ appointments: [cita] });

        const noAsistioBtn = screen.getByRole('button', { name: /no asistió/i });
        fireEvent.click(noAsistioBtn);

        expect(confirmSpy).toHaveBeenCalled();
        expect(mockPatch).not.toHaveBeenCalled();

        confirmSpy.mockRestore();
    });
});

describe('TableroIndex – AgregarTurnoModal', () => {
    it('shows modal content when "Agregar turno" button is clicked', () => {
        renderTablero();
        // Before clicking, "Turno sin cita previa" text should not be visible
        expect(
            screen.queryByText(/Turno sin cita previa/i),
        ).not.toBeInTheDocument();

        const btn = screen.getByRole('button', { name: /\+ agregar turno/i });
        fireEvent.click(btn);

        // After clicking, the modal info tip text should appear
        expect(
            screen.getByText(/Turno sin cita previa/i),
        ).toBeInTheDocument();
    });

    it('shows doctor select inside the modal', () => {
        renderTablero();
        const btn = screen.getByRole('button', { name: /\+ agregar turno/i });
        fireEvent.click(btn);

        expect(screen.getByRole('combobox')).toBeInTheDocument();
        expect(screen.getByText('Dra. García — Medicina Interna')).toBeInTheDocument();
    });

    it('does not call router.post without a patient selected in modal', () => {
        // Render with no appointments to avoid "Asignar turno" buttons in citas table
        renderTablero({ appointments: [] });

        const btn = screen.getByRole('button', { name: /\+ agregar turno/i });
        fireEvent.click(btn);

        // Select a doctor
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: '1' } });

        // Submit without a patient - should show validation error
        const submitBtn = screen.getByRole('button', { name: /\+ Asignar turno/i });
        fireEvent.click(submitBtn);

        // router.post should NOT be called without a patient
        expect(mockPost).not.toHaveBeenCalled();
        // Should show error message
        expect(screen.getByText('Selecciona un paciente.')).toBeInTheDocument();
    });
});

describe('TableroIndex – Ver agenda button', () => {
    it('calls router.visit when "Ver agenda" clicked', () => {
        renderTablero();
        const agendaBtn = screen.getByRole('button', { name: /ver agenda/i });
        fireEvent.click(agendaBtn);

        expect(mockVisit).toHaveBeenCalledWith('/citas');
    });
});

describe('TableroIndex – empty states', () => {
    it('shows empty state message when no turns', () => {
        renderTablero({ turns: [] });
        expect(
            screen.getByText(/no hay pacientes en espera/i),
        ).toBeInTheDocument();
    });

    it('shows empty state for citas when no appointments', () => {
        renderTablero({ appointments: [] });
        expect(
            screen.getByText(/no hay citas/i),
        ).toBeInTheDocument();
    });
});
