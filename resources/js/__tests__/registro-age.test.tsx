import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import RegistroIndex from '@/pages/registro/index';

// ── Shared mock helpers ───────────────────────────────────────────────────────

const mockUseForm = vi.fn();

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
    useForm: (...args: unknown[]) => mockUseForm(...args),
}));

vi.mock('@/routes', () => ({
    pacientes: { url: () => '/pacientes' },
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

vi.mock('@/components/cemerog/Panel', () => ({
    default: ({
        children,
        title,
    }: {
        children: React.ReactNode;
        title: string;
    }) => (
        <div>
            <h2>{title}</h2>
            {children}
        </div>
    ),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockDoctors = [{ id: 1, name: 'Dr. García', specialty: 'Med. General' }];

function makeFormData(birthDate: string) {
    return {
        data: {
            patient_id: null,
            document_type: 'cedula',
            document_number: '',
            first_names: 'Ana',
            last_names: 'Pérez',
            birth_date: birthDate,
            sex: 'F',
            phone: '',
            address: '',
            blood_type: '',
            allergies: '',
            emergency_contact_name: '',
            emergency_contact_phone: '',
            attention_type: 'consulta',
            doctor_id: '',
            notes: '',
            open_turn: '',
        },
        setData: vi.fn(),
        post: vi.fn(),
        processing: false,
        errors: {},
        reset: vi.fn(),
    };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Registro – cálculo de edad en panel Resumen', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('muestra edad correcta antes del cumpleaños del año en curso', () => {
        // nacimiento: 30 dic 1990 | hoy: 15 oct 2026 → 35 años (no 36)
        vi.setSystemTime(new Date('2026-10-15T12:00:00'));
        mockUseForm.mockReturnValue(makeFormData('1990-12-30'));

        render(<RegistroIndex doctors={mockDoctors} patient={null} />);

        // El cálculo erróneo (solo años) da 36; el correcto da 35
        expect(screen.getByText('35 años')).toBeTruthy();
        expect(screen.queryByText('36 años')).toBeNull();
    });

    it('muestra edad correcta después del cumpleaños del año en curso', () => {
        // nacimiento: 30 dic 1990 | hoy: 31 dic 2026 → 36 años
        vi.setSystemTime(new Date('2026-12-31T12:00:00'));
        mockUseForm.mockReturnValue(makeFormData('1990-12-30'));

        render(<RegistroIndex doctors={mockDoctors} patient={null} />);

        expect(screen.getByText('36 años')).toBeTruthy();
        expect(screen.queryByText('35 años')).toBeNull();
    });
});
