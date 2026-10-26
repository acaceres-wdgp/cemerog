/**
 * Tests for Step 2 – duplicate patient detection in registro mode=new.
 * When the document number is complete the page queries /registro/pacientes/buscar
 * and shows a warning banner if a match is found.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { act, render, screen } from '@testing-library/react';
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

function makeFormReturn(
    overrides: Partial<{
        document_type: string;
        document_number: string;
    }> = {},
) {
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
        mockUseForm.mockReturnValue(
            makeFormReturn({ document_number: '001-1234' }),
        );

        render(<RegistroIndex doctors={DOCTORS} patient={null} />);

        await act(async () => {
            vi.advanceTimersByTime(500);
        });

        expect(global.fetch).not.toHaveBeenCalled();
    });

    // D2 – complete cédula (13 chars): exactly one fetch after 400ms debounce
    it('con cédula completa lanza exactamente una consulta tras el debounce', async () => {
        mockUseForm.mockReturnValue(
            makeFormReturn({ document_number: '001-1234567-8' }),
        );
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => null,
        });

        render(<RegistroIndex doctors={DOCTORS} patient={null} />);

        // Before debounce: no call yet
        expect(global.fetch).not.toHaveBeenCalled();

        await act(async () => {
            vi.advanceTimersByTime(400);
        });

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/registro/pacientes/existe'),
            expect.any(Object),
        );
        const url = (global.fetch as ReturnType<typeof vi.fn>).mock
            .calls[0][0] as string;
        expect(url).toContain('documento=001-1234567-8');
        expect(url).toContain('tipo=cedula');
    });

    // D3 – match found: show warning banner with two correct links
    it('con coincidencia muestra el aviso y los enlaces con URLs correctas', async () => {
        mockUseForm.mockReturnValue(
            makeFormReturn({ document_number: '001-1234567-8' }),
        );
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => DUPLICATE,
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
            json: async () => null,
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

        await act(async () => {
            vi.advanceTimersByTime(500);
        });

        expect(global.fetch).not.toHaveBeenCalled();
    });

    // D6 – stale response from first doc must NOT overwrite match for second doc
    it('una respuesta tardía del primer documento no pisa el aviso del segundo', async () => {
        const DUPLICATE_1 = { id: 1, full_name: 'Paciente Primero', age: 40 };
        const DUPLICATE_2 = { id: 2, full_name: 'Paciente Segundo', age: 30 };

        // First render: doc1 completo
        const doc1 = '001-1111111-1';
        const doc2 = '001-2222222-2';

        // First fetch resolves AFTER the second fetch
        let resolveFirst!: (v: unknown) => void;
        const firstFetchPromise = new Promise((resolve) => {
            resolveFirst = resolve;
        });

        (global.fetch as ReturnType<typeof vi.fn>)
            .mockReturnValueOnce(firstFetchPromise) // doc1: delayed
            .mockResolvedValueOnce({
                // doc2: immediate
                ok: true,
                json: async () => DUPLICATE_2,
            });

        // Render with doc1
        mockUseForm.mockReturnValue(makeFormReturn({ document_number: doc1 }));
        const { rerender } = render(
            <RegistroIndex doctors={DOCTORS} patient={null} />,
        );

        // Fire debounce for doc1
        await act(async () => {
            vi.advanceTimersByTime(400);
        });

        // Switch to doc2 before doc1 resolves
        mockUseForm.mockReturnValue(makeFormReturn({ document_number: doc2 }));
        rerender(<RegistroIndex doctors={DOCTORS} patient={null} />);

        // Fire debounce for doc2
        await act(async () => {
            vi.advanceTimersByTime(400);
            await Promise.resolve();
        });

        // doc2 response: DUPLICATE_2 should be shown
        expect(screen.getByText(/Paciente Segundo/)).toBeInTheDocument();

        // Now resolve doc1 late – should be ignored
        await act(async () => {
            resolveFirst({ ok: true, json: async () => DUPLICATE_1 });
            await Promise.resolve();
        });

        expect(screen.queryByText(/Paciente Primero/)).not.toBeInTheDocument();
        expect(screen.getByText(/Paciente Segundo/)).toBeInTheDocument();
    });
});
