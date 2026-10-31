import type { ReceiptRow } from '@/pages/caja/types';

export type ShiftMethod = 'efectivo' | 'tarjeta' | 'transferencia';

export type ShiftSummary = {
    opening: number;
    income: Record<ShiftMethod, number>;
    transactions: Record<ShiftMethod, number>;
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

/** One payment taken in the shift */
export type Movement = {
    id: number;
    receipt_id: number;
    time: string | null;
    receipt: string;
    patient: string;
    concept: string;
    method: ShiftMethod;
    amount: number;
    voided: boolean;
};

/** What the cashier counted when closing (centavos) */
export type ShiftCount = {
    cash: number | null;
    card: number | null;
    transfer: number | null;
    denominations: Record<string, number> | null;
};

export type CashShiftView = {
    id: number;
    status: 'abierto' | 'cerrado';
    opened_by: string;
    opened_at: string;
    closed_by: string | null;
    closed_at: string | null;
    pending_close: boolean;
    can_operate: boolean;
    summary: ShiftSummary;
    counted: ShiftCount | null;
    difference: number | null;
    close_note: string | null;
    movements: Movement[];
    withdrawals: Withdrawal[];
};

export type ShiftOption = {
    id: number;
    label: string;
    status: 'abierto' | 'cerrado';
};

export type ShiftReceipt = ReceiptRow & {
    invoice_number: string;
    patient: string;
};

export type CuadreProps = {
    shift: CashShiftView | null;
    shifts: ShiftOption[];
    denominations: number[];
};
