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
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
            }}
        >
            {/* Doctor filter chips */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {doctors.map((d) => {
                    const pal = docPalette(d.id);
                    const active = selDoc === d.id;
                    return (
                        <button
                            key={d.id}
                            onClick={() => setSelDoc(active ? null : d.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '6px 14px 6px 6px',
                                borderRadius: 12,
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontFamily: 'inherit',
                                fontSize: 14,
                            }}
                            className={
                                active
                                    ? 'border border-accent-border bg-accent-bg'
                                    : 'border border-card-border bg-white'
                            }
                        >
                            {/* Doctor palette: computed at runtime from doctor ID */}
                            <span
                                style={{
                                    width: 32,
                                    height: 32,
                                    flexShrink: 0,
                                    borderRadius: '50%',
                                    background: pal.bg,
                                    color: pal.fg,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 12,
                                    fontWeight: 600,
                                }}
                            >
                                {d.initials}
                            </span>
                            <span style={{ lineHeight: 1.2 }}>
                                <span
                                    style={{
                                        display: 'block',
                                        fontWeight: 600,
                                        whiteSpace: 'nowrap',
                                    }}
                                    className="text-text-heading"
                                >
                                    {d.name}
                                </span>
                                <span
                                    style={{
                                        display: 'block',
                                        fontSize: 12,
                                        whiteSpace: 'nowrap',
                                    }}
                                    className="text-muted"
                                >
                                    {d.specialty}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Right controls */}
            <div
                style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                }}
            >
                {/* Hoy / Mañana segmented */}
                <div
                    style={{
                        display: 'inline-flex',
                        borderRadius: 11,
                        padding: 3,
                        gap: 2,
                    }}
                    className="border border-card-border bg-app-bg"
                >
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
                            style={{
                                whiteSpace: 'nowrap',
                                height: 30,
                                padding: '0 12px',
                                border: 'none',
                                borderRadius: 10,
                                cursor: 'pointer',
                                fontWeight: 500,
                                /* active/inactive computed at runtime from navigation state */
                                background: t.active
                                    ? 'var(--color-card-bg)'
                                    : 'transparent',
                                boxShadow: t.active
                                    ? '0 1px 3px rgba(0,0,0,.1)'
                                    : 'none',
                                fontFamily: 'inherit',
                                fontSize: 14,
                            }}
                            className={
                                t.active
                                    ? 'text-text-heading'
                                    : 'text-secondary-fg'
                            }
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                {/* ‹ Hoy › navigation */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                    }}
                >
                    <button
                        onClick={() => onNavigate(addDays(date, -1))}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: 16,
                        }}
                        className="border border-secondary-border bg-secondary-bg"
                    >
                        ‹
                    </button>
                    <button
                        onClick={() => onNavigate(todayStr())}
                        style={{
                            height: 36,
                            padding: '0 12px',
                            borderRadius: 10,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: 14,
                            fontWeight: 500,
                        }}
                        className="border border-secondary-border bg-secondary-bg"
                    >
                        Hoy
                    </button>
                    <button
                        onClick={() => onNavigate(addDays(date, 1))}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: 16,
                        }}
                        className="border border-secondary-border bg-secondary-bg"
                    >
                        ›
                    </button>
                </div>
                <button
                    onClick={onNewCita}
                    style={{
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        height: 36,
                        padding: '0 14px',
                        borderRadius: 10,
                        border: 'none',
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 14,
                    }}
                    className="bg-primary text-white"
                >
                    + Nueva cita
                </button>
            </div>
        </div>
    );
}
