/**
 * Paciente que viene solo a análisis: Registro «Solo análisis» y el botón
 * «Orden sin consulta» de Laboratorio.
 */
import React, { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPost, page } = vi.hoisted(() => ({
    mockPost: vi.fn(),
    page: { props: { errors: {}, permissions: [] as string[] } },
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    Link: ({
        children,
        href,
        className,
    }: {
        children: React.ReactNode;
        href: string;
        className?: string;
    }) => (
        <a href={href} className={className}>
            {children}
        </a>
    ),
    usePage: () => page,
    router: { get: vi.fn(), visit: vi.fn(), post: vi.fn() },
    useForm: (initial: Record<string, unknown>) => {
        const [data, setState] = useState(initial);
        return {
            data,
            setData: (key: string, value: unknown) =>
                setState((d) => ({ ...d, [key]: value })),
            post: (url: string) => mockPost(url, data),
            processing: false,
            errors: {},
            reset: vi.fn(),
        };
    },
}));

import LabIndex from '@/pages/lab/index';
import RegistroIndex from '@/pages/registro/index';

const CATALOG = [
    {
        id: 1,
        code: '104',
        name: 'Hemograma completo',
        category: 'Hematología',
        price: 35000,
        preparation: null,
    },
    {
        id: 2,
        code: '130',
        name: 'Glucosa en ayunas',
        category: 'Química',
        price: 20000,
        preparation: 'Ayuno de 8 horas.',
    },
];

const PATIENT = {
    id: 7,
    expediente_number: 'EXP-0007',
    full_name: 'Ana Pérez',
    initials: 'AP',
    first_names: 'Ana',
    last_names: 'Pérez',
    document_type: 'cedula',
    document_number: '00112345678',
    birth_date: '1990-05-15',
    sex: 'F',
    phone: '8095550001',
    address: null,
    blood_type: null,
    allergies: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    total_turns: 0,
    last_attended_at: null,
    open_turns_today: [],
};

beforeEach(() => {
    mockPost.mockReset();
    page.props.permissions = [];
});

describe('Registro · Solo análisis', () => {
    it('opens on «Solo análisis» and sends the selected analyses without a doctor', () => {
        render(
            <RegistroIndex
                doctors={[]}
                patient={PATIENT}
                initialType="analisis"
                labCatalog={CATALOG}
            />,
        );

        expect(
            screen.getByRole('radio', { name: /Solo análisis/ }),
        ).toBeChecked();
        expect(screen.queryByLabelText(/^Médico/)).not.toBeNull();
        expect(
            screen.getByText('Selecciona al menos un estudio.'),
        ).toBeTruthy();
        const submit = screen.getByRole('button', {
            name: /Registrar y crear orden/,
        });
        expect(submit).toBeDisabled();

        fireEvent.click(
            screen.getByRole('checkbox', { name: /Glucosa en ayunas/ }),
        );
        expect(screen.getByText(/Ayuno de 8 horas/)).toBeTruthy();
        expect(screen.getByText('Cargo al tomar la muestra')).toBeTruthy();
        fireEvent.change(screen.getByLabelText('Médico que indica'), {
            target: { value: 'Dra. Pérez' },
        });
        fireEvent.click(submit);

        expect(mockPost).toHaveBeenCalledWith(
            '/registro',
            expect.objectContaining({
                attention_type: 'analisis',
                lab_test_ids: [2],
                external_doctor: 'Dra. Pérez',
                patient_id: 7,
            }),
        );
    });

    it('a consulta still asks for the doctor', () => {
        render(
            <RegistroIndex
                doctors={[]}
                patient={PATIENT}
                labCatalog={CATALOG}
            />,
        );

        expect(screen.getByRole('radio', { name: /Consulta/ })).toBeChecked();
        expect(screen.queryByText('Hemograma completo')).toBeNull();
        expect(
            screen.getByRole('button', { name: /Registrar y crear atención/ }),
        ).toBeDisabled();
    });
});

describe('Laboratorio · Orden sin consulta', () => {
    it('links to Registro on «Solo análisis» for users who can register', () => {
        page.props.permissions = ['module.registro.access'];
        render(<LabIndex />);

        const link = screen.getByRole('link', { name: /Orden sin consulta/ });
        expect(link.getAttribute('href')).toBe('/registro?tipo=estudios');
        expect(within(link).queryByText('Orden sin consulta')).toBeTruthy();
    });

    it('is hidden for users without Registro', () => {
        render(<LabIndex />);

        expect(screen.queryByText('Orden sin consulta')).toBeNull();
    });
});
