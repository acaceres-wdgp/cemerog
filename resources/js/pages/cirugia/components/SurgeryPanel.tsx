import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Ban, CalendarClock } from 'lucide-react';
import { SURGERY_STATUS } from '@/components/cirugia/types';
import type { SurgeryOptions } from '@/components/cirugia/types';
import CancelLabOrderDialog from '@/components/lab/CancelLabOrderDialog';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import cirugia from '@/routes/cirugia';
import type { SurgeryBlock } from '../types';
import RescheduleDialog from './RescheduleDialog';

const NEXT: Partial<Record<SurgeryBlock['status'], string>> = {
    programada: 'Pasar a quirófano',
    quirofano: 'Marcar como realizada',
};

/** The selected surgery: data and next step */
export default function SurgeryPanel({
    surgery,
    options,
    canSchedule,
    canAdvance,
}: {
    surgery: SurgeryBlock | null;
    options: SurgeryOptions;
    canSchedule: boolean;
    canAdvance: boolean;
}) {
    const [rescheduling, setRescheduling] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    if (!surgery) {
        return (
            <section className="rounded-[14px] border border-card-border bg-white p-6 text-center text-[13.5px] text-muted">
                Selecciona una cirugía del calendario para ver sus datos.
            </section>
        );
    }
    const st = SURGERY_STATUS[surgery.status];
    const next = NEXT[surgery.status];

    return (
        <section className="rounded-[14px] border border-card-border bg-white">
            <div className="border-b border-divider px-5 py-4">
                <span
                    className={cn(
                        'inline-flex rounded-full border px-2.5 py-0.5 text-[12px] font-medium',
                        st.cls,
                    )}
                >
                    {st.label}
                </span>
                <div className="mt-2 font-serif text-[18px] font-semibold text-text-heading">
                    {surgery.procedure}
                </div>
                <div className="text-[13px] text-muted">
                    {surgery.date_label} · {surgery.start} – {surgery.end}
                </div>
            </div>
            <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 px-5 py-4 text-[13.5px]">
                {[
                    ['Paciente', surgery.patient.full_name],
                    ['No. de atención', surgery.number],
                    ['Cirujano', surgery.surgeon],
                    ['Anestesiólogo', surgery.anesthetist ?? '—'],
                    ['Quirófano', surgery.operating_room],
                    ['Habitación', surgery.room],
                    ['Precio', formatMoney(surgery.price)],
                ].map(([k, v]) => (
                    <React.Fragment key={k}>
                        <dt className="text-muted">{k}</dt>
                        <dd className="m-0 text-right font-medium">{v}</dd>
                    </React.Fragment>
                ))}
            </dl>
            {(surgery.notes || surgery.cancel_reason) && (
                <p className="m-0 border-t border-divider px-5 py-3 text-[13px] text-text-secondary">
                    {surgery.cancel_reason
                        ? `Cancelada: ${surgery.cancel_reason}`
                        : surgery.notes}
                </p>
            )}
            <div className="flex flex-col gap-2 border-t border-divider px-5 py-4">
                {next && canAdvance && (
                    <button
                        type="button"
                        onClick={() =>
                            router.post(
                                cirugia.advance.url(surgery.id),
                                {},
                                { preserveScroll: true },
                            )
                        }
                        className="inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-[10px] bg-primary px-[14px] font-medium text-white hover:bg-primary-hover"
                    >
                        {next}
                    </button>
                )}
                {surgery.status === 'quirofano' && (
                    <p className="m-0 text-[12.5px] text-muted">
                        Al marcarla como realizada se carga a la cuenta del
                        paciente.
                    </p>
                )}
                {surgery.status === 'programada' && canSchedule && (
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setRescheduling(true)}
                            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-secondary-border bg-secondary-bg font-medium hover:bg-accent-bg"
                        >
                            <CalendarClock className="h-4 w-4" />
                            Reprogramar
                        </button>
                        <button
                            type="button"
                            onClick={() => setCancelling(true)}
                            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-card-border bg-white font-medium text-error hover:bg-error-bg"
                        >
                            <Ban className="h-4 w-4" />
                            Cancelar
                        </button>
                    </div>
                )}
                {(surgery.status === 'realizada' ||
                    surgery.status === 'cancelada') && (
                    <p className="m-0 text-center text-[13px] text-muted">
                        Sin acciones pendientes.
                    </p>
                )}
            </div>
            {rescheduling && (
                <RescheduleDialog
                    surgery={surgery}
                    options={options}
                    onClose={() => setRescheduling(false)}
                />
            )}
            {cancelling && (
                <CancelLabOrderDialog
                    order={surgery}
                    description={`${surgery.procedure} · ${surgery.patient.full_name}`}
                    url={cirugia.cancel.url(surgery.id)}
                    onClose={() => setCancelling(false)}
                />
            )}
        </section>
    );
}
