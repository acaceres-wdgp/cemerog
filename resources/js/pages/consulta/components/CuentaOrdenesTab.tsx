import React, { useState } from 'react';
import ImagingOrderRow from '@/components/img/ImagingOrderRow';
import type { ImagingOrderWithReport } from '@/components/img/types';
import CancelLabOrderDialog from '@/components/lab/CancelLabOrderDialog';
import LabResultsList from '@/components/lab/LabResultsList';
import LabStatusPill from '@/components/lab/LabStatusPill';
import type { LabOrderSummary } from '@/components/lab/types';
import { formatMoney } from '@/lib/money';
import * as imgOrders from '@/routes/img/orders';
import type { AccountCharge } from '../types';

// ─── Cuenta / Órdenes Tab ─────────────────────────────────────────────────────

type Props = {
    charges: AccountCharge[];
    chargesTotal: number;
    labOrders?: LabOrderSummary[];
    imagingOrders?: ImagingOrderWithReport[];
};

export default function CuentaOrdenesTab({
    charges,
    chargesTotal,
    labOrders = [],
    imagingOrders = [],
}: Props) {
    const [cancelling, setCancelling] = useState<LabOrderSummary | null>(null);
    const [cancellingImg, setCancellingImg] =
        useState<ImagingOrderWithReport | null>(null);

    return (
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-4">
            {/* Órdenes panel */}
            <div className="overflow-hidden rounded-[14px] border border-card-border bg-white">
                <div className="px-[18px] py-[14px] font-serif text-[16px] font-semibold text-text-heading">
                    Órdenes
                </div>
                {labOrders.length + imagingOrders.length === 0 ? (
                    <div className="p-5 text-center text-[13px] text-muted">
                        No hay órdenes para esta consulta.
                    </div>
                ) : (
                    labOrders.map((o) => (
                        <div
                            key={o.id}
                            className="border-t border-divider px-[18px] py-3"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="font-medium text-text-heading">
                                        {o.tests.join(' · ')}
                                    </div>
                                    <div className="text-[12.5px] text-muted">
                                        Laboratorio · {o.number} ·{' '}
                                        {o.ordered_time}
                                        {o.validated_at
                                            ? ` · validado ${o.validated_at}`
                                            : ''}
                                    </div>
                                </div>
                                <div className="flex flex-none flex-col items-end gap-1">
                                    <LabStatusPill status={o.status} />
                                    {o.status === 'ordenada' && (
                                        <button
                                            type="button"
                                            onClick={() => setCancelling(o)}
                                            className="cursor-pointer text-[12px] font-semibold text-error"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </div>
                            {o.results && o.results.length > 0 && (
                                <div className="mt-2 rounded-[10px] bg-list-row-bg px-3 py-1.5">
                                    <LabResultsList results={o.results} />
                                </div>
                            )}
                        </div>
                    ))
                )}
                {imagingOrders.map((o) => (
                    <ImagingOrderRow
                        key={`img-${o.id}`}
                        order={o}
                        onCancel={() => setCancellingImg(o)}
                    />
                ))}
            </div>

            {/* Cargos panel */}
            <div className="overflow-hidden rounded-[14px] border border-card-border bg-white">
                <div className="px-[18px] py-[14px] font-serif text-[16px] font-semibold text-text-heading">
                    Cargos a la cuenta
                </div>

                {charges.length === 0 ? (
                    <div className="p-5 text-center text-[13px] text-muted">
                        No hay cargos registrados.
                    </div>
                ) : (
                    <>
                        {/* Table header */}
                        <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 border-b border-divider bg-app-bg px-4 py-2 text-[11.5px] font-semibold tracking-wide text-text-secondary uppercase">
                            <span>Descripción</span>
                            <span className="text-right">Cant.</span>
                            <span className="text-right">Importe</span>
                        </div>

                        {/* Charge rows */}
                        {charges.map((charge) => (
                            <div
                                key={charge.id}
                                className="grid grid-cols-[1fr_auto_auto] gap-x-3 border-b border-divider px-4 py-3 last:border-0"
                            >
                                <span className="text-[13px] text-text-body">
                                    {charge.description}
                                </span>
                                <span className="text-right text-[13px] text-text-secondary">
                                    {charge.quantity}
                                </span>
                                <span className="text-right text-[13px] font-medium text-text-heading">
                                    {formatMoney(charge.total)}
                                </span>
                            </div>
                        ))}

                        {/* Total row */}
                        <div className="flex items-center justify-between border-t border-divider bg-app-bg px-4 py-3">
                            <span className="text-[13px] font-semibold text-text-heading">
                                Total acumulado
                            </span>
                            <span className="text-[15px] font-bold text-primary">
                                {formatMoney(chargesTotal)}
                            </span>
                        </div>
                    </>
                )}
            </div>
            {cancelling && (
                <CancelLabOrderDialog
                    order={cancelling}
                    onClose={() => setCancelling(null)}
                />
            )}
            {cancellingImg && (
                <CancelLabOrderDialog
                    order={cancellingImg}
                    description={cancellingImg.name}
                    url={imgOrders.cancel.url(cancellingImg.id)}
                    onClose={() => setCancellingImg(null)}
                />
            )}
        </div>
    );
}
