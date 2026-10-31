import React from 'react';
import { router } from '@inertiajs/react';
import SegmentedControl from '@/components/cemerog/SegmentedControl';
import { cn } from '@/lib/utils';
import { cuadre } from '@/routes';
import type { CashShiftView, ShiftOption } from '../types';

const CURRENT = 'actual';

function StatusPill({ shift }: { shift: CashShiftView }) {
    const [label, cls, dot] =
        shift.status === 'cerrado'
            ? ['Cerrado', 'bg-muted-bg text-text-secondary', 'bg-muted-light']
            : shift.pending_close
              ? [
                    'Pendiente de cierre',
                    'state-emergencia bg-[var(--state-bg)] text-[var(--state-text)]',
                    'bg-[var(--state-accent)]',
                ]
              : ['Abierto', 'bg-accent-bg text-accent-fg', 'bg-primary'];

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-[10px] py-[3px] text-[12px] font-medium whitespace-nowrap',
                cls,
            )}
        >
            <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
            {label}
        </span>
    );
}

/** Cajero · Turno picker and the shift status, as in the design */
export default function ShiftHeader({
    shift,
    shifts,
}: {
    shift: CashShiftView | null;
    shifts: ShiftOption[];
}) {
    const hasOpen = shifts.some((s) => s.status === 'abierto');
    const segments = [
        ...(hasOpen ? [] : [{ value: CURRENT, label: 'Hoy · Sin abrir' }]),
        ...shifts.map((s) => ({ value: String(s.id), label: s.label })),
    ];
    const value = shift ? String(shift.id) : CURRENT;

    const pick = (next: string) => {
        const option = shifts.find((s) => String(s.id) === next);
        router.get(
            !option || option.status === 'abierto'
                ? cuadre.url()
                : cuadre.url({ query: { turno: option.id } }),
            {},
            { preserveScroll: true },
        );
    };

    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
                {shift && (
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] text-muted">Cajero</span>
                        <span className="inline-flex rounded-[11px] border border-card-border bg-app-bg p-[3px]">
                            <span className="inline-flex h-[30px] items-center rounded-[10px] bg-white px-3 font-medium text-text-heading shadow-[0_1px_2px_rgba(0,0,0,.08)]">
                                {shift.opened_by}
                            </span>
                        </span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <span className="text-[13px] text-muted">Turno</span>
                    <SegmentedControl
                        segments={segments}
                        value={value}
                        onChange={pick}
                    />
                </div>
            </div>
            {shift && <StatusPill shift={shift} />}
        </div>
    );
}
