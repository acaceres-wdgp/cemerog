import React from 'react';
import { usePage } from '@inertiajs/react';
import { Printer, ReceiptText } from 'lucide-react';
import caja from '@/routes/caja';

/** After a payment: «Recibo R-… generado» with a link to print it */
export default function ReceiptReadyBanner() {
    const flash = usePage().flash as {
        receipt?: { id: number; number: string } | null;
    };
    const receipt = flash?.receipt ?? null;
    if (!receipt) return null;

    return (
        <div
            role="status"
            className="flex flex-wrap items-center gap-3 rounded-xl border border-accent-border bg-accent-bg px-4 py-3 text-accent-fg"
        >
            <ReceiptText className="h-[18px] w-[18px] shrink-0 text-primary" />
            <span className="flex-[1_1_240px]">
                Pago registrado. Se generó el recibo de ingreso{' '}
                <strong>{receipt.number}</strong>.
            </span>
            <a
                href={caja.receipts.print.url(receipt.id)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-accent-border bg-white px-[14px] font-medium text-text-body hover:bg-app-bg"
            >
                <Printer className="h-4 w-4" />
                Imprimir recibo
            </a>
        </div>
    );
}
