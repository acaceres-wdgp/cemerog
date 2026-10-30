/**
 * Tests for the Alta médica modal in ConsultaIndex.
 * Step 3 – Discharge modal behavior.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRouterPost, mockRouterGet, mockUsePage } = vi.hoisted(() => ({
    mockRouterPost: vi.fn(),
    mockRouterGet: vi.fn(),
    mockUsePage: vi.fn(() => ({ props: { errors: {} } })),
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    usePage: mockUsePage,
    router: {
        get: mockRouterGet,
        post: mockRouterPost,
        patch: vi.fn(),
    },
}));

import ConsultaIndex from '@/pages/consulta/index';

// ─── Fixtures ──────────────────────────────────────────────────────────────────

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

const BASE_PROPS = {
    can_attend: true,
    turns_en_consulta: [makeTurn()],
    turns_en_espera: [],
};

// ─── Disabled buttons ──────────────────────────────────────────────────────────

describe('ConsultaIndex – disabled action buttons', () => {
    it('renders "Ordenar estudios" button as disabled', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        const btn = screen.getByRole('button', { name: /Ordenar estudios/i });
        expect(btn).toBeTruthy();
        expect(btn.hasAttribute('disabled')).toBe(true);
    });

    it('renders "Pasar a emergencia" button as disabled', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        const btn = screen.getByRole('button', { name: /Pasar a emergencia/i });
        expect(btn).toBeTruthy();
        expect(btn.hasAttribute('disabled')).toBe(true);
    });

    it('renders "Ingresar" button as disabled', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        const btn = screen.getByRole('button', { name: /^Ingresar$/i });
        expect(btn).toBeTruthy();
        expect(btn.hasAttribute('disabled')).toBe(true);
    });

    it('"Ordenar estudios" tooltip appears on hover', async () => {
        const user = userEvent.setup();
        render(<ConsultaIndex {...BASE_PROPS} />);
        const trigger = screen
            .getByRole('button', { name: /Ordenar estudios/i })
            .closest('span')!;
        await user.hover(trigger);
        await waitFor(() => {
            expect(screen.getByText(/Laboratorio/i)).toBeTruthy();
        });
    });

    it('"Ordenar estudios" tooltip appears on keyboard focus', async () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        const trigger = screen
            .getByRole('button', { name: /Ordenar estudios/i })
            .closest('span')!;
        // Focus the span directly (the disabled button cannot receive focus)
        trigger.focus();
        await waitFor(() => {
            expect(screen.getByText(/Laboratorio/i)).toBeTruthy();
        });
    });

    it('"Pasar a emergencia" tooltip appears on hover', async () => {
        const user = userEvent.setup();
        render(<ConsultaIndex {...BASE_PROPS} />);
        const trigger = screen
            .getByRole('button', { name: /Pasar a emergencia/i })
            .closest('span')!;
        await user.hover(trigger);
        await waitFor(() => {
            expect(screen.getByText(/Emergencia/i)).toBeTruthy();
        });
    });

    it('"Ingresar" tooltip appears on hover', async () => {
        const user = userEvent.setup();
        render(<ConsultaIndex {...BASE_PROPS} />);
        const trigger = screen
            .getByRole('button', { name: /^Ingresar$/i })
            .closest('span')!;
        await user.hover(trigger);
        await waitFor(() => {
            expect(screen.getByText(/Internamiento/i)).toBeTruthy();
        });
    });
});

// ─── Alta médica modal ─────────────────────────────────────────────────────────

describe('ConsultaIndex – alta médica modal', () => {
    beforeEach(() => {
        mockRouterPost.mockClear();
    });

    it('clicking "Dar alta médica" opens the modal', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(
            screen.getByRole('button', { name: /Dar alta médica/i }),
        );
        expect(screen.getByText('Alta médica')).toBeTruthy();
    });

    it('modal shows patient name and turn number', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(
            screen.getByRole('button', { name: /Dar alta médica/i }),
        );
        // The modal title is shown
        expect(screen.getByText('Alta médica')).toBeTruthy();
        // Patient name appears (patient header + modal description)
        expect(screen.getAllByText(/María García/).length).toBeGreaterThan(0);
    });

    it('modal shows three discharge type options', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(
            screen.getByRole('button', { name: /Dar alta médica/i }),
        );
        expect(screen.getByText(/Por alivio/i)).toBeTruthy();
        expect(screen.getByText(/Traslado a otro centro/i)).toBeTruthy();
        expect(screen.getByText(/Defunción/i)).toBeTruthy();
    });

    it('destination field is hidden when "Por alivio" is selected', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(
            screen.getByRole('button', { name: /Dar alta médica/i }),
        );
        // Select "Por alivio"
        fireEvent.click(screen.getByText(/Por alivio/i));
        expect(screen.queryByLabelText(/Centro de destino/i)).toBeNull();
    });

    it('destination field is shown when "Traslado" is selected', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(
            screen.getByRole('button', { name: /Dar alta médica/i }),
        );
        fireEvent.click(screen.getByText(/Traslado a otro centro/i));
        expect(screen.getByLabelText(/Centro de destino/i)).toBeTruthy();
    });

    it('selecting "Defunción" and confirming shows a second confirmation dialog', async () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(
            screen.getByRole('button', { name: /Dar alta médica/i }),
        );
        fireEvent.click(screen.getByText(/Defunción/i));

        // Fill in discharge diagnosis
        const diagInput = screen.getByLabelText(/Diagnóstico de egreso/i);
        fireEvent.change(diagInput, {
            target: { value: 'Paro cardiorrespiratorio' },
        });

        // Click confirm
        fireEvent.click(
            screen.getByRole('button', { name: /Confirmar alta/i }),
        );

        // Second confirmation dialog should appear
        await waitFor(() => {
            expect(screen.getByText(/Confirmo la defunción/i)).toBeTruthy();
        });
    });

    it('modal submits correct payload for "recuperado"', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(
            screen.getByRole('button', { name: /Dar alta médica/i }),
        );
        fireEvent.click(screen.getByText(/Por alivio/i));

        const diagInput = screen.getByLabelText(/Diagnóstico de egreso/i);
        fireEvent.change(diagInput, {
            target: { value: 'Gripe resuelta' },
        });

        fireEvent.click(
            screen.getByRole('button', { name: /Confirmar alta/i }),
        );

        expect(mockRouterPost).toHaveBeenCalledWith(
            '/consulta/turnos/1/alta',
            expect.objectContaining({
                type: 'recuperado',
                discharge_diagnosis: 'Gripe resuelta',
            }),
            expect.any(Object),
        );
    });

    it('modal submits correct payload for "traslado" with destination', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(
            screen.getByRole('button', { name: /Dar alta médica/i }),
        );
        fireEvent.click(screen.getByText(/Traslado a otro centro/i));

        const destInput = screen.getByLabelText(/Centro de destino/i);
        fireEvent.change(destInput, {
            target: { value: 'Hospital Central' },
        });

        const diagInput = screen.getByLabelText(/Diagnóstico de egreso/i);
        fireEvent.change(diagInput, {
            target: { value: 'Fractura de fémur' },
        });

        fireEvent.click(
            screen.getByRole('button', { name: /Confirmar alta/i }),
        );

        expect(mockRouterPost).toHaveBeenCalledWith(
            '/consulta/turnos/1/alta',
            expect.objectContaining({
                type: 'traslado',
                destination: 'Hospital Central',
                discharge_diagnosis: 'Fractura de fémur',
            }),
            expect.any(Object),
        );
    });

    it('modal subtitle shows turn number with two digits (T-01)', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(
            screen.getByRole('button', { name: /Dar alta médica/i }),
        );
        // Turn number is 1, modal description should show "Turno T-01"
        expect(screen.getByText(/Turno T-01/)).toBeTruthy();
    });

    it('shows discharge_diagnosis error from backend', () => {
        mockUsePage.mockReturnValue({
            props: {
                errors: {
                    discharge_diagnosis:
                        'El diagnóstico de egreso es obligatorio.',
                },
            },
        });
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(
            screen.getByRole('button', { name: /Dar alta médica/i }),
        );
        expect(
            screen.getByText(/El diagnóstico de egreso es obligatorio\./i),
        ).toBeTruthy();
        // Restore default mock for other tests
        mockUsePage.mockReturnValue({ props: { errors: {} } });
    });

    it('shows the duplicate discharge error from backend', () => {
        mockUsePage.mockReturnValue({
            props: {
                errors: {
                    message: 'Este turno ya tiene un alta registrada.',
                },
            },
        });
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(
            screen.getByRole('button', { name: /Dar alta médica/i }),
        );
        expect(
            screen.getByText(/Este turno ya tiene un alta registrada\./i),
        ).toBeTruthy();
        mockUsePage.mockReturnValue({ props: { errors: {} } });
    });
});

// ─── Tab rename ─────────────────────────────────────────────────────────────────

describe('ConsultaIndex – tab "Órdenes y cargos"', () => {
    it('shows "Órdenes y cargos" tab (not "Cuenta / Órdenes")', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        expect(screen.getByText('Órdenes y cargos')).toBeTruthy();
        expect(screen.queryByText('Cuenta / Órdenes')).toBeNull();
    });
});

// ─── T-NN next patient button ──────────────────────────────────────────────────

const waitingTurn = makeTurn({
    id: 2,
    turn_number: 2,
    turn_order: 2,
    status: 'espera',
    patient: {
        id: 20,
        full_name: 'Juan Pérez',
        age: 50,
        sex: 'M',
        allergies: null,
    },
});

describe('ConsultaIndex – T-NN next patient button', () => {
    beforeEach(() => {
        mockRouterGet.mockClear();
    });

    it('with a waiting turn: shows turn number and is enabled', () => {
        render(
            <ConsultaIndex {...BASE_PROPS} turns_en_espera={[waitingTurn]} />,
        );
        const btn = screen.getByRole('button', {
            name: /T-02.*Cargar próximo paciente|Cargar próximo paciente/i,
        });
        expect(btn).toBeTruthy();
        expect(btn.hasAttribute('disabled')).toBe(false);
        expect(btn.textContent).toMatch(/T-02/);
    });

    it('with a waiting turn: clicking the button loads the next patient', () => {
        render(
            <ConsultaIndex {...BASE_PROPS} turns_en_espera={[waitingTurn]} />,
        );
        const btn = screen.getByRole('button', {
            name: /Cargar próximo paciente/i,
        });
        fireEvent.click(btn);
        expect(mockRouterGet).toHaveBeenCalledWith(
            '/consulta',
            { patient_id: '20' },
            expect.any(Object),
        );
    });

    it('without waiting turns: button is disabled with "Sin pacientes en espera"', () => {
        render(<ConsultaIndex {...BASE_PROPS} turns_en_espera={[]} />);
        const btn = screen.getByRole('button', {
            name: /Sin pacientes en espera/i,
        });
        expect(btn).toBeTruthy();
        expect(btn.hasAttribute('disabled')).toBe(true);
    });
});
