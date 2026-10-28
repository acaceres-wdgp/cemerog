import React from 'react';

// ─── Cuenta / Órdenes Tab ─────────────────────────────────────────────────────

export default function CuentaOrdenesTab() {
    return (
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-4">
            <div className="overflow-hidden rounded-[14px] border border-card-border bg-white">
                <div className="px-[18px] py-[14px] font-serif text-[16px] font-semibold text-text-heading">
                    Órdenes
                </div>
                <div className="p-5 text-center text-[13px] text-muted">
                    No hay órdenes para esta consulta.
                </div>
            </div>
            <div className="overflow-hidden rounded-[14px] border border-card-border bg-white">
                <div className="px-[18px] py-[14px] font-serif text-[16px] font-semibold text-text-heading">
                    Cargos a la cuenta
                </div>
                <div className="p-5 text-center text-[13px] text-muted">
                    No hay cargos registrados.
                </div>
            </div>
        </div>
    );
}
