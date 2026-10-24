import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TurnRow = {
    id: number;
    turn_number: number;
    turn_order: number;
    patient_name: string;
    patient_initials: string;
    patient_document: string;
    patient_age: number;
    patient_sex: string;
    doctor_id: number;
    doctor_name: string;
    doctor_specialty: string;
    arrived_at: string;
    status: 'espera' | 'en_consulta';
    appointment_id: number | null;
};

type CitaRow = {
    id: number;
    appointment_time: string | null;
    patient_id: number;
    patient_name: string;
    patient_initials: string;
    patient_phone: string | null;
    doctor_id: number;
    doctor_name: string;
    doctor_specialty: string;
    type: string;
    status: 'pendiente' | 'confirmada' | 'cancelada' | 'no_asistio';
    notes: string | null;
    turn_number: number | null;
    has_turn: boolean;
};

type DoctorOption = {
    id: number;
    name: string;
    specialty: string;
    initials: string;
};
type PatientResult = { id: number; full_name: string; document_number: string };

type Props = {
    turns: TurnRow[];
    appointments: CitaRow[];
    doctors: DoctorOption[];
    en_espera: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
    consulta: 'Consulta',
    seguimiento: 'Seguimiento',
    primera_vez: 'Primera vez',
};

const CITA_STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
    pendiente: { bg: '#FEF3C7', fg: '#92400E' },
    confirmada: { bg: '#DBEAFE', fg: '#1E40AF' },
    no_asistio: { bg: '#F4F4F5', fg: '#52525B' },
};

const CITA_STATUS_LABELS: Record<string, string> = {
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    no_asistio: 'No asistió',
};

const DOC_PALETTES = [
    { bg: '#EEF6E2', fg: '#2E8B3E' },
    { bg: '#DBEAFE', fg: '#1E40AF' },
    { bg: '#EDE9FE', fg: '#5B21B6' },
    { bg: '#FCE7F3', fg: '#9D174D' },
    { bg: '#CFFAFE', fg: '#155E75' },
    { bg: '#FEF3C7', fg: '#92400E' },
];
const docPalette = (id: number) => DOC_PALETTES[id % DOC_PALETTES.length];

const ESPERA_BAR = '#D97706';
const CONSULTA_BAR = '#2563EB';

const thStyle: React.CSSProperties = {
    textAlign: 'left',
    fontWeight: 600,
    fontSize: 11.5,
    letterSpacing: '.05em',
    textTransform: 'uppercase',
    color: '#56693f',
    padding: '0 12px',
    height: 40,
    background: '#F6FAF1',
    borderBottom: '1px solid #DCEBC9',
    whiteSpace: 'nowrap',
};

const inputStyle: React.CSSProperties = {
    height: 36,
    width: '100%',
    padding: '0 12px',
    border: '1px solid #e4e4e7',
    borderRadius: 10,
    outline: 'none',
    fontFamily: 'inherit',
    fontSize: 14,
    boxSizing: 'border-box',
};

// ─── Patient search ───────────────────────────────────────────────────────────

function PatientSearch({
    selected,
    query,
    onQueryChange,
    onSelect,
    onClear,
    error,
}: {
    selected: PatientResult | null;
    query: string;
    onQueryChange: (v: string) => void;
    onSelect: (p: PatientResult) => void;
    onClear: () => void;
    error?: string;
}) {
    const [results, setResults] = useState<PatientResult[]>([]);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selected) {
            setOpen(false);
            return;
        }
        if (query.length < 2) {
            setResults([]);
            setOpen(false);
            return;
        }
        const t = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/citas/pacientes/buscar?q=${encodeURIComponent(query)}`,
                );
                if (!res.ok) {
                    setResults([]);
                    setOpen(true);
                    return;
                }
                const data: PatientResult[] = await res.json();
                setResults(Array.isArray(data) ? data : []);
                setOpen(true);
            } catch {
                setResults([]);
                setOpen(true);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [query, selected]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node))
                setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (selected) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    height: 36,
                    padding: '0 10px 0 12px',
                    border: '1px solid #B9DC8E',
                    borderRadius: 10,
                    background: '#EEF6E2',
                }}
            >
                <span
                    style={{
                        width: 22,
                        height: 22,
                        flexShrink: 0,
                        borderRadius: '50%',
                        background: '#2E8B3E',
                        color: '#fff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 700,
                    }}
                >
                    ✓
                </span>
                <span
                    style={{
                        flex: 1,
                        fontWeight: 500,
                        fontSize: 14,
                        color: '#1f2d22',
                    }}
                >
                    {selected.full_name}
                </span>
                <span style={{ fontSize: 12, color: '#56693f' }}>
                    {selected.document_number}
                </span>
                <button
                    type="button"
                    onClick={onClear}
                    style={{
                        width: 22,
                        height: 22,
                        flexShrink: 0,
                        border: 'none',
                        borderRadius: 6,
                        background: 'rgba(0,0,0,.08)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        color: '#56693f',
                    }}
                >
                    ✕
                </button>
            </div>
        );
    }

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <input
                style={{
                    ...inputStyle,
                    borderColor: error ? '#b91c1c' : '#e4e4e7',
                }}
                value={query}
                onChange={(e) => {
                    onQueryChange(e.target.value);
                    if (!e.target.value) setOpen(false);
                }}
                placeholder="Buscar por nombre o cédula…"
                autoComplete="off"
                autoFocus
            />
            {error && (
                <span style={{ color: '#b91c1c', fontSize: 12 }}>{error}</span>
            )}
            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 200,
                        background: '#fff',
                        border: '1px solid #e3e9e3',
                        borderRadius: 10,
                        boxShadow: '0 8px 24px rgba(0,0,0,.1)',
                        marginTop: 4,
                        overflow: 'hidden',
                    }}
                >
                    {results.length === 0 ? (
                        <div
                            style={{
                                padding: '10px 14px',
                                color: '#71717a',
                                fontSize: 13,
                            }}
                        >
                            No se encontraron pacientes.
                        </div>
                    ) : (
                        results.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                    onSelect(p);
                                    setOpen(false);
                                }}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '10px 14px',
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #f3f4f6',
                                    fontFamily: 'inherit',
                                }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.background =
                                        '#F6FAF1')
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.background = 'none')
                                }
                            >
                                <div style={{ fontWeight: 500, fontSize: 14 }}>
                                    {p.full_name}
                                </div>
                                <div style={{ color: '#71717a', fontSize: 12 }}>
                                    {p.document_number}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Walk-in turn modal ───────────────────────────────────────────────────────

function AgregarTurnoModal({
    onClose,
    doctors,
}: {
    onClose: () => void;
    doctors: DoctorOption[];
}) {
    const [patientQuery, setPatientQuery] = useState('');
    const [selectedPatient, setSelectedPatient] =
        useState<PatientResult | null>(null);
    const [doctorId, setDoctorId] = useState('');
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const errs: Record<string, string> = {};
        if (!selectedPatient) errs.patient_id = 'Selecciona un paciente.';
        if (!doctorId) errs.doctor_id = 'Selecciona un médico.';
        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }

        setProcessing(true);
        router.post(
            '/tablero/turnos',
            {
                patient_id: selectedPatient!.id,
                doctor_id: Number(doctorId),
                appointment_id: null,
                notes: notes || null,
            },
            {
                onSuccess: () => onClose(),
                onError: (e) => {
                    setErrors(e as Record<string, string>);
                    setProcessing(false);
                },
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <>
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 40,
                    background: 'rgba(0,0,0,.4)',
                }}
            />
            <div
                style={{
                    position: 'fixed',
                    zIndex: 41,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%,-50%)',
                    width: 460,
                    maxWidth: '95vw',
                    background: '#fff',
                    borderRadius: 16,
                    boxShadow: '0 24px 64px -16px rgba(16,40,24,.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #eef0ec',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <span
                        style={{
                            fontFamily: 'Bitter,Georgia,serif',
                            fontWeight: 600,
                            fontSize: 17,
                            color: '#1f2d22',
                        }}
                    >
                        Agregar turno
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            width: 30,
                            height: 30,
                            border: 'none',
                            borderRadius: 8,
                            background: '#F3F7F2',
                            cursor: 'pointer',
                            fontSize: 16,
                        }}
                    >
                        ✕
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div
                        style={{
                            padding: '16px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 14,
                        }}
                    >
                        <div
                            style={{
                                padding: '10px 14px',
                                background: '#EEF6E2',
                                border: '1px solid #c6e5a8',
                                borderRadius: 10,
                                fontSize: 13,
                                color: '#2E8B3E',
                            }}
                        >
                            Turno sin cita previa. El paciente se agrega
                            directamente a la cola de espera.
                        </div>
                        <label
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                                fontWeight: 500,
                                fontSize: 14,
                            }}
                        >
                            <span>Paciente *</span>
                            <PatientSearch
                                selected={selectedPatient}
                                query={patientQuery}
                                onQueryChange={(v) => setPatientQuery(v)}
                                onSelect={(p) => {
                                    setSelectedPatient(p);
                                    setPatientQuery('');
                                }}
                                onClear={() => {
                                    setSelectedPatient(null);
                                    setPatientQuery('');
                                }}
                                error={errors.patient_id}
                            />
                        </label>
                        <label
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                                fontWeight: 500,
                                fontSize: 14,
                            }}
                        >
                            <span>Médico *</span>
                            <select
                                value={doctorId}
                                onChange={(e) => setDoctorId(e.target.value)}
                                style={{
                                    ...inputStyle,
                                    borderColor: errors.doctor_id
                                        ? '#b91c1c'
                                        : '#e4e4e7',
                                    cursor: 'pointer',
                                }}
                            >
                                <option value="">Seleccionar médico…</option>
                                {doctors.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name} — {d.specialty}
                                    </option>
                                ))}
                            </select>
                            {errors.doctor_id && (
                                <span
                                    style={{ color: '#b91c1c', fontSize: 12 }}
                                >
                                    {errors.doctor_id}
                                </span>
                            )}
                        </label>
                        <label
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                                fontWeight: 500,
                                fontSize: 14,
                            }}
                        >
                            <span>
                                Notas{' '}
                                <span
                                    style={{
                                        fontWeight: 400,
                                        color: '#71717a',
                                    }}
                                >
                                    (opcional)
                                </span>
                            </span>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                placeholder="Motivo de consulta…"
                                style={{
                                    ...inputStyle,
                                    height: 'auto',
                                    padding: '8px 12px',
                                    resize: 'vertical',
                                    lineHeight: 1.5,
                                }}
                            />
                        </label>
                    </div>
                    <div
                        style={{
                            padding: '14px 20px',
                            borderTop: '1px solid #eef0ec',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 8,
                        }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                height: 36,
                                padding: '0 14px',
                                borderRadius: 10,
                                border: '1px solid #dfe7df',
                                background: '#F6F9F5',
                                fontWeight: 500,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 14,
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            style={{
                                height: 36,
                                padding: '0 16px',
                                borderRadius: 10,
                                border: 'none',
                                background: processing ? '#7cb987' : '#2E8B3E',
                                color: '#fff',
                                fontWeight: 500,
                                cursor: processing ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 14,
                            }}
                        >
                            {processing ? 'Asignando…' : '+ Asignar turno'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TableroIndex({ turns, appointments, doctors }: Props) {
    const [activeTab, setActiveTab] = useState('todas');
    const [citaTab, setCitaTab] = useState('pendientes');
    const [showWalkIn, setShowWalkIn] = useState(false);

    const TURN_TABS = [
        { key: 'todas', label: 'Todas', n: turns.length },
        {
            key: 'espera',
            label: 'En espera',
            n: turns.filter((t) => t.status === 'espera').length,
        },
        {
            key: 'consulta',
            label: 'En consulta',
            n: turns.filter((t) => t.status === 'en_consulta').length,
        },
        { key: 'emergencia', label: 'Emergencia', n: 0 },
        { key: 'internados', label: 'Internados', n: 0 },
    ];

    const filteredTurns =
        activeTab === 'todas'
            ? turns
            : activeTab === 'espera'
              ? turns.filter((t) => t.status === 'espera')
              : activeTab === 'consulta'
                ? turns.filter((t) => t.status === 'en_consulta')
                : [];

    const pendingCitas = appointments.filter((c) => !c.has_turn);
    const visibleCitas = citaTab === 'pendientes' ? pendingCitas : appointments;

    const STATS = [
        {
            label: 'En espera',
            n: turns.filter((t) => t.status === 'espera').length,
            dot: '#D97706',
            nc: '#92400E',
            sub: 'Sala de espera',
        },
        {
            label: 'En consulta',
            n: turns.filter((t) => t.status === 'en_consulta').length,
            dot: '#2563EB',
            nc: '#1E40AF',
            sub: '—',
        },
        { label: 'Emergencia', n: 0, dot: '#DC2626', nc: '#991B1B', sub: '—' },
        { label: 'Internados', n: 0, dot: '#7C3AED', nc: '#5B21B6', sub: '—' },
        { label: 'Total hoy', n: 0, dot: '#2E8B3E', nc: '#1f2d22', sub: '—' },
    ];

    function assignTurnFromCita(cita: CitaRow) {
        router.post(
            '/tablero/turnos',
            {
                patient_id: cita.patient_id,
                doctor_id: cita.doctor_id,
                appointment_id: cita.id,
            },
            { preserveScroll: true },
        );
    }

    function markNoShow(cita: CitaRow) {
        if (
            !confirm(`¿Marcar la cita de ${cita.patient_name} como no asistió?`)
        )
            return;
        router.patch(
            `/citas/${cita.id}/status`,
            { status: 'no_asistio' },
            { preserveScroll: true },
        );
    }

    function patchTurnStatus(id: number, status: string) {
        router.patch(
            `/tablero/turnos/${id}/status`,
            { status },
            { preserveScroll: true },
        );
    }

    function reorderTurn(id: number, direction: 'up' | 'down') {
        router.patch(
            `/tablero/turnos/${id}/reorder`,
            { direction },
            { preserveScroll: true },
        );
    }

    const nextTurn = turns.find((t) => t.status === 'espera');

    return (
        <div className="flex flex-col gap-5">
            {/* ── Header ── */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                }}
            >
                <div>
                    <h1
                        style={{
                            margin: 0,
                            fontFamily: 'Bitter,Georgia,serif',
                            fontSize: 28,
                            fontWeight: 600,
                            color: '#1f2d22',
                            lineHeight: 1.2,
                        }}
                    >
                        Tablero de atenciones
                    </h1>
                    <p style={{ margin: '4px 0 0', color: '#5f6b64' }}>
                        Pacientes en la clínica y su estado actual.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {nextTurn && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                height: 36,
                                padding: '0 12px',
                                border: '1px solid #e4e4e7',
                                borderRadius: 10,
                                fontSize: 13,
                            }}
                        >
                            <span style={{ color: '#71717a' }}>Siguiente</span>
                            <strong
                                style={{
                                    fontSize: 15,
                                    fontVariantNumeric: 'tabular-nums',
                                }}
                            >
                                T-
                                {String(nextTurn.turn_number).padStart(2, '0')}
                            </strong>
                        </div>
                    )}
                    <button
                        onClick={() => setShowWalkIn(true)}
                        style={{
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            height: 36,
                            padding: '0 14px',
                            borderRadius: 10,
                            border: 'none',
                            background: '#2E8B3E',
                            color: '#fff',
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: 14,
                        }}
                    >
                        + Agregar turno
                    </button>
                </div>
            </div>

            {/* ── Stat cards ── */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
                    gap: 12,
                }}
            >
                {STATS.map((k) => (
                    <div
                        key={k.label}
                        style={{
                            background: '#fff',
                            border: '1px solid #e3e9e3',
                            borderRadius: 14,
                            padding: '18px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: 11.5,
                                fontWeight: 600,
                                letterSpacing: '.06em',
                                textTransform: 'uppercase',
                                color: '#52605a',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <span
                                style={{
                                    flexShrink: 0,
                                    width: 7,
                                    height: 7,
                                    borderRadius: '50%',
                                    background: k.dot,
                                }}
                            />
                            {k.label}
                        </div>
                        <div
                            style={{
                                fontFamily: 'Bitter,Georgia,serif',
                                fontSize: 34,
                                fontWeight: 700,
                                lineHeight: 1.1,
                                color: k.nc,
                                fontVariantNumeric: 'tabular-nums',
                            }}
                        >
                            {k.n}
                        </div>
                        <div style={{ fontSize: 12.5, color: '#8a948e' }}>
                            {k.sub}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Atenciones (turnos activos) ── */}
            <div
                style={{
                    background: '#fff',
                    border: '1px solid #e3e9e3',
                    borderRadius: 14,
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        gap: 16,
                        flexWrap: 'wrap',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <span
                            style={{
                                fontFamily: 'Bitter,Georgia,serif',
                                fontSize: 18,
                                fontWeight: 600,
                                color: '#1f2d22',
                            }}
                        >
                            Atenciones
                        </span>
                        <span
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: 24,
                                height: 22,
                                padding: '0 7px',
                                borderRadius: 999,
                                background: '#F3F7F2',
                                border: '1px solid #e3e9e3',
                                fontSize: 12,
                                fontWeight: 600,
                            }}
                        >
                            {filteredTurns.length}
                        </span>
                    </div>
                    <div
                        style={{
                            display: 'inline-flex',
                            background: '#F3F7F2',
                            border: '1px solid #e3e9e3',
                            borderRadius: 11,
                            padding: 3,
                            gap: 2,
                        }}
                    >
                        {TURN_TABS.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setActiveTab(t.key)}
                                style={{
                                    whiteSpace: 'nowrap',
                                    height: 30,
                                    padding: '0 12px',
                                    border: 'none',
                                    borderRadius: 10,
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    background:
                                        activeTab === t.key
                                            ? '#fff'
                                            : 'transparent',
                                    color:
                                        activeTab === t.key
                                            ? '#1f2d22'
                                            : '#52605a',
                                    boxShadow:
                                        activeTab === t.key
                                            ? '0 1px 3px rgba(0,0,0,.1)'
                                            : 'none',
                                    fontFamily: 'inherit',
                                    fontSize: 14,
                                }}
                            >
                                {t.label}{' '}
                                <span
                                    style={{
                                        color: '#71717a',
                                        fontWeight: 400,
                                    }}
                                >
                                    {t.n}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            minWidth: 800,
                        }}
                    >
                        <thead>
                            <tr>
                                <th style={{ ...thStyle, paddingLeft: 16 }}>
                                    Turno
                                </th>
                                <th style={thStyle}>Paciente</th>
                                <th style={thStyle}>Médico</th>
                                <th style={thStyle}>Especialidad</th>
                                <th style={thStyle}>Llegada</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTurns.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        style={{
                                            padding: '32px 20px',
                                            textAlign: 'center',
                                            color: '#8a948e',
                                            fontSize: 13,
                                        }}
                                    >
                                        No hay pacientes en espera en este
                                        momento.
                                    </td>
                                </tr>
                            ) : (
                                filteredTurns.map((r) => {
                                    const bar =
                                        r.status === 'en_consulta'
                                            ? CONSULTA_BAR
                                            : ESPERA_BAR;
                                    return (
                                        <tr
                                            key={r.id}
                                            style={{ background: '#fff' }}
                                        >
                                            <td
                                                style={{
                                                    padding:
                                                        '12px 16px 12px 13px',
                                                    borderBottom:
                                                        '1px solid #eef0ec',
                                                    borderLeft: `3px solid ${bar}`,
                                                    fontWeight: 600,
                                                    fontVariantNumeric:
                                                        'tabular-nums',
                                                }}
                                            >
                                                T-
                                                {String(r.turn_number).padStart(
                                                    2,
                                                    '0',
                                                )}
                                            </td>
                                            <td
                                                style={{
                                                    padding: '12px',
                                                    borderBottom:
                                                        '1px solid #eef0ec',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 10,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            width: 34,
                                                            height: 34,
                                                            flexShrink: 0,
                                                            borderRadius: '50%',
                                                            background:
                                                                '#EEF6E2',
                                                            color: '#2E8B3E',
                                                            display:
                                                                'inline-flex',
                                                            alignItems:
                                                                'center',
                                                            justifyContent:
                                                                'center',
                                                            fontSize: 12,
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {r.patient_initials}
                                                    </span>
                                                    <div>
                                                        <div
                                                            style={{
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {r.patient_name}
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: 12,
                                                                color: '#71717a',
                                                            }}
                                                        >
                                                            {r.patient_document}{' '}
                                                            · {r.patient_age}{' '}
                                                            años ·{' '}
                                                            {r.patient_sex}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td
                                                style={{
                                                    padding: '12px',
                                                    borderBottom:
                                                        '1px solid #eef0ec',
                                                    color: '#52525b',
                                                }}
                                            >
                                                {r.doctor_name}
                                            </td>
                                            <td
                                                style={{
                                                    padding: '12px',
                                                    borderBottom:
                                                        '1px solid #eef0ec',
                                                    color: '#71717a',
                                                    fontSize: 13,
                                                }}
                                            >
                                                {r.doctor_specialty}
                                            </td>
                                            <td
                                                style={{
                                                    padding: '12px',
                                                    borderBottom:
                                                        '1px solid #eef0ec',
                                                    fontVariantNumeric:
                                                        'tabular-nums',
                                                    color: '#52525b',
                                                }}
                                            >
                                                {r.arrived_at}
                                            </td>
                                            <td
                                                style={{
                                                    padding: '12px',
                                                    borderBottom:
                                                        '1px solid #eef0ec',
                                                    textAlign: 'right',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent:
                                                            'flex-end',
                                                        gap: 4,
                                                    }}
                                                >
                                                    {r.status === 'espera' && (
                                                        <>
                                                            <button
                                                                onClick={() =>
                                                                    reorderTurn(
                                                                        r.id,
                                                                        'up',
                                                                    )
                                                                }
                                                                title="Subir en cola"
                                                                style={{
                                                                    height: 28,
                                                                    width: 28,
                                                                    borderRadius: 7,
                                                                    border: '1px solid #dfe7df',
                                                                    background:
                                                                        '#F6F9F5',
                                                                    cursor: 'pointer',
                                                                    fontSize: 13,
                                                                    fontFamily:
                                                                        'inherit',
                                                                }}
                                                            >
                                                                ↑
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    reorderTurn(
                                                                        r.id,
                                                                        'down',
                                                                    )
                                                                }
                                                                title="Bajar en cola"
                                                                style={{
                                                                    height: 28,
                                                                    width: 28,
                                                                    borderRadius: 7,
                                                                    border: '1px solid #dfe7df',
                                                                    background:
                                                                        '#F6F9F5',
                                                                    cursor: 'pointer',
                                                                    fontSize: 13,
                                                                    fontFamily:
                                                                        'inherit',
                                                                }}
                                                            >
                                                                ↓
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    patchTurnStatus(
                                                                        r.id,
                                                                        'en_consulta',
                                                                    )
                                                                }
                                                                style={{
                                                                    height: 28,
                                                                    padding:
                                                                        '0 10px',
                                                                    borderRadius: 7,
                                                                    border: 'none',
                                                                    background:
                                                                        '#2563EB',
                                                                    color: '#fff',
                                                                    fontWeight: 500,
                                                                    fontSize: 12,
                                                                    cursor: 'pointer',
                                                                    fontFamily:
                                                                        'inherit',
                                                                }}
                                                            >
                                                                Llamar
                                                            </button>
                                                        </>
                                                    )}
                                                    {r.status ===
                                                        'en_consulta' && (
                                                        <button
                                                            onClick={() =>
                                                                patchTurnStatus(
                                                                    r.id,
                                                                    'atendido',
                                                                )
                                                            }
                                                            style={{
                                                                height: 28,
                                                                padding:
                                                                    '0 10px',
                                                                borderRadius: 7,
                                                                border: 'none',
                                                                background:
                                                                    '#2E8B3E',
                                                                color: '#fff',
                                                                fontWeight: 500,
                                                                fontSize: 12,
                                                                cursor: 'pointer',
                                                                fontFamily:
                                                                    'inherit',
                                                            }}
                                                        >
                                                            ✓ Atendido
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() =>
                                                            patchTurnStatus(
                                                                r.id,
                                                                'no_asistio',
                                                            )
                                                        }
                                                        title="No asistió"
                                                        style={{
                                                            height: 28,
                                                            width: 28,
                                                            borderRadius: 7,
                                                            border: '1px solid #dfe7df',
                                                            background:
                                                                '#F6F9F5',
                                                            color: '#71717a',
                                                            cursor: 'pointer',
                                                            fontSize: 12,
                                                            fontFamily:
                                                                'inherit',
                                                        }}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Citas de hoy ── */}
            <div
                style={{
                    background: '#fff',
                    border: '1px solid #e3e9e3',
                    borderRadius: 14,
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        gap: 12,
                        flexWrap: 'wrap',
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontFamily: 'Bitter,Georgia,serif',
                                fontWeight: 600,
                                fontSize: 16,
                                color: '#1f2d22',
                            }}
                        >
                            Citas de hoy
                        </div>
                        <div style={{ fontSize: 13, color: '#71717a' }}>
                            {appointments.length}{' '}
                            {appointments.length === 1 ? 'cita' : 'citas'} ·{' '}
                            {pendingCitas.length} sin turno asignado
                        </div>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <div
                            style={{
                                display: 'inline-flex',
                                background: '#F3F7F2',
                                border: '1px solid #e3e9e3',
                                borderRadius: 11,
                                padding: 3,
                                gap: 2,
                            }}
                        >
                            {[
                                {
                                    key: 'pendientes',
                                    label: 'Sin turno',
                                    n: pendingCitas.length,
                                },
                                {
                                    key: 'todas',
                                    label: 'Todas',
                                    n: appointments.length,
                                },
                            ].map((t) => (
                                <button
                                    key={t.key}
                                    onClick={() => setCitaTab(t.key)}
                                    style={{
                                        whiteSpace: 'nowrap',
                                        height: 30,
                                        padding: '0 12px',
                                        border: 'none',
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        fontWeight: 500,
                                        fontSize: 13,
                                        background:
                                            citaTab === t.key
                                                ? '#fff'
                                                : 'transparent',
                                        color:
                                            citaTab === t.key
                                                ? '#1f2d22'
                                                : '#52605a',
                                        boxShadow:
                                            citaTab === t.key
                                                ? '0 1px 3px rgba(0,0,0,.1)'
                                                : 'none',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    {t.label}{' '}
                                    <span
                                        style={{
                                            color: '#a1a1aa',
                                            fontVariantNumeric: 'tabular-nums',
                                        }}
                                    >
                                        {t.n}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => router.visit('/citas')}
                            style={{
                                whiteSpace: 'nowrap',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                height: 36,
                                padding: '0 14px',
                                borderRadius: 10,
                                border: '1px solid #dfe7df',
                                background: '#F6F9F5',
                                fontWeight: 500,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 14,
                            }}
                        >
                            📅 Ver agenda
                        </button>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: 13.5,
                            minWidth: 860,
                        }}
                    >
                        <thead>
                            <tr>
                                {[
                                    'Hora',
                                    'Paciente',
                                    'Teléfono',
                                    'Médico',
                                    'Tipo',
                                    'Cita',
                                    'Acciones',
                                ].map((h) => (
                                    <th
                                        key={h}
                                        style={{
                                            ...thStyle,
                                            textAlign:
                                                h === 'Acciones'
                                                    ? 'right'
                                                    : 'left',
                                        }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {visibleCitas.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        style={{
                                            padding: '32px 20px',
                                            textAlign: 'center',
                                            color: '#8a948e',
                                            fontSize: 13,
                                        }}
                                    >
                                        No hay citas{' '}
                                        {citaTab === 'pendientes'
                                            ? 'sin turno asignado'
                                            : ''}{' '}
                                        para hoy.
                                    </td>
                                </tr>
                            ) : (
                                visibleCitas.map((c) => {
                                    const stColor = CITA_STATUS_COLORS[
                                        c.status
                                    ] ?? { bg: '#F4F4F5', fg: '#52525B' };
                                    const rowBg = c.has_turn
                                        ? '#F8FBF6'
                                        : '#fff';
                                    const pal = docPalette(c.doctor_id);
                                    return (
                                        <tr
                                            key={c.id}
                                            style={{ background: rowBg }}
                                        >
                                            <td
                                                style={{
                                                    padding: '10px 12px',
                                                    borderBottom:
                                                        '1px solid #eef0ec',
                                                    fontWeight: 600,
                                                    fontVariantNumeric:
                                                        'tabular-nums',
                                                    color: c.has_turn
                                                        ? '#71717a'
                                                        : '#1f2d22',
                                                }}
                                            >
                                                {c.appointment_time ?? '—'}
                                            </td>
                                            <td
                                                style={{
                                                    padding: '10px 12px',
                                                    borderBottom:
                                                        '1px solid #eef0ec',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontWeight: 500,
                                                        color: c.has_turn
                                                            ? '#71717a'
                                                            : '#1f2d22',
                                                    }}
                                                >
                                                    {c.patient_name}
                                                </div>
                                                {c.notes && (
                                                    <div
                                                        style={{
                                                            fontSize: 12,
                                                            color: '#71717a',
                                                        }}
                                                    >
                                                        {c.notes.length > 40
                                                            ? c.notes.slice(
                                                                  0,
                                                                  40,
                                                              ) + '…'
                                                            : c.notes}
                                                    </div>
                                                )}
                                            </td>
                                            <td
                                                style={{
                                                    padding: '10px 12px',
                                                    borderBottom:
                                                        '1px solid #eef0ec',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {c.patient_phone ? (
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                            gap: 6,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                fontVariantNumeric:
                                                                    'tabular-nums',
                                                                color: c.has_turn
                                                                    ? '#71717a'
                                                                    : '#1f2d22',
                                                            }}
                                                        >
                                                            {c.patient_phone}
                                                        </span>
                                                        <a
                                                            href={`tel:${c.patient_phone}`}
                                                            style={{
                                                                width: 28,
                                                                height: 28,
                                                                borderRadius: 8,
                                                                border: '1px solid #e4e4e7',
                                                                display:
                                                                    'inline-flex',
                                                                alignItems:
                                                                    'center',
                                                                justifyContent:
                                                                    'center',
                                                                fontSize: 14,
                                                            }}
                                                        >
                                                            📞
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <span
                                                        style={{
                                                            color: '#a1a1aa',
                                                        }}
                                                    >
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td
                                                style={{
                                                    padding: '10px 12px',
                                                    borderBottom:
                                                        '1px solid #eef0ec',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            width: 22,
                                                            height: 22,
                                                            flexShrink: 0,
                                                            borderRadius: '50%',
                                                            background: pal.bg,
                                                            color: pal.fg,
                                                            display:
                                                                'inline-flex',
                                                            alignItems:
                                                                'center',
                                                            justifyContent:
                                                                'center',
                                                            fontSize: 10,
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {(() => {
                                                            const d =
                                                                doctors.find(
                                                                    (x) =>
                                                                        x.id ===
                                                                        c.doctor_id,
                                                                );
                                                            return (
                                                                d?.initials ??
                                                                '?'
                                                            );
                                                        })()}
                                                    </span>
                                                    <span
                                                        style={{
                                                            color: '#52525b',
                                                        }}
                                                    >
                                                        {c.doctor_name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td
                                                style={{
                                                    padding: '10px 12px',
                                                    borderBottom:
                                                        '1px solid #eef0ec',
                                                    whiteSpace: 'nowrap',
                                                    color: '#52525b',
                                                }}
                                            >
                                                {TYPE_LABELS[c.type] ?? c.type}
                                            </td>
                                            <td
                                                style={{
                                                    padding: '10px 12px',
                                                    borderBottom:
                                                        '1px solid #eef0ec',
                                                }}
                                            >
                                                {c.has_turn ? (
                                                    <span
                                                        style={{
                                                            display:
                                                                'inline-flex',
                                                            alignItems:
                                                                'center',
                                                            whiteSpace:
                                                                'nowrap',
                                                            padding: '2px 9px',
                                                            borderRadius: 999,
                                                            fontSize: 12,
                                                            fontWeight: 600,
                                                            background:
                                                                '#DCFCE7',
                                                            color: '#166534',
                                                        }}
                                                    >
                                                        ✓ T-
                                                        {String(
                                                            c.turn_number,
                                                        ).padStart(2, '0')}{' '}
                                                        · En cola
                                                    </span>
                                                ) : (
                                                    <span
                                                        style={{
                                                            display:
                                                                'inline-flex',
                                                            alignItems:
                                                                'center',
                                                            whiteSpace:
                                                                'nowrap',
                                                            padding: '2px 9px',
                                                            borderRadius: 999,
                                                            fontSize: 12,
                                                            fontWeight: 600,
                                                            background:
                                                                stColor.bg,
                                                            color: stColor.fg,
                                                        }}
                                                    >
                                                        {CITA_STATUS_LABELS[
                                                            c.status
                                                        ] ?? c.status}
                                                    </span>
                                                )}
                                            </td>
                                            <td
                                                style={{
                                                    padding: '10px 12px',
                                                    borderBottom:
                                                        '1px solid #eef0ec',
                                                    textAlign: 'right',
                                                }}
                                            >
                                                {!c.has_turn && (
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent:
                                                                'flex-end',
                                                            gap: 6,
                                                        }}
                                                    >
                                                        <button
                                                            onClick={() =>
                                                                assignTurnFromCita(
                                                                    c,
                                                                )
                                                            }
                                                            style={{
                                                                whiteSpace:
                                                                    'nowrap',
                                                                display:
                                                                    'inline-flex',
                                                                alignItems:
                                                                    'center',
                                                                gap: 6,
                                                                height: 30,
                                                                padding:
                                                                    '0 10px',
                                                                borderRadius: 8,
                                                                border: 'none',
                                                                background:
                                                                    '#2E8B3E',
                                                                color: '#fff',
                                                                fontWeight: 500,
                                                                fontSize: 12.5,
                                                                cursor: 'pointer',
                                                                fontFamily:
                                                                    'inherit',
                                                            }}
                                                        >
                                                            + Asignar turno
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                markNoShow(c)
                                                            }
                                                            style={{
                                                                whiteSpace:
                                                                    'nowrap',
                                                                display:
                                                                    'inline-flex',
                                                                alignItems:
                                                                    'center',
                                                                gap: 6,
                                                                height: 30,
                                                                padding:
                                                                    '0 10px',
                                                                borderRadius: 8,
                                                                border: '1px solid #dfe7df',
                                                                background:
                                                                    '#F6F9F5',
                                                                color: '#52525b',
                                                                fontWeight: 500,
                                                                fontSize: 12.5,
                                                                cursor: 'pointer',
                                                                fontFamily:
                                                                    'inherit',
                                                            }}
                                                        >
                                                            ✕ No asistió
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Modal walk-in ── */}
            {showWalkIn && (
                <AgregarTurnoModal
                    onClose={() => setShowWalkIn(false)}
                    doctors={doctors}
                />
            )}
        </div>
    );
}
