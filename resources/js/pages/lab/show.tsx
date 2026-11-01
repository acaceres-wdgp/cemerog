import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import type { RequestPayload } from '@inertiajs/core';
import {
    Check,
    CheckCircle2,
    ChevronLeft,
    Package,
    Printer,
    TestTube,
} from 'lucide-react';
import CancelLabOrderDialog from '@/components/lab/CancelLabOrderDialog';
import LabStatusPill from '@/components/lab/LabStatusPill';
import { ageLabel } from '@/lib/patient';
import { lab } from '@/routes';
import * as orders from '@/routes/lab/orders';
import ResultsCategory from './components/ResultsCategory';
import type { LabDetail } from './types';

const secondary =
    'inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-secondary-border bg-secondary-bg px-[14px] font-medium whitespace-nowrap text-text-body hover:bg-accent-bg';
const primary =
    'inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] bg-primary px-[14px] font-medium whitespace-nowrap text-white hover:bg-primary-hover disabled:bg-primary-disabled';

/** Ingreso de resultados de una orden */
export default function LabShow({ order }: { order: LabDetail }) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const all = order.categories.flatMap((c) => c.results);
    const [values, setValues] = useState<Record<number, string>>(() =>
        Object.fromEntries(all.map((r) => [r.id, r.value ?? ''])),
    );
    const [cancelling, setCancelling] = useState(false);
    const editable = order.status === 'muestra' || order.status === 'ingresado';
    const done = order.status === 'validada' || order.status === 'entregada';
    const outOfRange = all.filter((r) => r.out_of_range).length;
    const empty = all.filter((r) => (values[r.id] ?? '').trim() === '').length;
    const post = (url: string, data: RequestPayload = {}) =>
        router.post(url, data, { preserveScroll: true });
    const p = order.patient;

    return (
        <div className="flex flex-col gap-4">
            <Link
                href={lab.url()}
                className="inline-flex items-center gap-1 self-start text-[14px] text-text-secondary hover:text-primary"
            >
                <ChevronLeft className="h-4 w-4" />
                Cola de órdenes
            </Link>
            <section className="flex flex-wrap items-start justify-between gap-4 rounded-[14px] border border-card-border bg-white px-5 py-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">
                            {order.number}
                        </span>
                        <LabStatusPill status={order.status} />
                    </div>
                    <div className="font-serif text-[20px] font-semibold text-text-heading">
                        {p.full_name}
                    </div>
                    <div className="text-[13px] text-muted">
                        {[
                            ageLabel(p.age),
                            p.sex === 'F' ? 'Femenino' : 'Masculino',
                            p.document_number,
                        ]
                            .filter(Boolean)
                            .join(' · ')}
                    </div>
                </div>
                <dl className="m-0 grid grid-cols-2 gap-x-8 gap-y-1 text-[13px] sm:grid-cols-4">
                    {[
                        ['Médico', order.doctor ?? '—'],
                        ['Origen', order.origin],
                        ['Ordenada', order.ordered_at],
                        ['Muestra', order.sample_at ?? 'Pendiente'],
                    ].map(([k, v]) => (
                        <div key={k}>
                            <dt className="text-muted">{k}</dt>
                            <dd className="m-0 font-medium">{v}</dd>
                        </div>
                    ))}
                </dl>
            </section>
            {order.indication && (
                <p className="m-0 text-[13.5px] text-text-secondary">
                    <strong>Indicación clínica:</strong> {order.indication}
                </p>
            )}
            {order.status === 'ordenada' && (
                <div className="state-espera flex flex-wrap items-center gap-3 rounded-xl border border-[var(--state-accent)] bg-[var(--state-bg)] px-4 py-3 text-[var(--state-text)]">
                    <TestTube className="h-[18px] w-[18px]" />
                    <span className="min-w-[200px] flex-1">
                        La muestra aún no se ha tomado. Regístrala para poder
                        ingresar resultados; los análisis se cargan a la cuenta
                        del paciente.
                    </span>
                    <button
                        type="button"
                        onClick={() => setCancelling(true)}
                        className={secondary}
                    >
                        Cancelar orden
                    </button>
                    <button
                        type="button"
                        onClick={() => post(orders.sample.url(order.id))}
                        className={primary}
                    >
                        Registrar toma de muestra
                    </button>
                </div>
            )}
            {done && (
                <div className="flex items-center gap-2 rounded-xl bg-accent-bg px-4 py-3 text-accent-fg">
                    <CheckCircle2 className="h-[18px] w-[18px] text-primary" />
                    Validado por {order.validated_by} · {order.validated_at}
                    {order.status === 'entregada' && ' · Entregado al paciente'}
                </div>
            )}
            {(errors.results || errors.order) && (
                <p className="m-0 text-[13px] text-error" role="alert">
                    {errors.results ?? errors.order}
                </p>
            )}
            {order.categories.map((c) => (
                <ResultsCategory
                    key={c.category}
                    {...c}
                    values={values}
                    editable={editable}
                    onChange={(id, value) =>
                        setValues((v) => ({ ...v, [id]: value }))
                    }
                />
            ))}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-card-border bg-white px-5 py-3">
                <span className="text-[13px]">
                    {outOfRange > 0 ? (
                        <span className="font-semibold text-error">
                            {outOfRange}{' '}
                            {outOfRange === 1
                                ? 'valor fuera de rango'
                                : 'valores fuera de rango'}
                        </span>
                    ) : all.length > 0 && empty < all.length ? (
                        <span className="font-semibold text-primary">
                            Valores dentro de rango
                        </span>
                    ) : null}
                    {editable && empty > 0 && (
                        <span className="text-muted">
                            {' '}
                            · {empty}{' '}
                            {empty === 1
                                ? 'análisis sin resultado'
                                : 'análisis sin resultado'}
                        </span>
                    )}
                </span>
                <div className="flex flex-wrap gap-2">
                    <a
                        href={orders.print.url(order.id)}
                        target="_blank"
                        rel="noreferrer"
                        className={secondary}
                    >
                        <Printer className="h-4 w-4" />
                        {done ? 'Imprimir resultado' : 'Indicación'}
                    </a>
                    {editable && (
                        <button
                            type="button"
                            onClick={() =>
                                post(orders.results.url(order.id), {
                                    results: values,
                                })
                            }
                            className={secondary}
                        >
                            Guardar resultados
                        </button>
                    )}
                    {editable && order.can_validate && (
                        <button
                            type="button"
                            disabled={empty > 0}
                            onClick={() =>
                                post(orders.validate.url(order.id), {
                                    results: values,
                                })
                            }
                            className={primary}
                        >
                            <Check className="h-4 w-4" />
                            Validar
                        </button>
                    )}
                    {order.status === 'validada' && (
                        <button
                            type="button"
                            onClick={() => post(orders.deliver.url(order.id))}
                            className={primary}
                        >
                            <Package className="h-4 w-4" />
                            Marcar como entregado
                        </button>
                    )}
                </div>
            </div>
            {cancelling && (
                <CancelLabOrderDialog
                    order={order}
                    onClose={() => setCancelling(false)}
                />
            )}
        </div>
    );
}
