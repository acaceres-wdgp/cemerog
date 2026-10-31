import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { CreditCard } from 'lucide-react';
import OpenShiftDialog from '@/components/caja/OpenShiftDialog';
import { cn } from '@/lib/utils';
import PaymentDialog from '@/pages/caja/components/PaymentDialog';
import type { PayableInvoice } from '@/pages/caja/components/PaymentDialog';
import type { CashShiftProp } from '@/types/global';

/**
 * «Registrar pago» for one invoice (Cuentas por cobrar, patient profile).
 * Collecting needs an open shift: without one it opens the shift first and
 * then the payment; a shift of another cashier blocks it.
 */
export default function PayInvoiceButton({
    invoice,
    className,
}: {
    invoice: PayableInvoice;
    className?: string;
}) {
    const shift =
        (usePage().props as unknown as { cash_shift?: CashShiftProp | null })
            .cash_shift ?? null;
    const [paying, setPaying] = useState(false);
    const [openingShift, setOpeningShift] = useState(false);
    const [payAfterShift, setPayAfterShift] = useState(false);

    useEffect(() => {
        if (shift !== null && payAfterShift) {
            setPaying(true);
            setPayAfterShift(false);
        }
    }, [shift, payAfterShift]);

    const blocked = shift !== null && !shift.can_operate;

    const start = () => {
        if (shift === null) {
            setPayAfterShift(true);
            setOpeningShift(true);
        } else {
            setPaying(true);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={start}
                disabled={blocked}
                title={
                    blocked
                        ? `La caja está abierta por ${shift?.opened_by}`
                        : undefined
                }
                className={cn(
                    'inline-flex h-9 flex-none cursor-pointer items-center gap-2 rounded-[10px] border border-secondary-border bg-secondary-bg px-[14px] font-medium whitespace-nowrap text-text-body hover:bg-accent-bg disabled:cursor-not-allowed disabled:opacity-50',
                    className,
                )}
            >
                <CreditCard className="h-4 w-4" />
                Registrar pago
            </button>
            {paying && (
                <PaymentDialog
                    invoice={invoice}
                    open
                    onOpenChange={(open) => !open && setPaying(false)}
                />
            )}
            <OpenShiftDialog
                open={openingShift}
                onOpenChange={(open) => {
                    setOpeningShift(open);
                    if (!open && shift === null) setPayAfterShift(false);
                }}
            />
        </>
    );
}
