import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { SURGERY_STATUS } from '@/components/cirugia/types';
import type { SurgeryOptions, SurgeryStatus } from '@/components/cirugia/types';
import { cn } from '@/lib/utils';
import { cirugia } from '@/routes';
import ScheduleDialog from './components/ScheduleDialog';
import SurgeryPanel from './components/SurgeryPanel';
import WeekCalendar from './components/WeekCalendar';
import type { SurgeryBlock } from './types';

const MONTHS = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
];

/** «Y-m-d» plus n days, without time zones */
const addDays = (date: string, n: number) => {
    const [y, m, d] = date.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + n));
    return dt.toISOString().slice(0, 10);
};

const weekLabel = (first: string, last: string) => {
    const [y1, m1, d1] = first.split('-').map(Number);
    const [y2, m2, d2] = last.split('-').map(Number);
    return m1 === m2
        ? `${d1} – ${d2} ${MONTHS[m2 - 1]} ${y2}`
        : `${d1} ${MONTHS[m1 - 1]}${y1 !== y2 ? ` ${y1}` : ''} – ${d2} ${MONTHS[m2 - 1]} ${y2}`;
};

/** Cirugía: agenda semanal de quirófano */
export default function CirugiaIndex({
    week_start,
    today,
    surgeries = [],
    selected_id = null,
    options,
    can_schedule = false,
    can_advance = false,
}: {
    week_start: string;
    today: string;
    surgeries?: SurgeryBlock[];
    selected_id?: number | null;
    options: SurgeryOptions;
    can_schedule?: boolean;
    can_advance?: boolean;
}) {
    const [selected, setSelected] = useState<number | null>(
        selected_id ?? surgeries[0]?.id ?? null,
    );
    const [scheduling, setScheduling] = useState(false);
    // After scheduling or rescheduling the server points at that surgery
    useEffect(() => {
        if (selected_id) setSelected(selected_id);
    }, [selected_id]);
    const days = Array.from({ length: 7 }, (_, i) => addDays(week_start, i));
    const go = (semana: string) =>
        router.get(
            cirugia.url({ query: { semana } }),
            {},
            { preserveScroll: true },
        );
    const surgery = surgeries.find((s) => s.id === selected) ?? null;
    const thisWeek = today >= days[0] && today <= days[6];

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        title="Semana anterior"
                        aria-label="Semana anterior"
                        onClick={() => go(addDays(week_start, -7))}
                        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] border border-card-border bg-white hover:bg-app-bg"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        title="Semana siguiente"
                        aria-label="Semana siguiente"
                        onClick={() => go(addDays(week_start, 7))}
                        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] border border-card-border bg-white hover:bg-app-bg"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                    <span className="px-2 font-serif text-[18px] font-semibold text-text-heading">
                        {weekLabel(days[0], days[6])}
                    </span>
                    {!thisWeek && (
                        <button
                            type="button"
                            onClick={() => go(today)}
                            className="inline-flex h-9 cursor-pointer items-center rounded-[10px] border border-card-border bg-white px-3 font-medium hover:bg-app-bg"
                        >
                            Hoy
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {(Object.keys(SURGERY_STATUS) as SurgeryStatus[]).map(
                        (k) => (
                            <span
                                key={k}
                                className="inline-flex items-center gap-1.5 text-[12.5px] text-text-secondary"
                            >
                                <span
                                    className={cn(
                                        'h-2.5 w-2.5 rounded-[3px] border',
                                        SURGERY_STATUS[k].cls,
                                    )}
                                />
                                {SURGERY_STATUS[k].label}
                                <span className="text-muted">
                                    {
                                        surgeries.filter((s) => s.status === k)
                                            .length
                                    }
                                </span>
                            </span>
                        ),
                    )}
                    {can_schedule && (
                        <button
                            type="button"
                            onClick={() => setScheduling(true)}
                            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] bg-primary px-[14px] font-medium text-white hover:bg-primary-hover"
                        >
                            <Plus className="h-4 w-4" />
                            Programar cirugía
                        </button>
                    )}
                </div>
            </div>
            <div className="flex flex-wrap items-start gap-4">
                <div className="min-w-0 flex-[3_1_640px]">
                    <WeekCalendar
                        days={days}
                        today={today}
                        surgeries={surgeries}
                        selectedId={selected}
                        onSelect={setSelected}
                    />
                </div>
                <div className="min-w-0 flex-[1_1_280px]">
                    <SurgeryPanel
                        key={surgery?.id ?? 'none'}
                        surgery={surgery}
                        options={options}
                        canSchedule={can_schedule}
                        canAdvance={can_advance}
                    />
                </div>
            </div>
            {scheduling && (
                <ScheduleDialog
                    options={options}
                    date={thisWeek ? today : days[0]}
                    onClose={() => setScheduling(false)}
                />
            )}
        </div>
    );
}
