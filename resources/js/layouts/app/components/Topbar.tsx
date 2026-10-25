/**
 * Topbar – application top bar with breadcrumb, search, notifications, and user menu.
 */

import { Bell } from 'lucide-react';
import type { BreadcrumbResult } from '@/lib/breadcrumb';
import { UserMenu, type UserMenuProps } from './UserMenu';

export interface TopbarProps {
    breadcrumb: BreadcrumbResult | null;
    todayLabel: string;
    userMenuProps: UserMenuProps;
}

export function Topbar({ breadcrumb, todayLabel, userMenuProps }: TopbarProps) {
    return (
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-card-border bg-white px-4 shadow-sm">
            {/* Left: breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted">
                {breadcrumb ? (
                    <>
                        <span>{breadcrumb.section}</span>
                        <span aria-hidden="true">›</span>
                        {breadcrumb.subPage ? (
                            <>
                                <span>{breadcrumb.page}</span>
                                <span aria-hidden="true">›</span>
                                <span className="font-medium text-text-heading">
                                    {breadcrumb.subPage}
                                </span>
                            </>
                        ) : (
                            <span className="font-medium text-text-heading">
                                {breadcrumb.page}
                            </span>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>{todayLabel}</span>
                    </>
                ) : (
                    <span className="font-medium text-text-heading">
                        CEMEROG
                    </span>
                )}
            </div>

            {/* Right: notifications, user */}
            <div className="flex items-center gap-2">
                {/* Notifications (UI only) */}
                <button
                    className="relative rounded-md p-2 text-muted transition-colors hover:bg-accent-bg hover:text-primary"
                    aria-label="Notificaciones"
                >
                    <Bell className="h-4 w-4" />
                </button>

                {/* User menu */}
                <UserMenu {...userMenuProps} />
            </div>
        </header>
    );
}
