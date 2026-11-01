import { Head, Link, useForm } from '@inertiajs/react';
import { pacientes } from '@/routes';
import { differenceInYears } from 'date-fns';
import { Check, CircleCheck, Loader2, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import AlertBanner from '@/components/cemerog/AlertBanner';
import MaskedInput from '@/components/cemerog/masked-input';
import Panel from '@/components/cemerog/Panel';
import type {
    ImagingCatalogItem,
    LabCatalogItem,
} from '@/components/lab/types';
import { ageLabel } from '@/lib/patient';
import {
    StudiesAttention,
    StudiesSummary,
} from './components/StudiesAttention';

// ── Turn status label map (mirrors Turn::statusLabel on the backend) ──────────
const TURN_STATUS_LABELS: Record<string, string> = {
    espera: 'En espera',
    en_consulta: 'En consulta',
    atendido: 'Atendido',
    no_asistio: 'No asistió',
};

// ── Types ────────────────────────────────────────────────────────────────────

interface Doctor {
    id: number;
    name: string;
    specialty: string;
}

interface OpenTurnToday {
    doctor_name: string;
    status: string;
}

interface ExistingPatient {
    id: number;
    expediente_number: string;
    full_name: string;
    initials: string;
    first_names: string;
    last_names: string;
    document_type: string;
    document_number: string;
    birth_date: string;
    sex: string;
    phone: string | null;
    address: string | null;
    blood_type: string | null;
    allergies: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    total_turns: number;
    last_attended_at: string | null;
    open_turns_today: OpenTurnToday[];
}

interface DuplicateMatch {
    id: number;
    full_name: string;
    age: number | null;
}

interface Props {
    doctors: Doctor[];
    patient: ExistingPatient | null;
    prefillDocumentNumber?: string;
    prefillFirstNames?: string;
    /** «analisis» when coming from «Orden sin consulta» in Laboratorio */
    initialType?: 'consulta' | 'analisis';
    labCatalog?: LabCatalogItem[];
    imagingCatalog?: ImagingCatalogItem[];
}

/** Extends the inferred form errors with `open_turn`, which the server returns
 *  via `PatientHasOpenTurnException` but is not part of the form data. */
type FormErrors = Partial<Record<string, string>> & { open_turn?: string };

const DOC_TYPES = [
    { value: 'cedula', label: 'Cédula' },
    { value: 'pasaporte', label: 'Pasaporte' },
    { value: 'cedula_extranjera', label: 'Cédula extranjera' },
    { value: 'no_tiene', label: 'Sin documento' },
];

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RegistroIndex({
    doctors,
    patient: initialPatient,
    prefillDocumentNumber = '',
    prefillFirstNames = '',
    initialType = 'consulta',
    labCatalog = [],
    imagingCatalog = [],
}: Props) {
    const mode: 'new' | 'existing' = initialPatient ? 'existing' : 'new';

    const {
        data,
        setData,
        post,
        processing,
        errors: rawErrors,
    } = useForm({
        patient_id: initialPatient?.id ?? (null as number | null),
        document_type: initialPatient?.document_type ?? 'cedula',
        document_number:
            initialPatient?.document_number ?? prefillDocumentNumber,
        first_names: initialPatient?.first_names ?? prefillFirstNames,
        last_names: initialPatient?.last_names ?? '',
        birth_date: initialPatient?.birth_date ?? '',
        sex: initialPatient?.sex ?? '',
        phone: initialPatient?.phone ?? '',
        address: initialPatient?.address ?? '',
        blood_type: initialPatient?.blood_type ?? '',
        allergies: initialPatient?.allergies ?? '',
        emergency_contact_name: initialPatient?.emergency_contact_name ?? '',
        emergency_contact_phone: initialPatient?.emergency_contact_phone ?? '',
        attention_type: initialType as string,
        doctor_id: '' as number | string,
        notes: '',
        lab_test_ids: [] as number[],
        imaging_study_ids: [] as number[],
        external_doctor: '',
    });
    const errors = rawErrors as FormErrors;

    // ── Duplicate detection (mode === 'new') ──────────────────────────────────

    const [duplicateMatch, setDuplicateMatch] = useState<DuplicateMatch | null>(
        null,
    );
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Always reflects the latest document_number without stale closure issues
    const currentDocRef = useRef(data.document_number);
    currentDocRef.current = data.document_number;

    useEffect(() => {
        if (mode !== 'new') return;
        if (data.document_type === 'no_tiene') {
            setDuplicateMatch(null);
            return;
        }

        const doc = data.document_number;
        const isCedulaComplete =
            data.document_type === 'cedula' && doc.length === 13;
        const isOtherComplete =
            data.document_type !== 'cedula' && doc.length >= 6;

        if (!isCedulaComplete && !isOtherComplete) {
            setDuplicateMatch(null);
            return;
        }

        const controller = new AbortController();

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/registro/pacientes/existe?documento=${encodeURIComponent(doc)}&tipo=${encodeURIComponent(data.document_type)}`,
                    {
                        signal: controller.signal,
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                );
                if (!res.ok) return;
                const match: DuplicateMatch | null = await res.json();
                // Guard: discard if document changed while the request was in flight
                if (doc !== currentDocRef.current) return;
                setDuplicateMatch(match);
            } catch {
                // network error or AbortError – silently ignore
            }
        }, 400);

        return () => {
            controller.abort();
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [data.document_number, data.document_type, mode]);

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/registro', { preserveScroll: true });
    };

    const handleStoreOnly = () => {
        post('/registro/pacientes', { preserveScroll: true });
    };

    const selectedDoctor = doctors.find((d) => d.id === Number(data.doctor_id));
    const isStudies = data.attention_type === 'analisis';
    const studies = {
        lab: data.lab_test_ids,
        imaging: data.imaging_study_ids,
    };
    const isFormValid = isStudies
        ? studies.lab.length + studies.imaging.length > 0
        : !!data.doctor_id;
    const setStudies = (next: { lab: number[]; imaging: number[] }) =>
        setData((d) => ({
            ...d,
            lab_test_ids: next.lab,
            imaging_study_ids: next.imaging,
        }));

    return (
        <>
            <Head title="Registro de pacientes" />

            <form
                onSubmit={handleSubmit}
                autoComplete="off"
                className="flex flex-col gap-5"
            >
                {/* Intro */}
                <p className="text-[13.5px] text-text-secondary">
                    {mode === 'new'
                        ? 'Completa los datos del paciente y crea su primera atención.'
                        : 'Crea una nueva atención para este paciente.'}
                </p>

                {/* Main grid */}
                <div className="flex flex-wrap items-start gap-4">
                    {/* ── Left column ───────────────────────────────────── */}
                    <div
                        className="flex min-w-0 flex-col gap-4"
                        // dynamic-style: non-standard flex ratio (1.6) not available as Tailwind class
                        style={{ flex: '1.6 1 560px' }}
                    >
                        {/* Card 1: Datos del paciente */}
                        <Panel
                            title="Datos del paciente"
                            description="Los campos con * son obligatorios."
                            noPadding
                        >
                            {/* Banners */}
                            {mode === 'existing' && initialPatient && (
                                <div className="flex flex-col gap-3 border-b border-divider px-5 py-4">
                                    <div className="flex items-start gap-3 rounded-xl border border-success-border bg-accent-bg px-4 py-3 text-[13px] text-success-fg">
                                        <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                        <div className="flex-1">
                                            <strong>Paciente existente</strong>{' '}
                                            · Expediente{' '}
                                            {initialPatient.expediente_number} ·{' '}
                                            {initialPatient.total_turns}{' '}
                                            atenciones
                                            {initialPatient.last_attended_at
                                                ? ` · última ${initialPatient.last_attended_at}`
                                                : ''}
                                            .{' '}
                                            <span className="text-table-header-text">
                                                Verifica que los datos estén al
                                                día.
                                            </span>
                                        </div>
                                        <Link
                                            href={pacientes.url()}
                                            className="shrink-0 text-[12px] font-medium text-primary underline hover:no-underline"
                                        >
                                            Volver a pacientes
                                        </Link>
                                    </div>

                                    {initialPatient.open_turns_today.length >
                                        0 && (
                                        <AlertBanner variant="warning">
                                            <div className="flex items-center justify-between gap-2">
                                                <span>
                                                    <strong>
                                                        Atención abierta hoy:
                                                    </strong>{' '}
                                                    {initialPatient.open_turns_today
                                                        .map(
                                                            (t) =>
                                                                `${t.doctor_name} (${TURN_STATUS_LABELS[t.status] ?? t.status})`,
                                                        )
                                                        .join(', ')}
                                                    . Puedes registrar con otro
                                                    médico.
                                                </span>
                                                <Link
                                                    href="/tablero"
                                                    className="shrink-0 text-[12px] font-medium underline hover:no-underline"
                                                >
                                                    Ver en el tablero
                                                </Link>
                                            </div>
                                        </AlertBanner>
                                    )}

                                    {initialPatient.allergies && (
                                        <div className="flex items-start gap-3 rounded-xl border border-error-border bg-error-bg px-4 py-3 text-[13px] text-error-strong">
                                            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                                            <p>
                                                <strong>Alérgico(a) a:</strong>{' '}
                                                {initialPatient.allergies}
                                            </p>
                                        </div>
                                    )}

                                    {errors.open_turn && (
                                        <div className="flex items-start gap-3 rounded-xl border border-error-border bg-error-bg px-4 py-3 text-[13px] text-error-strong">
                                            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                                            <p>{errors.open_turn}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Form fields */}
                            <div className="px-5 py-4">
                                <div className="grid grid-cols-1 gap-x-3.5 gap-y-4 sm:grid-cols-3">
                                    <div>
                                        <label className="mb-1 block text-[13px] font-medium text-text-body">
                                            Tipo de documento{' '}
                                            <span className="text-error">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            value={data.document_type}
                                            onChange={(e) =>
                                                setData(
                                                    'document_type',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-9 w-full rounded-lg border border-card-border bg-white px-3 text-sm outline-none focus:border-primary"
                                        >
                                            {DOC_TYPES.map((t) => (
                                                <option
                                                    key={t.value}
                                                    value={t.value}
                                                >
                                                    {t.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.document_type && (
                                            <p className="mt-1 text-[12px] text-error">
                                                {errors.document_type}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-[13px] font-medium text-text-body">
                                            No. de documento{' '}
                                            <span className="text-error">
                                                *
                                            </span>
                                        </label>
                                        {data.document_type === 'cedula' ? (
                                            <MaskedInput
                                                mask="000-0000000-0"
                                                value={data.document_number}
                                                onChange={(v) =>
                                                    setData(
                                                        'document_number',
                                                        v,
                                                    )
                                                }
                                                autoComplete="off"
                                                data-1p-ignore
                                                data-lpignore="true"
                                                data-form-type="other"
                                                className="h-9 w-full rounded-lg border border-card-border bg-white px-3 text-sm tabular-nums outline-none focus:border-primary disabled:bg-gray-50"
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                value={data.document_number}
                                                onChange={(e) =>
                                                    setData(
                                                        'document_number',
                                                        e.target.value,
                                                    )
                                                }
                                                disabled={
                                                    data.document_type ===
                                                    'no_tiene'
                                                }
                                                autoComplete="off"
                                                data-1p-ignore
                                                data-lpignore="true"
                                                data-form-type="other"
                                                className="h-9 w-full rounded-lg border border-card-border bg-white px-3 text-sm outline-none focus:border-primary disabled:bg-gray-50"
                                            />
                                        )}
                                        {errors.document_number && (
                                            <p className="mt-1 text-[12px] text-error">
                                                {errors.document_number}
                                            </p>
                                        )}

                                        {/* Duplicate patient warning */}
                                        {mode === 'new' && duplicateMatch && (
                                            <div className="mt-2">
                                                <AlertBanner variant="warning">
                                                    Ya existe un paciente con
                                                    este documento:{' '}
                                                    <strong>
                                                        {
                                                            duplicateMatch.full_name
                                                        }
                                                    </strong>{' '}
                                                    (
                                                    {ageLabel(
                                                        duplicateMatch.age,
                                                    )}
                                                    ).{' '}
                                                    <Link
                                                        href={`/pacientes?paciente=${duplicateMatch.id}`}
                                                        className="font-medium underline hover:no-underline"
                                                    >
                                                        Ver ficha
                                                    </Link>{' '}
                                                    ·{' '}
                                                    <Link
                                                        href={`/registro?paciente=${duplicateMatch.id}`}
                                                        className="font-medium underline hover:no-underline"
                                                    >
                                                        Crear atención para este
                                                        paciente
                                                    </Link>
                                                </AlertBanner>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-[13px] font-medium text-text-body">
                                            Fecha de nacimiento{' '}
                                            <span className="text-error">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="date"
                                            value={data.birth_date}
                                            onChange={(e) =>
                                                setData(
                                                    'birth_date',
                                                    e.target.value,
                                                )
                                            }
                                            max={
                                                new Date()
                                                    .toISOString()
                                                    .split('T')[0]
                                            }
                                            autoComplete="new-password"
                                            data-1p-ignore
                                            data-lpignore="true"
                                            data-form-type="other"
                                            className="h-9 w-full rounded-lg border border-card-border bg-white px-3 text-sm outline-none focus:border-primary"
                                        />
                                        {errors.birth_date && (
                                            <p className="mt-1 text-[12px] text-error">
                                                {errors.birth_date}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="field-first-names"
                                            className="mb-1 block text-[13px] font-medium text-text-body"
                                        >
                                            Nombres{' '}
                                            <span className="text-error">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            id="field-first-names"
                                            type="text"
                                            name="patient_first_names"
                                            value={data.first_names}
                                            onChange={(e) =>
                                                setData(
                                                    'first_names',
                                                    e.target.value,
                                                )
                                            }
                                            autoComplete="off"
                                            data-1p-ignore
                                            data-lpignore="true"
                                            data-form-type="other"
                                            className="h-9 w-full rounded-lg border border-card-border bg-white px-3 text-sm outline-none focus:border-primary"
                                        />
                                        {errors.first_names && (
                                            <p className="mt-1 text-[12px] text-error">
                                                {errors.first_names}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-[13px] font-medium text-text-body">
                                            Apellidos{' '}
                                            <span className="text-error">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            name="patient_last_names"
                                            value={data.last_names}
                                            onChange={(e) =>
                                                setData(
                                                    'last_names',
                                                    e.target.value,
                                                )
                                            }
                                            autoComplete="off"
                                            data-1p-ignore
                                            data-lpignore="true"
                                            data-form-type="other"
                                            className="h-9 w-full rounded-lg border border-card-border bg-white px-3 text-sm outline-none focus:border-primary"
                                        />
                                        {errors.last_names && (
                                            <p className="mt-1 text-[12px] text-error">
                                                {errors.last_names}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-[13px] font-medium text-text-body">
                                            Sexo{' '}
                                            <span className="text-error">
                                                *
                                            </span>
                                        </label>
                                        <div className="flex gap-4 pt-1">
                                            {['M', 'F'].map((s) => (
                                                <label
                                                    key={s}
                                                    className="flex cursor-pointer items-center gap-2 text-sm"
                                                >
                                                    <input
                                                        type="radio"
                                                        name="sex"
                                                        value={s}
                                                        checked={data.sex === s}
                                                        onChange={() =>
                                                            setData('sex', s)
                                                        }
                                                        className="accent-primary"
                                                    />
                                                    {s === 'M'
                                                        ? 'Masculino'
                                                        : 'Femenino'}
                                                </label>
                                            ))}
                                        </div>
                                        {errors.sex && (
                                            <p className="mt-1 text-[12px] text-error">
                                                {errors.sex}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-[13px] font-medium text-text-body">
                                            Teléfono{' '}
                                            <span className="text-error">
                                                *
                                            </span>
                                        </label>
                                        <MaskedInput
                                            mask="(000) 000-0000"
                                            value={data.phone}
                                            onChange={(v) =>
                                                setData('phone', v)
                                            }
                                            autoComplete="new-password"
                                            data-1p-ignore
                                            data-lpignore="true"
                                            data-form-type="other"
                                            className="h-9 w-full rounded-lg border border-card-border bg-white px-3 text-sm tabular-nums outline-none focus:border-primary"
                                        />
                                        {errors.phone && (
                                            <p className="mt-1 text-[12px] text-error">
                                                {errors.phone}
                                            </p>
                                        )}
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="mb-1 block text-[13px] font-medium text-text-body">
                                            Dirección
                                        </label>
                                        <input
                                            type="text"
                                            name="patient_address"
                                            value={data.address}
                                            onChange={(e) =>
                                                setData(
                                                    'address',
                                                    e.target.value,
                                                )
                                            }
                                            autoComplete="off"
                                            data-1p-ignore
                                            data-lpignore="true"
                                            data-form-type="other"
                                            className="h-9 w-full rounded-lg border border-card-border bg-white px-3 text-sm outline-none focus:border-primary"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-[13px] font-medium text-text-body">
                                            Persona de contacto
                                        </label>
                                        <input
                                            type="text"
                                            name="patient_emergency_name"
                                            value={data.emergency_contact_name}
                                            onChange={(e) =>
                                                setData(
                                                    'emergency_contact_name',
                                                    e.target.value,
                                                )
                                            }
                                            autoComplete="off"
                                            data-1p-ignore
                                            data-lpignore="true"
                                            data-form-type="other"
                                            className="h-9 w-full rounded-lg border border-card-border bg-white px-3 text-sm outline-none focus:border-primary"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-[13px] font-medium text-text-body">
                                            Tel. de contacto
                                        </label>
                                        <input
                                            type="text"
                                            name="patient_emergency_phone"
                                            value={data.emergency_contact_phone}
                                            onChange={(e) =>
                                                setData(
                                                    'emergency_contact_phone',
                                                    e.target.value,
                                                )
                                            }
                                            autoComplete="off"
                                            data-1p-ignore
                                            data-lpignore="true"
                                            data-form-type="other"
                                            className="h-9 w-full rounded-lg border border-card-border bg-white px-3 text-sm outline-none focus:border-primary"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-[13px] font-medium text-text-body">
                                            Tipo de sangre
                                        </label>
                                        <select
                                            value={data.blood_type}
                                            onChange={(e) =>
                                                setData(
                                                    'blood_type',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-9 w-full rounded-lg border border-card-border bg-white px-3 text-sm outline-none focus:border-primary"
                                        >
                                            <option value="">
                                                — Sin registrar —
                                            </option>
                                            {BLOOD_TYPES.map((bt) => (
                                                <option key={bt} value={bt}>
                                                    {bt}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="sm:col-span-3">
                                        <label className="mb-1 flex items-center gap-1.5 text-[13px] font-medium text-text-body">
                                            <TriangleAlert className="h-3.5 w-3.5 text-error" />
                                            Alergias
                                        </label>
                                        <textarea
                                            value={data.allergies}
                                            onChange={(e) =>
                                                setData(
                                                    'allergies',
                                                    e.target.value,
                                                )
                                            }
                                            rows={2}
                                            placeholder="Medicamentos, alimentos u otros"
                                            className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                        </Panel>

                        {/* Card 2: Nueva atención */}
                        <Panel
                            title="Nueva atención"
                            description="¿Cómo llega el paciente?"
                            noPadding
                        >
                            <div className="px-5 py-4">
                                {/* Attention type cards */}
                                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    {[
                                        {
                                            value: 'consulta',
                                            label: 'Consulta',
                                            desc: 'Por orden de llegada. Se asigna turno.',
                                            disabled: false,
                                        },
                                        {
                                            value: 'emergencia',
                                            label: 'Emergencia',
                                            desc: 'Atención inmediata, pasa a triaje.',
                                            disabled: true,
                                            tooltip:
                                                'Disponible cuando se implemente Emergencia',
                                        },
                                        {
                                            value: 'analisis',
                                            label: 'Solo análisis o imágenes',
                                            desc: 'Sin consulta. Pasa a realizarse los estudios.',
                                            disabled: false,
                                            tooltip: undefined,
                                        },
                                    ].map((opt) => (
                                        <label
                                            key={opt.value}
                                            title={opt.tooltip}
                                            className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${
                                                opt.disabled
                                                    ? 'cursor-not-allowed border-card-border opacity-50'
                                                    : data.attention_type ===
                                                        opt.value
                                                      ? 'border-primary bg-accent-bg'
                                                      : 'border-card-border hover:bg-table-header-bg'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="attention_type"
                                                value={opt.value}
                                                checked={
                                                    data.attention_type ===
                                                    opt.value
                                                }
                                                disabled={opt.disabled}
                                                onChange={() =>
                                                    setData(
                                                        'attention_type',
                                                        opt.value,
                                                    )
                                                }
                                                className="mt-0.5 accent-primary"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-text-heading">
                                                    {opt.label}
                                                </p>
                                                <p className="text-[12px] text-muted">
                                                    {opt.desc}
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                {data.attention_type === 'consulta' && (
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label
                                                htmlFor="field-doctor"
                                                className="mb-1 block text-[13px] font-medium text-text-body"
                                            >
                                                Médico{' '}
                                                <span className="text-error">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                id="field-doctor"
                                                value={data.doctor_id}
                                                onChange={(e) =>
                                                    setData(
                                                        'doctor_id',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-9 w-full rounded-lg border border-card-border bg-white px-3 text-sm outline-none focus:border-primary"
                                            >
                                                <option value="">
                                                    — Seleccionar médico —
                                                </option>
                                                {doctors.map((d) => (
                                                    <option
                                                        key={d.id}
                                                        value={d.id}
                                                    >
                                                        {d.name} — {d.specialty}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.doctor_id && (
                                                <p className="mt-1 text-[12px] text-error">
                                                    {errors.doctor_id}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-[13px] font-medium text-text-body">
                                                Motivo de la visita
                                            </label>
                                            <textarea
                                                value={data.notes}
                                                onChange={(e) =>
                                                    setData(
                                                        'notes',
                                                        e.target.value,
                                                    )
                                                }
                                                rows={2}
                                                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                                            />
                                        </div>
                                    </div>
                                )}

                                {isStudies && (
                                    <StudiesAttention
                                        labCatalog={labCatalog}
                                        imagingCatalog={imagingCatalog}
                                        selected={studies}
                                        externalDoctor={data.external_doctor}
                                        onChange={setStudies}
                                        onExternalDoctor={(v) =>
                                            setData('external_doctor', v)
                                        }
                                        errors={errors}
                                    />
                                )}

                                {mode === 'existing' && errors.open_turn && (
                                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-error-border bg-error-bg px-4 py-3 text-[13px] text-error-strong">
                                        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                                        <p>{errors.open_turn}</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-divider px-5 py-4">
                                <Link
                                    href={pacientes.url()}
                                    className="inline-flex h-9 items-center rounded-lg border border-card-border bg-white px-[14px] text-sm font-medium text-text-body hover:bg-app-bg"
                                >
                                    Cancelar
                                </Link>
                                {mode === 'new' && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={processing}
                                            onClick={handleStoreOnly}
                                            className="inline-flex h-9 items-center rounded-lg border border-card-border bg-white px-[14px] text-sm font-medium text-text-body hover:bg-app-bg disabled:opacity-60"
                                        >
                                            Solo registrar paciente
                                        </button>
                                        <span className="text-[12px] text-muted">
                                            sin crear atención
                                        </span>
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    disabled={!isFormValid || processing}
                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-[14px] text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
                                >
                                    {processing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Check className="h-4 w-4" />
                                    )}
                                    {isStudies
                                        ? 'Registrar y crear orden'
                                        : 'Registrar y crear atención'}
                                </button>
                            </div>
                        </Panel>
                    </div>

                    {/* ── Right column: Resumen ─────────────────────────── */}
                    <div
                        // dynamic-style: flex basis 300px not available as standard Tailwind class
                        style={{ flex: '1 1 300px' }}
                    >
                        <Panel title="Resumen" noPadding>
                            <dl className="divide-y divide-divider text-[13px]">
                                {!isStudies && (
                                    <div className="flex justify-between px-5 py-3">
                                        <dt className="text-muted">
                                            Turno asignado
                                        </dt>
                                        <dd className="font-medium text-text-tertiary">
                                            {data.doctor_id
                                                ? '— al guardar —'
                                                : '—'}
                                        </dd>
                                    </div>
                                )}
                                <div className="flex justify-between px-5 py-3">
                                    <dt className="text-muted">Paciente</dt>
                                    <dd className="max-w-[160px] truncate text-right font-medium text-text-heading">
                                        {data.first_names
                                            ? `${data.first_names} ${data.last_names}`
                                            : '—'}
                                    </dd>
                                </div>
                                {data.birth_date && (
                                    <div className="flex justify-between px-5 py-3">
                                        <dt className="text-muted">Edad</dt>
                                        <dd className="font-medium text-text-heading">
                                            {differenceInYears(
                                                new Date(),
                                                new Date(data.birth_date),
                                            )}{' '}
                                            años
                                        </dd>
                                    </div>
                                )}
                                <div className="flex justify-between px-5 py-3">
                                    <dt className="text-muted">
                                        No. de atención
                                    </dt>
                                    <dd className="font-medium text-text-tertiary">
                                        Se genera al guardar
                                    </dd>
                                </div>
                                <div className="flex justify-between px-5 py-3">
                                    <dt className="text-muted">Tipo</dt>
                                    <dd className="font-medium text-text-heading">
                                        {isStudies
                                            ? 'Solo análisis o imágenes'
                                            : 'Consulta'}
                                    </dd>
                                </div>
                                <div className="flex justify-between px-5 py-3">
                                    <dt className="text-muted">Llegada</dt>
                                    <dd className="font-medium text-text-heading tabular-nums">
                                        {new Date().toLocaleTimeString(
                                            'es-DO',
                                            {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            },
                                        )}
                                    </dd>
                                </div>
                                {selectedDoctor && (
                                    <div className="flex justify-between px-5 py-3">
                                        <dt className="text-muted">Médico</dt>
                                        <dd className="max-w-[160px] truncate text-right font-medium text-text-heading">
                                            {selectedDoctor.name}
                                        </dd>
                                    </div>
                                )}
                                {isStudies && (
                                    <StudiesSummary
                                        labCatalog={labCatalog}
                                        imagingCatalog={imagingCatalog}
                                        selected={studies}
                                    />
                                )}
                                <div className="flex justify-between px-5 py-3">
                                    <dt className="text-muted">
                                        Cargo inicial
                                    </dt>
                                    <dd className="font-medium text-text-tertiary">
                                        —
                                    </dd>
                                </div>
                            </dl>
                        </Panel>
                    </div>
                </div>
            </form>
        </>
    );
}
