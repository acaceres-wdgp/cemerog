/**
 * Tests for adjustments 1, 2, 3:
 *  1 – No duplicate "Dr." prefix in open-turn warning
 *  2 – Human-readable status labels (En espera, En consulta…)
 *  3 – AlertBanner (role="alert") instead of amber Tailwind classes
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import RegistroIndex from '@/pages/registro/index';

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
    usePage: () => ({
        props: {
            auth: {
                user: { name: 'Test', permissions: ['module.registro.access'] },
            },
        },
    }),
    router: { get: vi.fn(), visit: vi.fn() },
}));

vi.mock('@/routes', () => ({
    registro: { index: () => '/registro' },
    pacientes: { index: () => '/pacientes', url: () => '/pacientes' },
}));
vi.mock('@/routes/registro/pacientes', () => ({
    search: () => '/registro/pacientes/buscar',
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

const DOCTORS = [{ id: 1, name: 'Dr. Test', specialty: 'General' }];

const basePatient = {
    id: 1,
    expediente_number: 'P-00001',
    full_name: 'Carlos Ramírez',
    initials: 'CR',
    first_names: 'Carlos',
    last_names: 'Ramírez',
    document_type: 'cedula',
    document_number: '001-0000001-1',
    birth_date: '1980-01-01',
    sex: 'M',
    phone: '809-555-0001',
    address: null,
    blood_type: null,
    allergies: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    total_turns: 1,
    last_attended_at: null,
    open_turns_today: [] as { doctor_name: string; status: string }[],
};

// ─── Adjustment 1: No duplicate "Dr." prefix ─────────────────────────────────

describe('Adj-1: no duplicate Dr. prefix in open-turn warning', () => {
    it('does not prepend "Dr." when doctor_name already contains "Dra."', () => {
        const patient = {
            ...basePatient,
            open_turns_today: [{ doctor_name: 'Dra. López', status: 'espera' }],
        };
        render(<RegistroIndex doctors={DOCTORS} patient={patient} />);

        expect(screen.getByText(/Atención abierta hoy/)).toBeInTheDocument();
        expect(screen.getByText(/Dra\. López/)).toBeInTheDocument();
        expect(screen.queryByText(/Dr\. Dra\./)).not.toBeInTheDocument();
    });

    it('does not prepend "Dr." when doctor_name already contains "Dr."', () => {
        const patient = {
            ...basePatient,
            open_turns_today: [{ doctor_name: 'Dr. García', status: 'espera' }],
        };
        render(<RegistroIndex doctors={DOCTORS} patient={patient} />);

        // Should show "Dr. García" exactly once – no "Dr. Dr."
        const warningText = screen.getByText(/Atención abierta hoy/);
        expect(warningText).toBeInTheDocument();
        expect(screen.queryByText(/Dr\. Dr\./)).not.toBeInTheDocument();
    });
});

// ─── Adjustment 2: Human-readable status labels ───────────────────────────────

describe('Adj-2: human-readable status labels in open-turn warning', () => {
    it('shows "En espera" instead of raw "espera"', () => {
        const patient = {
            ...basePatient,
            open_turns_today: [{ doctor_name: 'Dra. López', status: 'espera' }],
        };
        render(<RegistroIndex doctors={DOCTORS} patient={patient} />);

        expect(screen.getByText(/En espera/)).toBeInTheDocument();
        // The raw value should not appear as a standalone word in the warning
        expect(screen.queryByText(/\(espera\)/)).not.toBeInTheDocument();
    });

    it('shows "En consulta" instead of raw "en_consulta"', () => {
        const patient = {
            ...basePatient,
            open_turns_today: [
                { doctor_name: 'Dr. García', status: 'en_consulta' },
            ],
        };
        render(<RegistroIndex doctors={DOCTORS} patient={patient} />);

        expect(screen.getByText(/En consulta/)).toBeInTheDocument();
        expect(screen.queryByText(/\(en_consulta\)/)).not.toBeInTheDocument();
    });
});

// ─── Adjustment 3: AlertBanner instead of amber colors ───────────────────────

describe('Adj-3: AlertBanner (role="alert") for open-turn warning', () => {
    it('renders role="alert" when patient has open turns today', () => {
        const patient = {
            ...basePatient,
            open_turns_today: [{ doctor_name: 'Dra. López', status: 'espera' }],
        };
        render(<RegistroIndex doctors={DOCTORS} patient={patient} />);

        const alerts = screen.getAllByRole('alert');
        expect(alerts.length).toBeGreaterThan(0);
    });

    it('does NOT render role="alert" when patient has no open turns', () => {
        render(<RegistroIndex doctors={DOCTORS} patient={basePatient} />);

        // No open turns → no alert banner for open-turn warning
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('preserves the link to /tablero inside the alert', () => {
        const patient = {
            ...basePatient,
            open_turns_today: [{ doctor_name: 'Dra. López', status: 'espera' }],
        };
        render(<RegistroIndex doctors={DOCTORS} patient={patient} />);

        const link = screen.getByRole('link', { name: /Ver en el tablero/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/tablero');
    });
});
