import { router, useForm } from '@inertiajs/react';
import type { BloodType, PatientSearchResult, Sex } from '@/types/patient';

type PatientForm = {
    document_type: string;
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

type Props = { patient: PatientSearchResult };

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const inputStyle: React.CSSProperties = {
    height: 36, padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: 10,
    outline: 'none', width: '100%', fontSize: 14, fontFamily: 'inherit',
};
const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 14 };

export default function RegistroEdit({ patient }: Props) {
    const { data, setData, put, processing, errors } = useForm<PatientForm>({
        document_type: patient.document_type,
        document_number: patient.document_number,
        email: patient.email ?? '',
        first_names: patient.first_names,
        last_names: patient.last_names,
        birth_date: patient.birth_date,
        sex: patient.sex,
        phone: patient.phone ?? '',
        address: patient.address ?? '',
        blood_type: patient.blood_type ?? '',
        allergies: patient.allergies ?? '',
        emergency_contact_name: patient.emergency_contact_name ?? '',
        emergency_contact_phone: patient.emergency_contact_phone ?? '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/registro/pacientes/${patient.id}`);
    };

    const handleDelete = () => {
        if (!confirm(`¿Eliminar a ${patient.full_name}? Esta acción no se puede deshacer.`)) return;
        router.delete(`/registro/pacientes/${patient.id}`);
    };

    return (
        <div className="flex flex-col gap-5">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <a href="/registro" style={{ display: 'inline-flex', alignItems: 'center', height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid #e4e4e7', background: '#fff', fontSize: 13, color: '#5f6b64', textDecoration: 'none', fontFamily: 'inherit' }}>
                    ← Volver
                </a>
                <h1 style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 26, color: '#1f2d22', margin: 0 }}>
                    Editar paciente
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
                                <select value={data.document_type} onChange={e => setData('document_type', e.target.value)} style={inputStyle}>
                                    <option value="cedula">Cédula</option>
                                    <option value="pasaporte">Pasaporte</option>
                                    <option value="rnc">RNC</option>
                                </select>
                                {errors.document_type && <span style={{ color: '#b91c1c', fontSize: 12 }}>{errors.document_type}</span>}
                            </label>
                            <label style={labelStyle}>
                                <span>No. de documento *</span>
                                <input value={data.document_number} onChange={e => setData('document_number', e.target.value)} placeholder="000-0000000-0" style={{ ...inputStyle, borderColor: errors.document_number ? '#fecaca' : undefined }} />
                                {errors.document_number && <span style={{ color: '#b91c1c', fontSize: 12 }}>{errors.document_number}</span>}
                            </label>
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
                                <input value={data.phone} onChange={e => setData('phone', e.target.value)} placeholder="809-000-0000" style={inputStyle} />
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
                                <input value={data.emergency_contact_phone} onChange={e => setData('emergency_contact_phone', e.target.value)} placeholder="809-000-0000" style={inputStyle} />
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

                        <div style={{ padding: '14px 20px', borderTop: '1px solid #eef0ec', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                            <button type="button" onClick={handleDelete} style={{ height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                                Eliminar paciente
                            </button>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <a href="/registro" style={{ height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid #dfe7df', background: '#F6F9F5', fontWeight: 500, fontFamily: 'inherit', fontSize: 14, display: 'inline-flex', alignItems: 'center', textDecoration: 'none', color: '#1f2d22' }}>
                                    Cancelar
                                </a>
                                <button type="submit" disabled={processing} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', borderRadius: 10, border: 'none', background: processing ? '#7ec48a' : '#2E8B3E', color: '#fff', fontWeight: 500, cursor: processing ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                                    ✓ Guardar cambios
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Info sidebar */}
                    <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14 }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef0ec', fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22' }}>Paciente</div>
                        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <span style={{ width: 40, height: 40, borderRadius: '50%', background: '#EEF6E2', color: '#2f4a17', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                                    {patient.initials}
                                </span>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#1f2d22' }}>{patient.full_name}</div>
                                    <div style={{ fontSize: 12, color: '#71717a' }}>{patient.age} años · {patient.sex === 'F' ? 'Femenino' : 'Masculino'}</div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px', fontSize: 13 }}>
                                <span style={{ color: '#71717a' }}>Documento</span>
                                <span style={{ textAlign: 'right' }}>{patient.document_number}</span>
                                <span style={{ color: '#71717a' }}>Sangre</span>
                                <span style={{ textAlign: 'right' }}>{patient.blood_type ?? '—'}</span>
                                <span style={{ color: '#71717a' }}>Alergias</span>
                                <span style={{ textAlign: 'right', color: patient.allergies ? '#b91c1c' : '#c4c9c4' }}>
                                    {patient.allergies ?? 'Ninguna'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
