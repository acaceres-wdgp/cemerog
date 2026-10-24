import { cn } from '@/lib/utils';
import { DoctorOption } from '../types';
import { todayStr, tomorrowStr, addDays } from '../lib/dates';
import { docPalette } from '../lib/palettes';

/** Build avatar style from doctor palette — computed at runtime from doctor ID. */
function palStyle(pal: { bg: string; fg: string }): React.CSSProperties {
    return { background: pal.bg, color: pal.fg };
}

type CitasToolbarProps = {
    doctors: DoctorOption[];
    selDoc: number | null;
    setSelDoc: (id: number | null) => void;
    date: string;
    is_today: boolean;
    onNavigate: (targetDate: string) => void;
    onNewCita: () => void;
};

export function CitasToolbar({
    doctors,
    selDoc,
    setSelDoc,
    date,
    is_today,
    onNavigate,
    onNewCita,
}: CitasToolbarProps) {
    const isTomorrow = date === tomorrowStr();

    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Doctor filter chips */}
            <div className="flex flex-wrap gap-2">
                {doctors.map((d) => {
                    const pal = docPalette(d.id);
                    const active = selDoc === d.id;
                    return (
                        <button
                            key={d.id}
                            onClick={() => setSelDoc(active ? null : d.id)}
                            className={cn(
                                'flex cursor-pointer items-center gap-2.5 rounded-xl py-1.5 pr-3.5 pl-1.5 text-left font-[inherit] text-sm',
                                active
                                    ? 'border-accent-border border bg-accent-bg'
                                    : 'border border-card-border bg-white',
                            )}
                        >
                            {/* dynamic-style: doctor color palette computed from doctor ID */}
                            <span
                                style={palStyle(pal)}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                            >
                                {d.initials}
                            </span>
                            <span className="leading-tight">
                                <span className="block font-semibold whitespace-nowrap text-text-heading">
                                    {d.name}
                                </span>
                                <span className="block text-xs whitespace-nowrap text-muted">
                                    {d.specialty}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Right controls */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Hoy / Mañana segmented */}
                <div className="inline-flex gap-0.5 rounded-[11px] border border-card-border bg-app-bg p-[3px]">
                    {(
                        [
                            {
                                key: todayStr(),
                                label: 'Hoy',
                                active: is_today,
                            },
                            {
                                key: tomorrowStr(),
                                label: 'Mañana',
                                active: isTomorrow,
                            },
                        ] as const
                    ).map((t) => (
                        <button
                            key={t.key}
                            onClick={() => onNavigate(t.key)}
                            className={cn(
                                'h-[30px] cursor-pointer rounded-[10px] border-0 px-3 font-[inherit] text-sm font-medium whitespace-nowrap',
                                t.active
                                    ? 'bg-card-bg text-text-heading shadow-sm'
                                    : 'bg-transparent text-secondary-fg',
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                {/* ‹ Hoy › navigation */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onNavigate(addDays(date, -1))}
                        className="h-9 w-9 cursor-pointer rounded-[10px] border border-secondary-border bg-secondary-bg font-[inherit] text-base"
                    >
                        ‹
                    </button>
                    <button
                        onClick={() => onNavigate(todayStr())}
                        className="h-9 cursor-pointer rounded-[10px] border border-secondary-border bg-secondary-bg px-3 font-[inherit] text-sm font-medium"
                    >
                        Hoy
                    </button>
                    <button
                        onClick={() => onNavigate(addDays(date, 1))}
                        className="h-9 w-9 cursor-pointer rounded-[10px] border border-secondary-border bg-secondary-bg font-[inherit] text-base"
                    >
                        ›
                    </button>
                </div>
                <button
                    onClick={onNewCita}
                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border-0 bg-primary px-3.5 font-[inherit] text-sm font-medium whitespace-nowrap text-white"
                >
                    + Nueva cita
                </button>
            </div>
        </div>
    );
}
