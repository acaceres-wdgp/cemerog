import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import FormDialog from '@/components/cemerog/FormDialog';
import FormField from '@/components/cemerog/FormField';
import SegmentedControl from '@/components/cemerog/SegmentedControl';
import { parseMoney } from '@/lib/money';
import * as items from '@/routes/almacen/items';
import { KIND_LABELS } from '../types';
import type { InventoryItemRow, ItemKind } from '../types';

/** Create or edit a catalog item (administrators) */
export default function ItemDialog({
    item,
    onClose,
}: {
    item: InventoryItemRow | null;
    onClose: () => void;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [form, setForm] = useState({
        name: item?.name ?? '',
        presentation: item?.presentation ?? '',
        kind: (item?.kind ?? 'medicamento') as ItemKind,
        price: item ? (item.price / 100).toFixed(2) : '',
        stock: item ? String(item.stock) : '0',
        min_stock: item ? String(item.min_stock) : '0',
        is_active: item?.is_active ?? true,
    });
    const [isLoading, setIsLoading] = useState(false);
    const set = (patch: Partial<typeof form>) =>
        setForm((f) => ({ ...f, ...patch }));

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const payload = {
            name: form.name.trim(),
            presentation: form.presentation.trim() || null,
            kind: form.kind,
            price: parseMoney(form.price),
            stock: parseInt(form.stock, 10) || 0,
            min_stock: parseInt(form.min_stock, 10) || 0,
            ...(item ? { is_active: form.is_active } : {}),
        };
        const options = {
            preserveScroll: true,
            onSuccess: onClose,
            onFinish: () => setIsLoading(false),
        };
        if (item) router.put(items.update.url(item.id), payload, options);
        else router.post(items.store.url(), payload, options);
    };

    return (
        <FormDialog
            open
            onOpenChange={(open) => !open && onClose()}
            title={item ? `Editar ${item.code}` : 'Nuevo artículo'}
            description="Los medicamentos e insumos activos se pueden aplicar a pacientes."
            submitLabel={item ? 'Guardar' : 'Agregar al catálogo'}
            onSubmit={submit}
            isLoading={isLoading}
            submitDisabled={form.name.trim() === '' || form.price.trim() === ''}
        >
            <div className="flex flex-col gap-3">
                <SegmentedControl<ItemKind>
                    segments={[
                        {
                            value: 'medicamento',
                            label: KIND_LABELS.medicamento,
                        },
                        { value: 'insumo', label: KIND_LABELS.insumo },
                    ]}
                    value={form.kind}
                    onChange={(kind) => set({ kind })}
                    className="self-start"
                />
                <FormField
                    name="name"
                    label="Nombre"
                    placeholder="Ej.: Dipirona 1 g/2 ml"
                    value={form.name}
                    onChange={(e) => set({ name: e.target.value })}
                    error={errors.name}
                    required
                />
                <FormField
                    name="presentation"
                    label="Presentación"
                    placeholder="Ej.: Ampolla, caja de 100, frasco 1000 ml"
                    value={form.presentation}
                    onChange={(e) => set({ presentation: e.target.value })}
                    error={errors.presentation}
                />
                <div className="grid grid-cols-3 gap-3">
                    <FormField
                        name="price"
                        label="Precio (RD$)"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={form.price}
                        onChange={(e) => set({ price: e.target.value })}
                        error={errors.price}
                        required
                    />
                    <FormField
                        name="stock"
                        label="Existencia"
                        inputMode="numeric"
                        value={form.stock}
                        onChange={(e) => set({ stock: e.target.value })}
                        error={errors.stock}
                    />
                    <FormField
                        name="min_stock"
                        label="Mínimo"
                        inputMode="numeric"
                        value={form.min_stock}
                        onChange={(e) => set({ min_stock: e.target.value })}
                        error={errors.min_stock}
                    />
                </div>
                {item && (
                    <label className="flex cursor-pointer items-center gap-2 text-[14px]">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) =>
                                set({ is_active: e.target.checked })
                            }
                        />
                        Activo (se puede aplicar a pacientes)
                    </label>
                )}
            </div>
        </FormDialog>
    );
}
