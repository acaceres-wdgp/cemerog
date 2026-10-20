import { router, useForm } from '@inertiajs/react';
import { useCallback, useRef, useState } from 'react';
import type { BloodType, PatientSearchResult, Sex } from '@/types/patient';

type TipoAtencion = 'consulta' | 'emergencia' | 'estudios' | null;

const inputStyle: React.CSSProperties = {
    height: 36, padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: 10,
    outline: 'none', width: '100%', fontSize: 14, fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 14,
};

const TIPOS = [
    { key: 'consulta' as TipoAtencion, label: 'Consulta', desc: 'Asigna turno y médico tratante.' },
    { key: 'emergencia' as TipoAtencion, label: 'Emergencia', desc: 'Sin turno. Triaje inmediato.' },
    { key: 'estudios' as TipoAtencion, label: 'Solo análisis / imágenes', desc: 'Sin médico de cabecera.' },
];

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

type PatientForm = {
    document_type: string;
    document_number: string;
    first_names: string;
    last_names: string;
    birth_date: string;
    sex: Sex;
    phone: string;
    address: string;
    blood_type: string;
    allergies: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
};

const emptyForm: PatientForm = {
    document_type: 'cedula',
    document_number: '',
    first_names: '',
    last_names: '',
    birth_date: '',
    sex: 'F',
    phone: '',
    address: '',
    blood_type: '',
    allergies: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
};

function patientToForm(p: PatientSearchResult): PatientForm {
    return {
        document_type: p.document_type,
        document_number: p.document_number,
        first_names: p.first_names,
        last_names: p.last_names,
        birth_date: p.birth_date,
        sex: p.sex,
        phone: p.phone ?? '',
        address: p.address ?? '',
        blood_type: p.blood_type ?? '',
        allergies: p.allergies ?? '',
        emergency_contact_name: p.emergency_contact_name ?? '',
        emergency_contact_phone: p.emergency_contact_phone ?? '',
    };
}

export default function RegistroIndex() {
    const [query, setQuery] = useState('');
    const [dropOpen, setDropOpen] = useState(false);
    const [results, setResults] = useState<PatientSearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [selected, setSelected] = useState<PatientSearchResult | null>(null);
    const [isNew, setIsNew] = useState(false);
    const [tipo, setTipo] = useState<TipoAtencion>('consulta');

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm<PatientForm>(emptyForm);

    const runSearch = useCallback((q: string) => {
        if (q.length < 2) {
            setResults([]);
            return;
        }
        setSearching(true);
        fetch(`/registro/pacientes/buscar?q=${encodeURIComponent(q)}`, {
            headers: { Accept: 'application/json' },
        })
            .then(r => r.json())
            .then((data: PatientSearchResult[]) => { setResults(data); setSearching(false); })
            .catch(() => setSearching(false));
    }, []);

    const handleQueryChange = (value: string) => {
        setQuery(value);
        setDropOpen(true);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => runSearch(value), 250);
    };

    const handleSelect = (p: PatientSearchResult) => {
        setSelected(p);
        setIsNew(false);
        setQuery(p.full_name);
        setDropOpen(false);
        Object.entries(patientToForm(p)).forEach(([k, v]) => setData(k as keyof PatientForm, v));
    };

    const handleNewPatient = () => {
        setSelected(null);
        setIsNew(true);
        setDropOpen(false);
        reset();
    };

    const handleReset = () => {
        setSelected(null);
        setIsNew(false);
        setQuery('');
        reset();
    };

    const handleDelete = () => {
        if (!selected) return;
        if (!confirm(`¿Eliminar a ${selected.full_name}? Esta acción no se puede deshacer.`)) return;
        router.delete(`/registro/pacientes/${selected.id}`);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selected) {
            put(`/registro/pacientes/${selected.id}`);
        } else if (isNew) {
            post('/registro/pacientes');
        }
    };

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h1 style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 26, color: '#1f2d22', margin: 0 }}>
                    Nueva atención
                </h1>
                <p style={{ margin: '4px 0 0', color: '#5f6b64' }}>
                    Busca primero por cédula. Si el paciente no existe, completa sus datos y crea la atención.
                </p>
            </div>

            <form onSubmit={handleSubmit}>
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
                                        onChange={e => handleQueryChange(e.target.value)}
                                        onFocus={() => setDropOpen(true)}
                                        onBlur={() => setTimeout(() => setDropOpen(false), 200)}
                                        placeholder="Buscar por cédula, nombre o teléfono…"
                                        style={{ ...inputStyle, paddingLeft: 34, paddingRight: 30 }}
                                    />
                                    {dropOpen && query.length >= 2 && (
                                        <div style={{ position: 'absolute', zIndex: 30, top: 42, left: 0, right: 0, minWidth: 340, background: '#fff', border: '1px solid #e3e9e3', borderRadius: 12, boxShadow: '0 12px 32px rgba(16,40,24,.14)', overflow: 'hidden' }}>
                                            {searching && (
                                                <div style={{ padding: '12px 14px', fontSize: 13, color: '#71717a' }}>Buscando…</div>
                                            )}
                                            {!searching && results.length === 0 && (
                                                <div style={{ padding: '12px 14px', fontSize: 13, color: '#71717a' }}>Ningún paciente coincide con «{query}».</div>
                                            )}
                                            {results.map(p => (
                                                <div key={p.id} onMouseDown={() => handleSelect(p)} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 14px', cursor: 'pointer' }}>
                                                    <span style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', background: '#EEF6E2', color: '#2f4a17', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12 }}>{p.initials}</span>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 500 }}>{p.full_name}</div>
                                                        <div style={{ fontSize: 12, color: '#71717a' }}>{p.document_number} · {p.age} años · {p.phone}</div>
                                                    </div>
                                                    <div style={{ flexShrink: 0, textAlign: 'right', fontSize: 11.5, lineHeight: 1.3, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                                                        {p.allergies && <span style={{ padding: '1px 7px', borderRadius: 999, background: '#fef2f2', color: '#b91c1c', fontWeight: 600 }}>Alergias</span>}
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
                                        <span style={{ flex: 1, minWidth: 200 }}>
                                            <strong>Paciente existente</strong> · {selected.age} años. Verifica que los datos estén al día.
                                        </span>
                                        <button type="button" onClick={handleReset} style={{ border: 'none', background: 'transparent', color: '#2E8B3E', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                                            Cambiar paciente
                                        </button>
                                    </div>
                                )}
                                {selected?.allergies && (
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', border: '1px solid #fecaca', borderRadius: 10, fontSize: 13, background: '#fef2f2', color: '#b91c1c' }}>
                                        <span style={{ fontSize: 16 }}>⚠</span>
                                        <span><strong>Alérgico(a) a:</strong> {selected.allergies}</span>
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: '16px 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '14px 16px' }}>
                                <label style={labelStyle}>
                                    <span>Tipo de documento *</span>
                                    <select
                                        value={data.document_type}
                                        onChange={e => setData('document_type', e.target.value)}
                                        style={inputStyle}
                                    >
                                        <option value="cedula">Cédula</option>
                                        <option value="pasaporte">Pasaporte</option>
                                        <option value="rnc">RNC</option>
                                    </select>
                                    {errors.document_type && <span style={{ color: '#b91c1c', fontSize: 12 }}>{errors.document_type}</span>}
                                </label>
                                <label style={labelStyle}>
                                    <span>No. de documento *</span>
                                    <input
                                        value={data.document_number}
                                        onChange={e => setData('document_number', e.target.value)}
                                        style={{ ...inputStyle, borderColor: errors.document_number ? '#fecaca' : undefined }}
                                        placeholder="000-0000000-0"
                                    />
                                    {errors.document_number && <span style={{ color: '#b91c1c', fontSize: 12 }}>{errors.document_number}</span>}
                                </label>
                                <label style={labelStyle}>
                                    <span>Fecha de nacimiento *</span>
                                    <input
                                        type="date"
                                        value={data.birth_date}
                                        onChange={e => setData('birth_date', e.target.value)}
                                        style={{ ...inputStyle, borderColor: errors.birth_date ? '#fecaca' : undefined }}
                                    />
                                    {errors.birth_date && <span style={{ color: '#b91c1c', fontSize: 12 }}>{errors.birth_date}</span>}
                                </label>
                                <label style={labelStyle}>
                                    <span>Nombres *</span>
                                    <input
                                        value={data.first_names}
                                        onChange={e => setData('first_names', e.target.value)}
                                        style={{ ...inputStyle, borderColor: errors.first_names ? '#fecaca' : undefined }}
                                    />
                                    {errors.first_names && <span style={{ color: '#b91c1c', fontSize: 12 }}>{errors.first_names}</span>}
                                </label>
                                <label style={labelStyle}>
                                    <span>Apellidos *</span>
                                    <input
                                        value={data.last_names}
                                        onChange={e => setData('last_names', e.target.value)}
                                        style={{ ...inputStyle, borderColor: errors.last_names ? '#fecaca' : undefined }}
                                    />
                                    {errors.last_names && <span style={{ color: '#b91c1c', fontSize: 12 }}>{errors.last_names}</span>}
                                </label>
                                <div style={labelStyle}>
                                    <span>Sexo *</span>
                                    <div style={{ display: 'flex', gap: 16, height: 36, alignItems: 'center' }}>
                                        {(['F', 'M'] as Sex[]).map(s => (
                                            <span key={s} onClick={() => setData('sex', s)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                                <span style={{ width: 16, height: 16, borderRadius: '50%', border: `1px solid ${data.sex === s ? '#2E8B3E' : '#d4d4d8'}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: data.sex === s ? '#2E8B3E' : 'transparent' }}></span>
                                                </span>
                                                {s === 'F' ? 'Femenino' : 'Masculino'}
                                            </span>
                                        ))}
                                    </div>
                                    {errors.sex && <span style={{ color: '#b91c1c', fontSize: 12 }}>{errors.sex}</span>}
                                </div>
                                <label style={labelStyle}>
                                    <span>Teléfono</span>
                                    <input
                                        value={data.phone}
                                        onChange={e => setData('phone', e.target.value)}
                                        style={inputStyle}
                                        placeholder="809-000-0000"
                                    />
                                </label>
                                <label style={{ ...labelStyle, gridColumn: 'span 2' }}>
                                    <span>Dirección</span>
                                    <input
                                        value={data.address}
                                        onChange={e => setData('address', e.target.value)}
                                        style={inputStyle}
                                    />
                                </label>
                                <label style={labelStyle}>
                                    <span>Persona de contacto</span>
                                    <input
                                        value={data.emergency_contact_name}
                                        onChange={e => setData('emergency_contact_name', e.target.value)}
                                        style={inputStyle}
                                    />
                                </label>
                                <label style={labelStyle}>
                                    <span>Tel. de contacto</span>
                                    <input
                                        value={data.emergency_contact_phone}
                                        onChange={e => setData('emergency_contact_phone', e.target.value)}
                                        style={inputStyle}
                                        placeholder="809-000-0000"
                                    />
                                </label>
                                <label style={labelStyle}>
                                    <span>Tipo de sangre</span>
                                    <select
                                        value={data.blood_type}
                                        onChange={e => setData('blood_type', e.target.value)}
                                        style={inputStyle}
                                    >
                                        <option value="">Seleccionar</option>
                                        {BLOOD_TYPES.map(bt => (
                                            <option key={bt} value={bt}>{bt}</option>
                                        ))}
                                    </select>
                                </label>
                                <div style={{ ...labelStyle, gridColumn: '1 / -1' }}>
                                    <span style={{ color: '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: 6 }}>⚠ Alergias</span>
                                    <textarea
                                        rows={2}
                                        value={data.allergies}
                                        onChange={e => setData('allergies', e.target.value)}
                                        placeholder="Medicamentos, alimentos u otros"
                                        style={{ padding: '8px 12px', border: '1px solid #fecaca', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 14, resize: 'vertical' }}
                                    />
                                </div>
                            </div>

                            {selected && (
                                <div style={{ padding: '0 20px 16px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        style={{ height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}
                                    >
                                        Eliminar paciente
                                    </button>
                                </div>
                            )}
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
                                        <textarea rows={2} style={{ padding: '8px 12px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 14 }} />
                                    </label>
                                )}
                            </div>
                            <div style={{ padding: '14px 20px', borderTop: '1px solid #eef0ec', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                <button type="button" onClick={handleReset} style={{ height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid #dfe7df', background: '#F6F9F5', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                                    Cancelar
                                </button>
                                {(isNew || selected) && (
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', borderRadius: 10, border: 'none', background: processing ? '#7ec48a' : '#2E8B3E', color: '#fff', fontWeight: 500, cursor: processing ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14 }}
                                    >
                                        {selected ? '✓ Actualizar datos' : '✓ Registrar paciente'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Summary sidebar */}
                    <div style={{ position: 'sticky', top: 92, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14 }}>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef0ec', fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22' }}>Resumen</div>
                            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {tipo === 'consulta' && (selected || isNew) && (
                                    <div style={{ textAlign: 'center', padding: 14, borderRadius: 10, background: '#EEF6E2' }}>
                                        <div style={{ fontSize: 13, color: '#2f4a17' }}>Turno asignado</div>
                                        <div style={{ fontSize: 40, fontWeight: 700, color: '#2E8B3E', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', fontFamily: 'Bitter,Georgia,serif' }}>T-–</div>
                                        <div style={{ fontSize: 12, color: '#2f4a17' }}>Se genera al guardar</div>
                                    </div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 12px', fontSize: 13 }}>
                                    <span style={{ color: '#71717a' }}>Paciente</span>
                                    <span style={{ fontWeight: 500, textAlign: 'right' }}>
                                        {selected
                                            ? selected.full_name
                                            : isNew && (data.first_names || data.last_names)
                                                ? `${data.first_names} ${data.last_names}`.trim()
                                                : '—'}
                                    </span>
                                    <span style={{ color: '#71717a' }}>Edad</span>
                                    <span style={{ textAlign: 'right' }}>{selected ? `${selected.age} años` : '—'}</span>
                                    <span style={{ color: '#71717a' }}>No. de atención</span>
                                    <span style={{ textAlign: 'right', color: '#71717a' }}>Se genera al guardar</span>
                                    <span style={{ color: '#71717a' }}>Tipo</span>
                                    <span style={{ textAlign: 'right', fontWeight: 500 }}>{tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : '—'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
