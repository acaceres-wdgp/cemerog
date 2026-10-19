import { useState } from 'react';

const MOCK_ESTUDIOS = [
    { code: 'I-0012', fecha: '12/10/2026', paciente: 'Rosa Fernández', ini: 'RF', modalidad: 'Radiografía', estudio: 'Rx Tórax PA y lateral', estado: 'Pendiente', medico: 'Dra. Ana Rodríguez' },
    { code: 'I-0011', fecha: '12/10/2026', paciente: 'Carmen López', ini: 'CL', modalidad: 'Eco', estudio: 'Ecografía abdominal', estado: 'En proceso', medico: 'Dr. Pedro Guzmán' },
    { code: 'I-0010', fecha: '11/10/2026', paciente: 'Luis Martínez', ini: 'LM', modalidad: 'Eco', estudio: 'Ecografía tiroidea', estado: 'Completado', medico: 'Dra. Sofía Castro' },
    { code: 'I-0009', fecha: '10/10/2026', paciente: 'Juan Pérez', ini: 'JP', modalidad: 'TAC', estudio: 'TAC de cráneo simple', estado: 'Completado', medico: 'Dr. Pedro Guzmán' },
    { code: 'I-0008', fecha: '09/10/2026', paciente: 'María García', ini: 'MG', modalidad: 'Eco', estudio: 'Eco ginecológico transvaginal', estado: 'Completado', medico: 'Dra. Ana Rodríguez' },
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

export default function ImgIndex() {
    const [query, setQuery] = useState('');
    const [filterEstado, setFilterEstado] = useState('Todos');
    const [selCode, setSelCode] = useState<string | null>('I-0012');

    const filtered = MOCK_ESTUDIOS.filter(e =>
        (filterEstado === 'Todos' || e.estado === filterEstado) &&
        (!query || e.paciente.toLowerCase().includes(query.toLowerCase()) || e.code.includes(query))
    );

    const selEstudio = MOCK_ESTUDIOS.find(e => e.code === selCode);

    return (
        <div className="flex flex-col gap-5">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 26, color: '#1f2d22', margin: 0 }}>Imágenes</h1>
                    <p style={{ margin: '4px 0 0', color: '#5f6b64' }}>Estudios de imágenes diagnósticas</p>
                </div>
                <button style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', borderRadius: 10, border: 'none', background: '#2E8B3E', color: '#fff', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                    + Nueva orden
                </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
                {/* Table */}
                <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden', flex: '2 1 500px', minWidth: 0 }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #eef0ec', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: '0 1 260px', minWidth: 180 }}>
                            <span style={{ position: 'absolute', left: 10, top: 10, color: '#71717a', pointerEvents: 'none' }}>🔍</span>
                            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar paciente o código…" style={{ height: 36, width: '100%', padding: '0 12px 0 32px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 14 }} />
                        </div>
                        <div style={{ display: 'inline-flex', background: '#F3F7F2', border: '1px solid #e3e9e3', borderRadius: 11, padding: 3, gap: 2 }}>
                            {['Todos', 'Pendiente', 'En proceso', 'Completado'].map(s => (
                                <button key={s} onClick={() => setFilterEstado(s)} style={{ height: 28, padding: '0 10px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: 12.5, background: filterEstado === s ? '#fff' : 'transparent', color: filterEstado === s ? '#1f2d22' : '#52605a', boxShadow: filterEstado === s ? '0 1px 3px rgba(0,0,0,.1)' : 'none', fontFamily: 'inherit' }}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Código</th>
                                    <th style={thStyle}>Fecha</th>
                                    <th style={thStyle}>Paciente</th>
                                    <th style={thStyle}>Estudio</th>
                                    <th style={thStyle}>Modalidad</th>
                                    <th style={thStyle}>Estado</th>
                                    <th style={{ ...thStyle, width: 44 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(e => {
                                    const sc = ESTADO_COLORS[e.estado] ?? { bg: '#F4F4F5', fg: '#52525B' };
                                    return (
                                        <tr key={e.code} onClick={() => setSelCode(e.code)} style={{ cursor: 'pointer', background: selCode === e.code ? '#F8FBF6' : '#fff' }}>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontFamily: 'ui-monospace,monospace', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{e.code}</td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>{e.fecha}</td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontWeight: 500 }}>{e.paciente}</td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontSize: 13 }}>{e.estudio}</td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec' }}>
                                                <span style={{ padding: '2px 8px', borderRadius: 999, background: '#F3F7F2', fontSize: 12, fontWeight: 500 }}>{e.modalidad}</span>
                                            </td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec' }}>
                                                <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.fg }}>{e.estado}</span>
                                            </td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', color: '#a1a1aa' }}>›</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detail panel */}
                {selEstudio && (
                    <div style={{ flex: '1 1 300px', minWidth: 0, background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden' }}>
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid #eef0ec' }}>
                            <div style={{ fontFamily: 'ui-monospace,monospace', fontWeight: 700, fontSize: 14, color: '#1f2d22' }}>{selEstudio.code}</div>
                            <div style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 17, color: '#1f2d22', marginTop: 4 }}>{selEstudio.estudio}</div>
                            <div style={{ fontSize: 13, color: '#71717a', marginTop: 2 }}>{selEstudio.paciente} · {selEstudio.fecha}</div>
                        </div>
                        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {selEstudio.estado === 'Completado' ? (
                                <>
                                    <div style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e4e4e7', background: '#fafafa' }}>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Imagen adjunta</div>
                                        <div style={{ height: 140, borderRadius: 8, background: 'linear-gradient(135deg,#e4e4e7 0%,#d4d4d8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a', fontSize: 13 }}>
                                            🖼 Imagen no disponible en mock
                                        </div>
                                    </div>
                                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <span style={{ fontWeight: 500, fontSize: 13 }}>Hallazgos</span>
                                        <textarea rows={3} style={{ padding: '8px 12px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 13 }} defaultValue="Parénquima pulmonar con infiltrado intersticial bilateral en campos medios e inferiores. Sin derrame pleural. Silueta cardíaca normal."></textarea>
                                    </label>
                                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <span style={{ fontWeight: 500, fontSize: 13 }}>Conclusión</span>
                                        <textarea rows={2} style={{ padding: '8px 12px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 13 }} defaultValue="Hallazgos compatibles con neumonía bilateral. Correlacionar con clínica y laboratorio."></textarea>
                                    </label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button style={{ flex: 1, height: 36, borderRadius: 10, border: '1px solid #dfe7df', background: '#F6F9F5', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>🖨 Imprimir</button>
                                        <button style={{ flex: 1, height: 36, borderRadius: 10, border: 'none', background: '#2E8B3E', color: '#fff', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>✓ Guardar</button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ padding: '12px', borderRadius: 10, border: '2px dashed #e4e4e7', textAlign: 'center', color: '#71717a', fontSize: 13 }}>
                                        📎 Adjuntar imagen
                                    </div>
                                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <span style={{ fontWeight: 500, fontSize: 13 }}>Hallazgos</span>
                                        <textarea rows={3} style={{ padding: '8px 12px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 13 }} placeholder="Describe los hallazgos del estudio…"></textarea>
                                    </label>
                                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <span style={{ fontWeight: 500, fontSize: 13 }}>Conclusión</span>
                                        <textarea rows={2} style={{ padding: '8px 12px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 13 }} placeholder="Conclusión diagnóstica…"></textarea>
                                    </label>
                                    <button style={{ height: 36, borderRadius: 10, border: 'none', background: '#2E8B3E', color: '#fff', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>✓ Guardar y completar</button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
