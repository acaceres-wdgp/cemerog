import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import FormDialog from '@/components/cemerog/FormDialog';
import FormField from '@/components/cemerog/FormField';

export type FreeCubicle = { id: number; name: string };

/**
 * «Pasar a emergencia»: pick a free cubicle and the reason. The consulta
 * ends as attended, the account stays open and the emergency fee is added.
 */
export default function ToEmergencyDialog({
    open,
    onOpenChange,
    subtitle,
    cubicles,
    url,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subtitle: string;
    cubicles: FreeCubicle[];
    url: string;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [cubicleId, setCubicleId] = useState('');
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const close = (value: boolean) => {
        if (!value) {
            setCubicleId('');
            setReason('');
        }
        onOpenChange(value);
    };

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        router.post(
            url,
            { cubicle_id: Number(cubicleId), reason: reason.trim() },
            { onFinish: () => setIsLoading(false) },
        );
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={close}
            title="Pasar a emergencia"
            description={subtitle}
            submitLabel="Trasladar a emergencia"
            onSubmit={submit}
            isLoading={isLoading}
            submitDisabled={!cubicleId || reason.trim() === ''}
        >
            <div className="flex flex-col gap-4">
                {cubicles.length === 0 ? (
                    <p className="m-0 rounded-[10px] bg-error-bg px-3 py-2 text-[13px] text-error-strong">
                        No hay cubículos libres en Emergencia en este momento.
                    </p>
                ) : (
                    <FormField
                        as="select"
                        name="cubicle_id"
                        label="Cubículo"
                        required
                        value={cubicleId}
                        onChange={(e) => setCubicleId(e.target.value)}
                        error={errors.cubicle_id}
                    >
                        <option value="">— Seleccionar cubículo libre —</option>
                        {cubicles.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </FormField>
                )}
                <FormField
                    as="textarea"
                    name="reason"
                    label="Motivo del traslado"
                    required
                    rows={3}
                    placeholder="Ej.: dolor torácico opresivo durante la consulta"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    error={errors.reason ?? errors.patient_id}
                />
                <p className="m-0 rounded-[10px] bg-list-row-bg px-3 py-2 text-[13px] text-text-secondary">
                    La consulta se cierra como atendida y usted queda como
                    médico responsable. La cuenta se mantiene y se agrega la
                    tarifa de Emergencia.
                </p>
            </div>
        </FormDialog>
    );
}
