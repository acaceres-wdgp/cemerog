export type ImagingStatus =
    | 'ordenada'
    | 'realizado'
    | 'borrador'
    | 'listo'
    | 'entregado'
    | 'cancelada';

export type ImagingPatient = {
    id: number;
    full_name: string;
    age: number | null;
    sex: string;
    document_number: string | null;
};

export type ImagingOrderSummary = {
    id: number;
    number: string;
    name: string;
    modality: string;
    status: ImagingStatus;
    price: number;
    ordered_at: string;
    ordered_date: string;
    ordered_time: string;
    origin: string;
    doctor: string | null;
    indication: string | null;
    cancel_reason: string | null;
    files_count: number;
};

export type ImagingAttachmentItem = {
    id: number;
    name: string;
    size: number;
    is_image: boolean;
};

export type ImagingOrderDetail = ImagingOrderSummary & {
    findings: string | null;
    conclusion: string | null;
    performed_at: string | null;
    signed_at: string | null;
    signed_by: string | null;
    editable: boolean;
    attachments: ImagingAttachmentItem[];
};

const pill = (tone: string) =>
    `${tone} bg-[var(--state-bg)] text-[var(--state-text)]`;

/** Label and colour of each status, as in the design */
export const IMG_STATUS: Record<
    ImagingStatus,
    { label: string; pill: string }
> = {
    ordenada: { label: 'Ordenada', pill: pill('state-espera') },
    realizado: { label: 'Realizado', pill: pill('state-consulta') },
    borrador: {
        label: 'Informe en redacción',
        pill: pill('state-internado'),
    },
    listo: { label: 'Informe listo', pill: 'bg-accent-bg text-accent-fg' },
    entregado: { label: 'Entregado', pill: pill('state-cancelada') },
    cancelada: { label: 'Cancelada', pill: pill('state-cancelada') },
};

/** Still waiting for the study or its report */
export const isImagingPending = (s: ImagingStatus) =>
    s === 'ordenada' || s === 'realizado' || s === 'borrador';

/** «1.2 MB» */
export function fileSize(bytes: number): string {
    if (bytes < 1024 * 1024)
        return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export type ImagingReport = {
    number: string;
    name: string;
    findings: string | null;
    conclusion: string | null;
    signed_at: string | null;
    signed_by: string | null;
    attachments: { id: number; name: string; is_image: boolean }[];
};

/** As listed in Consulta and Emergencia: with the report once signed */
export type ImagingOrderWithReport = ImagingOrderSummary & {
    report: ImagingReport | null;
};
