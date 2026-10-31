export type ChargeRow = {
    id: number;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    doctor: string | null;
};

export type BillableAccount = {
    id: number;
    service_date: string;
    status: 'abierta' | 'pendiente_facturar' | 'facturada' | 'anulada';
    patient: { id: number; full_name: string; expediente_number: string };
    charges: ChargeRow[];
    total: number;
};

export type InvoiceStatus = 'pendiente' | 'pagada' | 'anulada';

export type InvoiceSummary = {
    id: number;
    number: string;
    status: InvoiceStatus;
    patient: string;
    issued_at: string;
    total: number;
    paid_amount: number;
    balance: number;
    credit_due_date: string | null;
};

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';

export type PaymentRow = {
    method: PaymentMethod;
    amount: number;
    cash_received: number | null;
    change_given: number | null;
    reference: string | null;
};

export type ReceiptRow = {
    id: number;
    number: string;
    created_at: string;
    created_by: string;
    total: number;
    voided: boolean;
    void_reason: string | null;
    payments: PaymentRow[];
};

export const METHOD_LABELS: Record<PaymentMethod, string> = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    transferencia: 'Transferencia',
};

export type InvoiceDetail = Omit<InvoiceSummary, 'patient'> & {
    patient: {
        id: number;
        full_name: string;
        expediente_number: string;
        document_number: string;
    };
    service_date: string;
    issued_by: string;
    subtotal: number;
    discount_type: 'porcentaje' | 'monto' | null;
    discount_value: number | null;
    discount_amount: number;
    discount_reason: string | null;
    credit_note: string | null;
    receipts: ReceiptRow[];
    void_reason: string | null;
    voided_by: string | null;
    voided_at: string | null;
    lines: ChargeRow[];
};

export type CajaProps = {
    pending_accounts: BillableAccount[];
    accounts_in_care: BillableAccount[];
    invoices: InvoiceSummary[];
    selected_invoice: InvoiceDetail | null;
    can_void: boolean;
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
    pendiente: 'Con balance',
    pagada: 'Pagada',
    anulada: 'Anulada',
};
