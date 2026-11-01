import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import CancelLabOrderDialog from '@/components/lab/CancelLabOrderDialog';
import LabStatusPill from '@/components/lab/LabStatusPill';
import OrderStudiesDialog from '@/components/lab/OrderStudiesDialog';
import type { LabCatalogItem, LabOrderSummary } from '@/components/lab/types';
import * as lab from '@/routes/emergencia/lab';
import type { EmergencyDetail } from '../../types';
import { cardCls, headCls, secondaryBtn, titleCls } from './card';

/** Laboratorio e imágenes: orders of this attention and their status */
export default function LabOrdersCard({
    emergency,
    orders,
    catalog,
    active,
}: {
    emergency: EmergencyDetail;
    orders: LabOrderSummary[];
    catalog: LabCatalogItem[];
    active: boolean;
}) {
    const [ordering, setOrdering] = useState(false);
    const [cancelling, setCancelling] = useState<LabOrderSummary | null>(null);

    return (
        <section className={cardCls}>
            <div className={headCls}>
                <h2 className={titleCls}>Laboratorio e imágenes</h2>
                {active && (
                    <button
                        type="button"
                        onClick={() => setOrdering(true)}
                        className={secondaryBtn}
                    >
                        <Plus className="h-4 w-4" />
                        Ordenar
                    </button>
                )}
            </div>
            <div className="flex flex-col">
                {orders.length === 0 && (
                    <p className="m-0 px-5 py-5 text-center text-[13px] text-muted">
                        Sin estudios ordenados.
                    </p>
                )}
                {orders.map((o) => (
                    <div
                        key={o.id}
                        className="flex items-start justify-between gap-3 border-b border-divider px-5 py-3 last:border-b-0"
                    >
                        <div className="min-w-0">
                            <div className="font-medium text-text-heading">
                                {o.tests.join(' · ')}
                            </div>
                            <div className="text-[12.5px] text-muted">
                                {o.number} · {o.ordered_time}
                                {o.status === 'cancelada' && o.cancel_reason
                                    ? ` · ${o.cancel_reason}`
                                    : ''}
                            </div>
                        </div>
                        <div className="flex flex-none flex-col items-end gap-1">
                            <LabStatusPill status={o.status} />
                            {active && o.status === 'ordenada' && (
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
                ))}
            </div>
            {active && (
                <OrderStudiesDialog
                    open={ordering}
                    onOpenChange={setOrdering}
                    subtitle={`${emergency.patient.full_name} · ${emergency.number}`}
                    catalog={catalog}
                    url={lab.store.url(emergency.id)}
                />
            )}
            {cancelling && (
                <CancelLabOrderDialog
                    order={cancelling}
                    onClose={() => setCancelling(null)}
                />
            )}
        </section>
    );
}
