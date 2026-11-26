import type { InvoiceDetail, InvoiceStatus } from '@/pages/caja/types';

export type Period = 'hoy' | 'semana' | 'mes' | 'todo';
export type StateFilter = InvoiceStatus | 'todas';

export type InvoiceFilters = {
    periodo: Period;
    estado: StateFilter;
    area: string;
    condicion: '' | 'contado' | 'credito';
    cajero: number | '';
    q: string;
};

export type InvoiceListRow = {
    id: number;
    number: string;
    status: InvoiceStatus;
    issued_on: string;
    issued_time: string;
    patient: { id: number; full_name: string; document_number: string };
    area: string;
    condition: 'Contado' | 'Crédito';
    total: number;
    paid_amount: number;
    balance: number;
    cashier: string;
};

export type InvoiceKpis = {
    billed: number;
    billed_count: number;
    collected: number;
    pending: number;
    pending_count: number;
    voided: number;
    voided_count: number;
};

export type InvoiceListDetail = InvoiceDetail & {
    area: string;
    condition: 'Contado' | 'Crédito';
};

export type FacturasProps = {
    filters: InvoiceFilters;
    period_label: string;
    invoices: {
        data: InvoiceListRow[];
        current_page: number;
        last_page: number;
        from: number | null;
        to: number | null;
        total: number;
    };
    kpis: InvoiceKpis;
    totals: InvoiceKpis;
    counts: Record<StateFilter, number>;
    areas: string[];
    cashiers: { id: number; name: string }[];
    selected_invoice: InvoiceListDetail | null;
};
