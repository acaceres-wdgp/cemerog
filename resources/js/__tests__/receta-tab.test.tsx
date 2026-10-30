/**
 * Tests for the enhanced RecetaTab component.
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const { mockRouterPost, mockRouterPut, mockUsePage } = vi.hoisted(() => ({
    mockRouterPost: vi.fn(),
    mockRouterPut: vi.fn(),
    mockUsePage: vi.fn(() => ({ props: { errors: {} } })),
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    usePage: mockUsePage,
    router: {
        post: mockRouterPost,
        put: mockRouterPut,
        get: vi.fn(),
        patch: vi.fn(),
    },
}));

import RecetaTab from '@/pages/consulta/components/RecetaTab';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeTurn = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    turn_number: 1,
    turn_order: 1,
    status: 'en_consulta',
    arrived_at: '2026-10-27T09:30:00',
    patient: {
        id: 10,
        full_name: 'María García',
        age: 35,
        sex: 'F',
        allergies: null,
    },
    doctor: {
        id: 1,
        full_name: 'Dr. Rodríguez',
        specialty: 'Medicina General',
    },
    ...overrides,
});

// ─── Row add/remove ───────────────────────────────────────────────────────────

describe('RecetaTab – add/remove rows', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('starts with 1 row', () => {
        render(
            <RecetaTab
                turn={makeTurn()}
                prescription={null}
                isDischargedTurn={false}
            />,
        );
        expect(screen.getByText(/1 medicamentos/)).toBeTruthy();
    });

    it('clicking "+ Agregar medicamento" adds a row', () => {
        render(
            <RecetaTab
                turn={makeTurn()}
                prescription={null}
                isDischargedTurn={false}
            />,
        );
        fireEvent.click(screen.getByText('+ Agregar medicamento'));
        expect(screen.getByText(/2 medicamentos/)).toBeTruthy();
    });

    it('clicking delete button removes a row', () => {
        render(
            <RecetaTab
                turn={makeTurn()}
                prescription={null}
                isDischargedTurn={false}
            />,
        );
        fireEvent.click(screen.getByText('+ Agregar medicamento'));
        expect(screen.getByText(/2 medicamentos/)).toBeTruthy();

        const deleteButtons = screen.getAllByRole('button', {
            name: /eliminar/i,
        });
        fireEvent.click(deleteButtons[0]);
        expect(screen.getByText(/1 medicamentos/)).toBeTruthy();
    });
});

// ─── Continuo checkbox disables duration_days ─────────────────────────────────

describe('RecetaTab – Continuo checkbox', () => {
    it('checking Continuo disables the duration_days input', () => {
        render(
            <RecetaTab
                turn={makeTurn()}
                prescription={null}
                isDischargedTurn={false}
            />,
        );
        const checkbox = screen.getByRole('checkbox', { name: /continuo/i });
        const durationInput = screen.getByPlaceholderText(/días/i);

        expect(durationInput).not.toBeDisabled();
        fireEvent.click(checkbox);
        expect(durationInput).toBeDisabled();
    });
});

// ─── Allergy alert ────────────────────────────────────────────────────────────

describe('RecetaTab – allergy alert', () => {
    it('shows allergy alert when medication matches patient allergy', async () => {
        const turn = makeTurn({
            patient: {
                id: 10,
                full_name: 'María García',
                age: 35,
                sex: 'F',
                allergies: 'Penicilina',
            },
        });
        render(
            <RecetaTab
                turn={turn}
                prescription={null}
                isDischargedTurn={false}
            />,
        );

        const medInput = screen.getByPlaceholderText('Medicamento');
        fireEvent.change(medInput, { target: { value: 'Penicilina 500mg' } });

        await waitFor(() => {
            expect(screen.getByText(/alergia/i)).toBeTruthy();
        });
    });

    it('save button is blocked when allergy alert is shown', async () => {
        const turn = makeTurn({
            patient: {
                id: 10,
                full_name: 'María García',
                age: 35,
                sex: 'F',
                allergies: 'Penicilina',
            },
        });
        render(
            <RecetaTab
                turn={turn}
                prescription={null}
                isDischargedTurn={false}
            />,
        );

        const medInput = screen.getByPlaceholderText('Medicamento');
        fireEvent.change(medInput, { target: { value: 'Penicilina 500mg' } });

        await waitFor(() => {
            expect(screen.getByText(/alergia/i)).toBeTruthy();
        });

        const saveButton = screen.getByRole('button', {
            name: /guardar receta/i,
        });
        expect(saveButton).toBeDisabled();
    });
});

// ─── Print button state ───────────────────────────────────────────────────────

describe('RecetaTab – print button', () => {
    beforeEach(() => vi.clearAllMocks());

    it('print button is disabled when prescription is null', () => {
        render(
            <RecetaTab
                turn={makeTurn()}
                prescription={null}
                isDischargedTurn={false}
            />,
        );
        const printButton = screen.getByRole('button', { name: /imprimir/i });
        expect(printButton).toBeDisabled();
    });

    it('print button is enabled when prescription exists and no unsaved changes', () => {
        const prescription = {
            id: 42,
            general_instructions: null,
            prescribed_at: '2026-10-27T10:00:00',
            items: [],
        };
        render(
            <RecetaTab
                turn={makeTurn()}
                prescription={prescription}
                isDischargedTurn={false}
            />,
        );
        const printButton = screen.getByRole('button', { name: /imprimir/i });
        expect(printButton).not.toBeDisabled();
    });

    it('print button is disabled when prescription exists but there are unsaved changes', () => {
        const prescription = {
            id: 42,
            general_instructions: null,
            prescribed_at: '2026-10-27T10:00:00',
            items: [],
        };
        render(
            <RecetaTab
                turn={makeTurn()}
                prescription={prescription}
                isDischargedTurn={false}
            />,
        );
        // Mark dirty by clicking add row
        fireEvent.click(screen.getByText('+ Agregar medicamento'));
        const printButton = screen.getByRole('button', { name: /imprimir/i });
        expect(printButton).toBeDisabled();
    });
});

// ─── Print after the first save ──────────────────────────────────────────────

describe('RecetaTab – print after the first save', () => {
    it('opens the print page of the real prescription id sent by the server', () => {
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
        const { rerender } = render(
            <RecetaTab
                turn={makeTurn()}
                prescription={null}
                isDischargedTurn={false}
            />,
        );
        // After saving, the server sends the new prescription in the props
        rerender(
            <RecetaTab
                turn={makeTurn()}
                prescription={{
                    id: 58,
                    general_instructions: null,
                    prescribed_at: '2026-10-30T10:00:00',
                    items: [],
                }}
                isDischargedTurn={false}
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: /imprimir/i }));
        expect(openSpy).toHaveBeenCalledWith(
            expect.stringMatching(/\/consulta\/recetas\/58\/imprimir$/),
            '_blank',
        );
        openSpy.mockRestore();
    });
});

// ─── Rows loaded from prescription prop ──────────────────────────────────────

describe('RecetaTab – rows from prescriptions prop', () => {
    it('loads rows from prescription items', () => {
        const prescription = {
            id: 7,
            general_instructions: 'Tomar con comida',
            prescribed_at: '2026-10-27T10:00:00',
            items: [
                {
                    id: 1,
                    position: 1,
                    medication: 'Amoxicilina 500mg',
                    route: 'oral',
                    dose: '1 cápsula',
                    frequency: 'Cada 8 horas',
                    duration_days: 7,
                    is_continuous: false,
                    quantity: 21,
                },
            ],
        };
        render(
            <RecetaTab
                turn={makeTurn()}
                prescription={prescription}
                isDischargedTurn={false}
            />,
        );
        expect(screen.getByDisplayValue('Amoxicilina 500mg')).toBeTruthy();
        expect(screen.getByText(/1 medicamentos/)).toBeTruthy();
    });
});

// ─── router.post / router.put ─────────────────────────────────────────────────

describe('RecetaTab – save calls router.post for new, router.put for existing', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls router.post when no prescription exists', () => {
        render(
            <RecetaTab
                turn={makeTurn()}
                prescription={null}
                isDischargedTurn={false}
            />,
        );
        fireEvent.click(
            screen.getByRole('button', { name: /guardar receta/i }),
        );
        expect(mockRouterPost).toHaveBeenCalledWith(
            `/consulta/turnos/1/receta`,
            expect.any(Object),
            expect.any(Object),
        );
        expect(mockRouterPut).not.toHaveBeenCalled();
    });

    it('calls router.put when prescription already exists', () => {
        const prescription = {
            id: 5,
            general_instructions: null,
            prescribed_at: '2026-10-27T10:00:00',
            items: [],
        };
        render(
            <RecetaTab
                turn={makeTurn()}
                prescription={prescription}
                isDischargedTurn={false}
            />,
        );
        fireEvent.click(
            screen.getByRole('button', { name: /guardar receta/i }),
        );
        expect(mockRouterPut).toHaveBeenCalledWith(
            `/consulta/turnos/1/receta`,
            expect.any(Object),
            expect.any(Object),
        );
        expect(mockRouterPost).not.toHaveBeenCalled();
    });
});

// ─── Instruction text builder ─────────────────────────────────────────────────

describe('buildInstruction', () => {
    it('builds correct instruction for non-continuous item', async () => {
        const { buildInstruction } =
            await import('@/pages/consulta/lib/instructionBuilder');
        const item = {
            dose: '1 tableta',
            route: 'oral',
            frequency: 'cada 12 horas',
            duration_days: 7,
            is_continuous: false,
        };
        expect(buildInstruction(item)).toBe(
            'Tomar 1 tableta por vía oral cada 12 horas durante 7 días.',
        );
    });

    it('builds correct instruction for continuous item', async () => {
        const { buildInstruction } =
            await import('@/pages/consulta/lib/instructionBuilder');
        const item = {
            dose: '1 tableta',
            route: 'oral',
            frequency: 'cada 12 horas',
            duration_days: null,
            is_continuous: true,
        };
        expect(buildInstruction(item)).toBe(
            'Tomar 1 tableta por vía oral cada 12 horas de forma continua.',
        );
    });
});
