/**
 * Tests for prescription detail and filter in HistorialPanel.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    usePage: vi.fn(() => ({ props: { errors: {} } })),
    router: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
    Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
        <a href={href}>{children}</a>
    ),
}));

import HistorialPanel from '@/pages/consulta/components/HistorialPanel';

const makeHistorial = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    consulted_at: '2026-09-15T10:00:00',
    doctor: {
        id: 1,
        full_name: 'Dr. Rodríguez',
        specialty: 'Medicina General',
    },
    motivo_consulta: 'Dolor de cabeza',
    historia_enfermedad: null,
    examen_fisico: null,
    diagnosticos: null,
    plan_tratamiento: 'Analgésicos',
    vitals: {
        peso: null,
        talla: null,
        temp: null,
        presion_arterial: null,
        frecuencia_cardiaca: null,
        frecuencia_respiratoria: null,
        saturacion_o2: null,
        glucemia: null,
    },
    discharge: null,
    prescription_id: null,
    prescription: null,
    ...overrides,
});

describe('HistorialPanel – Ver receta shows detail panel', () => {
    it('shows "Ver receta" button when prescription_id is present', () => {
        const entry = makeHistorial({
            prescription_id: 5,
            prescription: {
                id: 5,
                general_instructions: 'Reposo',
                items: [],
            },
        });
        render(<HistorialPanel historial={[entry]} />);
        expect(screen.getByText('Ver receta')).toBeTruthy();
    });

    it('"Ver receta" shows medication list in detail panel', () => {
        const entry = makeHistorial({
            prescription_id: 5,
            prescription: {
                id: 5,
                general_instructions: 'Tomar con agua',
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
            },
        });
        render(<HistorialPanel historial={[entry]} />);
        fireEvent.click(screen.getByText('Ver receta'));
        expect(screen.getByText('Amoxicilina 500mg')).toBeTruthy();
    });

    it('"Ver receta" shows Imprimir link with correct href', () => {
        const entry = makeHistorial({
            prescription_id: 5,
            prescription: {
                id: 5,
                general_instructions: null,
                items: [],
            },
        });
        render(<HistorialPanel historial={[entry]} />);
        fireEvent.click(screen.getByText('Ver receta'));
        const link = screen.getByText('Imprimir').closest('a');
        expect(link?.getAttribute('href')).toContain(
            '/consulta/recetas/5/imprimir',
        );
        expect(link?.getAttribute('target')).toBe('_blank');
    });

    it('does not show "Ver receta" when prescription_id is null', () => {
        const entry = makeHistorial({
            prescription_id: null,
            prescription: null,
        });
        render(<HistorialPanel historial={[entry]} />);
        expect(screen.queryByText('Ver receta')).toBeNull();
    });
});

describe('HistorialPanel – Recetas filter', () => {
    it('Recetas filter shows only visits with a prescription', () => {
        const withRx = makeHistorial({
            id: 1,
            prescription_id: 5,
            prescription: { id: 5, general_instructions: null, items: [] },
        });
        const withoutRx = makeHistorial({
            id: 2,
            consulted_at: '2026-08-10T10:00:00',
            motivo_consulta: 'Sin receta',
            prescription_id: null,
            prescription: null,
        });
        render(<HistorialPanel historial={[withRx, withoutRx]} />);

        // Both visible initially
        expect(screen.getAllByRole('button').length).toBeGreaterThan(1);

        // Click Recetas filter
        fireEvent.click(screen.getByRole('button', { name: /recetas/i }));

        // withoutRx should be hidden (its motivo_consulta not present in list)
        expect(screen.queryByText('Sin receta')).toBeNull();
    });

    it('Recetas filter shows all visits when toggled off', () => {
        const withRx = makeHistorial({
            id: 1,
            prescription_id: 5,
            prescription: { id: 5, general_instructions: null, items: [] },
        });
        const withoutRx = makeHistorial({
            id: 2,
            consulted_at: '2026-08-10T10:00:00',
            motivo_consulta: 'Visita sin receta',
            prescription_id: null,
            prescription: null,
        });
        render(<HistorialPanel historial={[withRx, withoutRx]} />);

        // Enable filter then disable
        fireEvent.click(screen.getByRole('button', { name: /recetas/i }));
        fireEvent.click(screen.getByRole('button', { name: /recetas/i }));

        expect(screen.getByText('Visita sin receta')).toBeTruthy();
    });
});
