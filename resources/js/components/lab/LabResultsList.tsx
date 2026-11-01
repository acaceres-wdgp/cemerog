import React from 'react';
import { cn } from '@/lib/utils';
import type { LabResultLine } from './types';

/** Validated results, compact: name · value · reference, out of range in red */
export default function LabResultsList({
    results,
}: {
    results: LabResultLine[];
}) {
    return (
        <table className="w-full border-collapse text-[13px]">
            <tbody>
                {results.map((r, i) => (
                    <tr
                        key={`${r.test}-${r.name}-${i}`}
                        className="border-b border-divider last:border-b-0"
                    >
                        <td className="py-1 pr-2">{r.name}</td>
                        <td
                            className={cn(
                                'py-1 pr-2 font-semibold tabular-nums',
                                r.out_of_range && 'text-error',
                            )}
                        >
                            {r.value ?? '—'}
                            {r.out_of_range && ' *'}
                        </td>
                        <td className="py-1 text-right text-[12px] text-muted">
                            {r.reference}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
