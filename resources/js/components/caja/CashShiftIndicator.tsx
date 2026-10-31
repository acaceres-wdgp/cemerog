import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cuadre } from '@/routes';
import type { CashShiftProp } from '@/types/global';
import OpenShiftDialog from './OpenShiftDialog';

/**
 * Topbar pill with the state of the single cash register, for users who bill
 * or run it. Lets them open a shift when the register is closed.
 */
export default function CashShiftIndicator() {
    const props = usePage().props as unknown as {
        permissions?: string[];
        cash_shift?: CashShiftProp | null;
    };
    const [opening, setOpening] = useState(false);
    const permissions = props.permissions ?? [];
    const canOpen = permissions.includes('module.caja.access');
    const canSee = canOpen || permissions.includes('module.cuadre.access');
    const shift = props.cash_shift ?? null;

    if (!canSee) return null;

    if (shift === null) {
        return (
            <>
                <button
                    type="button"
                    disabled={!canOpen}
                    onClick={() => setOpening(true)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-card-border bg-muted-bg px-3 text-[12.5px] font-medium text-muted enabled:cursor-pointer enabled:hover:text-text-heading"
                >
                    <Wallet className="h-3.5 w-3.5" />
                    Caja cerrada{canOpen ? ' · Abrir turno' : ''}
                </button>
                {canOpen && (
                    <OpenShiftDialog open={opening} onOpenChange={setOpening} />
                )}
            </>
        );
    }

    return (
        <Link
            href={cuadre.url()}
            title={`Abierta por ${shift.opened_by} desde ${shift.opened_at}`}
            className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium',
                shift.pending_close
                    ? 'border-error-border bg-error-bg text-error'
                    : 'border-accent-border bg-accent-bg text-accent-fg',
            )}
        >
            <Wallet className="h-3.5 w-3.5" />
            {shift.pending_close
                ? 'Caja pendiente de cierre'
                : shift.mine
                  ? 'Caja abierta'
                  : `Caja abierta · ${shift.opened_by}`}
        </Link>
    );
}
