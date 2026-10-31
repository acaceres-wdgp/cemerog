import React, { useState } from 'react';
import { TriangleAlert, Wallet } from 'lucide-react';
import OpenShiftDialog from '@/components/caja/OpenShiftDialog';
import EmptyState from '@/components/cemerog/EmptyState';
import CloseShiftForm from './components/CloseShiftForm';
import ShiftHistory from './components/ShiftHistory';
import ShiftSummaryCards from './components/ShiftSummaryCards';
import WithdrawalsPanel from './components/WithdrawalsPanel';
import type { CuadreProps } from './types';

export default function CuadreIndex({ shift, history }: CuadreProps) {
    const [opening, setOpening] = useState(false);

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h1 className="m-0 font-serif text-[26px] font-semibold text-text-heading">
                    Cuadre de caja
                </h1>
                <p className="mt-1 text-muted">
                    {shift
                        ? `Turno abierto por ${shift.opened_by} desde ${shift.opened_at}`
                        : 'La caja está cerrada.'}
                </p>
            </div>

            {shift === null ? (
                <div className="rounded-2xl border border-card-border bg-white py-6">
                    <EmptyState
                        icon={Wallet}
                        title="No hay un turno de caja abierto"
                        description="Para cobrar hay que abrir un turno con el fondo de apertura."
                        action={
                            <button
                                type="button"
                                onClick={() => setOpening(true)}
                                className="inline-flex h-9 cursor-pointer items-center rounded-lg bg-primary px-[14px] text-sm font-medium text-white hover:bg-primary-hover"
                            >
                                Abrir turno
                            </button>
                        }
                    />
                    <OpenShiftDialog open={opening} onOpenChange={setOpening} />
                </div>
            ) : (
                <>
                    {shift.pending_close && (
                        <div className="flex items-center gap-2 rounded-xl border border-error-border bg-error-bg px-4 py-3 text-[13px] text-error-strong">
                            <TriangleAlert className="h-4 w-4 shrink-0" />
                            Este turno es de un día anterior y no se cerró.
                            Cuádralo y ciérralo para abrir uno nuevo.
                        </div>
                    )}
                    <ShiftSummaryCards summary={shift.summary} />
                    <div className="flex flex-wrap items-start gap-4">
                        <div className="min-w-[300px] flex-[1_1_360px]">
                            <WithdrawalsPanel
                                withdrawals={shift.withdrawals}
                                canOperate={shift.can_operate}
                            />
                        </div>
                        <div className="min-w-[300px] flex-[1_1_420px]">
                            {shift.can_operate ? (
                                <CloseShiftForm
                                    expectedCash={shift.summary.expected_cash}
                                />
                            ) : (
                                <p className="rounded-2xl border border-card-border bg-white px-5 py-6 text-center text-[13px] text-muted">
                                    Solo {shift.opened_by} o un administrador
                                    puede cuadrar y cerrar este turno.
                                </p>
                            )}
                        </div>
                    </div>
                </>
            )}

            <ShiftHistory history={history} />
        </div>
    );
}
