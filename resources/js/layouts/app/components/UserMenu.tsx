/**
 * UserMenu – avatar + name + role dropdown in the topbar.
 */

import { ChevronDown, LogOut } from 'lucide-react';

/** Human-readable role labels (es-DO) */
const ROLE_LABELS: Record<string, string> = {
    administrador: 'Administrador',
    medico: 'Médico',
    enfermeria: 'Enfermería',
    secretaria: 'Secretaría',
    bioanalista: 'Bioanalista',
    imagenes: 'Imágenes',
    caja: 'Caja',
    almacen: 'Almacén',
};

function roleLabel(roles: string[]): string {
    if (roles.length === 0) return '';
    return ROLE_LABELS[roles[0]] ?? roles[0];
}

/** Two-letter initials from a full name (first letter of first two words) */
function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return (
        parts
            .slice(0, 2)
            .map((w) => w.charAt(0).toUpperCase())
            .join('') || 'U'
    );
}

export interface UserMenuProps {
    name: string;
    username: string;
    roles: string[];
    showUserMenu: boolean;
    onToggle: () => void;
    onClose: () => void;
    onLogout: () => void;
}

export function UserMenu({
    name,
    username,
    roles,
    showUserMenu,
    onToggle,
    onClose,
    onLogout,
}: UserMenuProps) {
    const initials = getInitials(name);
    const label = roleLabel(roles);

    return (
        <div className="relative">
            <button
                onClick={onToggle}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-app-bg"
                aria-label={name}
                aria-expanded={showUserMenu}
            >
                <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white"
                    data-testid="user-avatar"
                >
                    {initials}
                </div>
                <div className="hidden flex-col items-start md:flex">
                    <span className="text-sm leading-tight font-medium text-text-heading">
                        {name}
                    </span>
                    {label && (
                        <span
                            className="text-xs leading-tight text-muted"
                            data-testid="user-role"
                        >
                            {label}
                        </span>
                    )}
                </div>
                <ChevronDown className="hidden h-3.5 w-3.5 text-muted md:block" />
            </button>

            {showUserMenu && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={onClose}
                        aria-hidden="true"
                    />
                    <div className="absolute top-full right-0 z-20 mt-1 w-56 rounded-lg border border-card-border bg-white shadow-lg">
                        <div className="border-b border-card-border px-4 py-3">
                            <p className="text-sm font-semibold text-text-heading">
                                {name}
                            </p>
                            <p className="text-xs text-muted">@{username}</p>
                            {roles.length > 0 && (
                                <p className="mt-1 text-xs text-muted capitalize">
                                    {roles.join(', ')}
                                </p>
                            )}
                        </div>
                        <div className="p-1">
                            <button
                                onClick={onLogout}
                                className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-error transition-colors hover:bg-error-bg"
                            >
                                <LogOut className="h-4 w-4" />
                                Cerrar sesión
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
