/**
 * Tests for prescription detail in HistorialPanel (unified historial format).
 * Prescriptions are shown directly in the detail panel for both
 * standalone receta entries and consulta entries that include a prescription.
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
import type { ClinicalEntry } from '@/pages/consulta/types';

const doctor = {
    id: 1,
    full_name: 'Dr. Rodríguez',
    specialty: 'Medicina General',
};

const recetaWithMeds: ClinicalEntry = {
    type: 'receta',
    date: '2026-09-15T10:00:00',
    mine: true,
    doctor,
    prescription: {
        id: 5,
        general_instructions: 'Tomar con agua',
        prescribed_at: '2026-09-15T10:00:00',
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
};

const recetaEmpty: ClinicalEntry = {
    type: 'receta',
    date: '2026-09-15T10:00:00',
    mine: true,
    doctor,
    prescription: {
        id: 5,
        general_instructions: null,
        prescribed_at: '2026-09-15T10:00:00',
        items: [],
    },
};

const consultaNoRx: ClinicalEntry = {
    type: 'consulta',
    date: '2026-08-10T10:00:00',
    mine: true,
    doctor,
    motivo_consulta: 'Sin receta',
    diagnosticos: null,
    plan_tratamiento: null,
    vitals: {
        peso: null, talla: null, temp: null, presion_arterial: null,
        frecuencia_cardiaca: null, frecuencia_respiratoria: null,
        saturacion_o2: null, glucemia: null,
    },
    discharge: null,
    prescription: null,
};

describe('HistorialPanel – receta detail panel', () => {
    it('receta entry shows its medication in the detail panel directly', () => {
        render(<HistorialPanel historial={[recetaWithMeds]} />);
        // Auto-selected first entry; medication appears in detail
        expect(screen.getAllByText('Amoxicilina 500mg').length).toBeGreaterThanOrEqual(1);
    });

    it('receta entry shows Imprimir link with correct href', () => {
        render(<HistorialPanel historial={[recetaEmpty]} />);
        const link = screen.getByText('Imprimir').closest('a');
        expect(link?.getAttribute('href')).toContain(
            '/consulta/recetas/5/imprimir',
        );
        expect(link?.getAttribute('target')).toBe('_blank');
    });

    it('consulta without prescription shows no Imprimir link', () => {
        render(<HistorialPanel historial={[consultaNoRx]} />);
        expect(screen.queryByText('Imprimir')).toBeNull();
    });
});

describe('HistorialPanel – Recetas filter', () => {
    it('Recetas filter hides consulta entries without prescription', () => {
        render(<HistorialPanel historial={[recetaWithMeds, consultaNoRx]} />);

        fireEvent.click(screen.getByRole('button', { name: /recetas/i }));

        // consultaNoRx motivo not visible
        expect(screen.queryByText('Sin receta')).toBeNull();
    });

    it('Recetas filter shows all entries when toggled off', () => {
        render(<HistorialPanel historial={[recetaWithMeds, consultaNoRx]} />);

        fireEvent.click(screen.getByRole('button', { name: /recetas/i }));
        fireEvent.click(screen.getByRole('button', { name: /recetas/i }));

        // consultaNoRx title should be back
        expect(screen.getByText('Sin receta')).toBeTruthy();
    });
});
