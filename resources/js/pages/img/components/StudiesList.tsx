import React from 'react';
import { Link } from '@inertiajs/react';
import { ScanLine } from 'lucide-react';
import ImgStatusPill from '@/components/img/ImgStatusPill';
import { isImagingPending } from '@/components/img/types';
import type { ImagingOrderSummary } from '@/components/img/types';
import { cn } from '@/lib/utils';
import * as orders from '@/routes/img/orders';

/** «Estudios del paciente»: every study, the selected one highlighted */
export default function StudiesList({
    studies,
    selectedId,
}: {
    studies: ImagingOrderSummary[];
    selectedId: number;
}) {
    return (
        <section className="overflow-hidden rounded-[14px] border border-card-border bg-white">
            <h2 className="m-0 border-b border-divider px-[18px] py-[14px] font-serif text-[15px] font-semibold text-text-heading">
                Estudios del paciente
            </h2>
            {studies.map((o) => {
                const selected = o.id === selectedId;
                return (
                    <Link
                        key={o.id}
                        href={orders.show.url(o.id)}
                        preserveScroll
                        aria-current={selected}
                        className={cn(
                            'flex items-start gap-3 border-b border-divider px-[18px] py-3 last:border-b-0 hover:bg-list-row-bg',
                            selected &&
                                'bg-accent-bg shadow-[inset_3px_0_0_var(--color-primary)]',
                        )}
                    >
                        <span
                            className={cn(
                                'inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg',
                                isImagingPending(o.status)
                                    ? 'state-espera bg-[var(--state-bg)] text-[var(--state-text)]'
                                    : 'bg-accent-bg text-primary',
                            )}
                        >
                            <ScanLine className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="font-medium text-text-heading">
                                {o.name}
                            </div>
                            <div className="text-[12.5px] text-muted">
                                {o.ordered_date} · {o.origin}
                            </div>
                            <div className="text-[12px] text-text-tertiary">
                                <span className="font-mono">{o.number}</span> ·{' '}
                                {o.files_count === 0
                                    ? 'Sin imágenes'
                                    : `${o.files_count} ${o.files_count === 1 ? 'archivo' : 'archivos'}`}
                            </div>
                        </div>
                        <ImgStatusPill status={o.status} />
                    </Link>
                );
            })}
        </section>
    );
}
