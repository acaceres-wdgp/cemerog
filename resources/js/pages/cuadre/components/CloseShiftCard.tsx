import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Lock, Printer } from 'lucide-react';
import ConfirmDialog from '@/components/cemerog/ConfirmDialog';
import FormField from '@/components/cemerog/FormField';
import { cn } from '@/lib/utils';
import cuadre from '@/routes/cuadre';
import type { CashShiftView } from '../types';
import { cardCls, differenceText } from './cuadreMath';

export type CloseCount = {
    cash: number;
    denominations: Record<string, number>;
    card: number;
    transfer: number;
};

/** Observaciones + «Cerrar turno»; for a closed shift, how it was closed */
export default function CloseShiftCard({
    shift,
    count,
    difference,
}: {
    shift: CashShiftView;
    count: CloseCount;
    difference: number;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [note, setNote] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    if (shift.status === 'cerrado') {
        return (
            <section
                className={cn(cardCls, 'flex flex-col gap-3 px-5 py-[18px]')}
            >
                <div className="flex gap-[10px] text-accent-fg">
                    <Lock className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary" />
                    <div>
                        <div className="font-semibold">
                            Turno cerrado el {shift.closed_at}
                            {shift.closed_by ? ` por ${shift.closed_by}` : ''} ·
                            diferencia {differenceText(difference)}
                        </div>
                        {shift.close_note && (
                            <div className="text-[13px] text-text-secondary">
                                {shift.close_note}
                            </div>
                        )}
                    </div>
                </div>
                <a
                    href={cuadre.report.url(shift.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-card-border bg-white px-[14px] font-medium text-text-body hover:bg-app-bg"
                >
                    <Printer className="h-4 w-4" />
                    Imprimir reporte
                </a>
            </section>
        );
    }

    if (!shift.can_operate) {
        return (
            <p
                className={cn(
                    cardCls,
                    'px-5 py-6 text-center text-[13px] text-muted',
                )}
            >
                Solo {shift.opened_by} o un administrador puede cuadrar y cerrar
                este turno.
            </p>
        );
    }

    const needsNote = difference !== 0 && note.trim() === '';

    const close = () => {
        setIsLoading(true);
        router.post(
            cuadre.close.url(),
            {
                counted_cash: count.cash,
                denominations: count.denominations,
                counted_card: count.card,
                counted_transfer: count.transfer,
                close_note: note.trim() || null,
                confirmed: true,
            },
            {
                preserveScroll: true,
                onSuccess: () => setConfirming(false),
                onFinish: () => setIsLoading(false),
            },
        );
    };

    return (
        <section className={cn(cardCls, 'flex flex-col gap-3 px-5 py-[18px]')}>
            <FormField
                as="textarea"
                name="close_note"
                label="Observaciones del cierre"
                rows={2}
                placeholder="Ej.: faltante por cambio a paciente"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                error={errors.close_note ?? errors.confirmed ?? errors.shift}
                help={
                    needsNote
                        ? 'Hay diferencia: explica el motivo para cerrar.'
                        : undefined
                }
            />
            <button
                type="button"
                disabled={needsNote}
                onClick={() => setConfirming(true)}
                className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-primary px-[14px] font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-primary-disabled"
            >
                <Lock className="h-4 w-4" />
                Cerrar turno
            </button>
            <ConfirmDialog
                open={confirming}
                onOpenChange={setConfirming}
                title="¿Caja cuadrada?"
                description={`Conté el efectivo y entrego el turno. Diferencia: ${differenceText(difference)}.`}
                confirmLabel="Cerrar turno"
                onConfirm={close}
                isLoading={isLoading}
            />
        </section>
    );
}
