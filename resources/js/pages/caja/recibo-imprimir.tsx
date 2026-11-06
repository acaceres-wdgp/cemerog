import React from 'react';
import PrintablePage from '@/components/cemerog/PrintablePage';
import ClinicHeader, {
    type ClinicInfo,
} from '@/components/cemerog/ClinicHeader';
import { formatMoney } from '@/lib/money';
import { paymentLabel } from './components/ReceiptsList';
import type { ReceiptRow } from './types';

type PrintableReceipt = ReceiptRow & {
    patient: string;
    invoice: {
        number: string;
        total: number;
        paid_amount: number;
        balance: number;
    };
};

export default function ReciboImprimir({
    receipt,
    clinic,
}: {
    receipt: PrintableReceipt;
    clinic: ClinicInfo;
}) {
    return (
        <>
            {/* Print CSS: hide app chrome */}
            <style>{`@media print { body > *:not(#app) { display: none !important; } #app > *:not(.printable-root) { display: none !important; } }`}</style>
            <div className="printable-root min-h-screen bg-surface py-8 print:bg-white print:p-0 print:py-0">
                <div className="mx-auto mb-4 flex w-full max-w-[816px] print:hidden">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex h-9 cursor-pointer items-center rounded-lg bg-primary px-[14px] text-sm font-medium text-white hover:bg-primary-hover"
                    >
                        Imprimir
                    </button>
                </div>
                <PrintablePage showHeader={false}>
                    <div className="mb-6 flex items-start justify-between border-b border-divider pb-5">
                        <ClinicHeader clinic={clinic} />
                        <div className="text-right text-[12.5px]">
                            <div className="font-semibold text-text-heading">
                                Recibo {receipt.number}
                            </div>
                            <div className="text-muted">
                                {receipt.created_at}
                            </div>
                        </div>
                    </div>

                    <p className="mb-4 text-[13.5px] text-text-body">
                        Recibimos de{' '}
                        <span className="font-semibold text-text-heading">
                            {receipt.patient}
                        </span>{' '}
                        la suma de{' '}
                        <span className="font-semibold text-text-heading">
                            {formatMoney(receipt.total)}
                        </span>{' '}
                        como pago a la factura {receipt.invoice.number}.
                    </p>

                    <ul className="mb-6 list-disc pl-5 text-[13px] text-text-body">
                        {receipt.payments.map((p, i) => (
                            <li key={i}>{paymentLabel(p)}</li>
                        ))}
                    </ul>

                    <div className="flex justify-end gap-6 border-t border-divider pt-3 text-[13px]">
                        <span className="text-muted">
                            Total factura {formatMoney(receipt.invoice.total)}
                        </span>
                        <span className="text-muted">
                            Pagado {formatMoney(receipt.invoice.paid_amount)}
                        </span>
                        <span className="font-semibold text-text-heading">
                            Balance {formatMoney(receipt.invoice.balance)}
                        </span>
                    </div>

                    <p className="mt-10 text-center text-[12px] text-muted">
                        Recibido por {receipt.created_by}.
                    </p>
                </PrintablePage>
            </div>
        </>
    );
}
