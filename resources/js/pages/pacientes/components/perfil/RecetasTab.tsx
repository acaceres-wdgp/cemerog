import React from 'react';
import { Printer } from 'lucide-react';
import EmptyState from '@/components/cemerog/EmptyState';
import consulta from '@/routes/consulta';
import { buildInstruction } from '@/pages/consulta/lib/instructionBuilder';
import type { ProfilePrescription } from './types';

export default function RecetasTab({
    recetas,
    canPrint,
}: {
    recetas: ProfilePrescription[];
    canPrint: boolean;
}) {
    if (recetas.length === 0) {
        return (
            <div className="rounded-2xl border border-card-border bg-white py-6">
                <EmptyState
                    title="Sin recetas"
                    description="Las recetas que se emitan en Consulta aparecerán aquí."
                />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {recetas.map((r) => (
                <article
                    key={r.id}
                    className="flex flex-col gap-3 rounded-2xl border border-card-border bg-white px-5 py-4"
                >
                    <header className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-[12px] text-muted tabular-nums">
                                {r.date} · Receta #{r.id}
                            </p>
                            <p className="text-[13.5px] font-semibold text-text-heading">
                                {r.doctor}
                            </p>
                            <p className="text-[12px] text-muted">
                                {r.specialty}
                            </p>
                        </div>
                        {canPrint && (
                            <a
                                href={consulta.receta.print.url(r.id)}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Reimprimir receta ${r.id}`}
                                className="inline-flex h-8 items-center gap-1 rounded-lg border border-card-border bg-white px-3 text-[12.5px] font-medium text-text-body hover:bg-app-bg"
                            >
                                <Printer className="h-3.5 w-3.5" />
                                Reimprimir
                            </a>
                        )}
                    </header>
                    {r.diagnostico && (
                        <p className="text-[13px] text-text-body">
                            <span className="text-muted">Diagnóstico: </span>
                            {r.diagnostico}
                        </p>
                    )}
                    <ol className="m-0 flex list-decimal flex-col gap-2 pl-5 text-[13px]">
                        {r.items.map((item) => (
                            <li key={item.id}>
                                <span className="font-semibold text-text-heading">
                                    {item.medication}
                                </span>
                                <span className="text-muted">
                                    {' '}
                                    · Cant.: {item.quantity}
                                </span>
                                <div className="text-text-body">
                                    {buildInstruction(item)}
                                </div>
                            </li>
                        ))}
                    </ol>
                    {r.general_instructions && (
                        <p className="text-[12.5px] text-muted">
                            {r.general_instructions}
                        </p>
                    )}
                </article>
            ))}
        </div>
    );
}
