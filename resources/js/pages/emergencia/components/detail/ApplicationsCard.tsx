import React, { useState } from 'react';
import { PackagePlus, Syringe } from 'lucide-react';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { Application, ApplicationKind, CatalogItem } from '../../types';
import ApplyDialog from './ApplyDialog';
import { cardCls, headCls, secondaryBtn, td, th, titleCls } from './card';

const TEXT = {
    medicamento: {
        title: 'Medicamentos aplicados',
        sub: 'Cada aplicación descuenta del almacén y se carga a la cuenta.',
        button: 'Aplicar',
        empty: 'Sin medicamentos aplicados. Usa «Aplicar» para registrar el primero.',
    },
    insumo: {
        title: 'Insumos utilizados',
        sub: 'Algodón, alcohol, gasa… lo que se usa con el paciente.',
        button: 'Registrar insumo',
        empty: 'Sin insumos registrados.',
    },
} as const;

export default function ApplicationsCard({
    emergencyId,
    kind,
    applications,
    catalog,
    routes,
    active,
}: {
    emergencyId: number;
    kind: ApplicationKind;
    applications: Application[];
    catalog: CatalogItem[];
    routes: string[];
    active: boolean;
}) {
    const [open, setOpen] = useState(false);
    const t = TEXT[kind];
    const rows = applications.filter((a) => a.kind === kind);
    const isMed = kind === 'medicamento';
    const Icon = isMed ? Syringe : PackagePlus;

    return (
        <section className={cn(cardCls, 'overflow-hidden')}>
            <div className={headCls}>
                <div>
                    <h2 className={titleCls}>{t.title}</h2>
                    <div className="text-[13px] text-muted">{t.sub}</div>
                </div>
                {active && (
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className={secondaryBtn}
                    >
                        <Icon className="h-4 w-4" />
                        {t.button}
                    </button>
                )}
            </div>
            {rows.length === 0 ? (
                <p className="m-0 px-5 py-6 text-center text-[13px] text-muted">
                    {t.empty}
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[620px] border-collapse text-[13.5px]">
                        <thead>
                            <tr>
                                <th className={`${th} pl-5 text-left`}>Hora</th>
                                <th className={`${th} text-left`}>Artículo</th>
                                <th className={`${th} text-right`}>Cant.</th>
                                {isMed && (
                                    <th className={`${th} text-left`}>Vía</th>
                                )}
                                <th className={`${th} text-left`}>
                                    Aplicado por
                                </th>
                                <th className={`${th} text-left`}>Almacén</th>
                                <th className={`${th} pr-5 text-right`}>
                                    Cargo
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((a) => (
                                <tr key={a.id}>
                                    <td className={`${td} pl-5 tabular-nums`}>
                                        {a.time}
                                    </td>
                                    <td className={`${td} font-medium`}>
                                        {a.description}
                                    </td>
                                    <td
                                        className={`${td} text-right tabular-nums`}
                                    >
                                        {a.quantity}
                                    </td>
                                    {isMed && (
                                        <td className={td}>{a.route ?? '—'}</td>
                                    )}
                                    <td className={`${td} text-text-secondary`}>
                                        {a.applied_by}
                                    </td>
                                    <td className={`${td} text-text-secondary`}>
                                        {a.brought_by_patient
                                            ? 'Traído por el paciente'
                                            : `−${a.quantity} · quedan ${a.stock_left}`}
                                    </td>
                                    <td
                                        className={`${td} pr-5 text-right tabular-nums`}
                                    >
                                        {a.brought_by_patient
                                            ? 'Sin cargo'
                                            : formatMoney(a.total)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {open && (
                <ApplyDialog
                    emergencyId={emergencyId}
                    kind={kind}
                    catalog={catalog}
                    routes={routes}
                    onClose={() => setOpen(false)}
                />
            )}
        </section>
    );
}
