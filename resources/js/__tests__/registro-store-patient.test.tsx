/**
 * Tests for the "Solo registrar paciente" secondary action (mode=new only).
 * The button POSTs patient fields to /registro/pacientes without creating a turn.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegistroIndex from '@/pages/registro/index';

// ── Shared mock factory ───────────────────────────────────────────────────────

const mockPost = vi.fn();
const mockUseForm = vi.fn();

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
    useForm: (...args: unknown[]) => mockUseForm(...args),
    router: { get: vi.fn(), visit: vi.fn(), post: vi.fn() },
}));

vi.mock('@/routes', () => ({
    pacientes: { url: () => '/pacientes' },
    registro: { url: () => '/registro' },
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const DOCTORS = [{ id: 1, name: 'Dr. García', specialty: 'Med. General' }];

const EXISTING_PATIENT = {
    id: 5,
    expediente_number: 'P-00005',
    full_name: 'Ana López',
    initials: 'AL',
    first_names: 'Ana',
    last_names: 'López',
    document_type: 'cedula',
    document_number: '001-1234567-8',
    birth_date: '1990-01-01',
    sex: 'F',
    phone: '809-555-0000',
    address: null,
    blood_type: null,
    allergies: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    total_turns: 2,
    last_attended_at: '01/01/2026',
    open_turns_today: [],
};

function makeFormReturn(
    overrides: Partial<{ document_type: string; document_number: string }> = {},
) {
    return {
        data: {
            patient_id: null,
            document_type: overrides.document_type ?? 'cedula',
            document_number: overrides.document_number ?? '001-1234567-8',
            first_names: 'María',
            last_names: 'Pérez',
            birth_date: '1990-05-15',
            sex: 'F',
            phone: '(809) 555-1234',
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
        post: mockPost,
        processing: false,
        errors: {},
        reset: vi.fn(),
    };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Registro – Solo registrar paciente (mode=new)', () => {
    beforeEach(() => {
        mockPost.mockReset();
        global.fetch = vi
            .fn()
            .mockResolvedValue({ ok: true, json: async () => null });
    });

    // RO1 – button visible in mode=new
    it('muestra el botón "Solo registrar paciente" en modo nuevo', () => {
        mockUseForm.mockReturnValue(makeFormReturn());
        render(<RegistroIndex doctors={DOCTORS} patient={null} />);
        expect(
            screen.getByRole('button', { name: /Solo registrar paciente/i }),
        ).toBeInTheDocument();
    });

    // RO2 – button NOT visible in mode=existing
    it('no muestra el botón "Solo registrar paciente" con paciente existente', () => {
        mockUseForm.mockReturnValue(makeFormReturn());
        render(<RegistroIndex doctors={DOCTORS} patient={EXISTING_PATIENT} />);
        expect(
            screen.queryByRole('button', { name: /Solo registrar paciente/i }),
        ).not.toBeInTheDocument();
    });

    // RO3 – clicking the button calls post to /registro/pacientes
    it('clic en "Solo registrar" llama a post con la URL /registro/pacientes', async () => {
        const user = userEvent.setup();
        mockUseForm.mockReturnValue(makeFormReturn());
        render(<RegistroIndex doctors={DOCTORS} patient={null} />);

        const btn = screen.getByRole('button', {
            name: /Solo registrar paciente/i,
        });
        await user.click(btn);

        expect(mockPost).toHaveBeenCalledTimes(1);
        expect(mockPost).toHaveBeenCalledWith(
            '/registro/pacientes',
            expect.any(Object),
        );
    });

    // RO4 – explanatory text is present near the button
    it('muestra texto explicativo junto al botón "Solo registrar"', () => {
        mockUseForm.mockReturnValue(makeFormReturn());
        render(<RegistroIndex doctors={DOCTORS} patient={null} />);
        expect(screen.getByText(/sin crear atención/i)).toBeInTheDocument();
    });
});
