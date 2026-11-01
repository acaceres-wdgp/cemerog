import React from 'react';
import { formatMoney } from '@/lib/money';

export type StayCharges = {
    charges: {
        id: number;
        date: string;
        description: string;
        area: string;
        quantity: number;
        unit_price: number;
        total: number;
    }[];
    room: {
        bed_label: string;
        room_type: string;
        daily_price: number;
        days: number;
        total: number;
    }[];
    room_charged: boolean;
    by_area: Record<string, number>;
    total: number;
};

const th =
    'h-10 border-b border-accent-tip-border bg-table-header-bg px-3 text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase';
const td = 'border-b border-divider px-3 py-2.5 align-middle';

/** «Cargos acumulados»: the account of the stay plus the room so far */
export default function ChargesTab({
    data,
    days,
}: {
    data: StayCharges;
    days: number;
}) {
    return (
        <div className="flex flex-wrap items-start gap-4">
            <section className="min-w-0 flex-[2_1_520px] overflow-x-auto rounded-[14px] border border-card-border bg-white">
                <div className="flex items-baseline justify-between border-b border-divider px-5 py-3">
                    <div className="font-serif text-[16px] font-semibold text-text-heading">
                        Cargos acumulados
                    </div>
                    <span className="text-[13px] text-muted">
                        {data.charges.length + data.room.length} cargos
                    </span>
                </div>
                <table className="w-full min-w-[620px] border-collapse text-[13.5px]">
                    <thead>
                        <tr>
                            <th className={`${th} pl-5 text-left`}>Fecha</th>
                            <th className={`${th} text-left`}>Descripción</th>
                            <th className={`${th} text-left`}>Área</th>
                            <th className={`${th} text-right`}>Cant.</th>
                            <th className={`${th} text-right`}>Precio</th>
                            <th className={`${th} pr-5 text-right`}>Importe</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.charges.map((c) => (
                            <tr key={c.id}>
                                <td className={`${td} pl-5 tabular-nums`}>
                                    {c.date}
                                </td>
                                <td className={td}>{c.description}</td>
                                <td className={`${td} text-text-secondary`}>
                                    {c.area}
                                </td>
                                <td className={`${td} text-right tabular-nums`}>
                                    {c.quantity}
                                </td>
                                <td className={`${td} text-right tabular-nums`}>
                                    {formatMoney(c.unit_price)}
                                </td>
                                <td
                                    className={`${td} pr-5 text-right tabular-nums`}
                                >
                                    {formatMoney(c.total)}
                                </td>
                            </tr>
                        ))}
                        {data.room.map((r) => (
                            <tr key={r.bed_label} className="bg-list-row-bg">
                                <td className={`${td} pl-5 text-muted`}>
                                    Al alta
                                </td>
                                <td className={td}>
                                    Habitación {r.room_type} · {r.bed_label} (
                                    {r.days} {r.days === 1 ? 'día' : 'días'}{' '}
                                    hasta hoy)
                                </td>
                                <td className={`${td} text-text-secondary`}>
                                    Habitación
                                </td>
                                <td className={`${td} text-right tabular-nums`}>
                                    {r.days}
                                </td>
                                <td className={`${td} text-right tabular-nums`}>
                                    {formatMoney(r.daily_price)}
                                </td>
                                <td
                                    className={`${td} pr-5 text-right tabular-nums`}
                                >
                                    {formatMoney(r.total)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {data.charges.length + data.room.length === 0 && (
                    <p className="m-0 px-5 py-6 text-center text-[13px] text-muted">
                        Sin cargos todavía.
                    </p>
                )}
            </section>
            <section className="min-w-0 flex-[1_1_260px] rounded-[14px] border border-card-border bg-white px-5 py-4">
                <div className="mb-2 font-serif text-[16px] font-semibold text-text-heading">
                    Resumen de cuenta
                </div>
                {Object.entries(data.by_area).map(([area, total]) => (
                    <div
                        key={area}
                        className="flex justify-between py-1 text-[13.5px]"
                    >
                        <span className="text-text-secondary">{area}</span>
                        <span className="tabular-nums">
                            {formatMoney(total)}
                        </span>
                    </div>
                ))}
                <div className="my-2 border-t border-divider" />
                <div className="flex items-baseline justify-between">
                    <span className="font-semibold">Total acumulado</span>
                    <span className="font-serif text-[20px] font-bold text-text-heading tabular-nums">
                        {formatMoney(data.total)}
                    </span>
                </div>
                <p className="m-0 mt-2 text-[12.5px] text-muted">
                    {days} {days === 1 ? 'día' : 'días'} de estancia ·{' '}
                    {data.room_charged
                        ? 'habitación cargada al dar el alta.'
                        : 'la habitación se carga al dar el alta.'}
                </p>
            </section>
        </div>
    );
}
