import { MaskedInput } from '@/components/cemerog/masked-input';
import type {
    BloodType,
    DocumentType,
    PatientSearchResult,
    Sex,
} from '@/types/patient';

const BLOOD_TYPES: BloodType[] = [
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-',
];

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
    { value: 'cedula', label: 'Cédula dominicana' },
    { value: 'pasaporte', label: 'Pasaporte' },
    { value: 'cedula_extranjera', label: 'Cédula extranjera' },
    { value: 'no_tiene', label: 'No tiene identificación' },
];

const CEDULA_MASK = '000-0000000-0';
const PHONE_MASK = '000-000-0000';

const inputStyle: React.CSSProperties = {
    height: 36,
    padding: '0 12px',
    border: '1px solid #e4e4e7',
    borderRadius: 10,
    outline: 'none',
    width: '100%',
    fontSize: 14,
    fontFamily: 'inherit',
};
const labelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontWeight: 500,
    fontSize: 14,
};

type FormData = {
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

interface PatientFormCardProps {
    data: FormData;
    setData: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
    errors: Partial<Record<keyof FormData, string>>;
    processing: boolean;
    patient: PatientSearchResult;
    onDocumentTypeChange: (type: DocumentType) => void;
    onDelete: () => void;
}

export function PatientFormCard({
    data,
    setData,
    errors,
    processing,
    patient,
    onDocumentTypeChange,
    onDelete,
}: PatientFormCardProps) {
    const docNumberField = () => {
        if (data.document_type === 'no_tiene') {
            const isGenerated = patient.document_number.startsWith('GEN-');
            return (
                <div
                    style={{
                        display: 'flex',
                        gap: 10,
                        alignItems: 'flex-start',
                        padding: '10px 12px',
                        border: '1px solid #cfe3b8',
                        borderRadius: 10,
                        fontSize: 13,
                        background: '#F3F9EC',
                        gridColumn: 'span 2',
                    }}
                >
                    <span
                        style={{
                            fontSize: 16,
                            color: '#2E8B3E',
                            marginTop: 1,
                        }}
                    >
                        ℹ
                    </span>
                    <span>
                        {isGenerated ? (
                            <>
                                Código asignado:{' '}
                                <strong>{patient.document_number}</strong>
                            </>
                        ) : (
                            'El sistema asignará un código identificador automáticamente al guardar.'
                        )}
                    </span>
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
                        onChange={(v) => setData('document_number', v)}
                        style={{
                            ...inputStyle,
                            borderColor: errors.document_number
                                ? '#fecaca'
                                : undefined,
                        }}
                    />
                    {errors.document_number && (
                        <span style={{ color: '#b91c1c', fontSize: 12 }}>
                            {errors.document_number}
                        </span>
                    )}
                </label>
            );
        }

        const labels: Partial<Record<DocumentType, string>> = {
            pasaporte: 'No. de pasaporte *',
            cedula_extranjera: 'No. de identificación *',
        };
        const placeholders: Partial<Record<DocumentType, string>> = {
            pasaporte: 'Ej. AB123456',
            cedula_extranjera: 'Número de identificación',
        };

        return (
            <label style={labelStyle}>
                <span>
                    {labels[data.document_type] ?? 'No. de documento *'}
                </span>
                <input
                    value={data.document_number}
                    onChange={(e) => setData('document_number', e.target.value)}
                    placeholder={placeholders[data.document_type]}
                    style={{
                        ...inputStyle,
                        borderColor: errors.document_number
                            ? '#fecaca'
                            : undefined,
                    }}
                />
                {errors.document_number && (
                    <span style={{ color: '#b91c1c', fontSize: 12 }}>
                        {errors.document_number}
                    </span>
                )}
            </label>
        );
    };

    return (
        <div
            style={{
                background: '#fff',
                border: '1px solid #e3e9e3',
                borderRadius: 14,
            }}
        >
            <div
                style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #eef0ec',
                }}
            >
                <div
                    style={{
                        fontFamily: 'Bitter,Georgia,serif',
                        fontWeight: 600,
                        fontSize: 16,
                        color: '#1f2d22',
                    }}
                >
                    Datos del paciente
                </div>
                <div style={{ fontSize: 13, color: '#71717a' }}>
                    Los campos con * son obligatorios.
                </div>
            </div>

            <div
                style={{
                    padding: '16px 20px 20px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
                    gap: '14px 16px',
                }}
            >
                <label style={labelStyle}>
                    <span>Tipo de documento *</span>
                    <select
                        value={data.document_type}
                        onChange={(e) =>
                            onDocumentTypeChange(e.target.value as DocumentType)
                        }
                        style={inputStyle}
                    >
                        {DOCUMENT_TYPES.map((dt) => (
                            <option key={dt.value} value={dt.value}>
                                {dt.label}
                            </option>
                        ))}
                    </select>
                    {errors.document_type && (
                        <span style={{ color: '#b91c1c', fontSize: 12 }}>
                            {errors.document_type}
                        </span>
                    )}
                </label>

                {docNumberField()}

                <label style={labelStyle}>
                    <span>Fecha de nacimiento *</span>
                    <input
                        type="date"
                        value={data.birth_date}
                        onChange={(e) => setData('birth_date', e.target.value)}
                        style={{
                            ...inputStyle,
                            borderColor: errors.birth_date
                                ? '#fecaca'
                                : undefined,
                        }}
                    />
                    {errors.birth_date && (
                        <span style={{ color: '#b91c1c', fontSize: 12 }}>
                            {errors.birth_date}
                        </span>
                    )}
                </label>
                <label style={labelStyle}>
                    <span>Nombres *</span>
                    <input
                        value={data.first_names}
                        onChange={(e) => setData('first_names', e.target.value)}
                        style={{
                            ...inputStyle,
                            borderColor: errors.first_names
                                ? '#fecaca'
                                : undefined,
                        }}
                    />
                    {errors.first_names && (
                        <span style={{ color: '#b91c1c', fontSize: 12 }}>
                            {errors.first_names}
                        </span>
                    )}
                </label>
                <label style={labelStyle}>
                    <span>Apellidos *</span>
                    <input
                        value={data.last_names}
                        onChange={(e) => setData('last_names', e.target.value)}
                        style={{
                            ...inputStyle,
                            borderColor: errors.last_names
                                ? '#fecaca'
                                : undefined,
                        }}
                    />
                    {errors.last_names && (
                        <span style={{ color: '#b91c1c', fontSize: 12 }}>
                            {errors.last_names}
                        </span>
                    )}
                </label>
                <label style={{ ...labelStyle, gridColumn: 'span 2' }}>
                    <span>Correo electrónico</span>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="paciente@ejemplo.com"
                        style={{
                            ...inputStyle,
                            borderColor: errors.email ? '#fecaca' : undefined,
                        }}
                    />
                    {errors.email && (
                        <span style={{ color: '#b91c1c', fontSize: 12 }}>
                            {errors.email}
                        </span>
                    )}
                </label>
                <div style={labelStyle}>
                    <span>Sexo *</span>
                    <div
                        style={{
                            display: 'flex',
                            gap: 16,
                            height: 36,
                            alignItems: 'center',
                        }}
                    >
                        {(['F', 'M'] as Sex[]).map((s) => (
                            <span
                                key={s}
                                onClick={() => setData('sex', s)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    cursor: 'pointer',
                                }}
                            >
                                <span
                                    style={{
                                        width: 16,
                                        height: 16,
                                        borderRadius: '50%',
                                        border: `1px solid ${data.sex === s ? '#2E8B3E' : '#d4d4d8'}`,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background:
                                                data.sex === s
                                                    ? '#2E8B3E'
                                                    : 'transparent',
                                        }}
                                    ></span>
                                </span>
                                {s === 'F' ? 'Femenino' : 'Masculino'}
                            </span>
                        ))}
                    </div>
                    {errors.sex && (
                        <span style={{ color: '#b91c1c', fontSize: 12 }}>
                            {errors.sex}
                        </span>
                    )}
                </div>
                <label style={labelStyle}>
                    <span>Teléfono</span>
                    <MaskedInput
                        mask={PHONE_MASK}
                        value={data.phone}
                        onChange={(v) => setData('phone', v)}
                        style={inputStyle}
                    />
                </label>
                <label style={{ ...labelStyle, gridColumn: 'span 2' }}>
                    <span>Dirección</span>
                    <input
                        value={data.address}
                        onChange={(e) => setData('address', e.target.value)}
                        style={inputStyle}
                    />
                </label>
                <label style={labelStyle}>
                    <span>Persona de contacto</span>
                    <input
                        value={data.emergency_contact_name}
                        onChange={(e) =>
                            setData('emergency_contact_name', e.target.value)
                        }
                        style={inputStyle}
                    />
                </label>
                <label style={labelStyle}>
                    <span>Tel. de contacto</span>
                    <MaskedInput
                        mask={PHONE_MASK}
                        value={data.emergency_contact_phone}
                        onChange={(v) => setData('emergency_contact_phone', v)}
                        style={inputStyle}
                    />
                </label>
                <label style={labelStyle}>
                    <span>Tipo de sangre</span>
                    <select
                        value={data.blood_type}
                        onChange={(e) => setData('blood_type', e.target.value)}
                        style={inputStyle}
                    >
                        <option value="">Seleccionar</option>
                        {BLOOD_TYPES.map((bt) => (
                            <option key={bt} value={bt}>
                                {bt}
                            </option>
                        ))}
                    </select>
                </label>
                <div style={{ ...labelStyle, gridColumn: '1 / -1' }}>
                    <span
                        style={{
                            color: '#b91c1c',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        ⚠ Alergias
                    </span>
                    <textarea
                        rows={2}
                        value={data.allergies}
                        onChange={(e) => setData('allergies', e.target.value)}
                        placeholder="Medicamentos, alimentos u otros"
                        style={{
                            padding: '8px 12px',
                            border: '1px solid #fecaca',
                            borderRadius: 10,
                            outline: 'none',
                            fontFamily: 'inherit',
                            fontSize: 14,
                            resize: 'vertical',
                        }}
                    />
                </div>
            </div>

            <div
                style={{
                    padding: '14px 20px',
                    borderTop: '1px solid #eef0ec',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                }}
            >
                <button
                    type="button"
                    onClick={onDelete}
                    style={{
                        height: 36,
                        padding: '0 14px',
                        borderRadius: 10,
                        border: '1px solid #fecaca',
                        background: '#fef2f2',
                        color: '#b91c1c',
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 14,
                    }}
                >
                    Eliminar paciente
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                    <a
                        href="/registro"
                        style={{
                            height: 36,
                            padding: '0 14px',
                            borderRadius: 10,
                            border: '1px solid #dfe7df',
                            background: '#F6F9F5',
                            fontWeight: 500,
                            fontFamily: 'inherit',
                            fontSize: 14,
                            display: 'inline-flex',
                            alignItems: 'center',
                            textDecoration: 'none',
                            color: '#1f2d22',
                        }}
                    >
                        Cancelar
                    </a>
                    <button
                        type="submit"
                        disabled={processing}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            height: 36,
                            padding: '0 14px',
                            borderRadius: 10,
                            border: 'none',
                            background: processing ? '#7ec48a' : '#2E8B3E',
                            color: '#fff',
                            fontWeight: 500,
                            cursor: processing ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit',
                            fontSize: 14,
                        }}
                    >
                        ✓ Guardar cambios
                    </button>
                </div>
            </div>
        </div>
    );
}
