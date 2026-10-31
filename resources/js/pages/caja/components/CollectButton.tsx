import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import OpenShiftDialog from '@/components/caja/OpenShiftDialog';
import type { CashShiftProp } from '@/types/global';
import type { InvoiceDetail } from '../types';
import PaymentDialog from './PaymentDialog';

const primaryBtn =
    'inline-flex h-9 cursor-pointer items-center rounded-lg bg-primary px-[14px] text-sm font-medium text-white hover:bg-primary-hover';

/**
 * Collecting needs an open shift run by this user. Without one, the button
 * opens the shift first; once open, it shows the payment dialog.
 */
export default function CollectButton({ invoice }: { invoice: InvoiceDetail }) {
    const shift =
        (usePage().props as unknown as { cash_shift?: CashShiftProp | null })
            .cash_shift ?? null;
    const [paying, setPaying] = useState(false);
    const [opening, setOpening] = useState(false);

    if (shift === null) {
        return (
            <>
                <button
                    type="button"
                    onClick={() => setOpening(true)}
                    className={primaryBtn}
                >
                    Abrir turno para cobrar
                </button>
                <OpenShiftDialog open={opening} onOpenChange={setOpening} />
            </>
        );
    }

    if (!shift.can_operate) {
        return (
            <p className="text-[13px] text-muted">
                La caja está abierta por {shift.opened_by}. Solo esa persona
                puede cobrar en este turno.
            </p>
        );
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setPaying(true)}
                className={primaryBtn}
            >
                Registrar pago
            </button>
            {paying && (
                <PaymentDialog
                    key={invoice.id}
                    invoice={invoice}
                    open={paying}
                    onOpenChange={setPaying}
                />
            )}
        </>
    );
}
