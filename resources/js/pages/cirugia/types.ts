import type { SurgeryStatus } from '@/components/cirugia/types';

export type SurgeryBlock = {
    id: number;
    number: string;
    procedure: string;
    price: number;
    status: SurgeryStatus;
    patient: { id: number; full_name: string };
    surgeon: string;
    surgeon_id: number;
    anesthetist: string | null;
    operating_room: string;
    operating_room_id: number;
    room: string;
    date: string;
    date_label: string;
    start: string;
    end: string;
    duration_minutes: number;
    notes: string | null;
    cancel_reason: string | null;
};
