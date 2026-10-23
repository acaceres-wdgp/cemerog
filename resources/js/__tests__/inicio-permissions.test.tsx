import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import InicioIndex from '@/pages/inicio/index';

const page = vi.hoisted(() => ({ props: { permissions: [] as string[] } }));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    usePage: () => page,
}));

const modules = (...keys: string[]) =>
    keys.map((key) => `module.${key}.access`);

function linkHrefs(): string[] {
    return screen.queryAllByRole('link').map((a) => a.getAttribute('href')!);
}

describe('inicio links respect permissions', () => {
    beforeEach(() => {
        page.props.permissions = [];
    });

    it('caja role only sees modules it can open', () => {
        page.props.permissions = modules(
            'inicio',
            'tablero',
            'caja',
            'cxc',
            'cuadre',
            'impresos',
        );
        render(<InicioIndex />);

        expect(
            screen.getByRole('link', { name: /Ver tablero/ }),
        ).toHaveAttribute('href', '/tablero');
        expect(
            screen.queryByRole('link', { name: /Ver agenda/ }),
        ).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Caja' })).toHaveAttribute(
            'href',
            '/facturacion',
        );
        expect(
            screen.queryByRole('link', { name: 'Nueva atención' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('link', { name: 'Laboratorio' }),
        ).not.toBeInTheDocument();
    });

    it('secretaria role does not see caja or laboratorio', () => {
        page.props.permissions = modules(
            'inicio',
            'tablero',
            'registro',
            'citas',
            'impresos',
        );
        render(<InicioIndex />);

        expect(linkHrefs()).not.toContain('/facturacion');
        expect(linkHrefs()).not.toContain('/laboratorio');
        expect(
            screen.getByRole('link', { name: /Ver agenda/ }),
        ).toHaveAttribute('href', '/citas');
        expect(
            screen.getByRole('link', { name: 'Nueva atención' }),
        ).toHaveAttribute('href', '/registro');
    });

    it('user with only inicio sees no module links', () => {
        page.props.permissions = modules('inicio');
        render(<InicioIndex />);

        expect(linkHrefs()).toEqual([]);
    });

    it('administrator sees every link', () => {
        page.props.permissions = modules(
            'inicio',
            'tablero',
            'registro',
            'citas',
            'caja',
            'lab',
        );
        render(<InicioIndex />);

        expect(linkHrefs().sort()).toEqual([
            '/citas',
            '/facturacion',
            '/laboratorio',
            '/registro',
            '/tablero',
            '/tablero',
        ]);
    });
});
