export type ImagingStudyRow = {
    id: number;
    code: string;
    name: string;
    modality: string;
    preparation: string | null;
    price: number;
    is_active: boolean;
};
