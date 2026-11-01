import React from 'react';
import { SURGERY_STATUS } from '@/components/cirugia/types';
import { cn } from '@/lib/utils';
import type { SurgeryBlock } from '../types';

const FIRST = 7;
const LAST = 18;
const ROW = 56;
const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const hours = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h + m / 60;
};

/** Monday to Sunday, 07:00–18:00; each surgery is a block by status */
export default function WeekCalendar({
    days,
    today,
    surgeries,
    selectedId,
    onSelect,
}: {
    /** The seven dates, «Y-m-d» */
    days: string[];
    today: string;
    surgeries: SurgeryBlock[];
    selectedId: number | null;
    onSelect: (id: number) => void;
}) {
    const now = new Date();
    const nowHours = now.getHours() + now.getMinutes() / 60;

    return (
        <div className="overflow-x-auto rounded-[14px] border border-card-border bg-white">
            <div className="min-w-[760px]">
                <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-divider">
                    <div />
                    {days.map((d, i) => (
                        <div
                            key={d}
                            className="flex flex-col items-center py-2 text-[12px] text-muted"
                        >
                            {DAY_NAMES[i]}
                            <span
                                className={cn(
                                    'mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-[14px] font-semibold',
                                    d === today
                                        ? 'bg-primary text-white'
                                        : 'text-text-heading',
                                )}
                            >
                                {Number(d.slice(8))}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-[56px_repeat(7,1fr)]">
                    <div>
                        {Array.from({ length: LAST - FIRST }, (_, i) => (
                            <div
                                key={i}
                                className="h-14 pt-0.5 pr-2 text-right text-[11.5px] text-muted tabular-nums"
                            >
                                {String(FIRST + i).padStart(2, '0')}:00
                            </div>
                        ))}
                    </div>
                    {days.map((d, i) => (
                        <div
                            key={d}
                            className={cn(
                                'relative border-l border-divider',
                                d === today
                                    ? 'bg-list-row-bg'
                                    : i >= 5 && 'bg-app-bg/40',
                            )}
                        >
                            {Array.from({ length: LAST - FIRST }, (_, h) => (
                                <div
                                    key={h}
                                    className="h-14 border-b border-divider/60"
                                />
                            ))}
                            {d === today &&
                                nowHours >= FIRST &&
                                nowHours <= LAST && (
                                    <div
                                        className="absolute right-0 left-0 z-10 border-t-2 border-error"
                                        // dynamic-style: position of the current time
                                        style={{
                                            top: (nowHours - FIRST) * ROW,
                                        }}
                                    />
                                )}
                            {surgeries
                                .filter((s) => s.date === d)
                                .map((s) => {
                                    const start = Math.max(
                                        hours(s.start),
                                        FIRST,
                                    );
                                    const end = Math.min(
                                        hours(s.end) || LAST,
                                        LAST,
                                    );
                                    const height = Math.max(
                                        (end - start) * ROW - 4,
                                        22,
                                    );
                                    const st = SURGERY_STATUS[s.status];
                                    return (
                                        <button
                                            key={s.id}
                                            type="button"
                                            title={`${s.procedure} · ${s.patient.full_name}`}
                                            onClick={() => onSelect(s.id)}
                                            className={cn(
                                                'absolute right-1 left-1 flex cursor-pointer flex-col overflow-hidden rounded-lg border px-2 py-1 text-left text-[11.5px] leading-tight',
                                                st.cls,
                                                s.status === 'cancelada' &&
                                                    'line-through',
                                                selectedId === s.id &&
                                                    'ring-2 ring-current',
                                            )}
                                            // dynamic-style: position and height from the times
                                            style={{
                                                top: (start - FIRST) * ROW + 2,
                                                height,
                                            }}
                                        >
                                            <span className="font-medium tabular-nums">
                                                {s.start} – {s.end}
                                            </span>
                                            <span className="truncate font-semibold">
                                                {s.procedure}
                                            </span>
                                            {height >= 66 && (
                                                <span className="truncate">
                                                    {s.patient.full_name}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
