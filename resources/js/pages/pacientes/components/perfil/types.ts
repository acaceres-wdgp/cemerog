import type {
    ClinicalEntry,
    PrescriptionItemData,
} from '@/pages/consulta/types';

export type ProfileTab =
    | 'resumen'
    | 'historial'
    | 'recetas'
    | 'estudios'
    | 'finanzas';

export type ProfilePatient = {
    id: number;
    expediente_number: string;
    full_name: string;
    initials: string;
    sex: string;
    age: number;
    document_type: string;
    document_number: string;
    birth_date: string;
    phone: string | null;
    address: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    blood_type: string | null;
    allergies: string | null;
    photo_url: string | null;
    created_at: string | null;
};

export type Antecedentes = {
    personales: string | null;
    quirurgicos: string | null;
    medicamentos: string | null;
    familiares: string | null;
};

export type Attention = {
    id: number;
    turn_number: number;
    date: string;
    type: string;
    status: string;
    status_label: string;
    doctor: string;
    specialty: string;
    motivo: string | null;
    diagnostico: string | null;
    discharge: { type: string; discharge_diagnosis: string } | null;
};

export type PaginatedAttentions = {
    data: Attention[];
    current_page: number;
    last_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

export type ProfilePrescription = {
    id: number;
    date: string;
    doctor: string;
    specialty: string;
    diagnostico: string | null;
    general_instructions: string | null;
    items: PrescriptionItemData[];
};

export type AccountStatus =
    | 'abierta'
    | 'pendiente_facturar'
    | 'facturada'
    | 'anulada';

export type ProfileAccount = {
    id: number;
    service_date: string;
    status: AccountStatus;
    total: number;
    charges: {
        id: number;
        description: string;
        quantity: number;
        total: number;
        doctor: string | null;
    }[];
};

export type Finanzas = {
    cuentas: ProfileAccount[];
    total_cargado: number;
    pendiente_facturar: number;
    facturas: never[];
    pagos: never[];
};

export type ProfileProps = {
    patient: ProfilePatient;
    antecedentes: Antecedentes;
    stats: { atenciones: number; ultima_atencion: string | null };
    atenciones: PaginatedAttentions;
    historial: ClinicalEntry[];
    recetas: ProfilePrescription[];
    estudios: never[];
    finanzas: Finanzas | null;
    can_print: boolean;
    tab: ProfileTab;
};

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
    abierta: 'Abierta',
    pendiente_facturar: 'Pendiente de facturar',
    facturada: 'Facturada',
    anulada: 'Anulada',
};

export const SEX_LABELS: Record<string, string> = {
    M: 'Masculino',
    F: 'Femenino',
};
