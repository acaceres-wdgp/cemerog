import { cn } from '@/lib/utils';
import StatusBadge from '@/components/cemerog/StatusBadge';
import { AppointmentRow, DoctorOption } from '../types';
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

type TodayRowsProps = {
    rows: AppointmentRow[];
    doctors: DoctorOption[];
    onNewCita: () => void;
    onCancel: (id: number) => void;
};

export function TodayRows({
    rows,
    doctors,
    onNewCita,
    onCancel,
}: TodayRowsProps) {
    if (rows.length === 0) {
        return (
            <tr>
                <td colSpan={6}>
                    <div className="pl-5 pr-3 py-1.5 border-b border-row-divider">
                        <div
                            className="flex items-center gap-2 px-1 h-[44px] rounded-lg cursor-pointer text-[13px] border border-dashed border-slot-empty-border text-text-tertiary"
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
                const isDone =
                    cita.status === 'atendida' ||
                    cita.status === 'no_asistio' ||
                    cita.status === 'cancelada';
                const isInList = cita.status === 'en_lista';
                const canCancel =
                    cita.status === 'pendiente' || cita.status === 'confirmada';
                const doc = doctors.find((d) => d.id === cita.doctor_id);
                const pal = docPalette(cita.doctor_id);
                return (
                    <tr
                        key={cita.id}
                        className={cn(
                            isDone
                                ? 'bg-done-row-bg'
                                : isInList
                                  ? 'bg-list-row-bg'
                                  : 'bg-white',
                        )}
                    >
                        {/* Status / Turn column */}
                        <td className="pl-5 pr-3 py-[10px] border-b border-divider">
                            <StatusBadge
                                state={citaStatusToState(cita.status)}
                                label={
                                    isInList && cita.turn_number
                                        ? `T-${String(cita.turn_number).padStart(2, '0')} · En lista`
                                        : undefined
                                }
                            />
                        </td>
                        <td className="px-3 py-[10px] border-b border-divider">
                            <div
                                className={cn(
                                    'font-medium',
                                    isDone
                                        ? 'text-text-tertiary'
                                        : 'text-text-heading',
                                )}
                            >
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
                        <td className="px-3 py-[10px] border-b border-divider">
                            <div className="flex items-center gap-2">
                                <span
                                    style={{ background: pal.bg, color: pal.fg }} // dynamic-style: doctor color palette computed from doctor ID
                                    className="w-[26px] h-[26px] shrink-0 rounded-full inline-flex items-center justify-center text-[11px] font-semibold"
                                >
                                    {doc?.initials ?? '?'}
                                </span>
                                <span
                                    className={cn(
                                        'text-[13px]',
                                        isDone
                                            ? 'text-text-tertiary'
                                            : 'text-text-dim',
                                    )}
                                >
                                    {cita.doctor_name}
                                </span>
                            </div>
                        </td>
                        <td
                            className={cn(
                                'px-3 py-[10px] text-[13px] border-b border-divider',
                                isDone ? 'text-text-tertiary' : 'text-text-dim',
                            )}
                        >
                            {TYPE_LABELS[cita.type] ?? cita.type}
                        </td>
                        <td className="px-3 py-[10px] text-[13px] tabular-nums border-b border-divider text-muted">
                            {cita.appointment_time ?? '—'}
                        </td>
                        <td className="px-3 py-[10px] text-right border-b border-divider">
                            {canCancel && (
                                <button
                                    onClick={() => onCancel(cita.id)}
                                    className="h-7 px-2.5 rounded-lg font-medium text-xs cursor-pointer font-[inherit] border border-secondary-border bg-secondary-bg text-text-dim"
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
