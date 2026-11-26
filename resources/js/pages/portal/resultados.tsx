import React from 'react';
import { Link } from '@inertiajs/react';
import { Download, Eye, FlaskConical, Info, ScanLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import portal from '@/routes/portal';
import study from '@/routes/portal/study';
import type { PortalPatient, PortalStudySummary } from './types';

const GROUPS = [
    { kind: 'lab', title: 'Laboratorio', icon: FlaskConical },
    { kind: 'img', title: 'Imágenes', icon: ScanLine },
] as const;

const button =
    'inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-secondary-border px-[14px] font-medium text-text-heading';

/** Results portal › the studies of the code: ready ones can be seen and downloaded */
export default function PortalResultados({
    patient,
    studies,
}: {
    patient: PortalPatient;
    studies: PortalStudySummary[];
}) {
    const ready = studies.filter((s) => s.ready).length;

    return (
        <div className="flex flex-col gap-[18px]">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="m-0 text-secondary-fg">Hola,</p>
                    <h1 className="m-0 font-serif text-[24px] font-semibold text-text-heading">
                        {patient.name}
                    </h1>
                    <p className="mt-0.5 mb-0 text-[14px] text-secondary-fg">
                        Atención del {patient.service_date}
                        {patient.invoice && ` · Factura ${patient.invoice}`}
                    </p>
                </div>
                {ready > 0 && (
                    <a
                        href={portal.all.url()}
                        className="inline-flex h-[42px] items-center gap-2 rounded-[11px] bg-primary px-4 font-semibold text-white shadow-sm hover:bg-primary-hover"
                    >
                        <Download aria-hidden className="h-[17px] w-[17px]" />
                        Descargar todos ({ready})
                    </a>
                )}
            </div>

            <div className="flex items-start gap-[10px] rounded-xl border border-success-border bg-accent-bg px-[14px] py-[11px] text-[14px] text-accent-fg">
                <Info
                    aria-hidden
                    className="mt-0.5 h-[17px] w-[17px] flex-none"
                />
                <span>
                    {ready} de {studies.length}{' '}
                    {studies.length === 1 ? 'resultado' : 'resultados'}{' '}
                    {ready === 1 ? 'está listo' : 'están listos'}. Tu código
                    sirve hasta el <b>{patient.expires_on}</b>. Por seguridad,
                    la sesión se cierra tras 15 minutos sin uso.
                </span>
            </div>

            {GROUPS.map((g) => {
                const items = studies.filter((s) => s.kind === g.kind);
                if (items.length === 0) return null;
                return (
                    <section
                        key={g.kind}
                        aria-label={g.title}
                        className="flex flex-col gap-[10px]"
                    >
                        <h2 className="mt-1.5 mb-0 flex items-center gap-2 text-[13px] font-semibold tracking-[.05em] text-table-header-text uppercase">
                            <g.icon aria-hidden className="h-4 w-4" />
                            {g.title}
                        </h2>
                        {items.map((s) => (
                            <article
                                key={s.key}
                                className="flex flex-wrap items-center gap-[14px] rounded-[14px] border border-card-border bg-white px-4 py-[14px]"
                            >
                                <div className="min-w-0 flex-[1_1_260px]">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="m-0 text-[16px] font-semibold text-text-heading">
                                            {s.name}
                                        </h3>
                                        <span
                                            className={cn(
                                                'inline-flex items-center gap-[5px] rounded-full px-[9px] py-0.5 text-[12px] font-medium whitespace-nowrap',
                                                s.ready
                                                    ? 'bg-accent-bg text-accent-fg'
                                                    : 'state-espera bg-[var(--state-bg)] text-[var(--state-text)]',
                                            )}
                                        >
                                            <span
                                                aria-hidden
                                                className={cn(
                                                    'h-1.5 w-1.5 rounded-full',
                                                    s.ready
                                                        ? 'bg-primary'
                                                        : 'bg-[var(--state-accent)]',
                                                )}
                                            />
                                            {s.ready ? 'Listo' : 'En proceso'}
                                        </span>
                                    </div>
                                    <div className="mt-0.5 text-[13.5px] text-secondary-fg">
                                        {s.detail}
                                    </div>
                                </div>
                                {s.ready && (
                                    <div className="flex flex-none gap-2">
                                        <Link
                                            href={portal.study.url(s.key)}
                                            className={cn(
                                                button,
                                                'bg-secondary-bg',
                                            )}
                                        >
                                            <Eye
                                                aria-hidden
                                                className="h-4 w-4"
                                            />
                                            Ver
                                        </Link>
                                        <a
                                            href={study.pdf.url(s.key)}
                                            aria-label={`Descargar PDF de ${s.name}`}
                                            className={cn(button, 'bg-white')}
                                        >
                                            <Download
                                                aria-hidden
                                                className="h-4 w-4"
                                            />
                                            PDF
                                        </a>
                                    </div>
                                )}
                            </article>
                        ))}
                    </section>
                );
            })}

            <p className="mt-1.5 mb-0 text-[13px] text-text-secondary">
                Estos resultados deben ser interpretados por tu médico. Si
                tienes dudas, agenda una cita con la clínica.
            </p>
        </div>
    );
}
