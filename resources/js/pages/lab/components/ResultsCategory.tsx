import React from 'react';
import { cn } from '@/lib/utils';
import type { LabResultRow } from '../types';

const th =
    'h-10 border-b border-accent-tip-border bg-table-header-bg px-3 text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase';
const td = 'border-b border-divider p-3 align-middle';

/** One table per category: Código · Análisis · Valores de referencia · Resultado */
export default function ResultsCategory({
    category,
    tests,
    results,
    values,
    editable,
    onChange,
}: {
    category: string;
    tests: string[];
    results: LabResultRow[];
    values: Record<number, string>;
    editable: boolean;
    onChange: (id: number, value: string) => void;
}) {
    return (
        <section className="overflow-x-auto rounded-[14px] border border-card-border bg-white">
            <div className="border-b border-divider px-5 py-[14px]">
                <h2 className="m-0 font-serif text-[16px] font-semibold text-text-heading">
                    {category}
                </h2>
                <div className="text-[13px] text-muted">
                    {tests.join(' · ')}
                </div>
            </div>
            <table className="w-full min-w-[640px] border-collapse text-[14px]">
                <thead>
                    <tr>
                        <th className={`${th} pl-5 text-left`}>Código</th>
                        <th className={`${th} text-left`}>Análisis</th>
                        <th className={`${th} text-left`}>
                            Valores de referencia
                        </th>
                        <th className={`${th} w-[180px] text-left`}>
                            Resultado
                        </th>
                        <th className={`${th} pr-5`}>
                            <span className="sr-only">Marca</span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {results.map((r) => (
                        <tr key={r.id}>
                            <td
                                className={`${td} pl-5 font-mono text-[12.5px] text-muted`}
                            >
                                {r.code}
                            </td>
                            <td className={`${td} font-medium`}>{r.name}</td>
                            <td className={`${td} text-text-secondary`}>
                                {r.reference}
                            </td>
                            <td className={td}>
                                <input
                                    aria-label={`Resultado de ${r.name}`}
                                    value={values[r.id] ?? ''}
                                    readOnly={!editable}
                                    placeholder="—"
                                    onChange={(e) =>
                                        onChange(r.id, e.target.value)
                                    }
                                    className={cn(
                                        'h-9 w-full rounded-lg border px-2 font-semibold tabular-nums outline-none focus:border-primary',
                                        r.out_of_range
                                            ? 'border-error-border bg-error-bg text-error'
                                            : editable
                                              ? 'border-input-border bg-white'
                                              : 'border-input-border bg-list-row-bg',
                                    )}
                                />
                            </td>
                            <td
                                className={`${td} pr-5 text-[12px] font-semibold text-error`}
                            >
                                {r.out_of_range ? 'Fuera de rango' : ''}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}
