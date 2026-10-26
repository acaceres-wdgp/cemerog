/**
 * Tests for Step 3 – prefill params (?documento / ?nombre) pre-populate the
 * form fields when the user arrives from the Pacientes empty-state button.
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import RegistroIndex from '@/pages/registro/index';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
    useForm: (initial: Record<string, unknown>) => ({
        data: initial,
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

vi.mock('@/components/cemerog/masked-input', () => ({
    default: ({
        value,
        onChange: _onChange,
        ...props
    }: {
        value: string;
        onChange: (v: string) => void;
        [k: string]: unknown;
    }) => (
        <input value={value} readOnly onChange={() => undefined} {...props} />
    ),
}));

const DOCTORS = [{ id: 1, name: 'Dr. García', specialty: 'Med. General' }];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Registro – prefill via props', () => {
    // PF1 – prefillDocumentNumber pre-populates the document_number field
    it('prefillDocumentNumber pre-popula el campo de documento', () => {
        render(
            <RegistroIndex
                doctors={DOCTORS}
                patient={null}
                prefillDocumentNumber="001-9999999-9"
            />,
        );

        // The MaskedInput for cédula renders with the prefill value
        const input = screen.getByDisplayValue('001-9999999-9');
        expect(input).toBeInTheDocument();
    });

    // PF2 – prefillFirstNames pre-populates the first_names field
    it('prefillFirstNames pre-popula el campo de nombres', () => {
        render(
            <RegistroIndex
                doctors={DOCTORS}
                patient={null}
                prefillFirstNames="Carlos"
            />,
        );

        const input = screen.getByDisplayValue('Carlos');
        expect(input).toBeInTheDocument();
    });

    // PF3 – without prefill props, fields start empty
    it('sin props de prefill los campos empiezan vacíos', () => {
        render(<RegistroIndex doctors={DOCTORS} patient={null} />);

        // Both Nombres and document_number should start with ''
        const nombresInput = screen.getByLabelText(/Nombres/i);
        expect(nombresInput).toHaveValue('');
    });
});
