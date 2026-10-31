import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Receipt } from 'lucide-react';
import EmptyState from '@/components/cemerog/EmptyState';
import { caja } from '@/routes';
import AccountPanel from './components/AccountPanel';
import CajaQueue from './components/CajaQueue';
import type { Selection } from './components/CajaQueue';
import type { CajaProps } from './types';

export default function CajaIndex({
    pending_accounts,
    accounts_in_care,
    invoices,
    selected_invoice,
    can_void,
}: CajaProps) {
    const [selection, setSelection] = useState<Selection>(
        selected_invoice
            ? { kind: 'invoice', id: selected_invoice.id }
            : pending_accounts[0]
              ? { kind: 'account', id: pending_accounts[0].id }
              : null,
    );

    const select = (next: Selection) => {
        setSelection(next);
        // The invoice detail comes from the server
        if (next?.kind === 'invoice' && next.id !== selected_invoice?.id) {
            router.get(
                caja.url({ query: { factura: next.id } }),
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    only: ['selected_invoice'],
                },
            );
        }
    };

    const findAccount = (id: number) =>
        [...pending_accounts, ...accounts_in_care].find((a) => a.id === id);

    // After emitting, the account leaves the lists and the server sends the
    // new invoice as the selected one
    const current: Selection =
        selection?.kind === 'account' &&
        !findAccount(selection.id) &&
        selected_invoice
            ? { kind: 'invoice', id: selected_invoice.id }
            : selection;

    const account =
        current?.kind === 'account' ? findAccount(current.id) : undefined;
    const invoice =
        current?.kind === 'invoice' && selected_invoice?.id === current.id
            ? selected_invoice
            : undefined;

    return (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
            <CajaQueue
                pending={pending_accounts}
                inCare={accounts_in_care}
                invoices={invoices}
                selection={current}
                onSelect={select}
            />
            {account || invoice ? (
                <AccountPanel
                    key={account ? `a${account.id}` : `i${invoice?.id}`}
                    account={account}
                    invoice={invoice}
                    canVoid={can_void}
                />
            ) : (
                <div className="rounded-[14px] border border-card-border bg-white py-10 shadow-sm">
                    <EmptyState
                        icon={Receipt}
                        title="Elige una cuenta"
                        description="Las cuentas se facturan cuando el médico da el alta."
                    />
                </div>
            )}
        </div>
    );
}
