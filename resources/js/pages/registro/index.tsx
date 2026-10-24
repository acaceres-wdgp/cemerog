import { Head, useForm } from '@inertiajs/react';
import {
    Check,
    CircleCheck,
    Info,
    Loader2,
    Search,
    TriangleAlert,
    UserPlus,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import MaskedInput from '@/components/cemerog/masked-input';
import Panel from '@/components/cemerog/Panel';

// ── Types ────────────────────────────────────────────────────────────────────

interface Doctor {
    id: number;
    name: string;
    specialty: string;
}

interface PatientSuggestion {
    id: number;
    expediente_number: string;
    full_name: string;
    initials: string;
    document_type: string;
    document_number: string;
    first_names: string;
    last_names: string;
    birth_date: string;
    age: number;
    sex: string;
    phone: string | null;
    address: string | null;
    blood_type: string | null;
    allergies: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    has_open_turn_today: boolean;
    open_turn_status: string | null;
    last_attended_at: string | null;
    total_turns: number;
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
    has_open_turn_today: boolean;
    open_turn?: { id: number; turn_number: number; status: string } | null;
}

interface Props {
    doctors: Doctor[];
    patient: ExistingPatient | null;
}

const DOC_TYPES = [
    { value: 'cedula', label: 'Cédula' },
    { value: 'pasaporte', label: 'Pasaporte' },
    { value: 'cedula_extranjera', label: 'Cédula extranjera' },
    { value: 'no_tiene', label: 'Sin documento' },
];

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// ── Autocomplete ─────────────────────────────────────────────────────────────

function PatientAvatar({
    initials,
    size = 34,
}: {
    initials: string;
    size?: number;
}) {
    return (
        <div
            className="flex shrink-0 items-center justify-center rounded-full bg-[#EEF6E2] font-semibold text-[#2f4a17]"
            style={{ width: size, height: size, fontSize: size * 0.37 }}
        >
            {initials}
        </div>
    );
}

interface AutocompleteProps {
    onSelect: (patient: PatientSuggestion | null) => void;
    searchPath: string;
}

function PatientAutocomplete({ onSelect, searchPath }: AutocompleteProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PatientSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const fetchSuggestions = useCallback(
        async (q: string) => {
            if (q.trim().length < 3) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const res = await fetch(
                    `${searchPath}?q=${encodeURIComponent(q)}`,
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                );
                if (res.ok) setResults(await res.json());
            } finally {
                setLoading(false);
            }
        },
        [searchPath],
    );

    const handleChange = (value: string) => {
        setQuery(value);
        setOpen(true);
        setActiveIdx(-1);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
    };

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setOpen(false);
        onSelect(null);
        inputRef.current?.focus();
    };

    const selectPatient = (p: PatientSuggestion) => {
        setQuery(p.full_name);
        setOpen(false);
        onSelect(p);
    };

    const selectNew = () => {
        setOpen(false);
        onSelect(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!open) return;
        const total = results.length + 1; // +1 for "new patient" option
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIdx((i) => Math.min(i + 1, total - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIdx((i) => Math.max(i - 1, -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIdx >= 0 && activeIdx < results.length) {
                selectPatient(results[activeIdx]);
            } else if (activeIdx === results.length) {
                selectNew();
            }
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    const tooShort = query.trim().length > 0 && query.trim().length < 3;

    return (
        <div className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717a]" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => handleChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query.trim().length >= 3 && setOpen(true)}
                    placeholder="Buscar por cédula, nombre o teléfono…"
                    autoFocus
                    className="h-10 w-full rounded-lg border border-[#e3e9e3] bg-white pl-9 pr-9 text-sm placeholder-[#a1a1aa] outline-none focus:border-[#2E8B3E] focus:ring-1 focus:ring-[#2E8B3E]"
                    aria-label="Buscar paciente"
                    aria-autocomplete="list"
                    aria-expanded={open}
                />
                {query && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-[#333]"
                        aria-label="Limpiar búsqueda"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {open && (
                <ul
                    role="listbox"
                    className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-[#e3e9e3] bg-white shadow-lg"
                >
                    {tooShort ? (
                        <li className="px-4 py-3 text-sm text-[#8a948e]">
                            Escribe al menos 3 caracteres.
                        </li>
                    ) : loading ? (
                        <li className="flex items-center gap-2 px-4 py-3 text-sm text-[#71717a]">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Buscando…
                        </li>
                    ) : (
                        <>
                            {results.length === 0 && (
                                <li className="px-4 py-3 text-sm text-[#8a948e]">
                                    Ningún paciente coincide con «{query}».
                                </li>
                            )}
                            {results.map((p, idx) => (
                                <li
                                    key={p.id}
                                    role="option"
                                    aria-selected={activeIdx === idx}
                                    onClick={() => selectPatient(p)}
                                    className={`flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-[#F6FAF1] ${activeIdx === idx ? 'bg-[#F6FAF1]' : ''}`}
                                >
                                    <PatientAvatar initials={p.initials} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-[#1f2d22]">
                                            {p.full_name}
                                        </p>
                                        <p className="text-[12px] text-[#71717a]">
                                            {p.document_number} · {p.age} años
                                            {p.phone ? ` · ${p.phone}` : ''}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-1">
                                        {p.has_open_turn_today && (
                                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                                Atención abierta
                                            </span>
                                        )}
                                        {p.allergies && (
                                            <span className="rounded-full bg-[#FEF2F2] px-2 py-0.5 text-[11px] font-medium text-[#B91C1C]">
                                                Alergias
                                            </span>
                                        )}
                                        {p.last_attended_at && (
                                            <span className="text-[11px] text-[#a1a1aa]">
                                                Últ. {p.last_attended_at}
                                            </span>
                                        )}
                                    </div>
                                </li>
                            ))}

                            {/* Always show "Register as new" */}
                            <li
                                role="option"
                                aria-selected={activeIdx === results.length}
                                onClick={selectNew}
                                className={`flex cursor-pointer items-center gap-3 border-t border-[#eef0ec] px-4 py-3 hover:bg-[#F6FAF1] ${activeIdx === results.length ? 'bg-[#F6FAF1]' : ''}`}
                            >
                                <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#EEF6E2]">
                                    <UserPlus className="h-4 w-4 text-[#2E8B3E]" />
                                </div>
                                <p className="text-sm font-medium text-[#2E8B3E]">
                                    Registrar como paciente nuevo
                                </p>
                            </li>
                        </>
                    )}
                </ul>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RegistroIndex({
    doctors,
    patient: initialPatient,
}: Props) {
    const [mode, setMode] = useState<'search' | 'existing' | 'new'>(
        initialPatient ? 'existing' : 'search',
    );
    const [existingPatient, setExistingPatient] =
        useState<ExistingPatient | null>(initialPatient);

    const { data, setData, post, processing, errors, reset } = useForm({
        patient_id: initialPatient?.id ?? (null as number | null),
        document_type: initialPatient?.document_type ?? 'cedula',
        document_number: initialPatient?.document_number ?? '',
        first_names: initialPatient?.first_names ?? '',
        last_names: initialPatient?.last_names ?? '',
        birth_date: initialPatient?.birth_date ?? '',
        sex: initialPatient?.sex ?? '',
        phone: initialPatient?.phone ?? '',
        address: initialPatient?.address ?? '',
        blood_type: initialPatient?.blood_type ?? '',
        allergies: initialPatient?.allergies ?? '',
        emergency_contact_name:
            initialPatient?.emergency_contact_name ?? '',
        emergency_contact_phone:
            initialPatient?.emergency_contact_phone ?? '',
        attention_type: 'consulta',
        doctor_id: '' as number | string,
        notes: '',
    });

    const handleSelectExisting = (p: PatientSuggestion) => {
        setExistingPatient({
            id: p.id,
            expediente_number: p.expediente_number,
            full_name: p.full_name,
            initials: p.initials,
            first_names: p.first_names,
            last_names: p.last_names,
            document_type: p.document_type,
            document_number: p.document_number,
            birth_date: p.birth_date,
            sex: p.sex,
            phone: p.phone,
            address: p.address,
            blood_type: p.blood_type,
            allergies: p.allergies,
            emergency_contact_name: p.emergency_contact_name,
            emergency_contact_phone: p.emergency_contact_phone,
            total_turns: p.total_turns,
            last_attended_at: p.last_attended_at,
            has_open_turn_today: p.has_open_turn_today,
            open_turn: null,
        });
        setMode('existing');
        setData((prev) => ({
            ...prev,
            patient_id: p.id,
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
        }));
    };

    const handleSelectNew = () => {
        setExistingPatient(null);
        setMode('new');
        setData((prev) => ({ ...prev, patient_id: null }));
    };

    const handleChangePatient = () => {
        setMode('search');
        setExistingPatient(null);
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/registro', { preserveScroll: true });
    };

    const selectedDoctor = doctors.find((d) => d.id === Number(data.doctor_id));
    const locked = mode === 'search';
    const isFormValid = !locked && !!data.doctor_id;

    return (
        <>
            <Head title="Registro de pacientes" />

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Intro */}
                <p className="text-[13.5px]" style={{ color: '#5f6b64' }}>
                    Busca primero por cédula. Si el paciente no existe,
                    completa sus datos y crea la atención.
                </p>

                {/* Main grid */}
                <div
                    className="flex flex-wrap gap-4"
                    style={{ alignItems: 'flex-start' }}
                >
                    {/* ── Left column ───────────────────────────────────── */}
                    <div
                        className="flex min-w-0 flex-col gap-4"
                        style={{ flex: '1.6 1 560px' }}
                    >
                        {/* Card 1: Datos del paciente */}
                        <Panel
                            title="Datos del paciente"
                            description="Los campos con * son obligatorios."
                            noPadding
                        >
                            {/* Search zone */}
                            <div className="border-b border-[#eef0ec] px-5 py-4">
                                <PatientAutocomplete
                                    searchPath="/registro/pacientes/buscar"
                                    onSelect={(p) => {
                                        if (p) handleSelectExisting(p);
                                        else handleSelectNew();
                                    }}
                                />
                            </div>

                            {/* Banners */}
                            {mode !== 'search' && (
                                <div className="flex flex-col gap-3 border-b border-[#eef0ec] px-5 py-4">
                                    {mode === 'existing' && existingPatient && (
                                        <div className="flex items-start gap-3 rounded-xl border border-[#DCEBC9] bg-[#EEF6E2] px-4 py-3 text-[13px] text-[#1f4a1a]">
                                            <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#2E8B3E]" />
                                            <div className="flex-1">
                                                <strong>
                                                    Paciente existente
                                                </strong>{' '}
                                                · Expediente{' '}
                                                {
                                                    existingPatient.expediente_number
                                                }{' '}
                                                ·{' '}
                                                {existingPatient.total_turns}{' '}
                                                atenciones
                                                {existingPatient.last_attended_at
                                                    ? ` · última ${existingPatient.last_attended_at}`
                                                    : ''}
                                                .{' '}
                                                <span className="text-[#56693f]">
                                                    Verifica que los datos estén
                                                    al día.
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleChangePatient}
                                                className="shrink-0 text-[12px] font-medium text-[#2E8B3E] underline hover:no-underline"
                                            >
                                                Cambiar paciente
                                            </button>
                                        </div>
                                    )}

                                    {mode === 'existing' &&
                                        existingPatient?.has_open_turn_today &&
                                        existingPatient.open_turn && (
                                            <div className="flex items-start gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#991B1B]">
                                                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                                                <div className="flex-1">
                                                    Ya tiene la atención{' '}
                                                    <strong>
                                                        A-
                                                        {
                                                            existingPatient
                                                                .open_turn.id
                                                        }
                                                    </strong>{' '}
                                                    abierta hoy (
                                                    {
                                                        existingPatient.open_turn
                                                            .status
                                                    }
                                                    ). Evita duplicarla.
                                                </div>
                                                <a
                                                    href="/tablero"
                                                    className="shrink-0 text-[12px] font-medium text-[#991B1B] underline hover:no-underline"
                                                >
                                                    Ver en el tablero
                                                </a>
                                            </div>
                                        )}

                                    {mode === 'existing' &&
                                        existingPatient?.allergies && (
                                            <div className="flex items-start gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#991B1B]">
                                                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                                                <p>
                                                    <strong>
                                                        Alérgico(a) a:
                                                    </strong>{' '}
                                                    {existingPatient.allergies}
                                                </p>
                                            </div>
                                        )}

                                    {mode === 'new' && (
                                        <div className="flex items-start gap-3 rounded-xl border border-[#BAE6FD] bg-[#EFF6FF] px-4 py-3 text-[13px] text-[#1e40af]">
                                            <Info className="mt-0.5 h-4 w-4 shrink-0" />
                                            <p>
                                                Se registrará como{' '}
                                                <strong>paciente nuevo</strong>.
                                                Completa sus datos.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={handleChangePatient}
                                                className="ml-auto shrink-0 text-[12px] font-medium text-[#1e40af] underline hover:no-underline"
                                            >
                                                Volver a buscar
                                            </button>
                                        </div>
                                    )}

                                    {errors.open_turn && (
                                        <div className="flex items-start gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#991B1B]">
                                            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                                            <p>{errors.open_turn}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Form fields – always visible, disabled when locked */}
                            <div className="px-5 py-4">
                                {locked && (
                                    <div className="mb-4 flex items-center gap-2 text-[13px]" style={{ color: '#71717a' }}>
                                        <Info className="h-4 w-4 shrink-0" />
                                        Busca un paciente o elige «Registrar
                                        como paciente nuevo» para continuar.
                                    </div>
                                )}
                                <div
                                    className="grid grid-cols-1 gap-x-3.5 gap-y-4 sm:grid-cols-3"
                                    style={
                                        locked
                                            ? {
                                                  opacity: 0.55,
                                                  pointerEvents: 'none',
                                              }
                                            : undefined
                                    }
                                >
                                    <div>
                                        <label className="mb-1 block text-[13px] font-medium text-[#333]">
                                            Tipo de documento{' '}
                                            <span className="text-[#b91c1c]">
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
                                            className="h-9 w-full rounded-lg border border-[#e3e9e3] bg-white px-3 text-sm outline-none focus:border-[#2E8B3E]"
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
                                            <p className="mt-1 text-[12px] text-[#b91c1c]">
                                                {errors.document_type}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-[13px] font-medium text-[#333]">
                                            No. de documento{' '}
                                            <span className="text-[#b91c1c]">
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
                                                disabled={
                                                    data.document_type ===
                                                    'no_tiene'
                                                }
                                                className="h-9 w-full rounded-lg border border-[#e3e9e3] bg-white px-3 text-sm tabular-nums outline-none focus:border-[#2E8B3E] disabled:bg-[#f9fafb]"
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
                                                className="h-9 w-full rounded-lg border border-[#e3e9e3] bg-white px-3 text-sm outline-none focus:border-[#2E8B3E] disabled:bg-[#f9fafb]"
                                            />
                                        )}
                                        {errors.document_number && (
                                            <p className="mt-1 text-[12px] text-[#b91c1c]">
                                                {errors.document_number}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-[13px] font-medium text-[#333]">
                                            Fecha de nacimiento{' '}
                                            <span className="text-[#b91c1c]">
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
                                            className="h-9 w-full rounded-lg border border-[#e3e9e3] bg-white px-3 text-sm outline-none focus:border-[#2E8B3E]"
                                        />
                                        {errors.birth_date && (
                                            <p className="mt-1 text-[12px] text-[#b91c1c]">
                                                {errors.birth_date}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-[13px] font-medium text-[#333]">
                                            Nombres{' '}
                                            <span className="text-[#b91c1c]">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.first_names}
                                            onChange={(e) =>
                                                setData(
                                                    'first_names',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-9 w-full rounded-lg border border-[#e3e9e3] bg-white px-3 text-sm outline-none focus:border-[#2E8B3E]"
                                        />
                                        {errors.first_names && (
                                            <p className="mt-1 text-[12px] text-[#b91c1c]">
                                                {errors.first_names}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-[13px] font-medium text-[#333]">
                                            Apellidos{' '}
                                            <span className="text-[#b91c1c]">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.last_names}
                                            onChange={(e) =>
                                                setData(
                                                    'last_names',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-9 w-full rounded-lg border border-[#e3e9e3] bg-white px-3 text-sm outline-none focus:border-[#2E8B3E]"
                                        />
                                        {errors.last_names && (
                                            <p className="mt-1 text-[12px] text-[#b91c1c]">
                                                {errors.last_names}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-[13px] font-medium text-[#333]">
                                            Sexo{' '}
                                            <span className="text-[#b91c1c]">
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
                                                        className="accent-[#2E8B3E]"
                                                    />
                                                    {s === 'M'
                                                        ? 'Masculino'
                                                        : 'Femenino'}
                                                </label>
                                            ))}
                                        </div>
                                        {errors.sex && (
                                            <p className="mt-1 text-[12px] text-[#b91c1c]">
                                                {errors.sex}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-[13px] font-medium text-[#333]">
                                            Teléfono{' '}
                                            <span className="text-[#b91c1c]">
                                                *
                                            </span>
                                        </label>
                                        <MaskedInput
                                            mask="(000) 000-0000"
                                            value={data.phone}
                                            onChange={(v) =>
                                                setData('phone', v)
                                            }
                                            className="h-9 w-full rounded-lg border border-[#e3e9e3] bg-white px-3 text-sm tabular-nums outline-none focus:border-[#2E8B3E]"
                                        />
                                        {errors.phone && (
                                            <p className="mt-1 text-[12px] text-[#b91c1c]">
                                                {errors.phone}
                                            </p>
                                        )}
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="mb-1 block text-[13px] font-medium text-[#333]">
                                            Dirección
                                        </label>
                                        <input
                                            type="text"
                                            value={data.address}
                                            onChange={(e) =>
                                                setData(
                                                    'address',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-9 w-full rounded-lg border border-[#e3e9e3] bg-white px-3 text-sm outline-none focus:border-[#2E8B3E]"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-[13px] font-medium text-[#333]">
                                            Persona de contacto
                                        </label>
                                        <input
                                            type="text"
                                            value={data.emergency_contact_name}
                                            onChange={(e) =>
                                                setData(
                                                    'emergency_contact_name',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-9 w-full rounded-lg border border-[#e3e9e3] bg-white px-3 text-sm outline-none focus:border-[#2E8B3E]"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-[13px] font-medium text-[#333]">
                                            Tel. de contacto
                                        </label>
                                        <input
                                            type="text"
                                            value={
                                                data.emergency_contact_phone
                                            }
                                            onChange={(e) =>
                                                setData(
                                                    'emergency_contact_phone',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-9 w-full rounded-lg border border-[#e3e9e3] bg-white px-3 text-sm outline-none focus:border-[#2E8B3E]"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-[13px] font-medium text-[#333]">
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
                                            className="h-9 w-full rounded-lg border border-[#e3e9e3] bg-white px-3 text-sm outline-none focus:border-[#2E8B3E]"
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
                                        <label className="mb-1 flex items-center gap-1.5 text-[13px] font-medium text-[#333]">
                                            <TriangleAlert className="h-3.5 w-3.5 text-[#b91c1c]" />
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
                                            className="w-full rounded-lg border border-[#e3e9e3] bg-white px-3 py-2 text-sm outline-none focus:border-[#2E8B3E]"
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
                            <div
                                className="px-5 py-4"
                                style={
                                    locked
                                        ? {
                                              opacity: 0.55,
                                              pointerEvents: 'none',
                                          }
                                        : undefined
                                }
                            >
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
                                            tooltip: 'Disponible cuando se implemente Emergencia',
                                        },
                                        {
                                            value: 'analisis',
                                            label: 'Solo análisis o imágenes',
                                            desc: 'Sin consulta. Paga en caja.',
                                            disabled: true,
                                            tooltip: 'Disponible cuando se implemente Laboratorio e Imágenes',
                                        },
                                    ].map((opt) => (
                                        <label
                                            key={opt.value}
                                            title={opt.tooltip}
                                            className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${
                                                opt.disabled
                                                    ? 'cursor-not-allowed opacity-50 border-[#e3e9e3]'
                                                    : data.attention_type === opt.value
                                                      ? 'border-[#2E8B3E] bg-[#EEF6E2]'
                                                      : 'border-[#e3e9e3] hover:bg-[#F6FAF1]'
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
                                                className="mt-0.5 accent-[#2E8B3E]"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-[#1f2d22]">
                                                    {opt.label}
                                                </p>
                                                <p className="text-[12px] text-[#71717a]">
                                                    {opt.desc}
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                {data.attention_type === 'consulta' && (
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-[13px] font-medium text-[#333]">
                                                Médico{' '}
                                                <span className="text-[#b91c1c]">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                value={data.doctor_id}
                                                onChange={(e) =>
                                                    setData(
                                                        'doctor_id',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-9 w-full rounded-lg border border-[#e3e9e3] bg-white px-3 text-sm outline-none focus:border-[#2E8B3E]"
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
                                                <p className="mt-1 text-[12px] text-[#b91c1c]">
                                                    {errors.doctor_id}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-[13px] font-medium text-[#333]">
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
                                                className="w-full rounded-lg border border-[#e3e9e3] bg-white px-3 py-2 text-sm outline-none focus:border-[#2E8B3E]"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 border-t border-[#eef0ec] px-5 py-4">
                                <a
                                    href="/tablero"
                                    className="inline-flex h-9 items-center rounded-lg border border-[#e3e9e3] bg-white px-[14px] text-sm font-medium text-[#333] hover:bg-[#F3F7F2]"
                                >
                                    Cancelar
                                </a>
                                <button
                                    type="submit"
                                    disabled={!isFormValid || processing}
                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#2E8B3E] px-[14px] text-sm font-medium text-white hover:bg-[#277a35] disabled:opacity-60"
                                >
                                    {processing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Check className="h-4 w-4" />
                                    )}
                                    Registrar y crear atención
                                </button>
                            </div>
                        </Panel>
                    </div>

                    {/* ── Right column: Resumen ─────────────────────────── */}
                    <div style={{ flex: '1 1 300px' }}>
                        <Panel title="Resumen" noPadding>
                            <dl className="divide-y divide-[#eef0ec] text-[13px]">
                                <div className="flex justify-between px-5 py-3">
                                    <dt className="text-[#71717a]">
                                        Turno asignado
                                    </dt>
                                    <dd className="font-medium text-[#8a948e]">
                                        {data.doctor_id
                                            ? '— al guardar —'
                                            : '—'}
                                    </dd>
                                </div>
                                <div className="flex justify-between px-5 py-3">
                                    <dt className="text-[#71717a]">Paciente</dt>
                                    <dd className="max-w-[160px] truncate text-right font-medium text-[#1f2d22]">
                                        {data.first_names
                                            ? `${data.first_names} ${data.last_names}`
                                            : '—'}
                                    </dd>
                                </div>
                                {data.birth_date && (
                                    <div className="flex justify-between px-5 py-3">
                                        <dt className="text-[#71717a]">Edad</dt>
                                        <dd className="font-medium text-[#1f2d22]">
                                            {new Date().getFullYear() -
                                                new Date(
                                                    data.birth_date,
                                                ).getFullYear()}{' '}
                                            años
                                        </dd>
                                    </div>
                                )}
                                <div className="flex justify-between px-5 py-3">
                                    <dt className="text-[#71717a]">
                                        No. de atención
                                    </dt>
                                    <dd className="font-medium text-[#8a948e]">
                                        Se genera al guardar
                                    </dd>
                                </div>
                                <div className="flex justify-between px-5 py-3">
                                    <dt className="text-[#71717a]">Tipo</dt>
                                    <dd className="font-medium text-[#1f2d22]">
                                        {data.attention_type === 'consulta'
                                            ? 'Consulta'
                                            : '—'}
                                    </dd>
                                </div>
                                <div className="flex justify-between px-5 py-3">
                                    <dt className="text-[#71717a]">Llegada</dt>
                                    <dd className="tabular-nums font-medium text-[#1f2d22]">
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
                                        <dt className="text-[#71717a]">
                                            Médico
                                        </dt>
                                        <dd className="max-w-[160px] truncate text-right font-medium text-[#1f2d22]">
                                            {selectedDoctor.name}
                                        </dd>
                                    </div>
                                )}
                                <div className="flex justify-between px-5 py-3">
                                    <dt className="text-[#71717a]">
                                        Cargo inicial
                                    </dt>
                                    <dd className="font-medium text-[#8a948e]">
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
