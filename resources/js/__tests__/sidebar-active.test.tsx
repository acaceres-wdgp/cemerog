import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AppLayout from '@/layouts/app/app-layout';
import { NAV_GROUPS } from '@/lib/navigation';

const page = vi.hoisted(() => ({
    url: '/inicio',
    component: 'inicio/index',
    props: {
        auth: {
            user: {
                name: 'Ana Gómez',
                username: 'ana',
                roles: ['administrador'],
            },
        },
        permissions: [] as string[],
    },
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    usePage: () => page,
}));

page.props.permissions = NAV_GROUPS.flatMap((g) =>
    g.items.map((i) => i.permission),
);

function activeItems(url: string, component: string): string[] {
    page.url = url;
    page.component = component;
    render(<AppLayout>contenido</AppLayout>);

    return screen
        .queryAllByRole('link')
        .filter((a) => a.getAttribute('aria-current') === 'page')
        .map((a) => a.textContent?.trim() ?? '');
}

describe('sidebar active item', () => {
    it('marks only catalogo de imagenes on its page', () => {
        expect(activeItems('/admin/imagenes-catalogo', 'imgcat/index')).toEqual(
            ['Catálogo de imágenes'],
        );
    });

    it('marks only imagenes on its page', () => {
        expect(activeItems('/imagenes', 'img/index')).toEqual(['Imágenes']);
    });

    it('keeps the module active on its sub-pages', () => {
        expect(activeItems('/citas/123', 'citas/show')).toEqual(['Citas']);
    });

    it('marks nothing on settings pages', () => {
        expect(activeItems('/settings/profile', 'settings/profile')).toEqual(
            [],
        );
    });
});
