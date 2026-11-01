import React from 'react';
import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { isImagingPending } from '@/components/img/types';
import type {
    ImagingOrderDetail,
    ImagingOrderSummary,
    ImagingPatient,
} from '@/components/img/types';
import { ageLabel } from '@/lib/patient';
import { img } from '@/routes';
import ReportCard from './components/ReportCard';
import StudiesList from './components/StudiesList';

/** Vista del paciente: sus estudios de imagen y el informe del seleccionado */
export default function ImgShow({
    patient,
    studies,
    order,
    can_sign,
}: {
    patient: ImagingPatient;
    studies: ImagingOrderSummary[];
    order: ImagingOrderDetail;
    can_sign: boolean;
}) {
    const pending = studies.filter((s) => isImagingPending(s.status)).length;
    const initials = patient.full_name
        .split(' ')
        .filter((w) => w.length > 2)
        .slice(0, 2)
        .map((w) => w[0])
        .join('');

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-4">
                <Link
                    href={img.url()}
                    className="inline-flex items-center gap-1 text-[14px] text-text-secondary hover:text-primary"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Todos los estudios
                </Link>
                <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent-bg font-semibold text-primary">
                        {initials}
                    </span>
                    <div>
                        <div className="font-serif text-[18px] font-semibold text-text-heading">
                            {patient.full_name}
                        </div>
                        <div className="text-[13px] text-muted">
                            {[
                                ageLabel(patient.age),
                                patient.document_number &&
                                    `Cédula ${patient.document_number}`,
                                `${studies.length} ${studies.length === 1 ? 'estudio' : 'estudios'}`,
                                pending === 0
                                    ? 'sin pendientes'
                                    : `${pending} ${pending === 1 ? 'pendiente' : 'pendientes'}`,
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex flex-wrap items-start gap-4">
                <div className="min-w-0 flex-[1_1_300px]">
                    <StudiesList studies={studies} selectedId={order.id} />
                </div>
                <div className="min-w-0 flex-[2_1_520px]">
                    <ReportCard
                        key={order.id}
                        order={order}
                        patientName={patient.full_name}
                        canSign={can_sign}
                    />
                </div>
            </div>
        </div>
    );
}
