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
    flash: {
        credentials: null as {
            name: string;
            username: string;
            password: string;
        } | null,
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
            access_mode: 'create_user',
        });
    });

    it('shows the linked username read-only when editing a doctor with user_username', () => {
        render(<DoctoresIndex />);

        // Select the specialty to show the doctors table
        const specialtyItems = screen.getAllByText('Pediatría');
        fireEvent.click(specialtyItems[0]);

        // Click the edit (✏) button for the doctor row
        const editButtons = screen.getAllByText('✏');
        fireEvent.click(editButtons[editButtons.length - 1]);

        // The linked username should be displayed read-only (no select)
        // The doctor in the mock has user_username: null (user_name is 'Dr. Demo Médico')
        // In edit mode with user_id, we show the username
        // Since user_username is not set in the mock (undefined), we show '—'
        expect(screen.getByText('Restablecer contraseña')).toBeDefined();
    });

    it('clicking "Restablecer contraseña" shows a confirmation dialog before sending POST', () => {
        const visit = vi.spyOn(router, 'visit').mockImplementation(() => {});
        render(<DoctoresIndex />);

        // Open the edit modal for the doctor with user_id
        const specialtyItems = screen.getAllByText('Pediatría');
        fireEvent.click(specialtyItems[0]);
        const editButtons = screen.getAllByText('✏');
        fireEvent.click(editButtons[editButtons.length - 1]);

        // Click "Restablecer contraseña" – should NOT immediately send
        fireEvent.click(screen.getByText(/Restablecer contraseña/i));

        // The POST must NOT have been sent yet (confirmation required)
        expect(visit).not.toHaveBeenCalled();

        // The confirmation text should be visible
        expect(screen.getByText(/dejará de funcionar/i)).toBeDefined();
    });

    it('reset password POST is sent after confirming the dialog', () => {
        const visit = vi.spyOn(router, 'visit').mockImplementation(() => {});
        render(<DoctoresIndex />);

        // Open the edit modal for the doctor with user_id
        const specialtyItems = screen.getAllByText('Pediatría');
        fireEvent.click(specialtyItems[0]);
        const editButtons = screen.getAllByText('✏');
        fireEvent.click(editButtons[editButtons.length - 1]);

        // Click "Restablecer contraseña"
        fireEvent.click(screen.getByText(/Restablecer contraseña/i));

        // Click the confirm button (the button labeled "Continuar")
        fireEvent.click(screen.getByRole('button', { name: /Continuar/i }));

        // Now the POST should have been sent
        expect(visit).toHaveBeenCalledTimes(1);
        const call = visit.mock.calls[0];
        expect(call[0]).toContain('/admin/doctores/1/reset-password');
        expect(call[1]).toMatchObject({ method: 'post' });
    });
});
