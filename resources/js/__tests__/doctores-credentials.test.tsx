import { afterEach, describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { router } from '@inertiajs/react';
import DoctoresIndex from '@/pages/doctores/index';

// Base page mock – will be customized per test via `page.props`
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
        doctors: [] as {
            id: number;
            name: string;
            exequatur: string | null;
            phone: string | null;
            specialty_id: number;
            specialty_name: string;
            is_active: boolean;
            user_id: number | null;
            user_name: string | null;
            user_username: string | null;
            office: string | null;
        }[],
        availableUsers: [{ id: 10, name: 'Usuario Libre', username: 'ulibre' }],
        // credentials flash from server (single-use)
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

describe('doctores credentials dialog', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        page.props.credentials = null;
        page.props.doctors = [];
    });

    it('shows credentials dialog with username and password when credentials flash is present', () => {
        page.props.credentials = {
            name: 'Dr. Franklin Rodríguez',
            username: 'frodriguez',
            password: 'xK3mPq8nRt',
        };

        render(<DoctoresIndex />);

        expect(screen.getByText('frodriguez')).toBeDefined();
        expect(screen.getByText('xK3mPq8nRt')).toBeDefined();
    });

    it('credentials dialog has Copiar button', () => {
        page.props.credentials = {
            name: 'Dr. Franklin Rodríguez',
            username: 'frodriguez',
            password: 'xK3mPq8nRt',
        };

        render(<DoctoresIndex />);

        expect(screen.getByText(/Copiar/i)).toBeDefined();
    });

    it('credentials dialog has Imprimir button', () => {
        page.props.credentials = {
            name: 'Dr. Franklin Rodríguez',
            username: 'frodriguez',
            password: 'xK3mPq8nRt',
        };

        render(<DoctoresIndex />);

        expect(screen.getByText(/Imprimir/i)).toBeDefined();
    });

    it('credentials dialog warns about single-use', () => {
        page.props.credentials = {
            name: 'Dr. Franklin Rodríguez',
            username: 'frodriguez',
            password: 'xK3mPq8nRt',
        };

        render(<DoctoresIndex />);

        expect(screen.getByText(/no se volverán a mostrar/i)).toBeDefined();
    });

    it('no credentials dialog when credentials prop is null', () => {
        page.props.credentials = null;

        render(<DoctoresIndex />);

        expect(screen.queryByText('frodriguez')).toBeNull();
    });
});

describe('doctor form access mode selector', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        page.props.credentials = null;
        page.props.doctors = [];
    });

    it('shows "Crear usuario nuevo" option in new doctor form', () => {
        render(<DoctoresIndex />);
        fireEvent.click(screen.getByText('+ Nuevo doctor'));

        expect(screen.getByText(/Crear usuario nuevo/i)).toBeDefined();
    });

    it('shows "Vincular usuario existente" option in new doctor form', () => {
        render(<DoctoresIndex />);
        fireEvent.click(screen.getByText('+ Nuevo doctor'));

        expect(screen.getByText(/Vincular usuario existente/i)).toBeDefined();
    });

    it('shows user selector when "Vincular usuario existente" is selected', () => {
        render(<DoctoresIndex />);
        fireEvent.click(screen.getByText('+ Nuevo doctor'));

        const linkOption = screen.getByLabelText(/Vincular usuario existente/i);
        fireEvent.click(linkOption);

        // Should show "Usuario Libre" from availableUsers
        expect(screen.getByText('Usuario Libre')).toBeDefined();
    });

    it('sends access_mode=create_user when "Crear usuario nuevo" is selected', () => {
        const visit = vi.spyOn(router, 'visit').mockImplementation(() => {});
        render(<DoctoresIndex />);
        fireEvent.click(screen.getByText('+ Nuevo doctor'));

        // Fill in the name
        fireEvent.change(screen.getByLabelText(/Nombre completo/i), {
            target: { value: 'Dr. Franklin Rodríguez' },
        });

        // "Crear usuario nuevo" should be selected by default
        fireEvent.click(screen.getByText('✓ Guardar doctor'));

        const data = (
            visit.mock.calls[0][1] as { data: Record<string, unknown> }
        ).data;
        expect(data['access_mode']).toBe('create_user');
    });

    it('sends access_mode=link_user and user_id when linking', () => {
        const visit = vi.spyOn(router, 'visit').mockImplementation(() => {});
        render(<DoctoresIndex />);
        fireEvent.click(screen.getByText('+ Nuevo doctor'));

        // Fill in the name
        fireEvent.change(screen.getByLabelText(/Nombre completo/i), {
            target: { value: 'Dr. Franklin Rodríguez' },
        });

        // Select "Vincular usuario existente"
        const linkOption = screen.getByLabelText(/Vincular usuario existente/i);
        fireEvent.click(linkOption);

        // Pick a user from the selector
        const select = screen.getByLabelText(/Usuario a vincular/i);
        fireEvent.change(select, { target: { value: '10' } });

        fireEvent.click(screen.getByText('✓ Guardar doctor'));

        const data = (
            visit.mock.calls[0][1] as { data: Record<string, unknown> }
        ).data;
        expect(data['access_mode']).toBe('link_user');
        expect(data['user_id']).toBe(10);
    });

    it('shows username read-only when editing doctor with linked user', () => {
        page.props.doctors = [
            {
                id: 1,
                name: 'Dr. Demo',
                exequatur: null,
                phone: null,
                specialty_id: 7,
                specialty_name: 'Pediatría',
                is_active: true,
                user_id: 42,
                user_name: 'Dr. Demo',
                user_username: 'demo',
                office: null,
            },
        ];

        render(<DoctoresIndex />);
        fireEvent.click(screen.getAllByText('Pediatría')[0]);

        const editButtons = screen.getAllByText('✏');
        fireEvent.click(editButtons[editButtons.length - 1]);

        expect(screen.getByText('demo')).toBeDefined();
        expect(screen.getByText(/Restablecer contraseña/i)).toBeDefined();
    });
});
