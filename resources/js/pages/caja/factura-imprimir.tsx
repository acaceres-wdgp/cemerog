import React from 'react';
import PrintablePage from '@/components/cemerog/PrintablePage';
import ClinicHeader, {
    type ClinicInfo,
} from '@/components/cemerog/ClinicHeader';
import ChargesTable from './components/ChargesTable';
import TotalsBox from './components/TotalsBox';
import type { InvoiceDetail } from './types';

export default function FacturaImprimir({
    invoice,
    clinic,
}: {
    invoice: InvoiceDetail;
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
                                Factura {invoice.number}
                            </div>
                            <div className="text-muted">
                                {invoice.issued_at}
                            </div>
                            {invoice.status === 'anulada' && (
                                <div className="mt-1 font-semibold text-error">
                                    ANULADA
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mb-6 rounded-[10px] border border-card-border px-[14px] py-[10px] text-[13px]">
                        <span className="text-muted">Paciente: </span>
                        <span className="font-semibold text-text-heading">
                            {invoice.patient.full_name}
                        </span>
                        <span className="text-muted">
                            {' '}
                            · Expediente {invoice.patient.expediente_number} ·
                            Atención del {invoice.service_date}
                        </span>
                    </div>

                    <ChargesTable rows={invoice.lines} />

                    <div className="mt-4 ml-auto w-[320px]">
                        <TotalsBox
                            subtotal={invoice.subtotal}
                            discount={invoice.discount_amount}
                            discountLabel={
                                invoice.discount_type === 'porcentaje'
                                    ? `Descuento (${invoice.discount_value}%)`
                                    : 'Descuento'
                            }
                            paid={
                                invoice.status === 'anulada'
                                    ? 0
                                    : invoice.paid_amount
                            }
                        />
                    </div>

                    <p className="mt-10 text-center text-[12px] text-muted">
                        Emitida por {invoice.issued_by}. Gracias por su
                        preferencia.
                    </p>
                </PrintablePage>
            </div>
        </>
    );
}
