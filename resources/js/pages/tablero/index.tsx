import { useState } from 'react';
import StatusBadge from '@/components/cemerog/StatusBadge';

type AttState = 'espera' | 'consulta' | 'emergencia' | 'internado' | 'cirugia' | 'pendiente' | 'balance' | 'saldada' | 'cancelada';

const STATE_DOTS: Record<string, string> = {
    espera: '#D97706', consulta: '#2563EB', emergencia: '#DC2626', internado: '#7C3AED',
    cirugia: '#DB2777', pendiente: '#EA580C', balance: '#0891B2', saldada: '#2E8B3E', cancelada: '#A1A1AA',
};

const MOCK_ROWS = [
    { turno: 'T-05', no: 'A-MG01-000234', ini: 'MG', nombre: 'María García', ced: '001-0000001-1', edad: 42, sexo: 'F', area: 'Consulta', ubic: 'Consultorio 1', medico: 'Dra. Ana Rodríguez', hora: '08:15', estado: 'consulta' as AttState, fac: 'pendiente' as AttState, bar: '#2563EB', rowBg: '#EAF2FF' },
    { turno: 'T-06', no: 'A-MG01-000235', ini: 'JP', nombre: 'Juan Pérez', ced: '001-0000002-2', edad: 28, sexo: 'M', area: 'Consulta', ubic: 'Sala espera', medico: 'Dr. Pedro Guzmán', hora: '08:42', estado: 'espera' as AttState, fac: 'pendiente' as AttState, bar: '#D97706', rowBg: '#fff' },
    { turno: '—', no: 'A-MG01-000236', ini: 'CL', nombre: 'Carmen López', ced: '001-0000003-3', edad: 67, sexo: 'F', area: 'Internamiento', ubic: 'Hab. 102', medico: 'Dra. Ana Rodríguez', hora: '07:30', estado: 'internado' as AttState, fac: 'balance' as AttState, bar: '#7C3AED', rowBg: '#fff' },
    { turno: 'T-07', no: 'A-MG01-000237', ini: 'LM', nombre: 'Luis Martínez', ced: '001-0000004-4', edad: 35, sexo: 'M', area: 'Consulta', ubic: 'Sala espera', medico: 'Dr. Pedro Guzmán', hora: '09:05', estado: 'espera' as AttState, fac: 'pendiente' as AttState, bar: '#D97706', rowBg: '#fff' },
    { turno: '—', no: 'A-MG01-000238', ini: 'RF', nombre: 'Rosa Fernández', ced: '001-0000005-5', edad: 55, sexo: 'F', area: 'Emergencia', ubic: 'Cubículo 2', medico: 'Dra. Sofía Castro', hora: '09:20', estado: 'emergencia' as AttState, fac: 'pendiente' as AttState, bar: '#DC2626', rowBg: '#FEF5F5' },
    { turno: 'T-08', no: 'A-MG01-000239', ini: 'AG', nombre: 'Andrés García', ced: '001-0000006-6', edad: 51, sexo: 'M', area: 'Consulta', ubic: 'Sala espera', medico: 'Dra. Ana Rodríguez', hora: '09:30', estado: 'espera' as AttState, fac: 'saldada' as AttState, bar: '#D97706', rowBg: '#F1F8EA' },
];

const MOCK_CITAS = [
    { h: '10:00', pac: 'Ana Gómez', motivo: 'Control rutinario', tel: '809-555-0101', doc: 'Dra. Ana Rodríguez', tipo: 'Medicina general', estado: 'Pendiente', sbg: '#FEF3C7', sfg: '#92400E', pend: true, bg: '#fff', dim: '#1f2d22' },
    { h: '10:30', pac: 'Pedro Díaz', motivo: 'Evaluación cardíaca', tel: '809-555-0202', doc: 'Dr. Pedro Guzmán', tipo: 'Cardiología', estado: 'Confirmada', sbg: '#DBEAFE', sfg: '#1E40AF', pend: true, bg: '#fff', dim: '#1f2d22' },
    { h: '11:00', pac: 'Luisa Torres', motivo: 'Vacuna niño', tel: '809-555-0303', doc: 'Dra. Sofía Castro', tipo: 'Pediatría', estado: 'En lista', sbg: '#DCFCE7', sfg: '#166534', pend: false, bg: '#F8FBF6', dim: '#71717a' },
    { h: '11:30', pac: 'Carlos Reyes', motivo: 'Revisión tensión', tel: '809-555-0404', doc: 'Dra. Ana Rodríguez', tipo: 'Medicina general', estado: 'Pendiente', sbg: '#FEF3C7', sfg: '#92400E', pend: true, bg: '#fff', dim: '#1f2d22' },
    { h: '14:00', pac: 'Marta Caba', motivo: 'Consulta dermatología', tel: '809-555-0505', doc: 'Dr. Pedro Guzmán', tipo: 'Cardiología', estado: 'Pendiente', sbg: '#FEF3C7', sfg: '#92400E', pend: true, bg: '#fff', dim: '#1f2d22' },
];

const TABS = [
    { key: 'todas', label: 'Todas', n: 6 },
    { key: 'espera', label: 'En espera', n: 3 },
    { key: 'consulta', label: 'En consulta', n: 1 },
    { key: 'emergencia', label: 'Emergencia', n: 1 },
    { key: 'internados', label: 'Internados', n: 1 },
];

const thStyle: React.CSSProperties = {
    textAlign: 'left', fontWeight: 600, fontSize: 11.5, letterSpacing: '.05em',
    textTransform: 'uppercase', color: '#56693f', padding: '0 12px', height: 40,
    background: '#F6FAF1', borderBottom: '1px solid #DCEBC9', whiteSpace: 'nowrap',
};

const STATS = [
    { label: 'En espera', n: 3, dot: '#D97706', nc: '#92400E', sub: '3 en sala · est. 40 min' },
    { label: 'En consulta', n: 1, dot: '#2563EB', nc: '#1E40AF', sub: 'Consultorio 1' },
    { label: 'Emergencia', n: 1, dot: '#DC2626', nc: '#991B1B', sub: 'Cubículo 2' },
    { label: 'Internados', n: 1, dot: '#7C3AED', nc: '#5B21B6', sub: 'Hab. 102' },
    { label: 'Total hoy', n: 18, dot: '#2E8B3E', nc: '#1f2d22', sub: '12 completados' },
];

export default function TableroIndex() {
    const [activeTab, setActiveTab] = useState('todas');
    const [citaTab, setCitaTab] = useState('pendientes');

    const filteredRows = activeTab === 'todas' ? MOCK_ROWS
        : MOCK_ROWS.filter(r => r.estado === activeTab || (activeTab === 'internados' && r.estado === 'internado'));

    return (
        <div className="flex flex-col gap-5">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ margin: 0, fontFamily: 'Bitter,Georgia,serif', fontSize: 28, fontWeight: 600, color: '#1f2d22', lineHeight: 1.2 }}>Tablero de atenciones</h1>
                    <p style={{ margin: '4px 0 0', color: '#5f6b64' }}>Pacientes en la clínica y su estado actual.</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: 10, fontSize: 13 }}>
                        <span style={{ color: '#71717a' }}>Turno actual</span>
                        <strong style={{ fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>T-08</strong>
                    </div>
                    <button style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid #dfe7df', background: '#F6F9F5', fontWeight: 500, cursor: 'pointer' }}>
                        📢 Llamar siguiente
                    </button>
                    <button style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', borderRadius: 10, border: 'none', background: '#2E8B3E', color: '#fff', fontWeight: 500, cursor: 'pointer' }}>
                        + Nueva atención
                    </button>
                </div>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
                {STATS.map(k => (
                    <div key={k.label} style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: '#52605a', whiteSpace: 'nowrap' }}>
                            <span style={{ flexShrink: 0, width: 7, height: 7, borderRadius: '50%', background: k.dot }}></span>
                            {k.label}
                        </div>
                        <div style={{ fontFamily: 'Bitter,Georgia,serif', fontSize: 34, fontWeight: 700, lineHeight: 1.1, color: k.nc, fontVariantNumeric: 'tabular-nums' }}>{k.n}</div>
                        <div style={{ fontSize: 12.5, color: '#8a948e' }}>{k.sub}</div>
                    </div>
                ))}
            </div>

            {/* Atenciones table */}
            <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontFamily: 'Bitter,Georgia,serif', fontSize: 18, fontWeight: 600, color: '#1f2d22' }}>Atenciones</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 24, height: 22, padding: '0 7px', borderRadius: 999, background: '#F3F7F2', border: '1px solid #e3e9e3', fontSize: 12, fontWeight: 600 }}>{filteredRows.length}</span>
                    </div>
                    <div style={{ display: 'inline-flex', background: '#F3F7F2', border: '1px solid #e3e9e3', borderRadius: 11, padding: 3, gap: 2 }}>
                        {TABS.map(t => (
                            <button key={t.key} onClick={() => setActiveTab(t.key)}
                                style={{ whiteSpace: 'nowrap', height: 30, padding: '0 12px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 500, background: activeTab === t.key ? '#fff' : 'transparent', color: activeTab === t.key ? '#1f2d22' : '#52605a', boxShadow: activeTab === t.key ? '0 1px 3px rgba(0,0,0,.1)' : 'none' }}>
                                {t.label} <span style={{ color: '#71717a', fontWeight: 400 }}>{t.n}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                        <thead>
                            <tr>
                                <th style={{ ...thStyle, paddingLeft: 16 }}>Turno</th>
                                <th style={thStyle}>No. atención</th>
                                <th style={thStyle}>Paciente</th>
                                <th style={thStyle}>Área</th>
                                <th style={thStyle}>Médico</th>
                                <th style={thStyle}>Llegada</th>
                                <th style={thStyle}>Facturación</th>
                                <th style={{ ...thStyle, width: 48 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.map(r => (
                                <tr key={r.no} style={{ cursor: 'pointer', background: r.rowBg }}>
                                    <td style={{ padding: '12px 16px 12px 13px', borderBottom: '1px solid #eef0ec', borderLeft: `3px solid ${r.bar}`, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{r.turno}</td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontFamily: 'ui-monospace,monospace', fontSize: 13, fontWeight: 600, color: '#1f2d22', whiteSpace: 'nowrap' }}>{r.no}</td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: '50%', background: '#EEF6E2', color: '#2E8B3E', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>{r.ini}</span>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{r.nombre}</div>
                                                <div style={{ fontSize: 12, color: '#71717a' }}>{r.ced} · {r.edad} años · {r.sexo}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec' }}>
                                        <div>{r.area}</div>
                                        <div style={{ fontSize: 12, color: '#71717a' }}>{r.ubic}</div>
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec' }}>{r.medico}</td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontVariantNumeric: 'tabular-nums' }}>{r.hora}</td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec' }}>
                                        <StatusBadge state={r.fac} />
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', color: '#71717a' }}>›</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Citas de hoy */}
            <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22' }}>Citas de hoy</div>
                        <div style={{ fontSize: 13, color: '#71717a' }}>5 citas · 3 pendientes de confirmar</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ display: 'inline-flex', background: '#F3F7F2', border: '1px solid #e3e9e3', borderRadius: 11, padding: 3, gap: 2 }}>
                            {[{ key: 'pendientes', label: 'Pendientes', n: 3 }, { key: 'todas', label: 'Todas', n: 5 }].map(t => (
                                <button key={t.key} onClick={() => setCitaTab(t.key)} style={{ whiteSpace: 'nowrap', height: 30, padding: '0 12px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: 13, background: citaTab === t.key ? '#fff' : 'transparent', color: citaTab === t.key ? '#1f2d22' : '#52605a', boxShadow: citaTab === t.key ? '0 1px 3px rgba(0,0,0,.1)' : 'none' }}>
                                    {t.label} <span style={{ color: '#a1a1aa', fontVariantNumeric: 'tabular-nums' }}>{t.n}</span>
                                </button>
                            ))}
                        </div>
                        <button style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid #dfe7df', background: '#F6F9F5', fontWeight: 500, cursor: 'pointer' }}>
                            📅 Ver agenda
                        </button>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 860 }}>
                        <thead>
                            <tr>
                                {['Hora', 'Paciente', 'Teléfono', 'Médico', 'Tipo', 'Cita', 'Acciones'].map(h => (
                                    <th key={h} style={{ ...thStyle, textAlign: h === 'Acciones' ? 'right' : 'left' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {MOCK_CITAS.filter(c => citaTab === 'todas' || c.pend).map((c, i) => (
                                <tr key={i} style={{ background: c.bg }}>
                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eef0ec', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: c.dim }}>{c.h}</td>
                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eef0ec' }}>
                                        <div style={{ fontWeight: 500, color: c.dim }}>{c.pac}</div>
                                        <div style={{ fontSize: 12, color: '#71717a' }}>{c.motivo}</div>
                                    </td>
                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eef0ec', whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontVariantNumeric: 'tabular-nums', color: c.dim }}>{c.tel}</span>
                                            <a href={`tel:${c.tel}`} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #e4e4e7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#2E8B3E', fontSize: 14 }}>📞</a>
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eef0ec', whiteSpace: 'nowrap', color: '#52525b' }}>{c.doc}</td>
                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eef0ec', whiteSpace: 'nowrap', color: '#52525b' }}>{c.tipo}</td>
                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eef0ec' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', padding: '2px 9px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: c.sbg, color: c.sfg }}>{c.estado}</span>
                                    </td>
                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eef0ec', textAlign: 'right' }}>
                                        {c.pend && (
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                                                <button style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 10px', borderRadius: 8, border: 'none', background: '#2E8B3E', color: '#fff', fontWeight: 500, fontSize: 12.5, cursor: 'pointer' }}>
                                                    + Agregar a la lista
                                                </button>
                                                <button style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 10px', borderRadius: 8, border: '1px solid #dfe7df', background: '#F6F9F5', color: '#52525b', fontWeight: 500, fontSize: 12.5, cursor: 'pointer' }}>
                                                    ✕ Descartar
                                                </button>
                                            </div>
                                        )}
                                        {!c.pend && (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#2E8B3E', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                                ✓ En lista · T-03
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
