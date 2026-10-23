import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Profile from '@/pages/settings/profile';

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    usePage: () => ({
        url: '/settings/profile',
        props: {
            auth: {
                user: { name: 'Ana Gómez', username: 'ana', roles: ['caja'] },
            },
            errors: {},
        },
    }),
}));

describe('profile settings page', () => {
    it('lets the user edit their name', () => {
        render(<Profile />);

        expect(screen.getByLabelText('Nombre')).toHaveValue('Ana Gómez');
        expect(
            screen.getByRole('button', { name: 'Guardar' }),
        ).toBeInTheDocument();
    });

    it('does not offer deleting the account', () => {
        render(<Profile />);

        expect(
            screen.queryAllByText(
                /delete account|eliminar cuenta|borrar cuenta/i,
            ),
        ).toHaveLength(0);
    });
});
