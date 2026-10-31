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

export type DischargeInfo = {
    type: 'recuperado' | 'traslado' | 'defuncion';
    destination: string | null;
    discharge_diagnosis: string;
    discharged_at: string;
} | null;

export type PrescriptionItemData = {
    id: number;
    position: number;
    medication: string;
    route: string | null;
    dose: string;
    frequency: string;
    duration_days: number | null;
    is_continuous: boolean;
    quantity: number;
};

export type PrescriptionData = {
    id: number;
    general_instructions: string | null;
    prescribed_at: string;
    items: PrescriptionItemData[];
};

/** Unified clinical history entry returned by BuildClinicalHistory */
export type ClinicalEntryType =
    | 'consulta'
    | 'receta'
    | 'alta'
    | 'laboratorio'
    | 'imagen';

export type DischargeDetail = {
    type: 'recuperado' | 'traslado' | 'defuncion';
    destination: string | null;
    discharge_diagnosis: string;
    discharged_at: string;
};

export type ClinicalEntry = {
    type: ClinicalEntryType;
    date: string;
    mine: boolean;
    doctor: DoctorInfo;
    // consulta-specific
    motivo_consulta?: string | null;
    historia_enfermedad?: string | null;
    examen_fisico?: string | null;
    diagnosticos?: Diagnostico[] | null;
    plan_tratamiento?: string | null;
    vitals?: Vitals;
    discharge?: DischargeDetail | null;
    prescription?: PrescriptionData | null;
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
    /** Weight entered in pounds (lb). Converted to kg×10 before submitting. */
    pesoLb: string;
    /** Height entered in feet. Combined with tallaPulgadas and converted to cm before submitting. */
    tallaPies: string;
    /** Height entered in inches (0–11). Combined with tallaPies and converted to cm before submitting. */
    tallaPulgadas: string;
    diagnosticos: Diagnostico[];
};

export type AccountCharge = {
    id: number;
    type: string;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    doctor_fee: number | null;
    doctor_id: number | null;
    doctor_name: string | null;
};

export type Props = {
    can_attend: boolean;
    turns_en_consulta: TurnItem[];
    turns_en_espera: TurnItem[];
    historial?: ClinicalEntry[];
    historial_patient?: PatientInfo & { antecedents: AntecedentData };
    prescriptions?: Record<number, PrescriptionData>;
    charges?: AccountCharge[];
    charges_total?: number;
};
