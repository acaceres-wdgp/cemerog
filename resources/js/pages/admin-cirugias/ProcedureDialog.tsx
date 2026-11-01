import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import FormDialog from '@/components/cemerog/FormDialog';
import FormField from '@/components/cemerog/FormField';
import { parseMoney } from '@/lib/money';
import * as cirugias from '@/routes/admin/cirugias';
import type { ProcedureRow } from './index';

/** Nuevo procedimiento / Editar procedimiento */
export default function ProcedureDialog({
    procedure,
    nextCode,
    onClose,
}: {
    procedure: ProcedureRow | null;
    nextCode: string;
    onClose: () => void;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [form, setForm] = useState({
        code: procedure?.code ?? nextCode,
        name: procedure?.name ?? '',
        price: procedure ? (procedure.price / 100).toFixed(2) : '',
        duration_minutes: String(procedure?.duration_minutes ?? 60),
        is_active: procedure?.is_active ?? true,
    });
    const [isLoading, setIsLoading] = useState(false);
    const set = (patch: Partial<typeof form>) =>
        setForm((f) => ({ ...f, ...patch }));

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const payload = {
            code: form.code.trim(),
            name: form.name.trim(),
            price: parseMoney(form.price),
            duration_minutes: Number(form.duration_minutes),
            ...(procedure ? { is_active: form.is_active } : {}),
        };
        const options = {
            preserveScroll: true,
            onSuccess: onClose,
            onFinish: () => setIsLoading(false),
        };
        if (procedure)
            router.put(cirugias.update.url(procedure.id), payload, options);
        else router.post(cirugias.store.url(), payload, options);
    };

    return (
        <FormDialog
            open
            onOpenChange={(open) => !open && onClose()}
            title={
                procedure ? `Editar ${procedure.name}` : 'Nuevo procedimiento'
            }
            description="Los procedimientos activos se pueden programar en Cirugía. Se cobran al realizarse."
            submitLabel={procedure ? 'Guardar' : 'Agregar al catálogo'}
            onSubmit={submit}
            isLoading={isLoading}
            submitDisabled={
                form.code.trim() === '' ||
                form.name.trim() === '' ||
                form.price.trim() === ''
            }
        >
            <div className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-[100px_1fr]">
                    <FormField
                        name="code"
                        label="Código"
                        required
                        value={form.code}
                        onChange={(e) => set({ code: e.target.value })}
                        error={errors.code}
                    />
                    <FormField
                        name="name"
                        label="Procedimiento"
                        required
                        value={form.name}
                        onChange={(e) => set({ name: e.target.value })}
                        error={errors.name}
                    />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                        name="price"
                        label="Precio (RD$)"
                        required
                        inputMode="decimal"
                        placeholder="0.00"
                        value={form.price}
                        onChange={(e) => set({ price: e.target.value })}
                        error={errors.price}
                    />
                    <FormField
                        type="number"
                        name="duration_minutes"
                        label="Duración estimada (min)"
                        required
                        min={15}
                        step={15}
                        value={form.duration_minutes}
                        onChange={(e) =>
                            set({ duration_minutes: e.target.value })
                        }
                        error={errors.duration_minutes}
                    />
                </div>
                {procedure && (
                    <label className="flex cursor-pointer items-center gap-2 text-[14px]">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) =>
                                set({ is_active: e.target.checked })
                            }
                        />
                        Activo (se puede programar)
                    </label>
                )}
            </div>
        </FormDialog>
    );
}
