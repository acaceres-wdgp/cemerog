import { router } from '@inertiajs/react';
import type { CitaRow, DoctorOption } from '../types';
import {
    docPalette,
    CITA_STATUS_COLORS,
    BADGE_FALLBACK,
} from '@/components/cemerog/palettes';

const TYPE_LABELS: Record<string, string> = {
    consulta: 'Consulta',
    seguimiento: 'Seguimiento',
    primera_vez: 'Primera vez',
};

const CITA_STATUS_LABELS: Record<string, string> = {
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    no_asistio: 'No asistió',
    cancelada: 'Cancelada',
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
        <div className="overflow-hidden rounded-[14px] border border-card-border bg-card-bg">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-[14px_16px]">
                <div>
                    <div className="font-serif text-[16px] font-semibold text-text-heading">
                        Citas de hoy
                    </div>
                    <div className="text-[13px] text-muted">
                        {appointments.length}{' '}
                        {appointments.length === 1 ? 'cita' : 'citas'} ·{' '}
                        {pendingCitas.length} sin turno asignado
                    </div>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="inline-flex gap-0.5 rounded-[11px] border border-card-border bg-app-bg p-[3px]">
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
                                className={`h-[30px] cursor-pointer rounded-[8px] border-0 px-3 font-[inherit] text-[13px] font-medium whitespace-nowrap ${
                                    citaTab === t.key
                                        ? 'bg-card-bg text-text-heading shadow-[0_1px_3px_rgba(0,0,0,.1)]'
                                        : 'bg-transparent text-secondary-fg'
                                }`}
                            >
                                {t.label}{' '}
                                <span className="text-muted-light tabular-nums">
                                    {t.n}
                                </span>
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => router.visit('/citas')}
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-secondary-border bg-secondary-bg px-[14px] font-[inherit] text-sm font-medium whitespace-nowrap"
                    >
                        📅 Ver agenda
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] border-collapse text-[13.5px]">
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
                                    className={`h-10 border-b border-success-border bg-table-header-bg px-3 text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase ${h === 'Acciones' ? 'text-right' : 'text-left'}`}
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
                                    className="p-[32px_20px] text-center text-[13px] text-text-tertiary"
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
                                // dynamic-style: cita status badge — bg/fg vary per c.status at runtime
                                const stColor =
                                    CITA_STATUS_COLORS[c.status] ??
                                    BADGE_FALLBACK;
                                // dynamic-style: doctor avatar bg/fg from palette indexed by c.doctor_id at runtime
                                const pal = docPalette(c.doctor_id);
                                return (
                                    <tr
                                        key={c.id}
                                        className={
                                            c.has_turn
                                                ? 'bg-list-row-bg'
                                                : 'bg-card-bg'
                                        }
                                    >
                                        <td
                                            className={`border-b border-divider p-[10px_12px] font-semibold tabular-nums ${c.has_turn ? 'text-muted' : 'text-text-heading'}`}
                                        >
                                            {c.appointment_time ?? '—'}
                                        </td>
                                        <td className="border-b border-divider p-[10px_12px]">
                                            <div
                                                className={`font-medium ${c.has_turn ? 'text-muted' : 'text-text-heading'}`}
                                            >
                                                {c.patient_name}
                                            </div>
                                            {c.notes && (
                                                <div className="text-xs text-muted">
                                                    {c.notes.length > 40
                                                        ? c.notes.slice(0, 40) +
                                                          '…'
                                                        : c.notes}
                                                </div>
                                            )}
                                        </td>
                                        <td className="border-b border-divider p-[10px_12px] whitespace-nowrap">
                                            {c.patient_phone ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span
                                                        className={`tabular-nums ${c.has_turn ? 'text-muted' : 'text-text-heading'}`}
                                                    >
                                                        {c.patient_phone}
                                                    </span>
                                                    <a
                                                        href={`tel:${c.patient_phone}`}
                                                        className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-[8px] border border-input-border text-sm"
                                                    >
                                                        📞
                                                    </a>
                                                </div>
                                            ) : (
                                                <span className="text-muted-light">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="border-b border-divider p-[10px_12px] whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    style={{
                                                        // dynamic-style: doctor avatar bg/fg from DOC_PALETTES indexed by doctor_id at runtime
                                                        backgroundColor: pal.bg,
                                                        color: pal.fg,
                                                    }}
                                                    className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                                                >
                                                    {(() => {
                                                        const d = doctors.find(
                                                            (x) =>
                                                                x.id ===
                                                                c.doctor_id,
                                                        );
                                                        return (
                                                            d?.initials ?? '?'
                                                        );
                                                    })()}
                                                </span>
                                                <span className="text-text-dim">
                                                    {c.doctor_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="border-b border-divider p-[10px_12px] whitespace-nowrap text-text-dim">
                                            {TYPE_LABELS[c.type] ?? c.type}
                                        </td>
                                        <td className="border-b border-divider p-[10px_12px]">
                                            {c.has_turn ? (
                                                <span className="inline-flex items-center rounded-full bg-cita-atendida-bg px-[9px] py-[2px] text-xs font-semibold whitespace-nowrap text-cita-atendida-fg">
                                                    ✓ T-
                                                    {String(
                                                        c.turn_number,
                                                    ).padStart(2, '0')}{' '}
                                                    · En cola
                                                </span>
                                            ) : (
                                                <span
                                                    style={{
                                                        // dynamic-style: cita status badge — bg/fg vary per c.status at runtime
                                                        backgroundColor:
                                                            stColor.bg,
                                                        color: stColor.fg,
                                                    }}
                                                    className="inline-flex items-center rounded-full px-[9px] py-[2px] text-xs font-semibold whitespace-nowrap"
                                                >
                                                    {CITA_STATUS_LABELS[
                                                        c.status
                                                    ] ?? c.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="border-b border-divider p-[10px_12px] text-right">
                                            {!c.has_turn && (
                                                <div className="flex justify-end gap-1.5">
                                                    <button
                                                        onClick={() =>
                                                            onAssign(c)
                                                        }
                                                        className="inline-flex h-[30px] cursor-pointer items-center gap-1.5 rounded-[8px] border-0 bg-primary px-[10px] font-[inherit] text-[12.5px] font-medium whitespace-nowrap text-white"
                                                    >
                                                        + Asignar turno
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            onNoShow(c)
                                                        }
                                                        className="inline-flex h-[30px] cursor-pointer items-center gap-1.5 rounded-[8px] border border-secondary-border bg-secondary-bg px-[10px] font-[inherit] text-[12.5px] font-medium whitespace-nowrap text-text-dim"
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
