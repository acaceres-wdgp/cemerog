import { useState } from 'react';

const ROLES_COLORS: Record<string, { bg: string; fg: string }> = {
    'Administrador': { bg: '#EDE9FE', fg: '#5B21B6' },
    'Médico': { bg: '#DBEAFE', fg: '#1E40AF' },
    'Recepción': { bg: '#EEF6E2', fg: '#2E8B3E' },
    'Enfermería': { bg: '#FCE7F3', fg: '#9D174D' },
    'Caja': { bg: '#FEF3C7', fg: '#92400E' },
    'Laboratorio': { bg: '#CFFAFE', fg: '#155E75' },
};

const MOCK_USERS = [
    { id: 1, nombre: 'Admin Sistema', usuario: 'admin', roles: ['Administrador'], activo: true, ult: '12/10/2026 09:14' },
    { id: 2, nombre: 'Dra. Ana Rodríguez', usuario: 'ana.rodriguez', roles: ['Médico'], activo: true, ult: '12/10/2026 08:00' },
    { id: 3, nombre: 'Dr. Pedro Guzmán', usuario: 'pedro.guzman', roles: ['Médico'], activo: true, ult: '11/10/2026 16:30' },
    { id: 4, nombre: 'Dra. Sofía Castro', usuario: 'sofia.castro', roles: ['Médico'], activo: true, ult: '10/10/2026 14:00' },
    { id: 5, nombre: 'Kenia Marte', usuario: 'kenia.marte', roles: ['Recepción', 'Caja'], activo: true, ult: '12/10/2026 08:05' },
    { id: 6, nombre: 'Juan Mateo', usuario: 'juan.mateo', roles: ['Caja'], activo: false, ult: '05/10/2026 15:00' },
    { id: 7, nombre: 'Rosa Castillo', usuario: 'rosa.castillo', roles: ['Laboratorio', 'Recepción'], activo: true, ult: '12/10/2026 07:55' },
    { id: 8, nombre: 'Carlos Familia', usuario: 'carlos.familia', roles: ['Enfermería'], activo: true, ult: '12/10/2026 08:10' },
];

const thStyle: React.CSSProperties = {
    textAlign: 'left', fontWeight: 600, fontSize: 11.5, letterSpacing: '.05em',
    textTransform: 'uppercase', color: '#56693f', padding: '0 12px', height: 40,
    background: '#F6FAF1', borderBottom: '1px solid #DCEBC9', whiteSpace: 'nowrap',
};

export default function AdminIndex() {
    const [showModal, setShowModal] = useState(false);
    const [query, setQuery] = useState('');

    const filtered = MOCK_USERS.filter(u =>
        !query || u.nombre.toLowerCase().includes(query.toLowerCase()) || u.usuario.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-5">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 26, color: '#1f2d22', margin: 0 }}>Usuarios y Roles</h1>
                    <p style={{ margin: '4px 0 0', color: '#5f6b64' }}>{MOCK_USERS.filter(u => u.activo).length} usuarios activos</p>
                </div>
                <button onClick={() => setShowModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', borderRadius: 10, border: 'none', background: '#2E8B3E', color: '#fff', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                    + Nuevo usuario
                </button>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #eef0ec' }}>
                    <div style={{ position: 'relative', flex: '0 1 300px', minWidth: 200 }}>
                        <span style={{ position: 'absolute', left: 10, top: 10, color: '#71717a', pointerEvents: 'none' }}>🔍</span>
                        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar usuario…" style={{ height: 36, width: '100%', padding: '0 12px 0 32px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 14 }} />
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Nombre</th>
                                <th style={thStyle}>Usuario</th>
                                <th style={thStyle}>Roles</th>
                                <th style={thStyle}>Estado</th>
                                <th style={thStyle}>Último acceso</th>
                                <th style={{ ...thStyle, textAlign: 'right', paddingRight: 16 }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(u => (
                                <tr key={u.id} style={{ opacity: u.activo ? 1 : 0.6 }}>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: '50%', background: '#EEF6E2', color: '#2E8B3E', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>
                                                {u.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                            </span>
                                            <span style={{ fontWeight: 500 }}>{u.nombre}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontFamily: 'ui-monospace,monospace', fontSize: 12.5, color: '#52525b' }}>{u.usuario}</td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec' }}>
                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                            {u.roles.map(r => {
                                                const rc = ROLES_COLORS[r] ?? { bg: '#F4F4F5', fg: '#52525B' };
                                                return <span key={r} style={{ padding: '2px 8px', borderRadius: 999, background: rc.bg, color: rc.fg, fontSize: 12, fontWeight: 600 }}>{r}</span>;
                                            })}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec' }}>
                                        <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: u.activo ? '#EEF6E2' : '#F4F4F5', color: u.activo ? '#2E8B3E' : '#52525B' }}>
                                            {u.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontSize: 13, color: '#71717a', fontVariantNumeric: 'tabular-nums' }}>{u.ult}</td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                                            <button style={{ height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid #dfe7df', background: '#F6F9F5', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>✏ Editar</button>
                                            <button style={{ height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid #dfe7df', background: '#F6F9F5', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', color: '#52525b' }}>🔑 Contraseña</button>
                                            <button style={{ height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid #dfe7df', background: '#F6F9F5', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', color: u.activo ? '#b91c1c' : '#2E8B3E' }}>
                                                {u.activo ? '⊘ Desactivar' : '✓ Activar'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* New user modal */}
            {showModal && (
                <>
                    <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,.4)' }}></div>
                    <div style={{ position: 'fixed', zIndex: 41, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 480, maxWidth: '95vw', background: '#fff', borderRadius: 16, boxShadow: '0 24px 64px -16px rgba(16,40,24,.35)', overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef0ec', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 17, color: '#1f2d22' }}>Nuevo usuario</span>
                            <button onClick={() => setShowModal(false)} style={{ width: 30, height: 30, border: 'none', borderRadius: 8, background: '#F3F7F2', cursor: 'pointer', fontSize: 16 }}>✕</button>
                        </div>
                        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 14 }}>
                                    <span>Nombre completo *</span>
                                    <input style={{ height: 36, padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 14 }} />
                                </label>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 14 }}>
                                    <span>Nombre de usuario *</span>
                                    <input style={{ height: 36, padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'ui-monospace,monospace', fontSize: 13 }} />
                                </label>
                            </div>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 14 }}>
                                <span>Correo electrónico</span>
                                <input type="email" style={{ height: 36, padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 14 }} />
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 14 }}>
                                <span>Roles</span>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {Object.keys(ROLES_COLORS).map(r => {
                                        const rc = ROLES_COLORS[r];
                                        return <button key={r} style={{ height: 28, padding: '0 10px', borderRadius: 999, border: '1px solid #e4e4e7', background: '#fff', cursor: 'pointer', fontSize: 12.5, fontFamily: 'inherit' }}>{r}</button>;
                                    })}
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 14 }}>
                                    <span>Contraseña *</span>
                                    <input type="password" style={{ height: 36, padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 14 }} />
                                </label>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 14 }}>
                                    <span>Confirmar contraseña *</span>
                                    <input type="password" style={{ height: 36, padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 14 }} />
                                </label>
                            </div>
                        </div>
                        <div style={{ padding: '14px 20px', borderTop: '1px solid #eef0ec', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button onClick={() => setShowModal(false)} style={{ height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid #dfe7df', background: '#F6F9F5', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Cancelar</button>
                            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 16px', borderRadius: 10, border: 'none', background: '#2E8B3E', color: '#fff', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>✓ Crear usuario</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
