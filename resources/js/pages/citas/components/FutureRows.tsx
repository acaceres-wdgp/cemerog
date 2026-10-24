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
                            <td className="pl-5 pr-3 py-1.5 font-semibold tabular-nums w-[60px] border-b border-row-divider text-text-tertiary">
                                {slot}
                            </td>
                            <td
                                colSpan={5}
                                className="px-3 h-[44px] border-b border-row-divider"
                            >
                                <div
                                    onClick={onNewCita}
                                    className="flex items-center gap-2 px-1 h-full rounded-lg cursor-pointer text-[13px] border border-dashed border-slot-empty-border text-text-tertiary"
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
                        <td className="pl-5 pr-3 py-[10px] font-semibold tabular-nums border-b border-divider text-text-heading">
                            {slot}
                        </td>
                        <td className="px-3 py-[10px] border-b border-divider">
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
                        <td className="px-3 py-[10px] border-b border-divider">
                            <div className="flex items-center gap-2">
                                <span
                                    style={{ background: pal.bg, color: pal.fg }} // dynamic-style: doctor color palette computed from doctor ID
                                    className="w-[26px] h-[26px] shrink-0 rounded-full inline-flex items-center justify-center text-[11px] font-semibold"
                                >
                                    {doc?.initials ?? '?'}
                                </span>
                                <span className="text-[13px]">
                                    {cita.doctor_name}
                                </span>
                            </div>
                        </td>
                        <td className="px-3 py-[10px] text-[13px] border-b border-divider text-text-dim">
                            {TYPE_LABELS[cita.type] ?? cita.type}
                        </td>
                        <td className="px-3 py-[10px] border-b border-divider">
                            <StatusBadge
                                state={citaStatusToState(cita.status)}
                            />
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
            {noSlot.map((cita) => {
                const doc = doctors.find((d) => d.id === cita.doctor_id);
                const pal = docPalette(cita.doctor_id);
                const canCancel =
                    cita.status === 'pendiente' || cita.status === 'confirmada';
                return (
                    <tr key={cita.id}>
                        <td className="pl-5 pr-3 py-[10px] font-semibold border-b border-divider text-text-tertiary">
                            —
                        </td>
                        <td className="px-3 py-[10px] border-b border-divider">
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
                        <td className="px-3 py-[10px] border-b border-divider">
                            <div className="flex items-center gap-2">
                                <span
                                    style={{ background: pal.bg, color: pal.fg }} // dynamic-style: doctor color palette computed from doctor ID
                                    className="w-[26px] h-[26px] shrink-0 rounded-full inline-flex items-center justify-center text-[11px] font-semibold"
                                >
                                    {doc?.initials ?? '?'}
                                </span>
                                <span className="text-[13px]">
                                    {cita.doctor_name}
                                </span>
                            </div>
                        </td>
                        <td className="px-3 py-[10px] text-[13px] border-b border-divider text-text-dim">
                            {TYPE_LABELS[cita.type] ?? cita.type}
                        </td>
                        <td className="px-3 py-[10px] border-b border-divider">
                            <StatusBadge
                                state={citaStatusToState(cita.status)}
                            />
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
