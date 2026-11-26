import React from 'react';
import { Link } from '@inertiajs/react';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import type { ClinicInfo } from '@/components/cemerog/ClinicHeader';
import { cn } from '@/lib/utils';
import portal from '@/routes/portal';
import study from '@/routes/portal/study';
import type { PortalPatient, PortalStudyDetail } from './types';

const th =
    'bg-table-header-bg px-[10px] py-2 text-[12px] font-semibold tracking-[.04em] text-table-header-text uppercase border-b border-success-border';
const td = 'border-b border-divider px-[10px] py-2';

/** Results portal › viewer of a ready study (lab table or imaging report) */
export default function PortalEstudio({
    patient,
    study: s,
    clinic,
}: {
    patient: PortalPatient;
    study: PortalStudyDetail;
    clinic?: ClinicInfo;
}) {
    return (
        <div className="-mx-5 -mt-6 -mb-10 flex flex-col bg-surface print:m-0 print:bg-white">
            <div className="border-b border-card-border bg-white print:hidden">
                <div className="mx-auto flex max-w-[880px] items-center justify-between gap-[10px] px-4 py-[10px]">
                    <Link
                        href={portal.results.url()}
                        className="inline-flex h-10 items-center gap-1.5 rounded-[10px] px-2 font-medium whitespace-nowrap text-text-heading"
                    >
                        <ArrowLeft aria-hidden className="h-[18px] w-[18px]" />
                        Mis resultados
                    </Link>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            aria-label="Imprimir"
                            onClick={() => window.print()}
                            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-[10px] border border-secondary-border bg-secondary-bg"
                        >
                            <Printer
                                aria-hidden
                                className="h-[17px] w-[17px]"
                            />
                        </button>
                        <a
                            href={study.pdf.url(s.key)}
                            aria-label="Descargar PDF"
                            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-primary px-[14px] font-semibold whitespace-nowrap text-white hover:bg-primary-hover"
                        >
                            <Download aria-hidden className="h-4 w-4" />
                            <span className="max-sm:hidden">Descargar</span> PDF
                        </a>
                    </div>
                </div>
            </div>
            <div className="px-3 pt-5 pb-10 print:p-0">
                <article className="mx-auto flex max-w-[760px] flex-col gap-[18px] rounded-md bg-white px-[30px] py-8 shadow-[0_8px_30px_-12px_rgba(16,40,24,.25)] max-sm:px-4 max-sm:py-5 print:shadow-none">
                    <div className="flex flex-wrap justify-between gap-4 border-b-2 border-primary pb-[14px]">
                        <div>
                            <div className="font-serif text-[18px] font-bold text-text-heading">
                                {clinic?.name}
                            </div>
                            <div className="text-[12.5px] text-secondary-fg">
                                {[
                                    s.department,
                                    clinic?.address,
                                    clinic?.phone && `Tel. ${clinic.phone}`,
                                ]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </div>
                        </div>
                        <div className="text-right text-[12.5px] text-secondary-fg">
                            <div className="font-semibold text-text-heading">
                                {s.name}
                            </div>
                            <div>
                                Atención del {patient.service_date}
                                {patient.invoice && ` · ${patient.invoice}`}
                            </div>
                        </div>
                    </div>
                    <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-[18px] gap-y-1.5 text-[13.5px]">
                        {[
                            ['Paciente', patient.name, true],
                            ['Edad / sexo', patient.age_sex || '—', false],
                            [s.taken_label, s.taken, false],
                            ['Médico', s.doctor ?? '—', false],
                        ].map(([label, value, strong]) => (
                            <div key={String(label)}>
                                <dt className="inline text-secondary-fg">
                                    {label}:{' '}
                                </dt>
                                <dd
                                    className={cn(
                                        'm-0 inline',
                                        strong && 'font-semibold',
                                    )}
                                >
                                    {value}
                                </dd>
                            </div>
                        ))}
                    </dl>

                    {s.kind === 'lab' ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[520px] border-collapse text-[14px]">
                                    <thead>
                                        <tr>
                                            <th
                                                scope="col"
                                                className={cn(th, 'text-left')}
                                            >
                                                Prueba
                                            </th>
                                            <th
                                                scope="col"
                                                className={cn(th, 'text-right')}
                                            >
                                                Resultado
                                            </th>
                                            <th
                                                scope="col"
                                                className={cn(th, 'text-left')}
                                            >
                                                Unidad
                                            </th>
                                            <th
                                                scope="col"
                                                className={cn(th, 'text-left')}
                                            >
                                                Valores de referencia
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {s.rows?.map((r) => (
                                            <tr key={r.test}>
                                                <td className={td}>{r.test}</td>
                                                <td
                                                    className={cn(
                                                        td,
                                                        'text-right whitespace-nowrap tabular-nums',
                                                        r.flag
                                                            ? 'state-espera font-bold text-[var(--state-text)]'
                                                            : 'font-medium text-text-heading',
                                                    )}
                                                >
                                                    {r.value}{' '}
                                                    <span className="text-[11.5px]">
                                                        {r.flag}
                                                    </span>
                                                </td>
                                                <td
                                                    className={cn(
                                                        td,
                                                        'text-secondary-fg',
                                                    )}
                                                >
                                                    {r.unit}
                                                </td>
                                                <td
                                                    className={cn(
                                                        td,
                                                        'text-secondary-fg tabular-nums',
                                                    )}
                                                >
                                                    {r.reference}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="m-0 text-[12.5px] text-secondary-fg">
                                Los valores marcados con{' '}
                                <b className="state-espera text-[var(--state-text)]">
                                    A
                                </b>{' '}
                                (alto) o{' '}
                                <b className="state-espera text-[var(--state-text)]">
                                    B
                                </b>{' '}
                                (bajo) están fuera del rango de referencia.
                            </p>
                        </>
                    ) : (
                        <>
                            {(s.images?.length ?? 0) > 0 && (
                                <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[10px]">
                                    {s.images?.map((im) => (
                                        <figure
                                            key={im.n}
                                            className="m-0 flex flex-col gap-1.5"
                                        >
                                            <img
                                                src={study.image.url({
                                                    item: s.key,
                                                    n: im.n,
                                                })}
                                                alt={im.name}
                                                className="aspect-[4/5] w-full rounded-lg bg-text-heading object-contain"
                                            />
                                            <figcaption className="flex items-center justify-between text-[12.5px] text-secondary-fg">
                                                <span className="truncate">
                                                    {im.name}
                                                </span>
                                                <a
                                                    href={study.image.url({
                                                        item: s.key,
                                                        n: im.n,
                                                    })}
                                                    aria-label={`Descargar ${im.name}`}
                                                    className="p-0.5 font-medium text-primary underline"
                                                >
                                                    JPG
                                                </a>
                                            </figcaption>
                                        </figure>
                                    ))}
                                </div>
                            )}
                            <div className="flex flex-col gap-[10px] text-[14.5px]">
                                <div>
                                    <h3 className="mt-0 mb-1 text-[13px] tracking-[.04em] text-table-header-text uppercase">
                                        Hallazgos
                                    </h3>
                                    <p className="m-0 whitespace-pre-line">
                                        {s.findings}
                                    </p>
                                </div>
                                <div className="border-l-[3px] border-primary bg-table-header-bg px-3 py-[10px]">
                                    <h3 className="mt-0 mb-1 text-[13px] tracking-[.04em] text-table-header-text uppercase">
                                        Impresión diagnóstica
                                    </h3>
                                    <p className="m-0 font-medium whitespace-pre-line text-text-heading">
                                        {s.conclusion}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="flex flex-wrap justify-between gap-4 border-t border-divider pt-[14px] text-[12.5px] text-secondary-fg">
                        <span>
                            Validado por{' '}
                            <b className="text-text-heading">
                                {s.validated_by ?? '—'}
                            </b>{' '}
                            · {s.validated_at}
                        </span>
                        <span className="font-mono">
                            Verificación: {s.verification}
                        </span>
                    </div>
                </article>
            </div>
        </div>
    );
}
