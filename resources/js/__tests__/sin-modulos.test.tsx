import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import SinModulos from '@/pages/sin-modulos/index';

const mocks = vi.hoisted(() => ({ routerPost: vi.fn() }));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    router: { post: mocks.routerPost },
}));

describe('no-modules page', () => {
    it('tells the user to contact the administrator', () => {
        render(<SinModulos />);
        expect(
            screen.getByText('No tienes módulos asignados'),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Contacta al administrador/),
        ).toBeInTheDocument();
    });

    it('lets the user log out', () => {
        render(<SinModulos />);
        fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
        expect(mocks.routerPost).toHaveBeenCalledWith('/logout');
    });
});
