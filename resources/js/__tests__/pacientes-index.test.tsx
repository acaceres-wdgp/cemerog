import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

import PacientesIndex from '@/pages/pacientes/index';
import type { LaravelPaginator } from '@/components/cemerog/DataTable';

// Mock @inertiajs/react
vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    Link: ({
        children,
        href,
        ...props
    }: {
        children: React.ReactNode;
        href: string;
        [k: string]: unknown;
    }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
    router: { get: vi.fn() },
}));

// Mock route helpers (wayfinder)
vi.mock('@/routes', () => ({
    registro: { url: () => '/registro' },
    pacientes: { url: () => '/pacientes' },
}));
vi.mock('@/routes/registro/pacientes', () => ({
    edit: { url: () => '/registro/pacientes/edit' },
}));

// Mock SegmentedControl to expose value via data-testid
vi.mock('@/components/cemerog/SegmentedControl', () => ({
    default: ({
        segments,
        value,
        onChange,
    }: {
        segments: Array<{ value: string; label: string; count: number }>;
        value: string;
        onChange: (v: string) => void;
    }) => (
        <div data-testid="segmented-control" data-value={value}>
            {segments.map((s) => (
                <button
                    key={s.value}
                    data-active={s.value === value ? 'true' : 'false'}
                    onClick={() => onChange(s.value)}
                >
                    {s.label}
                </button>
            ))}
        </div>
    ),
}));

// Mock DataTable
vi.mock('@/components/cemerog/DataTable', () => ({
    default: () => <div data-testid="data-table" />,
}));

// Mock Sheet (shadcn) to avoid portal issues
vi.mock('@/components/ui/sheet', () => ({
    Sheet: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    SheetContent: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

type FilterValue =
    | 'todos'
    | 'atendidos_hoy'
    | 'con_alergias'
    | 'sin_atenciones';
type SortValue = 'ultima_atencion' | 'nombre' | 'registro';

interface PatientRow {
    id: number;
    expediente_number: string;
    full_name: string;
    initials: string;
    first_names: string;
    last_names: string;
    document_type: string;
    document_number: string;
    sex: string;
    age: number;
    birth_date: string;
    phone: string | null;
    blood_type: string | null;
    allergies: string | null;
    photo_url: string | null;
    attended_today: boolean;
    last_attended_at: string | null;
    last_turn_type: string | null;
    last_turn_doctor: string | null;
}

const emptyPaginator: LaravelPaginator<PatientRow> = {
    data: [],
    current_page: 1,
    last_page: 1,
    from: null,
    to: null,
    total: 0,
    per_page: 15,
    path: '/pacientes',
    links: [],
};

const emptyCounts = {
    total: 0,
    attended_today: 0,
    con_alergias: 0,
    sin_atenciones: 0,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PacientesIndex – bug filters []', () => {
    it('no lanza error cuando filters llega como array vacío (simula PHP [])', () => {
        // PHP $request->only([...]) with no params → JSON [] → JS: [].filter === Array.prototype.filter
        // useState(someFunction) calls the function as lazy initializer → crash
        expect(() => {
            render(
                <PacientesIndex
                    patients={emptyPaginator}
                    counts={emptyCounts}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    filters={[] as any}
                    selected={null}
                />,
            );
        }).not.toThrow();
    });

    it('el segmento activo es "Todos" cuando filters llega vacío', () => {
        render(
            <PacientesIndex
                patients={emptyPaginator}
                counts={emptyCounts}
                filters={{ q: '', filter: 'todos', sort: 'ultima_atencion' }}
                selected={null}
            />,
        );

        const control = screen.getByTestId('segmented-control');
        expect(control.getAttribute('data-value')).toBe('todos');
    });
});

describe('PacientesIndex – inicialización de estado con filters completo', () => {
    it('inicializa activeFilter desde filters.filter', () => {
        render(
            <PacientesIndex
                patients={emptyPaginator}
                counts={emptyCounts}
                filters={{
                    q: '',
                    filter: 'con_alergias' as FilterValue,
                    sort: 'nombre' as SortValue,
                }}
                selected={null}
            />,
        );

        const control = screen.getByTestId('segmented-control');
        expect(control.getAttribute('data-value')).toBe('con_alergias');
    });
});
