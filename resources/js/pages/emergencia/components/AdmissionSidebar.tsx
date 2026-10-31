import React from 'react';
import { formatMoney } from '@/lib/money';

const PENDING = [
    'Fecha de nacimiento',
    'Teléfono',
    'Dirección',
    'Persona de contacto',
    'Tipo de sangre',
    'Alergias',
];

/** «Se completa después» and the data of the attention */
export default function AdmissionSidebar({
    unidentified,
    noDocument,
    existing,
    doctorName,
    fee,
}: {
    unidentified: boolean;
    noDocument: boolean;
    existing: boolean;
    doctorName: string | null;
    fee: number;
}) {
    const pending = [
        ...(unidentified ? ['Nombre real'] : []),
        ...(noDocument ? ['Documento de identidad'] : []),
        ...PENDING,
    ];

    return (
        <div className="flex flex-col gap-4">
            {!existing && (
                <section className="rounded-[14px] border border-card-border bg-white">
                    <h2 className="m-0 border-b border-divider px-5 py-[14px] font-serif text-[16px] font-semibold text-text-heading">
                        Se completa después
                    </h2>
                    <div className="flex flex-col gap-2 px-5 py-4">
                        {pending.map((p) => (
                            <div
                                key={p}
                                className="flex items-center gap-2.5 text-[13.5px] text-text-secondary"
                            >
                                <span className="h-3.5 w-3.5 flex-none rounded-full border-[1.5px] border-dashed border-muted-light" />
                                {p}
                            </div>
                        ))}
                        <p className="m-0 mt-2 rounded-[10px] bg-list-row-bg px-3 py-2 text-[13px] text-text-secondary">
                            El paciente aparece en el tablero con la marca{' '}
                            <strong>Perfil incompleto</strong> hasta que
                            Recepción complete sus datos.
                        </p>
                    </div>
                </section>
            )}
            <section className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-[14px] border border-card-border bg-white px-5 py-4 text-[13.5px]">
                <span className="text-muted">No. de atención</span>
                <span className="text-right text-text-secondary">
                    Se genera al guardar
                </span>
                <span className="text-muted">Médico de turno</span>
                <span className="text-right font-medium">
                    {doctorName ?? '—'}
                </span>
                <span className="text-muted">Cargo inicial</span>
                <span className="text-right font-semibold tabular-nums">
                    {formatMoney(fee)}
                </span>
            </section>
        </div>
    );
}
