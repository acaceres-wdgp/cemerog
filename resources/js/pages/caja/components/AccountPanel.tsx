import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Ban, CreditCard, FileText, Printer } from 'lucide-react';
import OpenShiftDialog from '@/components/caja/OpenShiftDialog';
import caja from '@/routes/caja';
import type { CashShiftProp } from '@/types/global';
import type { BillableAccount, InvoiceDetail } from '../types';
import ChargesTable from './ChargesTable';
import EmitInvoiceDialog from './EmitInvoiceDialog';
import PaymentDialog from './PaymentDialog';
import ReceiptsList from './ReceiptsList';
import TotalsBox from './TotalsBox';
import VoidInvoiceDialog from './VoidInvoiceDialog';

type Dialog = 'emit' | 'pay' | 'void' | null;

const primary =
    'inline-flex h-9 flex-none cursor-pointer items-center gap-2 rounded-[10px] border-0 bg-primary px-[14px] font-medium whitespace-nowrap text-white shadow-sm hover:bg-primary-hover';
const secondary =
    'inline-flex h-9 flex-none cursor-pointer items-center gap-2 rounded-[10px] border border-secondary-border bg-secondary-bg px-[14px] font-medium whitespace-nowrap text-text-body hover:bg-accent-bg';
const danger =
    'inline-flex h-9 flex-none cursor-pointer items-center gap-2 rounded-[10px] border border-error-border bg-white px-[14px] font-medium whitespace-nowrap text-error hover:bg-error-bg';

/**
 * Right card of Facturación (and of Cuentas por cobrar): an account to
 * invoice or an issued invoice, with the actions of each stage.
 */
export default function AccountPanel({
    account,
    invoice,
    canVoid,
}: {
    account?: BillableAccount;
    invoice?: InvoiceDetail;
    canVoid: boolean;
}) {
    const shift =
        (usePage().props as unknown as { cash_shift?: CashShiftProp | null })
            .cash_shift ?? null;
    const [dialog, setDialog] = useState<Dialog>(null);
    // Collecting needs an open shift: open it first, then continue
    const [afterShift, setAfterShift] = useState<Dialog>(null);
    const [openingShift, setOpeningShift] = useState(false);

    useEffect(() => {
        if (shift !== null && afterShift !== null) {
            setDialog(afterShift);
            setAfterShift(null);
        }
    }, [shift, afterShift]);

    const collect = (next: 'emit' | 'pay') => {
        if (shift === null) {
            setAfterShift(next);
            setOpeningShift(true);
        } else {
            setDialog(next);
        }
    };
    const blocked = shift !== null && !shift.can_operate;

    const title = invoice
        ? `Factura ${invoice.number} · ${invoice.credit_due_date ? 'Crédito' : 'Contado'}`
        : 'Cuenta por facturar';
    const patient = invoice
        ? invoice.patient.full_name
        : account?.patient.full_name;
    const serviceDate = invoice ? invoice.service_date : account?.service_date;
    const rows = invoice ? invoice.lines : (account?.charges ?? []);
    const lastReceipt = invoice?.receipts.filter((r) => !r.voided).at(-1);

    return (
        <div className="overflow-x-auto rounded-[14px] border border-card-border bg-white shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-divider px-5 py-4">
                <div>
                    <div className="text-[16px] font-semibold text-text-heading">
                        {title}
                    </div>
                    <div className="text-[13px] text-muted">
                        {patient} · Atención del {serviceDate}
                        {account?.status === 'abierta' && ' · en atención'}
                        {invoice?.status === 'anulada' && ' · anulada'}
                        {invoice?.credit_due_date &&
                            invoice.status === 'pendiente' &&
                            ` · compromiso ${invoice.credit_due_date}`}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {account &&
                        account.status === 'pendiente_facturar' &&
                        !blocked && (
                            <button
                                type="button"
                                onClick={() => collect('emit')}
                                className={primary}
                            >
                                <FileText className="h-4 w-4" />
                                Emitir factura
                            </button>
                        )}
                    {invoice && invoice.status !== 'anulada' && (
                        <>
                            {canVoid && invoice.paid_amount === 0 && (
                                <button
                                    type="button"
                                    onClick={() => setDialog('void')}
                                    className={danger}
                                >
                                    <Ban className="h-4 w-4" />
                                    Anular factura
                                </button>
                            )}
                            <a
                                href={caja.invoices.print.url(invoice.id)}
                                target="_blank"
                                rel="noreferrer"
                                className={secondary}
                            >
                                <Printer className="h-4 w-4" />
                                Imprimir factura
                            </a>
                            {invoice.status === 'pagada' && lastReceipt && (
                                <a
                                    href={caja.receipts.print.url(
                                        lastReceipt.id,
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={secondary}
                                >
                                    <Printer className="h-4 w-4" />
                                    Imprimir recibo
                                </a>
                            )}
                            {invoice.status === 'pendiente' && !blocked && (
                                <button
                                    type="button"
                                    onClick={() => collect('pay')}
                                    className={primary}
                                >
                                    <CreditCard className="h-4 w-4" />
                                    Registrar pago
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {account?.status === 'abierta' && (
                <p className="mx-5 mt-4 rounded-[10px] bg-app-bg px-3 py-2 text-[13px] text-muted">
                    El paciente sigue en atención. La cuenta se podrá facturar
                    cuando el médico le dé el alta.
                </p>
            )}
            {blocked && (
                <p className="mx-5 mt-4 rounded-[10px] bg-app-bg px-3 py-2 text-[13px] text-muted">
                    La caja está abierta por {shift?.opened_by}. Solo esa
                    persona puede cobrar en este turno.
                </p>
            )}
            {invoice?.status === 'anulada' && (
                <p className="mx-5 mt-4 rounded-[10px] bg-muted-bg px-3 py-2 text-[13px] text-muted">
                    Anulada por {invoice.voided_by} el {invoice.voided_at}:{' '}
                    {invoice.void_reason}
                </p>
            )}

            <ChargesTable rows={rows} />

            <div className="grid grid-cols-1 gap-6 px-5 pt-4 pb-5 md:grid-cols-[minmax(0,1fr)_320px]">
                <div className="flex flex-col gap-3">
                    <ReceiptsList
                        receipts={invoice?.receipts ?? []}
                        canVoid={canVoid}
                    />
                    {invoice?.discount_reason && (
                        <p className="text-[12.5px] text-muted">
                            Motivo del descuento: {invoice.discount_reason}
                        </p>
                    )}
                    {invoice?.credit_note && invoice.status === 'pendiente' && (
                        <p className="text-[12.5px] text-muted">
                            Nota del crédito: {invoice.credit_note}
                        </p>
                    )}
                </div>
                <TotalsBox
                    subtotal={
                        invoice ? invoice.subtotal : (account?.total ?? 0)
                    }
                    discount={invoice ? invoice.discount_amount : 0}
                    discountLabel={
                        invoice?.discount_type === 'porcentaje'
                            ? `Descuento (${invoice.discount_value}%)`
                            : 'Descuento'
                    }
                    paid={
                        invoice && invoice.status !== 'anulada'
                            ? invoice.paid_amount
                            : 0
                    }
                />
            </div>

            {account && dialog === 'emit' && (
                <EmitInvoiceDialog
                    account={account}
                    open
                    onOpenChange={(o) => !o && setDialog(null)}
                />
            )}
            {invoice && dialog === 'pay' && (
                <PaymentDialog
                    invoice={invoice}
                    open
                    onOpenChange={(o) => !o && setDialog(null)}
                />
            )}
            {invoice && dialog === 'void' && (
                <VoidInvoiceDialog
                    invoice={invoice}
                    open
                    onOpenChange={(o) => !o && setDialog(null)}
                />
            )}
            <OpenShiftDialog
                open={openingShift}
                onOpenChange={(o) => {
                    setOpeningShift(o);
                    if (!o && shift === null) setAfterShift(null);
                }}
            />
        </div>
    );
}
