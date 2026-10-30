import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PrintablePage from '@/components/cemerog/PrintablePage';

// ─── Types ────────────────────────────────────────────────────────────────────

type PrescriptionItem = {
    id: number;
    position: number;
    medication: string;
    route: string | null;
    dose: string;
    frequency: string;
    duration_days: number | null;
    is_continuous: boolean;
    quantity: number;
};

type PrescriptionData = {
    id: number;
    general_instructions: string | null;
    prescribed_at: string;
    turn_number: number;
    patient: {
        full_name: string;
        age: number;
        sex: string;
        allergies: string | null;
    };
    doctor: {
        name: string;
        exequatur: string;
        specialty: string;
    };
    items: PrescriptionItem[];
};

type ClinicInfo = {
    name: string | null;
    rnc: string | null;
    phone: string | null;
    address: string | null;
};

type Props = {
    prescription: PrescriptionData;
    clinic: ClinicInfo;
};

// ─── Instruction Builder ──────────────────────────────────────────────────────

function buildInstruction(item: PrescriptionItem): string {
    const verb = 'Tomar';
    const base = `${verb} ${item.dose}`;
    const via = item.route ? ` por vía ${item.route}` : '';
    const freq = ` ${item.frequency.toLowerCase()}`;
    const dur = item.is_continuous
        ? ' de forma continua.'
        : ` durante ${item.duration_days} días.`;
    return `${base}${via}${freq}${dur}`;
}

// ─── Print Page ───────────────────────────────────────────────────────────────

export default function RecetaImprimir({ prescription, clinic }: Props) {
    const dateStr = format(new Date(prescription.prescribed_at), 'dd/MM/yyyy', {
        locale: es,
    });

    return (
        <>
            {/* Print CSS: hide app chrome */}
            <style>{`@media print { body > *:not(#app) { display: none !important; } #app > *:not(.printable-root) { display: none !important; } }`}</style>
            <div className="printable-root min-h-screen bg-surface py-8 print:bg-white print:p-0 print:py-0">
                <PrintablePage showHeader={false}>
                    {/* Clinic header */}
                    <div className="mb-6 flex items-start justify-between border-b border-divider pb-5">
                        <div>
                            <div className="font-serif text-[22px] font-bold text-primary">
                                {clinic.name ?? 'CEMEROG'}
                            </div>
                            <div className="mt-[2px] text-[12.5px] text-text-dim">
                                Dres. Rodríguez &amp; Guzmán
                            </div>
                            {clinic.rnc && (
                                <div className="text-[12px] text-muted">
                                    RNC: {clinic.rnc}
                                </div>
                            )}
                            {clinic.phone && (
                                <div className="text-[12px] text-muted">
                                    Tel: {clinic.phone}
                                </div>
                            )}
                            {clinic.address && (
                                <div className="text-[12px] text-muted">
                                    {clinic.address}
                                </div>
                            )}
                        </div>
                        <div className="text-right text-[12.5px]">
                            <div className="font-semibold text-text-heading">
                                Receta Médica
                            </div>
                            <div className="text-muted">{dateStr}</div>
                            <div className="mt-1 text-muted">
                                Turno #{prescription.turn_number}
                            </div>
                        </div>
                    </div>

                    {/* Patient info */}
                    <div className="mb-6 rounded-[10px] border border-card-border px-[14px] py-[10px]">
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[13px]">
                            <span>
                                <span className="text-muted">Paciente: </span>
                                <span className="font-semibold text-text-heading">
                                    {prescription.patient.full_name}
                                </span>
                            </span>
                            <span>
                                <span className="text-muted">Edad: </span>
                                <span className="text-text-heading">
                                    {prescription.patient.age} años ·{' '}
                                    {prescription.patient.sex === 'M'
                                        ? 'Masculino'
                                        : 'Femenino'}
                                </span>
                            </span>
                            {prescription.patient.allergies && (
                                <span>
                                    <span className="font-semibold text-error">
                                        Alergias:{' '}
                                    </span>
                                    <span className="font-semibold text-error">
                                        {prescription.patient.allergies}
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Rx items */}
                    <div className="mb-8">
                        <div className="mb-3 font-serif text-[24px] font-bold text-text-heading">
                            Rx
                        </div>
                        <ol className="list-none space-y-4 p-0">
                            {prescription.items.map((item) => (
                                <li key={item.id} className="flex gap-3">
                                    <span className="mt-[1px] shrink-0 font-semibold text-primary">
                                        {item.position}.
                                    </span>
                                    <div>
                                        <div className="font-semibold text-text-heading">
                                            {item.medication}
                                            <span className="ml-2 font-normal text-muted">
                                                Cant.: {item.quantity}
                                            </span>
                                        </div>
                                        <div className="text-[13px] text-text-dim">
                                            {buildInstruction(item)}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* General instructions */}
                    {prescription.general_instructions && (
                        <div className="mb-8 rounded-[10px] border border-divider px-[14px] py-[10px]">
                            <div className="mb-1 text-[11px] font-semibold tracking-[.05em] text-muted uppercase">
                                Indicaciones generales
                            </div>
                            <p className="m-0 text-[13.5px] text-text-heading">
                                {prescription.general_instructions}
                            </p>
                        </div>
                    )}

                    {/* Next appointment line */}
                    <div className="mb-12 text-[13px] text-text-dim">
                        Próxima cita:{' '}
                        <span className="inline-block w-48 border-b border-text-dim" />
                    </div>

                    {/* Doctor signature */}
                    <div className="mt-8 border-t border-divider pt-4 text-[13px]">
                        <div className="font-semibold text-text-heading">
                            {prescription.doctor.name}
                        </div>
                        <div className="text-muted">
                            {prescription.doctor.specialty}
                        </div>
                        <div className="text-muted">
                            Exequatur: {prescription.doctor.exequatur}
                        </div>
                    </div>
                </PrintablePage>

                {/* Print button – hidden when printing */}
                <div className="mt-4 flex justify-center print:hidden">
                    <button
                        onClick={() => window.print()}
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border-0 bg-primary px-4 font-sans text-sm font-medium text-white"
                    >
                        Imprimir
                    </button>
                </div>
            </div>
        </>
    );
}
