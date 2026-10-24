import { cn } from '@/lib/utils';
import { DoctorOption } from '../types';
import { todayStr, tomorrowStr, addDays } from '../lib/dates';
import { docPalette } from '../lib/palettes';

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
        <div className="flex justify-between items-center gap-3 flex-wrap">
            {/* Doctor filter chips */}
            <div className="flex gap-2 flex-wrap">
                {doctors.map((d) => {
                    const pal = docPalette(d.id);
                    const active = selDoc === d.id;
                    return (
                        <button
                            key={d.id}
                            onClick={() => setSelDoc(active ? null : d.id)}
                            className={cn(
                                'flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-xl cursor-pointer text-left font-[inherit] text-sm',
                                active
                                    ? 'border border-accent-border bg-accent-bg'
                                    : 'border border-card-border bg-white',
                            )}
                        >
                            <span
                                style={{ background: pal.bg, color: pal.fg }} // dynamic-style: doctor color palette computed from doctor ID
                                className="w-8 h-8 shrink-0 rounded-full inline-flex items-center justify-center text-xs font-semibold"
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
            <div className="flex gap-2 items-center flex-wrap">
                {/* Hoy / Mañana segmented */}
                <div className="inline-flex rounded-[11px] p-[3px] gap-0.5 border border-card-border bg-app-bg">
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
                                'whitespace-nowrap h-[30px] px-3 border-0 rounded-[10px] cursor-pointer font-medium font-[inherit] text-sm',
                                t.active
                                    ? 'bg-card-bg shadow-sm text-text-heading'
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
                        className="w-9 h-9 rounded-[10px] cursor-pointer font-[inherit] text-base border border-secondary-border bg-secondary-bg"
                    >
                        ‹
                    </button>
                    <button
                        onClick={() => onNavigate(todayStr())}
                        className="h-9 px-3 rounded-[10px] cursor-pointer font-[inherit] text-sm font-medium border border-secondary-border bg-secondary-bg"
                    >
                        Hoy
                    </button>
                    <button
                        onClick={() => onNavigate(addDays(date, 1))}
                        className="w-9 h-9 rounded-[10px] cursor-pointer font-[inherit] text-base border border-secondary-border bg-secondary-bg"
                    >
                        ›
                    </button>
                </div>
                <button
                    onClick={onNewCita}
                    className="whitespace-nowrap inline-flex items-center gap-2 h-9 px-3.5 rounded-[10px] border-0 font-medium cursor-pointer font-[inherit] text-sm bg-primary text-white"
                >
                    + Nueva cita
                </button>
            </div>
        </div>
    );
}
