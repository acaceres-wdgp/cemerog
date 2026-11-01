export type SurgeryStatus =
    | 'programada'
    | 'quirofano'
    | 'realizada'
    | 'cancelada';

export type ProcedureOption = {
    id: number;
    code: string;
    name: string;
    price: number;
    duration_minutes: number;
};

export type SurgeryOptions = {
    procedures: ProcedureOption[];
    operating_rooms: { id: number; name: string }[];
    doctors: { id: number; name: string; specialty: string }[];
};

/** The fields shared by «Programar cirugía» and «Ingreso para cirugía» */
export type SurgeryDraft = {
    surgery_procedure_id: string;
    surgeon_id: string;
    anesthetist_id: string;
    operating_room_id: string;
    date: string;
    time: string;
    duration_minutes: string;
};

export const emptyDraft = (
    options: SurgeryOptions,
    date: string,
    surgeonId: number | null = null,
): SurgeryDraft => ({
    surgery_procedure_id: '',
    surgeon_id: surgeonId ? String(surgeonId) : '',
    anesthetist_id: '',
    operating_room_id: String(options.operating_rooms[0]?.id ?? ''),
    date,
    time: '08:00',
    duration_minutes: '60',
});

export const draftComplete = (d: SurgeryDraft) =>
    d.surgery_procedure_id !== '' &&
    d.surgeon_id !== '' &&
    d.operating_room_id !== '' &&
    d.date !== '' &&
    d.time !== '' &&
    Number(d.duration_minutes) >= 15;

/** The payload the server expects */
export const draftPayload = (d: SurgeryDraft) => ({
    surgery_procedure_id: Number(d.surgery_procedure_id),
    surgeon_id: Number(d.surgeon_id),
    anesthetist_id: d.anesthetist_id ? Number(d.anesthetist_id) : null,
    operating_room_id: Number(d.operating_room_id),
    date: d.date,
    time: d.time,
    duration_minutes: Number(d.duration_minutes),
});

const pill = (tone: string) =>
    `${tone} bg-[var(--state-bg)] text-[var(--state-text)] border-[var(--state-accent)]`;

export const SURGERY_STATUS: Record<
    SurgeryStatus,
    { label: string; cls: string }
> = {
    programada: { label: 'Programada', cls: pill('state-cirugia') },
    quirofano: { label: 'En quirófano', cls: pill('state-consulta') },
    realizada: {
        label: 'Realizada',
        cls: 'bg-accent-bg text-accent-fg border-accent-border',
    },
    cancelada: { label: 'Cancelada', cls: pill('state-cancelada') },
};
