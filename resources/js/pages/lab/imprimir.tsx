import React from 'react';
import PrintablePage from '@/components/cemerog/PrintablePage';
import { ageLabel } from '@/lib/patient';
import type { LabDetail } from './types';

type Clinic = {
    name: string | null;
    phone: string | null;
    address: string | null;
};

function Header({
    order,
    clinic,
    title,
}: {
    order: LabDetail;
    clinic: Clinic;
    title: string;
}) {
    const p = order.patient;
    return (
        <>
            <div className="mb-4 flex items-start justify-between border-b border-divider pb-4">
                <div>
                    <div className="font-serif text-[22px] font-bold text-primary">
                        {clinic.name ?? 'CEMEROG'}
                    </div>
                    <div className="text-[12.5px] text-text-dim">
                        Dres. Rodríguez &amp; Guzmán
                    </div>
                    {clinic.phone && (
                        <div className="text-[12px] text-muted">
                            Tel: {clinic.phone}
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <div className="font-serif text-[18px] font-bold tracking-[.04em]">
                        {title}
                    </div>
                    <div className="font-mono text-[12.5px]">
                        {order.number}
                    </div>
                </div>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-1 text-[13px]">
                <div>
                    <span className="text-muted">Paciente: </span>
                    <strong>{p.full_name}</strong>
                </div>
                <div>
                    <span className="text-muted">Edad / sexo: </span>
                    {ageLabel(p.age)} ·{' '}
                    {p.sex === 'F' ? 'Femenino' : 'Masculino'}
                </div>
                <div>
                    <span className="text-muted">Médico: </span>
                    {order.doctor ?? '—'}
                </div>
                <div>
                    <span className="text-muted">Fecha: </span>
                    {order.sample_at ?? order.ordered_at}
                </div>
            </div>
        </>
    );
}

/** Indicación (before validation) or Resultado de laboratorio, one page per category */
export default function LabImprimir({
    order,
    clinic,
}: {
    order: LabDetail;
    clinic: Clinic;
}) {
    const done = order.status === 'validada' || order.status === 'entregada';

    return (
        <>
            <style>{`@media print { body > *:not(#app) { display: none !important; } #app > *:not(.printable-root) { display: none !important; } .page-break { break-after: page; } }`}</style>
            <div className="printable-root min-h-screen bg-surface py-8 print:bg-white print:p-0 print:py-0">
                {done ? (
                    order.categories.map((c) => (
                        <div key={c.category} className="page-break mb-6">
                            <PrintablePage showHeader={false}>
                                <Header
                                    order={order}
                                    clinic={clinic}
                                    title="RESULTADO DE LABORATORIO"
                                />
                                <h2 className="mb-2 font-serif text-[16px] font-semibold">
                                    {c.category}
                                </h2>
                                <table className="w-full border-collapse text-[13px]">
                                    <thead>
                                        <tr className="border-b border-divider text-left text-[11.5px] text-muted uppercase">
                                            <th className="py-1.5">Análisis</th>
                                            <th className="py-1.5">
                                                Resultado
                                            </th>
                                            <th className="py-1.5">
                                                Valores de referencia
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {c.results.map((r) => (
                                            <tr
                                                key={r.id}
                                                className="border-b border-divider"
                                            >
                                                <td className="py-1.5">
                                                    {r.name}
                                                </td>
                                                <td
                                                    className={`py-1.5 font-semibold ${r.out_of_range ? 'text-error' : ''}`}
                                                >
                                                    {r.value}{' '}
                                                    {r.out_of_range && '*'}
                                                </td>
                                                <td className="py-1.5 text-text-secondary">
                                                    {r.reference}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <p className="mt-2 text-[11.5px] text-muted">
                                    * Valor fuera del rango de referencia.
                                </p>
                                <p className="mt-10 text-center text-[12px]">
                                    ________________________________
                                    <br />
                                    Validado por {order.validated_by} ·{' '}
                                    {order.validated_at}
                                </p>
                            </PrintablePage>
                        </div>
                    ))
                ) : (
                    <PrintablePage showHeader={false}>
                        <Header
                            order={order}
                            clinic={clinic}
                            title="INDICACIÓN DE LABORATORIO"
                        />
                        <h2 className="mb-2 font-serif text-[16px] font-semibold">
                            Análisis indicados
                        </h2>
                        <ul className="mb-4 list-disc pl-5 text-[13.5px]">
                            {order.tests.map((t) => (
                                <li key={t}>{t}</li>
                            ))}
                        </ul>
                        {order.indication && (
                            <p className="mb-3 text-[13px]">
                                <strong>Indicación clínica:</strong>{' '}
                                {order.indication}
                            </p>
                        )}
                        {order.preparations.length > 0 && (
                            <p className="text-[13px]">
                                <strong>Preparación:</strong>{' '}
                                {order.preparations.join(' ')}
                            </p>
                        )}
                    </PrintablePage>
                )}
            </div>
        </>
    );
}
