import type { TurnRow } from '../types';

const ESPERA_BAR = '#D97706';
const CONSULTA_BAR = '#2563EB';

const thStyle: React.CSSProperties = {
    textAlign: 'left',
    fontWeight: 600,
    fontSize: 11.5,
    letterSpacing: '.05em',
    textTransform: 'uppercase',
    color: '#56693f',
    padding: '0 12px',
    height: 40,
    background: '#F6FAF1',
    borderBottom: '1px solid #DCEBC9',
    whiteSpace: 'nowrap',
};

interface TurnosPanelProps {
    turns: TurnRow[];
    activeTab: string;
    onTabChange: (tab: string) => void;
    onPatchStatus: (id: number, status: string) => void;
    onReorder: (id: number, dir: 'up' | 'down') => void;
}

export function TurnosPanel({
    turns,
    activeTab,
    onTabChange,
    onPatchStatus,
    onReorder,
}: TurnosPanelProps) {
    const TURN_TABS = [
        { key: 'todas', label: 'Todas', n: turns.length },
        {
            key: 'espera',
            label: 'En espera',
            n: turns.filter((t) => t.status === 'espera').length,
        },
        {
            key: 'consulta',
            label: 'En consulta',
            n: turns.filter((t) => t.status === 'en_consulta').length,
        },
        { key: 'emergencia', label: 'Emergencia', n: 0 },
        { key: 'internados', label: 'Internados', n: 0 },
    ];

    const filteredTurns =
        activeTab === 'todas'
            ? turns
            : activeTab === 'espera'
              ? turns.filter((t) => t.status === 'espera')
              : activeTab === 'consulta'
                ? turns.filter((t) => t.status === 'en_consulta')
                : [];

    return (
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
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    gap: 16,
                    flexWrap: 'wrap',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                    }}
                >
                    <span
                        style={{
                            fontFamily: 'Bitter,Georgia,serif',
                            fontSize: 18,
                            fontWeight: 600,
                            color: '#1f2d22',
                        }}
                    >
                        Atenciones
                    </span>
                    <span
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 24,
                            height: 22,
                            padding: '0 7px',
                            borderRadius: 999,
                            background: '#F3F7F2',
                            border: '1px solid #e3e9e3',
                            fontSize: 12,
                            fontWeight: 600,
                        }}
                    >
                        {filteredTurns.length}
                    </span>
                </div>
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
                    {TURN_TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => onTabChange(t.key)}
                            style={{
                                whiteSpace: 'nowrap',
                                height: 30,
                                padding: '0 12px',
                                border: 'none',
                                borderRadius: 10,
                                cursor: 'pointer',
                                fontWeight: 500,
                                background:
                                    activeTab === t.key
                                        ? '#fff'
                                        : 'transparent',
                                color:
                                    activeTab === t.key
                                        ? '#1f2d22'
                                        : '#52605a',
                                boxShadow:
                                    activeTab === t.key
                                        ? '0 1px 3px rgba(0,0,0,.1)'
                                        : 'none',
                                fontFamily: 'inherit',
                                fontSize: 14,
                            }}
                        >
                            {t.label}{' '}
                            <span
                                style={{
                                    color: '#71717a',
                                    fontWeight: 400,
                                }}
                            >
                                {t.n}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table
                    style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        minWidth: 800,
                    }}
                >
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, paddingLeft: 16 }}>
                                Turno
                            </th>
                            <th style={thStyle}>Paciente</th>
                            <th style={thStyle}>Médico</th>
                            <th style={thStyle}>Especialidad</th>
                            <th style={thStyle}>Llegada</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTurns.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    style={{
                                        padding: '32px 20px',
                                        textAlign: 'center',
                                        color: '#8a948e',
                                        fontSize: 13,
                                    }}
                                >
                                    No hay pacientes en espera en este
                                    momento.
                                </td>
                            </tr>
                        ) : (
                            filteredTurns.map((r) => {
                                const bar =
                                    r.status === 'en_consulta'
                                        ? CONSULTA_BAR
                                        : ESPERA_BAR;
                                return (
                                    <tr
                                        key={r.id}
                                        style={{ background: '#fff' }}
                                    >
                                        <td
                                            style={{
                                                padding:
                                                    '12px 16px 12px 13px',
                                                borderBottom:
                                                    '1px solid #eef0ec',
                                                borderLeft: `3px solid ${bar}`,
                                                fontWeight: 600,
                                                fontVariantNumeric:
                                                    'tabular-nums',
                                            }}
                                        >
                                            T-
                                            {String(r.turn_number).padStart(
                                                2,
                                                '0',
                                            )}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px',
                                                borderBottom:
                                                    '1px solid #eef0ec',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 10,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        width: 34,
                                                        height: 34,
                                                        flexShrink: 0,
                                                        borderRadius: '50%',
                                                        background:
                                                            '#EEF6E2',
                                                        color: '#2E8B3E',
                                                        display:
                                                            'inline-flex',
                                                        alignItems:
                                                            'center',
                                                        justifyContent:
                                                            'center',
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {r.patient_initials}
                                                </span>
                                                <div>
                                                    <div
                                                        style={{
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {r.patient_name}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 12,
                                                            color: '#71717a',
                                                        }}
                                                    >
                                                        {r.patient_document}{' '}
                                                        · {r.patient_age}{' '}
                                                        años ·{' '}
                                                        {r.patient_sex}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px',
                                                borderBottom:
                                                    '1px solid #eef0ec',
                                                color: '#52525b',
                                            }}
                                        >
                                            {r.doctor_name}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px',
                                                borderBottom:
                                                    '1px solid #eef0ec',
                                                color: '#71717a',
                                                fontSize: 13,
                                            }}
                                        >
                                            {r.doctor_specialty}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px',
                                                borderBottom:
                                                    '1px solid #eef0ec',
                                                fontVariantNumeric:
                                                    'tabular-nums',
                                                color: '#52525b',
                                            }}
                                        >
                                            {r.arrived_at}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px',
                                                borderBottom:
                                                    '1px solid #eef0ec',
                                                textAlign: 'right',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent:
                                                        'flex-end',
                                                    gap: 4,
                                                }}
                                            >
                                                {r.status === 'espera' && (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                onReorder(
                                                                    r.id,
                                                                    'up',
                                                                )
                                                            }
                                                            title="Subir en cola"
                                                            style={{
                                                                height: 28,
                                                                width: 28,
                                                                borderRadius: 7,
                                                                border: '1px solid #dfe7df',
                                                                background:
                                                                    '#F6F9F5',
                                                                cursor: 'pointer',
                                                                fontSize: 13,
                                                                fontFamily:
                                                                    'inherit',
                                                            }}
                                                        >
                                                            ↑
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                onReorder(
                                                                    r.id,
                                                                    'down',
                                                                )
                                                            }
                                                            title="Bajar en cola"
                                                            style={{
                                                                height: 28,
                                                                width: 28,
                                                                borderRadius: 7,
                                                                border: '1px solid #dfe7df',
                                                                background:
                                                                    '#F6F9F5',
                                                                cursor: 'pointer',
                                                                fontSize: 13,
                                                                fontFamily:
                                                                    'inherit',
                                                            }}
                                                        >
                                                            ↓
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                onPatchStatus(
                                                                    r.id,
                                                                    'en_consulta',
                                                                )
                                                            }
                                                            style={{
                                                                height: 28,
                                                                padding:
                                                                    '0 10px',
                                                                borderRadius: 7,
                                                                border: 'none',
                                                                background:
                                                                    '#2563EB',
                                                                color: '#fff',
                                                                fontWeight: 500,
                                                                fontSize: 12,
                                                                cursor: 'pointer',
                                                                fontFamily:
                                                                    'inherit',
                                                            }}
                                                        >
                                                            Llamar
                                                        </button>
                                                    </>
                                                )}
                                                {r.status ===
                                                    'en_consulta' && (
                                                    <button
                                                        onClick={() =>
                                                            onPatchStatus(
                                                                r.id,
                                                                'atendido',
                                                            )
                                                        }
                                                        style={{
                                                            height: 28,
                                                            padding:
                                                                '0 10px',
                                                            borderRadius: 7,
                                                            border: 'none',
                                                            background:
                                                                '#2E8B3E',
                                                            color: '#fff',
                                                            fontWeight: 500,
                                                            fontSize: 12,
                                                            cursor: 'pointer',
                                                            fontFamily:
                                                                'inherit',
                                                        }}
                                                    >
                                                        ✓ Atendido
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() =>
                                                        onPatchStatus(
                                                            r.id,
                                                            'no_asistio',
                                                        )
                                                    }
                                                    title="No asistió"
                                                    style={{
                                                        height: 28,
                                                        width: 28,
                                                        borderRadius: 7,
                                                        border: '1px solid #dfe7df',
                                                        background:
                                                            '#F6F9F5',
                                                        color: '#71717a',
                                                        cursor: 'pointer',
                                                        fontSize: 12,
                                                        fontFamily:
                                                            'inherit',
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
