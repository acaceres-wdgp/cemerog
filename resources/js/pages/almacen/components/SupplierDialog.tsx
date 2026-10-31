import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import FormDialog from '@/components/cemerog/FormDialog';
import FormField from '@/components/cemerog/FormField';
import * as suppliers from '@/routes/almacen/suppliers';

export type SupplierRow = {
    id: number;
    name: string;
    rnc: string | null;
    phone: string | null;
    contact: string | null;
    is_active: boolean;
    entries_count?: number;
};

/** Create or edit a supplier (also used from the goods entry) */
export default function SupplierDialog({
    supplier,
    onClose,
    onCreated,
}: {
    supplier: SupplierRow | null;
    onClose: () => void;
    onCreated?: () => void;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [form, setForm] = useState({
        name: supplier?.name ?? '',
        rnc: supplier?.rnc ?? '',
        phone: supplier?.phone ?? '',
        contact: supplier?.contact ?? '',
        is_active: supplier?.is_active ?? true,
    });
    const [isLoading, setIsLoading] = useState(false);
    const set = (patch: Partial<typeof form>) =>
        setForm((f) => ({ ...f, ...patch }));

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                onCreated?.();
                onClose();
            },
            onFinish: () => setIsLoading(false),
        };
        if (supplier)
            router.put(suppliers.update.url(supplier.id), form, options);
        else
            router.post(
                suppliers.store.url(),
                {
                    name: form.name,
                    rnc: form.rnc,
                    phone: form.phone,
                    contact: form.contact,
                },
                options,
            );
    };

    return (
        <FormDialog
            open
            onOpenChange={(open) => !open && onClose()}
            title={supplier ? `Editar ${supplier.name}` : 'Nuevo proveedor'}
            submitLabel={supplier ? 'Guardar' : 'Registrar proveedor'}
            onSubmit={submit}
            isLoading={isLoading}
            submitDisabled={form.name.trim() === ''}
        >
            <div className="flex flex-col gap-3">
                <FormField
                    name="name"
                    label="Nombre"
                    placeholder="Ej.: Distribuidora Farmacéutica del Cibao"
                    value={form.name}
                    onChange={(e) => set({ name: e.target.value })}
                    error={errors.name}
                    required
                />
                <div className="grid grid-cols-2 gap-3">
                    <FormField
                        name="rnc"
                        label="RNC"
                        value={form.rnc}
                        onChange={(e) => set({ rnc: e.target.value })}
                        error={errors.rnc}
                    />
                    <FormField
                        name="phone"
                        label="Teléfono"
                        value={form.phone}
                        onChange={(e) => set({ phone: e.target.value })}
                        error={errors.phone}
                    />
                </div>
                <FormField
                    name="contact"
                    label="Contacto"
                    placeholder="Nombre del vendedor o representante"
                    value={form.contact}
                    onChange={(e) => set({ contact: e.target.value })}
                />
                {supplier && (
                    <label className="flex cursor-pointer items-center gap-2 text-[14px]">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) =>
                                set({ is_active: e.target.checked })
                            }
                        />
                        Activo (aparece al registrar entradas)
                    </label>
                )}
            </div>
        </FormDialog>
    );
}
