import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RegistroIndex from '@/pages/registro/index';

// Mock @inertiajs/react
vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
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

// Mock AppLayout
vi.mock('@/layouts/app/app-layout', () => ({
    default: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
}));

// Mock MaskedInput
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

const mockPatients = [
    {
        id: 1,
        expediente_number: 'P-00001',
        full_name: 'María García',
        initials: 'MG',
        document_type: 'cedula',
        document_number: '001-1234567-8',
        first_names: 'María',
        last_names: 'García',
        birth_date: '1990-01-01',
        age: 34,
        sex: 'F',
        phone: '809-555-0001',
        address: null,
        blood_type: 'O+',
        allergies: 'Penicilina',
        emergency_contact_name: null,
        emergency_contact_phone: null,
        open_turns_today: [],
        last_attended_at: '12/10/2026',
        total_turns: 3,
    },
];

describe('RegistroIndex autocomplete', () => {
    beforeEach(() => {
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // K1 – "Escribe al menos 3 caracteres" for short input
    it('muestra mensaje cuando se escriben menos de 3 caracteres', async () => {
        render(<RegistroIndex doctors={mockDoctors} patient={null} />);

        const input = screen.getByLabelText('Buscar paciente');
        fireEvent.change(input, { target: { value: 'Ma' } });
        fireEvent.focus(input);

        // Trigger the dropdown to open by simulating that open=true
        // Since the dropdown shows when query.length > 0 && open, we need to open it
        fireEvent.change(input, { target: { value: 'Ma' } });

        // The component shows "Escribe al menos 3 caracteres" when tooShort
        await waitFor(() => {
            const msg = screen.queryByText(/Escribe al menos 3 caracteres/);
            expect(msg).toBeTruthy();
        });
    });

    // K2 – >= 3 chars triggers search
    it('con 3 o más caracteres dispara fetch al servidor', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => mockPatients,
        });

        render(<RegistroIndex doctors={mockDoctors} patient={null} />);
        const input = screen.getByLabelText('Buscar paciente');
        fireEvent.change(input, { target: { value: 'Mar' } });

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('buscar?q=Mar'),
                expect.any(Object),
            );
        });
    });

    // K3 – "Registrar como paciente nuevo" always present
    it('siempre muestra "Registrar como paciente nuevo" al final de la lista', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => mockPatients,
        });

        render(<RegistroIndex doctors={mockDoctors} patient={null} />);
        const input = screen.getByLabelText('Buscar paciente');
        fireEvent.change(input, { target: { value: 'Mar' } });

        await waitFor(() => {
            expect(
                screen.getByText('Registrar como paciente nuevo'),
            ).toBeTruthy();
        });
    });

    // K4 – No matches shows empty message but keeps "new patient" option
    it('sin coincidencias muestra mensaje de no encontrado y mantiene opción de nuevo', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });

        render(<RegistroIndex doctors={mockDoctors} patient={null} />);
        const input = screen.getByLabelText('Buscar paciente');
        fireEvent.change(input, { target: { value: 'xyz' } });

        await waitFor(() => {
            expect(
                screen.getByText(/Ningún paciente coincide con/),
            ).toBeTruthy();
            expect(
                screen.getByText('Registrar como paciente nuevo'),
            ).toBeTruthy();
        });
    });

    // K5–K6 – Arrow keys navigate
    it('↓ mueve el foco al siguiente elemento de la lista', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => mockPatients,
        });

        render(<RegistroIndex doctors={mockDoctors} patient={null} />);
        const input = screen.getByLabelText('Buscar paciente');
        fireEvent.change(input, { target: { value: 'Mar' } });

        await waitFor(() => screen.getByText('Registrar como paciente nuevo'));

        fireEvent.keyDown(input, { key: 'ArrowDown' });

        // First item (index 0) should now be highlighted via aria-selected
        await waitFor(() => {
            const options = screen.getAllByRole('option');
            expect(options[0].getAttribute('aria-selected')).toBe('true');
        });
    });

    // K7 – Enter selects the highlighted result
    it('Enter sobre un resultado selecciona el paciente', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => mockPatients,
        });

        render(<RegistroIndex doctors={mockDoctors} patient={null} />);
        const input = screen.getByLabelText('Buscar paciente');
        fireEvent.change(input, { target: { value: 'Mar' } });

        await waitFor(() => screen.getByText('María García'));

        fireEvent.keyDown(input, { key: 'ArrowDown' });
        fireEvent.keyDown(input, { key: 'Enter' });

        // Dropdown should close
        await waitFor(() => {
            expect(screen.queryByRole('listbox')).toBeNull();
        });
    });

    // K8 – Esc closes the dropdown
    it('Esc cierra el dropdown', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => mockPatients,
        });

        render(<RegistroIndex doctors={mockDoctors} patient={null} />);
        const input = screen.getByLabelText('Buscar paciente');
        fireEvent.change(input, { target: { value: 'Mar' } });

        await waitFor(() => screen.getByRole('listbox'));

        fireEvent.keyDown(input, { key: 'Escape' });
        expect(screen.queryByRole('listbox')).toBeNull();
    });
});

describe('RegistroIndex banners', () => {
    // L4 – New patient banner
    it('modo paciente nuevo muestra banner informativo con icono Info', async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });

        render(<RegistroIndex doctors={mockDoctors} patient={null} />);
        const input = screen.getByLabelText('Buscar paciente');
        fireEvent.change(input, { target: { value: 'xyz' } });

        await waitFor(() => screen.getByText('Registrar como paciente nuevo'));

        // Click "Registrar como paciente nuevo" option
        fireEvent.click(screen.getByText('Registrar como paciente nuevo'));

        await waitFor(() => {
            expect(screen.getByText(/Se registrará como/)).toBeTruthy();
            expect(screen.getByText(/paciente nuevo/)).toBeTruthy();
        });
    });
});

describe('RegistroIndex with existing patient pre-loaded', () => {
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
        open_turns_today: [],
    };

    // L1 – Existing patient banner
    it('paciente existente muestra banner verde con CircleCheck', () => {
        render(
            <RegistroIndex doctors={mockDoctors} patient={existingPatient} />,
        );
        expect(screen.getByText(/Paciente existente/)).toBeTruthy();
        expect(screen.getByText(/P-00042/)).toBeTruthy();
    });

    // L2 – Open turn banner (warns but does NOT block)
    it('atención abierta hoy muestra banner informativo con nombre del médico', () => {
        const patientWithOpenTurn = {
            ...existingPatient,
            open_turns_today: [{ doctor_name: 'Martínez', status: 'espera' }],
        };
        render(
            <RegistroIndex
                doctors={mockDoctors}
                patient={patientWithOpenTurn}
            />,
        );
        expect(screen.getByText(/Atención abierta hoy/)).toBeTruthy();
        expect(screen.getByText(/Martínez/)).toBeTruthy();
    });

    // L2b – open turn banner NOT shown when no open turns
    it('no muestra banner de atención abierta cuando no hay turnos abiertos', () => {
        render(
            <RegistroIndex doctors={mockDoctors} patient={existingPatient} />,
        );
        expect(screen.queryByText(/Atención abierta hoy/)).toBeNull();
    });

    // L3 – Allergy banner for existing patient
    it('paciente con alergias muestra banner rojo de alérgico', () => {
        const patientWithAllergy = {
            ...existingPatient,
            open_turns_today: [] as { doctor_name: string; status: string }[],
            allergies: 'Ibuprofeno',
        };
        render(
            <RegistroIndex
                doctors={mockDoctors}
                patient={patientWithAllergy}
            />,
        );
        expect(screen.getByText(/Alérgico\(a\) a:/)).toBeTruthy();
        expect(screen.getByText(/Ibuprofeno/)).toBeTruthy();
    });
});

describe('registro page – PatientAutocomplete ARIA & autocomplete attrs', () => {
    beforeEach(() => {
        global.fetch = vi.fn();
    });

    it('search input has role="combobox" (patient-search-input)', () => {
        render(<RegistroIndex doctors={mockDoctors} patient={null} />);
        const input = document.getElementById('patient-search-input');
        expect(input).not.toBeNull();
        expect(input).toHaveAttribute('role', 'combobox');
    });

    it('search input has autocomplete="off"', () => {
        render(<RegistroIndex doctors={mockDoctors} patient={null} />);
        const input = document.getElementById('patient-search-input');
        expect(input).not.toBeNull();
        expect(input).toHaveAttribute('autocomplete', 'off');
    });

    it('listbox is not rendered when dropdown is closed (initial state)', () => {
        render(<RegistroIndex doctors={mockDoctors} patient={null} />);
        // Listbox is only rendered when open=true (after typing)
        // By default it's closed, so listbox should not exist
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
});
