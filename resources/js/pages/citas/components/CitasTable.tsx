import { AppointmentRow, DoctorOption } from '../types';
import { formatDateLong } from '../lib/dates';
import { TodayRows } from './TodayRows';
import { FutureRows } from './FutureRows';

const thBaseClassName =
    'text-left font-semibold text-table-header-text bg-table-header-bg border-b border-success-border whitespace-nowrap';

const thStyle: React.CSSProperties = {
    fontSize: 11.5,
    letterSpacing: '.05em',
    textTransform: 'uppercase',
    padding: '0 12px',
    height: 40,
};

type CitasTableProps = {
    filtered: AppointmentRow[];
    doctors: DoctorOption[];
    date: string;
    is_today: boolean;
    pendingCount: number;
    bySlot: Record<string, AppointmentRow>;
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
        <div
            style={{
                borderRadius: 14,
                overflow: 'hidden',
            }}
            className="border border-card-border bg-white"
        >
            <div
                style={{
                    padding: '14px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                }}
                className="border-b border-divider"
            >
                <div>
                    <div
                        style={{
                            fontFamily: 'Bitter,Georgia,serif',
                            fontWeight: 600,
                            fontSize: 17,
                            textTransform: 'capitalize',
                        }}
                        className="text-text-heading"
                    >
                        {formatDateLong(date)}
                    </div>
                    <div style={{ fontSize: 13 }} className="text-muted">
                        {filtered.length}{' '}
                        {filtered.length === 1 ? 'cita' : 'citas'} ·{' '}
                        {pendingCount} pendientes
                        {is_today &&
                            ' · Los turnos se gestionan desde el Tablero'}
                    </div>
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table
                    style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        minWidth: 700,
                    }}
                >
                    <thead>
                        <tr>
                            <th
                                style={{ ...thStyle, paddingLeft: 20 }}
                                className={thBaseClassName}
                            >
                                {is_today ? 'Estado' : 'Hora'}
                            </th>
                            <th style={thStyle} className={thBaseClassName}>
                                Paciente
                            </th>
                            <th style={thStyle} className={thBaseClassName}>
                                Médico
                            </th>
                            <th style={thStyle} className={thBaseClassName}>
                                Tipo
                            </th>
                            <th style={thStyle} className={thBaseClassName}>
                                Cita
                            </th>
                            <th
                                style={{ ...thStyle, textAlign: 'right' }}
                                className={thBaseClassName}
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
        </div>
    );
}
