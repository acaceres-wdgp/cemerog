import type { TurnRow } from '../types';

interface TurnosPanelProps {
    turns: TurnRow[];
    activeTab: string;
    onTabChange: (tab: string) => void;
    onPatchStatus: (id: number, status: string) => void;
    onReorder: (id: number, dir: 'up' | 'down') => void;
}

const TURN_TABS_STATIC = [
    { key: 'todas', label: 'Todas' },
    { key: 'espera', label: 'En espera' },
    { key: 'consulta', label: 'En consulta' },
    { key: 'emergencia', label: 'Emergencia' },
    { key: 'internados', label: 'Internados' },
];

export function TurnosPanel({
    turns,
    activeTab,
    onTabChange,
    onPatchStatus,
    onReorder,
}: TurnosPanelProps) {
    const TURN_TABS = TURN_TABS_STATIC.map((t) => ({
        ...t,
        n:
            t.key === 'todas'
                ? turns.length
                : t.key === 'espera'
                  ? turns.filter((r) => r.status === 'espera').length
                  : t.key === 'consulta'
                    ? turns.filter((r) => r.status === 'en_consulta').length
                    : 0,
    }));

    const filteredTurns =
        activeTab === 'todas'
            ? turns
            : activeTab === 'espera'
              ? turns.filter((t) => t.status === 'espera')
              : activeTab === 'consulta'
                ? turns.filter((t) => t.status === 'en_consulta')
                : [];

    return (
        <div className="overflow-hidden rounded-[14px] border border-card-border bg-card-bg">
            {/* Header + tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-[16px_20px]">
                <div className="flex items-center gap-2.5">
                    <span className="font-serif text-[18px] font-semibold text-text-heading">
                        Atenciones
                    </span>
                    <span className="inline-flex h-[22px] min-w-[24px] items-center justify-center rounded-full border border-card-border bg-app-bg px-[7px] text-xs font-semibold">
                        {filteredTurns.length}
                    </span>
                </div>
                <div className="inline-flex gap-0.5 rounded-[11px] border border-card-border bg-app-bg p-[3px]">
                    {TURN_TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => onTabChange(t.key)}
                            className={`h-[30px] cursor-pointer rounded-[10px] border-0 px-3 font-[inherit] text-sm font-medium whitespace-nowrap ${
                                activeTab === t.key
                                    ? 'bg-card-bg text-text-heading shadow-[0_1px_3px_rgba(0,0,0,.1)]'
                                    : 'bg-transparent text-secondary-fg'
                            }`}
                        >
                            {t.label}{' '}
                            <span className="font-normal text-muted">
                                {t.n}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] border-collapse">
                    <thead>
                        <tr>
                            <th className="h-10 border-b border-success-border bg-table-header-bg pr-3 pl-4 text-left text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase">
                                Turno
                            </th>
                            <th className="h-10 border-b border-success-border bg-table-header-bg px-3 text-left text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase">
                                Paciente
                            </th>
                            <th className="h-10 border-b border-success-border bg-table-header-bg px-3 text-left text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase">
                                Médico
                            </th>
                            <th className="h-10 border-b border-success-border bg-table-header-bg px-3 text-left text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase">
                                Especialidad
                            </th>
                            <th className="h-10 border-b border-success-border bg-table-header-bg px-3 text-left text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase">
                                Llegada
                            </th>
                            <th className="h-10 border-b border-success-border bg-table-header-bg px-3 text-right text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTurns.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="p-[32px_20px] text-center text-[13px] text-text-tertiary"
                                >
                                    No hay pacientes en espera en este momento.
                                </td>
                            </tr>
                        ) : (
                            filteredTurns.map((r) => (
                                <tr key={r.id} className="bg-card-bg">
                                    <td
                                        className={`border-b border-l-[3px] border-divider p-[12px_16px_12px_13px] font-semibold tabular-nums ${r.status === 'en_consulta' ? 'border-l-consulta-dot' : 'border-l-espera-dot'}`}
                                    >
                                        T-
                                        {String(r.turn_number).padStart(2, '0')}
                                    </td>
                                    <td className="border-b border-divider p-3">
                                        <div className="flex items-center gap-2.5">
                                            <span className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-accent-bg text-xs font-semibold text-primary">
                                                {r.patient_initials}
                                            </span>
                                            <div>
                                                <div className="font-semibold">
                                                    {r.patient_name}
                                                </div>
                                                <div className="text-xs text-muted">
                                                    {r.patient_document} ·{' '}
                                                    {r.patient_age} años ·{' '}
                                                    {r.patient_sex}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="border-b border-divider p-3 text-text-dim">
                                        {r.doctor_name}
                                    </td>
                                    <td className="border-b border-divider p-3 text-[13px] text-muted">
                                        {r.doctor_specialty}
                                    </td>
                                    <td className="border-b border-divider p-3 text-text-dim tabular-nums">
                                        {r.arrived_at}
                                    </td>
                                    <td className="border-b border-divider p-3 text-right">
                                        <div className="flex justify-end gap-1">
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
                                                        className="h-[28px] w-[28px] cursor-pointer rounded-[7px] border border-secondary-border bg-secondary-bg font-[inherit] text-[13px]"
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
                                                        className="h-[28px] w-[28px] cursor-pointer rounded-[7px] border border-secondary-border bg-secondary-bg font-[inherit] text-[13px]"
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
                                                        className="h-[28px] cursor-pointer rounded-[7px] border-0 bg-consulta-dot px-[10px] font-[inherit] text-xs font-medium text-white"
                                                    >
                                                        Llamar
                                                    </button>
                                                </>
                                            )}
                                            {r.status === 'en_consulta' && (
                                                <button
                                                    onClick={() =>
                                                        onPatchStatus(
                                                            r.id,
                                                            'atendido',
                                                        )
                                                    }
                                                    className="h-[28px] cursor-pointer rounded-[7px] border-0 bg-primary px-[10px] font-[inherit] text-xs font-medium text-white"
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
                                                className="h-[28px] w-[28px] cursor-pointer rounded-[7px] border border-secondary-border bg-secondary-bg font-[inherit] text-xs text-muted"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
