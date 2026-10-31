import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import FormDialog from '@/components/cemerog/FormDialog';
import FormField from '@/components/cemerog/FormField';
import emergenciaRoutes from '@/routes/emergencia';

/** Move the patient to another free cubicle */
export default function MoveCubicleDialog({
    emergencyId,
    current,
    freeCubicles,
    onClose,
}: {
    emergencyId: number;
    current: string;
    freeCubicles: { id: number; name: string }[];
    onClose: () => void;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [cubicleId, setCubicleId] = useState(
        freeCubicles[0] ? String(freeCubicles[0].id) : '',
    );
    const [isLoading, setIsLoading] = useState(false);

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        router.patch(
            emergenciaRoutes.cubicle.url(emergencyId),
            { cubicle_id: Number(cubicleId) },
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
            title="Cambiar de cubículo"
            description={`Ahora está en ${current}.`}
            submitLabel="Mover"
            onSubmit={submit}
            isLoading={isLoading}
            submitDisabled={cubicleId === ''}
        >
            <FormField
                as="select"
                name="cubicle_id"
                label="Cubículo libre"
                value={cubicleId}
                onChange={(e) => setCubicleId(e.target.value)}
                error={
                    errors.cubicle_id ??
                    (freeCubicles.length === 0
                        ? 'No hay cubículos libres.'
                        : undefined)
                }
            >
                {freeCubicles.map((c) => (
                    <option key={c.id} value={c.id}>
                        {c.name}
                    </option>
                ))}
            </FormField>
        </FormDialog>
    );
}
