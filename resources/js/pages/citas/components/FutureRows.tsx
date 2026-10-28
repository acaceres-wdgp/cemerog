import StatusBadge from '@/components/cemerog/StatusBadge';
import { AppointmentRow, DoctorOption } from '../types';
import { SLOTS } from '../lib/dates';
import { docPalette } from '@/components/cemerog/palettes';

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

/** Build avatar style from doctor palette — computed at runtime from doctor ID. */
function palStyle(pal: { bg: string; fg: string }): React.CSSProperties {
    return { background: pal.bg, color: pal.fg };
}

type FutureRowsProps = {
    bySlot: Record<string, AppointmentRow[]>;
    noSlot: AppointmentRow[];
    doctors: DoctorOption[];
    onNewCita: () => void;
    onCancel: (id: number) => void;
};

/**
 * Build the ordered list of time labels to render:
 * - Start with SLOTS
 * - Intercalate any extra hours (from bySlot keys not in SLOTS) in chronological order
 */
function buildTimeOrder(bySlot: Record<string, AppointmentRow[]>): string[] {
    const extra = Object.keys(bySlot).filter((t) => !SLOTS.includes(t));
    const all = [...SLOTS, ...extra].sort();
    return all;
}

function CitaRow({
    cita,
    doctors,
    showTime,
    timeLabel,
    onCancel,
}: {
    cita: AppointmentRow;
    doctors: DoctorOption[];
    showTime: boolean;
    timeLabel: string;
    onCancel: (id: number) => void;
}) {
    const doc = doctors.find((d) => d.id === cita.doctor_id);
    const pal = docPalette(cita.doctor_id);
    const canCancel =
        cita.status === 'pendiente' || cita.status === 'confirmada';
    return (
        <tr key={cita.id}>
            <td className="border-b border-divider py-[10px] pr-3 pl-5 font-semibold text-text-heading tabular-nums">
                {showTime ? timeLabel : ''}
            </td>
            <td className="border-b border-divider px-3 py-[10px]">
                <div className="font-medium">{cita.patient_name}</div>
                {cita.notes && (
                    <div className="text-xs text-muted">
                        {cita.notes.length > 40
                            ? cita.notes.slice(0, 40) + '…'
                            : cita.notes}
                    </div>
                )}
            </td>
            <td className="border-b border-divider px-3 py-[10px]">
                <div className="flex items-center gap-2">
                    {/* dynamic-style: doctor color palette computed from doctor ID */}
                    <span
                        style={palStyle(pal)}
                        className="inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                    >
                        {doc?.initials ?? '?'}
                    </span>
                    <span className="text-[13px]">{cita.doctor_name}</span>
                </div>
            </td>
            <td className="border-b border-divider px-3 py-[10px] text-[13px] text-text-dim">
                {TYPE_LABELS[cita.type] ?? cita.type}
            </td>
            <td className="border-b border-divider px-3 py-[10px]">
                <StatusBadge state={citaStatusToState(cita.status)} />
            </td>
            <td className="border-b border-divider px-3 py-[10px] text-right">
                {canCancel && (
                    <button
                        onClick={() => onCancel(cita.id)}
                        className="h-7 cursor-pointer rounded-lg border border-secondary-border bg-secondary-bg px-2.5 font-[inherit] text-xs font-medium text-text-dim"
                    >
                        Cancelar
                    </button>
                )}
            </td>
        </tr>
    );
}

export function FutureRows({
    bySlot,
    noSlot,
    doctors,
    onNewCita,
    onCancel,
}: FutureRowsProps) {
    const timeOrder = buildTimeOrder(bySlot);

    return (
        <>
            {timeOrder.map((time) => {
                const citas = bySlot[time];
                const isSlot = SLOTS.includes(time);

                if (!citas || citas.length === 0) {
                    // Only render empty slot rows for standard SLOTS
                    if (!isSlot) return null;
                    return (
                        <tr key={time}>
                            <td className="w-[60px] border-b border-row-divider py-1.5 pr-3 pl-5 font-semibold text-text-tertiary tabular-nums">
                                {time}
                            </td>
                            <td
                                colSpan={5}
                                className="h-[44px] border-b border-row-divider px-3"
                            >
                                <div
                                    onClick={onNewCita}
                                    className="flex h-full cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slot-empty-border px-1 text-[13px] text-text-tertiary"
                                >
                                    + Disponible
                                </div>
                            </td>
                        </tr>
                    );
                }

                return citas.map((cita, idx) => (
                    <CitaRow
                        key={cita.id}
                        cita={cita}
                        doctors={doctors}
                        showTime={idx === 0}
                        timeLabel={time}
                        onCancel={onCancel}
                    />
                ));
            })}
            {noSlot.map((cita) => {
                const doc = doctors.find((d) => d.id === cita.doctor_id);
                const pal = docPalette(cita.doctor_id);
                const canCancel =
                    cita.status === 'pendiente' || cita.status === 'confirmada';
                return (
                    <tr key={cita.id}>
                        <td className="border-b border-divider py-[10px] pr-3 pl-5 font-semibold text-text-tertiary">
                            —
                        </td>
                        <td className="border-b border-divider px-3 py-[10px]">
                            <div className="font-medium">
                                {cita.patient_name}
                            </div>
                            {cita.notes && (
                                <div className="text-xs text-muted">
                                    {cita.notes.length > 40
                                        ? cita.notes.slice(0, 40) + '…'
                                        : cita.notes}
                                </div>
                            )}
                        </td>
                        <td className="border-b border-divider px-3 py-[10px]">
                            <div className="flex items-center gap-2">
                                {/* dynamic-style: doctor color palette computed from doctor ID */}
                                <span
                                    style={palStyle(pal)}
                                    className="inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                                >
                                    {doc?.initials ?? '?'}
                                </span>
                                <span className="text-[13px]">
                                    {cita.doctor_name}
                                </span>
                            </div>
                        </td>
                        <td className="border-b border-divider px-3 py-[10px] text-[13px] text-text-dim">
                            {TYPE_LABELS[cita.type] ?? cita.type}
                        </td>
                        <td className="border-b border-divider px-3 py-[10px]">
                            <StatusBadge
                                state={citaStatusToState(cita.status)}
                            />
                        </td>
                        <td className="border-b border-divider px-3 py-[10px] text-right">
                            {canCancel && (
                                <button
                                    onClick={() => onCancel(cita.id)}
                                    className="h-7 cursor-pointer rounded-lg border border-secondary-border bg-secondary-bg px-2.5 font-[inherit] text-xs font-medium text-text-dim"
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
