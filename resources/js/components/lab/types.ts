export type LabCatalogItem = {
    id: number;
    code: string;
    name: string;
    category: string;
    price: number;
    preparation: string | null;
};

export type ImagingCatalogItem = {
    id: number;
    code: string;
    name: string;
    modality: string;
    price: number;
    preparation: string | null;
};

/** What «Ordenar estudios» has selected */
export type StudySelection = { lab: number[]; imaging: number[] };

export type LabOrderStatus =
    | 'ordenada'
    | 'muestra'
    | 'ingresado'
    | 'validada'
    | 'entregada'
    | 'cancelada';

export type LabOrderSummary = {
    id: number;
    number: string;
    status: LabOrderStatus;
    ordered_at: string;
    ordered_time: string;
    tests: string[];
    total: number;
    indication: string | null;
    cancel_reason: string | null;
    validated_at?: string | null;
    results?: LabResultLine[];
};

export type LabResultLine = {
    test: string;
    name: string;
    value: string | null;
    reference: string;
    out_of_range: boolean;
};

const pill = (tone: string) =>
    `${tone} bg-[var(--state-bg)] text-[var(--state-text)]`;

/** Label, colour and next step of each status, as in the design */
export const LAB_STATUS: Record<
    LabOrderStatus,
    { label: string; pill: string; next: string }
> = {
    ordenada: {
        label: 'Ordenada',
        pill: pill('state-espera'),
        next: 'Tomar muestra',
    },
    muestra: {
        label: 'Muestra tomada',
        pill: pill('state-consulta'),
        next: 'Ingresar resultados',
    },
    ingresado: {
        label: 'Resultado ingresado',
        pill: pill('state-internado'),
        next: 'Validar',
    },
    validada: {
        label: 'Validada',
        pill: 'bg-accent-bg text-accent-fg',
        next: 'Entregar',
    },
    entregada: {
        label: 'Entregada',
        pill: pill('state-cancelada'),
        next: 'Ver resultado',
    },
    cancelada: { label: 'Cancelada', pill: pill('state-cancelada'), next: '' },
};
