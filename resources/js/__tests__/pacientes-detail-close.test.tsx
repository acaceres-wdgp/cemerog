/**
 * The patient detail sheet must render a single close button.
 * Uses the real shadcn Sheet (not mocked) so its built-in close button is
 * part of the render.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRouterGet } = vi.hoisted(() => ({ mockRouterGet: vi.fn() }));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
    router: { get: mockRouterGet },
}));

vi.mock('@/routes', () => ({
    registro: { url: () => '/registro' },
}));

vi.mock('@/routes/registro/pacientes', () => ({
    edit: { url: (id: number) => `/registro/pacientes/${id}/editar` },
}));

vi.mock('@/components/cemerog/DataTable', () => ({
    default: () => <div data-testid="data-table" />,
}));

import PacientesIndex from '@/pages/pacientes/index';

const selected = {
    id: 1,
    expediente_number: 'P-00001',
    full_name: 'Ana Torres',
    initials: 'AT',
    first_names: 'Ana',
    last_names: 'Torres',
    document_type: 'cedula',
    document_number: '001-1234567-8',
    sex: 'F',
    age: 35,
    birth_date: '15/05/1990',
    phone: '809-555-1234',
    address: null,
    blood_type: 'A+',
    allergies: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    photo_url: null,
    attended_today: false,
    last_attended_at: null,
    last_turn_type: null,
    last_turn_doctor: null,
    created_at: '24/10/2026',
    recent_turns: [],
    total_turns: 0,
};

function renderWithSelected() {
    return render(
        <PacientesIndex
            {...({
                patients: {
                    data: [],
                    current_page: 1,
                    last_page: 1,
                    from: null,
                    to: null,
                    total: 0,
                    per_page: 15,
                    path: '/pacientes',
                    links: [],
                },
                counts: {
                    total: 1,
                    attended_today: 0,
                    con_alergias: 0,
                    sin_atenciones: 0,
                },
                filters: { q: '', filter: 'todos', sort: 'ultima_atencion' },
                selected,
            } as unknown as React.ComponentProps<typeof PacientesIndex>)}
        />,
    );
}

describe('PacientesIndex – detail sheet close button', () => {
    beforeEach(() => mockRouterGet.mockClear());

    it('renders exactly one close button in the detail panel', () => {
        renderWithSelected();

        expect(screen.getByText('Ana Torres')).toBeInTheDocument();
        expect(
            screen.getAllByRole('button', { name: /cerrar|close/i }),
        ).toHaveLength(1);
    });

    it('closing the panel clears the selected patient from the URL', () => {
        renderWithSelected();

        fireEvent.click(screen.getByRole('button', { name: /cerrar|close/i }));

        expect(mockRouterGet).toHaveBeenCalledWith(
            '/pacientes',
            expect.not.objectContaining({ paciente: expect.anything() }),
            expect.anything(),
        );
    });
});
