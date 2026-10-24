// ─── Tablero Types ────────────────────────────────────────────────────────────

export type TurnRow = {
    id: number;
    turn_number: number;
    turn_order: number;
    patient_name: string;
    patient_initials: string;
    patient_document: string;
    patient_age: number;
    patient_sex: string;
    doctor_id: number;
    doctor_name: string;
    doctor_specialty: string;
    arrived_at: string;
    status: 'espera' | 'en_consulta';
    appointment_id: number | null;
};

export type CitaRow = {
    id: number;
    appointment_time: string | null;
    patient_id: number;
    patient_name: string;
    patient_initials: string;
    patient_phone: string | null;
    doctor_id: number;
    doctor_name: string;
    doctor_specialty: string;
    type: string;
    status: 'pendiente' | 'confirmada' | 'cancelada' | 'no_asistio';
    notes: string | null;
    turn_number: number | null;
    has_turn: boolean;
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
