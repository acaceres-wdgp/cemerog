import Panel from '@/components/cemerog/Panel';
import { AppointmentRow, DoctorOption } from '../types';
import { formatDateLong } from '../lib/dates';
import { TodayRows } from './TodayRows';
import { FutureRows } from './FutureRows';

const thBaseClassName =
    'text-left font-semibold text-table-header-text bg-table-header-bg border-b border-success-border whitespace-nowrap text-[11.5px] tracking-[.05em] uppercase px-3 h-10';

type CitasTableProps = {
    filtered: AppointmentRow[];
    doctors: DoctorOption[];
    date: string;
    is_today: boolean;
    pendingCount: number;
    bySlot: Record<string, AppointmentRow[]>;
    noSlot: AppointmentRow[];
    todayRows: AppointmentRow[];
    onNewCita: () => void;
    onCancel: (id: number) => void;
};

export function CitasTable({
    filtered,
    doctors,
    date,
    is_today,
    pendingCount,
    bySlot,
    noSlot,
    todayRows,
    onNewCita,
    onCancel,
}: CitasTableProps) {
    return (
        <Panel noPadding noShadow className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider px-5 py-[14px]">
                <div>
                    <div className="font-serif text-[17px] font-semibold text-text-heading capitalize">
                        {formatDateLong(date)}
                    </div>
                    <div className="text-[13px] text-muted">
                        {filtered.length}{' '}
                        {filtered.length === 1 ? 'cita' : 'citas'} ·{' '}
                        {pendingCount} pendientes
                        {is_today &&
                            ' · Los turnos se gestionan desde el Tablero'}
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse">
                    <thead>
                        <tr>
                            <th className={`${thBaseClassName} pl-5`}>
                                {is_today ? 'Estado' : 'Hora'}
                            </th>
                            <th className={thBaseClassName}>Paciente</th>
                            <th className={thBaseClassName}>Médico</th>
                            <th className={thBaseClassName}>Tipo</th>
                            <th className={thBaseClassName}>Cita</th>
                            <th
                                className={`${thBaseClassName} text-right`}
                            ></th>
                        </tr>
                    </thead>
                    <tbody>
                        {is_today ? (
                            <TodayRows
                                rows={todayRows}
                                doctors={doctors}
                                onNewCita={onNewCita}
                                onCancel={onCancel}
                            />
                        ) : (
                            <FutureRows
                                bySlot={bySlot}
                                noSlot={noSlot}
                                doctors={doctors}
                                onNewCita={onNewCita}
                                onCancel={onCancel}
                            />
                        )}
                    </tbody>
                </table>
            </div>
        </Panel>
    );
}
