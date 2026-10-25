/**
 * Tests for AgregarTurnoModal – Adjustment 4:
 *   – When server returns errors.open_turn, the modal shows an AlertBanner
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockPost = vi.hoisted(() => vi.fn());

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    router: {
        post: mockPost,
        patch: vi.fn(),
        visit: vi.fn(),
    },
}));

// PatientSearch mock – simulates a selected patient being set
vi.mock('@/components/cemerog/PatientSearch', () => ({
    default: ({
        onSelect,
        error,
    }: {
        selected: unknown;
        query: string;
        onQueryChange: (v: string) => void;
        onSelect: (p: { id: number; full_name: string }) => void;
        onClear: () => void;
        error?: string;
        endpoint: string;
    }) => (
        <div>
            <button
                type="button"
                onClick={() => onSelect({ id: 1, full_name: 'Test Patient' })}
            >
                Select Patient
            </button>
            {error && <span data-testid="patient-error">{error}</span>}
        </div>
    ),
}));

vi.mock('@/components/cemerog/FormDialog', () => ({
    default: ({
        children,
        onSubmit,
        submitLabel,
    }: {
        open: boolean;
        onOpenChange: (v: boolean) => void;
        title: string;
        children: React.ReactNode;
        onSubmit: (e: React.FormEvent) => void;
        isLoading: boolean;
        submitLabel: string;
        maxWidth: string;
    }) => (
        <form onSubmit={onSubmit}>
            {children}
            <button type="submit">{submitLabel}</button>
        </form>
    ),
}));

import { AgregarTurnoModal } from '../AgregarTurnoModal';

const DOCTORS = [
    {
        id: 1,
        name: 'Dra. García',
        specialty: 'Medicina Interna',
        initials: 'GR',
    },
];

beforeEach(() => {
    vi.clearAllMocks();
});

describe('AgregarTurnoModal – open_turn error display', () => {
    it('shows AlertBanner with open_turn error when server returns it', async () => {
        // Simulate server returning errors.open_turn
        mockPost.mockImplementation(
            (
                _url: string,
                _data: unknown,
                { onError }: { onError: (e: Record<string, string>) => void },
            ) => {
                onError({
                    open_turn:
                        'El paciente ya tiene un turno abierto con Dra. García.',
                });
            },
        );

        render(<AgregarTurnoModal onClose={vi.fn()} doctors={DOCTORS} />);

        // Select a patient
        fireEvent.click(screen.getByText('Select Patient'));

        // Select a doctor
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: '1' } });

        // Submit
        const submitBtn = screen.getByRole('button', {
            name: /Asignar turno/i,
        });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByRole('alert')).toBeInTheDocument();
            expect(
                screen.getByText(
                    'El paciente ya tiene un turno abierto con Dra. García.',
                ),
            ).toBeInTheDocument();
        });
    });

    it('does not show open_turn alert when no error', () => {
        render(<AgregarTurnoModal onClose={vi.fn()} doctors={DOCTORS} />);

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('calls router.post when form is complete', async () => {
        mockPost.mockImplementation(
            (
                _url: string,
                _data: unknown,
                { onSuccess }: { onSuccess: () => void },
            ) => {
                onSuccess();
            },
        );

        const onClose = vi.fn();
        render(<AgregarTurnoModal onClose={onClose} doctors={DOCTORS} />);

        // Select patient
        fireEvent.click(screen.getByText('Select Patient'));
        // Select doctor
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: '1' } });

        const submitBtn = screen.getByRole('button', {
            name: /Asignar turno/i,
        });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith(
                '/tablero/turnos',
                expect.objectContaining({ patient_id: 1, doctor_id: 1 }),
                expect.any(Object),
            );
            expect(onClose).toHaveBeenCalled();
        });
    });
});
