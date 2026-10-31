export type ReceivableRow = {
    id: number;
    number: string;
    issued_on: string;
    days: number;
    total: number;
    paid_amount: number;
    balance: number;
    credit_due_date: string | null;
    overdue: boolean;
    patient: {
        id: number;
        full_name: string;
        document_number: string;
        phone: string | null;
    };
};

export type CxcProps = {
    invoices: ReceivableRow[];
};
