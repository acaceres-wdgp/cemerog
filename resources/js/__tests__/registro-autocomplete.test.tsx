/**
 * Tests for the 2-mode Registro page (PROMPT-08):
 *   new      → form enabled from the start, no search input
 *   existing → data preloaded, «Volver a pacientes» link
 *
 * Tests removed from this file (and why):
 *  - K1 "Escribe al menos 3 caracteres": autocomplete removed
 *  - K2 "con 3 o más caracteres dispara fetch": autocomplete removed
 *  - K3 "Registrar como paciente nuevo" always present: button removed
 *  - K4 "sin coincidencias muestra mensaje y opción nuevo": autocomplete removed
 *  - K5–K6 Arrow-key navigation: autocomplete removed
 *  - K7 Enter selects highlighted result: autocomplete removed
 *  - K8 Esc closes dropdown: autocomplete removed
 *  - L4 "modo paciente nuevo muestra banner con Info": Info banner removed
 *  - ARIA "search input has role=combobox": search input removed
 *  - ARIA "search input has autocomplete=off": search input removed
 *  - ARIA "listbox not rendered when dropdown closed": autocomplete removed
 *
 * All the above tested the PatientAutocomplete component that no longer
 * lives inside RegistroIndex. The search now lives in /pacientes.
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import RegistroIndex from '@/pages/registro/index';

// ── Shared mocks ──────────────────────────────────────────────────────────────

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
    useForm: () => ({
        data: {
            patient_id: null,
            document_type: 'cedula',
            document_number: '',
            first_names: '',
            last_names: '',
            birth_date: '',
            sex: '',
            phone: '',
            address: '',
            blood_type: '',
            allergies: '',
            emergency_contact_name: '',
            emergency_contact_phone: '',
            attention_type: 'consulta',
            doctor_id: '',
            notes: '',
        },
        setData: vi.fn(),
        post: vi.fn(),
        processing: false,
        errors: {},
        reset: vi.fn(),
    }),
    router: { get: vi.fn(), visit: vi.fn() },
}));

vi.mock('@/routes', () => ({
    pacientes: { url: () => '/pacientes' },
    registro: { url: () => '/registro' },
}));

vi.mock('@/routes/registro/pacientes', () => ({
    buscar: {
        url: (opts?: unknown) =>
            '/registro/pacientes/buscar' + (opts ? '' : ''),
    },
}));

vi.mock('@/components/cemerog/masked-input', () => ({
    default: ({
        value,
        onChange,
        ...props
    }: {
        value: string;
        onChange: (v: string) => void;
        [k: string]: unknown;
    }) => (
        <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            {...props}
        />
    ),
}));

const mockDoctors = [
    { id: 1, name: 'Dr. García', specialty: 'Medicina General' },
];

const existingPatient = {
    id: 42,
    expediente_number: 'P-00042',
    full_name: 'Pedro Rodríguez',
    initials: 'PR',
    first_names: 'Pedro',
    last_names: 'Rodríguez',
    document_type: 'cedula',
    document_number: '001-9876543-2',
    birth_date: '1974-03-15',
    sex: 'M',
    phone: '809-444-0001',
    address: null,
    blood_type: 'A+',
    allergies: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    total_turns: 9,
    last_attended_at: '12/10/2026',
    open_turns_today: [] as { doctor_name: string; status: string }[],
};

// ── N1: New mode – form directly enabled, no search ───────────────────────────

describe('Registro modo new (sin paciente)', () => {
    it('muestra el formulario directamente habilitado sin buscador', () => {
        render(<RegistroIndex doctors={mockDoctors} patient={null} />);

        // No patient search input (id was patient-search-input in the old autocomplete)
        expect(document.getElementById('patient-search-input')).toBeNull();
        expect(
            screen.queryByLabelText('Buscar paciente'),
        ).not.toBeInTheDocument();

        // Nombres field is present and editable (not disabled)
        const nombresInput = screen.getByLabelText(/Nombres/i);
        expect(nombresInput).not.toBeDisabled();
    });

    it('no hay texto "Busca primero por cédula"', () => {
        render(<RegistroIndex doctors={mockDoctors} patient={null} />);
        expect(
            screen.queryByText(/Busca primero por cédula/i),
        ).not.toBeInTheDocument();
    });

    it('muestra el subtítulo correcto para nuevo paciente', () => {
        render(<RegistroIndex doctors={mockDoctors} patient={null} />);
        expect(
            screen.getByText(
                /Completa los datos del paciente y crea su primera atención/i,
            ),
        ).toBeInTheDocument();
    });

    it('no hay botón «Registrar como paciente nuevo»', () => {
        render(<RegistroIndex doctors={mockDoctors} patient={null} />);
        expect(
            screen.queryByText('Registrar como paciente nuevo'),
        ).not.toBeInTheDocument();
    });
});

// ── E1: Existing mode – data preloaded, Volver a pacientes link ───────────────

describe('Registro modo existing (con paciente precargado)', () => {
    it('muestra el banner de paciente existente con expediente', () => {
        render(
            <RegistroIndex doctors={mockDoctors} patient={existingPatient} />,
        );
        expect(screen.getByText(/Paciente existente/i)).toBeInTheDocument();
        expect(screen.getByText(/P-00042/)).toBeInTheDocument();
    });

    it('muestra el enlace «Volver a pacientes» con href /pacientes', () => {
        render(
            <RegistroIndex doctors={mockDoctors} patient={existingPatient} />,
        );
        const link = screen.getByRole('link', { name: /Volver a pacientes/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/pacientes');
    });

    it('no hay enlace «Cambiar paciente» ni «Volver a buscar»', () => {
        render(
            <RegistroIndex doctors={mockDoctors} patient={existingPatient} />,
        );
        expect(screen.queryByText('Cambiar paciente')).not.toBeInTheDocument();
        expect(screen.queryByText('Volver a buscar')).not.toBeInTheDocument();
    });

    it('muestra el subtítulo correcto para atención existente', () => {
        render(
            <RegistroIndex doctors={mockDoctors} patient={existingPatient} />,
        );
        expect(
            screen.getByText(/Crea una nueva atención para este paciente/i),
        ).toBeInTheDocument();
    });
});
