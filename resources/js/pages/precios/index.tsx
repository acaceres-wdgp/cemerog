import { useState } from 'react';

const TABS = ['Consultas', 'Servicios', 'Cirugías', 'Tipos de habitación'] as const;
type Tab = typeof TABS[number];

const CONSULTAS = [
    { id: 1, nombre: 'Medicina General', precio: 1200, activo: true },
    { id: 2, nombre: 'Ginecología', precio: 1800, activo: true },
    { id: 3, nombre: 'Pediatría', precio: 1500, activo: true },
    { id: 4, nombre: 'Cardiología', precio: 2500, activo: true },
    { id: 5, nombre: 'Ortopedia', precio: 2200, activo: true },
    { id: 6, nombre: 'Dermatología', precio: 1600, activo: false },
];

const SERVICIOS = [
    { id: 1, codigo: 'SRV-001', nombre: 'Inyección intramuscular', precio: 350, activo: true },
    { id: 2, codigo: 'SRV-002', nombre: 'Canalización intravenosa', precio: 600, activo: true },
    { id: 3, codigo: 'SRV-003', nombre: 'Curación simple', precio: 500, activo: true },
    { id: 4, codigo: 'SRV-004', nombre: 'Sutura (hasta 5 cm)', precio: 1800, activo: true },
    { id: 5, codigo: 'SRV-005', nombre: 'Nebulización', precio: 450, activo: true },
    { id: 6, codigo: 'SRV-006', nombre: 'Electrocardiograma (ECG)', precio: 1200, activo: true },
    { id: 7, codigo: 'SRV-007', nombre: 'Toma de PAP', precio: 900, activo: true },
    { id: 8, codigo: 'SRV-008', nombre: 'Control de presión arterial', precio: 200, activo: true },
];

const CIRUGIAS = [
    { id: 1, codigo: 'CIR-001', nombre: 'Cesárea', precio: 85000, activo: true },
    { id: 2, codigo: 'CIR-002', nombre: 'Apendicectomía', precio: 65000, activo: true },
    { id: 3, codigo: 'CIR-003', nombre: 'Colecistectomía laparoscópica', precio: 75000, activo: true },
    { id: 4, codigo: 'CIR-004', nombre: 'Hernioplastia inguinal', precio: 55000, activo: true },
    { id: 5, codigo: 'CIR-005', nombre: 'Histerectomía', precio: 95000, activo: true },
];

const HABITACIONES = [
    { id: 1, tipo: 'Habitación privada', descripcion: 'Habitación individual con baño privado, TV y A/C', precioDia: 4500, activo: true },
    { id: 2, tipo: 'Habitación semi-privada', descripcion: 'Compartida entre 2 pacientes, baño compartido', precioDia: 2800, activo: true },
    { id: 3, tipo: 'Suite VIP', descripcion: 'Suite individual con sala de estar, frigobar y terraza', precioDia: 8500, activo: true },
    { id: 4, tipo: 'UCI/UTI', descripcion: 'Unidad de cuidados intensivos, monitoreo continuo', precioDia: 12000, activo: true },
    { id: 5, tipo: 'Sala general', descripcion: 'Sala con múltiples camas (hasta 6), baño compartido', precioDia: 1800, activo: true },
];

const thStyle: React.CSSProperties = {
    textAlign: 'left', fontWeight: 600, fontSize: 11.5, letterSpacing: '.05em',
    textTransform: 'uppercase', color: '#56693f', padding: '0 12px', height: 40,
    background: '#F6FAF1', borderBottom: '1px solid #DCEBC9', whiteSpace: 'nowrap',
};

const fmt = (v: number) => `RD$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

function PriceRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
    return (
        <tr>
            <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontWeight: 500 }}>{label}</td>
            <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{value}</td>
            <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', textAlign: 'right' }}>
                <button onClick={onEdit} style={{ height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid #dfe7df', background: '#F6F9F5', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>✏ Editar</button>
            </td>
        </tr>
    );
}

export default function PreciosIndex() {
    const [tab, setTab] = useState<Tab>('Consultas');

    const totalConsultas = CONSULTAS.filter(c => c.activo).length;
    const totalServicios = SERVICIOS.filter(s => s.activo).length;

    return (
        <div className="flex flex-col gap-5">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 26, color: '#1f2d22', margin: 0 }}>Catálogos de Precios</h1>
                    <p style={{ margin: '4px 0 0', color: '#5f6b64' }}>{totalConsultas} especialidades · {totalServicios} servicios · última actualización 10/10/2026</p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #e3e9e3' }}>
                {TABS.map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{ height: 38, padding: '0 16px', border: 'none', borderBottom: `2px solid ${tab === t ? '#2E8B3E' : 'transparent'}`, background: 'transparent', color: tab === t ? '#2E8B3E' : '#52525b', fontWeight: tab === t ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, marginBottom: -1 }}>
                        {t}
                    </button>
                ))}
            </div>

            {/* Consultas tab */}
            {tab === 'Consultas' && (
                <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #eef0ec', fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22' }}>Precios de consulta por especialidad</div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Especialidad</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>Precio de consulta</th>
                                    <th style={thStyle}>Estado</th>
                                    <th style={{ ...thStyle, textAlign: 'right', paddingRight: 20 }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {CONSULTAS.map(c => (
                                    <tr key={c.id} style={{ opacity: c.activo ? 1 : 0.6 }}>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontWeight: 500 }}>{c.nombre}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmt(c.precio)}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec' }}>
                                            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: c.activo ? '#EEF6E2' : '#F4F4F5', color: c.activo ? '#2E8B3E' : '#52525B' }}>
                                                {c.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 20px 12px 12px', borderBottom: '1px solid #eef0ec', textAlign: 'right' }}>
                                            <button style={{ height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid #dfe7df', background: '#F6F9F5', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>✏ Editar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Servicios tab */}
            {tab === 'Servicios' && (
                <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #eef0ec', fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22' }}>Servicios y procedimientos</div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Código</th>
                                    <th style={thStyle}>Servicio</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>Precio</th>
                                    <th style={thStyle}>Estado</th>
                                    <th style={{ ...thStyle, textAlign: 'right', paddingRight: 20 }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SERVICIOS.map(s => (
                                    <tr key={s.id} style={{ opacity: s.activo ? 1 : 0.6 }}>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontFamily: 'ui-monospace,monospace', fontSize: 12, fontWeight: 600, color: '#52525b' }}>{s.codigo}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontWeight: 500 }}>{s.nombre}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmt(s.precio)}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec' }}>
                                            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: s.activo ? '#EEF6E2' : '#F4F4F5', color: s.activo ? '#2E8B3E' : '#52525B' }}>
                                                {s.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 20px 12px 12px', borderBottom: '1px solid #eef0ec', textAlign: 'right' }}>
                                            <button style={{ height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid #dfe7df', background: '#F6F9F5', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>✏ Editar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Cirugías tab */}
            {tab === 'Cirugías' && (
                <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #eef0ec', fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22' }}>Cirugías y procedimientos quirúrgicos</div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Código</th>
                                    <th style={thStyle}>Procedimiento</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>Precio base</th>
                                    <th style={thStyle}>Estado</th>
                                    <th style={{ ...thStyle, textAlign: 'right', paddingRight: 20 }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {CIRUGIAS.map(c => (
                                    <tr key={c.id}>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontFamily: 'ui-monospace,monospace', fontSize: 12, fontWeight: 600, color: '#52525b' }}>{c.codigo}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontWeight: 500 }}>{c.nombre}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmt(c.precio)}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec' }}>
                                            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: '#EEF6E2', color: '#2E8B3E' }}>Activo</span>
                                        </td>
                                        <td style={{ padding: '12px 20px 12px 12px', borderBottom: '1px solid #eef0ec', textAlign: 'right' }}>
                                            <button style={{ height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid #dfe7df', background: '#F6F9F5', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>✏ Editar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tipos de habitación tab */}
            {tab === 'Tipos de habitación' && (
                <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #eef0ec', fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22' }}>Tarifas de habitación (por día)</div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Tipo de habitación</th>
                                    <th style={thStyle}>Descripción</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>Precio / día</th>
                                    <th style={thStyle}>Estado</th>
                                    <th style={{ ...thStyle, textAlign: 'right', paddingRight: 20 }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {HABITACIONES.map(h => (
                                    <tr key={h.id}>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontWeight: 600 }}>{h.tipo}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontSize: 13, color: '#52525b', maxWidth: 280 }}>{h.descripcion}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmt(h.precioDia)}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec' }}>
                                            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: '#EEF6E2', color: '#2E8B3E' }}>Activo</span>
                                        </td>
                                        <td style={{ padding: '12px 20px 12px 12px', borderBottom: '1px solid #eef0ec', textAlign: 'right' }}>
                                            <button style={{ height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid #dfe7df', background: '#F6F9F5', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>✏ Editar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
