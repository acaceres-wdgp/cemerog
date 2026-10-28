// ─── Types ────────────────────────────────────────────────────────────────────

export type Diagnostico = { code: string; label: string };

export type Vitals = {
    peso: number | null;
    talla: number | null;
    temp: number | null;
    presion_arterial: string | null;
    frecuencia_cardiaca: number | null;
    frecuencia_respiratoria: number | null;
    saturacion_o2: number | null;
    glucemia: number | null;
};

export type PatientInfo = {
    id: number;
    full_name: string;
    age: number;
    sex: string;
    allergies: string | null;
};

export type DoctorInfo = {
    id: number;
    full_name: string;
    specialty: string | null;
};

export type TurnItem = {
    id: number;
    turn_number: number;
    turn_order: number;
    status: string;
    arrived_at: string;
    patient: PatientInfo;
    doctor: DoctorInfo;
};

export type HistorialEntry = {
    id: number;
    consulted_at: string;
    doctor: { id: number; full_name: string; specialty: string | null };
    motivo_consulta: string | null;
    historia_enfermedad: string | null;
    examen_fisico: string | null;
    diagnosticos: Diagnostico[] | null;
    plan_tratamiento: string | null;
    vitals: Vitals;
};

export type AntecedentData = {
    personales: string | null;
    quirurgicos: string | null;
    medicamentos: string | null;
    familiares: string | null;
    alergias: string | null;
} | null;

export type NoteFormData = {
    motivo_consulta: string;
    historia_enfermedad: string;
    examen_fisico: string;
    plan_tratamiento: string;
    presion_arterial: string;
    frecuencia_cardiaca: string;
    frecuencia_respiratoria: string;
    temp: string;
    saturacion_o2: string;
    glucemia: string;
    peso: string;
    talla: string;
    diagnosticos: Diagnostico[];
};

export type Props = {
    turns_en_consulta: TurnItem[];
    turns_en_espera: TurnItem[];
    historial?: HistorialEntry[];
    historial_patient?: PatientInfo & { antecedents: AntecedentData };
};
