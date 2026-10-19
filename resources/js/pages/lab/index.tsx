import { useState } from 'react';

const ORDENES = [
    { code: 'L-0034', paciente: 'María García', ini: 'MG', pruebas: ['Uroanálisis', 'Urocultivo'], estado: 'Pendiente', hora: '09:20', medico: 'Dra. Ana Rodríguez' },
    { code: 'L-0035', paciente: 'Juan Pérez', ini: 'JP', pruebas: ['BHC completa', 'Glucosa en ayunas', 'Creatinina'], estado: 'En proceso', hora: '09:45', medico: 'Dr. Pedro Guzmán' },
    { code: 'L-0036', paciente: 'Carmen López', ini: 'CL', pruebas: ['PCR', 'VSG', 'Hemocultivo'], estado: 'Completado', hora: '08:30', medico: 'Dra. Ana Rodríguez' },
    { code: 'L-0037', paciente: 'Luis Martínez', ini: 'LM', pruebas: ['Perfil lipídico', 'TSH', 'T4 libre'], estado: 'Pendiente', hora: '10:10', medico: 'Dr. Pedro Guzmán' },
    { code: 'L-0033', paciente: 'Rosa Fernández', ini: 'RF', pruebas: ['Troponina I', 'CK-MB', 'BNP'], estado: 'Completado', hora: '08:05', medico: 'Dra. Sofía Castro' },
];

const HISTORIAL = [
    { code: 'L-0030', fecha: '05/10/2026', paciente: 'María García', pruebas: 'Uroanálisis, Urocultivo', estado: 'Completado', medico: 'Dra. Ana Rodríguez' },
    { code: 'L-0029', fecha: '01/10/2026', paciente: 'Carmen López', pruebas: 'BHC, Glucosa, Creatinina', estado: 'Completado', medico: 'Dra. Ana Rodríguez' },
    { code: 'L-0028', fecha: '29/09/2026', paciente: 'Rosa Fernández', pruebas: 'Perfil lipídico completo', estado: 'Completado', medico: 'Dr. Pedro Guzmán' },
    { code: 'L-0027', fecha: '25/09/2026', paciente: 'Luis Martínez', pruebas: 'TSH, T4L', estado: 'Completado', medico: 'Dr. Pedro Guzmán' },
];

const ESTADO_COLORS: Record<string, { bg: string; fg: string }> = {
    'Pendiente': { bg: '#FEF3C7', fg: '#92400E' },
    'En proceso': { bg: '#DBEAFE', fg: '#1E40AF' },
    'Completado': { bg: '#DCFCE7', fg: '#166534' },
};

const thStyle: React.CSSProperties = {
    textAlign: 'left', fontWeight: 600, fontSize: 11.5, letterSpacing: '.05em',
    textTransform: 'uppercase', color: '#56693f', padding: '0 12px', height: 40,
    background: '#F6FAF1', borderBottom: '1px solid #DCEBC9', whiteSpace: 'nowrap',
};

const MOCK_RESULTS = [
    { n: 'Uroanálisis — aspecto', v: 'Turbio', ref: 'Transparente', out: true },
    { n: 'Leucocitos', v: '>100/campo', ref: '0-5/campo', out: true },
    { n: 'Nitritos', v: 'Positivo', ref: 'Negativo', out: true },
    { n: 'Proteínas', v: 'Trazas', ref: 'Negativo', out: false },
    { n: 'Glucosa', v: 'Negativo', ref: 'Negativo', out: false },
    { n: 'Bacterias', v: 'Abundantes', ref: 'Ausentes', out: true },
];

export default function LabIndex() {
    const [activeTab, setActiveTab] = useState<'ordenes' | 'historial'>('ordenes');
    const [selOrder, setSelOrder] = useState<string | null>('L-0034');
    const [query, setQuery] = useState('');

    const filtHistorial = HISTORIAL.filter(h =>
        !query || h.paciente.toLowerCase().includes(query.toLowerCase()) || h.code.includes(query)
    );

    const selOrden = ORDENES.find(o => o.code === selOrder);

    return (
        <div className="flex flex-col gap-5">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 26, color: '#1f2d22', margin: 0 }}>Laboratorio</h1>
                    <p style={{ margin: '4px 0 0', color: '#5f6b64' }}>Órdenes de hoy y resultados</p>
                </div>
                <button style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', borderRadius: 10, border: 'none', background: '#2E8B3E', color: '#fff', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                    + Nueva orden
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'inline-flex', background: '#F3F7F2', border: '1px solid #e3e9e3', borderRadius: 11, padding: 3, gap: 2, alignSelf: 'flex-start' }}>
                {([{ key: 'ordenes', label: 'Órdenes de hoy', n: ORDENES.length }, { key: 'historial', label: 'Historial de resultados', n: HISTORIAL.length }] as const).map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ whiteSpace: 'nowrap', height: 30, padding: '0 12px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 500, background: activeTab === t.key ? '#fff' : 'transparent', color: activeTab === t.key ? '#1f2d22' : '#52605a', boxShadow: activeTab === t.key ? '0 1px 3px rgba(0,0,0,.1)' : 'none', fontFamily: 'inherit', fontSize: 14 }}>
                        {t.label} <span style={{ color: '#8a948e', fontVariantNumeric: 'tabular-nums' }}>{t.n}</span>
                    </button>
                ))}
            </div>

            {activeTab === 'ordenes' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
                    {/* Orders table */}
                    <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden', flex: '2 1 500px', minWidth: 0 }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Código</th>
                                        <th style={thStyle}>Paciente</th>
                                        <th style={thStyle}>Pruebas</th>
                                        <th style={thStyle}>Estado</th>
                                        <th style={thStyle}>Hora</th>
                                        <th style={{ ...thStyle, width: 44 }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ORDENES.map(o => {
                                        const sc = ESTADO_COLORS[o.estado] ?? { bg: '#F4F4F5', fg: '#52525B' };
                                        return (
                                            <tr key={o.code} onClick={() => setSelOrder(o.code)} style={{ cursor: 'pointer', background: selOrder === o.code ? '#F8FBF6' : '#fff' }}>
                                                <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontFamily: 'ui-monospace,monospace', fontSize: 13, fontWeight: 600, color: '#1f2d22', whiteSpace: 'nowrap' }}>{o.code}</td>
                                                <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span style={{ width: 30, height: 30, flexShrink: 0, borderRadius: '50%', background: '#EEF6E2', color: '#2E8B3E', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>{o.ini}</span>
                                                        <span style={{ fontWeight: 500 }}>{o.paciente}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontSize: 13, color: '#52525b' }}>
                                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                        {o.pruebas.map(p => (
                                                            <span key={p} style={{ padding: '2px 8px', borderRadius: 999, background: '#F3F7F2', fontSize: 12 }}>{p}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec' }}>
                                                    <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.fg }}>{o.estado}</span>
                                                </td>
                                                <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>{o.hora}</td>
                                                <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', color: '#a1a1aa' }}>›</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Result panel */}
                    {selOrden && (
                        <div style={{ flex: '1 1 280px', minWidth: 0, background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden' }}>
                            <div style={{ padding: '14px 16px', borderBottom: '1px solid #eef0ec' }}>
                                <div style={{ fontFamily: 'ui-monospace,monospace', fontWeight: 700, fontSize: 14, color: '#1f2d22' }}>{selOrden.code}</div>
                                <div style={{ fontWeight: 600, fontSize: 15, color: '#1f2d22', marginTop: 2 }}>{selOrden.paciente}</div>
                                <div style={{ fontSize: 12, color: '#71717a' }}>{selOrden.medico} · {selOrden.hora}</div>
                            </div>
                            {selOrden.estado === 'Completado' ? (
                                <>
                                    <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', borderBottom: '1px solid #eef0ec', height: 36, alignItems: 'center', background: '#F6FAF1', fontSize: 11, fontWeight: 600, color: '#56693f', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                                        <span>Análisis</span><span>Resultado</span>
                                    </div>
                                    {MOCK_RESULTS.map((r, i) => (
                                        <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, padding: '8px 16px', borderBottom: '1px solid #f4f4f5', background: r.out ? '#FEF5F5' : '#fff' }}>
                                            <span style={{ color: '#3f3f46', fontSize: 13 }}>{r.n}</span>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: r.out ? '#b91c1c' : '#1f2d22', fontSize: 13 }}>{r.v}</span>
                                                <div style={{ fontSize: 11, color: '#a1a1aa' }}>Ref: {r.ref}</div>
                                            </div>
                                        </div>
                                    ))}
                                    <div style={{ padding: 14, display: 'flex', justifyContent: 'flex-end' }}>
                                        <button style={{ height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid #dfe7df', background: '#F6F9F5', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>🖨 Imprimir</button>
                                    </div>
                                </>
                            ) : (
                                <div style={{ padding: '24px 16px', textAlign: 'center', color: '#71717a', fontSize: 13 }}>
                                    Orden {selOrden.estado === 'Pendiente' ? 'pendiente de procesar' : 'en proceso'}
                                    <div style={{ marginTop: 12 }}>
                                        <button style={{ height: 34, padding: '0 14px', borderRadius: 10, border: 'none', background: '#2E8B3E', color: '#fff', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Ingresar resultados</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'historial' && (
                <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #eef0ec', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: '0 1 300px', minWidth: 200 }}>
                            <span style={{ position: 'absolute', left: 10, top: 10, color: '#71717a', pointerEvents: 'none' }}>🔍</span>
                            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por paciente o código…" style={{ height: 36, width: '100%', padding: '0 12px 0 32px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 14 }} />
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Código</th>
                                    <th style={thStyle}>Fecha</th>
                                    <th style={thStyle}>Paciente</th>
                                    <th style={thStyle}>Pruebas</th>
                                    <th style={thStyle}>Médico</th>
                                    <th style={{ ...thStyle, width: 44 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtHistorial.map(h => (
                                    <tr key={h.code} style={{ cursor: 'pointer' }}>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontFamily: 'ui-monospace,monospace', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{h.code}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>{h.fecha}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontWeight: 500 }}>{h.paciente}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontSize: 13, color: '#52525b' }}>{h.pruebas}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontSize: 13, color: '#52525b' }}>{h.medico}</td>
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
