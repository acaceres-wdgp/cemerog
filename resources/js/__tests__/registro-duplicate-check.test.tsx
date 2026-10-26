/**
 * Tests for Step 2 – duplicate patient detection in registro mode=new.
 * When the document number is complete the page queries /registro/pacientes/buscar
 * and shows a warning banner if a match is found.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import RegistroIndex from '@/pages/registro/index';

// ── Shared mock factory ───────────────────────────────────────────────────────

const mockUseForm = vi.fn();

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
    useForm: (...args: unknown[]) => mockUseForm(...args),
    router: { get: vi.fn(), visit: vi.fn() },
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

const DUPLICATE = { id: 7, full_name: 'Ana García', age: 34 };

function makeFormReturn(overrides: Partial<{
    document_type: string;
    document_number: string;
}> = {}) {
    return {
        data: {
            patient_id: null,
            document_type: overrides.document_type ?? 'cedula',
            document_number: overrides.document_number ?? '',
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
    };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Registro – detección de duplicado por documento', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    // D1 – incomplete cédula: no fetch after debounce
    it('con cédula incompleta no se consulta al servidor', async () => {
        mockUseForm.mockReturnValue(makeFormReturn({ document_number: '001-1234' }));

        render(<RegistroIndex doctors={DOCTORS} patient={null} />);

        await act(async () => { vi.advanceTimersByTime(500); });

        expect(global.fetch).not.toHaveBeenCalled();
    });

    // D2 – complete cédula (13 chars): exactly one fetch after 400ms debounce
    it('con cédula completa lanza exactamente una consulta tras el debounce', async () => {
        mockUseForm.mockReturnValue(
            makeFormReturn({ document_number: '001-1234567-8' }),
        );
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => [],
        });

        render(<RegistroIndex doctors={DOCTORS} patient={null} />);

        // Before debounce: no call yet
        expect(global.fetch).not.toHaveBeenCalled();

        await act(async () => { vi.advanceTimersByTime(400); });

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining(
                '/registro/pacientes/buscar?q=001-1234567-8',
            ),
            expect.any(Object),
        );
    });

    // D3 – match found: show warning banner with two correct links
    it('con coincidencia muestra el aviso y los enlaces con URLs correctas', async () => {
        mockUseForm.mockReturnValue(
            makeFormReturn({ document_number: '001-1234567-8' }),
        );
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => [DUPLICATE],
        });

        render(<RegistroIndex doctors={DOCTORS} patient={null} />);

        await act(async () => {
            vi.advanceTimersByTime(400);
            await Promise.resolve(); // flush fetch microtask
        });

        expect(
            screen.getByText(/Ya existe un paciente con este documento/i),
        ).toBeInTheDocument();

        expect(screen.getByText(/Ana García/)).toBeInTheDocument();
        expect(screen.getByText(/34 años/)).toBeInTheDocument();

        const verFicha = screen.getByRole('link', { name: /Ver ficha/i });
        expect(verFicha).toHaveAttribute('href', '/pacientes?paciente=7');

        const crearAtencion = screen.getByRole('link', {
            name: /Crear atención para este paciente/i,
        });
        expect(crearAtencion).toHaveAttribute('href', '/registro?paciente=7');
    });

    // D4 – no match: no warning banner
    it('sin coincidencia no muestra aviso de duplicado', async () => {
        mockUseForm.mockReturnValue(
            makeFormReturn({ document_number: '001-1234567-8' }),
        );
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => [],
        });

        render(<RegistroIndex doctors={DOCTORS} patient={null} />);

        // Advance debounce and flush microtasks
        await act(async () => {
            vi.advanceTimersByTime(400);
            await Promise.resolve();
        });

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(
            screen.queryByText(/Ya existe un paciente con este documento/i),
        ).not.toBeInTheDocument();
    });

    // D5 – no_tiene: no fetch regardless of length
    it('con tipo no_tiene no se consulta aunque haya caracteres', async () => {
        mockUseForm.mockReturnValue(
            makeFormReturn({
                document_type: 'no_tiene',
                document_number: '001-1234567-8',
            }),
        );

        render(<RegistroIndex doctors={DOCTORS} patient={null} />);

        await act(async () => { vi.advanceTimersByTime(500); });

        expect(global.fetch).not.toHaveBeenCalled();
    });
});
