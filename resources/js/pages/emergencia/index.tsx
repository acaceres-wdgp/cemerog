import { useState } from 'react';

type TriageLevel = 'I' | 'II' | 'III' | 'IV' | 'V';

const TRIAGE_CONFIG: Record<TriageLevel, { bg: string; fg: string; label: string }> = {
    I: { bg: '#DC2626', fg: '#fff', label: 'Resucitación' },
    II: { bg: '#EA580C', fg: '#fff', label: 'Emergencia' },
    III: { bg: '#F59E0B', fg: '#3b2a00', label: 'Urgente' },
    IV: { bg: '#2E8B3E', fg: '#fff', label: 'Menos urgente' },
    V: { bg: '#2563EB', fg: '#fff', label: 'No urgente' },
};

const MOCK_EM_ROWS = [
    { id: 1, nivel: 'II' as TriageLevel, nombre: 'Rosa Fernández', meta: '55 años · F · 001-0000005-5', motivo: 'Dolor torácico irradiado al brazo izquierdo', cub: 'Cubículo 2', llegada: '09:20', trans: '42 min', tc: '#DC2626', medico: 'Dra. Ana Rodríguez', vital: 'PA 145/90', vitalHora: '09:45', vc: '#b91c1c', incompleto: false },
    { id: 2, nivel: 'III' as TriageLevel, nombre: 'NN-001 (sin identificar)', meta: '~30 años · M', motivo: 'Herida cortante mano derecha con sangrado activo', cub: 'Cubículo 1', llegada: '09:05', trans: '57 min', tc: '#EA580C', medico: 'Dr. Pedro Guzmán', vital: 'PA 118/76', vitalHora: '09:30', vc: '#1f2d22', incompleto: true },
    { id: 3, nivel: 'IV' as TriageLevel, nombre: 'Andrés García', meta: '51 años · M · 001-0000006-6', motivo: 'Fiebre alta 39.5 °C y cefalea intensa', cub: 'Cubículo 3', llegada: '09:55', trans: '7 min', tc: '#2E8B3E', medico: 'Dra. Sofía Castro', vital: 'T 39.5°C', vitalHora: '10:00', vc: '#b91c1c', incompleto: false },
    { id: 4, nivel: 'V' as TriageLevel, nombre: 'Pedro Torres', meta: '22 años · M', motivo: 'Corte superficial en dedo índice', cub: 'Sala de espera', llegada: '10:00', trans: '2 min', tc: '#1f2d22', medico: 'Pendiente triaje', vital: '—', vitalHora: '—', vc: '#71717a', incompleto: false },
];

const CUBS = [
    { label: 'Cubículo 1', sub: 'Triaje III', b: '#F59E0B', bg: '#FFFBEB', dot: '#F59E0B' },
    { label: 'Cubículo 2', sub: 'Triaje II', b: '#EA580C', bg: '#FFF7ED', dot: '#EA580C' },
    { label: 'Cubículo 3', sub: 'Triaje IV', b: '#B9DC8E', bg: '#F3F9EC', dot: '#2E8B3E' },
    { label: 'Cubículo 4', sub: 'Libre', b: '#e4e4e7', bg: '#fff', dot: '#d4d4d8' },
    { label: 'Cubículo 5', sub: 'Libre', b: '#e4e4e7', bg: '#fff', dot: '#d4d4d8' },
    { label: 'Observación', sub: 'Libre', b: '#e4e4e7', bg: '#fff', dot: '#d4d4d8' },
    { label: 'Reanimación', sub: 'Libre', b: '#e4e4e7', bg: '#fff', dot: '#d4d4d8' },
];

const MOCK_VITALS_TOMAS = [
    { hora: '09:45', pa: '145/90', fc: '102', fr: '20', t: '37.8', spo: '96', glu: '—', by: 'Enf. Jiménez' },
    { hora: '09:30', pa: '150/95', fc: '108', fr: '22', t: '38.1', spo: '95', glu: '—', by: 'Enf. Jiménez' },
];

const thStyle: React.CSSProperties = {
    textAlign: 'left', fontWeight: 600, fontSize: 11.5, letterSpacing: '.05em',
    textTransform: 'uppercase', color: '#56693f', padding: '0 12px', height: 40,
    background: '#F6FAF1', borderBottom: '1px solid #DCEBC9', whiteSpace: 'nowrap',
};

export default function EmergenciaIndex() {
    const [selId, setSelId] = useState<number | null>(null);
    const [showVitalForm, setShowVitalForm] = useState(false);
    const selPt = MOCK_EM_ROWS.find(r => r.id === selId);

    return (
        <div className="flex flex-col gap-5">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 26, color: '#1f2d22', margin: 0 }}>Emergencia</h1>
                    <p style={{ margin: '4px 0 0', color: '#5f6b64' }}>{MOCK_EM_ROWS.length} pacientes activos · 1 crítico</p>
                </div>
                <button style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', borderRadius: 10, border: 'none', background: '#2E8B3E', color: '#fff', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                    + Ingreso rápido
                </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {CUBS.map(c => (
                    <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 12px', borderRadius: 10, border: `1px solid ${c.b}`, background: c.bg, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, flexShrink: 0 }}></span>
                        <strong style={{ fontWeight: 600 }}>{c.label}</strong>
                        <span style={{ color: '#71717a' }}>{c.sub}</span>
                    </div>
                ))}
            </div>

            {selPt && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 16px', borderRadius: 12, background: '#fff', border: '1px solid #e3e9e3' }}>
                        <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 9, background: TRIAGE_CONFIG[selPt.nivel].bg, color: TRIAGE_CONFIG[selPt.nivel].fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bitter,Georgia,serif', fontWeight: 700 }}>{selPt.nivel}</span>
                        <div style={{ flex: '1 1 260px', minWidth: 0, lineHeight: 1.35 }}>
                            <div style={{ fontWeight: 600, color: '#1f2d22' }}>{selPt.nombre}</div>
                            <div style={{ fontSize: 13, color: '#71717a' }}>{selPt.meta}</div>
                        </div>
                        <span style={{ fontSize: 13, color: '#52605a', whiteSpace: 'nowrap' }}>En emergencia hace <strong style={{ fontWeight: 600, color: '#1f2d22' }}>{selPt.trans}</strong></span>
                        <button onClick={() => setSelId(null)} style={{ height: 34, padding: '0 12px', borderRadius: 10, fontWeight: 500, cursor: 'pointer', border: '1px solid #dfe7df', background: '#F6F9F5', fontFamily: 'inherit', fontSize: 14 }}>‹ Tablero</button>
                    </div>
                    <div style={{ flex: '2 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden' }}>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef0ec', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                <div>
                                    <div style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22' }}>Signos vitales</div>
                                    <div style={{ fontSize: 13, color: '#71717a' }}>{MOCK_VITALS_TOMAS.length} tomas · última a las {MOCK_VITALS_TOMAS[0].hora}</div>
                                </div>
                                <button onClick={() => setShowVitalForm(!showVitalForm)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid #dfe7df', background: '#F6F9F5', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                                    📊 Registrar toma
                                </button>
                            </div>
                            {showVitalForm && (
                                <div style={{ margin: '16px 20px 0', padding: 14, border: '1px solid #cfe3b8', background: '#F8FBF5', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10 }}>
                                        {[['Presión arterial *', '120/80', 'mmHg'], ['Frec. cardíaca *', '80', 'lpm'], ['Frec. resp. *', '16', 'rpm'], ['Temperatura *', '36.8', '°C'], ['SpO₂ *', '98', '%'], ['Glucemia', '—', 'mg/dL']].map(([l, ph, u]) => (
                                            <label key={l} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                <span style={{ fontSize: 12, color: '#52525b', fontWeight: 500 }}>{l}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', height: 36, border: '1px solid #e4e4e7', borderRadius: 10, background: '#fff' }}>
                                                    <input placeholder={ph} style={{ flex: 1, height: 34, border: 'none', outline: 'none', background: 'transparent', padding: '0 10px', fontFamily: 'inherit', fontWeight: 600, fontSize: 14 }} />
                                                    <span style={{ paddingRight: 10, fontSize: 11.5, color: '#a1a1aa' }}>{u}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                        <button onClick={() => setShowVitalForm(false)} style={{ height: 34, padding: '0 12px', borderRadius: 10, border: '1px solid #dfe7df', background: '#fff', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Cancelar</button>
                                        <button onClick={() => setShowVitalForm(false)} style={{ height: 34, padding: '0 12px', borderRadius: 10, border: 'none', background: '#2E8B3E', color: '#fff', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>✓ Guardar toma</button>
                                    </div>
                                </div>
                            )}
                            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {MOCK_VITALS_TOMAS.map((t, i) => (
                                    <div key={i} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #eef0ec', background: i === 0 ? '#F8FBF6' : '#fafafa' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <span style={{ fontWeight: 600, fontSize: 13 }}>{t.hora}</span>
                                            <span style={{ fontSize: 12, color: '#71717a' }}>Por {t.by}</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: 8, fontSize: 13 }}>
                                            {[['PA', t.pa, 'mmHg'], ['FC', t.fc, 'lpm'], ['FR', t.fr, 'rpm'], ['T', t.t, '°C'], ['SpO₂', t.spo, '%']].map(([k, v, u]) => (
                                                <div key={k}>
                                                    <div style={{ fontSize: 11, color: '#71717a', textTransform: 'uppercase', letterSpacing: '.05em' }}>{k}</div>
                                                    <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{v} <span style={{ fontSize: 11, fontWeight: 400, color: '#a1a1aa' }}>{u}</span></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div style={{ flex: '1 1 280px', minWidth: 0, background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22' }}>Triaje</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {(['I', 'II', 'III', 'IV', 'V'] as TriageLevel[]).map(l => (
                                <button key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px 0 6px', borderRadius: 10, cursor: 'pointer', border: selPt.nivel === l ? '2px solid #1f2d22' : '1px solid #e4e4e7', background: '#fff', fontWeight: 500, whiteSpace: 'nowrap', fontFamily: 'inherit', fontSize: 14 }}>
                                    <span style={{ width: 28, height: 28, borderRadius: 7, background: TRIAGE_CONFIG[l].bg, color: TRIAGE_CONFIG[l].fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bitter,Georgia,serif', fontWeight: 700, fontSize: 13 }}>{l}</span>
                                    {TRIAGE_CONFIG[l].label}
                                </button>
                            ))}
                        </div>
                        <div style={{ height: 1, background: '#eef0ec' }}></div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px', fontSize: 13 }}>
                            <span style={{ color: '#71717a' }}>Cubículo</span><span style={{ fontWeight: 500 }}>{selPt.cub}</span>
                            <span style={{ color: '#71717a' }}>Llegada</span><span>{selPt.llegada}</span>
                            <span style={{ color: '#71717a' }}>Médico</span><span>{selPt.medico}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button style={{ flex: 1, height: 36, borderRadius: 10, border: '1px solid #dfe7df', background: '#F6F9F5', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>🛏 Ingresar</button>
                            <button style={{ flex: 1, height: 36, borderRadius: 10, border: 'none', background: '#2E8B3E', color: '#fff', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Alta</button>
                        </div>
                    </div>
                </div>
            )}

            {!selPt && (
                <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...thStyle, paddingLeft: 20 }}>Prioridad</th>
                                    <th style={thStyle}>Paciente</th>
                                    <th style={thStyle}>Ubicación</th>
                                    <th style={thStyle}>Llegada</th>
                                    <th style={thStyle}>Tiempo</th>
                                    <th style={thStyle}>Médico</th>
                                    <th style={thStyle}>Último signo vital</th>
                                    <th style={{ ...thStyle, width: 44 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {MOCK_EM_ROWS.map(e => (
                                    <tr key={e.id} onClick={() => setSelId(e.id)} style={{ cursor: 'pointer' }}>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', verticalAlign: 'top', paddingLeft: 20 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 9, background: TRIAGE_CONFIG[e.nivel].bg, color: TRIAGE_CONFIG[e.nivel].fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bitter,Georgia,serif', fontWeight: 700, fontSize: 14 }}>{e.nivel}</span>
                                                <span style={{ fontSize: 12.5, color: '#52605a', whiteSpace: 'nowrap' }}>{TRIAGE_CONFIG[e.nivel].label}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', verticalAlign: 'top', minWidth: 220 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                <span style={{ fontWeight: 600, color: '#1f2d22' }}>{e.nombre}</span>
                                                {e.incompleto && <span style={{ padding: '2px 8px', borderRadius: 999, background: '#FEF3C7', color: '#92400E', fontSize: 11.5, fontWeight: 600 }}>Perfil incompleto</span>}
                                            </div>
                                            <div style={{ fontSize: 12.5, color: '#71717a' }}>{e.meta}</div>
                                            <div style={{ fontSize: 12.5, color: '#3f3f46', marginTop: 2 }}>{e.motivo}</div>
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{e.cub}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', verticalAlign: 'top', fontVariantNumeric: 'tabular-nums' }}>{e.llegada}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', verticalAlign: 'top' }}>
                                            <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: e.tc }}>{e.trans}</span>
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{e.medico}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', verticalAlign: 'top' }}>
                                            <div style={{ fontWeight: 600, color: e.vc, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>📈 {e.vital}</div>
                                            <div style={{ fontSize: 12, color: '#8a948e' }}>{e.vitalHora}</div>
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', color: '#a1a1aa' }}>›</td>
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
