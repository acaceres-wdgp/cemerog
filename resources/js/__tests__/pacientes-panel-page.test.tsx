/**
 * Opening and closing the patient side panel must keep the current table page.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import PacientesIndex from '@/pages/pacientes/index';

const mocks = vi.hoisted(() => ({ routerGet: vi.fn() }));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
    router: { get: mocks.routerGet },
}));

vi.mock('@/routes', () => ({
    registro: { url: () => '/registro' },
}));
vi.mock('@/routes/pacientes', () => ({ show: { url: () => '/pacientes/1' } }));
vi.mock('@/routes/registro/pacientes', () => ({
    edit: { url: () => '/registro/pacientes/1/editar' },
}));

// Exposes a row click without rendering the real table
vi.mock('@/components/cemerog/DataTable', () => ({
    default: ({
        data,
        onRowClick,
    }: {
        data: { id: number }[];
        onRowClick: (row: { id: number }) => void;
    }) => (
        <button type="button" onClick={() => onRowClick(data[0])}>
            fila
        </button>
    ),
}));

// Exposes the Sheet close without Radix portals
vi.mock('@/components/ui/sheet', () => ({
    Sheet: ({
        children,
        onOpenChange,
    }: {
        children: React.ReactNode;
        onOpenChange: (open: boolean) => void;
    }) => (
        <div>
            <button type="button" onClick={() => onOpenChange(false)}>
                cerrar panel
            </button>
            {children}
        </div>
    ),
    SheetContent: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
}));

const row = {
    id: 25,
    expediente_number: 'EXP-25',
    full_name: 'Aubree Satterfield',
    initials: 'AS',
    first_names: 'Aubree',
    last_names: 'Satterfield',
    document_type: 'cedula',
    document_number: '000-1000002-5',
    sex: 'F',
    age: 17,
    birth_date: '01/01/2009',
    phone: null,
    blood_type: null,
    allergies: null,
    photo_url: null,
    attended_today: false,
    last_attended_at: null,
    last_turn_type: null,
    last_turn_doctor: null,
};

const secondPage = {
    data: [row],
    current_page: 2,
    last_page: 3,
    from: 16,
    to: 30,
    total: 40,
    per_page: 15,
    path: '/pacientes',
    links: [],
};

const props = {
    patients: secondPage,
    counts: {
        total: 40,
        attended_today: 0,
        con_alergias: 0,
        sin_atenciones: 0,
    },
    filters: {
        q: '',
        filter: 'todos' as const,
        sort: 'ultima_atencion' as const,
    },
};

const selected = {
    ...row,
    address: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    created_at: null,
    recent_turns: [],
    total_turns: 0,
};

afterEach(() => {
    cleanup();
    mocks.routerGet.mockClear();
});

describe('patient panel keeps the table page', () => {
    it('keeps the page in the URL when opening a patient', () => {
        render(<PacientesIndex {...props} selected={null} />);
        fireEvent.click(screen.getByRole('button', { name: 'fila' }));

        expect(mocks.routerGet).toHaveBeenCalledWith(
            '/pacientes',
            expect.objectContaining({ paciente: 25, page: 2 }),
            expect.anything(),
        );
    });

    it('keeps the page and does not reload the table when closing the panel', () => {
        render(<PacientesIndex {...props} selected={selected} />);
        fireEvent.click(screen.getByRole('button', { name: 'cerrar panel' }));

        const [url, params, options] = mocks.routerGet.mock.calls[0];
        expect(url).toBe('/pacientes');
        expect(params).toMatchObject({ page: 2 });
        expect(params).not.toHaveProperty('paciente');
        expect(options).toMatchObject({ only: ['selected'] });
    });
});
