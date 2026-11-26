import React from 'react';
import FormField from '@/components/cemerog/FormField';
import SearchSelect from '@/components/cemerog/SearchSelect';

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
            <div className="flex flex-col gap-1.5">
                <label
                    htmlFor="supplier_id"
                    className="text-sm font-medium text-text-heading"
                >
                    Proveedor<span className="ml-1 text-error">*</span>
                </label>
                <SearchSelect
                    id="supplier_id"
                    options={suppliers.map((s) => ({
                        value: String(s.id),
                        label: s.name,
                    }))}
                    value={supplierId}
                    onChange={onSupplier}
                    placeholder="Buscar proveedor…"
                    invalid={Boolean(errors.supplier_id)}
                />
                {errors.supplier_id && (
                    <p className="m-0 text-xs text-error" role="alert">
                        {errors.supplier_id}
                    </p>
                )}
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
