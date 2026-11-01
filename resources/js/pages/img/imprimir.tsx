import React from 'react';
import PrintablePage from '@/components/cemerog/PrintablePage';
import type {
    ImagingOrderDetail,
    ImagingPatient,
} from '@/components/img/types';
import { ageLabel } from '@/lib/patient';

type Clinic = {
    name: string | null;
    phone: string | null;
    address: string | null;
};

/** Informe de imágenes firmado, listo para imprimir */
export default function ImgImprimir({
    patient,
    order,
    clinic,
}: {
    patient: ImagingPatient;
    order: ImagingOrderDetail;
    clinic: Clinic;
}) {
    return (
        <>
            <style>{`@media print { body > *:not(#app) { display: none !important; } #app > *:not(.printable-root) { display: none !important; } }`}</style>
            <div className="printable-root min-h-screen bg-surface py-8 print:bg-white print:p-0 print:py-0">
                <PrintablePage showHeader={false}>
                    <div className="mb-4 flex items-start justify-between border-b border-divider pb-4">
                        <div>
                            <div className="font-serif text-[22px] font-bold text-primary">
                                {clinic.name ?? 'CEMEROG'}
                            </div>
                            <div className="text-[12.5px] text-text-dim">
                                Dres. Rodríguez &amp; Guzmán
                            </div>
                            {clinic.phone && (
                                <div className="text-[12px] text-muted">
                                    Tel: {clinic.phone}
                                </div>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="font-serif text-[18px] font-bold tracking-[.04em]">
                                INFORME DE IMÁGENES
                            </div>
                            <div className="font-mono text-[12.5px]">
                                {order.number}
                            </div>
                        </div>
                    </div>
                    <div className="mb-5 grid grid-cols-2 gap-x-6 gap-y-1 text-[13px]">
                        <div>
                            <span className="text-muted">Paciente: </span>
                            <strong>{patient.full_name}</strong>
                        </div>
                        <div>
                            <span className="text-muted">Edad / sexo: </span>
                            {ageLabel(patient.age)} ·{' '}
                            {patient.sex === 'F' ? 'Femenino' : 'Masculino'}
                        </div>
                        <div>
                            <span className="text-muted">Médico: </span>
                            {order.doctor ?? '—'}
                        </div>
                        <div>
                            <span className="text-muted">Fecha: </span>
                            {order.performed_at ?? order.ordered_at}
                        </div>
                    </div>
                    <h2 className="mb-1 font-serif text-[17px] font-semibold">
                        {order.name}
                    </h2>
                    {order.indication && (
                        <p className="mb-4 text-[13px] text-text-secondary">
                            <strong>Indicación clínica:</strong>{' '}
                            {order.indication}
                        </p>
                    )}
                    <h3 className="mb-1 text-[13px] font-semibold tracking-[.04em] uppercase">
                        Hallazgos
                    </h3>
                    <p className="mb-4 text-[13.5px] whitespace-pre-line">
                        {order.findings}
                    </p>
                    <h3 className="mb-1 text-[13px] font-semibold tracking-[.04em] uppercase">
                        Conclusión
                    </h3>
                    <p className="mb-4 text-[13.5px] font-semibold whitespace-pre-line">
                        {order.conclusion}
                    </p>
                    {order.signed_by && (
                        <p className="mt-12 text-center text-[12px]">
                            ________________________________
                            <br />
                            {order.signed_by} · {order.signed_at}
                        </p>
                    )}
                </PrintablePage>
            </div>
        </>
    );
}
