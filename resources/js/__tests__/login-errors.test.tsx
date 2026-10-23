import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Login from '@/pages/auth/login';

// jsdom lacks ResizeObserver, used by the Radix checkbox
globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

const page = vi.hoisted(() => ({
    props: { errors: {} as Record<string, string> },
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    usePage: () => page,
}));

describe('login page', () => {
    it('shows an error flashed by a redirect', () => {
        page.props.errors = {
            username: 'Tu cuenta está desactivada. Contacta al administrador.',
        };
        render(<Login />);

        expect(screen.getByRole('alert')).toHaveTextContent(
            'Tu cuenta está desactivada. Contacta al administrador.',
        );
    });

    it('shows no error on a normal visit', () => {
        page.props.errors = {};
        render(<Login />);

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
});
