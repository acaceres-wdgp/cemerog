// ─── Shared types for the Citas module ────────────────────────────────────────

export type AppointmentRow = {
    id: number;
    patient_id: number;
    patient_name: string;
    patient_initials: string;
    doctor_id: number;
    doctor_name: string;
    doctor_specialty: string;
    appointment_date: string;
    appointment_time: string | null;
    turn_number: number | null;
    turn_order: number | null;
    type: string;
    status:
        | 'pendiente'
        | 'confirmada'
        | 'en_lista'
        | 'atendida'
        | 'no_asistio'
        | 'cancelada';
    notes: string | null;
};

export type DoctorOption = {
    id: number;
    name: string;
    specialty: string;
    initials: string;
};

export type PatientResult = {
    id: number;
    full_name: string;
    document_number: string;
};
