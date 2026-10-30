import React from 'react';
import { formatMoney } from '@/lib/money';
import type { AccountCharge } from '../types';

// ─── Cuenta / Órdenes Tab ─────────────────────────────────────────────────────

type Props = {
    charges: AccountCharge[];
    chargesTotal: number;
};

export default function CuentaOrdenesTab({ charges, chargesTotal }: Props) {
    return (
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-4">
            {/* Órdenes panel */}
            <div className="overflow-hidden rounded-[14px] border border-card-border bg-white">
                <div className="px-[18px] py-[14px] font-serif text-[16px] font-semibold text-text-heading">
                    Órdenes
                </div>
                <div className="p-5 text-center text-[13px] text-muted">
                    No hay órdenes para esta consulta.
                </div>
            </div>

            {/* Cargos panel */}
            <div className="overflow-hidden rounded-[14px] border border-card-border bg-white">
                <div className="px-[18px] py-[14px] font-serif text-[16px] font-semibold text-text-heading">
                    Cargos a la cuenta
                </div>

                {charges.length === 0 ? (
                    <div className="p-5 text-center text-[13px] text-muted">
                        No hay cargos registrados.
                    </div>
                ) : (
                    <>
                        {/* Table header */}
                        <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 border-b border-divider bg-app-bg px-4 py-2 text-[11.5px] font-semibold uppercase tracking-wide text-text-secondary">
                            <span>Descripción</span>
                            <span className="text-right">Cant.</span>
                            <span className="text-right">Importe</span>
                        </div>

                        {/* Charge rows */}
                        {charges.map((charge) => (
                            <div
                                key={charge.id}
                                className="grid grid-cols-[1fr_auto_auto] gap-x-3 border-b border-divider px-4 py-3 last:border-0"
                            >
                                <span className="text-[13px] text-text-body">
                                    {charge.description}
                                </span>
                                <span className="text-right text-[13px] text-text-secondary">
                                    {charge.quantity}
                                </span>
                                <span className="text-right text-[13px] font-medium text-text-heading">
                                    {formatMoney(charge.total)}
                                </span>
                            </div>
                        ))}

                        {/* Total row */}
                        <div className="flex items-center justify-between border-t border-divider bg-app-bg px-4 py-3">
                            <span className="text-[13px] font-semibold text-text-heading">
                                Total acumulado
                            </span>
                            <span className="text-[15px] font-bold text-primary">
                                {formatMoney(chargesTotal)}
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
