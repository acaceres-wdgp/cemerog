import React from 'react';
import { formatMoney } from '@/lib/money';
import AttentionsList from './AttentionsList';
import type {
    Antecedentes,
    Attention,
    Finanzas,
    ProfilePatient,
} from './types';
import { ACCOUNT_STATUS_LABELS } from './types';

const DOC_LABELS: Record<string, string> = {
    cedula: 'Cédula',
    pasaporte: 'Pasaporte',
    cedula_extranjera: 'Cédula extranjera',
    no_tiene: 'Sin documento',
};

const sectionTitle =
    'm-0 border-b border-divider px-5 py-3 font-serif text-[16px] font-semibold text-text-heading';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <>
            <dt className="text-muted">{label}</dt>
            <dd className="m-0 text-text-body">{value}</dd>
        </>
    );
}

export default function ResumenTab({
    patient,
    antecedentes,
    attentions,
    finanzas,
    onShowHistory,
}: {
    patient: ProfilePatient;
    antecedentes: Antecedentes;
    attentions: Attention[];
    finanzas: Finanzas | null;
    onShowHistory: () => void;
}) {
    const none = 'Ninguno conocido';
    const pendingAccounts =
        finanzas?.cuentas.filter(
            (c) => c.status === 'abierta' || c.status === 'pendiente_facturar',
        ) ?? [];

    return (
        <div className="flex flex-wrap items-start gap-4">
            <div className="flex min-w-[300px] flex-[1_1_340px] flex-col gap-4">
                <section className="rounded-2xl border border-card-border bg-white">
                    <h2 className={sectionTitle}>Datos personales</h2>
                    <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 px-5 py-4 text-[13px]">
                        <Row
                            label="Documento"
                            value={`${patient.document_number} (${DOC_LABELS[patient.document_type] ?? patient.document_type})`}
                        />
                        <Row
                            label="Nacimiento"
                            value={`${patient.birth_date} (${patient.age} años)`}
                        />
                        <Row label="Teléfono" value={patient.phone ?? '—'} />
                        <Row label="Dirección" value={patient.address ?? '—'} />
                        <Row
                            label="Contacto emerg."
                            value={
                                [
                                    patient.emergency_contact_name,
                                    patient.emergency_contact_phone,
                                ]
                                    .filter(Boolean)
                                    .join(' · ') || '—'
                            }
                        />
                        <Row
                            label="Registrado"
                            value={patient.created_at ?? '—'}
                        />
                    </dl>
                </section>
                <section className="rounded-2xl border border-card-border bg-white">
                    <h2 className={sectionTitle}>Antecedentes</h2>
                    <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 px-5 py-4 text-[13px]">
                        <Row
                            label="Personales"
                            value={antecedentes.personales ?? none}
                        />
                        <Row
                            label="Quirúrgicos"
                            value={antecedentes.quirurgicos ?? none}
                        />
                        <Row
                            label="Medicamentos"
                            value={antecedentes.medicamentos ?? none}
                        />
                        <Row
                            label="Familiares"
                            value={antecedentes.familiares ?? none}
                        />
                        <Row
                            label="Alergias"
                            value={patient.allergies ?? 'Ninguna conocida'}
                        />
                    </dl>
                </section>
            </div>

            <div className="flex min-w-[300px] flex-[2_1_480px] flex-col gap-4">
                <section className="rounded-2xl border border-card-border bg-white">
                    <div className="flex items-center justify-between border-b border-divider px-5 py-3">
                        <h2 className="m-0 font-serif text-[16px] font-semibold text-text-heading">
                            Últimas atenciones
                        </h2>
                        <button
                            type="button"
                            onClick={onShowHistory}
                            className="cursor-pointer border-0 bg-transparent text-[13px] font-semibold text-primary"
                        >
                            Ver historial completo
                        </button>
                    </div>
                    <AttentionsList attentions={attentions.slice(0, 4)} />
                </section>

                {finanzas && (
                    <section className="rounded-2xl border border-card-border bg-white">
                        <h2 className={sectionTitle}>Estado de cuenta</h2>
                        {pendingAccounts.length === 0 ? (
                            <p className="px-5 py-6 text-center text-[13px] text-muted">
                                Sin cuentas pendientes de facturar.
                            </p>
                        ) : (
                            <ul className="m-0 list-none p-0 text-[13px]">
                                {pendingAccounts.map((c) => (
                                    <li
                                        key={c.id}
                                        className="flex items-center justify-between border-b border-divider px-5 py-3 last:border-b-0"
                                    >
                                        <span className="text-text-body">
                                            {c.service_date} ·{' '}
                                            {ACCOUNT_STATUS_LABELS[c.status]}
                                        </span>
                                        <span className="font-semibold text-error tabular-nums">
                                            {formatMoney(c.total)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}
