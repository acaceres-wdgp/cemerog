/**
 * Tests for the unified clinical history panel.
 * Entry types: consulta | receta | alta
 * Filters: type (Todo/Notas clínicas/Recetas/Análisis e imágenes) × owner (Todos/Míos/Otros)
 * Counters reflect total per type.
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

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const doctor = {
    id: 1,
    full_name: 'Dr. Rodríguez',
    specialty: 'Medicina General',
};
const doctorB = { id: 2, full_name: 'Dra. Guzmán', specialty: 'Pediatría' };

const consultaEntry: ClinicalEntry = {
    type: 'consulta',
    date: '2026-09-15T10:00:00',
    mine: true,
    doctor,
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
    prescription: null,
};

const recetaEntry: ClinicalEntry = {
    type: 'receta',
    date: '2026-09-14T09:00:00',
    mine: true,
    doctor,
    prescription: {
        id: 5,
        general_instructions: 'Tomar con agua',
        prescribed_at: '2026-09-14T09:00:00',
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

const altaEntry: ClinicalEntry = {
    type: 'alta',
    date: '2026-09-13T11:00:00',
    mine: false,
    doctor: doctorB,
    discharge: {
        type: 'recuperado',
        destination: null,
        discharge_diagnosis: 'Gripe resuelta',
        discharged_at: '2026-09-13T11:00:00',
    },
};

const otherConsulta: ClinicalEntry = {
    ...consultaEntry,
    date: '2026-09-12T08:00:00',
    mine: false,
    doctor: doctorB,
    motivo_consulta: 'Fiebre',
};

// ─── Type filter: Recetas ──────────────────────────────────────────────────────

describe('HistorialPanel – type filter', () => {
    it('Recetas filter shows only receta entries', () => {
        render(
            <HistorialPanel
                historial={[consultaEntry, recetaEntry, altaEntry]}
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: /recetas/i }));
        expect(screen.queryByText('Dolor de cabeza')).toBeNull();
        expect(screen.getByText('Amoxicilina 500mg')).toBeTruthy();
    });

    it('Notas clínicas filter shows only consulta entries', () => {
        render(
            <HistorialPanel
                historial={[consultaEntry, recetaEntry, altaEntry]}
            />,
        );
        fireEvent.click(
            screen.getByRole('button', { name: /notas clínicas/i }),
        );
        expect(screen.getByText('Dolor de cabeza')).toBeTruthy();
        expect(screen.queryByText('Amoxicilina 500mg')).toBeNull();
    });
});

// ─── Owner filter: Míos / Otros ───────────────────────────────────────────────

describe('HistorialPanel – owner filter', () => {
    it('Míos filter shows only entries with mine=true', () => {
        render(
            <HistorialPanel
                historial={[consultaEntry, recetaEntry, otherConsulta]}
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: /^míos$/i }));
        expect(screen.getByText('Dolor de cabeza')).toBeTruthy();
        expect(screen.queryByText('Fiebre')).toBeNull();
    });

    it('Otros filter shows only entries with mine=false', () => {
        render(
            <HistorialPanel
                historial={[consultaEntry, recetaEntry, otherConsulta]}
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: /^otros$/i }));
        expect(screen.getByText('Fiebre')).toBeTruthy();
        expect(screen.queryByText('Dolor de cabeza')).toBeNull();
    });
});

// ─── Counters ─────────────────────────────────────────────────────────────────

describe('HistorialPanel – counters', () => {
    it('shows correct count for Notas clínicas', () => {
        render(
            <HistorialPanel
                historial={[consultaEntry, recetaEntry, otherConsulta]}
            />,
        );
        // "Notas clínicas" button should show count 2
        const btn = screen.getByRole('button', { name: /notas clínicas/i });
        expect(btn.textContent).toMatch(/2/);
    });

    it('shows correct count for Recetas', () => {
        render(
            <HistorialPanel
                historial={[consultaEntry, recetaEntry, altaEntry]}
            />,
        );
        const btn = screen.getByRole('button', { name: /recetas/i });
        expect(btn.textContent).toMatch(/1/);
    });
});

// ─── Receta detail ────────────────────────────────────────────────────────────

describe('HistorialPanel – receta detail', () => {
    it('selecting a receta entry shows its medications and Imprimir button', () => {
        render(<HistorialPanel historial={[recetaEntry]} />);
        // The receta entry is auto-selected (first entry)
        // Text appears in both list title and detail panel
        expect(
            screen.getAllByText('Amoxicilina 500mg').length,
        ).toBeGreaterThanOrEqual(1);
        const link = screen.getByText('Imprimir').closest('a');
        expect(link?.getAttribute('href')).toContain(
            '/consulta/recetas/5/imprimir',
        );
    });
});
