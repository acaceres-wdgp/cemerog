import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const props = {
    errors: {},
    users: [
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

        fireEvent.click(screen.getByRole('button', { name: /Editar/ }));

        const checkbox = (name: string) =>
            screen.getByRole('checkbox', { name }) as HTMLInputElement;
        expect(checkbox('Inicio').checked).toBe(true);
        expect(checkbox('Registrar pacientes').checked).toBe(true);
        expect(checkbox('Habitaciones').checked).toBe(true);
        expect(checkbox('Facturación').checked).toBe(false);
    });
});
