import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const user = {
    id: 1,
    name: 'Admin Actual',
    username: 'admin',
    email: null,
    is_active: true,
    roles: ['administrador'],
    permissions: [],
    all_permissions: ['module.admin.access'],
    last_activity: null,
};

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    usePage: () => ({
        props: {
            errors: {},
            auth: { user: { id: 1 } },
            users: [user],
            roles: [],
            available_permissions: [],
        },
    }),
    // The server already answered: the edit was refused
    useForm: (initial: Record<string, unknown>) => ({
        data: initial,
        setData: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        processing: false,
        errors: {
            permissions:
                'No puedes quitarte el acceso a Administración. Pide a otro administrador que lo haga.',
            is_active:
                'No puedes desactivar tu propia cuenta. Pide a otro administrador que lo haga.',
        },
        reset: vi.fn(),
        clearErrors: vi.fn(),
    }),
}));

import AdminIndex from '@/pages/admin/index';

describe('Usuarios: errores al editar', () => {
    it('shows why the server refused the permissions and the status', () => {
        render(<AdminIndex />);
        fireEvent.click(screen.getByRole('button', { name: /Editar/ }));

        const alerts = screen.getAllByRole('alert').map((a) => a.textContent);
        expect(alerts).toContain(
            'No puedes quitarte el acceso a Administración. Pide a otro administrador que lo haga.',
        );
        expect(alerts).toContain(
            'No puedes desactivar tu propia cuenta. Pide a otro administrador que lo haga.',
        );
    });
});
