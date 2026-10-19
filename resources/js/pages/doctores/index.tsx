import { useState } from 'react';

const ESPECIALIDADES = [
    {
        id: 1,
        nombre: 'Medicina General',
        precio: 1200,
        doctores: [
            { id: 1, nombre: 'Dra. Ana Rodríguez', exequatur: 'EX-001234', tel: '809-555-0101', activo: true, citas: 24 },
            { id: 2, nombre: 'Dr. Pedro Guzmán', exequatur: 'EX-001235', tel: '809-555-0102', activo: true, citas: 18 },
        ],
    },
    {
        id: 2,
        nombre: 'Ginecología',
        precio: 1800,
        doctores: [
            { id: 3, nombre: 'Dra. Sofía Castro', exequatur: 'EX-002011', tel: '809-555-0103', activo: true, citas: 10 },
        ],
    },
    {
        id: 3,
        nombre: 'Pediatría',
        precio: 1500,
        doctores: [
            { id: 4, nombre: 'Dr. Marco Reyes', exequatur: 'EX-003045', tel: '809-555-0104', activo: true, citas: 14 },
            { id: 5, nombre: 'Dra. Laura Mena', exequatur: 'EX-003046', tel: '809-555-0105', activo: false, citas: 0 },
        ],
    },
    {
        id: 4,
        nombre: 'Cardiología',
        precio: 2500,
        doctores: [
            { id: 6, nombre: 'Dr. Héctor Núñez', exequatur: 'EX-004200', tel: '809-555-0106', activo: true, citas: 8 },
        ],
    },
    {
        id: 5,
        nombre: 'Ortopedia',
        precio: 2200,
        doctores: [],
    },
];

const thStyle: React.CSSProperties = {
    textAlign: 'left', fontWeight: 600, fontSize: 11.5, letterSpacing: '.05em',
    textTransform: 'uppercase', color: '#56693f', padding: '0 12px', height: 40,
    background: '#F6FAF1', borderBottom: '1px solid #DCEBC9', whiteSpace: 'nowrap',
};

const fmt = (v: number) => `RD$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function DoctoresIndex() {
    const [selEsp, setSelEsp] = useState<number>(1);
    const [showModal, setShowModal] = useState(false);
    const [showDocModal, setShowDocModal] = useState(false);

    const esp = ESPECIALIDADES.find(e => e.id === selEsp)!;
    const totalDoctores = ESPECIALIDADES.reduce((s, e) => s + e.doctores.length, 0);

    return (
        <div className="flex flex-col gap-5">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 26, color: '#1f2d22', margin: 0 }}>Doctores y Especialidades</h1>
                    <p style={{ margin: '4px 0 0', color: '#5f6b64' }}>{ESPECIALIDADES.length} especialidades · {totalDoctores} médicos registrados</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setShowModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid #dfe7df', background: '#F6F9F5', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                        + Nueva especialidad
                    </button>
                    <button onClick={() => setShowDocModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', borderRadius: 10, border: 'none', background: '#2E8B3E', color: '#fff', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                        + Nuevo doctor
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Specialty sidebar */}
                <div style={{ flex: '0 0 240px', minWidth: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#56693f', padding: '0 4px 4px' }}>Especialidades</div>
                    {ESPECIALIDADES.map(e => (
                        <button key={e.id} onClick={() => setSelEsp(e.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, border: `1px solid ${selEsp === e.id ? '#B9DC8E' : '#e3e9e3'}`, background: selEsp === e.id ? '#EEF6E2' : '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'background .15s' }}>
                            <div>
                                <div style={{ fontWeight: selEsp === e.id ? 600 : 500, fontSize: 14, color: selEsp === e.id ? '#1f2d22' : '#374151' }}>{e.nombre}</div>
                                <div style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>{fmt(e.precio)} consulta</div>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: selEsp === e.id ? '#2E8B3E' : '#a1a1aa', background: selEsp === e.id ? '#D1FAE5' : '#F4F4F5', padding: '2px 7px', borderRadius: 999 }}>{e.doctores.length}</span>
                        </button>
                    ))}
                </div>

                {/* Doctors table */}
                <div style={{ flex: '1 1 400px', minWidth: 0, background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #eef0ec', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22' }}>{esp.nombre}</div>
                            <div style={{ fontSize: 13, color: '#5f6b64', marginTop: 2 }}>Consulta: <strong>{fmt(esp.precio)}</strong></div>
                        </div>
                        <button style={{ height: 30, padding: '0 10px', borderRadius: 8, border: '1px solid #dfe7df', background: '#F6F9F5', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>✏ Editar especialidad</button>
                    </div>

                    {esp.doctores.length === 0 ? (
                        <div style={{ padding: '48px 20px', textAlign: 'center', color: '#a1a1aa' }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>👨‍⚕️</div>
                            <div style={{ fontWeight: 500, marginBottom: 4 }}>Sin médicos asignados</div>
                            <div style={{ fontSize: 13 }}>Agrega un doctor a esta especialidad</div>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 580 }}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Nombre</th>
                                        <th style={thStyle}>Exequátur</th>
                                        <th style={thStyle}>Teléfono</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Citas este mes</th>
                                        <th style={thStyle}>Estado</th>
                                        <th style={{ ...thStyle, width: 44 }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {esp.doctores.map(d => (
                                        <tr key={d.id} style={{ opacity: d.activo ? 1 : 0.6 }}>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: '50%', background: '#DBEAFE', color: '#1E40AF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                                                        {d.nombre.replace('Dra. ', '').replace('Dr. ', '').split(' ').map(n => n[0]).slice(0, 2).join('')}
                                                    </span>
                                                    <span style={{ fontWeight: 500, fontSize: 14 }}>{d.nombre}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontFamily: 'ui-monospace,monospace', fontSize: 12.5, color: '#52525b' }}>{d.exequatur}</td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontSize: 13, color: '#52525b' }}>{d.tel}</td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{d.citas}</td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec' }}>
                                                <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: d.activo ? '#EEF6E2' : '#F4F4F5', color: d.activo ? '#2E8B3E' : '#52525B' }}>
                                                    {d.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', textAlign: 'center' }}>
                                                <button style={{ height: 28, padding: '0 8px', borderRadius: 6, border: '1px solid #dfe7df', background: '#F6F9F5', cursor: 'pointer', fontSize: 12 }}>✏</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* New specialty modal */}
            {showModal && (
                <>
                    <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,.4)' }}></div>
                    <div style={{ position: 'fixed', zIndex: 41, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 420, maxWidth: '95vw', background: '#fff', borderRadius: 16, boxShadow: '0 24px 64px -16px rgba(16,40,24,.35)', overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef0ec', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 17, color: '#1f2d22' }}>Nueva especialidad</span>
                            <button onClick={() => setShowModal(false)} style={{ width: 30, height: 30, border: 'none', borderRadius: 8, background: '#F3F7F2', cursor: 'pointer', fontSize: 16 }}>✕</button>
                        </div>
                        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 14 }}>
                                <span>Nombre de la especialidad *</span>
                                <input style={{ height: 36, padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 14 }} placeholder="Ej: Dermatología" />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 14 }}>
                                <span>Precio de consulta (RD$) *</span>
                                <div style={{ display: 'flex', alignItems: 'center', height: 36, border: '1px solid #e4e4e7', borderRadius: 10 }}>
                                    <span style={{ padding: '0 10px', color: '#71717a', fontSize: 13 }}>RD$</span>
                                    <input type="number" style={{ flex: 1, height: 34, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 14 }} placeholder="0.00" />
                                </div>
                            </label>
                        </div>
                        <div style={{ padding: '14px 20px', borderTop: '1px solid #eef0ec', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button onClick={() => setShowModal(false)} style={{ height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid #dfe7df', background: '#F6F9F5', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Cancelar</button>
                            <button style={{ height: 36, padding: '0 16px', borderRadius: 10, border: 'none', background: '#2E8B3E', color: '#fff', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>✓ Guardar</button>
                        </div>
                    </div>
                </>
            )}

            {/* New doctor modal */}
            {showDocModal && (
                <>
                    <div onClick={() => setShowDocModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,.4)' }}></div>
                    <div style={{ position: 'fixed', zIndex: 41, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 480, maxWidth: '95vw', background: '#fff', borderRadius: 16, boxShadow: '0 24px 64px -16px rgba(16,40,24,.35)', overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef0ec', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 17, color: '#1f2d22' }}>Nuevo doctor</span>
                            <button onClick={() => setShowDocModal(false)} style={{ width: 30, height: 30, border: 'none', borderRadius: 8, background: '#F3F7F2', cursor: 'pointer', fontSize: 16 }}>✕</button>
                        </div>
                        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 14 }}>
                                    <span>Nombre completo *</span>
                                    <input style={{ height: 36, padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 14 }} placeholder="Dr. / Dra." />
                                </label>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 14 }}>
                                    <span>No. de exequátur *</span>
                                    <input style={{ height: 36, padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'ui-monospace,monospace', fontSize: 13 }} placeholder="EX-000000" />
                                </label>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 14 }}>
                                    <span>Teléfono</span>
                                    <input style={{ height: 36, padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 14 }} placeholder="809-000-0000" />
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 14 }}>
                                    <span>Especialidad *</span>
                                    <div style={{ height: 36, padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: 14 }}>
                                        {esp.nombre} <span>▾</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '14px 20px', borderTop: '1px solid #eef0ec', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button onClick={() => setShowDocModal(false)} style={{ height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid #dfe7df', background: '#F6F9F5', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Cancelar</button>
                            <button style={{ height: 36, padding: '0 16px', borderRadius: 10, border: 'none', background: '#2E8B3E', color: '#fff', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>✓ Guardar doctor</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
