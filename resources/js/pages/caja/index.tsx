import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Receipt } from 'lucide-react';
import EmptyState from '@/components/cemerog/EmptyState';
import { caja } from '@/routes';
import BillingQueue from './components/BillingQueue';
import type { Selection } from './components/BillingQueue';
import InvoiceDetailPanel from './components/InvoiceDetailPanel';
import InvoiceDraft from './components/InvoiceDraft';
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

    const account =
        selection?.kind === 'account'
            ? [...pending_accounts, ...accounts_in_care].find(
                  (a) => a.id === selection.id,
              )
            : undefined;
    const invoice =
        selection?.kind === 'invoice' && selected_invoice?.id === selection.id
            ? selected_invoice
            : null;

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h1 className="m-0 font-serif text-[26px] font-semibold text-text-heading">
                    Facturación
                </h1>
                <p className="mt-1 text-muted">
                    {pending_accounts.length} cuentas pendientes de facturar ·{' '}
                    {accounts_in_care.length} en atención
                </p>
            </div>

            <div className="flex flex-wrap items-start gap-4">
                <div className="min-w-[280px] flex-[1_1_320px]">
                    <BillingQueue
                        pending={pending_accounts}
                        inCare={accounts_in_care}
                        invoices={invoices}
                        selection={selection}
                        onSelect={select}
                    />
                </div>
                <div className="min-w-[320px] flex-[2_1_560px]">
                    {account ? (
                        <InvoiceDraft key={account.id} account={account} />
                    ) : invoice ? (
                        <InvoiceDetailPanel
                            invoice={invoice}
                            canVoid={can_void}
                        />
                    ) : (
                        <div className="rounded-2xl border border-card-border bg-white py-10">
                            <EmptyState
                                icon={Receipt}
                                title="Elige una cuenta o una factura"
                                description="Las cuentas se pueden facturar cuando el médico da el alta."
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
