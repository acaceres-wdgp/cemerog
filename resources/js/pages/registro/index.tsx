import { useState } from 'react';

const MOCK_PATIENTS = [
    { id: 1, full: 'María García', ini: 'MG', ced: '001-0000001-1', edad: 42, tel: '809-555-0001', abierta: true, abNo: 'A-MG01-000234', abSt: 'En consulta', abLoc: 'Consultorio 1', alergia: 'Penicilina', ult: '05/10/2026', exp: 'EXP-001', visitas: '12 visitas' },
    { id: 2, full: 'Juan Pérez', ini: 'JP', ced: '001-0000002-2', edad: 28, tel: '809-555-0002', abierta: false, abNo: '', abSt: '', abLoc: '', alergia: '', ult: '01/09/2026', exp: 'EXP-002', visitas: '3 visitas' },
    { id: 3, full: 'Carmen López', ini: 'CL', ced: '001-0000003-3', edad: 67, tel: '809-555-0003', abierta: false, abNo: '', abSt: '', abLoc: '', alergia: 'Ibuprofeno, Naproxeno', ult: '10/10/2026', exp: 'EXP-003', visitas: '24 visitas' },
    { id: 4, full: 'Luis Martínez', ini: 'LM', ced: '001-0000004-4', edad: 35, tel: '809-555-0004', abierta: false, abNo: '', abSt: '', abLoc: '', alergia: '', ult: '22/09/2026', exp: 'EXP-004', visitas: '6 visitas' },
    { id: 5, full: 'Rosa Fernández', ini: 'RF', ced: '001-0000005-5', edad: 55, tel: '809-555-0005', abierta: false, abNo: '', abSt: '', abLoc: '', alergia: '', ult: '08/10/2026', exp: 'EXP-005', visitas: '9 visitas' },
];

type TipoAtencion = 'consulta' | 'emergencia' | 'estudios' | null;

const inputStyle: React.CSSProperties = {
    height: 36, padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', width: '100%', fontSize: 14, fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 14 };

const TIPOS = [
    { key: 'consulta' as TipoAtencion, label: 'Consulta', desc: 'Asigna turno y médico tratante.' },
    { key: 'emergencia' as TipoAtencion, label: 'Emergencia', desc: 'Sin turno. Triaje inmediato.' },
    { key: 'estudios' as TipoAtencion, label: 'Solo análisis / imágenes', desc: 'Sin médico de cabecera.' },
];

export default function RegistroIndex() {
    const [query, setQuery] = useState('');
    const [dropOpen, setDropOpen] = useState(false);
    const [selected, setSelected] = useState<typeof MOCK_PATIENTS[0] | null>(null);
    const [isNew, setIsNew] = useState(false);
    const [tipo, setTipo] = useState<TipoAtencion>('consulta');
    const [sexo, setSexo] = useState<'M' | 'F'>('F');

    const results = MOCK_PATIENTS.filter(p =>
        query.length >= 2 && (
            p.full.toLowerCase().includes(query.toLowerCase()) ||
            p.ced.includes(query) ||
            p.tel.includes(query)
        )
    );

    const handleSelect = (p: typeof MOCK_PATIENTS[0]) => {
        setSelected(p);
        setIsNew(false);
        setQuery(p.full);
        setDropOpen(false);
    };

    const handleNewPatient = () => {
        setSelected(null);
        setIsNew(true);
        setDropOpen(false);
    };

    const handleReset = () => {
        setSelected(null);
        setIsNew(false);
        setQuery('');
    };

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h1 style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 26, color: '#1f2d22', margin: 0 }}>Nueva atención</h1>
                <p style={{ margin: '4px 0 0', color: '#5f6b64' }}>Busca primero por cédula. Si el paciente no existe, completa sus datos y crea la atención.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Patient data card */}
                    <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14 }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef0ec', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <div>
                                <div style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22' }}>Datos del paciente</div>
                                <div style={{ fontSize: 13, color: '#71717a' }}>Los campos con * son obligatorios.</div>
                            </div>
                            <div style={{ position: 'relative', flex: '0 1 340px', minWidth: 240 }}>
                                <span style={{ position: 'absolute', left: 10, top: 10, fontSize: 16, color: '#71717a', pointerEvents: 'none' }}>🔍</span>
                                <input
                                    value={query}
                                    onChange={e => { setQuery(e.target.value); setDropOpen(true); }}
                                    onFocus={() => setDropOpen(true)}
                                    onBlur={() => setTimeout(() => setDropOpen(false), 200)}
                                    placeholder="Buscar por cédula, nombre o teléfono…"
                                    style={{ ...inputStyle, paddingLeft: 34, paddingRight: 30 }}
                                />
                                {dropOpen && query.length >= 2 && (
                                    <div style={{ position: 'absolute', zIndex: 30, top: 42, left: 0, right: 0, minWidth: 340, background: '#fff', border: '1px solid #e3e9e3', borderRadius: 12, boxShadow: '0 12px 32px rgba(16,40,24,.14)', overflow: 'hidden' }}>
                                        {results.length === 0 && (
                                            <div style={{ padding: '12px 14px', fontSize: 13, color: '#71717a' }}>Ningún paciente coincide con «{query}».</div>
                                        )}
                                        {results.map(p => (
                                            <div key={p.id} onMouseDown={() => handleSelect(p)} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 14px', cursor: 'pointer' }}>
                                                <span style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', background: '#EEF6E2', color: '#2f4a17', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12 }}>{p.ini}</span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 500 }}>{p.full}</div>
                                                    <div style={{ fontSize: 12, color: '#71717a' }}>{p.ced} · {p.edad} años · {p.tel}</div>
                                                </div>
                                                <div style={{ flexShrink: 0, textAlign: 'right', fontSize: 11.5, lineHeight: 1.3, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                                                    {p.abierta && <span style={{ padding: '1px 7px', borderRadius: 999, background: '#FEF3C7', color: '#92400E', fontWeight: 600 }}>Atención abierta</span>}
                                                    {p.alergia && <span style={{ padding: '1px 7px', borderRadius: 999, background: '#fef2f2', color: '#b91c1c', fontWeight: 600 }}>Alergias</span>}
                                                    <span style={{ color: '#71717a' }}>Últ. {p.ult}</span>
                                                </div>
                                            </div>
                                        ))}
                                        <div onMouseDown={handleNewPatient} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px', borderTop: '1px solid #eef0ec', cursor: 'pointer', color: '#2E8B3E', fontWeight: 600, background: '#F8FBF6' }}>
                                            + Registrar como paciente nuevo
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ padding: '10px 20px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {isNew && (
                                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', border: '1px solid #e4e4e7', borderRadius: 10, fontSize: 13, background: '#fafafa' }}>
                                    <span style={{ fontSize: 16, color: '#2E8B3E', marginTop: 1 }}>ℹ</span>
                                    <span>Se registrará como <strong>paciente nuevo</strong>. Completa sus datos.</span>
                                </div>
                            )}
                            {selected && (
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', border: '1px solid #cfe3b8', borderRadius: 10, fontSize: 13, background: '#F3F9EC', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 16, color: '#2E8B3E' }}>✓</span>
                                    <span style={{ flex: 1, minWidth: 200 }}><strong>Paciente existente</strong> · Expediente {selected.exp} · {selected.visitas} · última {selected.ult}. Verifica que los datos estén al día.</span>
                                    <button onClick={handleReset} style={{ border: 'none', background: 'transparent', color: '#2E8B3E', fontWeight: 600, cursor: 'pointer', padding: 0 }}>Cambiar paciente</button>
                                </div>
                            )}
                            {selected?.abierta && (
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', border: '1px solid #fcd34d', borderRadius: 10, fontSize: 13, background: '#FFFBEB', color: '#92400E', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 16 }}>⚠</span>
                                    <span style={{ flex: 1, minWidth: 200 }}>Ya tiene la atención <strong style={{ whiteSpace: 'nowrap' }}>{selected.abNo}</strong> abierta hoy ({selected.abSt}, {selected.abLoc}). Evita duplicarla.</span>
                                </div>
                            )}
                            {selected?.alergia && (
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', border: '1px solid #fecaca', borderRadius: 10, fontSize: 13, background: '#fef2f2', color: '#b91c1c' }}>
                                    <span style={{ fontSize: 16 }}>⚠</span>
                                    <span><strong>Alérgico(a) a:</strong> {selected.alergia}</span>
                                </div>
                            )}
                        </div>

                        <div style={{ padding: '16px 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '14px 16px' }}>
                            <label style={labelStyle}>
                                <span>Tipo de documento *</span>
                                <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'default' }}>Cédula <span>▾</span></div>
                            </label>
                            <label style={labelStyle}>
                                <span>No. de documento *</span>
                                <input defaultValue={selected?.ced ?? ''} style={inputStyle} placeholder="000-0000000-0" />
                            </label>
                            <label style={labelStyle}>
                                <span>Fecha de nacimiento *</span>
                                <input style={inputStyle} placeholder="dd/mm/aaaa" />
                            </label>
                            <label style={labelStyle}>
                                <span>Nombres *</span>
                                <input defaultValue={selected ? selected.full.split(' ')[0] : ''} style={inputStyle} />
                            </label>
                            <label style={labelStyle}>
                                <span>Apellidos *</span>
                                <input defaultValue={selected ? selected.full.split(' ').slice(1).join(' ') : ''} style={inputStyle} />
                            </label>
                            <div style={labelStyle}>
                                <span>Sexo *</span>
                                <div style={{ display: 'flex', gap: 16, height: 36, alignItems: 'center' }}>
                                    {(['F', 'M'] as const).map(s => (
                                        <span key={s} onClick={() => setSexo(s)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                            <span style={{ width: 16, height: 16, borderRadius: '50%', border: `1px solid ${sexo === s ? '#2E8B3E' : '#d4d4d8'}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: sexo === s ? '#2E8B3E' : 'transparent' }}></span>
                                            </span>
                                            {s === 'F' ? 'Femenino' : 'Masculino'}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <label style={labelStyle}>
                                <span>Teléfono *</span>
                                <input defaultValue={selected?.tel ?? ''} style={inputStyle} />
                            </label>
                            <label style={{ ...labelStyle, gridColumn: 'span 2' }}>
                                <span>Dirección</span>
                                <input style={inputStyle} />
                            </label>
                            <label style={labelStyle}>
                                <span>Persona de contacto</span>
                                <input style={inputStyle} />
                            </label>
                            <label style={labelStyle}>
                                <span>Tel. de contacto</span>
                                <input style={inputStyle} />
                            </label>
                            <div style={labelStyle}>
                                <span>Tipo de sangre</span>
                                <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#71717a', cursor: 'default' }}>Seleccionar <span>▾</span></div>
                            </div>
                            <div style={{ ...labelStyle, gridColumn: '1 / -1' }}>
                                <span style={{ color: '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: 6 }}>⚠ Alergias</span>
                                <textarea rows={2} defaultValue={selected?.alergia ?? ''} placeholder="Medicamentos, alimentos u otros" style={{ padding: '8px 12px', border: '1px solid #fecaca', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 14, resize: 'vertical' }}></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Tipo atención */}
                    <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14 }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef0ec' }}>
                            <div style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22' }}>Nueva atención</div>
                            <div style={{ fontSize: 13, color: '#71717a' }}>¿Cómo llega el paciente?</div>
                        </div>
                        <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
                                {TIPOS.map(t => (
                                    <div key={t.key!} onClick={() => setTipo(t.key)} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 14, borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${tipo === t.key ? '#2E8B3E' : '#e4e4e7'}`, background: tipo === t.key ? '#F3F9EC' : '#fff' }}>
                                        <span style={{ width: 16, height: 16, marginTop: 2, flexShrink: 0, borderRadius: '50%', border: `1px solid ${tipo === t.key ? '#2E8B3E' : '#d4d4d8'}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: tipo === t.key ? '#2E8B3E' : 'transparent' }}></span>
                                        </span>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{t.label}</div>
                                            <div style={{ fontSize: 13, color: '#71717a' }}>{t.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {tipo === 'consulta' && (
                                <div style={labelStyle}>
                                    <span>Médico *</span>
                                    <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'default' }}>
                                        Dra. Ana Rodríguez — Medicina General <span>▾</span>
                                    </div>
                                </div>
                            )}
                            {tipo === 'emergencia' && (
                                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', border: '1px solid #fecaca', background: '#fef2f2', borderRadius: 10, color: '#b91c1c', fontSize: 13 }}>
                                    <span style={{ fontSize: 16, marginTop: 1 }}>🚨</span>
                                    <span>Se notificará a Enfermería para realizar el triaje de inmediato. No se asigna turno.</span>
                                </div>
                            )}
                            {tipo !== 'emergencia' && (
                                <label style={labelStyle}>
                                    <span>Motivo de la visita</span>
                                    <textarea rows={2} style={{ padding: '8px 12px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 14 }} defaultValue="Dolor de cabeza frecuente desde hace una semana."></textarea>
                                </label>
                            )}
                        </div>
                        <div style={{ padding: '14px 20px', borderTop: '1px solid #eef0ec', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button style={{ height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid #dfe7df', background: '#F6F9F5', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Cancelar</button>
                            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', borderRadius: 10, border: 'none', background: '#2E8B3E', color: '#fff', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                                ✓ Crear atención
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary sidebar */}
                <div style={{ position: 'sticky', top: 92, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14 }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef0ec', fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22' }}>Resumen</div>
                        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {tipo === 'consulta' && (
                                <div style={{ textAlign: 'center', padding: 14, borderRadius: 10, background: '#EEF6E2' }}>
                                    <div style={{ fontSize: 13, color: '#2f4a17' }}>Turno asignado</div>
                                    <div style={{ fontSize: 40, fontWeight: 700, color: '#2E8B3E', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', fontFamily: 'Bitter,Georgia,serif' }}>T-12</div>
                                    <div style={{ fontSize: 12, color: '#2f4a17' }}>6 pacientes antes · Consultorio 1</div>
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 12px', fontSize: 13 }}>
                                <span style={{ color: '#71717a' }}>Paciente</span>
                                <span style={{ fontWeight: 500, textAlign: 'right' }}>{selected?.full ?? (isNew ? 'Paciente nuevo' : '—')}</span>
                                <span style={{ color: '#71717a' }}>Edad</span>
                                <span style={{ textAlign: 'right' }}>{selected?.edad ? `${selected.edad} años` : '—'}</span>
                                <span style={{ color: '#71717a' }}>No. de atención</span>
                                <span style={{ textAlign: 'right', color: '#71717a' }}>Se genera al guardar</span>
                                <span style={{ color: '#71717a' }}>Tipo</span>
                                <span style={{ textAlign: 'right', fontWeight: 500 }}>{tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : '—'}</span>
                                <span style={{ color: '#71717a' }}>Llegada</span>
                                <span style={{ textAlign: 'right' }}>12/10/2026 · 09:14</span>
                            </div>
                            <div style={{ height: 1, background: '#e4e4e7' }}></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: '#71717a' }}>Cargo inicial</span>
                                <span style={{ fontWeight: 600 }}>RD$1,500.00</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
