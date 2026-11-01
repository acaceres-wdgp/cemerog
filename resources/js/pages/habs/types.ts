export type RoomTypeRow = {
    id: number;
    name: string;
    daily_price: number;
    rooms: number;
};

export type BedStatus = 'libre' | 'ocupada' | 'limpieza';

export type AdminBed = {
    id: number;
    name: string;
    status: BedStatus;
    patient: string | null;
};

export type AdminRoom = {
    id: number;
    name: string;
    type_id: number;
    type: string;
    daily_price: number;
    beds: AdminBed[];
};

export const BED_STATUS: Record<BedStatus, { label: string; pill: string }> = {
    libre: { label: 'Libre', pill: 'bg-accent-bg text-accent-fg' },
    ocupada: {
        label: 'Ocupada',
        pill: 'state-internado bg-[var(--state-bg)] text-[var(--state-text)]',
    },
    limpieza: {
        label: 'En limpieza',
        pill: 'state-espera bg-[var(--state-bg)] text-[var(--state-text)]',
    },
};
