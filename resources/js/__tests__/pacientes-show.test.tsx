/**
 * Patient profile page: tabs in the URL, finances only with permission,
 * reprint only for users who can print.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRouterGet, page } = vi.hoisted(() => ({
    mockRouterGet: vi.fn(),
    page: { props: { permissions: ['module.registro.access'] } },
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
    router: { get: mockRouterGet },
    usePage: () => page,
}));

vi.mock('@/routes', () => ({
    pacientes: { url: () => '/pacientes' },
    registro: { url: () => '/registro' },
}));
vi.mock('@/routes/pacientes', () => ({
    show: {
        url: ({ patient }: { patient: number }) => `/pacientes/${patient}`,
    },
}));
vi.mock('@/routes/registro/pacientes', () => ({
    edit: {
        url: ({ patient }: { patient: number }) =>
            `/registro/pacientes/${patient}/editar`,
    },
}));
vi.mock('@/routes/consulta', () => ({
    default: {
        receta: {
            print: {
                url: (id: number) => `/consulta/recetas/${id}/imprimir`,
            },
        },
    },
}));

import PacienteShow from '@/pages/pacientes/show';
import type {
    Finanzas,
    ProfileProps,
} from '@/pages/pacientes/components/perfil/types';

const finanzas: Finanzas = {
    cuentas: [
        {
            id: 1,
            service_date: '30/10/2026',
            status: 'pendiente_facturar',
            total: 150000,
            charges: [
                {
                    id: 1,
                    description: 'Consulta – Dr. Pérez',
                    quantity: 1,
                    total: 150000,
                    doctor: 'Dr. Pérez',
                },
            ],
        },
    ],
    total_cargado: 150000,
    pendiente_facturar: 150000,
    facturas: [],
    pagos: [],
};

function makeProps(overrides: Partial<ProfileProps> = {}): ProfileProps {
    return {
        patient: {
            id: 7,
            expediente_number: 'P-00007',
            full_name: 'Ana Torres',
            initials: 'AT',
            sex: 'F',
            age: 35,
            document_type: 'cedula',
            document_number: '001-1234567-8',
            birth_date: '15/05/1990',
            phone: null,
            address: null,
            emergency_contact_name: null,
            emergency_contact_phone: null,
            blood_type: 'A+',
            allergies: null,
            photo_url: null,
            created_at: '24/10/2026',
        },
        antecedentes: {
            personales: null,
            quirurgicos: null,
            medicamentos: null,
            familiares: null,
        },
        stats: { atenciones: 0, ultima_atencion: null },
        atenciones: {
            data: [],
            current_page: 1,
            last_page: 1,
            total: 0,
            prev_page_url: null,
            next_page_url: null,
        },
        historial: [],
        recetas: [],
        estudios: [],
        finanzas: null,
        can_print: true,
        tab: 'resumen',
        ...overrides,
    };
}

const receta = {
    id: 3,
    date: '30/10/2026',
    doctor: 'Dr. Pérez',
    specialty: 'Medicina General',
    diagnostico: null,
    general_instructions: null,
    items: [
        {
            id: 1,
            position: 1,
            medication: 'Amoxicilina 500 mg',
            route: 'oral',
            dose: '1 cápsula',
            frequency: 'Cada 8 horas',
            duration_days: 7,
            is_continuous: false,
            quantity: 21,
        },
    ],
};

describe('PacienteShow', () => {
    beforeEach(() => mockRouterGet.mockClear());

    it('changing tab puts it in the URL', () => {
        render(<PacienteShow {...makeProps()} />);

        fireEvent.click(screen.getByText('Historial clínico'));

        expect(mockRouterGet).toHaveBeenCalledWith(
            '/pacientes/7',
            { tab: 'historial' },
            expect.objectContaining({ preserveState: true }),
        );
    });

    it('without finances there is no Finanzas tab and no money indicators', () => {
        render(<PacienteShow {...makeProps()} />);

        expect(screen.queryByText('Finanzas')).toBeNull();
        expect(screen.queryByText('Total cargado')).toBeNull();
        expect(screen.queryByText('Pendiente de facturar')).toBeNull();
    });

    it('with finances shows the tab and the pending amount', () => {
        render(<PacienteShow {...makeProps({ finanzas })} />);

        expect(screen.getByText('Finanzas')).toBeTruthy();
        expect(screen.getByText('Total cargado')).toBeTruthy();
        expect(screen.getAllByText(/1,500\.00/).length).toBeGreaterThan(0);
    });

    it('shows the reprint button only when the user can print', () => {
        const { rerender } = render(
            <PacienteShow
                {...makeProps({ recetas: [receta], tab: 'recetas' })}
            />,
        );
        expect(
            screen.getByRole('link', { name: /Reimprimir receta 3/ }),
        ).toHaveAttribute('href', '/consulta/recetas/3/imprimir');

        rerender(
            <PacienteShow
                {...makeProps({
                    recetas: [receta],
                    tab: 'recetas',
                    can_print: false,
                })}
            />,
        );
        expect(
            screen.queryByRole('link', { name: /Reimprimir receta 3/ }),
        ).toBeNull();
    });

    it('shows the history without its own filters, since the page has tabs', () => {
        render(
            <PacienteShow
                {...makeProps({
                    tab: 'historial',
                    historial: [
                        {
                            type: 'consulta',
                            date: '2026-10-30T10:00:00-04:00',
                            mine: true,
                            doctor: {
                                id: 1,
                                full_name: 'Dr. Pérez',
                                specialty: 'Medicina General',
                            },
                            motivo_consulta: 'Dolor de cabeza',
                        },
                    ],
                })}
            />,
        );

        expect(screen.getByText('Historial en la clínica')).toBeTruthy();
        expect(
            screen.queryByRole('button', { name: /Notas clínicas/ }),
        ).toBeNull();
        expect(screen.queryByRole('button', { name: /Míos/ })).toBeNull();
    });

    it('hides Editar datos and Nueva atención without Registro access', () => {
        page.props.permissions = [];
        render(<PacienteShow {...makeProps()} />);

        expect(screen.queryByText('Editar datos')).toBeNull();
        expect(screen.queryByText('Nueva atención')).toBeNull();
        page.props.permissions = ['module.registro.access'];
    });
});
