import { useForm } from '@inertiajs/react';
import { MaskedInput } from '@/components/cemerog/masked-input';
import type { BloodType, DocumentType, Sex } from '@/types/patient';

type PatientForm = {
    document_type: DocumentType;
    document_number: string;
    email: string;
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

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
    { value: 'cedula', label: 'Cédula dominicana' },
    { value: 'pasaporte', label: 'Pasaporte' },
    { value: 'cedula_extranjera', label: 'Cédula extranjera' },
    { value: 'rnc', label: 'RNC' },
    { value: 'no_tiene', label: 'No tiene identificación' },
];

const CEDULA_MASK = '000-0000000-0';
const PHONE_MASK = '000-000-0000';

const inputStyle: React.CSSProperties = {
    height: 36, padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: 10,
    outline: 'none', width: '100%', fontSize: 14, fontFamily: 'inherit',
};
const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 14 };

export default function RegistroCreate() {
    const { data, setData, post, processing, errors } = useForm<PatientForm>({
        document_type: 'cedula',
        document_number: '',
        email: '',
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
    });

    const handleDocumentTypeChange = (type: DocumentType) => {
        setData('document_type', type);
        setData('document_number', '');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/registro/pacientes');
    };

    const docNumberField = () => {
        if (data.document_type === 'no_tiene') {
            return (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', border: '1px solid #cfe3b8', borderRadius: 10, fontSize: 13, background: '#F3F9EC', gridColumn: 'span 2' }}>
                    <span style={{ fontSize: 16, color: '#2E8B3E', marginTop: 1 }}>ℹ</span>
                    <span>El sistema asignará un <strong>código identificador</strong> automáticamente al guardar.</span>
                </div>
            );
        }

        if (data.document_type === 'cedula') {
            return (
                <label style={labelStyle}>
                    <span>No. de cédula *</span>
                    <MaskedInput
                        mask={CEDULA_MASK}
                        value={data.document_number}
                        onChange={v => setData('document_number', v)}
                        style={{ ...inputStyle, borderColor: errors.document_number ? '#fecaca' : undefined }}
                    />
                    {errors.document_number && <span style={{ color: '#b91c1c', fontSize: 12 }}>{errors.document_number}</span>}
                </label>
            );
        }

        const labels: Partial<Record<DocumentType, string>> = {
            pasaporte: 'No. de pasaporte *',
            cedula_extranjera: 'No. de identificación *',
            rnc: 'RNC *',
        };
        const placeholders: Partial<Record<DocumentType, string>> = {
            pasaporte: 'Ej. AB123456',
            cedula_extranjera: 'Número de identificación',
            rnc: '1-00-00000-0',
        };

        return (
            <label style={labelStyle}>
                <span>{labels[data.document_type] ?? 'No. de documento *'}</span>
                <input
                    value={data.document_number}
                    onChange={e => setData('document_number', e.target.value)}
                    placeholder={placeholders[data.document_type]}
                    style={{ ...inputStyle, borderColor: errors.document_number ? '#fecaca' : undefined }}
                />
                {errors.document_number && <span style={{ color: '#b91c1c', fontSize: 12 }}>{errors.document_number}</span>}
            </label>
        );
    };

    return (
        <div className="flex flex-col gap-5">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <a href="/registro" style={{ display: 'inline-flex', alignItems: 'center', height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid #e4e4e7', background: '#fff', fontSize: 13, color: '#5f6b64', textDecoration: 'none', fontFamily: 'inherit' }}>
                    ← Volver
                </a>
                <h1 style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 26, color: '#1f2d22', margin: 0 }}>
                    Nuevo paciente
                </h1>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
                    <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14 }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef0ec' }}>
                            <div style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22' }}>Datos del paciente</div>
                            <div style={{ fontSize: 13, color: '#71717a' }}>Los campos con * son obligatorios.</div>
                        </div>

                        <div style={{ padding: '16px 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '14px 16px' }}>
                            <label style={labelStyle}>
                                <span>Tipo de documento *</span>
                                <select
                                    value={data.document_type}
                                    onChange={e => handleDocumentTypeChange(e.target.value as DocumentType)}
                                    style={inputStyle}
                                >
                                    {DOCUMENT_TYPES.map(dt => (
                                        <option key={dt.value} value={dt.value}>{dt.label}</option>
                                    ))}
                                </select>
                                {errors.document_type && <span style={{ color: '#b91c1c', fontSize: 12 }}>{errors.document_type}</span>}
                            </label>

                            {docNumberField()}

                            <label style={labelStyle}>
                                <span>Fecha de nacimiento *</span>
                                <input type="date" value={data.birth_date} onChange={e => setData('birth_date', e.target.value)} style={{ ...inputStyle, borderColor: errors.birth_date ? '#fecaca' : undefined }} />
                                {errors.birth_date && <span style={{ color: '#b91c1c', fontSize: 12 }}>{errors.birth_date}</span>}
                            </label>
                            <label style={labelStyle}>
                                <span>Nombres *</span>
                                <input value={data.first_names} onChange={e => setData('first_names', e.target.value)} style={{ ...inputStyle, borderColor: errors.first_names ? '#fecaca' : undefined }} />
                                {errors.first_names && <span style={{ color: '#b91c1c', fontSize: 12 }}>{errors.first_names}</span>}
                            </label>
                            <label style={labelStyle}>
                                <span>Apellidos *</span>
                                <input value={data.last_names} onChange={e => setData('last_names', e.target.value)} style={{ ...inputStyle, borderColor: errors.last_names ? '#fecaca' : undefined }} />
                                {errors.last_names && <span style={{ color: '#b91c1c', fontSize: 12 }}>{errors.last_names}</span>}
                            </label>
                            <label style={{ ...labelStyle, gridColumn: 'span 2' }}>
                                <span>Correo electrónico</span>
                                <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} placeholder="paciente@ejemplo.com" style={{ ...inputStyle, borderColor: errors.email ? '#fecaca' : undefined }} />
                                {errors.email && <span style={{ color: '#b91c1c', fontSize: 12 }}>{errors.email}</span>}
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
                                <MaskedInput
                                    mask={PHONE_MASK}
                                    value={data.phone}
                                    onChange={v => setData('phone', v)}
                                    style={inputStyle}
                                />
                            </label>
                            <label style={{ ...labelStyle, gridColumn: 'span 2' }}>
                                <span>Dirección</span>
                                <input value={data.address} onChange={e => setData('address', e.target.value)} style={inputStyle} />
                            </label>
                            <label style={labelStyle}>
                                <span>Persona de contacto</span>
                                <input value={data.emergency_contact_name} onChange={e => setData('emergency_contact_name', e.target.value)} style={inputStyle} />
                            </label>
                            <label style={labelStyle}>
                                <span>Tel. de contacto</span>
                                <MaskedInput
                                    mask={PHONE_MASK}
                                    value={data.emergency_contact_phone}
                                    onChange={v => setData('emergency_contact_phone', v)}
                                    style={inputStyle}
                                />
                            </label>
                            <label style={labelStyle}>
                                <span>Tipo de sangre</span>
                                <select value={data.blood_type} onChange={e => setData('blood_type', e.target.value)} style={inputStyle}>
                                    <option value="">Seleccionar</option>
                                    {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                                </select>
                            </label>
                            <div style={{ ...labelStyle, gridColumn: '1 / -1' }}>
                                <span style={{ color: '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: 6 }}>⚠ Alergias</span>
                                <textarea rows={2} value={data.allergies} onChange={e => setData('allergies', e.target.value)} placeholder="Medicamentos, alimentos u otros" style={{ padding: '8px 12px', border: '1px solid #fecaca', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 14, resize: 'vertical' }} />
                            </div>
                        </div>

                        <div style={{ padding: '14px 20px', borderTop: '1px solid #eef0ec', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <a href="/registro" style={{ height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid #dfe7df', background: '#F6F9F5', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, display: 'inline-flex', alignItems: 'center', textDecoration: 'none', color: '#1f2d22' }}>
                                Cancelar
                            </a>
                            <button type="submit" disabled={processing} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', borderRadius: 10, border: 'none', background: processing ? '#7ec48a' : '#2E8B3E', color: '#fff', fontWeight: 500, cursor: processing ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                                ✓ Registrar paciente
                            </button>
                        </div>
                    </div>

                    {/* Summary sidebar */}
                    <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14 }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef0ec', fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22' }}>Resumen</div>
                        <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 12px', fontSize: 13 }}>
                            <span style={{ color: '#71717a' }}>Nombre</span>
                            <span style={{ fontWeight: 500, textAlign: 'right' }}>
                                {(data.first_names || data.last_names) ? `${data.first_names} ${data.last_names}`.trim() : '—'}
                            </span>
                            <span style={{ color: '#71717a' }}>Documento</span>
                            <span style={{ textAlign: 'right' }}>
                                {data.document_type === 'no_tiene' ? 'Auto-generado' : (data.document_number || '—')}
                            </span>
                            <span style={{ color: '#71717a' }}>Tipo de sangre</span>
                            <span style={{ textAlign: 'right' }}>{data.blood_type || '—'}</span>
                            <span style={{ color: '#71717a' }}>Alergias</span>
                            <span style={{ textAlign: 'right', color: data.allergies ? '#b91c1c' : '#c4c9c4' }}>
                                {data.allergies || 'Ninguna'}
                            </span>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
