import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import FormDialog from '@/components/cemerog/FormDialog';
import FormField from '@/components/cemerog/FormField';
import SegmentedControl from '@/components/cemerog/SegmentedControl';
import { formatMoney, parseMoney } from '@/lib/money';
import * as items from '@/routes/almacen/items';
import { KIND_LABELS } from '../types';
import type { InventoryItemRow, ItemKind } from '../types';

/** Create or edit a catalog item (administrators) */
export default function ItemDialog({
    item,
    reasons = {},
    onClose,
}: {
    item: InventoryItemRow | null;
    /** Reasons for a change of stock (conteo, merma, vencido) */
    reasons?: Record<string, string>;
    onClose: () => void;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [form, setForm] = useState({
        name: item?.name ?? '',
        presentation: item?.presentation ?? '',
        kind: (item?.kind ?? 'medicamento') as ItemKind,
        price: item ? (item.price / 100).toFixed(2) : '',
        min_stock: item ? String(item.min_stock) : '0',
        is_active: item?.is_active ?? true,
        stock: item ? String(item.stock) : '0',
        reason: Object.keys(reasons)[0] ?? 'conteo',
        note: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const set = (patch: Partial<typeof form>) =>
        setForm((f) => ({ ...f, ...patch }));
    // A different stock is an adjustment and needs its reason
    const newStock = parseInt(form.stock, 10);
    const diff = item && !Number.isNaN(newStock) ? newStock - item.stock : 0;

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const payload = {
            name: form.name.trim(),
            presentation: form.presentation.trim() || null,
            kind: form.kind,
            price: parseMoney(form.price),
            min_stock: parseInt(form.min_stock, 10) || 0,
            ...(item ? { is_active: form.is_active } : {}),
            ...(item && diff !== 0
                ? {
                      new_stock: newStock,
                      reason: form.reason,
                      note: form.note.trim() || null,
                  }
                : {}),
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
            submitDisabled={
                form.name.trim() === '' ||
                form.price.trim() === '' ||
                (item !== null && Number.isNaN(newStock))
            }
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
                        readOnly={!item}
                        onChange={(e) =>
                            set({ stock: e.target.value.replace(/\D/g, '') })
                        }
                        error={errors.new_stock}
                        className={
                            item ? undefined : '[&_input]:bg-list-row-bg'
                        }
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
                {item && diff !== 0 && !Number.isNaN(newStock) ? (
                    <div className="flex flex-col gap-3 rounded-[10px] border border-card-border bg-list-row-bg px-3 py-3">
                        <p className="m-0 text-[13px] text-text-secondary">
                            Existencia {item.stock} → {newStock}:{' '}
                            {diff > 0
                                ? `se suman ${diff}`
                                : `se restan ${-diff}`}{' '}
                            {Math.abs(diff) === 1 ? 'unidad' : 'unidades'}.
                            Queda registrado como ajuste con su motivo.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField
                                as="select"
                                name="reason"
                                label="Motivo del cambio"
                                required
                                value={form.reason}
                                onChange={(e) =>
                                    set({ reason: e.target.value })
                                }
                                error={errors.reason}
                            >
                                {Object.entries(reasons).map(([k, label]) => (
                                    <option key={k} value={k}>
                                        {label}
                                    </option>
                                ))}
                            </FormField>
                            <FormField
                                name="note"
                                label="Nota"
                                placeholder="Opcional"
                                value={form.note}
                                onChange={(e) => set({ note: e.target.value })}
                                error={errors.note}
                            />
                        </div>
                    </div>
                ) : (
                    <p className="m-0 text-[12.5px] text-muted">
                        {item
                            ? 'Cambia la existencia aquí si el conteo físico no coincide; se pedirá el motivo. Las entradas y lo aplicado a pacientes la actualizan solos.'
                            : 'El artículo empieza con existencia 0; la mercancía entra con «Entrada de mercancía».'}
                    </p>
                )}
                {item && item.suppliers.length > 0 && (
                    <div className="rounded-[10px] border border-card-border">
                        <div className="border-b border-divider px-3 py-2 text-[13px] font-semibold text-text-heading">
                            Costos por proveedor
                        </div>
                        {item.suppliers.map((s) => (
                            <div
                                key={s.name}
                                className="flex justify-between gap-3 px-3 py-1.5 text-[13px]"
                            >
                                <span>
                                    {s.name}{' '}
                                    <span className="text-muted">
                                        · {s.last_entry_on}
                                    </span>
                                </span>
                                <span className="font-semibold tabular-nums">
                                    {formatMoney(s.last_cost)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
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
