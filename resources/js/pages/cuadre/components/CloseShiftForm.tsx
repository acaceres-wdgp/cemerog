import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import CashCountInput, {
    cashCountPayload,
    cashCountTotal,
    emptyCashCount,
} from '@/components/caja/CashCountInput';
import FormField from '@/components/cemerog/FormField';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import cuadre from '@/routes/cuadre';

function differenceLabel(diff: number): string {
    if (diff === 0) return 'Cuadrado';
    return diff < 0 ? 'Faltante' : 'Sobrante';
}

/** Count the drawer, see the difference and close the shift */
export default function CloseShiftForm({
    expectedCash,
}: {
    expectedCash: number;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [count, setCount] = useState(emptyCashCount);
    const [note, setNote] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const counted = cashCountTotal(count);
    const hasCount =
        count.mode === 'monto'
            ? count.amount.trim() !== ''
            : Object.values(count.units).some((u) => u !== '');
    const difference = counted - expectedCash;
    const needsNote = hasCount && difference !== 0;
    const canSubmit =
        hasCount && confirmed && (!needsNote || note.trim() !== '');

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!canSubmit) return;
        setIsLoading(true);
        router.post(
            cuadre.close.url(),
            {
                ...cashCountPayload(count, 'counted_cash'),
                close_note: note.trim() || null,
                confirmed,
            },
            { preserveScroll: true, onFinish: () => setIsLoading(false) },
        );
    };

    return (
        <form
            onSubmit={submit}
            className="flex flex-col gap-4 rounded-2xl border border-card-border bg-white px-5 py-4"
        >
            <h2 className="m-0 font-serif text-[16px] font-semibold text-text-heading">
                Cuadrar y cerrar turno
            </h2>

            <CashCountInput
                label="Efectivo contado en caja"
                count={count}
                onChange={setCount}
                error={errors.counted_cash ?? errors.denominations}
            />

            {hasCount && (
                <div
                    className={cn(
                        'flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 text-[13.5px]',
                        difference === 0
                            ? 'border-accent-border bg-accent-bg text-accent-fg'
                            : 'border-error-border bg-error-bg text-error',
                    )}
                    role="status"
                >
                    <span>
                        Esperado {formatMoney(expectedCash)} · contado{' '}
                        {formatMoney(counted)}
                    </span>
                    <span className="font-semibold tabular-nums">
                        {differenceLabel(difference)}
                        {difference !== 0 &&
                            ` ${formatMoney(Math.abs(difference))}`}
                    </span>
                </div>
            )}

            {needsNote && (
                <FormField
                    as="textarea"
                    name="close_note"
                    label="Explica la diferencia"
                    rows={2}
                    value={note}
                    error={errors.close_note}
                    onChange={(e) => setNote(e.target.value)}
                    required
                />
            )}

            <label className="flex cursor-pointer items-center gap-2 text-[13.5px] text-text-body">
                <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                />
                Caja cuadrada: conté el efectivo y entrego el turno.
            </label>
            {errors.confirmed && (
                <p className="text-xs text-error">{errors.confirmed}</p>
            )}
            {errors.shift && (
                <p className="text-xs text-error" role="alert">
                    {errors.shift}
                </p>
            )}

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={!canSubmit || isLoading}
                    className="inline-flex h-9 items-center rounded-lg bg-primary px-[14px] text-sm font-medium text-white enabled:cursor-pointer enabled:hover:bg-primary-hover disabled:opacity-50"
                >
                    Cerrar turno
                </button>
            </div>
        </form>
    );
}
