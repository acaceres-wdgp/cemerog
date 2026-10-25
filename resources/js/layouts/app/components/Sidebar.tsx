/**
 * Sidebar – collapsible navigation sidebar with theme switcher.
 * Sidebar theme is persisted in a cookie (sidebar_theme).
 * Collapsed state is persisted in cookie (sidebar_state).
 */

import { Link, usePage } from '@inertiajs/react';
import { TurnoActualCard } from './TurnoActualCard';
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
} from 'lucide-react';
import { NAV_GROUPS, type NavItem } from '@/lib/navigation';
import type { PageProps } from '@/types/global';

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

export type SidebarTheme = 'carbon' | 'slate' | 'forest';

/** Tailwind bg utility classes for each sidebar theme */
const THEME_BG: Record<SidebarTheme, string> = {
    carbon: 'bg-sidebar-carbon',
    slate: 'bg-sidebar-slate',
    forest: 'bg-sidebar-forest',
};

/** Human-readable label for theme picker */
const THEME_LABELS: Record<SidebarTheme, string> = {
    carbon: 'Carbón',
    slate: 'Pizarra',
    forest: 'Verde bosque',
};

const THEMES: SidebarTheme[] = ['carbon', 'slate', 'forest'];

export interface SidebarProps {
    collapsed: boolean;
    theme: SidebarTheme;
    showThemePicker: boolean;
    onToggleCollapse: () => void;
    onChangeTheme: (t: SidebarTheme) => void;
    onToggleThemePicker: () => void;
    currentUrl: string;
    isActiveItem: (item: NavItem) => boolean;
}

export function Sidebar({
    collapsed,
    theme,
    showThemePicker,
    onToggleCollapse,
    onChangeTheme,
    onToggleThemePicker,
    isActiveItem,
}: SidebarProps) {
    const pageProps = usePage<PageProps>().props;
    const permissions: string[] =
        (pageProps as unknown as { permissions?: string[] }).permissions ?? [];
    const doctor = pageProps.doctor ?? null;
    const queue = pageProps.queue ?? null;

    return (
        <aside
            className={`flex shrink-0 flex-col transition-all duration-300 ease-in-out ${THEME_BG[theme]} ${collapsed ? 'w-16' : 'w-60'}`}
            data-sidebar-theme={theme}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-fg">
                    CG
                </div>
                {!collapsed && (
                    <div className="min-w-0">
                        <p className="text-sm leading-tight font-bold text-white">
                            CEMEROG
                        </p>
                        <p className="truncate text-xs text-white/55">
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
                                <p className="px-4 py-1 text-[10px] font-semibold tracking-widest text-white/35 uppercase">
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
                                                ? 'bg-white/12 text-white'
                                                : 'text-white/60 hover:text-white/90'
                                        }`}
                                        title={
                                            collapsed ? item.label : undefined
                                        }
                                        aria-current={
                                            isActive ? 'page' : undefined
                                        }
                                    >
                                        <Icon
                                            className={`h-4 w-4 shrink-0 ${isActive ? 'text-accent' : ''}`}
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

            {/* Turno actual card – only for users with a linked doctor */}
            {doctor && (
                <TurnoActualCard
                    doctor={doctor}
                    queue={queue}
                    collapsed={collapsed}
                />
            )}

            {/* Footer – theme picker + collapse toggle */}
            <div className="border-t border-white/10 px-3 py-3">
                {/* Theme picker trigger */}
                {!collapsed && (
                    <div className="relative mb-2">
                        <button
                            onClick={onToggleThemePicker}
                            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-white/50 transition-colors hover:text-white/80"
                        >
                            <div
                                className={`h-3 w-3 rounded-full border border-white/30 ${THEME_BG[theme]}`}
                            />
                            Tema: {THEME_LABELS[theme]}
                        </button>
                        {showThemePicker && (
                            <div className="absolute bottom-full left-0 mb-1 min-w-40 rounded-lg border border-white/10 bg-black/90 p-2 shadow-xl">
                                {THEMES.map((key) => (
                                    <button
                                        key={key}
                                        onClick={() => onChangeTheme(key)}
                                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                                    >
                                        <div
                                            className={`h-3 w-3 rounded-full border border-white/30 ${THEME_BG[key]}`}
                                        />
                                        {THEME_LABELS[key]}
                                        {theme === key && (
                                            <span className="ml-auto text-accent">
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
                    onClick={onToggleCollapse}
                    className="flex w-full items-center justify-center rounded p-1.5 text-white/50 transition-colors hover:text-white/80"
                    aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </button>
            </div>
        </aside>
    );
}
