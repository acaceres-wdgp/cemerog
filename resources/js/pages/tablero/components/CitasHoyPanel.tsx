import { router } from '@inertiajs/react';
import type { CitaRow, DoctorOption } from '../types';

const TYPE_LABELS: Record<string, string> = {
    consulta: 'Consulta',
    seguimiento: 'Seguimiento',
    primera_vez: 'Primera vez',
};

const CITA_STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
    pendiente: { bg: '#FEF3C7', fg: '#92400E' },
    confirmada: { bg: '#DBEAFE', fg: '#1E40AF' },
    no_asistio: { bg: '#F4F4F5', fg: '#52525B' },
};

const CITA_STATUS_LABELS: Record<string, string> = {
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    no_asistio: 'No asistió',
};

const DOC_PALETTES = [
    { bg: '#EEF6E2', fg: '#2E8B3E' },
    { bg: '#DBEAFE', fg: '#1E40AF' },
    { bg: '#EDE9FE', fg: '#5B21B6' },
    { bg: '#FCE7F3', fg: '#9D174D' },
    { bg: '#CFFAFE', fg: '#155E75' },
    { bg: '#FEF3C7', fg: '#92400E' },
];
const docPalette = (id: number) => DOC_PALETTES[id % DOC_PALETTES.length];

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

interface CitasHoyPanelProps {
    appointments: CitaRow[];
    doctors: DoctorOption[];
    citaTab: string;
    onCitaTabChange: (tab: string) => void;
    onAssign: (cita: CitaRow) => void;
    onNoShow: (cita: CitaRow) => void;
}

export function CitasHoyPanel({
    appointments,
    doctors,
    citaTab,
    onCitaTabChange,
    onAssign,
    onNoShow,
}: CitasHoyPanelProps) {
    const pendingCitas = appointments.filter((c) => !c.has_turn);
    const visibleCitas = citaTab === 'pendientes' ? pendingCitas : appointments;

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
                    padding: '14px 16px',
                    gap: 12,
                    flexWrap: 'wrap',
                }}
            >
                <div>
                    <div
                        style={{
                            fontFamily: 'Bitter,Georgia,serif',
                            fontWeight: 600,
                            fontSize: 16,
                            color: '#1f2d22',
                        }}
                    >
                        Citas de hoy
                    </div>
                    <div style={{ fontSize: 13, color: '#71717a' }}>
                        {appointments.length}{' '}
                        {appointments.length === 1 ? 'cita' : 'citas'} ·{' '}
                        {pendingCitas.length} sin turno asignado
                    </div>
                </div>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                    }}
                >
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
                        {[
                            {
                                key: 'pendientes',
                                label: 'Sin turno',
                                n: pendingCitas.length,
                            },
                            {
                                key: 'todas',
                                label: 'Todas',
                                n: appointments.length,
                            },
                        ].map((t) => (
                            <button
                                key={t.key}
                                onClick={() => onCitaTabChange(t.key)}
                                style={{
                                    whiteSpace: 'nowrap',
                                    height: 30,
                                    padding: '0 12px',
                                    border: 'none',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: 13,
                                    background:
                                        citaTab === t.key
                                            ? '#fff'
                                            : 'transparent',
                                    color:
                                        citaTab === t.key
                                            ? '#1f2d22'
                                            : '#52605a',
                                    boxShadow:
                                        citaTab === t.key
                                            ? '0 1px 3px rgba(0,0,0,.1)'
                                            : 'none',
                                    fontFamily: 'inherit',
                                }}
                            >
                                {t.label}{' '}
                                <span
                                    style={{
                                        color: '#a1a1aa',
                                        fontVariantNumeric: 'tabular-nums',
                                    }}
                                >
                                    {t.n}
                                </span>
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => router.visit('/citas')}
                        style={{
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            height: 36,
                            padding: '0 14px',
                            borderRadius: 10,
                            border: '1px solid #dfe7df',
                            background: '#F6F9F5',
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: 14,
                        }}
                    >
                        📅 Ver agenda
                    </button>
                </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table
                    style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: 13.5,
                        minWidth: 860,
                    }}
                >
                    <thead>
                        <tr>
                            {[
                                'Hora',
                                'Paciente',
                                'Teléfono',
                                'Médico',
                                'Tipo',
                                'Cita',
                                'Acciones',
                            ].map((h) => (
                                <th
                                    key={h}
                                    style={{
                                        ...thStyle,
                                        textAlign:
                                            h === 'Acciones'
                                                ? 'right'
                                                : 'left',
                                    }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {visibleCitas.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    style={{
                                        padding: '32px 20px',
                                        textAlign: 'center',
                                        color: '#8a948e',
                                        fontSize: 13,
                                    }}
                                >
                                    No hay citas{' '}
                                    {citaTab === 'pendientes'
                                        ? 'sin turno asignado'
                                        : ''}{' '}
                                    para hoy.
                                </td>
                            </tr>
                        ) : (
                            visibleCitas.map((c) => {
                                const stColor = CITA_STATUS_COLORS[
                                    c.status
                                ] ?? { bg: '#F4F4F5', fg: '#52525B' };
                                const rowBg = c.has_turn
                                    ? '#F8FBF6'
                                    : '#fff';
                                const pal = docPalette(c.doctor_id);
                                return (
                                    <tr
                                        key={c.id}
                                        style={{ background: rowBg }}
                                    >
                                        <td
                                            style={{
                                                padding: '10px 12px',
                                                borderBottom:
                                                    '1px solid #eef0ec',
                                                fontWeight: 600,
                                                fontVariantNumeric:
                                                    'tabular-nums',
                                                color: c.has_turn
                                                    ? '#71717a'
                                                    : '#1f2d22',
                                            }}
                                        >
                                            {c.appointment_time ?? '—'}
                                        </td>
                                        <td
                                            style={{
                                                padding: '10px 12px',
                                                borderBottom:
                                                    '1px solid #eef0ec',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontWeight: 500,
                                                    color: c.has_turn
                                                        ? '#71717a'
                                                        : '#1f2d22',
                                                }}
                                            >
                                                {c.patient_name}
                                            </div>
                                            {c.notes && (
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        color: '#71717a',
                                                    }}
                                                >
                                                    {c.notes.length > 40
                                                        ? c.notes.slice(
                                                              0,
                                                              40,
                                                          ) + '…'
                                                        : c.notes}
                                                </div>
                                            )}
                                        </td>
                                        <td
                                            style={{
                                                padding: '10px 12px',
                                                borderBottom:
                                                    '1px solid #eef0ec',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {c.patient_phone ? (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems:
                                                            'center',
                                                        gap: 6,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontVariantNumeric:
                                                                'tabular-nums',
                                                            color: c.has_turn
                                                                ? '#71717a'
                                                                : '#1f2d22',
                                                        }}
                                                    >
                                                        {c.patient_phone}
                                                    </span>
                                                    <a
                                                        href={`tel:${c.patient_phone}`}
                                                        style={{
                                                            width: 28,
                                                            height: 28,
                                                            borderRadius: 8,
                                                            border: '1px solid #e4e4e7',
                                                            display:
                                                                'inline-flex',
                                                            alignItems:
                                                                'center',
                                                            justifyContent:
                                                                'center',
                                                            fontSize: 14,
                                                        }}
                                                    >
                                                        📞
                                                    </a>
                                                </div>
                                            ) : (
                                                <span
                                                    style={{
                                                        color: '#a1a1aa',
                                                    }}
                                                >
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td
                                            style={{
                                                padding: '10px 12px',
                                                borderBottom:
                                                    '1px solid #eef0ec',
                                                whiteSpace: 'nowrap',
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
                                                    // dynamic-style: doctor avatar bg/fg from palette indexed by doctor_id at runtime
                                                    style={{
                                                        width: 22,
                                                        height: 22,
                                                        flexShrink: 0,
                                                        borderRadius: '50%',
                                                        background: pal.bg,
                                                        color: pal.fg,
                                                        display:
                                                            'inline-flex',
                                                        alignItems:
                                                            'center',
                                                        justifyContent:
                                                            'center',
                                                        fontSize: 10,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {(() => {
                                                        const d =
                                                            doctors.find(
                                                                (x) =>
                                                                    x.id ===
                                                                    c.doctor_id,
                                                            );
                                                        return (
                                                            d?.initials ??
                                                            '?'
                                                        );
                                                    })()}
                                                </span>
                                                <span
                                                    style={{
                                                        color: '#52525b',
                                                    }}
                                                >
                                                    {c.doctor_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td
                                            style={{
                                                padding: '10px 12px',
                                                borderBottom:
                                                    '1px solid #eef0ec',
                                                whiteSpace: 'nowrap',
                                                color: '#52525b',
                                            }}
                                        >
                                            {TYPE_LABELS[c.type] ?? c.type}
                                        </td>
                                        <td
                                            style={{
                                                padding: '10px 12px',
                                                borderBottom:
                                                    '1px solid #eef0ec',
                                            }}
                                        >
                                            {c.has_turn ? (
                                                <span
                                                    style={{
                                                        display:
                                                            'inline-flex',
                                                        alignItems:
                                                            'center',
                                                        whiteSpace:
                                                            'nowrap',
                                                        padding: '2px 9px',
                                                        borderRadius: 999,
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        background:
                                                            '#DCFCE7',
                                                        color: '#166534',
                                                    }}
                                                >
                                                    ✓ T-
                                                    {String(
                                                        c.turn_number,
                                                    ).padStart(2, '0')}{' '}
                                                    · En cola
                                                </span>
                                            ) : (
                                                <span
                                                    // dynamic-style: cita status badge color from CITA_STATUS_COLORS map at runtime
                                                    style={{
                                                        display:
                                                            'inline-flex',
                                                        alignItems:
                                                            'center',
                                                        whiteSpace:
                                                            'nowrap',
                                                        padding: '2px 9px',
                                                        borderRadius: 999,
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        background:
                                                            stColor.bg,
                                                        color: stColor.fg,
                                                    }}
                                                >
                                                    {CITA_STATUS_LABELS[
                                                        c.status
                                                    ] ?? c.status}
                                                </span>
                                            )}
                                        </td>
                                        <td
                                            style={{
                                                padding: '10px 12px',
                                                borderBottom:
                                                    '1px solid #eef0ec',
                                                textAlign: 'right',
                                            }}
                                        >
                                            {!c.has_turn && (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent:
                                                            'flex-end',
                                                        gap: 6,
                                                    }}
                                                >
                                                    <button
                                                        onClick={() =>
                                                            onAssign(c)
                                                        }
                                                        style={{
                                                            whiteSpace:
                                                                'nowrap',
                                                            display:
                                                                'inline-flex',
                                                            alignItems:
                                                                'center',
                                                            gap: 6,
                                                            height: 30,
                                                            padding:
                                                                '0 10px',
                                                            borderRadius: 8,
                                                            border: 'none',
                                                            background:
                                                                '#2E8B3E',
                                                            color: '#fff',
                                                            fontWeight: 500,
                                                            fontSize: 12.5,
                                                            cursor: 'pointer',
                                                            fontFamily:
                                                                'inherit',
                                                        }}
                                                    >
                                                        + Asignar turno
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            onNoShow(c)
                                                        }
                                                        style={{
                                                            whiteSpace:
                                                                'nowrap',
                                                            display:
                                                                'inline-flex',
                                                            alignItems:
                                                                'center',
                                                            gap: 6,
                                                            height: 30,
                                                            padding:
                                                                '0 10px',
                                                            borderRadius: 8,
                                                            border: '1px solid #dfe7df',
                                                            background:
                                                                '#F6F9F5',
                                                            color: '#52525b',
                                                            fontWeight: 500,
                                                            fontSize: 12.5,
                                                            cursor: 'pointer',
                                                            fontFamily:
                                                                'inherit',
                                                        }}
                                                    >
                                                        ✕ No asistió
                                                    </button>
                                                </div>
                                            )}
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
