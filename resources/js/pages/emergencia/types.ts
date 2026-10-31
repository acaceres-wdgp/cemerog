export type EmergencyPatient = {
    id: number;
    full_name: string;
    sex: 'M' | 'F';
    age: number | null;
    document_number: string | null;
    profile_incomplete: boolean;
};

export type EmergencyRow = {
    id: number;
    number: string;
    status: 'activa' | 'alta';
    arrived_at: string;
    arrived_time: string;
    reason: string;
    doctor: string;
    cubicle: { id: number; name: string };
    patient: EmergencyPatient;
    last_vital: string | null;
    last_vital_time: string | null;
};

export type VitalReading = {
    id: number;
    time: string;
    presion_arterial: string;
    frecuencia_cardiaca: number;
    frecuencia_respiratoria: number;
    temp: number;
    saturacion_o2: number;
    glucemia: number | null;
    taken_by: string;
};

export type ApplicationKind = 'medicamento' | 'insumo';

export type Application = {
    id: number;
    kind: ApplicationKind;
    time: string;
    description: string;
    quantity: number;
    route: string | null;
    total: number;
    brought_by_patient: boolean;
    stock_left: number | null;
    applied_by: string;
};

export type CatalogItem = {
    id: number;
    code: string;
    name: string;
    presentation: string | null;
    kind: ApplicationKind;
    price: number;
    stock: number;
};

export type CubicleCell = {
    id: number;
    name: string;
    emergency_id: number | null;
    patient: string | null;
};

export type EmergencyDetail = EmergencyRow & {
    arrived_on: string;
    patient: EmergencyPatient & {
        document_type: string;
        birth_date: string | null;
        phone: string | null;
        allergies: string | null;
        blood_type: string | null;
        emergency_contact_name: string | null;
        expediente_number: string;
    };
    account: { id: number; total: number; charges_count: number };
};

/** «7 min», «1 h 05 min» since a moment */
export function elapsed(fromIso: string, now: number): string {
    const minutes = Math.max(
        0,
        Math.floor((now - new Date(fromIso).getTime()) / 60000),
    );
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    return `${h} h ${String(minutes % 60).padStart(2, '0')} min`;
}

export const SEX_LABELS = { M: 'M', F: 'F' } as const;
