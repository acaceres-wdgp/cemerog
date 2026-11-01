import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import FormDialog from '@/components/cemerog/FormDialog';
import FormField from '@/components/cemerog/FormField';
import internamiento from '@/routes/internamiento';
import BedOptions from './BedOptions';
import type { FreeBed } from './types';

/**
 * «Cambiar habitación» (choose a free bed) or «Confirmar traslado» after
 * dragging the patient to a free bed (`target` fixed).
 */
export default function MoveDialog({
    admissionId,
    patientName,
    fromLabel,
    beds,
    target,
    onClose,
}: {
    admissionId: number;
    patientName: string;
    fromLabel: string;
    beds: FreeBed[];
    target?: FreeBed;
    onClose: () => void;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [bedId, setBedId] = useState<number | null>(
        target?.id ?? beds[0]?.id ?? null,
    );
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        router.post(
            internamiento.move.url(admissionId),
            { bed_id: bedId, reason: reason.trim() || null },
            {
                preserveScroll: true,
                onSuccess: onClose,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    return (
        <FormDialog
            open
            onOpenChange={(open) => !open && onClose()}
            title={target ? 'Confirmar traslado' : 'Cambiar habitación'}
            description={`${patientName} · actualmente en ${fromLabel}`}
            submitLabel={target ? 'Confirmar traslado' : 'Confirmar cambio'}
            onSubmit={submit}
            isLoading={isLoading}
            submitDisabled={!bedId}
        >
            <div className="flex flex-col gap-3">
                {target ? (
                    <div className="flex items-center gap-3 rounded-[10px] border border-card-border px-3 py-2 text-[13.5px]">
                        <div>
                            <div className="text-[12px] text-muted">Desde</div>
                            <div className="font-medium">{fromLabel}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted" />
                        <div>
                            <div className="text-[12px] text-muted">Hacia</div>
                            <div className="font-medium">{target.label}</div>
                            <div className="text-[12px] text-muted">
                                {target.type}
                            </div>
                        </div>
                    </div>
                ) : (
                    <BedOptions beds={beds} value={bedId} onChange={setBedId} />
                )}
                {errors.bed_id && (
                    <p className="m-0 text-[12px] text-error">
                        {errors.bed_id}
                    </p>
                )}
                <FormField
                    as="textarea"
                    name="reason"
                    label="Motivo del traslado"
                    rows={2}
                    placeholder="Ej.: solicitud del paciente, aislamiento"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                />
                <p className="m-0 rounded-[10px] bg-list-row-bg px-3 py-2 text-[13px] text-text-secondary">
                    La cama actual quedará <strong>En limpieza</strong>. El
                    precio por día de la nueva habitación aplica desde mañana.
                </p>
            </div>
        </FormDialog>
    );
}
