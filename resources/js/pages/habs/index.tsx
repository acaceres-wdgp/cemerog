import { useState } from 'react';

type BedState = 'ocupada' | 'libre' | 'limpieza';

type Bed = {
    id: string;
    estado: BedState;
    paciente?: string;
    desde?: string;
    diagnostico?: string;
};
type Room = {
    id: string;
    numero: string;
    tipo: string;
    piso: number;
    camas: Bed[];
};

const BED_CONFIG: Record<
    BedState,
    { bg: string; border: string; fg: string; dot: string; label: string }
> = {
    ocupada: {
        bg: '#EDE9FE',
        border: '#C4B5FD',
        fg: '#5B21B6',
        dot: '#7C3AED',
        label: 'Ocupada',
    },
    libre: {
        bg: '#EEF6E2',
        border: '#B9DC8E',
        fg: '#2E8B3E',
        dot: '#2E8B3E',
        label: 'Libre',
    },
    limpieza: {
        bg: '#FEF3C7',
        border: '#FCD34D',
        fg: '#92400E',
        dot: '#D97706',
        label: 'En limpieza',
    },
};

const ROOMS: Room[] = [
    {
        id: 'r1',
        numero: '101',
        tipo: 'Suite VIP',
        piso: 1,
        camas: [
            {
                id: 'r1-c1',
                estado: 'ocupada',
                paciente: 'Carmen López',
                desde: '09/10/2026',
                diagnostico: 'Neumonía bacteriana',
            },
        ],
    },
    {
        id: 'r2',
        numero: '102',
        tipo: 'Privada',
        piso: 1,
        camas: [{ id: 'r2-c1', estado: 'libre' }],
    },
    {
        id: 'r3',
        numero: '103',
        tipo: 'Privada',
        piso: 1,
        camas: [{ id: 'r3-c1', estado: 'limpieza' }],
    },
    {
        id: 'r4',
        numero: '104',
        tipo: 'Semi-privada',
        piso: 1,
        camas: [
            {
                id: 'r4-c1',
                estado: 'ocupada',
                paciente: 'Rosa Fernández',
                desde: '11/10/2026',
                diagnostico: 'Post-op cesárea',
            },
            { id: 'r4-c2', estado: 'libre' },
        ],
    },
    {
        id: 'r5',
        numero: '201',
        tipo: 'Privada',
        piso: 2,
        camas: [{ id: 'r5-c1', estado: 'libre' }],
    },
    {
        id: 'r6',
        numero: '202',
        tipo: 'Privada',
        piso: 2,
        camas: [
            {
                id: 'r6-c1',
                estado: 'ocupada',
                paciente: 'Luis Martínez',
                desde: '12/10/2026',
                diagnostico: 'Fractura fémur',
            },
        ],
    },
    {
        id: 'r7',
        numero: '203',
        tipo: 'Semi-privada',
        piso: 2,
        camas: [
            { id: 'r7-c1', estado: 'libre' },
            { id: 'r7-c2', estado: 'limpieza' },
        ],
    },
    {
        id: 'r8',
        numero: 'UCI-1',
        tipo: 'UCI/UTI',
        piso: 1,
        camas: [
            {
                id: 'r8-c1',
                estado: 'ocupada',
                paciente: 'Juan Pérez',
                desde: '10/10/2026',
                diagnostico: 'IAM con elevación ST',
            },
            { id: 'r8-c2', estado: 'libre' },
            { id: 'r8-c3', estado: 'libre' },
        ],
    },
];

const PISOS = [1, 2];

export default function HabsIndex() {
    const [pisoFilter, setPisoFilter] = useState<number | null>(null);
    const [estadoFilter, setEstadoFilter] = useState<BedState | null>(null);
    const [selBed, setSelBed] = useState<string | null>(null);

    const totalCamas = ROOMS.reduce((s, r) => s + r.camas.length, 0);
    const ocupadas = ROOMS.reduce(
        (s, r) => s + r.camas.filter((c) => c.estado === 'ocupada').length,
        0,
    );
    const libres = ROOMS.reduce(
        (s, r) => s + r.camas.filter((c) => c.estado === 'libre').length,
        0,
    );
    const limpieza = ROOMS.reduce(
        (s, r) => s + r.camas.filter((c) => c.estado === 'limpieza').length,
        0,
    );

    const filteredRooms = ROOMS.filter((r) => {
        if (pisoFilter !== null && r.piso !== pisoFilter) return false;
        if (
            estadoFilter !== null &&
            !r.camas.some((c) => c.estado === estadoFilter)
        )
            return false;
        return true;
    });

    let selBedData: Bed | null = null;
    let selRoomData: Room | null = null;
    for (const r of ROOMS) {
        const b = r.camas.find((c) => c.id === selBed);
        if (b) {
            selBedData = b;
            selRoomData = r;
            break;
        }
    }

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h1
                    style={{
                        fontFamily: 'Bitter,Georgia,serif',
                        fontWeight: 600,
                        fontSize: 26,
                        color: '#1f2d22',
                        margin: 0,
                    }}
                >
                    Habitaciones y Camas
                </h1>
                <p style={{ margin: '4px 0 0', color: '#5f6b64' }}>
                    {ROOMS.length} habitaciones · {totalCamas} camas
                </p>
            </div>

            {/* Stats row */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))',
                    gap: 12,
                }}
            >
                {[
                    {
                        label: 'Total camas',
                        val: totalCamas,
                        bg: '#F3F7F2',
                        color: '#1f2d22',
                    },
                    {
                        label: 'Ocupadas',
                        val: ocupadas,
                        bg: '#EDE9FE',
                        color: '#5B21B6',
                    },
                    {
                        label: 'Libres',
                        val: libres,
                        bg: '#EEF6E2',
                        color: '#2E8B3E',
                    },
                    {
                        label: 'En limpieza',
                        val: limpieza,
                        bg: '#FEF3C7',
                        color: '#92400E',
                    },
                ].map((s) => (
                    <div
                        key={s.label}
                        style={{
                            background: s.bg,
                            border: '1px solid #e3e9e3',
                            borderRadius: 12,
                            padding: '14px 16px',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: '.07em',
                                textTransform: 'uppercase',
                                color: s.color,
                                opacity: 0.7,
                            }}
                        >
                            {s.label}
                        </div>
                        <div
                            style={{
                                fontFamily: 'Bitter,Georgia,serif',
                                fontSize: 28,
                                fontWeight: 700,
                                color: s.color,
                                marginTop: 2,
                            }}
                        >
                            {s.val}
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div
                style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                }}
            >
                <div
                    style={{ fontSize: 13, fontWeight: 500, color: '#52525b' }}
                >
                    Piso:
                </div>
                <button
                    onClick={() => setPisoFilter(null)}
                    style={{
                        height: 30,
                        padding: '0 10px',
                        borderRadius: 999,
                        border: `1px solid ${pisoFilter === null ? '#B9DC8E' : '#e4e4e7'}`,
                        background: pisoFilter === null ? '#EEF6E2' : '#fff',
                        color: pisoFilter === null ? '#2E8B3E' : '#52525b',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 12,
                        fontWeight: pisoFilter === null ? 600 : 400,
                    }}
                >
                    Todos
                </button>
                {PISOS.map((p) => (
                    <button
                        key={p}
                        onClick={() =>
                            setPisoFilter(p === pisoFilter ? null : p)
                        }
                        style={{
                            height: 30,
                            padding: '0 10px',
                            borderRadius: 999,
                            border: `1px solid ${pisoFilter === p ? '#B9DC8E' : '#e4e4e7'}`,
                            background: pisoFilter === p ? '#EEF6E2' : '#fff',
                            color: pisoFilter === p ? '#2E8B3E' : '#52525b',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: 12,
                            fontWeight: pisoFilter === p ? 600 : 400,
                        }}
                    >
                        Piso {p}
                    </button>
                ))}
                <div
                    style={{ width: 1, height: 20, background: '#e4e4e7' }}
                ></div>
                <div
                    style={{ fontSize: 13, fontWeight: 500, color: '#52525b' }}
                >
                    Estado:
                </div>
                {(['libre', 'ocupada', 'limpieza'] as BedState[]).map((e) => {
                    const cfg = BED_CONFIG[e];
                    return (
                        <button
                            key={e}
                            onClick={() =>
                                setEstadoFilter(e === estadoFilter ? null : e)
                            }
                            style={{
                                height: 30,
                                padding: '0 10px',
                                borderRadius: 999,
                                border: `1px solid ${estadoFilter === e ? cfg.border : '#e4e4e7'}`,
                                background:
                                    estadoFilter === e ? cfg.bg : '#fff',
                                color: estadoFilter === e ? cfg.fg : '#52525b',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 12,
                                fontWeight: estadoFilter === e ? 600 : 400,
                            }}
                        >
                            {cfg.label}
                        </button>
                    );
                })}
            </div>

            <div
                style={{
                    display: 'flex',
                    gap: 16,
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                }}
            >
                {/* Room grid */}
                <div
                    style={{
                        flex: '2 1 480px',
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 20,
                    }}
                >
                    {PISOS.filter(
                        (p) => pisoFilter === null || p === pisoFilter,
                    ).map((piso) => {
                        const pisoRooms = filteredRooms.filter(
                            (r) => r.piso === piso,
                        );
                        if (pisoRooms.length === 0) return null;
                        return (
                            <div key={piso}>
                                <div
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        letterSpacing: '.07em',
                                        textTransform: 'uppercase',
                                        color: '#56693f',
                                        marginBottom: 10,
                                    }}
                                >
                                    Piso {piso}
                                </div>
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns:
                                            'repeat(auto-fill,minmax(200px,1fr))',
                                        gap: 10,
                                    }}
                                >
                                    {pisoRooms.map((room) => (
                                        <div
                                            key={room.id}
                                            style={{
                                                background: '#fff',
                                                border: '1px solid #e3e9e3',
                                                borderRadius: 12,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    padding: '8px 12px',
                                                    borderBottom:
                                                        '1px solid #eef0ec',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent:
                                                        'space-between',
                                                }}
                                            >
                                                <div>
                                                    <span
                                                        style={{
                                                            fontWeight: 700,
                                                            fontSize: 15,
                                                            color: '#1f2d22',
                                                        }}
                                                    >
                                                        Hab. {room.numero}
                                                    </span>
                                                    <span
                                                        style={{
                                                            marginLeft: 6,
                                                            fontSize: 11.5,
                                                            color: '#71717a',
                                                        }}
                                                    >
                                                        {room.tipo}
                                                    </span>
                                                </div>
                                                <span
                                                    style={{
                                                        fontSize: 11.5,
                                                        color: '#a1a1aa',
                                                    }}
                                                >
                                                    {room.camas.length}{' '}
                                                    {room.camas.length === 1
                                                        ? 'cama'
                                                        : 'camas'}
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    padding: '8px 12px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 6,
                                                }}
                                            >
                                                {room.camas.map((bed, bi) => {
                                                    const cfg =
                                                        BED_CONFIG[bed.estado];
                                                    const isSelected =
                                                        selBed === bed.id;
                                                    return (
                                                        <button
                                                            key={bed.id}
                                                            onClick={() =>
                                                                setSelBed(
                                                                    isSelected
                                                                        ? null
                                                                        : bed.id,
                                                                )
                                                            }
                                                            style={{
                                                                display: 'flex',
                                                                alignItems:
                                                                    'center',
                                                                gap: 8,
                                                                padding:
                                                                    '7px 10px',
                                                                borderRadius: 8,
                                                                border: `1.5px solid ${isSelected ? cfg.border : bed.estado === 'ocupada' ? cfg.border : '#e4e4e7'}`,
                                                                background:
                                                                    isSelected
                                                                        ? cfg.bg
                                                                        : bed.estado ===
                                                                            'libre'
                                                                          ? '#FAFAFA'
                                                                          : cfg.bg,
                                                                cursor: 'pointer',
                                                                fontFamily:
                                                                    'inherit',
                                                                textAlign:
                                                                    'left',
                                                                width: '100%',
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    width: 8,
                                                                    height: 8,
                                                                    borderRadius:
                                                                        '50%',
                                                                    background:
                                                                        cfg.dot,
                                                                    flexShrink: 0,
                                                                }}
                                                            ></span>
                                                            <div
                                                                style={{
                                                                    flex: 1,
                                                                    minWidth: 0,
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        fontSize: 12.5,
                                                                        fontWeight: 600,
                                                                        color: cfg.fg,
                                                                    }}
                                                                >
                                                                    Cama{' '}
                                                                    {bi + 1} ·{' '}
                                                                    {cfg.label}
                                                                </div>
                                                                {bed.paciente && (
                                                                    <div
                                                                        style={{
                                                                            fontSize: 11.5,
                                                                            color: '#374151',
                                                                            marginTop: 1,
                                                                            overflow:
                                                                                'hidden',
                                                                            textOverflow:
                                                                                'ellipsis',
                                                                            whiteSpace:
                                                                                'nowrap',
                                                                        }}
                                                                    >
                                                                        {
                                                                            bed.paciente
                                                                        }
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Detail panel */}
                {selBedData && selRoomData && (
                    <div
                        style={{
                            flex: '1 1 260px',
                            minWidth: 0,
                            background: '#fff',
                            border: `1px solid ${BED_CONFIG[selBedData.estado].border}`,
                            borderRadius: 14,
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                padding: '14px 16px',
                                borderBottom: '1px solid #eef0ec',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                background: BED_CONFIG[selBedData.estado].bg,
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontFamily: 'Bitter,Georgia,serif',
                                        fontWeight: 600,
                                        fontSize: 15,
                                        color: '#1f2d22',
                                    }}
                                >
                                    Hab. {selRoomData.numero} ·{' '}
                                    {selRoomData.tipo}
                                </div>
                                <div
                                    style={{
                                        fontSize: 13,
                                        color: '#5f6b64',
                                        marginTop: 1,
                                    }}
                                >
                                    Piso {selRoomData.piso}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelBed(null)}
                                style={{
                                    width: 26,
                                    height: 26,
                                    border: 'none',
                                    borderRadius: 6,
                                    background: 'rgba(0,0,0,.06)',
                                    cursor: 'pointer',
                                    fontSize: 12,
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        <div
                            style={{
                                padding: '14px 16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12,
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                <span
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        background:
                                            BED_CONFIG[selBedData.estado].dot,
                                    }}
                                ></span>
                                <span
                                    style={{
                                        fontWeight: 600,
                                        color: BED_CONFIG[selBedData.estado].fg,
                                        fontSize: 14,
                                    }}
                                >
                                    {BED_CONFIG[selBedData.estado].label}
                                </span>
                            </div>

                            {selBedData.estado === 'ocupada' &&
                                selBedData.paciente && (
                                    <div
                                        style={{
                                            background: '#F3F7F2',
                                            borderRadius: 10,
                                            padding: '12px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 700,
                                                color: '#56693f',
                                                textTransform: 'uppercase',
                                                letterSpacing: '.05em',
                                                marginBottom: 6,
                                            }}
                                        >
                                            Paciente
                                        </div>
                                        <div
                                            style={{
                                                fontWeight: 600,
                                                fontSize: 15,
                                                color: '#1f2d22',
                                            }}
                                        >
                                            {selBedData.paciente}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 13,
                                                color: '#52525b',
                                                marginTop: 2,
                                            }}
                                        >
                                            Desde: {selBedData.desde}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 13,
                                                color: '#52525b',
                                                marginTop: 2,
                                            }}
                                        >
                                            {selBedData.diagnostico}
                                        </div>
                                    </div>
                                )}

                            {selBedData.estado === 'libre' && (
                                <div
                                    style={{
                                        background: '#EEF6E2',
                                        borderRadius: 10,
                                        padding: '12px',
                                        textAlign: 'center',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 14,
                                            color: '#2E8B3E',
                                            fontWeight: 500,
                                        }}
                                    >
                                        Cama disponible
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 12,
                                            color: '#5f6b64',
                                            marginTop: 2,
                                        }}
                                    >
                                        Lista para asignar
                                    </div>
                                </div>
                            )}

                            {selBedData.estado === 'limpieza' && (
                                <div
                                    style={{
                                        background: '#FEF3C7',
                                        borderRadius: 10,
                                        padding: '12px',
                                        textAlign: 'center',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 14,
                                            color: '#92400E',
                                            fontWeight: 500,
                                        }}
                                    >
                                        En proceso de limpieza
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 12,
                                            color: '#78716C',
                                            marginTop: 2,
                                        }}
                                    >
                                        No disponible temporalmente
                                    </div>
                                </div>
                            )}

                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                }}
                            >
                                {selBedData.estado === 'ocupada' && (
                                    <>
                                        <button
                                            style={{
                                                height: 34,
                                                borderRadius: 8,
                                                border: '1px solid #dfe7df',
                                                background: '#F6F9F5',
                                                cursor: 'pointer',
                                                fontFamily: 'inherit',
                                                fontSize: 13,
                                                fontWeight: 500,
                                            }}
                                        >
                                            Ver internamiento
                                        </button>
                                        <button
                                            style={{
                                                height: 34,
                                                borderRadius: 8,
                                                border: '1px solid #fecaca',
                                                background: '#fef2f2',
                                                color: '#b91c1c',
                                                cursor: 'pointer',
                                                fontFamily: 'inherit',
                                                fontSize: 13,
                                                fontWeight: 500,
                                            }}
                                        >
                                            ⊘ Dar de alta
                                        </button>
                                    </>
                                )}
                                {selBedData.estado === 'libre' && (
                                    <button
                                        style={{
                                            height: 34,
                                            borderRadius: 8,
                                            border: 'none',
                                            background: '#2E8B3E',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                            fontSize: 13,
                                            fontWeight: 500,
                                        }}
                                    >
                                        + Asignar paciente
                                    </button>
                                )}
                                {selBedData.estado === 'limpieza' && (
                                    <button
                                        style={{
                                            height: 34,
                                            borderRadius: 8,
                                            border: 'none',
                                            background: '#2E8B3E',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                            fontSize: 13,
                                            fontWeight: 500,
                                        }}
                                    >
                                        ✓ Marcar como lista
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
