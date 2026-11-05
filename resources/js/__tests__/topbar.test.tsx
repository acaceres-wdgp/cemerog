/**
 * Topbar feature tests: patient search, clock, user info.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
} from '@testing-library/react';
import AppLayout from '@/layouts/app/app-layout';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const page = vi.hoisted(() => ({
    url: '/inicio',
    component: 'inicio/index',
    props: {
        auth: {
            user: {
                id: 1,
                name: 'Franklin Rodríguez',
                username: 'dr.franklin',
                email: null as string | null,
                is_active: true,
                must_change_password: false,
                roles: ['medico'] as string[],
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
            },
        },
        permissions: ['module.inicio.access'],
        sidebarOpen: true,
        doctor: null as { id: number; name: string; office: string } | null,
    },
}));

const mocks = vi.hoisted(() => ({
    routerVisit: vi.fn(),
    routerPost: vi.fn(),
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    usePage: () => page,
    router: { visit: mocks.routerVisit, post: mocks.routerPost },
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

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
    page.url = '/inicio';
    page.props.permissions = ['module.inicio.access'];
    page.props.auth.user.name = 'Franklin Rodríguez';
    page.props.auth.user.username = 'dr.franklin';
    page.props.auth.user.roles = ['medico'];
    page.props.doctor = null;
    document.cookie =
        'sidebar_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie =
        'sidebar_theme=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    mocks.routerVisit.mockClear();
});

afterEach(() => {
    cleanup();
});

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

describe('topbar search', () => {
    const LABEL = 'Buscar paciente por nombre, cédula o teléfono';
    const withSearch = () => {
        page.props.permissions = [
            'module.inicio.access',
            'module.pacientes.access',
        ];
    };
    const searchButton = () => screen.getByRole('button', { name: LABEL });
    const mockResults = () => {
        global.fetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            json: async () => [
                { id: 42, full_name: 'Ana Díaz', document_number: '001' },
            ],
        });
    };

    it('no muestra la búsqueda a usuarios sin module.pacientes.access', () => {
        render(<AppLayout>x</AppLayout>);
        expect(
            screen.queryByRole('button', { name: LABEL }),
        ).not.toBeInTheDocument();
    });

    it('muestra solo un botón con lupa, sin campo de texto', () => {
        withSearch();
        render(<AppLayout>x</AppLayout>);
        expect(searchButton()).toBeVisible();
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('muestra un tooltip con el texto de ayuda', async () => {
        withSearch();
        render(<AppLayout>x</AppLayout>);
        fireEvent.focus(searchButton());
        expect(await screen.findByRole('tooltip')).toHaveTextContent(LABEL);
    });

    it('abre el campo de búsqueda con foco al hacer clic', () => {
        withSearch();
        render(<AppLayout>x</AppLayout>);
        fireEvent.click(searchButton());
        expect(screen.getByRole('textbox', { name: LABEL })).toHaveFocus();
        expect(searchButton()).toHaveAttribute('aria-expanded', 'true');
    });

    it('cierra el campo con Escape', () => {
        withSearch();
        render(<AppLayout>x</AppLayout>);
        fireEvent.click(searchButton());
        fireEvent.keyDown(screen.getByRole('textbox', { name: LABEL }), {
            key: 'Escape',
        });
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('navega al paciente y cierra la búsqueda sin dejarlo seleccionado', async () => {
        withSearch();
        mockResults();
        render(<AppLayout>x</AppLayout>);

        fireEvent.click(searchButton());
        fireEvent.change(screen.getByRole('textbox', { name: LABEL }), {
            target: { value: 'Ana' },
        });
        fireEvent.click(
            await screen.findByRole('button', { name: /Ana Díaz/ }),
        );

        expect(mocks.routerVisit).toHaveBeenCalledWith(
            '/pacientes?paciente=42',
        );
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        expect(screen.queryByText('Ana Díaz')).not.toBeInTheDocument();

        // Reopening starts empty
        fireEvent.click(searchButton());
        expect(screen.getByRole('textbox', { name: LABEL })).toHaveValue('');
    });
});

// ---------------------------------------------------------------------------
// Clock
// ---------------------------------------------------------------------------

describe('topbar clock', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows a time in the topbar', () => {
        vi.setSystemTime(new Date('2026-10-25T09:14:00'));
        render(<AppLayout>x</AppLayout>);
        // Time should appear somewhere in the topbar
        // Regex matches patterns like "9:14 a. m." or "09:14"
        const timeEl = screen.getByTestId('topbar-clock');
        expect(timeEl).toBeInTheDocument();
        expect(timeEl.textContent).toMatch(/\d+[:h]\d+/);
    });

    it('shows the date in the topbar', () => {
        vi.setSystemTime(new Date('2026-10-25T09:14:00'));
        render(<AppLayout>x</AppLayout>);
        const dateEl = screen.getByTestId('topbar-date');
        expect(dateEl).toHaveTextContent('dom 25/10/2026');
    });

    it('does not repeat the date in the breadcrumb', () => {
        vi.setSystemTime(new Date('2026-10-25T09:14:00'));
        render(<AppLayout>x</AppLayout>);
        const breadcrumb = screen
            .getByText('General', { selector: 'span' })
            .closest('div');
        expect(breadcrumb).not.toHaveTextContent(/2026/);
    });

    it('moves to the next day after midnight', () => {
        vi.setSystemTime(new Date('2026-10-25T23:59:30'));
        render(<AppLayout>x</AppLayout>);

        act(() => {
            vi.advanceTimersByTime(61_000);
        });

        expect(screen.getByTestId('topbar-date')).toHaveTextContent(
            'lun 26/10/2026',
        );
    });

    it('updates the clock after 1 minute', () => {
        vi.setSystemTime(new Date('2026-10-25T09:14:00'));
        render(<AppLayout>x</AppLayout>);

        const clockEl = screen.getByTestId('topbar-clock');
        const before = clockEl.textContent;

        act(() => {
            // Advance 61 seconds
            vi.advanceTimersByTime(61_000);
        });

        const after = clockEl.textContent;
        expect(after).not.toBe(before);
    });
});

// ---------------------------------------------------------------------------
// User info
// ---------------------------------------------------------------------------

describe('topbar user info', () => {
    it('shows avatar with two-letter initials', () => {
        render(<AppLayout>x</AppLayout>);
        // Avatar has initials FR (Franklin Rodríguez)
        const avatar = screen.getByTestId('user-avatar');
        expect(avatar.textContent).toBe('FR');
    });

    it('shows full name in the user button', () => {
        render(<AppLayout>x</AppLayout>);
        // Name appears in the user button area
        expect(screen.getByText('Franklin Rodríguez')).toBeInTheDocument();
    });

    it('shows role label next to name', () => {
        render(<AppLayout>x</AppLayout>);
        // Role label contains the role name
        const roleLabel = screen.getByTestId('user-role');
        expect(roleLabel.textContent?.toLowerCase()).toMatch(/médico|medico/i);
    });
});
