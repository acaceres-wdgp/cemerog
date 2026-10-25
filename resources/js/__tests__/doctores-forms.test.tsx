import { afterEach, describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { router } from '@inertiajs/react';
import DoctoresIndex from '@/pages/doctores/index';

const page = vi.hoisted(() => ({
    props: {
        errors: {},
        specialties: [
            {
                id: 7,
                name: 'Pediatría',
                consultation_price: 150000,
                doctors_count: 0,
            },
        ],
        doctors: [
            {
                id: 1,
                name: 'Dr. Demo',
                exequatur: null,
                phone: null,
                specialty_id: 7,
                specialty_name: 'Pediatría',
                is_active: true,
                user_id: 42,
                user_name: 'Dr. Demo Médico',
                office: null,
            },
        ],
        availableUsers: [],
    },
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    usePage: () => page,
}));

function submittedData(visit: ReturnType<typeof vi.spyOn>) {
    expect(visit).toHaveBeenCalledTimes(1);
    return (visit.mock.calls[0][1] as { data: Record<string, unknown> }).data;
}

describe('doctores forms', () => {
    afterEach(() => vi.restoreAllMocks());

    it('sends the specialty price in cents', () => {
        const visit = vi.spyOn(router, 'visit').mockImplementation(() => {});
        render(<DoctoresIndex />);

        fireEvent.click(screen.getByText('+ Nueva especialidad'));
        fireEvent.change(screen.getByPlaceholderText('Ej: Dermatología'), {
            target: { value: 'Dermatología' },
        });
        fireEvent.change(screen.getByLabelText(/Precio de consulta/), {
            target: { value: '1500.50' },
        });
        fireEvent.click(screen.getByText('✓ Guardar'));

        expect(submittedData(visit)).toEqual({
            name: 'Dermatología',
            consultation_price: 150050,
        });
    });

    it('sends the doctor specialty as an integer and blank optionals as null', () => {
        const visit = vi.spyOn(router, 'visit').mockImplementation(() => {});
        render(<DoctoresIndex />);

        fireEvent.click(screen.getByText('+ Nuevo doctor'));
        fireEvent.change(screen.getByLabelText(/Nombre completo/), {
            target: { value: 'Dra. Ana Pérez' },
        });
        fireEvent.click(screen.getByText('✓ Guardar doctor'));

        expect(submittedData(visit)).toEqual({
            name: 'Dra. Ana Pérez',
            exequatur: null,
            phone: null,
            specialty_id: 7,
            user_id: null,
            office: null,
        });
    });

    it('shows the linked user real name in the selector when editing a doctor with user_name', () => {
        render(<DoctoresIndex />);

        // Select the specialty to show the doctors table
        const specialtyItems = screen.getAllByText('Pediatría');
        fireEvent.click(specialtyItems[0]);

        // Click the edit (✏) button for the doctor row (first ✏ in the table)
        const editButtons = screen.getAllByText('✏');
        // The first ✏ is the specialty edit button, the second is the doctor edit button
        fireEvent.click(editButtons[editButtons.length - 1]);

        // The user selector should show "Dr. Demo Médico" as an option
        const option = screen.getByRole('option', { name: 'Dr. Demo Médico' });
        expect(option).toBeDefined();
        const select = screen.getByLabelText(/Usuario del sistema/);
        expect((select as HTMLSelectElement).value).toBe('42');
    });
});
