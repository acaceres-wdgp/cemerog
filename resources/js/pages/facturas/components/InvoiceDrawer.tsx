import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Ban, CreditCard, Printer, User } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
} from '@/components/ui/sheet';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { cxc } from '@/routes';
import caja from '@/routes/caja';
import pacientes from '@/routes/pacientes';
import { METHOD_LABELS } from '@/pages/caja/types';
import type { ReceiptRow } from '@/pages/caja/types';
import type { InvoiceListDetail } from '../types';
import StatusPill from './StatusPill';

const button =
    'inline-flex h-9 flex-none cursor-pointer items-center gap-2 rounded-[10px] border border-secondary-border bg-secondary-bg px-[14px] font-medium whitespace-nowrap text-text-body hover:bg-accent-bg';

const methods = (r: ReceiptRow) =>
    [...new Set(r.payments.map((p) => METHOD_LABELS[p.method]))].join(' + ');

type Event = { title: string; detail: string; tone: string };

/** Emitted, each payment (and its voiding) and the voiding of the invoice */
function history(invoice: InvoiceListDetail): Event[] {
    const events: Event[] = [
        {
            title: 'Factura emitida',
            detail: `${invoice.issued_at} · ${invoice.issued_by}`,
            tone: 'bg-primary',
        },
    ];
    for (const r of invoice.receipts) {
        events.push({
            title: `Pago ${formatMoney(r.total)} · ${methods(r)}`,
            detail: `${r.created_at} · Recibo ${r.number} · ${r.created_by}`,
            tone: 'state-balance bg-[var(--state-accent)]',
        });
        if (r.voided) {
            events.push({
                title: `Recibo ${r.number} anulado`,
                detail: r.void_reason ?? '',
                tone: 'state-emergencia bg-[var(--state-accent)]',
            });
        }
    }
    if (invoice.status === 'anulada') {
        events.push({
            title: 'Factura anulada',
            detail: `${invoice.voided_at} · ${invoice.voided_by}`,
            tone: 'state-emergencia bg-[var(--state-accent)]',
        });
    }

    return events;
}

/** Side panel with the detail of an invoice */
export default function InvoiceDrawer({
    invoice,
    onClose,
}: {
    invoice: InvoiceListDetail;
    onClose: () => void;
}) {
    const permissions =
        (usePage().props as { permissions?: string[] }).permissions ?? [];
    const can = (p: string) => permissions.includes(p);
    const voided = invoice.status === 'anulada';
    const receipts = invoice.receipts.filter((r) => !r.voided);

    return (
        <Sheet open onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                side="right"
                className="flex w-full flex-col gap-0 p-0 sm:max-w-[560px]"
            >
                <div className="flex-none border-b border-divider px-5 pt-[18px] pr-12 pb-[14px]">
                    <div className="flex flex-wrap items-center gap-[10px]">
                        <SheetTitle className="m-0 font-serif text-[20px] font-semibold text-text-heading">
                            Factura {invoice.number}
                        </SheetTitle>
                        <StatusPill status={invoice.status} />
                    </div>
                    <SheetDescription className="mt-0.5 text-[13px] text-text-secondary">
                        {invoice.condition}
                        {invoice.credit_due_date &&
                            ` · compromiso ${invoice.credit_due_date}`}
                    </SheetDescription>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-5 pt-4 pb-5">
                    {voided && (
                        <div className="flex items-start gap-2 rounded-[10px] border border-error-border bg-error-bg px-3 py-[10px] text-[13px] text-error">
                            <Ban
                                aria-hidden
                                className="mt-0.5 h-4 w-4 flex-none"
                            />
                            <span>
                                <b>Factura anulada.</b> Motivo:{' '}
                                {invoice.void_reason}
                            </span>
                        </div>
                    )}

                    <dl className="m-0 grid grid-cols-[120px_minmax(0,1fr)] gap-x-[14px] gap-y-2 text-[13.5px]">
                        <dt className="text-text-secondary">Paciente</dt>
                        <dd className="m-0 font-semibold text-text-heading">
                            {invoice.patient.full_name}
                        </dd>
                        <dt className="text-text-secondary">Cédula</dt>
                        <dd className="m-0 tabular-nums">
                            {invoice.patient.document_number}
                        </dd>
                        <dt className="text-text-secondary">Atención</dt>
                        <dd className="m-0">
                            Atención del {invoice.service_date} · {invoice.area}
                        </dd>
                        <dt className="text-text-secondary">Emitida</dt>
                        <dd className="m-0">
                            {invoice.issued_at} · {invoice.issued_by}
                        </dd>
                    </dl>

                    <section aria-label="Detalle facturado">
                        <h3 className="m-0 mb-2 text-[13px] font-semibold text-text-heading">
                            Detalle facturado
                        </h3>
                        <div className="overflow-hidden rounded-[10px] border border-divider">
                            {invoice.lines.map((l) => (
                                <div
                                    key={l.id}
                                    className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 border-b border-divider px-3 py-[9px] text-[13px] tabular-nums"
                                >
                                    <span>
                                        <span>{l.description}</span>{' '}
                                        <span className="text-muted">
                                            × {l.quantity}
                                        </span>
                                    </span>
                                    <span className="text-muted">
                                        {formatMoney(l.unit_price)}
                                    </span>
                                    <span className="min-w-[96px] text-right font-medium">
                                        {formatMoney(l.total)}
                                    </span>
                                </div>
                            ))}
                            <div className="flex flex-col gap-1.5 bg-list-row-bg px-3 py-[10px] text-[13.5px] tabular-nums">
                                {invoice.discount_amount > 0 && (
                                    <div className="flex justify-between text-text-secondary">
                                        <span>Descuento</span>
                                        <span>
                                            −
                                            {formatMoney(
                                                invoice.discount_amount,
                                            )}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between font-semibold">
                                    <span>Total</span>
                                    <span>{formatMoney(invoice.total)}</span>
                                </div>
                                <div className="flex justify-between text-text-secondary">
                                    <span>Pagado</span>
                                    <span>
                                        {formatMoney(invoice.paid_amount)}
                                    </span>
                                </div>
                                {invoice.balance > 0 && (
                                    <div className="state-pendiente mt-0.5 flex items-center justify-between rounded-lg bg-[var(--state-bg)] px-[10px] py-2 font-semibold text-[var(--state-text)]">
                                        <span>Balance pendiente</span>
                                        <span className="text-[16px]">
                                            {formatMoney(invoice.balance)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <section aria-label="Pagos y recibos">
                        <h3 className="m-0 mb-2 text-[13px] font-semibold text-text-heading">
                            Pagos y recibos
                        </h3>
                        {receipts.length === 0 ? (
                            <div className="rounded-[10px] border border-dashed border-input-border px-3 py-[10px] text-[13px] text-text-secondary">
                                Sin pagos registrados.
                            </div>
                        ) : (
                            receipts.map((r) => (
                                <div
                                    key={r.id}
                                    className="flex items-center justify-between gap-[10px] border-b border-divider py-[9px] text-[13px]"
                                >
                                    <span>
                                        <span className="font-medium">
                                            {methods(r)}
                                        </span>
                                        <br />
                                        <span className="text-muted">
                                            {r.created_at} · Recibo {r.number}
                                        </span>
                                    </span>
                                    <span className="flex items-center gap-[10px]">
                                        <span className="font-semibold tabular-nums">
                                            {formatMoney(r.total)}
                                        </span>
                                        <a
                                            href={caja.receipts.print.url(r.id)}
                                            target="_blank"
                                            rel="noreferrer"
                                            aria-label={`Reimprimir recibo ${r.number}`}
                                            className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-secondary-border bg-secondary-bg text-text-body hover:bg-accent-bg"
                                        >
                                            <Printer className="h-3.5 w-3.5" />
                                        </a>
                                    </span>
                                </div>
                            ))
                        )}
                    </section>

                    <section aria-label="Historial">
                        <h3 className="m-0 mb-2 text-[13px] font-semibold text-text-heading">
                            Historial
                        </h3>
                        <ol className="m-0 flex list-none flex-col gap-[10px] p-0">
                            {history(invoice).map((h, i) => (
                                <li
                                    key={i}
                                    className="flex gap-[10px] text-[13px]"
                                >
                                    <span
                                        aria-hidden
                                        className={cn(
                                            'mt-[5px] h-[9px] w-[9px] flex-none rounded-full',
                                            h.tone,
                                        )}
                                    />
                                    <span>
                                        <span className="font-medium text-text-heading">
                                            {h.title}
                                        </span>
                                        <br />
                                        <span className="text-muted">
                                            {h.detail}
                                        </span>
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </section>
                </div>

                <div className="flex flex-none flex-wrap justify-end gap-2 border-t border-divider px-5 py-3">
                    {can('module.pacientes.access') && (
                        <Link
                            href={pacientes.show.url(invoice.patient.id)}
                            className={`${button} mr-auto`}
                        >
                            <User className="h-4 w-4" />
                            Ver paciente
                        </Link>
                    )}
                    <a
                        href={caja.invoices.print.url(invoice.id)}
                        target="_blank"
                        rel="noreferrer"
                        className={button}
                    >
                        <Printer className="h-4 w-4" />
                        Imprimir factura
                    </a>
                    {invoice.balance > 0 && can('module.cxc.access') && (
                        <Link
                            href={cxc.url({
                                query: { factura: invoice.number },
                            })}
                            className="inline-flex h-9 flex-none items-center gap-2 rounded-[10px] bg-primary px-[14px] font-medium whitespace-nowrap text-white shadow-sm hover:bg-primary-hover"
                        >
                            <CreditCard className="h-4 w-4" />
                            Registrar pago
                        </Link>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
