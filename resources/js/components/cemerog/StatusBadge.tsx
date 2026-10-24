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
    {
        label: string;
        bg: string;
        text: string;
        border: string;
        noBorder?: boolean;
    }
> = {
    espera: {
        label: 'En espera',
        bg: '#FEF3C7',
        text: '#92400E',
        border: '#D97706',
    },
    consulta: {
        label: 'Consulta',
        bg: '#DBEAFE',
        text: '#1E40AF',
        border: '#2563EB',
    },
    emergencia: {
        label: 'Emergencia',
        bg: '#FEE2E2',
        text: '#991B1B',
        border: '#DC2626',
    },
    internado: {
        label: 'Internado',
        bg: '#EDE9FE',
        text: '#5B21B6',
        border: '#7C3AED',
    },
    cirugia: {
        label: 'Cirugía',
        bg: '#FCE7F3',
        text: '#9D174D',
        border: '#DB2777',
    },
    pendiente: {
        label: 'Pendiente',
        bg: '#FFEDD5',
        text: '#9A3412',
        border: '#EA580C',
    },
    balance: {
        label: 'Balance',
        bg: '#CFFAFE',
        text: '#155E75',
        border: '#0891B2',
    },
    saldada: {
        label: 'Saldada',
        bg: '#2E8B3E',
        text: '#FFFFFF',
        border: '#2E8B3E',
    },
    cancelada: {
        label: 'Cancelada',
        bg: '#F4F4F5',
        text: '#52525B',
        border: '#A1A1AA',
    },
    'cita-pendiente': {
        label: 'Pendiente',
        bg: '#FEF3C7',
        text: '#92400E',
        border: '#FEF3C7',
        noBorder: true,
    },
    'cita-confirmada': {
        label: 'Confirmada',
        bg: '#F3F7F2',
        text: '#2E8B3E',
        border: '#F3F7F2',
        noBorder: true,
    },
    'cita-en_lista': {
        label: 'En lista',
        bg: '#DBEAFE',
        text: '#1E40AF',
        border: '#DBEAFE',
        noBorder: true,
    },
    'cita-atendida': {
        label: 'Atendida',
        bg: '#DCFCE7',
        text: '#166534',
        border: '#DCFCE7',
        noBorder: true,
    },
    'cita-no_asistio': {
        label: 'No asistió',
        bg: '#F4F4F5',
        text: '#52525B',
        border: '#F4F4F5',
        noBorder: true,
    },
    'cita-cancelada': {
        label: 'Cancelada',
        bg: '#F4F4F5',
        text: '#52525B',
        border: '#F4F4F5',
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
            className={`inline-flex items-center rounded-full text-xs font-semibold ${config.noBorder ? 'px-[9px] py-[2px]' : 'border px-2.5 py-0.5'} ${className}`}
            style={{
                backgroundColor: config.bg,
                color: config.text,
                ...(config.noBorder ? {} : { borderColor: config.border }),
            }}
        >
            {label ?? config.label}
        </span>
    );
}
