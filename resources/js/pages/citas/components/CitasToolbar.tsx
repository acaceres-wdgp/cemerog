import { DoctorOption } from '../types';
import { todayStr, tomorrowStr, addDays } from '../lib/dates';

const DOC_PALETTES = [
    { bg: '#EEF6E2', fg: '#2E8B3E' },
    { bg: '#DBEAFE', fg: '#1E40AF' },
    { bg: '#EDE9FE', fg: '#5B21B6' },
    { bg: '#FCE7F3', fg: '#9D174D' },
    { bg: '#CFFAFE', fg: '#155E75' },
    { bg: '#FEF3C7', fg: '#92400E' },
];
const docPalette = (id: number) => DOC_PALETTES[id % DOC_PALETTES.length];

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
                                background: active ? '#EEF6E2' : '#fff',
                                border: `1px solid ${active ? '#B9DC8E' : '#e3e9e3'}`,
                                fontFamily: 'inherit',
                                fontSize: 14,
                            }}
                        >
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
                                        color: '#1f2d22',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {d.name}
                                </span>
                                <span
                                    style={{
                                        display: 'block',
                                        fontSize: 12,
                                        color: '#71717a',
                                        whiteSpace: 'nowrap',
                                    }}
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
                        background: '#F3F7F2',
                        border: '1px solid #e3e9e3',
                        borderRadius: 11,
                        padding: 3,
                        gap: 2,
                    }}
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
                                background: t.active
                                    ? '#fff'
                                    : 'transparent',
                                color: t.active ? '#1f2d22' : '#52605a',
                                boxShadow: t.active
                                    ? '0 1px 3px rgba(0,0,0,.1)'
                                    : 'none',
                                fontFamily: 'inherit',
                                fontSize: 14,
                            }}
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
                            border: '1px solid #dfe7df',
                            background: '#F6F9F5',
                            borderRadius: 10,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: 16,
                        }}
                    >
                        ‹
                    </button>
                    <button
                        onClick={() => onNavigate(todayStr())}
                        style={{
                            height: 36,
                            padding: '0 12px',
                            border: '1px solid #dfe7df',
                            background: '#F6F9F5',
                            borderRadius: 10,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: 14,
                            fontWeight: 500,
                        }}
                    >
                        Hoy
                    </button>
                    <button
                        onClick={() => onNavigate(addDays(date, 1))}
                        style={{
                            width: 36,
                            height: 36,
                            border: '1px solid #dfe7df',
                            background: '#F6F9F5',
                            borderRadius: 10,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: 16,
                        }}
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
                        background: '#2E8B3E',
                        color: '#fff',
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 14,
                    }}
                >
                    + Nueva cita
                </button>
            </div>
        </div>
    );
}
