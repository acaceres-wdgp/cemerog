import React from 'react';
import FormField from '@/components/cemerog/FormField';

/** Proveedor · Factura / NCF · Fecha de recepción */
export default function EntryHeaderFields({
    suppliers,
    supplierId,
    invoiceRef,
    receivedOn,
    today,
    errors,
    onSupplier,
    onInvoiceRef,
    onReceivedOn,
    onNewSupplier,
}: {
    suppliers: { id: number; name: string }[];
    supplierId: string;
    invoiceRef: string;
    receivedOn: string;
    today: string;
    errors: Record<string, string>;
    onSupplier: (id: string) => void;
    onInvoiceRef: (value: string) => void;
    onReceivedOn: (value: string) => void;
    onNewSupplier: () => void;
}) {
    return (
        <div className="grid gap-3 px-5 py-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
                <FormField
                    as="select"
                    name="supplier_id"
                    label="Proveedor"
                    value={supplierId}
                    onChange={(e) => onSupplier(e.target.value)}
                    error={errors.supplier_id}
                    required
                >
                    <option value="">Elegir proveedor…</option>
                    {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </FormField>
                <button
                    type="button"
                    onClick={onNewSupplier}
                    className="cursor-pointer self-start text-[12.5px] font-semibold text-primary"
                >
                    + Nuevo proveedor
                </button>
            </div>
            <FormField
                name="invoice_ref"
                label="Factura / NCF del proveedor"
                value={invoiceRef}
                onChange={(e) => onInvoiceRef(e.target.value)}
                error={errors.invoice_ref}
            />
            <FormField
                type="date"
                name="received_on"
                label="Fecha de recepción"
                value={receivedOn}
                max={today}
                onChange={(e) => onReceivedOn(e.target.value)}
                error={errors.received_on}
            />
        </div>
    );
}
