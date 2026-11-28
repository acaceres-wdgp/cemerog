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

// ─── Required fields ──────────────────────────────────────────────────────────

describe('RecetaTab – required fields', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUsePage.mockReturnValue({ props: { errors: {} } });
    });

    const fill = (label: string, value: string) =>
        fireEvent.change(screen.getByLabelText(label), { target: { value } });
    const save = () =>
        fireEvent.click(
            screen.getByRole('button', { name: /guardar receta/i }),
        );

    it('says which fields are missing and does not save', () => {
        render(
            <RecetaTab
                turn={makeTurn()}
                prescription={null}
                isDischargedTurn={false}
            />,
        );

        fill('Medicamento 1', 'Amoxicilina 500 mg');
        fill('Dosis 1', '1 cápsula');
        fill('Frecuencia 1', 'cada 8 horas');
        fill('Cantidad 1', '21');
        save();

        expect(mockRouterPost).not.toHaveBeenCalled();
        expect(screen.getByRole('alert').textContent).toContain(
            'Amoxicilina 500 mg: falta Duración (días)',
        );
        expect(screen.getByLabelText('Duración 1')).toHaveAttribute(
            'aria-invalid',
            'true',
        );
        expect(screen.getByLabelText('Dosis 1')).not.toHaveAttribute(
            'aria-invalid',
        );

        // Filling it clears the error and saves
        fill('Duración 1', '7');
        expect(screen.queryByRole('alert')).toBeNull();
        save();
        expect(mockRouterPost).toHaveBeenCalled();
    });

    it('lists every missing field of every medication', () => {
        render(
            <RecetaTab
                turn={makeTurn()}
                prescription={null}
                isDischargedTurn={false}
            />,
        );

        fill('Medicamento 1', 'Ibuprofeno');
        fireEvent.click(screen.getByText('+ Agregar medicamento'));
        fill('Dosis 2', '1 tableta');
        save();

        const text = screen.getByRole('alert').textContent;
        expect(text).toContain(
            'Ibuprofeno: falta Dosis, Frecuencia, Duración (días), Cantidad',
        );
        expect(text).toContain(
            'Medicamento 2: falta Medicamento, Frecuencia, Duración (días), Cantidad',
        );
        expect(mockRouterPost).not.toHaveBeenCalled();
    });

    it('a continuous medication needs no days; a blank line is ignored', () => {
        render(
            <RecetaTab
                turn={makeTurn()}
                prescription={null}
                isDischargedTurn={false}
            />,
        );

        fill('Medicamento 1', 'Losartán 50 mg');
        fill('Dosis 1', '1 tableta');
        fill('Frecuencia 1', 'cada 24 horas');
        fill('Cantidad 1', '30');
        fireEvent.click(screen.getByLabelText('Continuo'));
        fireEvent.click(screen.getByText('+ Agregar medicamento'));
        save();

        expect(screen.queryByRole('alert')).toBeNull();
        expect(mockRouterPost).toHaveBeenCalledWith(
            '/consulta/turnos/1/receta',
            expect.objectContaining({
                items: [
                    expect.objectContaining({
                        medication: 'Losartán 50 mg',
                        is_continuous: true,
                        duration_days: null,
                    }),
                ],
            }),
            expect.any(Object),
        );
    });

    it('a quantity of 0 is missing', () => {
        render(
            <RecetaTab
                turn={makeTurn()}
                prescription={null}
                isDischargedTurn={false}
            />,
        );

        fill('Medicamento 1', 'Paracetamol');
        fill('Dosis 1', '1 tableta');
        fill('Frecuencia 1', 'cada 8 horas');
        fill('Duración 1', '3');
        fill('Cantidad 1', '0');
        save();

        expect(screen.getByRole('alert').textContent).toContain(
            'Paracetamol: falta Cantidad',
        );
    });

    it('shows what the server rejects in a line', () => {
        mockUsePage.mockReturnValue({
            props: {
                errors: {
                    'items.0.duration_days':
                        'The items.0.duration_days field is required.',
                },
            },
        });
        render(
            <RecetaTab
                turn={makeTurn()}
                prescription={null}
                isDischargedTurn={false}
            />,
        );

        expect(screen.getByRole('alert').textContent).toContain(
            'No se pudo guardar la receta: revisa Duración (días) del medicamento 1.',
        );
    });
});

// ─── Quantity computed by itself ─────────────────────────────────────────────

describe('RecetaTab – quantity to dispense', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUsePage.mockReturnValue({ props: { errors: {} } });
    });

    const fill = (label: string, value: string) =>
        fireEvent.change(screen.getByLabelText(label), { target: { value } });

    it('is computed from dose, frequency and days, and the doctor can change it', () => {
        render(
            <RecetaTab
                turn={makeTurn()}
                prescription={null}
                isDischargedTurn={false}
            />,
        );

        fill('Medicamento 1', 'Amoxicilina 500 mg');
        fill('Dosis 1', '1 cápsula');
        fill('Frecuencia 1', 'cada 8 horas');
        expect(screen.getByLabelText('Cantidad 1')).toHaveValue(null);
        fill('Duración 1', '7');
        expect(screen.getByLabelText('Cantidad 1')).toHaveValue(21);
        expect(screen.getByText('Calculada')).toBeTruthy();

        fill('Duración 1', '10');
        expect(screen.getByLabelText('Cantidad 1')).toHaveValue(30);

        // Typed by the doctor: it stays
        fill('Cantidad 1', '28');
        expect(screen.getByLabelText('Cantidad 1')).toHaveValue(28);
        expect(screen.queryByText('Calculada')).toBeNull();

        // A change to the line computes it again
        fill('Duración 1', '14');
        expect(screen.getByLabelText('Cantidad 1')).toHaveValue(42);
        expect(screen.getByText('Calculada')).toBeTruthy();
    });

    it('can be cleared to type another one', () => {
        render(
            <RecetaTab
                turn={makeTurn()}
                prescription={null}
                isDischargedTurn={false}
            />,
        );

        fill('Dosis 1', '1 cápsula');
        fill('Frecuencia 1', 'cada 8 horas');
        fill('Duración 1', '7');
        expect(screen.getByLabelText('Cantidad 1')).toHaveValue(21);

        fill('Cantidad 1', '');
        expect(screen.getByLabelText('Cantidad 1')).toHaveValue(null);
        fill('Cantidad 1', '3');
        fill('Cantidad 1', '30');
        expect(screen.getByLabelText('Cantidad 1')).toHaveValue(30);
        expect(screen.queryByText('Calculada')).toBeNull();
    });

    it.each([
        ['Medicamento 1', 'Amoxicilina 875 mg'],
        ['Vía 1', 'Oral'],
        ['Dosis 1', '2 cápsulas'],
        ['Frecuencia 1', 'cada 12 horas'],
        ['Duración 1', '10'],
    ])(
        'a typed quantity is computed again after changing «%s»',
        (label, value) => {
            render(
                <RecetaTab
                    turn={makeTurn()}
                    prescription={null}
                    isDischargedTurn={false}
                />,
            );

            fill('Dosis 1', '1 cápsula');
            fill('Frecuencia 1', 'cada 8 horas');
            fill('Duración 1', '7');
            fill('Cantidad 1', '30');

            fill(label, value);
            const expected: Record<string, number> = {
                'Dosis 1': 42,
                'Frecuencia 1': 14,
                'Duración 1': 30,
            };
            expect(screen.getByLabelText('Cantidad 1')).toHaveValue(
                expected[label] ?? 21,
            );
            expect(screen.getByText('Calculada')).toBeTruthy();
        },
    );

    it('a typed quantity is computed again when the line becomes continuous or not', () => {
        render(
            <RecetaTab
                turn={makeTurn()}
                prescription={null}
                isDischargedTurn={false}
            />,
        );

        fill('Dosis 1', '1 cápsula');
        fill('Frecuencia 1', 'cada 8 horas');
        fill('Duración 1', '7');
        fill('Cantidad 1', '30');

        fireEvent.click(screen.getByLabelText('Continuo'));
        fireEvent.click(screen.getByLabelText('Continuo'));
        expect(screen.getByLabelText('Cantidad 1')).toHaveValue(21);
    });

    it('a typed quantity stays when the changed line cannot be computed', () => {
        render(
            <RecetaTab
                turn={makeTurn()}
                prescription={null}
                isDischargedTurn={false}
            />,
        );

        fill('Medicamento 1', 'Salbutamol inhalador');
        fill('Dosis 1', '2 puffs');
        fill('Frecuencia 1', 'cada 6 horas');
        fill('Duración 1', '7');
        fill('Cantidad 1', '1');

        fill('Medicamento 1', 'Salbutamol inhalador 100 mcg');
        fill('Duración 1', '10');
        expect(screen.getByLabelText('Cantidad 1')).toHaveValue(1);
    });

    it('a computed quantity is cleared when the line can no longer be computed', () => {
        render(
            <RecetaTab
                turn={makeTurn()}
                prescription={null}
                isDischargedTurn={false}
            />,
        );

        fill('Dosis 1', '1 cápsula');
        fill('Frecuencia 1', 'cada 8 horas');
        fill('Duración 1', '7');
        expect(screen.getByLabelText('Cantidad 1')).toHaveValue(21);

        fill('Dosis 1', '500mg');
        expect(screen.getByLabelText('Cantidad 1')).toHaveValue(null);
    });

    it('is left to the doctor when it cannot be computed', () => {
        render(
            <RecetaTab
                turn={makeTurn()}
                prescription={null}
                isDischargedTurn={false}
            />,
        );

        fill('Medicamento 1', 'Acetaminofén jarabe');
        fill('Dosis 1', '5 ml');
        fill('Frecuencia 1', 'cada 8 horas');
        fill('Duración 1', '5');

        expect(screen.getByLabelText('Cantidad 1')).toHaveValue(null);
        expect(screen.queryByText('Calculada')).toBeNull();
    });

    it('a saved prescription keeps its quantity until its line changes', () => {
        render(
            <RecetaTab
                turn={makeTurn()}
                prescription={{
                    id: 5,
                    general_instructions: null,
                    prescribed_at: '2026-10-27T10:00:00',
                    items: [
                        {
                            id: 1,
                            position: 1,
                            medication: 'Amoxicilina',
                            route: null,
                            dose: '1 cápsula',
                            frequency: 'cada 8 horas',
                            duration_days: 7,
                            is_continuous: false,
                            quantity: 20,
                        },
                    ],
                }}
                isDischargedTurn={false}
            />,
        );

        expect(screen.getByLabelText('Cantidad 1')).toHaveValue(20);
        fill('Duración 1', '10');
        expect(screen.getByLabelText('Cantidad 1')).toHaveValue(30);
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
