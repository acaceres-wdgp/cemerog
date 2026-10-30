/**
 * Tests for "Ver receta" link in HistorialPanel.
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
    ...overrides,
});

describe('HistorialPanel – Ver receta link', () => {
    it('shows "Ver receta" link when prescription_id is present', () => {
        const entry = makeHistorial({ prescription_id: 5 });
        render(<HistorialPanel historial={[entry]} />);
        expect(screen.getByText('Ver receta')).toBeTruthy();
    });

    it('"Ver receta" link points to the correct print URL', () => {
        const entry = makeHistorial({ prescription_id: 5 });
        render(<HistorialPanel historial={[entry]} />);
        const link = screen.getByText('Ver receta').closest('a');
        expect(link?.getAttribute('href')).toContain('/consulta/recetas/5/imprimir');
    });

    it('does not show "Ver receta" link when prescription_id is null', () => {
        const entry = makeHistorial({ prescription_id: null });
        render(<HistorialPanel historial={[entry]} />);
        expect(screen.queryByText('Ver receta')).toBeNull();
    });
});
