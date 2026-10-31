import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import ReceiptReadyBanner from '@/components/caja/ReceiptReadyBanner';
import { formatMoney } from '@/lib/money';
import AgingCards from './components/AgingCards';
import { bucketOf, invoicesLabel } from './components/aging';
import type { Bucket } from './components/aging';
import ReceivablesTable from './components/ReceivablesTable';
import type { CxcProps, ReceivableRow } from './types';

const digits = (s: string) => s.replace(/\D/g, '');

/** Name, cédula (with or without dashes) or invoice number */
function matches(row: ReceivableRow, query: string): boolean {
    const q = query.trim().toLowerCase();
    if (q === '') return true;
    const text =
        `${row.patient.full_name} ${row.patient.document_number} ${row.number}`.toLowerCase();
    if (text.includes(q)) return true;
    const d = digits(q);
    return d.length >= 3 && digits(row.patient.document_number).includes(d);
}

export default function CxcIndex({ invoices }: CxcProps) {
    const [bucket, setBucket] = useState<Bucket>('todas');
    const [query, setQuery] = useState('');

    // Oldest first
    const rows = useMemo(
        () =>
            invoices
                .filter(
                    (i) => bucket === 'todas' || bucketOf(i.days) === bucket,
                )
                .filter((i) => matches(i, query))
                .sort((a, b) => b.days - a.days),
        [invoices, bucket, query],
    );
    const sum = (list: ReceivableRow[]) =>
        list.reduce((total, i) => total + i.balance, 0);

    return (
        <div className="flex flex-col gap-4">
            <p className="m-0 text-text-secondary">
                {invoicesLabel(invoices.length)} con balance · total por cobrar{' '}
                {formatMoney(sum(invoices))}
            </p>
            <ReceiptReadyBanner />
            <AgingCards
                invoices={invoices}
                value={bucket}
                onChange={setBucket}
            />
            <section className="overflow-x-auto rounded-[14px] border border-card-border bg-white shadow-[0_1px_2px_rgba(16,40,24,.03)]">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <label className="flex h-10 w-full max-w-[420px] items-center gap-2 rounded-[10px] border border-input-border bg-white px-3 focus-within:border-primary">
                        <Search className="h-4 w-4 text-muted" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar paciente, cédula o factura"
                            aria-label="Buscar paciente, cédula o factura"
                            className="w-full border-0 bg-transparent outline-none"
                        />
                    </label>
                    <span className="text-[13px] text-muted">
                        {invoicesLabel(rows.length)}
                    </span>
                </div>
                <ReceivablesTable rows={rows} />
                {rows.length === 0 && (
                    <div className="p-8 text-center text-muted">
                        No hay facturas con balance para este filtro.
                    </div>
                )}
                <div className="flex justify-end gap-6 border-t border-divider bg-list-row-bg px-5 py-[14px] tabular-nums">
                    <span className="text-text-secondary">
                        Balance filtrado
                    </span>
                    <span className="text-[16px] font-bold text-text-heading">
                        {formatMoney(sum(rows))}
                    </span>
                </div>
            </section>
        </div>
    );
}
