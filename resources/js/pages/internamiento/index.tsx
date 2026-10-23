import { useState } from 'react';
import StatusBadge from '@/components/cemerog/StatusBadge';

const HABITACIONES = [
    {
        id: 1,
        nombre: 'Habitación 101',
        tipo: 'Individual',
        camas: [
            {
                no: '101-A',
                estado: 'ocupada',
                paciente: 'Carmen López',
                desde: '10/10/2026',
                medico: 'Dra. Ana Rodríguez',
            },
        ],
    },
    {
        id: 2,
        nombre: 'Habitación 102',
        tipo: 'Doble',
        camas: [
            {
                no: '102-A',
                estado: 'ocupada',
                paciente: 'Luis Fernández',
                desde: '11/10/2026',
                medico: 'Dr. Pedro Guzmán',
            },
            {
                no: '102-B',
                estado: 'libre',
                paciente: '',
                desde: '',
                medico: '',
            },
        ],
    },
    {
        id: 3,
        nombre: 'Habitación 103',
        tipo: 'Doble',
        camas: [
            {
                no: '103-A',
                estado: 'limpieza',
                paciente: '',
                desde: '',
                medico: '',
            },
            {
                no: '103-B',
                estado: 'libre',
                paciente: '',
                desde: '',
                medico: '',
            },
        ],
    },
    {
        id: 4,
        nombre: 'Habitación 104',
        tipo: 'Individual',
        camas: [
            {
                no: '104-A',
                estado: 'libre',
                paciente: '',
                desde: '',
                medico: '',
            },
        ],
    },
    {
        id: 5,
        nombre: 'UCI',
        tipo: 'UCI',
        camas: [
            {
                no: 'UCI-1',
                estado: 'ocupada',
                paciente: 'Rosa Díaz',
                desde: '09/10/2026',
                medico: 'Dr. Pedro Guzmán',
            },
            {
                no: 'UCI-2',
                estado: 'libre',
                paciente: '',
                desde: '',
                medico: '',
            },
        ],
    },
];

const CAMA_COLORS: Record<
    string,
    { bg: string; text: string; border: string; label: string }
> = {
    ocupada: {
        bg: '#EDE9FE',
        text: '#5B21B6',
        border: '#7C3AED',
        label: 'Ocupada',
    },
    libre: {
        bg: '#EEF6E2',
        text: '#2E8B3E',
        border: '#B9DC8E',
        label: 'Libre',
    },
    limpieza: {
        bg: '#FEF3C7',
        text: '#92400E',
        border: '#D97706',
        label: 'Limpieza',
    },
};

const INTERNADO = {
    ini: 'CL',
    name: 'Carmen López',
    estado: 'internado' as const,
    edad: '67 años',
    ced: '001-0000003-3',
    no: 'A-MG01-000236',
    cama: '101-A',
    medico: 'Dra. Ana Rodríguez',
    ingreso: '10/10/2026 · 14:30',
    dx: 'Neumonía bacteriana · J18.9',
};

const TABS_PT = [
    'Medicamentos',
    'Lab/Imágenes',
    'Signos vitales',
    'Notas',
    'Cargos',
];

const MEDS = [
    {
        med: 'Amoxicilina 1g IV',
        frec: 'Cada 8 horas',
        prox: '14:00',
        estado: 'Pendiente',
    },
    {
        med: 'Paracetamol 1g IV',
        frec: 'Cada 6 horas si T > 38°C',
        prox: '12:00',
        estado: 'Aplicado',
    },
    {
        med: 'Omeprazol 40mg IV',
        frec: 'Cada 24 horas',
        prox: '08:00',
        estado: 'Aplicado',
    },
];

const CARGOS = [
    { desc: 'Habitación individual · día 1', imp: 'RD$3,500.00' },
    { desc: 'Habitación individual · día 2', imp: 'RD$3,500.00' },
    { desc: 'Amoxicilina 1g x 6 dosis', imp: 'RD$840.00' },
    { desc: 'Exámenes de laboratorio', imp: 'RD$2,200.00' },
];

export default function InternamientoIndex() {
    const [selCama, setSelCama] = useState<string | null>('101-A');
    const [ptTab, setPtTab] = useState('Medicamentos');

    return (
        <div className="flex flex-col gap-5">
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                }}
            >
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
                        Internamiento
                    </h1>
                    <p style={{ margin: '4px 0 0', color: '#5f6b64' }}>
                        3 camas ocupadas · 4 disponibles · 1 en limpieza
                    </p>
                </div>
                <button
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
                    + Nuevo ingreso
                </button>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {Object.entries(CAMA_COLORS).map(([k, v]) => (
                    <span
                        key={k}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 13,
                            color: '#52525b',
                        }}
                    >
                        <span
                            style={{
                                width: 12,
                                height: 12,
                                borderRadius: 3,
                                background: v.bg,
                                border: `1px solid ${v.border}`,
                            }}
                        ></span>
                        {v.label}
                    </span>
                ))}
            </div>

            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 16,
                    alignItems: 'flex-start',
                }}
            >
                {/* Bed map */}
                <div
                    style={{
                        flex: '2 1 500px',
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                    }}
                >
                    {HABITACIONES.map((hab) => (
                        <div
                            key={hab.id}
                            style={{
                                background: '#fff',
                                border: '1px solid #e3e9e3',
                                borderRadius: 14,
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid #eef0ec',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: 'Bitter,Georgia,serif',
                                        fontWeight: 600,
                                        fontSize: 15,
                                        color: '#1f2d22',
                                    }}
                                >
                                    {hab.nombre}
                                </span>
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: '#71717a',
                                        padding: '2px 8px',
                                        borderRadius: 999,
                                        background: '#F3F7F2',
                                    }}
                                >
                                    {hab.tipo}
                                </span>
                            </div>
                            <div
                                style={{
                                    padding: '12px 16px',
                                    display: 'flex',
                                    gap: 10,
                                    flexWrap: 'wrap',
                                }}
                            >
                                {hab.camas.map((c) => {
                                    const cc = CAMA_COLORS[c.estado];
                                    return (
                                        <div
                                            key={c.no}
                                            onClick={() =>
                                                c.estado === 'ocupada' &&
                                                setSelCama(c.no)
                                            }
                                            style={{
                                                flex: '1 1 140px',
                                                minWidth: 140,
                                                padding: '10px 12px',
                                                borderRadius: 10,
                                                border: `1.5px solid ${selCama === c.no ? '#1f2d22' : cc.border}`,
                                                background: cc.bg,
                                                cursor:
                                                    c.estado === 'ocupada'
                                                        ? 'pointer'
                                                        : 'default',
                                                outline:
                                                    selCama === c.no
                                                        ? '2px solid #1f2d22'
                                                        : 'none',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent:
                                                        'space-between',
                                                    alignItems: 'center',
                                                    marginBottom: 4,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontWeight: 700,
                                                        fontSize: 12,
                                                        color: cc.text,
                                                        letterSpacing: '.03em',
                                                    }}
                                                >
                                                    🛏 {c.no}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        color: cc.text,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {cc.label}
                                                </span>
                                            </div>
                                            {c.estado === 'ocupada' && (
                                                <>
                                                    <div
                                                        style={{
                                                            fontWeight: 600,
                                                            fontSize: 13,
                                                            color: '#1f2d22',
                                                            whiteSpace:
                                                                'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow:
                                                                'ellipsis',
                                                        }}
                                                    >
                                                        {c.paciente}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 12,
                                                            color: '#71717a',
                                                        }}
                                                    >
                                                        Desde {c.desde}
                                                    </div>
                                                </>
                                            )}
                                            {c.estado === 'libre' && (
                                                <div
                                                    style={{
                                                        fontSize: 13,
                                                        color: cc.text,
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    Disponible
                                                </div>
                                            )}
                                            {c.estado === 'limpieza' && (
                                                <div
                                                    style={{
                                                        fontSize: 13,
                                                        color: cc.text,
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    En limpieza
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Patient panel */}
                {selCama && (
                    <div
                        style={{
                            flex: '1 1 320px',
                            minWidth: 0,
                            position: 'sticky',
                            top: 80,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                background: '#fff',
                                border: '1px solid #e3e9e3',
                                borderRadius: 14,
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '14px 16px',
                                    borderBottom: '1px solid #eef0ec',
                                }}
                            >
                                <div
                                    style={{
                                        width: 42,
                                        height: 42,
                                        flexShrink: 0,
                                        borderRadius: '50%',
                                        background: '#2E8B3E',
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 600,
                                        fontSize: 15,
                                    }}
                                >
                                    {INTERNADO.ini}
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div
                                        style={{
                                            fontFamily: 'Bitter,Georgia,serif',
                                            fontWeight: 600,
                                            fontSize: 17,
                                            color: '#1f2d22',
                                        }}
                                    >
                                        {INTERNADO.name}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 12.5,
                                            color: '#71717a',
                                        }}
                                    >
                                        {INTERNADO.edad} · {INTERNADO.ced}
                                    </div>
                                </div>
                                <StatusBadge state={INTERNADO.estado} />
                            </div>
                            <div
                                style={{
                                    padding: '12px 16px',
                                    display: 'grid',
                                    gridTemplateColumns: 'auto 1fr',
                                    gap: '6px 12px',
                                    fontSize: 13,
                                }}
                            >
                                <span style={{ color: '#71717a' }}>
                                    No. atención
                                </span>
                                <span
                                    style={{
                                        fontFamily: 'ui-monospace,monospace',
                                        fontWeight: 600,
                                        fontSize: 12,
                                    }}
                                >
                                    {INTERNADO.no}
                                </span>
                                <span style={{ color: '#71717a' }}>Cama</span>
                                <span style={{ fontWeight: 600 }}>
                                    {INTERNADO.cama}
                                </span>
                                <span style={{ color: '#71717a' }}>Médico</span>
                                <span>{INTERNADO.medico}</span>
                                <span style={{ color: '#71717a' }}>
                                    Ingreso
                                </span>
                                <span>{INTERNADO.ingreso}</span>
                                <span style={{ color: '#71717a' }}>
                                    Diagnóstico
                                </span>
                                <span style={{ fontWeight: 500 }}>
                                    {INTERNADO.dx}
                                </span>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div
                            style={{
                                background: '#fff',
                                border: '1px solid #e3e9e3',
                                borderRadius: 14,
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    overflowX: 'auto',
                                    borderBottom: '1px solid #eef0ec',
                                    padding: '0 8px',
                                }}
                            >
                                {TABS_PT.map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setPtTab(t)}
                                        style={{
                                            whiteSpace: 'nowrap',
                                            height: 40,
                                            padding: '0 12px',
                                            border: 'none',
                                            background: 'transparent',
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            fontSize: 13,
                                            color:
                                                ptTab === t
                                                    ? '#2E8B3E'
                                                    : '#52605a',
                                            borderBottom:
                                                ptTab === t
                                                    ? '2px solid #2E8B3E'
                                                    : '2px solid transparent',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                            <div style={{ padding: '14px 16px' }}>
                                {ptTab === 'Medicamentos' && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 8,
                                        }}
                                    >
                                        {MEDS.map((m, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    padding: '10px 12px',
                                                    borderRadius: 10,
                                                    border: '1px solid #eef0ec',
                                                    background:
                                                        m.estado === 'Pendiente'
                                                            ? '#FFFBEB'
                                                            : '#F8FBF6',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontWeight: 600,
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    {m.med}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        color: '#71717a',
                                                    }}
                                                >
                                                    {m.frec}
                                                </div>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent:
                                                            'space-between',
                                                        alignItems: 'center',
                                                        marginTop: 4,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: 12,
                                                            color: '#52525b',
                                                        }}
                                                    >
                                                        Próxima: {m.prox}
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: 12,
                                                            fontWeight: 600,
                                                            color:
                                                                m.estado ===
                                                                'Pendiente'
                                                                    ? '#92400E'
                                                                    : '#2E8B3E',
                                                            padding: '2px 8px',
                                                            borderRadius: 999,
                                                            background:
                                                                m.estado ===
                                                                'Pendiente'
                                                                    ? '#FEF3C7'
                                                                    : '#EEF6E2',
                                                        }}
                                                    >
                                                        {m.estado}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            style={{
                                                height: 34,
                                                borderRadius: 10,
                                                border: '1px dashed #B9DC8E',
                                                background: '#F8FBF6',
                                                color: '#2E8B3E',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                fontFamily: 'inherit',
                                                fontSize: 13,
                                            }}
                                        >
                                            + Agregar medicamento
                                        </button>
                                    </div>
                                )}
                                {ptTab === 'Cargos' && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 0,
                                        }}
                                    >
                                        {CARGOS.map((c, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent:
                                                        'space-between',
                                                    padding: '8px 0',
                                                    borderBottom:
                                                        '1px solid #f1f3ef',
                                                    fontSize: 13,
                                                }}
                                            >
                                                <span>{c.desc}</span>
                                                <span
                                                    style={{
                                                        fontWeight: 600,
                                                        fontVariantNumeric:
                                                            'tabular-nums',
                                                    }}
                                                >
                                                    {c.imp}
                                                </span>
                                            </div>
                                        ))}
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                padding: '10px 0',
                                                fontWeight: 700,
                                                fontSize: 14,
                                            }}
                                        >
                                            <span>Total</span>
                                            <span
                                                style={{
                                                    fontVariantNumeric:
                                                        'tabular-nums',
                                                }}
                                            >
                                                RD$10,040.00
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {ptTab !== 'Medicamentos' &&
                                    ptTab !== 'Cargos' && (
                                        <div
                                            style={{
                                                color: '#71717a',
                                                textAlign: 'center',
                                                padding: '24px 0',
                                                fontSize: 13,
                                            }}
                                        >
                                            Sin registros en esta sección.
                                        </div>
                                    )}
                            </div>
                        </div>

                        <button
                            style={{
                                height: 36,
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
                            Dar alta hospitalaria
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
