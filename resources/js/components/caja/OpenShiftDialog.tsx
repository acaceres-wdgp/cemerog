import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import FormDialog from '@/components/cemerog/FormDialog';
import caja from '@/routes/caja';
import CashCountInput, {
    cashCountPayload,
    emptyCashCount,
} from './CashCountInput';

/** Open the single cash register with its opening float */
export default function OpenShiftDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [count, setCount] = useState(emptyCashCount);
    const [isLoading, setIsLoading] = useState(false);

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        router.post(
            caja.turno.open.url(),
            cashCountPayload(count, 'opening_amount'),
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCount(emptyCashCount());
                    onOpenChange(false);
                },
                onFinish: () => setIsLoading(false),
            },
        );
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Abrir turno de caja"
            description="Cuenta el efectivo con el que empieza la caja (fondo para dar cambio)."
            submitLabel="Abrir turno"
            onSubmit={submit}
            isLoading={isLoading}
        >
            <div className="flex flex-col gap-3">
                {errors.shift && (
                    <p className="text-xs text-error" role="alert">
                        {errors.shift}
                    </p>
                )}
                <CashCountInput
                    label="Fondo de apertura"
                    count={count}
                    onChange={setCount}
                    error={errors.opening_amount ?? errors.denominations}
                />
            </div>
        </FormDialog>
    );
}
