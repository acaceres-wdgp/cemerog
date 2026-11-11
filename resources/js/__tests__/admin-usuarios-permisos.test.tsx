import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const props = {
    errors: {},
    // The signed-in admin is user 1
    auth: { user: { id: 1 } },
    users: [
        {
            id: 1,
            name: 'Admin Actual',
            username: 'admin',
            email: null,
            is_active: true,
            roles: ['administrador'],
            permissions: [],
            all_permissions: [],
            last_activity: null,
        },
        {
            id: 7,
            name: 'Ana Secretaria',
            username: 'ana',
            email: null,
            is_active: true,
            roles: ['secretaria'],
            // Only the extras are stored as direct permissions
            permissions: ['module.habs.access'],
            all_permissions: [
                'module.inicio.access',
                'module.registro.access',
                'module.habs.access',
            ],
            last_activity: null,
        },
    ],
    roles: [
        {
            name: 'secretaria',
            label: 'Secretaria',
            permissions: ['module.inicio.access', 'module.registro.access'],
        },
    ],
    available_permissions: [
        { name: 'module.inicio.access', label: 'Inicio', module: 'inicio' },
        {
            name: 'module.registro.access',
            label: 'Registrar pacientes',
            module: 'registro',
        },
        { name: 'module.habs.access', label: 'Habitaciones', module: 'habs' },
        { name: 'module.caja.access', label: 'Facturación', module: 'caja' },
    ],
};

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    usePage: () => ({ props }),
}));

import AdminIndex from '@/pages/admin/index';

describe('Usuarios: permisos al editar', () => {
    it('checks the permissions the user gets from the role, not only the direct ones', () => {
        render(<AdminIndex />);

        fireEvent.click(screen.getAllByRole('button', { name: /Editar/ })[1]);

        const checkbox = (name: string) =>
            screen.getByRole('checkbox', { name }) as HTMLInputElement;
        expect(checkbox('Inicio').checked).toBe(true);
        expect(checkbox('Registrar pacientes').checked).toBe(true);
        expect(checkbox('Habitaciones').checked).toBe(true);
        expect(checkbox('Facturación').checked).toBe(false);
    });

    it('does not offer to deactivate your own account', () => {
        render(<AdminIndex />);

        const row = (name: string) => screen.getByText(name).closest('tr')!;
        expect(
            within(row('Admin Actual')).queryByRole('button', {
                name: /Desactivar/,
            }),
        ).toBeNull();
        expect(within(row('Admin Actual')).getByText('Tu cuenta')).toBeTruthy();
        expect(
            within(row('Ana Secretaria')).getByRole('button', {
                name: /Desactivar/,
            }),
        ).toBeTruthy();
    });
});
