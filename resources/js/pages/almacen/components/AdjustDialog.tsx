import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import FormDialog from '@/components/cemerog/FormDialog';
import FormField from '@/components/cemerog/FormField';
import * as items from '@/routes/almacen/items';
import type { InventoryItemRow } from '../types';

/** Set the stock after a physical count, waste or expired goods */
export default function AdjustDialog({
    item,
    reasons,
    onClose,
}: {
    item: InventoryItemRow;
    reasons: Record<string, string>;
    onClose: () => void;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [stock, setStock] = useState(String(Math.max(0, item.stock)));
    const [reason, setReason] = useState(Object.keys(reasons)[0] ?? 'conteo');
    const [note, setNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const newStock = parseInt(stock, 10);
    const diff = Number.isNaN(newStock) ? null : newStock - item.stock;

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        router.post(
            items.adjust.url(item.id),
            { new_stock: newStock, reason, note: note.trim() || null },
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
            title={`Ajustar existencia · ${item.name}`}
            description={`Existencia actual en el sistema: ${item.stock}.`}
            submitLabel="Ajustar"
            onSubmit={submit}
            isLoading={isLoading}
            submitDisabled={diff === null || diff === 0 || newStock < 0}
        >
            <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                    <FormField
                        name="new_stock"
                        label="Existencia real"
                        inputMode="numeric"
                        value={stock}
                        onChange={(e) =>
                            setStock(e.target.value.replace(/\D/g, ''))
                        }
                        error={errors.new_stock}
                        required
                    />
                    <FormField
                        as="select"
                        name="reason"
                        label="Motivo"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        error={errors.reason}
                    >
                        {Object.entries(reasons).map(([k, label]) => (
                            <option key={k} value={k}>
                                {label}
                            </option>
                        ))}
                    </FormField>
                </div>
                <FormField
                    name="note"
                    label="Nota"
                    placeholder="Opcional"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />
                {diff !== null && diff !== 0 && (
                    <p className="m-0 rounded-[10px] bg-list-row-bg px-3 py-2 text-[13px] text-text-secondary">
                        {diff > 0 ? `Se suman ${diff}` : `Se restan ${-diff}`}{' '}
                        unidades.
                    </p>
                )}
            </div>
        </FormDialog>
    );
}
