export type DocumentType = 'cedula' | 'pasaporte' | 'rnc';
export type Sex = 'M' | 'F';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type PatientSearchResult = {
    id: number;
    full_name: string;
    initials: string;
    document_type: DocumentType;
    document_number: string;
    first_names: string;
    last_names: string;
    birth_date: string;
    age: number;
    sex: Sex;
    phone: string | null;
    address: string | null;
    blood_type: BloodType | null;
    allergies: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
};
