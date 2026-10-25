/**
 * Characterization tests for registro/edit.tsx.
 * These tests pin the current behavior and must pass before and after the refactor.
 * Do NOT modify without a documented reason.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPut, mockRouterDelete, formState } = vi.hoisted(() => ({
    mockPut: vi.fn(),
    mockRouterDelete: vi.fn(),
    formState: {
        errors: {} as Record<string, string>,
        processing: false,
    },
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    useForm: (initial: Record<string, unknown>) => ({
        data: { ...initial },
        setData: vi.fn(),
        put: mockPut,
        processing: formState.processing,
        errors: formState.errors,
    }),
    router: { delete: mockRouterDelete },
}));

vi.mock('@/components/cemerog/masked-input', () => ({
    MaskedInput: ({
        value,
        onChange,
        ...props
    }: {
        value: string;
        onChange: (v: string) => void;
        [k: string]: unknown;
    }) => (
        <input
            data-testid="masked-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            {...props}
        />
    ),
}));

import RegistroEdit from '@/pages/registro/edit';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const basePatient = {
    id: 42,
    full_name: 'Ana Torres Pérez',
    initials: 'AT',
    document_type: 'cedula' as const,
    document_number: '001-1234567-8',
    email: 'ana@ejemplo.com',
    first_names: 'Ana',
    last_names: 'Torres Pérez',
    birth_date: '1990-05-15',
    age: 35,
    sex: 'F' as const,
    phone: '809-555-1234',
    address: 'Calle 5, Santiago',
    blood_type: 'A+' as const,
    allergies: 'Penicilina',
    emergency_contact_name: 'Luis Torres',
    emergency_contact_phone: '809-555-9999',
    photo_url: null,
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('RegistroEdit', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        formState.errors = {};
        formState.processing = false;
        vi.spyOn(window, 'confirm').mockReturnValue(false);
    });

    describe('precarga datos del paciente', () => {
        it('muestra los nombres del paciente', () => {
            render(<RegistroEdit patient={basePatient} />);
            const input = screen.getByDisplayValue('Ana');
            expect(input).toBeTruthy();
        });

        it('muestra los apellidos del paciente', () => {
            render(<RegistroEdit patient={basePatient} />);
            expect(screen.getByDisplayValue('Torres Pérez')).toBeTruthy();
        });

        it('muestra el tipo de documento seleccionado', () => {
            render(<RegistroEdit patient={basePatient} />);
            const select = screen.getByDisplayValue('Cédula dominicana');
            expect(select).toBeTruthy();
        });

        it('muestra el número de cédula en MaskedInput', () => {
            render(<RegistroEdit patient={basePatient} />);
            const maskedInputs = screen.getAllByTestId('masked-input');
            const cedula = maskedInputs.find(
                (el) => (el as HTMLInputElement).value === '001-1234567-8',
            );
            expect(cedula).toBeTruthy();
        });

        it('muestra la fecha de nacimiento', () => {
            render(<RegistroEdit patient={basePatient} />);
            expect(screen.getByDisplayValue('1990-05-15')).toBeTruthy();
        });

        it('muestra el sexo femenino marcado', () => {
            render(<RegistroEdit patient={basePatient} />);
            expect(screen.getByText('Femenino')).toBeTruthy();
        });

        it('muestra el teléfono', () => {
            render(<RegistroEdit patient={basePatient} />);
            const maskedInputs = screen.getAllByTestId('masked-input');
            const phone = maskedInputs.find(
                (el) => (el as HTMLInputElement).value === '809-555-1234',
            );
            expect(phone).toBeTruthy();
        });

        it('muestra el tipo de sangre seleccionado', () => {
            render(<RegistroEdit patient={basePatient} />);
            expect(screen.getByDisplayValue('A+')).toBeTruthy();
        });

        it('muestra las alergias', () => {
            render(<RegistroEdit patient={basePatient} />);
            expect(screen.getByDisplayValue('Penicilina')).toBeTruthy();
        });

        it('muestra el nombre del contacto de emergencia', () => {
            render(<RegistroEdit patient={basePatient} />);
            expect(screen.getByDisplayValue('Luis Torres')).toBeTruthy();
        });

        it('muestra el nombre completo del paciente en la tarjeta lateral', () => {
            render(<RegistroEdit patient={basePatient} />);
            expect(screen.getByText('Ana Torres Pérez')).toBeTruthy();
        });
    });

    describe('máscara según tipo de documento', () => {
        it('muestra MaskedInput para cédula', () => {
            render(<RegistroEdit patient={basePatient} />);
            expect(
                screen.getAllByTestId('masked-input').length,
            ).toBeGreaterThan(0);
        });

        it('muestra input de texto para pasaporte', () => {
            const patient = {
                ...basePatient,
                document_type: 'pasaporte' as const,
                document_number: 'AB123456',
            };
            render(<RegistroEdit patient={patient} />);
            expect(screen.getByDisplayValue('AB123456')).toBeTruthy();
        });

        it('muestra caja de información para no_tiene', () => {
            const patient = {
                ...basePatient,
                document_type: 'no_tiene' as const,
                document_number: 'GEN-00042',
            };
            render(<RegistroEdit patient={patient} />);
            expect(screen.getByText(/Código asignado/i)).toBeTruthy();
            expect(screen.getAllByText('GEN-00042').length).toBeGreaterThan(0);
        });

        it('muestra texto automático cuando no_tiene no tiene código GEN-', () => {
            const patient = {
                ...basePatient,
                document_type: 'no_tiene' as const,
                document_number: '001-1234567-8',
            };
            render(<RegistroEdit patient={patient} />);
            expect(
                screen.getByText(/El sistema asignará un código/i),
            ).toBeTruthy();
        });
    });

    describe('errores de validación', () => {
        it('muestra error en nombres', () => {
            formState.errors = { first_names: 'El nombre es obligatorio.' };
            render(<RegistroEdit patient={basePatient} />);
            expect(screen.getByText('El nombre es obligatorio.')).toBeTruthy();
        });

        it('muestra error en número de documento', () => {
            formState.errors = {
                document_number: 'Número de documento inválido.',
            };
            render(<RegistroEdit patient={basePatient} />);
            expect(
                screen.getByText('Número de documento inválido.'),
            ).toBeTruthy();
        });

        it('muestra error en fecha de nacimiento', () => {
            formState.errors = { birth_date: 'La fecha no es válida.' };
            render(<RegistroEdit patient={basePatient} />);
            expect(screen.getByText('La fecha no es válida.')).toBeTruthy();
        });

        it('muestra error en tipo de documento', () => {
            formState.errors = { document_type: 'Tipo de documento inválido.' };
            render(<RegistroEdit patient={basePatient} />);
            expect(
                screen.getByText('Tipo de documento inválido.'),
            ).toBeTruthy();
        });
    });

    describe('guardar cambios', () => {
        it('llama a put con la ruta correcta al enviar el formulario', () => {
            render(<RegistroEdit patient={basePatient} />);
            const form = document.querySelector('form')!;
            fireEvent.submit(form);
            expect(mockPut).toHaveBeenCalledWith('/registro/pacientes/42');
        });
    });

    describe('cancelar', () => {
        it('el enlace "Cancelar" apunta a /registro', () => {
            render(<RegistroEdit patient={basePatient} />);
            const cancelLinks = screen
                .getAllByRole('link')
                .filter((a) => a.textContent?.trim() === 'Cancelar');
            expect(cancelLinks.length).toBeGreaterThan(0);
            expect(cancelLinks[0]).toHaveAttribute('href', '/registro');
        });

        it('el enlace "← Volver" apunta a /registro', () => {
            render(<RegistroEdit patient={basePatient} />);
            const backLink = screen.getByText(/← Volver/);
            expect(backLink.closest('a')).toHaveAttribute('href', '/registro');
        });
    });

    describe('foto', () => {
        it('muestra la imagen cuando photo_url está definida', () => {
            const patient = {
                ...basePatient,
                photo_url: 'https://example.com/photo.jpg',
            };
            render(<RegistroEdit patient={patient} />);
            const img = screen.getByAltText('Foto del paciente');
            expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
        });

        it('muestra el botón "Eliminar foto" cuando hay foto', () => {
            const patient = {
                ...basePatient,
                photo_url: 'https://example.com/photo.jpg',
            };
            render(<RegistroEdit patient={patient} />);
            expect(screen.getByText('Eliminar foto')).toBeTruthy();
        });

        it('no muestra el botón "Eliminar foto" cuando no hay foto', () => {
            render(<RegistroEdit patient={basePatient} />);
            expect(screen.queryByText('Eliminar foto')).toBeNull();
        });

        it('muestra error cuando el tipo de archivo no es permitido', () => {
            render(<RegistroEdit patient={basePatient} />);
            const input = document.querySelector(
                'input[type="file"]',
            ) as HTMLInputElement;
            const file = new File(['x'], 'doc.txt', { type: 'text/plain' });
            Object.defineProperty(input, 'files', {
                value: [file],
                configurable: true,
            });
            fireEvent.change(input);
            expect(
                screen.getByText(
                    /Solo se aceptan imágenes \(JPG, PNG, WEBP\) o PDF/i,
                ),
            ).toBeTruthy();
        });
    });
});
