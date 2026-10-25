import { router, useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import type { DocumentType, PatientSearchResult } from '@/types/patient';
import { PatientFormCard } from './components/PatientFormCard';
import { PatientInfoCard } from './components/PatientInfoCard';
import { PhotoCard } from './components/PhotoCard';

type PatientForm = {
    document_type: DocumentType;
    document_number: string;
    email: string;
    first_names: string;
    last_names: string;
    birth_date: string;
    sex: import('@/types/patient').Sex;
    phone: string;
    address: string;
    blood_type: string;
    allergies: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    photo: File | null;
    remove_photo: boolean;
};

type Props = { patient: PatientSearchResult };

export default function RegistroEdit({ patient }: Props) {
    const { data, setData, put, processing, errors } = useForm<PatientForm>({
        document_type: patient.document_type,
        document_number: patient.document_number,
        email: patient.email ?? '',
        first_names: patient.first_names,
        last_names: patient.last_names,
        birth_date: patient.birth_date,
        sex: patient.sex,
        phone: patient.phone ?? '',
        address: patient.address ?? '',
        blood_type: patient.blood_type ?? '',
        allergies: patient.allergies ?? '',
        emergency_contact_name: patient.emergency_contact_name ?? '',
        emergency_contact_phone: patient.emergency_contact_phone ?? '',
        photo: null,
        remove_photo: false,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        patient.photo_url,
    );
    const [isDragging, setIsDragging] = useState(false);
    const [photoError, setPhotoError] = useState<string | null>(null);

    const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
    const ALLOWED_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
    ];

    const handleFileSelect = (file: File | null) => {
        setPhotoError(null);
        if (file) {
            if (!ALLOWED_TYPES.includes(file.type)) {
                setPhotoError(
                    'Solo se aceptan imágenes (JPG, PNG, WEBP) o PDF.',
                );
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
            if (file.size > MAX_PHOTO_BYTES) {
                setPhotoError(
                    `El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. El máximo permitido es 20 MB.`,
                );
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
        }
        setData('photo', file);
        setData('remove_photo', false);
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setPreviewUrl(e.target?.result as string);
            reader.readAsDataURL(file);
        } else if (file) {
            setPreviewUrl(null);
        }
    };

    const handleRemovePhoto = () => {
        setData('photo', null);
        setData('remove_photo', true);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const hasPhoto = previewUrl || (data.photo && !data.remove_photo);
    const isPdf =
        data.photo?.type === 'application/pdf' ||
        (patient.photo_url?.endsWith('.pdf') &&
            !data.photo &&
            !data.remove_photo);

    const handleDocumentTypeChange = (type: DocumentType) => {
        setData('document_type', type);
        if (type !== data.document_type) {
            setData('document_number', '');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/registro/pacientes/${patient.id}`);
    };

    const handleDelete = () => {
        if (
            !confirm(
                `¿Eliminar a ${patient.full_name}? Esta acción no se puede deshacer.`,
            )
        )
            return;
        router.delete(`/registro/pacientes/${patient.id}`);
    };

    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
                <a
                    href="/registro"
                    className="inline-flex h-8 items-center rounded-[8px] border border-input-border bg-card-bg px-3 font-[inherit] text-[13px] text-text-secondary no-underline"
                >
                    ← Volver
                </a>
                <h1 className="m-0 font-serif text-[26px] font-semibold text-text-heading">
                    Editar paciente
                </h1>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start gap-4">
                    <PatientFormCard
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        patient={patient}
                        onDocumentTypeChange={handleDocumentTypeChange}
                        onDelete={handleDelete}
                    />

                    <div className="flex flex-col gap-4">
                        <PhotoCard
                            previewUrl={previewUrl}
                            isDragging={isDragging}
                            setIsDragging={setIsDragging}
                            hasPhoto={hasPhoto}
                            isPdf={!!isPdf}
                            photoError={photoError}
                            photoFormError={errors.photo}
                            photoFileName={data.photo?.name}
                            fileInputRef={fileInputRef}
                            onFileSelect={handleFileSelect}
                            onRemovePhoto={handleRemovePhoto}
                        />

                        <PatientInfoCard patient={patient} />
                    </div>
                </div>
            </form>
        </div>
    );
}
