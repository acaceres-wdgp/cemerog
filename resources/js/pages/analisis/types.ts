export type ParameterType = 'numerico' | 'texto';

export type LabParameter = {
    name: string;
    result_type: ParameterType;
    unit: string | null;
    min: number | null;
    max: number | null;
    normal_text: string | null;
    reference: string;
};

export type LabTestRow = {
    id: number;
    code: string;
    name: string;
    category: string;
    preparation: string | null;
    price: number;
    is_active: boolean;
    parameters: LabParameter[];
};
