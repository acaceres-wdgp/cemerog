import { useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = { name: string; label: string; permissions: string[] };
type Permission = { name: string; label: string; module: string };
type UserRow = {
    id: number;
    name: string;
    username: string;
    email: string | null;
    is_active: boolean;
    roles: string[];
    permissions: string[];
    all_permissions: string[];
    last_activity: number | null;
};
type Props = {
    users: UserRow[];
    roles: Role[];
    permissions: Permission[];
};

// ─── Design tokens / constants ────────────────────────────────────────────────

const ROLE_COLORS: Record<string, { bg: string; fg: string }> = {
    administrador: { bg: '#EDE9FE', fg: '#5B21B6' },
    medico: { bg: '#DBEAFE', fg: '#1E40AF' },
    secretaria: { bg: '#EEF6E2', fg: '#2E8B3E' },
    enfermeria: { bg: '#FCE7F3', fg: '#9D174D' },
    caja: { bg: '#FEF3C7', fg: '#92400E' },
    bioanalista: { bg: '#CFFAFE', fg: '#155E75' },
    imagenes: { bg: '#FEE2E2', fg: '#991B1B' },
    almacen: { bg: '#F3F4F6', fg: '#374151' },
};

const thStyle: React.CSSProperties = {
    textAlign: 'left',
    fontWeight: 600,
    fontSize: 11.5,
    letterSpacing: '.05em',
    textTransform: 'uppercase',
    color: '#56693f',
    padding: '0 12px',
    height: 40,
    background: '#F6FAF1',
    borderBottom: '1px solid #DCEBC9',
    whiteSpace: 'nowrap',
};

const inputStyle: React.CSSProperties = {
    height: 36,
    border: '1px solid #e4e4e7',
    borderRadius: 10,
    padding: '0 12px',
    fontFamily: 'inherit',
    fontSize: 14,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
};

function initials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function formatLastActivity(ts: number | null): string {
    if (!ts) return '—';
    const d = new Date(ts * 1000);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

// ─── User form modal (create / edit) ─────────────────────────────────────────

type UserFormData = {
    name: string;
    username: string;
    email: string;
    password: string;
    password_confirmation: string;
    is_active: boolean;
    roles: string[];
    permissions: string[];
};

function UserModal({
    open,
    onClose,
    editUser,
    roles,
    permissions,
}: {
    open: boolean;
    onClose: () => void;
    editUser: UserRow | null;
    roles: Role[];
    permissions: Permission[];
}) {
    const isEdit = editUser !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<UserFormData>({
            name: editUser?.name ?? '',
            username: editUser?.username ?? '',
            email: editUser?.email ?? '',
            password: '',
            password_confirmation: '',
            is_active: editUser?.is_active ?? true,
            roles: editUser?.roles ?? [],
            permissions: editUser?.permissions ?? [],
        });

    function handleClose() {
        reset();
        clearErrors();
        onClose();
    }

    function handleRoleToggle(roleName: string) {
        const role = roles.find((r) => r.name === roleName);
        if (!role) return;

        const currentRoles = data.roles;
        const hasRole = currentRoles.includes(roleName);

        let nextRoles: string[];
        let nextPerms: string[] = [...data.permissions];

        if (hasRole) {
            nextRoles = currentRoles.filter((r) => r !== roleName);
            // Remove permissions that came exclusively from this role
            // (only if not in other selected roles)
            const otherRolePerms = nextRoles.flatMap(
                (r) => roles.find((x) => x.name === r)?.permissions ?? [],
            );
            nextPerms = nextPerms.filter((p) => otherRolePerms.includes(p));
        } else {
            nextRoles = [...currentRoles, roleName];
            // Auto-add role permissions
            const toAdd = role.permissions.filter((p) => !nextPerms.includes(p));
            nextPerms = [...nextPerms, ...toAdd];
        }

        setData((prev) => ({ ...prev, roles: nextRoles, permissions: nextPerms }));
    }

    function handlePermToggle(permName: string) {
        setData((prev) => ({
            ...prev,
            permissions: prev.permissions.includes(permName)
                ? prev.permissions.filter((p) => p !== permName)
                : [...prev.permissions, permName],
        }));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit && editUser) {
            put(`/admin/usuarios/${editUser.id}`, {
                onSuccess: handleClose,
                preserveScroll: true,
            });
        } else {
            post('/admin/usuarios', {
                onSuccess: handleClose,
                preserveScroll: true,
            });
        }
    }

    // Group permissions by module label for display
    const grouped = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
        const key = p.label;
        if (!acc[key]) acc[key] = [];
        acc[key].push(p);
        return acc;
    }, {});

    if (!open) return null;

    return (
        <>
            <div
                onClick={handleClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 40,
                    background: 'rgba(0,0,0,.4)',
                }}
            />
            <div
                style={{
                    position: 'fixed',
                    zIndex: 41,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%,-50%)',
                    width: 560,
                    maxWidth: '95vw',
                    maxHeight: '90vh',
                    background: '#fff',
                    borderRadius: 16,
                    boxShadow: '0 24px 64px -16px rgba(16,40,24,.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #eef0ec',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexShrink: 0,
                    }}
                >
                    <span
                        style={{
                            fontFamily: 'Bitter,Georgia,serif',
                            fontWeight: 600,
                            fontSize: 17,
                            color: '#1f2d22',
                        }}
                    >
                        {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
                    </span>
                    <button
                        type="button"
                        onClick={handleClose}
                        style={{
                            width: 30,
                            height: 30,
                            border: 'none',
                            borderRadius: 8,
                            background: '#F3F7F2',
                            cursor: 'pointer',
                            fontSize: 16,
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <form
                    onSubmit={handleSubmit}
                    style={{
                        overflowY: 'auto',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <div
                        style={{
                            padding: '16px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 14,
                        }}
                    >
                        {/* Name + Username */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 12,
                            }}
                        >
                            <label
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                    fontWeight: 500,
                                    fontSize: 14,
                                }}
                            >
                                <span>Nombre completo *</span>
                                <input
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    style={{
                                        ...inputStyle,
                                        borderColor: errors.name
                                            ? '#b91c1c'
                                            : '#e4e4e7',
                                    }}
                                />
                                {errors.name && (
                                    <span
                                        style={{ color: '#b91c1c', fontSize: 12 }}
                                    >
                                        {errors.name}
                                    </span>
                                )}
                            </label>
                            <label
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                    fontWeight: 500,
                                    fontSize: 14,
                                }}
                            >
                                <span>Nombre de usuario *</span>
                                <input
                                    value={data.username}
                                    onChange={(e) =>
                                        setData(
                                            'username',
                                            e.target.value.toLowerCase(),
                                        )
                                    }
                                    style={{
                                        ...inputStyle,
                                        fontFamily: 'ui-monospace,monospace',
                                        fontSize: 13,
                                        borderColor: errors.username
                                            ? '#b91c1c'
                                            : '#e4e4e7',
                                    }}
                                />
                                {errors.username && (
                                    <span
                                        style={{ color: '#b91c1c', fontSize: 12 }}
                                    >
                                        {errors.username}
                                    </span>
                                )}
                            </label>
                        </div>

                        {/* Email */}
                        <label
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                                fontWeight: 500,
                                fontSize: 14,
                            }}
                        >
                            <span>Correo electrónico</span>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                style={{
                                    ...inputStyle,
                                    borderColor: errors.email
                                        ? '#b91c1c'
                                        : '#e4e4e7',
                                }}
                            />
                            {errors.email && (
                                <span style={{ color: '#b91c1c', fontSize: 12 }}>
                                    {errors.email}
                                </span>
                            )}
                        </label>

                        {/* Password — only shown when creating */}
                        {!isEdit ? (
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 12,
                                }}
                            >
                                <label
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 6,
                                        fontWeight: 500,
                                        fontSize: 14,
                                    }}
                                >
                                    <span>Contraseña *</span>
                                    <input
                                        type="password"
                                        value={data.password}
                                        onChange={(e) =>
                                            setData('password', e.target.value)
                                        }
                                        style={{
                                            ...inputStyle,
                                            borderColor: errors.password
                                                ? '#b91c1c'
                                                : '#e4e4e7',
                                        }}
                                    />
                                    {errors.password && (
                                        <span
                                            style={{
                                                color: '#b91c1c',
                                                fontSize: 12,
                                            }}
                                        >
                                            {errors.password}
                                        </span>
                                    )}
                                </label>
                                <label
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 6,
                                        fontWeight: 500,
                                        fontSize: 14,
                                    }}
                                >
                                    <span>Confirmar contraseña *</span>
                                    <input
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) =>
                                            setData(
                                                'password_confirmation',
                                                e.target.value,
                                            )
                                        }
                                        style={{
                                            ...inputStyle,
                                            borderColor: errors.password
                                                ? '#b91c1c'
                                                : '#e4e4e7',
                                        }}
                                    />
                                </label>
                            </div>
                        ) : (
                            <p
                                style={{
                                    fontSize: 13,
                                    color: '#71717a',
                                    margin: 0,
                                    background: '#F6FAF1',
                                    borderRadius: 8,
                                    padding: '8px 12px',
                                    border: '1px solid #e3e9e3',
                                }}
                            >
                                Para cambiar la contraseña usa el botón "Contraseña"
                                en la lista de usuarios.
                            </p>
                        )}

                        {/* Roles */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                            }}
                        >
                            <span
                                style={{
                                    fontWeight: 500,
                                    fontSize: 14,
                                }}
                            >
                                Roles
                            </span>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 6,
                                    flexWrap: 'wrap',
                                }}
                            >
                                {roles.map((role) => {
                                    const selected = data.roles.includes(
                                        role.name,
                                    );
                                    const rc = ROLE_COLORS[role.name] ?? {
                                        bg: '#F4F4F5',
                                        fg: '#52525B',
                                    };
                                    return (
                                        <button
                                            key={role.name}
                                            type="button"
                                            onClick={() =>
                                                handleRoleToggle(role.name)
                                            }
                                            style={{
                                                height: 30,
                                                padding: '0 12px',
                                                borderRadius: 999,
                                                border: selected
                                                    ? `2px solid ${rc.fg}`
                                                    : '1px solid #e4e4e7',
                                                background: selected ? rc.bg : '#fff',
                                                color: selected ? rc.fg : '#52525b',
                                                cursor: 'pointer',
                                                fontSize: 13,
                                                fontFamily: 'inherit',
                                                fontWeight: selected ? 600 : 400,
                                                transition: 'all .15s',
                                            }}
                                        >
                                            {role.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Permissions */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 500, fontSize: 14 }}>
                                    Permisos directos
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const allNames = permissions.map((p) => p.name);
                                        const allChecked = allNames.every((n) => data.permissions.includes(n));
                                        setData('permissions', allChecked ? [] : allNames);
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: 12,
                                        color: '#2E8B3E',
                                        padding: 0,
                                        fontFamily: 'inherit',
                                        textDecoration: 'underline',
                                    }}
                                >
                                    {permissions.every((p) => data.permissions.includes(p.name))
                                        ? 'Deseleccionar todos'
                                        : 'Seleccionar todos'}
                                </button>
                            </div>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns:
                                        'repeat(auto-fill, minmax(180px, 1fr))',
                                    gap: '6px 10px',
                                    background: '#F6FAF1',
                                    borderRadius: 10,
                                    padding: '10px 12px',
                                    border: '1px solid #e3e9e3',
                                    maxHeight: 200,
                                    overflowY: 'auto',
                                }}
                            >
                                {Object.entries(grouped).map(([label, perms]) =>
                                    perms.map((perm) => {
                                        const checked = data.permissions.includes(
                                            perm.name,
                                        );
                                        return (
                                            <label
                                                key={perm.name}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    fontSize: 13,
                                                    cursor: 'pointer',
                                                    color: checked
                                                        ? '#2E8B3E'
                                                        : '#374151',
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() =>
                                                        handlePermToggle(perm.name)
                                                    }
                                                    style={{ accentColor: '#2E8B3E' }}
                                                />
                                                {label}
                                            </label>
                                        );
                                    }),
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            padding: '14px 20px',
                            borderTop: '1px solid #eef0ec',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 8,
                            flexShrink: 0,
                        }}
                    >
                        <button
                            type="button"
                            onClick={handleClose}
                            style={{
                                height: 36,
                                padding: '0 14px',
                                borderRadius: 10,
                                border: '1px solid #dfe7df',
                                background: '#F6F9F5',
                                fontWeight: 500,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 14,
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                height: 36,
                                padding: '0 16px',
                                borderRadius: 10,
                                border: 'none',
                                background: processing ? '#7cb987' : '#2E8B3E',
                                color: '#fff',
                                fontWeight: 500,
                                cursor: processing ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 14,
                            }}
                        >
                            {processing
                                ? 'Guardando…'
                                : isEdit
                                  ? '✓ Guardar cambios'
                                  : '✓ Crear usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

// ─── Change password modal ────────────────────────────────────────────────────

type PwFormData = {
    password: string;
    password_confirmation: string;
    must_change_password: boolean;
};

function PasswordModal({
    open,
    onClose,
    targetUser,
}: {
    open: boolean;
    onClose: () => void;
    targetUser: UserRow | null;
}) {
    const { data, setData, patch, processing, errors, reset, clearErrors } =
        useForm<PwFormData>({
            password: '',
            password_confirmation: '',
            must_change_password: false,
        });

    function handleClose() {
        reset();
        clearErrors();
        onClose();
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!targetUser) return;
        patch(`/admin/usuarios/${targetUser.id}/password`, {
            onSuccess: handleClose,
            preserveScroll: true,
        });
    }

    if (!open || !targetUser) return null;

    return (
        <>
            <div
                onClick={handleClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 40,
                    background: 'rgba(0,0,0,.4)',
                }}
            />
            <div
                style={{
                    position: 'fixed',
                    zIndex: 41,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%,-50%)',
                    width: 420,
                    maxWidth: '95vw',
                    background: '#fff',
                    borderRadius: 16,
                    boxShadow: '0 24px 64px -16px rgba(16,40,24,.35)',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #eef0ec',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <span
                        style={{
                            fontFamily: 'Bitter,Georgia,serif',
                            fontWeight: 600,
                            fontSize: 17,
                            color: '#1f2d22',
                        }}
                    >
                        Cambiar contraseña
                    </span>
                    <button
                        type="button"
                        onClick={handleClose}
                        style={{
                            width: 30,
                            height: 30,
                            border: 'none',
                            borderRadius: 8,
                            background: '#F3F7F2',
                            cursor: 'pointer',
                            fontSize: 16,
                        }}
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div
                        style={{
                            padding: '16px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 14,
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                fontSize: 13.5,
                                color: '#52525b',
                            }}
                        >
                            Establecer nueva contraseña para{' '}
                            <strong>{targetUser.name}</strong>.
                        </p>

                        <label
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                                fontWeight: 500,
                                fontSize: 14,
                            }}
                        >
                            <span>Nueva contraseña *</span>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                style={{
                                    ...inputStyle,
                                    borderColor: errors.password
                                        ? '#b91c1c'
                                        : '#e4e4e7',
                                }}
                            />
                            {errors.password && (
                                <span style={{ color: '#b91c1c', fontSize: 12 }}>
                                    {errors.password}
                                </span>
                            )}
                        </label>

                        <label
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                                fontWeight: 500,
                                fontSize: 14,
                            }}
                        >
                            <span>Confirmar contraseña *</span>
                            <input
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) =>
                                    setData(
                                        'password_confirmation',
                                        e.target.value,
                                    )
                                }
                                style={{
                                    ...inputStyle,
                                    borderColor: errors.password
                                        ? '#b91c1c'
                                        : '#e4e4e7',
                                }}
                            />
                        </label>

                        <label
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: 14,
                                cursor: 'pointer',
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={data.must_change_password}
                                onChange={(e) =>
                                    setData(
                                        'must_change_password',
                                        e.target.checked,
                                    )
                                }
                                style={{ accentColor: '#2E8B3E', width: 16, height: 16 }}
                            />
                            Forzar cambio en el próximo acceso
                        </label>
                    </div>

                    <div
                        style={{
                            padding: '14px 20px',
                            borderTop: '1px solid #eef0ec',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 8,
                        }}
                    >
                        <button
                            type="button"
                            onClick={handleClose}
                            style={{
                                height: 36,
                                padding: '0 14px',
                                borderRadius: 10,
                                border: '1px solid #dfe7df',
                                background: '#F6F9F5',
                                fontWeight: 500,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 14,
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            style={{
                                height: 36,
                                padding: '0 16px',
                                borderRadius: 10,
                                border: 'none',
                                background: processing ? '#7cb987' : '#2E8B3E',
                                color: '#fff',
                                fontWeight: 500,
                                cursor: processing ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 14,
                            }}
                        >
                            {processing ? 'Guardando…' : '✓ Actualizar'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminIndex() {
    const { users, roles, permissions } = usePage<Props>().props;

    const [query, setQuery] = useState('');
    const [showUserModal, setShowUserModal] = useState(false);
    const [editUser, setEditUser] = useState<UserRow | null>(null);
    const [showPwModal, setShowPwModal] = useState(false);
    const [pwTargetUser, setPwTargetUser] = useState<UserRow | null>(null);

    const filtered = users.filter(
        (u) =>
            !query ||
            u.name.toLowerCase().includes(query.toLowerCase()) ||
            u.username.toLowerCase().includes(query.toLowerCase()),
    );

    function openCreate() {
        setEditUser(null);
        setShowUserModal(true);
    }

    function openEdit(u: UserRow) {
        setEditUser(u);
        setShowUserModal(true);
    }

    function openPwModal(u: UserRow) {
        setPwTargetUser(u);
        setShowPwModal(true);
    }

    return (
        <div className="flex flex-col gap-5">
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                }}
            >
                <div>
                    <h1
                        style={{
                            fontFamily: 'Bitter,Georgia,serif',
                            fontWeight: 600,
                            fontSize: 26,
                            color: '#1f2d22',
                            margin: 0,
                        }}
                    >
                        Usuarios y Roles
                    </h1>
                    <p style={{ margin: '4px 0 0', color: '#5f6b64' }}>
                        {users.filter((u) => u.is_active).length} usuarios activos
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        height: 36,
                        padding: '0 14px',
                        borderRadius: 10,
                        border: 'none',
                        background: '#2E8B3E',
                        color: '#fff',
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 14,
                    }}
                >
                    + Nuevo usuario
                </button>
            </div>

            {/* Table card */}
            <div
                style={{
                    background: '#fff',
                    border: '1px solid #e3e9e3',
                    borderRadius: 14,
                    overflow: 'hidden',
                }}
            >
                {/* Search bar */}
                <div
                    style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #eef0ec',
                    }}
                >
                    <div
                        style={{
                            position: 'relative',
                            flex: '0 1 300px',
                            minWidth: 200,
                        }}
                    >
                        <span
                            style={{
                                position: 'absolute',
                                left: 10,
                                top: 10,
                                color: '#71717a',
                                pointerEvents: 'none',
                            }}
                        >
                            🔍
                        </span>
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar usuario…"
                            style={{
                                height: 36,
                                width: '100%',
                                padding: '0 12px 0 32px',
                                border: '1px solid #e4e4e7',
                                borderRadius: 10,
                                outline: 'none',
                                fontFamily: 'inherit',
                                fontSize: 14,
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            minWidth: 760,
                        }}
                    >
                        <thead>
                            <tr>
                                <th style={thStyle}>Nombre</th>
                                <th style={thStyle}>Usuario</th>
                                <th style={thStyle}>Roles / Permisos</th>
                                <th style={thStyle}>Estado</th>
                                <th style={thStyle}>Último acceso</th>
                                <th
                                    style={{
                                        ...thStyle,
                                        textAlign: 'right',
                                        paddingRight: 16,
                                    }}
                                >
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((u) => (
                                <tr
                                    key={u.id}
                                    style={{ opacity: u.is_active ? 1 : 0.6 }}
                                >
                                    {/* Name + avatar */}
                                    <td
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid #eef0ec',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: 34,
                                                    height: 34,
                                                    flexShrink: 0,
                                                    borderRadius: '50%',
                                                    background: '#EEF6E2',
                                                    color: '#2E8B3E',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {initials(u.name)}
                                            </span>
                                            <span style={{ fontWeight: 500 }}>
                                                {u.name}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Username */}
                                    <td
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid #eef0ec',
                                            fontFamily: 'ui-monospace,monospace',
                                            fontSize: 12.5,
                                            color: '#52525b',
                                        }}
                                    >
                                        {u.username}
                                    </td>

                                    {/* Roles pills */}
                                    <td
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid #eef0ec',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: 4,
                                                flexWrap: 'wrap',
                                            }}
                                        >
                                            {u.roles.length > 0
                                                ? u.roles.map((r) => {
                                                      const rc = ROLE_COLORS[
                                                          r
                                                      ] ?? {
                                                          bg: '#F4F4F5',
                                                          fg: '#52525B',
                                                      };
                                                      const roleLabel =
                                                          roles.find(
                                                              (x) => x.name === r,
                                                          )?.label ?? r;
                                                      return (
                                                          <span
                                                              key={r}
                                                              style={{
                                                                  padding:
                                                                      '2px 8px',
                                                                  borderRadius: 999,
                                                                  background: rc.bg,
                                                                  color: rc.fg,
                                                                  fontSize: 12,
                                                                  fontWeight: 600,
                                                              }}
                                                          >
                                                              {roleLabel}
                                                          </span>
                                                      );
                                                  })
                                                : u.permissions.length > 0 && (
                                                      <span
                                                          style={{
                                                              fontSize: 12,
                                                              color: '#71717a',
                                                          }}
                                                      >
                                                          {u.permissions.length}{' '}
                                                          permiso
                                                          {u.permissions.length !==
                                                          1
                                                              ? 's'
                                                              : ''}{' '}
                                                          directos
                                                      </span>
                                                  )}
                                            {u.roles.length === 0 &&
                                                u.permissions.length === 0 && (
                                                    <span
                                                        style={{
                                                            fontSize: 12,
                                                            color: '#a1a1aa',
                                                        }}
                                                    >
                                                        Sin rol
                                                    </span>
                                                )}
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid #eef0ec',
                                        }}
                                    >
                                        <span
                                            style={{
                                                padding: '3px 10px',
                                                borderRadius: 999,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                background: u.is_active
                                                    ? '#EEF6E2'
                                                    : '#F4F4F5',
                                                color: u.is_active
                                                    ? '#2E8B3E'
                                                    : '#52525B',
                                            }}
                                        >
                                            {u.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>

                                    {/* Last activity */}
                                    <td
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid #eef0ec',
                                            fontSize: 13,
                                            color: '#71717a',
                                            fontVariantNumeric: 'tabular-nums',
                                        }}
                                    >
                                        {formatLastActivity(u.last_activity)}
                                    </td>

                                    {/* Actions */}
                                    <td
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid #eef0ec',
                                            textAlign: 'right',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'flex-end',
                                                gap: 6,
                                            }}
                                        >
                                            <button
                                                onClick={() => openEdit(u)}
                                                style={{
                                                    height: 28,
                                                    padding: '0 10px',
                                                    borderRadius: 6,
                                                    border: '1px solid #dfe7df',
                                                    background: '#F6F9F5',
                                                    cursor: 'pointer',
                                                    fontSize: 12,
                                                    fontFamily: 'inherit',
                                                }}
                                            >
                                                ✏ Editar
                                            </button>
                                            <button
                                                onClick={() => openPwModal(u)}
                                                style={{
                                                    height: 28,
                                                    padding: '0 10px',
                                                    borderRadius: 6,
                                                    border: '1px solid #dfe7df',
                                                    background: '#F6F9F5',
                                                    cursor: 'pointer',
                                                    fontSize: 12,
                                                    fontFamily: 'inherit',
                                                    color: '#52525b',
                                                }}
                                            >
                                                Contraseña
                                            </button>
                                            <ToggleButton user={u} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        style={{
                                            padding: '32px 12px',
                                            textAlign: 'center',
                                            color: '#71717a',
                                            fontSize: 14,
                                        }}
                                    >
                                        No se encontraron usuarios.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <UserModal
                key={editUser?.id ?? 'new'}
                open={showUserModal}
                onClose={() => setShowUserModal(false)}
                editUser={editUser}
                roles={roles}
                permissions={permissions}
            />
            <PasswordModal
                open={showPwModal}
                onClose={() => setShowPwModal(false)}
                targetUser={pwTargetUser}
            />
        </div>
    );
}

// ─── Toggle button (separate component to use its own useForm) ────────────────

function ToggleButton({ user }: { user: UserRow }) {
    const { patch, processing } = useForm({});

    function handleToggle() {
        patch(`/admin/usuarios/${user.id}/toggle`, {
            preserveScroll: true,
        });
    }

    return (
        <button
            onClick={handleToggle}
            disabled={processing}
            style={{
                height: 28,
                padding: '0 10px',
                borderRadius: 6,
                border: '1px solid #dfe7df',
                background: '#F6F9F5',
                cursor: processing ? 'not-allowed' : 'pointer',
                fontSize: 12,
                fontFamily: 'inherit',
                color: user.is_active ? '#b91c1c' : '#2E8B3E',
                opacity: processing ? 0.6 : 1,
            }}
        >
            {user.is_active ? '⊘ Desactivar' : '✓ Activar'}
        </button>
    );
}
