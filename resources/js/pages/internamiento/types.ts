import type { AdmissionSummary } from '@/components/internamiento/types';

export type BedStatus = 'libre' | 'ocupada' | 'limpieza';

export type MapBed = {
    id: number;
    name: string;
    label: string;
    status: BedStatus;
    cleaning_since: string | null;
    admission: AdmissionSummary | null;
};

export type MapRoom = {
    id: number;
    name: string;
    type: string;
    daily_price: number;
    beds: MapBed[];
};
