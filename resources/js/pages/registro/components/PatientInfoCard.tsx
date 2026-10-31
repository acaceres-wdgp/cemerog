import type { PatientSearchResult } from '@/types/patient';
import { ageLabel } from '@/lib/patient';

interface PatientInfoCardProps {
    patient: PatientSearchResult;
}

export function PatientInfoCard({ patient }: PatientInfoCardProps) {
    return (
        <div className="overflow-hidden rounded-[14px] border border-card-border bg-card-bg">
            <div className="border-b border-divider px-5 py-4 font-serif text-[16px] font-semibold text-text-heading">
                Paciente
            </div>
            <div className="flex flex-col gap-3 px-5 py-4">
                <div className="flex items-center gap-2.5">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-bg text-sm font-bold text-accent-fg">
                        {patient.initials}
                    </span>
                    <div>
                        <div className="font-semibold text-text-heading">
                            {patient.full_name}
                        </div>
                        <div className="text-xs text-muted">
                            {ageLabel(patient.age)} ·{' '}
                            {patient.sex === 'F' ? 'Femenino' : 'Masculino'}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[13px]">
                    <span className="text-muted">Documento</span>
                    <span className="text-right">
                        {patient.document_number}
                    </span>
                    <span className="text-muted">Sangre</span>
                    <span className="text-right">
                        {patient.blood_type ?? '—'}
                    </span>
                    <span className="text-muted">Alergias</span>
                    <span
                        className={`text-right ${patient.allergies ? 'text-error' : 'text-text-none'}`}
                    >
                        {patient.allergies ?? 'Ninguna'}
                    </span>
                </div>
            </div>
        </div>
    );
}
