import { AppointmentRow, DoctorOption } from '../types';

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

type TodayRowsProps = {
    rows: AppointmentRow[];
    doctors: DoctorOption[];
    onNewCita: () => void;
    onCancel: (id: number) => void;
};

export function TodayRows({ rows, doctors, onNewCita, onCancel }: TodayRowsProps) {
    if (rows.length === 0) {
        return (
            <tr>
                <td colSpan={6}>
                    <div
                        style={{
                            padding: '6px 12px 6px 20px',
                            borderBottom: '1px solid #f1f3ef',
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
                            onClick={onNewCita}
                        >
                            + Registrar primera cita del día
                        </div>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <>
            {rows.map((cita) => {
                const stColor = ESTADO_COLORS[cita.status] ?? { bg: '#F4F4F5', fg: '#52525B' };
                const isDone =
                    cita.status === 'atendida' ||
                    cita.status === 'no_asistio' ||
                    cita.status === 'cancelada';
                const isInList = cita.status === 'en_lista';
                const canCancel =
                    cita.status === 'pendiente' ||
                    cita.status === 'confirmada';
                const doc = doctors.find((d) => d.id === cita.doctor_id);
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
                                padding: '10px 12px 10px 20px',
                                borderBottom: '1px solid #eef0ec',
                            }}
                        >
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    whiteSpace: 'nowrap',
                                    padding: '2px 9px',
                                    borderRadius: 999,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    background: stColor.bg,
                                    color: stColor.fg,
                                }}
                            >
                                {isInList && cita.turn_number
                                    ? `T-${String(cita.turn_number).padStart(2, '0')} · En lista`
                                    : (ESTADO_LABELS[cita.status] ?? cita.status)}
                            </span>
                        </td>
                        <td
                            style={{
                                padding: '10px 12px',
                                borderBottom: '1px solid #eef0ec',
                            }}
                        >
                            <div
                                style={{
                                    fontWeight: 500,
                                    color: isDone ? '#8a948e' : '#1f2d22',
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
                                    {cita.notes.length > 40
                                        ? cita.notes.slice(0, 40) + '…'
                                        : cita.notes}
                                </div>
                            )}
                        </td>
                        <td
                            style={{
                                padding: '10px 12px',
                                borderBottom: '1px solid #eef0ec',
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
                                        width: 26,
                                        height: 26,
                                        flexShrink: 0,
                                        borderRadius: '50%',
                                        background: pal.bg,
                                        color: pal.fg,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 11,
                                        fontWeight: 600,
                                    }}
                                >
                                    {doc?.initials ?? '?'}
                                </span>
                                <span
                                    style={{
                                        fontSize: 13,
                                        color: isDone ? '#8a948e' : '#52525b',
                                    }}
                                >
                                    {cita.doctor_name}
                                </span>
                            </div>
                        </td>
                        <td
                            style={{
                                padding: '10px 12px',
                                borderBottom: '1px solid #eef0ec',
                                color: isDone ? '#8a948e' : '#52525b',
                                fontSize: 13,
                            }}
                        >
                            {TYPE_LABELS[cita.type] ?? cita.type}
                        </td>
                        <td
                            style={{
                                padding: '10px 12px',
                                borderBottom: '1px solid #eef0ec',
                                color: '#71717a',
                                fontSize: 13,
                                fontVariantNumeric: 'tabular-nums',
                            }}
                        >
                            {cita.appointment_time ?? '—'}
                        </td>
                        <td
                            style={{
                                padding: '10px 12px',
                                borderBottom: '1px solid #eef0ec',
                                textAlign: 'right',
                            }}
                        >
                            {canCancel && (
                                <button
                                    onClick={() => onCancel(cita.id)}
                                    style={{
                                        height: 28,
                                        padding: '0 10px',
                                        borderRadius: 8,
                                        border: '1px solid #dfe7df',
                                        background: '#F6F9F5',
                                        color: '#52525b',
                                        fontWeight: 500,
                                        fontSize: 12,
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
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
    );
}
