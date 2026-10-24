import { useState } from 'react';
import { router } from '@inertiajs/react';
import PatientSearch from '@/components/cemerog/PatientSearch';
import type { PatientResult } from '@/components/cemerog/PatientSearch';

// ─── Types ────────────────────────────────────────────────────────────────────

type AppointmentRow = {
    id: number;
    patient_id: number;
    patient_name: string;
    patient_initials: string;
    doctor_id: number;
    doctor_name: string;
    doctor_specialty: string;
    appointment_date: string;
    appointment_time: string | null;
    turn_number: number | null;
    turn_order: number | null;
    type: string;
    status:
        | 'pendiente'
        | 'confirmada'
        | 'en_lista'
        | 'atendida'
        | 'no_asistio'
        | 'cancelada';
    notes: string | null;
};

type DoctorOption = {
    id: number;
    name: string;
    specialty: string;
    initials: string;
};
type Props = {
    appointments: AppointmentRow[];
    doctors: DoctorOption[];
    date: string;
    is_today: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SLOTS = [
    '08:00',
    '08:30',
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '14:00',
    '14:30',
    '15:00',
];

const ESTADO_COLORS: Record<string, { bg: string; fg: string }> = {
    atendida: { bg: '#DCFCE7', fg: '#166534' },
    en_lista: { bg: '#DBEAFE', fg: '#1E40AF' },
    confirmada: { bg: '#F3F7F2', fg: '#2E8B3E' },
    pendiente: { bg: '#FEF3C7', fg: '#92400E' },
    no_asistio: { bg: '#F4F4F5', fg: '#52525B' },
    cancelada: { bg: '#F4F4F5', fg: '#52525B' },
};

const ESTADO_LABELS: Record<string, string> = {
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    en_lista: 'En lista',
    atendida: 'Atendida',
    no_asistio: 'No asistió',
    cancelada: 'Cancelada',
};

const TYPE_LABELS: Record<string, string> = {
    consulta: 'Consulta',
    seguimiento: 'Seguimiento',
    primera_vez: 'Primera vez',
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayStr() {
    return new Date().toISOString().slice(0, 10);
}
function tomorrowStr() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
}
function addDays(dateStr: string, n: number) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
}
function formatDateLong(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-DO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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

// ─── Nueva cita modal ────────────────────────────────────────────────────────

function NuevaCitaModal({
    onClose,
    doctors,
    defaultDate,
}: {
    onClose: () => void;
    doctors: DoctorOption[];
    defaultDate: string;
}) {
    const [patientQuery, setPatientQuery] = useState('');
    const [selectedPatient, setSelectedPatient] =
        useState<PatientResult | null>(null);
    const [doctorId, setDoctorId] = useState('');
    const [fecha, setFecha] = useState(defaultDate);
    const [hora, setHora] = useState('');
    const [tipo, setTipo] = useState('consulta');
    const [notas, setNotas] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const errs: Record<string, string> = {};
        if (!selectedPatient) errs.patient_id = 'Selecciona un paciente.';
        if (!doctorId) errs.doctor_id = 'Selecciona un médico.';
        if (!fecha) errs.appointment_date = 'La fecha es obligatoria.';
        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }

        setProcessing(true);
        router.post(
            '/citas',
            {
                patient_id: selectedPatient!.id,
                doctor_id: Number(doctorId),
                appointment_date: fecha,
                appointment_time: hora || null,
                type: tipo,
                notes: notas || null,
            },
            {
                onSuccess: () => onClose(),
                onError: (e) => {
                    setErrors(e);
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
                    width: 480,
                    maxWidth: '95vw',
                    maxHeight: '90vh',
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
                        flexShrink: 0,
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
                        Nueva cita
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
                <form
                    onSubmit={handleSubmit}
                    style={{
                        overflowY: 'auto',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <div
                        style={{
                            padding: '16px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 14,
                        }}
                    >
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
                                endpoint="/citas/pacientes/buscar"
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
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 12,
                            }}
                        >
                            <label
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                    fontWeight: 500,
                                    fontSize: 14,
                                }}
                            >
                                <span>Fecha *</span>
                                <input
                                    type="date"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                    style={{
                                        ...inputStyle,
                                        borderColor: errors.appointment_date
                                            ? '#b91c1c'
                                            : '#e4e4e7',
                                    }}
                                />
                                {errors.appointment_date && (
                                    <span
                                        style={{
                                            color: '#b91c1c',
                                            fontSize: 12,
                                        }}
                                    >
                                        {errors.appointment_date}
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
                                    Hora{' '}
                                    <span
                                        style={{
                                            fontWeight: 400,
                                            color: '#71717a',
                                        }}
                                    >
                                        (opcional)
                                    </span>
                                </span>
                                <input
                                    type="time"
                                    value={hora}
                                    onChange={(e) => setHora(e.target.value)}
                                    style={inputStyle}
                                />
                            </label>
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
                            <span>Tipo</span>
                            <select
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value)}
                                style={{ ...inputStyle, cursor: 'pointer' }}
                            >
                                <option value="consulta">Consulta</option>
                                <option value="seguimiento">Seguimiento</option>
                                <option value="primera_vez">Primera vez</option>
                            </select>
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
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                rows={2}
                                placeholder="Motivo de consulta, indicaciones…"
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
                            flexShrink: 0,
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
                            {processing ? 'Guardando…' : '✓ Registrar cita'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CitasIndex({
    appointments,
    doctors,
    date,
    is_today,
}: Props) {
    const [showModal, setShowModal] = useState(false);
    const [selDoc, setSelDoc] = useState<number | null>(null);

    const isTomorrow = date === tomorrowStr();
    const filtered = selDoc
        ? appointments.filter((a) => a.doctor_id === selDoc)
        : appointments;

    function navigate(targetDate: string) {
        router.get('/citas', { date: targetDate }, { preserveState: false });
    }

    function cancelCita(id: number) {
        if (!confirm('¿Cancelar esta cita?')) return;
        router.delete(`/citas/${id}`, { preserveScroll: true });
    }

    // Slot-based view (future dates)
    const bySlot = Object.fromEntries(
        filtered
            .filter((a) => a.appointment_time)
            .map((a) => [a.appointment_time!, a]),
    );
    const noSlot = filtered.filter((a) => !a.appointment_time);

    // Today: exclude cancelled, sort by turn_order then time
    const todayRows = filtered.filter((a) => a.status !== 'cancelada');

    const pendingCount = filtered.filter(
        (a) => a.status === 'pendiente' || a.status === 'confirmada',
    ).length;

    return (
        <div className="flex flex-col gap-5">
            {/* ── Toolbar ── */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                }}
            >
                {/* Doctor filter chips */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {doctors.map((d) => {
                        const pal = docPalette(d.id);
                        const active = selDoc === d.id;
                        return (
                            <button
                                key={d.id}
                                onClick={() => setSelDoc(active ? null : d.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '6px 14px 6px 6px',
                                    borderRadius: 12,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    background: active ? '#EEF6E2' : '#fff',
                                    border: `1px solid ${active ? '#B9DC8E' : '#e3e9e3'}`,
                                    fontFamily: 'inherit',
                                    fontSize: 14,
                                }}
                            >
                                <span
                                    style={{
                                        width: 32,
                                        height: 32,
                                        flexShrink: 0,
                                        borderRadius: '50%',
                                        background: pal.bg,
                                        color: pal.fg,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 12,
                                        fontWeight: 600,
                                    }}
                                >
                                    {d.initials}
                                </span>
                                <span style={{ lineHeight: 1.2 }}>
                                    <span
                                        style={{
                                            display: 'block',
                                            fontWeight: 600,
                                            color: '#1f2d22',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {d.name}
                                    </span>
                                    <span
                                        style={{
                                            display: 'block',
                                            fontSize: 12,
                                            color: '#71717a',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {d.specialty}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Right controls */}
                <div
                    style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    {/* Hoy / Mañana segmented */}
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
                        {(
                            [
                                {
                                    key: todayStr(),
                                    label: 'Hoy',
                                    active: is_today,
                                },
                                {
                                    key: tomorrowStr(),
                                    label: 'Mañana',
                                    active: isTomorrow,
                                },
                            ] as const
                        ).map((t) => (
                            <button
                                key={t.key}
                                onClick={() => navigate(t.key)}
                                style={{
                                    whiteSpace: 'nowrap',
                                    height: 30,
                                    padding: '0 12px',
                                    border: 'none',
                                    borderRadius: 10,
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    background: t.active
                                        ? '#fff'
                                        : 'transparent',
                                    color: t.active ? '#1f2d22' : '#52605a',
                                    boxShadow: t.active
                                        ? '0 1px 3px rgba(0,0,0,.1)'
                                        : 'none',
                                    fontFamily: 'inherit',
                                    fontSize: 14,
                                }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                    {/* ‹ Hoy › navigation */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        <button
                            onClick={() => navigate(addDays(date, -1))}
                            style={{
                                width: 36,
                                height: 36,
                                border: '1px solid #dfe7df',
                                background: '#F6F9F5',
                                borderRadius: 10,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 16,
                            }}
                        >
                            ‹
                        </button>
                        <button
                            onClick={() => navigate(todayStr())}
                            style={{
                                height: 36,
                                padding: '0 12px',
                                border: '1px solid #dfe7df',
                                background: '#F6F9F5',
                                borderRadius: 10,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 14,
                                fontWeight: 500,
                            }}
                        >
                            Hoy
                        </button>
                        <button
                            onClick={() => navigate(addDays(date, 1))}
                            style={{
                                width: 36,
                                height: 36,
                                border: '1px solid #dfe7df',
                                background: '#F6F9F5',
                                borderRadius: 10,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 16,
                            }}
                        >
                            ›
                        </button>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
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
                        + Nueva cita
                    </button>
                </div>
            </div>

            {/* ── Table card ── */}
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
                        padding: '14px 20px',
                        borderBottom: '1px solid #eef0ec',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        flexWrap: 'wrap',
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontFamily: 'Bitter,Georgia,serif',
                                fontWeight: 600,
                                fontSize: 17,
                                color: '#1f2d22',
                                textTransform: 'capitalize',
                            }}
                        >
                            {formatDateLong(date)}
                        </div>
                        <div style={{ fontSize: 13, color: '#71717a' }}>
                            {filtered.length}{' '}
                            {filtered.length === 1 ? 'cita' : 'citas'} ·{' '}
                            {pendingCount} pendientes
                            {is_today &&
                                ' · Los turnos se gestionan desde el Tablero'}
                        </div>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            minWidth: 700,
                        }}
                    >
                        <thead>
                            <tr>
                                <th style={{ ...thStyle, paddingLeft: 20 }}>
                                    {is_today ? 'Estado' : 'Hora'}
                                </th>
                                <th style={thStyle}>Paciente</th>
                                <th style={thStyle}>Médico</th>
                                <th style={thStyle}>Tipo</th>
                                <th style={thStyle}>Cita</th>
                                <th
                                    style={{ ...thStyle, textAlign: 'right' }}
                                ></th>
                            </tr>
                        </thead>
                        <tbody>
                            {is_today ? (
                                // ── Today: list view (status only, no turn actions) ──
                                todayRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6}>
                                            <div
                                                style={{
                                                    padding:
                                                        '6px 12px 6px 20px',
                                                    borderBottom:
                                                        '1px solid #f1f3ef',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        padding: '0 4px',
                                                        height: 44,
                                                        borderRadius: 8,
                                                        border: '1px dashed #d6e2d0',
                                                        color: '#8a948e',
                                                        cursor: 'pointer',
                                                        fontSize: 13,
                                                    }}
                                                    onClick={() =>
                                                        setShowModal(true)
                                                    }
                                                >
                                                    + Registrar primera cita del
                                                    día
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    todayRows.map((cita) => {
                                        const stColor = ESTADO_COLORS[
                                            cita.status
                                        ] ?? { bg: '#F4F4F5', fg: '#52525B' };
                                        const isDone =
                                            cita.status === 'atendida' ||
                                            cita.status === 'no_asistio' ||
                                            cita.status === 'cancelada';
                                        const isInList =
                                            cita.status === 'en_lista';
                                        const canCancel =
                                            cita.status === 'pendiente' ||
                                            cita.status === 'confirmada';
                                        const doc = doctors.find(
                                            (d) => d.id === cita.doctor_id,
                                        );
                                        const pal = docPalette(cita.doctor_id);
                                        return (
                                            <tr
                                                key={cita.id}
                                                style={{
                                                    background: isDone
                                                        ? '#FAFAFA'
                                                        : isInList
                                                          ? '#F8FBF6'
                                                          : '#fff',
                                                }}
                                            >
                                                {/* Status / Turn column */}
                                                <td
                                                    style={{
                                                        padding:
                                                            '10px 12px 10px 20px',
                                                        borderBottom:
                                                            '1px solid #eef0ec',
                                                    }}
                                                >
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
                                                        {isInList &&
                                                        cita.turn_number
                                                            ? `T-${String(cita.turn_number).padStart(2, '0')} · En lista`
                                                            : (ESTADO_LABELS[
                                                                  cita.status
                                                              ] ?? cita.status)}
                                                    </span>
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
                                                            color: isDone
                                                                ? '#8a948e'
                                                                : '#1f2d22',
                                                        }}
                                                    >
                                                        {cita.patient_name}
                                                    </div>
                                                    {cita.notes && (
                                                        <div
                                                            style={{
                                                                fontSize: 12,
                                                                color: '#71717a',
                                                            }}
                                                        >
                                                            {cita.notes.length >
                                                            40
                                                                ? cita.notes.slice(
                                                                      0,
                                                                      40,
                                                                  ) + '…'
                                                                : cita.notes}
                                                        </div>
                                                    )}
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
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                            gap: 8,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                width: 26,
                                                                height: 26,
                                                                flexShrink: 0,
                                                                borderRadius:
                                                                    '50%',
                                                                background:
                                                                    pal.bg,
                                                                color: pal.fg,
                                                                display:
                                                                    'inline-flex',
                                                                alignItems:
                                                                    'center',
                                                                justifyContent:
                                                                    'center',
                                                                fontSize: 11,
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {doc?.initials ??
                                                                '?'}
                                                        </span>
                                                        <span
                                                            style={{
                                                                fontSize: 13,
                                                                color: isDone
                                                                    ? '#8a948e'
                                                                    : '#52525b',
                                                            }}
                                                        >
                                                            {cita.doctor_name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td
                                                    style={{
                                                        padding: '10px 12px',
                                                        borderBottom:
                                                            '1px solid #eef0ec',
                                                        color: isDone
                                                            ? '#8a948e'
                                                            : '#52525b',
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    {TYPE_LABELS[cita.type] ??
                                                        cita.type}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: '10px 12px',
                                                        borderBottom:
                                                            '1px solid #eef0ec',
                                                        color: '#71717a',
                                                        fontSize: 13,
                                                        fontVariantNumeric:
                                                            'tabular-nums',
                                                    }}
                                                >
                                                    {cita.appointment_time ??
                                                        '—'}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: '10px 12px',
                                                        borderBottom:
                                                            '1px solid #eef0ec',
                                                        textAlign: 'right',
                                                    }}
                                                >
                                                    {canCancel && (
                                                        <button
                                                            onClick={() =>
                                                                cancelCita(
                                                                    cita.id,
                                                                )
                                                            }
                                                            style={{
                                                                height: 28,
                                                                padding:
                                                                    '0 10px',
                                                                borderRadius: 8,
                                                                border: '1px solid #dfe7df',
                                                                background:
                                                                    '#F6F9F5',
                                                                color: '#52525b',
                                                                fontWeight: 500,
                                                                fontSize: 12,
                                                                cursor: 'pointer',
                                                                fontFamily:
                                                                    'inherit',
                                                            }}
                                                        >
                                                            Cancelar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )
                            ) : (
                                // ── Future date: slot-based rows ──
                                <>
                                    {SLOTS.map((slot) => {
                                        const cita = bySlot[slot];
                                        if (!cita) {
                                            return (
                                                <tr key={slot}>
                                                    <td
                                                        style={{
                                                            padding:
                                                                '6px 12px 6px 20px',
                                                            borderBottom:
                                                                '1px solid #f1f3ef',
                                                            fontWeight: 600,
                                                            fontVariantNumeric:
                                                                'tabular-nums',
                                                            color: '#8a948e',
                                                            width: 60,
                                                        }}
                                                    >
                                                        {slot}
                                                    </td>
                                                    <td
                                                        colSpan={5}
                                                        style={{
                                                            padding: '0 12px',
                                                            borderBottom:
                                                                '1px solid #f1f3ef',
                                                            height: 44,
                                                        }}
                                                    >
                                                        <div
                                                            onClick={() =>
                                                                setShowModal(
                                                                    true,
                                                                )
                                                            }
                                                            style={{
                                                                display: 'flex',
                                                                alignItems:
                                                                    'center',
                                                                gap: 8,
                                                                padding:
                                                                    '0 4px',
                                                                height: '100%',
                                                                borderRadius: 8,
                                                                border: '1px dashed #d6e2d0',
                                                                color: '#8a948e',
                                                                cursor: 'pointer',
                                                                fontSize: 13,
                                                            }}
                                                        >
                                                            + Disponible
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                        const doc = doctors.find(
                                            (d) => d.id === cita.doctor_id,
                                        );
                                        const pal = docPalette(cita.doctor_id);
                                        const stColor = ESTADO_COLORS[
                                            cita.status
                                        ] ?? { bg: '#F4F4F5', fg: '#52525B' };
                                        const canCancel =
                                            cita.status === 'pendiente' ||
                                            cita.status === 'confirmada';
                                        return (
                                            <tr key={slot}>
                                                <td
                                                    style={{
                                                        padding:
                                                            '10px 12px 10px 20px',
                                                        borderBottom:
                                                            '1px solid #eef0ec',
                                                        fontWeight: 600,
                                                        fontVariantNumeric:
                                                            'tabular-nums',
                                                        color: '#1f2d22',
                                                    }}
                                                >
                                                    {slot}
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
                                                        }}
                                                    >
                                                        {cita.patient_name}
                                                    </div>
                                                    {cita.notes && (
                                                        <div
                                                            style={{
                                                                fontSize: 12,
                                                                color: '#71717a',
                                                            }}
                                                        >
                                                            {cita.notes.length >
                                                            40
                                                                ? cita.notes.slice(
                                                                      0,
                                                                      40,
                                                                  ) + '…'
                                                                : cita.notes}
                                                        </div>
                                                    )}
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
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                            gap: 8,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                width: 26,
                                                                height: 26,
                                                                flexShrink: 0,
                                                                borderRadius:
                                                                    '50%',
                                                                background:
                                                                    pal.bg,
                                                                color: pal.fg,
                                                                display:
                                                                    'inline-flex',
                                                                alignItems:
                                                                    'center',
                                                                justifyContent:
                                                                    'center',
                                                                fontSize: 11,
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {doc?.initials ??
                                                                '?'}
                                                        </span>
                                                        <span
                                                            style={{
                                                                fontSize: 13,
                                                            }}
                                                        >
                                                            {cita.doctor_name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td
                                                    style={{
                                                        padding: '10px 12px',
                                                        borderBottom:
                                                            '1px solid #eef0ec',
                                                        color: '#52525b',
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    {TYPE_LABELS[cita.type] ??
                                                        cita.type}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: '10px 12px',
                                                        borderBottom:
                                                            '1px solid #eef0ec',
                                                    }}
                                                >
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
                                                        {ESTADO_LABELS[
                                                            cita.status
                                                        ] ?? cita.status}
                                                    </span>
                                                </td>
                                                <td
                                                    style={{
                                                        padding: '10px 12px',
                                                        borderBottom:
                                                            '1px solid #eef0ec',
                                                        textAlign: 'right',
                                                    }}
                                                >
                                                    {canCancel && (
                                                        <button
                                                            onClick={() =>
                                                                cancelCita(
                                                                    cita.id,
                                                                )
                                                            }
                                                            style={{
                                                                height: 28,
                                                                padding:
                                                                    '0 10px',
                                                                borderRadius: 8,
                                                                border: '1px solid #dfe7df',
                                                                background:
                                                                    '#F6F9F5',
                                                                color: '#52525b',
                                                                fontWeight: 500,
                                                                fontSize: 12,
                                                                cursor: 'pointer',
                                                                fontFamily:
                                                                    'inherit',
                                                            }}
                                                        >
                                                            Cancelar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {noSlot.map((cita) => {
                                        const doc = doctors.find(
                                            (d) => d.id === cita.doctor_id,
                                        );
                                        const pal = docPalette(cita.doctor_id);
                                        const stColor = ESTADO_COLORS[
                                            cita.status
                                        ] ?? { bg: '#F4F4F5', fg: '#52525B' };
                                        const canCancel =
                                            cita.status === 'pendiente' ||
                                            cita.status === 'confirmada';
                                        return (
                                            <tr key={cita.id}>
                                                <td
                                                    style={{
                                                        padding:
                                                            '10px 12px 10px 20px',
                                                        borderBottom:
                                                            '1px solid #eef0ec',
                                                        fontWeight: 600,
                                                        color: '#8a948e',
                                                    }}
                                                >
                                                    —
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
                                                        }}
                                                    >
                                                        {cita.patient_name}
                                                    </div>
                                                    {cita.notes && (
                                                        <div
                                                            style={{
                                                                fontSize: 12,
                                                                color: '#71717a',
                                                            }}
                                                        >
                                                            {cita.notes.length >
                                                            40
                                                                ? cita.notes.slice(
                                                                      0,
                                                                      40,
                                                                  ) + '…'
                                                                : cita.notes}
                                                        </div>
                                                    )}
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
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                            gap: 8,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                width: 26,
                                                                height: 26,
                                                                flexShrink: 0,
                                                                borderRadius:
                                                                    '50%',
                                                                background:
                                                                    pal.bg,
                                                                color: pal.fg,
                                                                display:
                                                                    'inline-flex',
                                                                alignItems:
                                                                    'center',
                                                                justifyContent:
                                                                    'center',
                                                                fontSize: 11,
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {doc?.initials ??
                                                                '?'}
                                                        </span>
                                                        <span
                                                            style={{
                                                                fontSize: 13,
                                                            }}
                                                        >
                                                            {cita.doctor_name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td
                                                    style={{
                                                        padding: '10px 12px',
                                                        borderBottom:
                                                            '1px solid #eef0ec',
                                                        color: '#52525b',
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    {TYPE_LABELS[cita.type] ??
                                                        cita.type}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: '10px 12px',
                                                        borderBottom:
                                                            '1px solid #eef0ec',
                                                    }}
                                                >
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
                                                        {ESTADO_LABELS[
                                                            cita.status
                                                        ] ?? cita.status}
                                                    </span>
                                                </td>
                                                <td
                                                    style={{
                                                        padding: '10px 12px',
                                                        borderBottom:
                                                            '1px solid #eef0ec',
                                                        textAlign: 'right',
                                                    }}
                                                >
                                                    {canCancel && (
                                                        <button
                                                            onClick={() =>
                                                                cancelCita(
                                                                    cita.id,
                                                                )
                                                            }
                                                            style={{
                                                                height: 28,
                                                                padding:
                                                                    '0 10px',
                                                                borderRadius: 8,
                                                                border: '1px solid #dfe7df',
                                                                background:
                                                                    '#F6F9F5',
                                                                color: '#52525b',
                                                                fontWeight: 500,
                                                                fontSize: 12,
                                                                cursor: 'pointer',
                                                                fontFamily:
                                                                    'inherit',
                                                            }}
                                                        >
                                                            Cancelar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Modal nueva cita ── */}
            {showModal && (
                <NuevaCitaModal
                    onClose={() => setShowModal(false)}
                    doctors={doctors}
                    defaultDate={date}
                />
            )}
        </div>
    );
}
