import type { LabOrderSummary } from '@/components/lab/types';

export type LabRow = LabOrderSummary & {
    ordered_date: string;
    origin: string;
    doctor: string | null;
    patient: {
        id: number;
        full_name: string;
        age: number | null;
        sex: 'M' | 'F';
        document_number: string | null;
    };
    has_out_of_range: boolean;
    validated_at: string | null;
};

export type LabResultRow = {
    id: number;
    code: string;
    test: string;
    name: string;
    reference: string;
    value: string | null;
    out_of_range: boolean;
};

export type LabDetail = LabRow & {
    sample_at: string | null;
    validated_by: string | null;
    delivered_at: string | null;
    can_validate: boolean;
    categories: {
        category: string;
        tests: string[];
        results: LabResultRow[];
    }[];
    preparations: string[];
};

export type LabHistory = {
    data: LabRow[];
    current_page: number;
    last_page: number;
    total: number;
};
