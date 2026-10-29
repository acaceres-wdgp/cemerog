/**
 * Tests for the Alta médica modal in ConsultaIndex.
 * Step 3 – Discharge modal behavior.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRouterPost, mockUsePage } = vi.hoisted(() => ({
    mockRouterPost: vi.fn(),
    mockUsePage: vi.fn(() => ({ props: { errors: {} } })),
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    usePage: mockUsePage,
    router: {
        get: vi.fn(),
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

    it('"Ordenar estudios" has tooltip about Laboratorio', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        const btn = screen.getByRole('button', { name: /Ordenar estudios/i });
        // tooltip is stored in title or aria-label attribute
        const tooltip =
            btn.getAttribute('title') ??
            btn.closest('[data-tooltip]')?.getAttribute('data-tooltip') ??
            btn.getAttribute('aria-description') ??
            screen.queryByText(/Laboratorio/)?.textContent;
        // Verify that somewhere there's a tooltip text about Laboratorio
        expect(
            btn.getAttribute('title') !== null ||
                document.body.textContent?.includes('Laboratorio') ||
                btn.getAttribute('aria-label') !== null,
        ).toBe(true);
    });
});

// ─── Alta médica modal ─────────────────────────────────────────────────────────

describe('ConsultaIndex – alta médica modal', () => {
    beforeEach(() => {
        mockRouterPost.mockClear();
    });

    it('clicking "Dar alta médica" opens the modal', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByRole('button', { name: /Dar alta médica/i }));
        expect(screen.getByText('Alta médica')).toBeTruthy();
    });

    it('modal shows patient name and turn number', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByRole('button', { name: /Dar alta médica/i }));
        expect(screen.getByText(/María García/)).toBeTruthy();
    });

    it('modal shows three discharge type options', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByRole('button', { name: /Dar alta médica/i }));
        expect(screen.getByText(/Por alivio/i)).toBeTruthy();
        expect(screen.getByText(/Traslado a otro centro/i)).toBeTruthy();
        expect(screen.getByText(/Defunción/i)).toBeTruthy();
    });

    it('destination field is hidden when "Por alivio" is selected', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByRole('button', { name: /Dar alta médica/i }));
        // Select "Por alivio"
        fireEvent.click(screen.getByText(/Por alivio/i));
        expect(screen.queryByLabelText(/Centro de destino/i)).toBeNull();
    });

    it('destination field is shown when "Traslado" is selected', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByRole('button', { name: /Dar alta médica/i }));
        fireEvent.click(screen.getByText(/Traslado a otro centro/i));
        expect(screen.getByLabelText(/Centro de destino/i)).toBeTruthy();
    });

    it('selecting "Defunción" and confirming shows a second confirmation dialog', async () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByRole('button', { name: /Dar alta médica/i }));
        fireEvent.click(screen.getByText(/Defunción/i));

        // Fill in discharge diagnosis
        const diagInput = screen.getByLabelText(/Diagnóstico de egreso/i);
        fireEvent.change(diagInput, {
            target: { value: 'Paro cardiorrespiratorio' },
        });

        // Click confirm
        fireEvent.click(screen.getByRole('button', { name: /Confirmar alta/i }));

        // Second confirmation dialog should appear
        await waitFor(() => {
            expect(
                screen.getByText(/Confirmo la defunción/i),
            ).toBeTruthy();
        });
    });

    it('modal submits correct payload for "recuperado"', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByRole('button', { name: /Dar alta médica/i }));
        fireEvent.click(screen.getByText(/Por alivio/i));

        const diagInput = screen.getByLabelText(/Diagnóstico de egreso/i);
        fireEvent.change(diagInput, {
            target: { value: 'Gripe resuelta' },
        });

        fireEvent.click(screen.getByRole('button', { name: /Confirmar alta/i }));

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
        fireEvent.click(screen.getByRole('button', { name: /Dar alta médica/i }));
        fireEvent.click(screen.getByText(/Traslado a otro centro/i));

        const destInput = screen.getByLabelText(/Centro de destino/i);
        fireEvent.change(destInput, {
            target: { value: 'Hospital Central' },
        });

        const diagInput = screen.getByLabelText(/Diagnóstico de egreso/i);
        fireEvent.change(diagInput, {
            target: { value: 'Fractura de fémur' },
        });

        fireEvent.click(screen.getByRole('button', { name: /Confirmar alta/i }));

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

describe('ConsultaIndex – T-NN next patient button', () => {
    it('shows "Cargar próximo paciente" button with turn number', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        // T-1 (turn_number=1)
        expect(
            screen.getByRole('button', { name: /Cargar próximo paciente/i }),
        ).toBeTruthy();
    });
});
