import type { SurgeryOptions } from '@/components/cirugia/types';

export type FreeBed = {
    id: number;
    label: string;
    type: string;
    daily_price: number;
};

export type DoctorOption = { id: number; name: string; specialty: string };

export type AdmissionOptions = {
    beds: FreeBed[];
    doctors: DoctorOption[];
    default_doctor_id: number | null;
    /** «Ingreso para cirugía», for whoever can schedule surgeries */
    surgery?: SurgeryOptions | null;
};

export type AdmissionSummary = {
    id: number;
    number: string;
    status: 'internado' | 'alta';
    patient: { id: number; full_name: string };
    diagnosis: string;
    day: number;
    doctor: string;
    admitted_at: string;
    /** A surgery is scheduled or in progress: «Internado por cirugía» */
    for_surgery?: boolean;
};
