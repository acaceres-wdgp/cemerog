import React, { useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import OpenShiftDialog from '@/components/caja/OpenShiftDialog';
import { parseMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import CashCountCard from './components/CashCountCard';
import CloseShiftCard from './components/CloseShiftCard';
import { cardCls, countTotal } from './components/cuadreMath';
import ExpectedVsCounted from './components/ExpectedVsCounted';
import type { MethodRow } from './components/ExpectedVsCounted';
import ShiftHeader from './components/ShiftHeader';
import ShiftMovements from './components/ShiftMovements';
import ShiftStats from './components/ShiftStats';
import WithdrawalsPanel from './components/WithdrawalsPanel';
import type { CashShiftView, CuadreProps } from './types';

const pesos = (centavos: number) => (centavos / 100).toFixed(2);

function ShiftCuadre({
    shift,
    denominations,
}: {
    shift: CashShiftView;
    denominations: number[];
}) {
    const s = shift.summary;
    const closed = shift.counted;
    const editable = closed === null && shift.can_operate;

    const [units, setUnits] = useState<Record<number, string>>(() =>
        Object.fromEntries(
            Object.entries(closed?.denominations ?? {}).map(([d, n]) => [
                Number(d),
                String(n),
            ]),
        ),
    );
    // Card and transfer start at what the system expects
    const [card, setCard] = useState(() => pesos(s.income.tarjeta));
    const [transfer, setTransfer] = useState(() =>
        pesos(s.income.transferencia),
    );

    const cash = closed?.cash ?? countTotal(units);
    const cardCounted = closed
        ? (closed.card ?? s.income.tarjeta)
        : parseMoney(card);
    const transferCounted = closed
        ? (closed.transfer ?? s.income.transferencia)
        : parseMoney(transfer);

    const rows: MethodRow[] = [
        {
            method: 'efectivo',
            label: 'Efectivo',
            note:
                s.withdrawals > 0
                    ? 'incluye fondo de apertura, menos retiros'
                    : 'incluye fondo de apertura',
            transactions: s.transactions.efectivo,
            expected: s.expected_cash,
            counted: cash,
            input: null,
        },
        {
            method: 'tarjeta',
            label: 'Tarjeta',
            note: 'según cierre del datáfono',
            transactions: s.transactions.tarjeta,
            expected: s.income.tarjeta,
            counted: cardCounted,
            input: editable ? card : null,
            onInput: setCard,
        },
        {
            method: 'transferencia',
            label: 'Transferencia',
            note: 'según estado bancario',
            transactions: s.transactions.transferencia,
            expected: s.income.transferencia,
            counted: transferCounted,
            input: editable ? transfer : null,
            onInput: setTransfer,
        },
    ];
    const expected = rows.reduce((sum, r) => sum + r.expected, 0);
    const counted = rows.reduce((sum, r) => sum + r.counted, 0);

    return (
        <>
            {shift.pending_close && (
                <div className="flex items-center gap-2 rounded-xl border border-error-border bg-error-bg px-4 py-3 text-[13px] text-error-strong">
                    <TriangleAlert className="h-4 w-4 shrink-0" />
                    Este turno es de un día anterior y no se cerró. Cuádralo y
                    ciérralo para abrir uno nuevo.
                </div>
            )}
            <ShiftStats shift={shift} expected={expected} counted={counted} />
            <div className="flex flex-wrap items-start gap-4">
                <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-4">
                    <ExpectedVsCounted rows={rows} />
                    <ShiftMovements movements={shift.movements} />
                    {(editable || shift.withdrawals.length > 0) && (
                        <WithdrawalsPanel
                            withdrawals={shift.withdrawals}
                            canOperate={editable}
                        />
                    )}
                </div>
                <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
                    <CashCountCard
                        denominations={denominations}
                        units={units}
                        readOnly={!editable}
                        onChange={(d, n) => setUnits((u) => ({ ...u, [d]: n }))}
                    />
                    <CloseShiftCard
                        shift={shift}
                        difference={counted - expected}
                        count={{
                            cash,
                            denominations: Object.fromEntries(
                                Object.entries(units)
                                    .filter(([, n]) => n !== '')
                                    .map(([d, n]) => [d, parseInt(n, 10)]),
                            ),
                            card: cardCounted,
                            transfer: transferCounted,
                        }}
                    />
                </div>
            </div>
        </>
    );
}

export default function CuadreIndex({
    shift,
    shifts,
    denominations,
}: CuadreProps) {
    const [opening, setOpening] = useState(false);

    return (
        <div className="flex flex-col gap-4">
            <ShiftHeader shift={shift} shifts={shifts} />
            {shift === null ? (
                <div
                    className={cn(
                        cardCls,
                        'flex flex-col items-center gap-[14px] p-10 text-center text-muted',
                    )}
                >
                    <span>Aún no se ha abierto el turno de caja de hoy.</span>
                    <button
                        type="button"
                        onClick={() => setOpening(true)}
                        className="inline-flex h-9 cursor-pointer items-center rounded-[10px] bg-primary px-[14px] text-sm font-medium text-white hover:bg-primary-hover"
                    >
                        Abrir turno
                    </button>
                    <OpenShiftDialog open={opening} onOpenChange={setOpening} />
                </div>
            ) : (
                // key: a different shift starts with a fresh count
                <ShiftCuadre
                    key={shift.id}
                    shift={shift}
                    denominations={denominations}
                />
            )}
        </div>
    );
}
