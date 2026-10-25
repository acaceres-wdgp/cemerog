/**
 * Tests for TurnoActualCard – loading state and queue display.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { TurnoActualCard } from '@/layouts/app/components/TurnoActualCard';

const mocks = vi.hoisted(() => ({
    routerPost: vi.fn(),
    routerReload: vi.fn(),
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    router: {
        post: mocks.routerPost,
        reload: mocks.routerReload,
    },
}));

const doctor = { id: 1, name: 'Dr. Rodríguez', office: 'Consultorio 1' };

afterEach(() => {
    cleanup();
    mocks.routerPost.mockClear();
    mocks.routerReload.mockClear();
});

// ─── Adjustment 1: loading state when queue is undefined ─────────────────────

describe('TurnoActualCard – loading state', () => {
    it('muestra estado de carga cuando queue es undefined', () => {
        render(
            <TurnoActualCard
                doctor={doctor}
                queue={undefined}
                collapsed={false}
            />,
        );
        // Should show loading indicator, NOT "Sin pacientes en espera"
        expect(screen.getByTestId('turno-loading')).toBeInTheDocument();
        expect(
            screen.queryByText('Sin pacientes en espera'),
        ).not.toBeInTheDocument();
    });

    it('NO muestra estado de carga cuando queue está cargado', () => {
        render(
            <TurnoActualCard
                doctor={doctor}
                queue={{ current_turn: null, waiting_count: 3 }}
                collapsed={false}
            />,
        );
        expect(screen.queryByTestId('turno-loading')).not.toBeInTheDocument();
        expect(screen.getByText(/3 pacientes en espera/)).toBeInTheDocument();
    });

    it('el botón está deshabilitado mientras queue es undefined', () => {
        render(
            <TurnoActualCard
                doctor={doctor}
                queue={undefined}
                collapsed={false}
            />,
        );
        const btn = screen.getByRole('button');
        expect(btn).toBeDisabled();
    });
});

// ─── Queue loaded correctly ───────────────────────────────────────────────────

describe('TurnoActualCard – queue loaded', () => {
    it('muestra waiting_count cuando queue está cargado', () => {
        render(
            <TurnoActualCard
                doctor={doctor}
                queue={{ current_turn: null, waiting_count: 3 }}
                collapsed={false}
            />,
        );
        expect(screen.getByText(/3 pacientes en espera/)).toBeInTheDocument();
    });

    it('muestra "1 paciente en espera" cuando waiting_count es 1', () => {
        render(
            <TurnoActualCard
                doctor={doctor}
                queue={{ current_turn: null, waiting_count: 1 }}
                collapsed={false}
            />,
        );
        expect(screen.getByText(/1 paciente en espera/)).toBeInTheDocument();
    });
});

// ─── Adjustment 4: current_turn in consultation ───────────────────────────────

describe('TurnoActualCard – current_turn en consulta', () => {
    it('muestra el turno activo cuando hay un turno en_consulta', () => {
        render(
            <TurnoActualCard
                doctor={doctor}
                queue={{
                    current_turn: {
                        id: 5,
                        turn_number: 3,
                        patient_name: 'Juan Pérez',
                    },
                    waiting_count: 1,
                }}
                collapsed={false}
            />,
        );
        expect(screen.getByText('T-03')).toBeInTheDocument();
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    it('el botón muestra "En consulta" y está deshabilitado cuando hay current_turn', () => {
        render(
            <TurnoActualCard
                doctor={doctor}
                queue={{
                    current_turn: {
                        id: 5,
                        turn_number: 3,
                        patient_name: 'Juan Pérez',
                    },
                    waiting_count: 2,
                }}
                collapsed={false}
            />,
        );
        const btn = screen.getByRole('button');
        expect(btn).toBeDisabled();
        expect(btn.textContent).toMatch(/En consulta/i);
    });
});
