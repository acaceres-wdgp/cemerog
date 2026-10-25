/**
 * StatusBadge – displays one of the 9 CEMEROG attention states.
 */

type AttentionState =
    | 'espera'
    | 'consulta'
    | 'emergencia'
    | 'internado'
    | 'cirugia'
    | 'pendiente'
    | 'balance'
    | 'saldada'
    | 'cancelada'
    | 'cita-pendiente'
    | 'cita-confirmada'
    | 'cita-en_lista'
    | 'cita-atendida'
    | 'cita-no_asistio'
    | 'cita-cancelada';

interface StatusBadgeProps {
    state: AttentionState;
    label?: string;
    className?: string;
}

const STATE_CONFIG: Record<
    AttentionState,
    { label: string; stateClass: string; noBorder?: boolean }
> = {
    espera: { label: 'En espera', stateClass: 'state-espera' },
    consulta: { label: 'Consulta', stateClass: 'state-consulta' },
    emergencia: { label: 'Emergencia', stateClass: 'state-emergencia' },
    internado: { label: 'Internado', stateClass: 'state-internado' },
    cirugia: { label: 'Cirugía', stateClass: 'state-cirugia' },
    pendiente: { label: 'Pendiente', stateClass: 'state-pendiente' },
    balance: { label: 'Balance', stateClass: 'state-balance' },
    saldada: { label: 'Saldada', stateClass: 'state-saldada' },
    cancelada: { label: 'Cancelada', stateClass: 'state-cancelada' },
    'cita-pendiente': {
        label: 'Pendiente',
        stateClass: 'state-espera',
        noBorder: true,
    },
    'cita-confirmada': {
        label: 'Confirmada',
        stateClass: 'state-cita-confirmada',
        noBorder: true,
    },
    'cita-en_lista': {
        label: 'En lista',
        stateClass: 'state-consulta',
        noBorder: true,
    },
    'cita-atendida': {
        label: 'Atendida',
        stateClass: 'state-cita-atendida',
        noBorder: true,
    },
    'cita-no_asistio': {
        label: 'No asistió',
        stateClass: 'state-cancelada',
        noBorder: true,
    },
    'cita-cancelada': {
        label: 'Cancelada',
        stateClass: 'state-cancelada',
        noBorder: true,
    },
};

export default function StatusBadge({
    state,
    label,
    className = '',
}: StatusBadgeProps) {
    const config = STATE_CONFIG[state];

    return (
        <span
            className={`inline-flex items-center rounded-full text-xs font-semibold ${config.stateClass} bg-[var(--state-bg)] text-[var(--state-text)] ${config.noBorder ? 'px-[9px] py-[2px]' : 'border border-[var(--state-accent)] px-2.5 py-0.5'} ${className}`}
        >
            {label ?? config.label}
        </span>
    );
}
