/**
 * Tests for post-discharge navigation in ConsultaIndex.
 * After a successful discharge:
 * 1. The modal closes.
 * 2. The active turn advances to the next in-consultation turn, or shows empty state.
 * Also: when new props no longer contain the active turn, it should be cleared.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

type RouterPostOptions = {
    onFinish?: () => void;
    onSuccess?: () => void;
};

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

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeTurn = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    turn_number: 1,
    turn_order: 1,
    status: 'en_consulta',
    arrived_at: '2026-10-27T09:30:00',
    patient: { id: 10, full_name: 'María García', age: 35, sex: 'F', allergies: null },
    doctor: { id: 1, full_name: 'Dr. Rodríguez', specialty: 'Medicina General' },
    ...overrides,
});

const nextTurn = makeTurn({
    id: 2,
    turn_number: 2,
    turn_order: 2,
    status: 'en_consulta',
    patient: { id: 20, full_name: 'Pedro López', age: 45, sex: 'M', allergies: null },
});

// ─── Post-discharge navigation ────────────────────────────────────────────────

describe('ConsultaIndex – post-discharge navigation', () => {
    beforeEach(() => {
        mockRouterPost.mockClear();
        mockRouterGet.mockClear();
        mockUsePage.mockReturnValue({ props: { errors: {} } });
    });

    it('after onSuccess the modal closes and the next in-consultation turn is shown', async () => {
        const { rerender } = render(
            <ConsultaIndex
                can_attend
                turns_en_consulta={[makeTurn(), nextTurn]}
                turns_en_espera={[]}
            />,
        );

        // Open the modal for the first turn
        fireEvent.click(screen.getByRole('button', { name: /Dar alta médica/i }));
        expect(screen.getByText('Alta médica')).toBeTruthy();

        // Fill in diagnosis and submit
        fireEvent.change(screen.getByLabelText(/Diagnóstico de egreso/i), {
            target: { value: 'Resuelto' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Confirmar alta/i }));

        // Get the onSuccess callback from the router.post call
        expect(mockRouterPost).toHaveBeenCalled();
        const options = mockRouterPost.mock.calls[0][2] as RouterPostOptions;

        // Simulate Inertia updating props after the redirect (turn 1 discharged)
        act(() => {
            options.onSuccess?.();
            rerender(
                <ConsultaIndex
                    can_attend
                    turns_en_consulta={[nextTurn]}
                    turns_en_espera={[]}
                />,
            );
        });

        // Modal should be closed
        await waitFor(() => {
            expect(screen.queryByText('Alta médica')).toBeNull();
        });

        // Next turn's patient should be displayed
        expect(screen.getByText('Pedro López')).toBeTruthy();
    });

    it('after onSuccess with no remaining turns, shows empty state', async () => {
        const { rerender } = render(
            <ConsultaIndex
                can_attend
                turns_en_consulta={[makeTurn()]}
                turns_en_espera={[]}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: /Dar alta médica/i }));
        fireEvent.change(screen.getByLabelText(/Diagnóstico de egreso/i), {
            target: { value: 'Resuelto' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Confirmar alta/i }));

        const options = mockRouterPost.mock.calls[0][2] as RouterPostOptions;

        act(() => {
            options.onSuccess?.();
            rerender(
                <ConsultaIndex
                    can_attend
                    turns_en_consulta={[]}
                    turns_en_espera={[]}
                />,
            );
        });

        await waitFor(() => {
            expect(screen.queryByText('Alta médica')).toBeNull();
        });

        // Empty state message
        expect(screen.getByText(/Sin paciente activo/i)).toBeTruthy();
    });

    it('when new props no longer contain the active turn it stops showing', async () => {
        const { rerender } = render(
            <ConsultaIndex
                can_attend
                turns_en_consulta={[makeTurn()]}
                turns_en_espera={[]}
            />,
        );

        // First turn is active
        expect(screen.getByText('María García')).toBeTruthy();

        // Re-render: turn 1 gone, only turn 2 remains
        act(() => {
            rerender(
                <ConsultaIndex
                    can_attend
                    turns_en_consulta={[nextTurn]}
                    turns_en_espera={[]}
                />,
            );
        });

        await waitFor(() => {
            // Turn 1's patient should no longer be in the patient header
            // (it may still appear in historial, but not as active turn header)
            expect(screen.queryByRole('heading', { name: /María García/i })).toBeNull();
        });

        // Next turn's patient is now active
        expect(screen.getByText('Pedro López')).toBeTruthy();
    });
});
