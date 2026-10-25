import { cn } from '@/lib/utils';
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

const inputCls =
    'box-border h-9 w-full rounded-[10px] border border-input-border px-3 font-[inherit] text-sm outline-none';
const labelCls = 'flex flex-col gap-1.5 font-medium text-sm';

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
                <div className="col-span-2 flex items-start gap-2.5 rounded-[10px] border border-info-border bg-info-bg px-3 py-[10px] text-[13px]">
                    <span className="mt-px text-[16px] text-primary">ℹ</span>
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
                <label className={labelCls}>
                    <span>No. de cédula *</span>
                    <MaskedInput
                        mask={CEDULA_MASK}
                        value={data.document_number}
                        onChange={(v) => setData('document_number', v)}
                        className={cn(
                            inputCls,
                            errors.document_number && 'border-error-border',
                        )}
                    />
                    {errors.document_number && (
                        <span className="text-xs text-error" role="alert">
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
            <label className={labelCls}>
                <span>
                    {labels[data.document_type] ?? 'No. de documento *'}
                </span>
                <input
                    value={data.document_number}
                    onChange={(e) => setData('document_number', e.target.value)}
                    placeholder={placeholders[data.document_type]}
                    className={cn(
                        inputCls,
                        errors.document_number && 'border-error-border',
                    )}
                />
                {errors.document_number && (
                    <span className="text-xs text-error" role="alert">
                        {errors.document_number}
                    </span>
                )}
            </label>
        );
    };

    return (
        <div className="overflow-hidden rounded-[14px] border border-card-border bg-card-bg">
            <div className="border-b border-divider px-5 py-4">
                <div className="font-serif text-[16px] font-semibold text-text-heading">
                    Datos del paciente
                </div>
                <div className="text-[13px] text-muted">
                    Los campos con * son obligatorios.
                </div>
            </div>

            <div className="grid grid-cols-3 gap-x-4 gap-y-[14px] p-[16px_20px_20px]">
                <label className={labelCls}>
                    <span>Tipo de documento *</span>
                    <select
                        value={data.document_type}
                        onChange={(e) =>
                            onDocumentTypeChange(e.target.value as DocumentType)
                        }
                        className={cn(inputCls, 'cursor-pointer')}
                    >
                        {DOCUMENT_TYPES.map((dt) => (
                            <option key={dt.value} value={dt.value}>
                                {dt.label}
                            </option>
                        ))}
                    </select>
                    {errors.document_type && (
                        <span className="text-xs text-error" role="alert">
                            {errors.document_type}
                        </span>
                    )}
                </label>

                {docNumberField()}

                <label className={labelCls}>
                    <span>Fecha de nacimiento *</span>
                    <input
                        type="date"
                        value={data.birth_date}
                        onChange={(e) => setData('birth_date', e.target.value)}
                        className={cn(
                            inputCls,
                            errors.birth_date && 'border-error-border',
                        )}
                    />
                    {errors.birth_date && (
                        <span className="text-xs text-error" role="alert">
                            {errors.birth_date}
                        </span>
                    )}
                </label>
                <label className={labelCls}>
                    <span>Nombres *</span>
                    <input
                        value={data.first_names}
                        onChange={(e) => setData('first_names', e.target.value)}
                        className={cn(
                            inputCls,
                            errors.first_names && 'border-error-border',
                        )}
                    />
                    {errors.first_names && (
                        <span className="text-xs text-error" role="alert">
                            {errors.first_names}
                        </span>
                    )}
                </label>
                <label className={labelCls}>
                    <span>Apellidos *</span>
                    <input
                        value={data.last_names}
                        onChange={(e) => setData('last_names', e.target.value)}
                        className={cn(
                            inputCls,
                            errors.last_names && 'border-error-border',
                        )}
                    />
                    {errors.last_names && (
                        <span className="text-xs text-error" role="alert">
                            {errors.last_names}
                        </span>
                    )}
                </label>
                <label className={cn(labelCls, 'col-span-2')}>
                    <span>Correo electrónico</span>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="paciente@ejemplo.com"
                        className={cn(
                            inputCls,
                            errors.email && 'border-error-border',
                        )}
                    />
                    {errors.email && (
                        <span className="text-xs text-error" role="alert">
                            {errors.email}
                        </span>
                    )}
                </label>
                <div className={labelCls}>
                    <span>Sexo *</span>
                    <div className="flex h-9 items-center gap-4">
                        {(['F', 'M'] as Sex[]).map((s) => (
                            <span
                                key={s}
                                onClick={() => setData('sex', s)}
                                className="inline-flex cursor-pointer items-center gap-2"
                            >
                                <span
                                    className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${data.sex === s ? 'border-primary' : 'border-neutral-border'}`}
                                >
                                    <span
                                        className={`h-2 w-2 rounded-full ${data.sex === s ? 'bg-primary' : 'bg-transparent'}`}
                                    />
                                </span>
                                {s === 'F' ? 'Femenino' : 'Masculino'}
                            </span>
                        ))}
                    </div>
                    {errors.sex && (
                        <span className="text-xs text-error" role="alert">
                            {errors.sex}
                        </span>
                    )}
                </div>
                <label className={labelCls}>
                    <span>Teléfono</span>
                    <MaskedInput
                        mask={PHONE_MASK}
                        value={data.phone}
                        onChange={(v) => setData('phone', v)}
                        className={inputCls}
                    />
                </label>
                <label className={cn(labelCls, 'col-span-2')}>
                    <span>Dirección</span>
                    <input
                        value={data.address}
                        onChange={(e) => setData('address', e.target.value)}
                        className={inputCls}
                    />
                </label>
                <label className={labelCls}>
                    <span>Persona de contacto</span>
                    <input
                        value={data.emergency_contact_name}
                        onChange={(e) =>
                            setData('emergency_contact_name', e.target.value)
                        }
                        className={inputCls}
                    />
                </label>
                <label className={labelCls}>
                    <span>Tel. de contacto</span>
                    <MaskedInput
                        mask={PHONE_MASK}
                        value={data.emergency_contact_phone}
                        onChange={(v) => setData('emergency_contact_phone', v)}
                        className={inputCls}
                    />
                </label>
                <label className={labelCls}>
                    <span>Tipo de sangre</span>
                    <select
                        value={data.blood_type}
                        onChange={(e) => setData('blood_type', e.target.value)}
                        className={cn(inputCls, 'cursor-pointer')}
                    >
                        <option value="">Seleccionar</option>
                        {BLOOD_TYPES.map((bt) => (
                            <option key={bt} value={bt}>
                                {bt}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="col-span-full flex flex-col gap-1.5">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-error">
                        ⚠ Alergias
                    </span>
                    <textarea
                        rows={2}
                        value={data.allergies}
                        onChange={(e) => setData('allergies', e.target.value)}
                        placeholder="Medicamentos, alimentos u otros"
                        className="box-border w-full resize-y rounded-[10px] border border-error-border px-3 py-2 font-[inherit] text-sm leading-normal outline-none"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-divider p-[14px_20px]">
                <button
                    type="button"
                    onClick={onDelete}
                    className="h-9 cursor-pointer rounded-[10px] border border-error-border bg-error-bg px-[14px] font-[inherit] text-sm font-medium text-error"
                >
                    Eliminar paciente
                </button>
                <div className="flex gap-2">
                    <a
                        href="/registro"
                        className="inline-flex h-9 items-center rounded-[10px] border border-secondary-border bg-secondary-bg px-[14px] font-[inherit] text-sm font-medium text-text-heading no-underline"
                    >
                        Cancelar
                    </a>
                    <button
                        type="submit"
                        disabled={processing}
                        className={`inline-flex h-9 items-center gap-2 rounded-[10px] border-0 px-[14px] font-[inherit] text-sm font-medium text-white ${processing ? 'cursor-not-allowed bg-primary-disabled' : 'cursor-pointer bg-primary'}`}
                    >
                        ✓ Guardar cambios
                    </button>
                </div>
            </div>
        </div>
    );
}
