/**
 * AppLayout – main application shell with collapsible sidebar and topbar.
 * Sidebar theme is persisted in a cookie (sidebar_theme).
 * Collapsed state is persisted in cookie (sidebar_state).
 */

import { ReactNode, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { logout } from '@/routes';
import {
    House,
    LayoutDashboard,
    UserPlus,
    CalendarDays,
    Stethoscope,
    Siren,
    BedDouble,
    Scissors,
    FlaskConical,
    ScanLine,
    Printer,
    Wallet,
    Receipt,
    Coins,
    Package,
    PackagePlus,
    Users,
    Tag,
    Palette,
    Contact,
    ChevronLeft,
    ChevronRight,
    Bell,
    Search,
    LogOut,
} from 'lucide-react';
import type { PageProps } from '@/types/global';
import { NAV_GROUPS, type NavItem } from '@/lib/navigation';
import { resolveBreadcrumb, formatTopbarDate } from '@/lib/breadcrumb';
import { useCurrentUrl } from '@/hooks/use-current-url';

// Icon registry
const ICONS: Record<string, React.ElementType> = {
    House,
    LayoutDashboard,
    UserPlus,
    CalendarDays,
    Stethoscope,
    Siren,
    BedDouble,
    Scissors,
    FlaskConical,
    ScanLine,
    Printer,
    Wallet,
    Receipt,
    Coins,
    Package,
    PackagePlus,
    Users,
    Tag,
    Palette,
    Contact,
};

type SidebarTheme = 'carbon' | 'slate' | 'forest';

const THEME_COLORS: Record<SidebarTheme, { bg: string; label: string }> = {
    carbon: { bg: '#2A2E2C', label: 'Carbón' },
    slate: { bg: '#1F2B33', label: 'Pizarra' },
    forest: { bg: '#173F26', label: 'Verde bosque' },
};

function getCookie(name: string): string | null {
    const match = document.cookie.match(
        new RegExp('(^| )' + name + '=([^;]+)'),
    );
    return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days = 365) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

interface AppLayoutProps {
    children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const { auth } = usePage<PageProps>().props;
    const user = auth?.user;

    const [collapsed, setCollapsed] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return getCookie('sidebar_state') === 'collapsed';
        }
        return false;
    });

    const [theme, setTheme] = useState<SidebarTheme>(() => {
        if (typeof window !== 'undefined') {
            const saved = getCookie('sidebar_theme');
            if (saved === 'slate' || saved === 'forest' || saved === 'carbon')
                return saved;
        }
        return 'carbon';
    });

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

    // A nav item is active on its own URL, sub-pages, and any paths in activeFor
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
    const breadcrumb = resolveBreadcrumb(
        basePath,
        NAV_GROUPS,
        registroBreadcrumbFallback,
    );
    const todayLabel = formatTopbarDate(new Date());
    const isActiveItem = (item: NavItem) =>
        isCurrentUrl(item.href) ||
        currentUrl.startsWith(`${item.href}/`) ||
        (item.activeFor?.some(
            (path) => currentUrl === path || currentUrl.startsWith(`${path}/`),
        ) ??
            false);

    const permissions: string[] =
        (usePage<PageProps>().props as unknown as { permissions?: string[] })
            .permissions ?? [];

    const handleLogout = () => {
        router.post(logout.url());
    };

    const sidebarBg = THEME_COLORS[theme].bg;

    return (
        <div className="flex h-screen overflow-hidden bg-[#F3F7F2]">
            {/* ── Sidebar ───────────────────────────────────── */}
            <aside
                className="flex shrink-0 flex-col transition-all duration-300 ease-in-out"
                style={{
                    width: collapsed ? '64px' : '240px',
                    backgroundColor: sidebarBg,
                }}
                data-sidebar-theme={theme}
            >
                {/* Logo */}
                <div
                    className="flex items-center gap-3 border-b px-4 py-4"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                >
                    <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                        style={{ backgroundColor: '#8CC63F', color: '#1f2d22' }}
                    >
                        CG
                    </div>
                    {!collapsed && (
                        <div className="min-w-0">
                            <p className="text-sm leading-tight font-bold text-white">
                                CEMEROG
                            </p>
                            <p
                                className="truncate text-xs"
                                style={{ color: 'rgba(255,255,255,0.55)' }}
                            >
                                Dres. Rodríguez &amp; Guzmán
                            </p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 scrollbar-none overflow-y-auto py-3">
                    {NAV_GROUPS.map((group) => {
                        const visibleItems = group.items.filter((item) =>
                            permissions.includes(item.permission),
                        );
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={group.section} className="mb-1">
                                {!collapsed && (
                                    <p
                                        className="px-4 py-1 text-[10px] font-semibold tracking-widest uppercase"
                                        style={{
                                            color: 'rgba(255,255,255,0.35)',
                                        }}
                                    >
                                        {group.section}
                                    </p>
                                )}
                                {visibleItems.map((item) => {
                                    const Icon = ICONS[item.icon] ?? House;
                                    const isActive = isActiveItem(item);
                                    return (
                                        <Link
                                            key={item.key}
                                            href={item.href}
                                            className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                                                isActive
                                                    ? 'text-white'
                                                    : 'text-white/60 hover:text-white/90'
                                            }`}
                                            style={
                                                isActive
                                                    ? {
                                                          backgroundColor:
                                                              'rgba(255,255,255,0.12)',
                                                      }
                                                    : undefined
                                            }
                                            title={
                                                collapsed
                                                    ? item.label
                                                    : undefined
                                            }
                                            aria-current={
                                                isActive ? 'page' : undefined
                                            }
                                        >
                                            <Icon
                                                className="h-4 w-4 shrink-0"
                                                style={{
                                                    color: isActive
                                                        ? '#8CC63F'
                                                        : 'inherit',
                                                }}
                                                aria-hidden="true"
                                            />
                                            {!collapsed && (
                                                <span className="truncate">
                                                    {item.label}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        );
                    })}
                </nav>

                {/* Footer – theme picker + collapse toggle */}
                <div
                    className="border-t px-3 py-3"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                >
                    {/* Theme picker trigger */}
                    {!collapsed && (
                        <div className="relative mb-2">
                            <button
                                onClick={() => setShowThemePicker((v) => !v)}
                                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-white/50 transition-colors hover:text-white/80"
                            >
                                <div
                                    className="h-3 w-3 rounded-full border border-white/30"
                                    style={{ backgroundColor: sidebarBg }}
                                />
                                Tema: {THEME_COLORS[theme].label}
                            </button>
                            {showThemePicker && (
                                <div
                                    className="absolute bottom-full left-0 mb-1 rounded-lg border border-white/10 p-2 shadow-xl"
                                    style={{
                                        backgroundColor: '#1a1f1d',
                                        minWidth: '160px',
                                    }}
                                >
                                    {(
                                        Object.entries(THEME_COLORS) as [
                                            SidebarTheme,
                                            { bg: string; label: string },
                                        ][]
                                    ).map(([key, val]) => (
                                        <button
                                            key={key}
                                            onClick={() => changeTheme(key)}
                                            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                                        >
                                            <div
                                                className="h-3 w-3 rounded-full border border-white/30"
                                                style={{
                                                    backgroundColor: val.bg,
                                                }}
                                            />
                                            {val.label}
                                            {theme === key && (
                                                <span className="ml-auto text-[#8CC63F]">
                                                    ✓
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={toggleCollapse}
                        className="flex w-full items-center justify-center rounded p-1.5 text-white/50 transition-colors hover:text-white/80"
                        aria-label={
                            collapsed ? 'Expandir menú' : 'Colapsar menú'
                        }
                    >
                        {collapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <ChevronLeft className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </aside>

            {/* ── Main content ─────────────────────────────── */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Topbar */}
                <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#e3e9e3] bg-white px-4 shadow-sm">
                    {/* Left: breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-[#71717a]">
                        {breadcrumb ? (
                            <>
                                <span>{breadcrumb.section}</span>
                                <span aria-hidden="true">›</span>
                                {breadcrumb.subPage ? (
                                    <>
                                        <span>{breadcrumb.page}</span>
                                        <span aria-hidden="true">›</span>
                                        <span className="font-medium text-[#1f2d22]">
                                            {breadcrumb.subPage}
                                        </span>
                                    </>
                                ) : (
                                    <span className="font-medium text-[#1f2d22]">
                                        {breadcrumb.page}
                                    </span>
                                )}
                                <span aria-hidden="true">·</span>
                                <span>{todayLabel}</span>
                            </>
                        ) : (
                            <span className="font-medium text-[#1f2d22]">
                                CEMEROG
                            </span>
                        )}
                    </div>

                    {/* Right: search, notifications, user */}
                    <div className="flex items-center gap-2">
                        {/* Global search (UI only) */}
                        <button className="flex items-center gap-2 rounded-md border border-[#e4e4e7] bg-[#F3F7F2] px-3 py-1.5 text-sm text-[#71717a] transition-colors hover:bg-white">
                            <Search className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Buscar...</span>
                            <kbd className="hidden rounded border border-[#e4e4e7] bg-white px-1.5 py-0.5 text-xs text-[#71717a] sm:inline">
                                ⌘K
                            </kbd>
                        </button>

                        {/* Notifications (UI only) */}
                        <button
                            className="relative rounded-md p-2 text-[#71717a] transition-colors hover:bg-[#EEF6E2] hover:text-[#2E8B3E]"
                            aria-label="Notificaciones"
                        >
                            <Bell className="h-4 w-4" />
                        </button>

                        {/* User menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu((v) => !v)}
                                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-[#F3F7F2]"
                            >
                                <div
                                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                                    style={{ backgroundColor: '#2E8B3E' }}
                                >
                                    {user?.name?.charAt(0)?.toUpperCase() ??
                                        'U'}
                                </div>
                                <span className="hidden text-[#333333] md:inline">
                                    {user?.name}
                                </span>
                            </button>

                            {showUserMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowUserMenu(false)}
                                    />
                                    <div className="absolute top-full right-0 z-20 mt-1 w-56 rounded-lg border border-[#e3e9e3] bg-white shadow-lg">
                                        <div className="border-b border-[#e3e9e3] px-4 py-3">
                                            <p className="text-sm font-semibold text-[#1f2d22]">
                                                {user?.name}
                                            </p>
                                            <p className="text-xs text-[#71717a]">
                                                @{user?.username}
                                            </p>
                                            {user?.roles &&
                                                user.roles.length > 0 && (
                                                    <p className="mt-1 text-xs text-[#71717a] capitalize">
                                                        {user.roles.join(', ')}
                                                    </p>
                                                )}
                                        </div>
                                        <div className="p-1">
                                            <button
                                                onClick={handleLogout}
                                                className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-[#b91c1c] transition-colors hover:bg-[#fef2f2]"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                Cerrar sesión
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main
                    className="flex-1 overflow-y-auto"
                    style={{ padding: '28px 32px 48px' }}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}
