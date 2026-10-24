import StatusBadge from '@/components/cemerog/StatusBadge';
import { AppointmentRow, DoctorOption } from '../types';
import { SLOTS } from '../lib/dates';
import { docPalette } from '../lib/palettes';

const TYPE_LABELS: Record<string, string> = {
    consulta: 'Consulta',
    seguimiento: 'Seguimiento',
    primera_vez: 'Primera vez',
};

function citaStatusToState(
    status: AppointmentRow['status'],
): Parameters<typeof StatusBadge>[0]['state'] {
    const map = {
        pendiente: 'cita-pendiente',
        confirmada: 'cita-confirmada',
        en_lista: 'cita-en_lista',
        atendida: 'cita-atendida',
        no_asistio: 'cita-no_asistio',
        cancelada: 'cita-cancelada',
    } as const;
    return map[status] ?? 'cita-cancelada';
}

type FutureRowsProps = {
    bySlot: Record<string, AppointmentRow>;
    noSlot: AppointmentRow[];
    doctors: DoctorOption[];
    onNewCita: () => void;
    onCancel: (id: number) => void;
};

export function FutureRows({
    bySlot,
    noSlot,
    doctors,
    onNewCita,
    onCancel,
}: FutureRowsProps) {
    return (
        <>
            {SLOTS.map((slot) => {
                const cita = bySlot[slot];
                if (!cita) {
                    return (
                        <tr key={slot}>
                            <td
                                style={{
                                    padding: '6px 12px 6px 20px',
                                    fontWeight: 600,
                                    fontVariantNumeric: 'tabular-nums',
                                    width: 60,
                                }}
                                className="border-b border-row-divider text-text-tertiary"
                            >
                                {slot}
                            </td>
                            <td
                                colSpan={5}
                                style={{
                                    padding: '0 12px',
                                    height: 44,
                                }}
                                className="border-b border-row-divider"
                            >
                                <div
                                    onClick={onNewCita}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '0 4px',
                                        height: '100%',
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        fontSize: 13,
                                    }}
                                    className="border border-dashed border-slot-empty-border text-text-tertiary"
                                >
                                    + Disponible
                                </div>
                            </td>
                        </tr>
                    );
                }
                const doc = doctors.find((d) => d.id === cita.doctor_id);
                const pal = docPalette(cita.doctor_id);
                const canCancel =
                    cita.status === 'pendiente' || cita.status === 'confirmada';
                return (
                    <tr key={slot}>
                        <td
                            style={{
                                padding: '10px 12px 10px 20px',
                                fontWeight: 600,
                                fontVariantNumeric: 'tabular-nums',
                            }}
                            className="border-b border-divider text-text-heading"
                        >
                            {slot}
                        </td>
                        <td
                            style={{
                                padding: '10px 12px',
                            }}
                            className="border-b border-divider"
                        >
                            <div style={{ fontWeight: 500 }}>
                                {cita.patient_name}
                            </div>
                            {cita.notes && (
                                <div
                                    style={{
                                        fontSize: 12,
                                    }}
                                    className="text-muted"
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
                            }}
                            className="border-b border-divider"
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                {/* Doctor palette: computed at runtime from doctor ID */}
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
                                    }}
                                >
                                    {cita.doctor_name}
                                </span>
                            </div>
                        </td>
                        <td
                            style={{
                                padding: '10px 12px',
                                fontSize: 13,
                            }}
                            className="border-b border-divider text-text-dim"
                        >
                            {TYPE_LABELS[cita.type] ?? cita.type}
                        </td>
                        <td
                            style={{
                                padding: '10px 12px',
                            }}
                            className="border-b border-divider"
                        >
                            <StatusBadge
                                state={citaStatusToState(cita.status)}
                            />
                        </td>
                        <td
                            style={{
                                padding: '10px 12px',
                                textAlign: 'right',
                            }}
                            className="border-b border-divider"
                        >
                            {canCancel && (
                                <button
                                    onClick={() => onCancel(cita.id)}
                                    style={{
                                        height: 28,
                                        padding: '0 10px',
                                        borderRadius: 8,
                                        fontWeight: 500,
                                        fontSize: 12,
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                    }}
                                    className="border border-secondary-border bg-secondary-bg text-text-dim"
                                >
                                    Cancelar
                                </button>
                            )}
                        </td>
                    </tr>
                );
            })}
            {noSlot.map((cita) => {
                const doc = doctors.find((d) => d.id === cita.doctor_id);
                const pal = docPalette(cita.doctor_id);
                const canCancel =
                    cita.status === 'pendiente' || cita.status === 'confirmada';
                return (
                    <tr key={cita.id}>
                        <td
                            style={{
                                padding: '10px 12px 10px 20px',
                                fontWeight: 600,
                            }}
                            className="border-b border-divider text-text-tertiary"
                        >
                            —
                        </td>
                        <td
                            style={{
                                padding: '10px 12px',
                            }}
                            className="border-b border-divider"
                        >
                            <div style={{ fontWeight: 500 }}>
                                {cita.patient_name}
                            </div>
                            {cita.notes && (
                                <div
                                    style={{
                                        fontSize: 12,
                                    }}
                                    className="text-muted"
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
                            }}
                            className="border-b border-divider"
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                {/* Doctor palette: computed at runtime from doctor ID */}
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
                                    }}
                                >
                                    {cita.doctor_name}
                                </span>
                            </div>
                        </td>
                        <td
                            style={{
                                padding: '10px 12px',
                                fontSize: 13,
                            }}
                            className="border-b border-divider text-text-dim"
                        >
                            {TYPE_LABELS[cita.type] ?? cita.type}
                        </td>
                        <td
                            style={{
                                padding: '10px 12px',
                            }}
                            className="border-b border-divider"
                        >
                            <StatusBadge
                                state={citaStatusToState(cita.status)}
                            />
                        </td>
                        <td
                            style={{
                                padding: '10px 12px',
                                textAlign: 'right',
                            }}
                            className="border-b border-divider"
                        >
                            {canCancel && (
                                <button
                                    onClick={() => onCancel(cita.id)}
                                    style={{
                                        height: 28,
                                        padding: '0 10px',
                                        borderRadius: 8,
                                        fontWeight: 500,
                                        fontSize: 12,
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                    }}
                                    className="border border-secondary-border bg-secondary-bg text-text-dim"
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
