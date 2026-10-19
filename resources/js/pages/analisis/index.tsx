import { useState } from 'react';

const CATEGORIAS_LAB = ['Hematología', 'Química sanguínea', 'Orina', 'Microbiología', 'Inmunología', 'Hormonas'];

const ANALISIS_CATALOG = [
    { id: 1, codigo: 'LAB-001', nombre: 'Hemograma completo (BHC)', cat: 'Hematología', precio: 650, turnaround: '2h', activo: true, params: ['Hemoglobina', 'Hematocrito', 'Leucocitos', 'Plaquetas', 'VCM', 'HCM', 'CHCM', 'Neutrófilos %', 'Linfocitos %', 'Monocitos %'] },
    { id: 2, codigo: 'LAB-002', nombre: 'Glucosa en ayunas', cat: 'Química sanguínea', precio: 250, turnaround: '1h', activo: true, params: ['Glucosa'] },
    { id: 3, codigo: 'LAB-003', nombre: 'Perfil lipídico', cat: 'Química sanguínea', precio: 900, turnaround: '3h', activo: true, params: ['Colesterol total', 'Triglicéridos', 'HDL', 'LDL', 'VLDL', 'Índice aterogénico'] },
    { id: 4, codigo: 'LAB-004', nombre: 'Examen general de orina (EGO)', cat: 'Orina', precio: 350, turnaround: '1h', activo: true, params: ['Aspecto', 'Color', 'pH', 'Densidad', 'Proteínas', 'Glucosa', 'Cetonas', 'Bilirrubina', 'Leucocitos', 'Eritrocitos'] },
    { id: 5, codigo: 'LAB-005', nombre: 'Creatinina sérica', cat: 'Química sanguínea', precio: 320, turnaround: '2h', activo: true, params: ['Creatinina', 'BUN', 'Relación BUN/Creatinina'] },
    { id: 6, codigo: 'LAB-006', nombre: 'TSH ultrasensible', cat: 'Hormonas', precio: 1200, turnaround: '4h', activo: true, params: ['TSH', 'T3 libre', 'T4 libre'] },
    { id: 7, codigo: 'LAB-007', nombre: 'Cultivo de orina', cat: 'Microbiología', precio: 850, turnaround: '72h', activo: true, params: ['Microorganismo', 'UFC/mL', 'Antibiograma'] },
    { id: 8, codigo: 'LAB-008', nombre: 'PCR cuantitativa', cat: 'Inmunología', precio: 700, turnaround: '2h', activo: true, params: ['Proteína C reactiva'] },
    { id: 9, codigo: 'LAB-009', nombre: 'Perfil hepático', cat: 'Química sanguínea', precio: 1100, turnaround: '3h', activo: false, params: ['TGO/AST', 'TGP/ALT', 'Fosfatasa alcalina', 'GGT', 'Bilirrubina total', 'Bilirrubina directa', 'Proteínas totales', 'Albúmina'] },
];

const thStyle: React.CSSProperties = {
    textAlign: 'left', fontWeight: 600, fontSize: 11.5, letterSpacing: '.05em',
    textTransform: 'uppercase', color: '#56693f', padding: '0 12px', height: 40,
    background: '#F6FAF1', borderBottom: '1px solid #DCEBC9', whiteSpace: 'nowrap',
};

const fmt = (v: number) => `RD$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function AnalisisIndex() {
    const [query, setQuery] = useState('');
    const [catFilter, setCatFilter] = useState('');
    const [selId, setSelId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);

    const filtered = ANALISIS_CATALOG.filter(a =>
        (!catFilter || a.cat === catFilter) &&
        (!query || a.nombre.toLowerCase().includes(query.toLowerCase()) || a.codigo.toLowerCase().includes(query.toLowerCase()))
    );

    const sel = ANALISIS_CATALOG.find(a => a.id === selId);

    return (
        <div className="flex flex-col gap-5">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 26, color: '#1f2d22', margin: 0 }}>Catálogo de Análisis</h1>
                    <p style={{ margin: '4px 0 0', color: '#5f6b64' }}>{ANALISIS_CATALOG.filter(a => a.activo).length} análisis activos · {CATEGORIAS_LAB.length} categorías</p>
                </div>
                <button onClick={() => setShowModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', borderRadius: 10, border: 'none', background: '#2E8B3E', color: '#fff', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                    + Nuevo análisis
                </button>
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Main table */}
                <div style={{ flex: '2 1 480px', minWidth: 0, background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden' }}>
                    {/* Filters */}
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #eef0ec', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: '0 1 260px', minWidth: 160 }}>
                            <span style={{ position: 'absolute', left: 10, top: 10, color: '#71717a', pointerEvents: 'none', fontSize: 13 }}>🔍</span>
                            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar análisis…" style={{ height: 36, width: '100%', padding: '0 12px 0 30px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 14 }} />
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button onClick={() => setCatFilter('')} style={{ height: 30, padding: '0 10px', borderRadius: 999, border: `1px solid ${!catFilter ? '#B9DC8E' : '#e4e4e7'}`, background: !catFilter ? '#EEF6E2' : '#fff', color: !catFilter ? '#2E8B3E' : '#52525b', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: !catFilter ? 600 : 400 }}>Todos</button>
                            {CATEGORIAS_LAB.map(c => (
                                <button key={c} onClick={() => setCatFilter(c === catFilter ? '' : c)} style={{ height: 30, padding: '0 10px', borderRadius: 999, border: `1px solid ${catFilter === c ? '#B9DC8E' : '#e4e4e7'}`, background: catFilter === c ? '#EEF6E2' : '#fff', color: catFilter === c ? '#2E8B3E' : '#52525b', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: catFilter === c ? 600 : 400 }}>{c}</button>
                            ))}
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Código</th>
                                    <th style={thStyle}>Nombre del análisis</th>
                                    <th style={thStyle}>Categoría</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>Precio</th>
                                    <th style={thStyle}>Turnaround</th>
                                    <th style={thStyle}>Estado</th>
                                    <th style={{ ...thStyle, width: 44 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(a => (
                                    <tr key={a.id} onClick={() => setSelId(a.id === selId ? null : a.id)} style={{ cursor: 'pointer', background: selId === a.id ? '#F8FBF6' : (a.activo ? '#fff' : '#FAFAFA'), opacity: a.activo ? 1 : 0.65 }}>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontFamily: 'ui-monospace,monospace', fontSize: 12, fontWeight: 600, color: '#52525b' }}>{a.codigo}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontWeight: 500, fontSize: 14 }}>{a.nombre}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: 999, background: '#F3F7F2', fontSize: 12, color: '#52525b' }}>{a.cat}</span>
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmt(a.precio)}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontSize: 13, color: '#52525b' }}>{a.turnaround}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec' }}>
                                            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: a.activo ? '#EEF6E2' : '#F4F4F5', color: a.activo ? '#2E8B3E' : '#52525B' }}>
                                                {a.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', color: '#a1a1aa', textAlign: 'center' }}>›</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detail panel */}
                {sel && (
                    <div style={{ flex: '1 1 260px', minWidth: 0, background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden' }}>
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid #eef0ec', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 15, color: '#1f2d22' }}>{sel.nombre}</div>
                                <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11.5, color: '#71717a', marginTop: 2 }}>{sel.codigo}</div>
                            </div>
                            <button onClick={() => setSelId(null)} style={{ width: 26, height: 26, border: 'none', borderRadius: 6, background: '#F3F7F2', cursor: 'pointer', fontSize: 12 }}>✕</button>
                        </div>
                        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <div style={{ padding: '10px 12px', borderRadius: 10, background: '#F3F7F2' }}>
                                    <div style={{ fontSize: 10.5, fontWeight: 600, color: '#56693f', textTransform: 'uppercase', letterSpacing: '.05em' }}>Precio</div>
                                    <div style={{ fontWeight: 700, fontSize: 16, fontVariantNumeric: 'tabular-nums', color: '#1f2d22', marginTop: 2 }}>{fmt(sel.precio)}</div>
                                </div>
                                <div style={{ padding: '10px 12px', borderRadius: 10, background: '#F3F7F2' }}>
                                    <div style={{ fontSize: 10.5, fontWeight: 600, color: '#56693f', textTransform: 'uppercase', letterSpacing: '.05em' }}>Turnaround</div>
                                    <div style={{ fontWeight: 700, fontSize: 16, color: '#1f2d22', marginTop: 2 }}>{sel.turnaround}</div>
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#56693f', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Parámetros ({sel.params.length})</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                    {sel.params.map((p, i) => (
                                        <div key={i} style={{ padding: '7px 10px', fontSize: 13, borderBottom: '1px solid #f0f4f0', color: '#1f2d22', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#B9DC8E', flexShrink: 0 }}></span>
                                            {p}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button style={{ flex: 1, height: 34, borderRadius: 8, border: '1px solid #dfe7df', background: '#F6F9F5', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500 }}>✏ Editar</button>
                                <button style={{ flex: 1, height: 34, borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500 }}>⊘ Desactivar</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* New analysis modal */}
            {showModal && (
                <>
                    <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,.4)' }}></div>
                    <div style={{ position: 'fixed', zIndex: 41, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, maxWidth: '95vw', background: '#fff', borderRadius: 16, boxShadow: '0 24px 64px -16px rgba(16,40,24,.35)', overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef0ec', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 17, color: '#1f2d22' }}>Nuevo análisis</span>
                            <button onClick={() => setShowModal(false)} style={{ width: 30, height: 30, border: 'none', borderRadius: 8, background: '#F3F7F2', cursor: 'pointer', fontSize: 16 }}>✕</button>
                        </div>
                        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 14 }}>
                                    <span>Nombre del análisis *</span>
                                    <input style={{ height: 36, padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 14 }} />
                                </label>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 14 }}>
                                    <span>Código *</span>
                                    <input style={{ height: 36, padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'ui-monospace,monospace', fontSize: 13 }} placeholder="LAB-000" />
                                </label>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 14 }}>
                                    <span>Categoría *</span>
                                    <div style={{ height: 36, padding: '0 10px', border: '1px solid #e4e4e7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: 13 }}>
                                        Hematología <span>▾</span>
                                    </div>
                                </div>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 14 }}>
                                    <span>Precio (RD$) *</span>
                                    <input type="number" style={{ height: 36, padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 14 }} />
                                </label>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 14 }}>
                                    <span>Turnaround</span>
                                    <input style={{ height: 36, padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 14 }} placeholder="ej: 2h" />
                                </label>
                            </div>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 14 }}>
                                <span>Parámetros (uno por línea)</span>
                                <textarea rows={4} style={{ padding: '8px 12px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 13, resize: 'vertical' }} placeholder="Hemoglobina&#10;Hematocrito&#10;Leucocitos" />
                            </label>
                        </div>
                        <div style={{ padding: '14px 20px', borderTop: '1px solid #eef0ec', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button onClick={() => setShowModal(false)} style={{ height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid #dfe7df', background: '#F6F9F5', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Cancelar</button>
                            <button style={{ height: 36, padding: '0 16px', borderRadius: 10, border: 'none', background: '#2E8B3E', color: '#fff', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>✓ Guardar</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
