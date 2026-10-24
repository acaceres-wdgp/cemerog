import { AppointmentRow, DoctorOption } from '../types';
import { formatDateLong } from '../lib/dates';
import { TodayRows } from './TodayRows';
import { FutureRows } from './FutureRows';

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
                background: '#fff',
                border: '1px solid #e3e9e3',
                borderRadius: 14,
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid #eef0ec',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                }}
            >
                <div>
                    <div
                        style={{
                            fontFamily: 'Bitter,Georgia,serif',
                            fontWeight: 600,
                            fontSize: 17,
                            color: '#1f2d22',
                            textTransform: 'capitalize',
                        }}
                    >
                        {formatDateLong(date)}
                    </div>
                    <div style={{ fontSize: 13, color: '#71717a' }}>
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
                            <th style={{ ...thStyle, paddingLeft: 20 }}>
                                {is_today ? 'Estado' : 'Hora'}
                            </th>
                            <th style={thStyle}>Paciente</th>
                            <th style={thStyle}>Médico</th>
                            <th style={thStyle}>Tipo</th>
                            <th style={thStyle}>Cita</th>
                            <th
                                style={{ ...thStyle, textAlign: 'right' }}
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
