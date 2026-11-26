export type PortalPatient = {
    name: string;
    age_sex: string;
    service_date: string;
    invoice: string | null;
    expires_on: string;
};

export type PortalStudySummary = {
    key: string;
    kind: 'lab' | 'img';
    name: string;
    ready: boolean;
    detail: string;
};

export type LabRow = {
    test: string;
    value: string;
    unit: string;
    reference: string;
    /** «A» high, «B» low, «*» abnormal text */
    flag: '' | 'A' | 'B' | '*';
};

export type PortalStudyDetail = {
    key: string;
    kind: 'lab' | 'img';
    name: string;
    department: string;
    taken: string;
    taken_label: string;
    doctor: string | null;
    validated_by: string | null;
    validated_at: string;
    verification: string;
    rows?: LabRow[];
    findings?: string | null;
    conclusion?: string | null;
    images?: { n: number; name: string }[];
};
