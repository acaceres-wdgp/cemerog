import React from 'react';
import { ageLabel } from '@/lib/patient';
import type { EmergencyDetail } from '../../types';

const DOCUMENT_LABELS: Record<string, string> = {
    cedula: 'Cédula',
    pasaporte: 'Pasaporte',
    cedula_extranjera: 'Cédula extranjera',
    no_tiene: 'No trae documento',
};

/** Datos del paciente; Recepción completes the profile from Registro */
export default function PatientCard({
    emergency,
}: {
    emergency: EmergencyDetail;
}) {
    const p = emergency.patient;
    const rows: [string, string][] = [
        ['Expediente', p.expediente_number],
        [
            'Documento',
            p.document_type === 'no_tiene'
                ? DOCUMENT_LABELS.no_tiene
                : `${DOCUMENT_LABELS[p.document_type] ?? ''} ${p.document_number ?? ''}`.trim(),
        ],
        [
            'Edad',
            p.birth_date
                ? `${ageLabel(p.age)} · ${p.birth_date}`
                : ageLabel(null),
        ],
        ['Sexo', p.sex === 'F' ? 'Femenino' : 'Masculino'],
        ['Teléfono', p.phone ?? '—'],
        ['Acompañante', p.emergency_contact_name ?? '—'],
        ['Alergias', p.allergies ?? 'Sin registrar'],
        ['Motivo de llegada', emergency.reason],
    ];

    return (
        <section className="rounded-[14px] border border-card-border bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-divider px-5 py-[14px]">
                <h2 className="m-0 font-serif text-[16px] font-semibold text-text-heading">
                    Datos del paciente
                </h2>
                {p.profile_incomplete && (
                    <span className="state-espera rounded-full bg-[var(--state-bg)] px-2 py-0.5 text-[11.5px] font-medium text-[var(--state-text)]">
                        Perfil incompleto
                    </span>
                )}
            </div>
            <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 px-5 py-4 text-[13.5px]">
                {rows.map(([k, v]) => (
                    <React.Fragment key={k}>
                        <dt className="text-muted">{k}</dt>
                        <dd className="m-0 text-right font-medium text-text-body">
                            {v}
                        </dd>
                    </React.Fragment>
                ))}
            </dl>
        </section>
    );
}
