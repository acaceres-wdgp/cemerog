/**
 * Characterization tests for AppLayout.
 * These describe the CURRENT behaviour before the token-migration refactor.
 * Do NOT change assertions here unless the behaviour genuinely changes.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import AppLayout from '@/layouts/app/app-layout';
import { NAV_GROUPS } from '@/lib/navigation';

// ---------------------------------------------------------------------------
// Shared page mock – mutate before each test
// ---------------------------------------------------------------------------
const page = vi.hoisted(() => ({
    url: '/inicio',
    component: 'inicio/index',
    props: {
        auth: {
            user: {
                id: 1,
                name: 'Ana Gómez',
                username: 'ana',
                email: null as string | null,
                is_active: true,
                must_change_password: false,
                roles: ['administrador'] as string[],
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
            },
        },
        permissions: [] as string[],
        sidebarOpen: true,
    },
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    usePage: () => page,
    Link: ({
        href,
        children,
        ...rest
    }: {
        href: string;
        children: React.ReactNode;
        [k: string]: unknown;
    }) => (
        <a href={href} {...rest}>
            {children}
        </a>
    ),
}));

// All permissions for admin
const ALL_PERMISSIONS = NAV_GROUPS.flatMap((g) =>
    g.items.map((i) => i.permission),
);

beforeEach(() => {
    page.url = '/inicio';
    page.component = 'inicio/index';
    page.props.auth.user.roles = ['administrador'];
    page.props.permissions = ALL_PERMISSIONS;
    // Clear sidebar cookies so each test starts from a known state
    document.cookie =
        'sidebar_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie =
        'sidebar_theme=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
});

afterEach(() => {
    cleanup();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function navLinks() {
    return screen.queryAllByRole('link');
}

function activeLinks() {
    return navLinks().filter((a) => a.getAttribute('aria-current') === 'page');
}

// ---------------------------------------------------------------------------
// Test: nav items per role
// ---------------------------------------------------------------------------
describe('nav items per role (sidebar)', () => {
    it('admin sees all nav items', () => {
        page.props.permissions = ALL_PERMISSIONS;
        render(<AppLayout>x</AppLayout>);

        // At least the first and last known items should be visible
        expect(
            screen.getByRole('link', { name: 'Inicio' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: 'Usuarios y roles' }),
        ).toBeInTheDocument();
    });

    it('caja role only sees its modules', () => {
        page.props.permissions = [
            'module.inicio.access',
            'module.tablero.access',
            'module.caja.access',
            'module.cxc.access',
            'module.cuadre.access',
            'module.impresos.access',
        ];
        render(<AppLayout>x</AppLayout>);

        // Should see these
        expect(
            screen.getByRole('link', { name: 'Facturación' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: 'Inicio' }),
        ).toBeInTheDocument();

        // Should NOT see these
        expect(
            screen.queryByRole('link', { name: 'Consulta' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('link', { name: 'Pacientes' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('link', { name: 'Laboratorio' }),
        ).not.toBeInTheDocument();
    });

    it('medico role sees clinical modules but not caja or admin', () => {
        page.props.permissions = [
            'module.inicio.access',
            'module.tablero.access',
            'module.citas.access',
            'module.consulta.access',
            'module.emergencia.access',
            'module.internamiento.access',
            'module.cirugia.access',
            'module.lab.access',
            'module.img.access',
            'module.impresos.access',
        ];
        render(<AppLayout>x</AppLayout>);

        expect(
            screen.getByRole('link', { name: 'Consulta' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: 'Emergencia' }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('link', { name: 'Facturación' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('link', { name: 'Usuarios y roles' }),
        ).not.toBeInTheDocument();
    });

    it('user with no permissions sees no nav items', () => {
        page.props.permissions = [];
        render(<AppLayout>x</AppLayout>);
        expect(navLinks()).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// Test: active nav item aria-current
// ---------------------------------------------------------------------------
describe('active nav item', () => {
    it('marks the current page with aria-current="page"', () => {
        page.url = '/inicio';
        render(<AppLayout>x</AppLayout>);
        const active = activeLinks();
        expect(active).toHaveLength(1);
        expect(active[0]).toHaveTextContent('Inicio');
    });

    it('marks the tablero item when on /tablero', () => {
        page.url = '/tablero';
        render(<AppLayout>x</AppLayout>);
        const active = activeLinks();
        expect(active).toHaveLength(1);
        expect(active[0]).toHaveTextContent('Tablero de atenciones');
    });

    it('marks the parent item as active on a sub-page', () => {
        page.url = '/citas/123';
        render(<AppLayout>x</AppLayout>);
        const active = activeLinks();
        expect(active).toHaveLength(1);
        expect(active[0]).toHaveTextContent('Citas');
    });

    it('marks nothing on a non-module URL', () => {
        page.url = '/settings/profile';
        render(<AppLayout>x</AppLayout>);
        expect(activeLinks()).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// Test: user menu contains "Cerrar sesión"
// ---------------------------------------------------------------------------
describe('user menu', () => {
    it('contains "Cerrar sesión" when opened', () => {
        render(<AppLayout>x</AppLayout>);

        // Button accessible by user name (or generic button for user menu)
        const userBtn = screen.getByRole('button', { name: /Ana Gómez/i });
        fireEvent.click(userBtn);

        expect(
            screen.getByRole('button', { name: /Cerrar sesión/i }),
        ).toBeInTheDocument();
    });

    it('shows username in the user menu header', () => {
        render(<AppLayout>x</AppLayout>);
        fireEvent.click(screen.getByRole('button', { name: /Ana Gómez/i }));
        expect(screen.getByText('@ana')).toBeInTheDocument();
    });

    it('shows user roles in the user menu', () => {
        render(<AppLayout>x</AppLayout>);
        fireEvent.click(screen.getByRole('button', { name: /Ana Gómez/i }));
        // Role is shown in the dropdown
        expect(screen.getByText(/administrador/i)).toBeInTheDocument();
    });
});

// ---------------------------------------------------------------------------
// Test: sidebar theme data attribute
// ---------------------------------------------------------------------------
describe('sidebar theme', () => {
    it('applies data-sidebar-theme="carbon" by default', () => {
        // Reset cookie so default is used
        render(<AppLayout>x</AppLayout>);
        const sidebar = document.querySelector('[data-sidebar-theme]');
        expect(sidebar).not.toBeNull();
        // Default theme is 'carbon' (cookie absent or set to carbon)
        expect(sidebar?.getAttribute('data-sidebar-theme')).toBe('carbon');
    });
});

// ---------------------------------------------------------------------------
// Test: collapse / expand sidebar
// ---------------------------------------------------------------------------
describe('sidebar collapse / expand', () => {
    it('collapses the sidebar when the collapse button is clicked', () => {
        render(<AppLayout>x</AppLayout>);
        const collapseBtn = screen.getByRole('button', {
            name: /Colapsar menú/i,
        });
        expect(collapseBtn).toBeInTheDocument();
        fireEvent.click(collapseBtn);

        // After collapsing, expand button should appear
        expect(
            screen.getByRole('button', { name: /Expandir menú/i }),
        ).toBeInTheDocument();
    });

    it('expands the sidebar when the expand button is clicked after collapse', () => {
        render(<AppLayout>x</AppLayout>);
        fireEvent.click(
            screen.getByRole('button', { name: /Colapsar menú/i }),
        );
        fireEvent.click(
            screen.getByRole('button', { name: /Expandir menú/i }),
        );
        // Back to expanded – collapse button visible again
        expect(
            screen.getByRole('button', { name: /Colapsar menú/i }),
        ).toBeInTheDocument();
    });

    it('hides section labels when collapsed', () => {
        render(<AppLayout>x</AppLayout>);
        // Section labels visible when expanded
        const generalLabel = screen.getByText('General', { exact: true, selector: 'p' });
        expect(generalLabel).toBeInTheDocument();
        fireEvent.click(
            screen.getByRole('button', { name: /Colapsar menú/i }),
        );
        // Section labels hidden when collapsed
        expect(screen.queryByText('General', { exact: true, selector: 'p' })).not.toBeInTheDocument();
    });
});

// ---------------------------------------------------------------------------
// Test: children rendered in main
// ---------------------------------------------------------------------------
describe('layout renders children', () => {
    it('renders children inside the main content area', () => {
        render(<AppLayout>contenido único</AppLayout>);
        expect(screen.getByText('contenido único')).toBeInTheDocument();
    });
});
