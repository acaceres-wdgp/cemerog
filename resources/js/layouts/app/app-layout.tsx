/**
 * AppLayout – main application shell with collapsible sidebar and topbar.
 * Sidebar theme and collapsed state are persisted in cookies (sidebar_theme,
 * sidebar_state). The server reads them and shares sidebarTheme/sidebarOpen, so
 * the initial state is the same in the server render and in the browser.
 */

import { ReactNode, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { logout } from '@/routes';
import type { PageProps } from '@/types/global';
import { NAV_GROUPS, type NavItem } from '@/lib/navigation';
import { resolveBreadcrumb } from '@/lib/breadcrumb';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { Sidebar, type SidebarTheme } from './components/Sidebar';
import { Topbar } from './components/Topbar';

function setCookie(name: string, value: string, days = 365) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

interface AppLayoutProps {
    children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const { auth, sidebarOpen, sidebarTheme } = usePage<PageProps>().props;
    const user = auth?.user;

    const [collapsed, setCollapsed] = useState<boolean>(
        () => sidebarOpen === false,
    );
    const [theme, setTheme] = useState<SidebarTheme>(
        () => sidebarTheme ?? 'carbon',
    );

    const [showThemePicker, setShowThemePicker] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const toggleCollapse = () => {
        const next = !collapsed;
        setCollapsed(next);
        setCookie('sidebar_state', next ? 'collapsed' : 'expanded');
    };

    const changeTheme = (t: SidebarTheme) => {
        setTheme(t);
        setCookie('sidebar_theme', t);
        setShowThemePicker(false);
    };

    const { currentUrl, isCurrentUrl } = useCurrentUrl();

    // Compute breadcrumb: for /registro, add 3rd level from page props + URL
    const basePath = currentUrl.split('?')[0];
    const pageProps = usePage().props as unknown as { patient?: unknown };
    const registroBreadcrumbFallback =
        basePath === '/registro'
            ? {
                  section: 'Recepción',
                  page: 'Pacientes',
                  subPage:
                      pageProps.patient != null
                          ? 'Nueva atención'
                          : 'Nuevo paciente',
              }
            : undefined;
    const profileBreadcrumbFallback = /^\/pacientes\/\d+$/.test(basePath)
        ? { subPage: 'Perfil del paciente' }
        : undefined;
    const breadcrumb = resolveBreadcrumb(
        basePath,
        NAV_GROUPS,
        registroBreadcrumbFallback ?? profileBreadcrumbFallback,
    );

    // Longest matching path wins, so /almacen/proveedores doesn't also mark /almacen
    const matchLength = (item: NavItem) =>
        [item.href, ...(item.activeFor ?? [])]
            .filter(
                (path) =>
                    isCurrentUrl(path) || currentUrl.startsWith(`${path}/`),
            )
            .reduce((longest, path) => Math.max(longest, path.length), -1);
    const bestMatchLength = Math.max(
        -1,
        ...NAV_GROUPS.flatMap((group) => group.items).map(matchLength),
    );
    const isActiveItem = (item: NavItem) =>
        bestMatchLength >= 0 && matchLength(item) === bestMatchLength;

    const handleLogout = () => {
        router.post(logout.url());
    };

    return (
        <div className="flex h-screen overflow-hidden bg-app-bg">
            {/* ── Sidebar ───────────────────────────────────── */}
            <Sidebar
                collapsed={collapsed}
                theme={theme}
                showThemePicker={showThemePicker}
                onToggleCollapse={toggleCollapse}
                onChangeTheme={changeTheme}
                onToggleThemePicker={() => setShowThemePicker((v) => !v)}
                currentUrl={currentUrl}
                isActiveItem={isActiveItem}
            />

            {/* ── Main content ─────────────────────────────── */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Topbar */}
                <Topbar
                    breadcrumb={breadcrumb}
                    userMenuProps={{
                        name: user?.name ?? '',
                        username: user?.username ?? '',
                        roles: user?.roles ?? [],
                        showUserMenu,
                        onToggle: () => setShowUserMenu((v) => !v),
                        onClose: () => setShowUserMenu(false),
                        onLogout: handleLogout,
                    }}
                />

                {/* Page content */}
                <main className="flex-1 overflow-y-auto px-8 pt-7 pb-12">
                    {children}
                </main>
            </div>
        </div>
    );
}
