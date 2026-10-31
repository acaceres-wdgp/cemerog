export type ShiftSummary = {
    opening: number;
    income: { efectivo: number; tarjeta: number; transferencia: number };
    withdrawals: number;
    expected_cash: number;
};

export type Withdrawal = {
    id: number;
    amount: number;
    reason: string;
    created_by: string;
    time: string | null;
};

export type OpenShift = {
    id: number;
    opened_by: string;
    opened_at: string;
    pending_close: boolean;
    can_operate: boolean;
    summary: ShiftSummary;
    withdrawals: Withdrawal[];
};

export type ClosedShift = {
    id: number;
    opened_by: string;
    opened_at: string;
    closed_by: string | null;
    closed_at: string | null;
    expected_cash: number;
    counted_cash: number;
    difference: number;
    close_note: string | null;
};

export type CuadreProps = {
    shift: OpenShift | null;
    history: ClosedShift[];
    denominations: number[];
};
