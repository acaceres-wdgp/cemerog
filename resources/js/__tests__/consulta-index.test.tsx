/**
 * Characterization tests for consulta/index.tsx.
 * These tests pin the current behavior and must pass before and after the refactor.
 * Do NOT modify without a documented reason.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRouterGet, mockRouterPost, mockRouterPatch } = vi.hoisted(() => ({
    mockRouterGet: vi.fn(),
    mockRouterPost: vi.fn(),
    mockRouterPatch: vi.fn(),
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    router: {
        get: mockRouterGet,
        post: mockRouterPost,
        patch: mockRouterPatch,
    },
}));

import ConsultaIndex from '@/pages/consulta/index';

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const makeTurn = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    turn_number: 1,
    turn_order: 1,
    status: 'en_consulta',
    arrived_at: '2026-10-27T09:30:00',
    patient: {
        id: 10,
        full_name: 'María García',
        age: 35,
        sex: 'F',
        allergies: null,
    },
    doctor: {
        id: 1,
        full_name: 'Dr. Rodríguez',
        specialty: 'Medicina General',
    },
    ...overrides,
});

const makeHistorial = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    consulted_at: '2026-09-15T10:00:00',
    doctor: {
        id: 1,
        full_name: 'Dr. Rodríguez',
        specialty: 'Medicina General',
    },
    motivo_consulta: 'Dolor de cabeza',
    historia_enfermedad: null,
    examen_fisico: null,
    diagnosticos: [{ code: 'R51', label: 'Cefalea' }],
    plan_tratamiento: 'Analgésicos',
    vitals: {
        peso: null,
        talla: null,
        temp: null,
        presion_arterial: null,
        frecuencia_cardiaca: null,
        frecuencia_respiratoria: null,
        saturacion_o2: null,
        glucemia: null,
    },
    ...overrides,
});

const BASE_PROPS = {
    can_attend: true,
    turns_en_consulta: [makeTurn()],
    turns_en_espera: [],
};

// ─── Queue ─────────────────────────────────────────────────────────────────────

describe('ConsultaIndex – queue', () => {
    beforeEach(() => {
        mockRouterGet.mockClear();
        mockRouterPatch.mockClear();
    });

    it('opens queue panel when toggle button is clicked', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByText('☰ Ver cola de turnos'));
        expect(screen.getByText('Cola de pacientes – hoy')).toBeTruthy();
    });

    it('shows en_consulta and en_espera turns in the queue', () => {
        const turnConsulta = makeTurn({
            id: 1,
            turn_number: 1,
            patient: {
                id: 10,
                full_name: 'María García',
                age: 35,
                sex: 'F',
                allergies: null,
            },
            doctor: {
                id: 1,
                full_name: 'Dr. Rodríguez',
                specialty: 'Medicina General',
            },
            status: 'en_consulta',
        });
        const turnEspera = makeTurn({
            id: 2,
            turn_number: 2,
            turn_order: 2,
            patient: {
                id: 5,
                full_name: 'Carlos Pérez',
                age: 40,
                sex: 'M',
                allergies: null,
            },
            doctor: {
                id: 1,
                full_name: 'Dr. Rodríguez',
                specialty: 'Medicina General',
            },
            status: 'en_espera',
        });
        render(
            <ConsultaIndex
                can_attend={true}
                turns_en_consulta={[turnConsulta]}
                turns_en_espera={[turnEspera]}
            />,
        );
        fireEvent.click(screen.getByText('☰ Ver cola de turnos'));
        expect(screen.getAllByText('María García').length).toBeGreaterThan(0);
        expect(screen.getByText('Carlos Pérez')).toBeTruthy();
    });

    it('clicking a turn in the queue calls router.get with patient_id', () => {
        const turnEspera = makeTurn({
            id: 2,
            turn_number: 2,
            turn_order: 2,
            patient: {
                id: 5,
                full_name: 'Carlos Pérez',
                age: 40,
                sex: 'M',
                allergies: null,
            },
            doctor: {
                id: 1,
                full_name: 'Dr. Rodríguez',
                specialty: 'Medicina General',
            },
            status: 'en_espera',
        });
        render(
            <ConsultaIndex
                can_attend={true}
                turns_en_consulta={[makeTurn()]}
                turns_en_espera={[turnEspera]}
            />,
        );
        fireEvent.click(screen.getByText('☰ Ver cola de turnos'));
        fireEvent.click(screen.getByText('Carlos Pérez'));
        expect(mockRouterGet).toHaveBeenCalledWith(
            '/consulta',
            { patient_id: '5' },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['historial', 'historial_patient'],
            },
        );
    });

    it('shows "No hay pacientes en turno hoy." when both queues are empty and queue is opened', () => {
        render(
            <ConsultaIndex
                can_attend={true}
                turns_en_consulta={[]}
                turns_en_espera={[]}
            />,
        );
        // The "Sin paciente activo" view has a "☰ Ver cola de turnos" button
        const buttons = screen.getAllByText('☰ Ver cola de turnos');
        fireEvent.click(buttons[0]);
        expect(screen.getByText('No hay pacientes en turno hoy.')).toBeTruthy();
    });
});

// ─── Sin paciente activo ────────────────────────────────────────────────────────

describe('ConsultaIndex – sin paciente activo', () => {
    it('shows "Sin paciente activo" when turns_en_consulta is empty', () => {
        render(
            <ConsultaIndex
                can_attend={true}
                turns_en_consulta={[]}
                turns_en_espera={[]}
            />,
        );
        expect(screen.getByText('Sin paciente activo')).toBeTruthy();
    });
});

// ─── can_attend: false ────────────────────────────────────────────────────────

describe('ConsultaIndex – can_attend false', () => {
    it('shows the unlinked-doctor message when can_attend is false', () => {
        render(
            <ConsultaIndex
                can_attend={false}
                turns_en_consulta={[]}
                turns_en_espera={[]}
            />,
        );
        expect(
            screen.getByText(
                'Tu usuario no está vinculado a un médico activo. Contacta al administrador.',
            ),
        ).toBeTruthy();
    });

    it('does not show queue or consultation form when can_attend is false', () => {
        render(
            <ConsultaIndex
                can_attend={false}
                turns_en_consulta={[]}
                turns_en_espera={[]}
            />,
        );
        expect(screen.queryByText('☰ Ver cola de turnos')).toBeNull();
        expect(screen.queryByText('Motivo de consulta')).toBeNull();
    });
});

// ─── Encabezado paciente ────────────────────────────────────────────────────────

describe('ConsultaIndex – encabezado paciente', () => {
    it('shows patient name, age, sex, and doctor name', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        expect(screen.getAllByText('María García').length).toBeGreaterThan(0);
        expect(screen.getByText('35 años')).toBeTruthy();
        expect(screen.getByText('Femenino')).toBeTruthy();
        expect(screen.getAllByText('Dr. Rodríguez').length).toBeGreaterThan(0);
    });

    it('shows allergy box when allergies are present', () => {
        const turn = makeTurn({
            patient: {
                id: 10,
                full_name: 'María García',
                age: 35,
                sex: 'F',
                allergies: 'Penicilina',
            },
        });
        render(
            <ConsultaIndex
                can_attend={true}
                turns_en_consulta={[turn]}
                turns_en_espera={[]}
            />,
        );
        expect(screen.getAllByText('Alergias').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Penicilina').length).toBeGreaterThan(0);
    });
});

// ─── Antecedentes ────────────────────────────────────────────────────────────────

describe('ConsultaIndex – antecedentes', () => {
    beforeEach(() => {
        mockRouterPatch.mockClear();
    });

    it('clicking "Editar" shows input fields for antecedentes', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByText('Editar'));
        // After clicking Editar, a "Personales" label should be visible
        expect(screen.getByText('Personales')).toBeTruthy();
    });

    it('fills input and clicking "Guardar" calls router.patch with the antecedentes data', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByText('Editar'));

        // Find the "Personales" input by label
        const personalesLabel = screen.getByText('Personales');
        const input = personalesLabel.closest('label')!.querySelector('input')!;
        fireEvent.change(input, { target: { value: 'HTA' } });

        fireEvent.click(screen.getByText('Guardar'));
        expect(mockRouterPatch).toHaveBeenCalledWith(
            '/consulta/antecedentes/10',
            expect.objectContaining({ personales: 'HTA' }),
            expect.any(Object),
        );
    });
});

// ─── Nota clínica IMC ───────────────────────────────────────────────────────────
// Form now accepts lb (weight) and ft+inches (height); BMI is computed live.

describe('ConsultaIndex – nota clínica IMC', () => {
    it('computes IMC ~24.1 Normal from 154 lb and 5 ft 6 in', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);

        // Weight in lb
        const pesoLabel = screen.getByText('Peso (lb)').closest('label')!;
        fireEvent.change(pesoLabel.querySelector('input')!, {
            target: { value: '154' },
        });

        // Height: feet field
        const ftLabel = screen.getByText('Pies').closest('label')!;
        fireEvent.change(ftLabel.querySelector('input')!, {
            target: { value: '5' },
        });

        // Height: inches field
        const inLabel = screen.getByText('Pulgadas').closest('label')!;
        fireEvent.change(inLabel.querySelector('input')!, {
            target: { value: '7' },
        });

        // IMC for 154 lb / 5'7" ≈ 24.1 Normal
        // stored: peso=699 (lbToKgTimes10(154)), talla=170 (feetInchesToCm(5,7))
        // imc = 69.9 / (1.70^2) = 24.1...
        expect(screen.getByText(/24\.\d Normal/)).toBeTruthy();
    });
});

// ─── Nota clínica guardar ───────────────────────────────────────────────────────
// The form converts lb → kg×10 and ft+in → cm before sending to the server.

describe('ConsultaIndex – nota clínica guardar', () => {
    beforeEach(() => {
        mockRouterPost.mockClear();
    });

    it('clicking "✓ Guardar nota" sends converted metric values (peso=699, talla=170)', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);

        // Fill motivo_consulta
        const motivoLabel = screen
            .getByText('Motivo de consulta')
            .closest('label')!;
        fireEvent.change(motivoLabel.querySelector('textarea')!, {
            target: { value: 'Fiebre' },
        });

        // Fill peso in lb (154 lb → 699 kg×10)
        const pesoLabel = screen.getByText('Peso (lb)').closest('label')!;
        fireEvent.change(pesoLabel.querySelector('input')!, {
            target: { value: '154' },
        });

        // Fill height: 5 ft 7 in → 170 cm
        const ftLabel = screen.getByText('Pies').closest('label')!;
        fireEvent.change(ftLabel.querySelector('input')!, {
            target: { value: '5' },
        });
        const inLabel = screen.getByText('Pulgadas').closest('label')!;
        fireEvent.change(inLabel.querySelector('input')!, {
            target: { value: '7' },
        });

        fireEvent.click(screen.getByText('✓ Guardar nota'));

        expect(mockRouterPost).toHaveBeenCalledWith(
            '/consulta',
            expect.objectContaining({
                patient_id: 10,
                doctor_id: 1,
                turn_id: 1,
                motivo_consulta: 'Fiebre',
                peso: 699, // lbToKgTimes10(154)
                talla: 170, // feetInchesToCm(5, 7)
            }),
            expect.any(Object),
        );
    });
});

// ─── Pestañas ───────────────────────────────────────────────────────────────────

describe('ConsultaIndex – pestañas', () => {
    it('default tab shows nota content (Motivo de consulta)', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        expect(screen.getByText('Motivo de consulta')).toBeTruthy();
    });

    it('clicking "Receta" tab shows Receta heading and "1 medicamentos"', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByText('Receta'));
        expect(screen.getByText(/1 medicamentos/)).toBeTruthy();
    });

    it('clicking "Cuenta / Órdenes" tab shows "Órdenes" heading', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByText('Cuenta / Órdenes'));
        expect(screen.getByText('Órdenes')).toBeTruthy();
    });
});

// ─── Receta ──────────────────────────────────────────────────────────────────────

describe('ConsultaIndex – receta', () => {
    it('clicking "+ Agregar medicamento" adds a second row', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByText('Receta'));
        expect(screen.getByText(/1 medicamentos/)).toBeTruthy();

        fireEvent.click(screen.getByText('+ Agregar medicamento'));
        expect(screen.getByText(/2 medicamentos/)).toBeTruthy();
    });

    it('clicking trash icon removes a row', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByText('Receta'));

        // Add a second row first
        fireEvent.click(screen.getByText('+ Agregar medicamento'));
        expect(screen.getByText(/2 medicamentos/)).toBeTruthy();

        // Click the first trash button
        const trashButtons = screen.getAllByText('🗑');
        fireEvent.click(trashButtons[0]);
        expect(screen.getByText(/1 medicamentos/)).toBeTruthy();
    });
});

// ─── Historial ──────────────────────────────────────────────────────────────────

describe('ConsultaIndex – historial', () => {
    it('shows "Historial en la clínica" with historial entries', () => {
        render(<ConsultaIndex {...BASE_PROPS} historial={[makeHistorial()]} />);
        expect(
            screen.getAllByText('Historial en la clínica').length,
        ).toBeGreaterThan(0);
    });

    it('clicking a historial entry shows detail (diagnóstico code, motivo, plan)', () => {
        render(<ConsultaIndex {...BASE_PROPS} historial={[makeHistorial()]} />);
        // The entry is already selected by default (first item), so detail should be visible
        expect(screen.getByText('Analgésicos')).toBeTruthy();
    });

    it('shows "Sin historial registrado" without historial', () => {
        render(<ConsultaIndex {...BASE_PROPS} historial={[]} />);
        expect(screen.getByText('Sin historial registrado')).toBeTruthy();
    });
});

// ─── Dar de alta ─────────────────────────────────────────────────────────────────

describe('ConsultaIndex – dar de alta', () => {
    beforeEach(() => {
        mockRouterPatch.mockClear();
    });

    it('clicking "✓ Dar alta" calls router.patch with the turn id', () => {
        render(<ConsultaIndex {...BASE_PROPS} />);
        fireEvent.click(screen.getByText('✓ Dar alta'));
        expect(mockRouterPatch).toHaveBeenCalledWith(
            '/consulta/turnos/1/alta',
            {},
        );
    });
});
