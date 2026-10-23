import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import AppLayout from '@/layouts/app/app-layout';

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    usePage: () => ({
        component: 'inicio/index',
        props: {
            auth: {
                user: { name: 'Ana Gómez', username: 'ana', roles: ['caja'] },
            },
            permissions: ['module.inicio.access'],
        },
    }),
}));

describe('user menu', () => {
    it('offers logout but not password change', () => {
        render(<AppLayout>contenido</AppLayout>);

        fireEvent.click(screen.getByRole('button', { name: /Ana Gómez/ }));

        expect(
            screen.getByRole('button', { name: /Cerrar sesión/ }),
        ).toBeInTheDocument();
        expect(
            screen.queryByText('Cambiar contraseña'),
        ).not.toBeInTheDocument();
    });
});
