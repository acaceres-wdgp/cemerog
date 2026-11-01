import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { CheckCircle2, Package, Printer, Send, XCircle } from 'lucide-react';
import CancelLabOrderDialog from '@/components/lab/CancelLabOrderDialog';
import ImgStatusPill from '@/components/img/ImgStatusPill';
import type { ImagingOrderDetail } from '@/components/img/types';
import * as orders from '@/routes/img/orders';
import AttachmentsField from './AttachmentsField';

const secondary =
    'inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-secondary-border bg-secondary-bg px-[14px] font-medium whitespace-nowrap text-text-body hover:bg-accent-bg';
const primary =
    'inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] bg-primary px-[14px] font-medium whitespace-nowrap text-white hover:bg-primary-hover disabled:bg-primary-disabled';
const area =
    'w-full rounded-[10px] border border-input-border px-3 py-2 outline-none focus:border-primary focus:ring-3 focus:ring-primary/15 read-only:bg-list-row-bg';

/** The selected study: data, report, attachments and next step */
export default function ReportCard({
    order,
    patientName,
    canSign,
}: {
    order: ImagingOrderDetail;
    patientName: string;
    canSign: boolean;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [findings, setFindings] = useState(order.findings ?? '');
    const [conclusion, setConclusion] = useState(order.conclusion ?? '');
    const [cancelling, setCancelling] = useState(false);
    const post = (url: string, data = {}) =>
        router.post(url, data, { preserveScroll: true });
    const report = { findings, conclusion };
    const done = order.status === 'listo' || order.status === 'entregado';

    return (
        <section className="overflow-hidden rounded-[14px] border border-card-border bg-white">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-divider px-5 py-4">
                <div>
                    <div className="font-serif text-[18px] font-semibold text-text-heading">
                        {order.name}
                    </div>
                    <div className="text-[13px] text-muted">
                        {patientName} · {order.modality} ·{' '}
                        <span className="font-mono">{order.number}</span>
                    </div>
                </div>
                <ImgStatusPill status={order.status} />
            </div>
            <dl className="m-0 grid gap-x-6 gap-y-2 border-b border-divider px-5 py-3 text-[13px] sm:grid-cols-3">
                {[
                    ['Ordenado por', order.doctor ?? '—'],
                    ['Origen', `${order.origin} · ${order.ordered_at}`],
                    ['Indicación clínica', order.indication ?? '—'],
                ].map(([k, v]) => (
                    <div key={k}>
                        <dt className="text-muted">{k}</dt>
                        <dd className="m-0 font-medium">{v}</dd>
                    </div>
                ))}
            </dl>

            {order.status === 'cancelada' ? (
                <p className="m-0 px-5 py-4 text-[14px] text-text-secondary">
                    Orden cancelada: {order.cancel_reason}
                </p>
            ) : order.status === 'ordenada' ? (
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <p className="m-0 text-[13.5px] text-text-secondary">
                        Al registrar el estudio como realizado se carga a la
                        cuenta del paciente y se puede redactar el informe.
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            className={secondary}
                            onClick={() => setCancelling(true)}
                        >
                            <XCircle className="h-4 w-4" />
                            Cancelar orden
                        </button>
                        <button
                            type="button"
                            className={primary}
                            onClick={() => post(orders.perform.url(order.id))}
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            Estudio realizado
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-3 px-5 py-4">
                    {(errors.order || errors.report) && (
                        <p className="m-0 text-[13px] text-error">
                            {errors.order ?? errors.report}
                        </p>
                    )}
                    <label className="flex flex-col gap-1.5">
                        <span className="text-[13px] font-medium">
                            Hallazgos
                        </span>
                        <textarea
                            rows={7}
                            value={findings}
                            onChange={(e) => setFindings(e.target.value)}
                            readOnly={!order.editable}
                            placeholder="Describe técnica y hallazgos del estudio…"
                            className={area}
                        />
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="text-[13px] font-medium">
                            Conclusión
                        </span>
                        <textarea
                            rows={2}
                            value={conclusion}
                            onChange={(e) => setConclusion(e.target.value)}
                            readOnly={!order.editable}
                            placeholder="Impresión diagnóstica"
                            className={area}
                        />
                    </label>
                    <AttachmentsField
                        orderId={order.id}
                        files={order.attachments}
                        editable={order.editable}
                    />
                </div>
            )}

            {order.status !== 'ordenada' && order.status !== 'cancelada' && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-divider bg-list-row-bg px-5 py-3">
                    <span className="text-[13px] text-text-secondary">
                        {done
                            ? `Firmado por ${order.signed_by} · ${order.signed_at}`
                            : canSign
                              ? 'Al firmar, el informe se envía al médico y ya no se modifica.'
                              : 'Firma el área de Imágenes.'}
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {order.editable && (
                            <>
                                <button
                                    type="button"
                                    className={secondary}
                                    onClick={() =>
                                        post(
                                            orders.report.url(order.id),
                                            report,
                                        )
                                    }
                                >
                                    Guardar borrador
                                </button>
                                {canSign && (
                                    <button
                                        type="button"
                                        className={primary}
                                        disabled={
                                            !findings.trim() ||
                                            !conclusion.trim()
                                        }
                                        onClick={() =>
                                            post(
                                                orders.sign.url(order.id),
                                                report,
                                            )
                                        }
                                    >
                                        <Send className="h-4 w-4" />
                                        Firmar y enviar
                                    </button>
                                )}
                            </>
                        )}
                        {done && (
                            <a
                                href={orders.print.url(order.id)}
                                target="_blank"
                                rel="noreferrer"
                                className={secondary}
                            >
                                <Printer className="h-4 w-4" />
                                Imprimir informe
                            </a>
                        )}
                        {order.status === 'listo' && (
                            <button
                                type="button"
                                className={primary}
                                onClick={() =>
                                    post(orders.deliver.url(order.id))
                                }
                            >
                                <Package className="h-4 w-4" />
                                Marcar como entregado
                            </button>
                        )}
                    </div>
                </div>
            )}
            {cancelling && (
                <CancelLabOrderDialog
                    order={order}
                    description={order.name}
                    url={orders.cancel.url(order.id)}
                    onClose={() => setCancelling(false)}
                />
            )}
        </section>
    );
}
