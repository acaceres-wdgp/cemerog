import React, { FormEvent, useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Check, Plus } from 'lucide-react';
import { formatMoney, parseMoney } from '@/lib/money';
import SupplierDialog from '@/pages/almacen/components/SupplierDialog';
import { almacen } from '@/routes';
import * as entradaRoutes from '@/routes/entrada';
import EntryHeaderFields from './components/EntryHeaderFields';
import EntryLinesTable from './components/EntryLinesTable';
import NewProductDialog from './components/NewProductDialog';
import RecentEntries from './components/RecentEntries';
import type { CatalogOption, EntryLine, RecentEntry } from './types';

type Props = {
    items: CatalogOption[];
    suppliers: { id: number; name: string }[];
    next_number: string;
    recent: RecentEntry[];
    today: string;
};

let nextKey = 1;
const emptyLine = (): EntryLine => ({
    key: nextKey++,
    itemId: null,
    newItem: null,
    quantity: '',
    lot: '',
    expires: '',
    cost: '',
});

const lineIsComplete = (l: EntryLine) =>
    (l.itemId !== null || l.newItem !== null) &&
    (parseInt(l.quantity, 10) || 0) > 0 &&
    l.cost.trim() !== '';

/** Inventario › Entrada de mercancía */
export default function EntradaIndex({
    items,
    suppliers,
    next_number,
    recent,
    today,
}: Props) {
    const page = usePage();
    const errors = (page.props.errors ?? {}) as Record<string, string>;
    const flashSupplier =
        (page.flash as { supplier?: { id: number } | null })?.supplier ?? null;
    const [supplierId, setSupplierId] = useState('');
    const [invoiceRef, setInvoiceRef] = useState('');
    const [receivedOn, setReceivedOn] = useState(today);
    const [lines, setLines] = useState<EntryLine[]>(() => [emptyLine()]);
    const [newProductFor, setNewProductFor] = useState<number | null>(null);
    const [addingSupplier, setAddingSupplier] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // A supplier created from here is selected
    useEffect(() => {
        if (flashSupplier) setSupplierId(String(flashSupplier.id));
    }, [flashSupplier]);

    const change = (key: number, patch: Partial<EntryLine>) =>
        setLines((ls) =>
            ls.map((l) => (l.key === key ? { ...l, ...patch } : l)),
        );
    const units = lines.reduce(
        (sum, l) => sum + (parseInt(l.quantity, 10) || 0),
        0,
    );
    const total = lines.reduce(
        (sum, l) => sum + (parseInt(l.quantity, 10) || 0) * parseMoney(l.cost),
        0,
    );
    const canSubmit =
        supplierId !== '' && lines.length > 0 && lines.every(lineIsComplete);

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!canSubmit) return;
        setIsLoading(true);
        router.post(
            entradaRoutes.store.url(),
            {
                supplier_id: Number(supplierId),
                invoice_ref: invoiceRef.trim() || null,
                received_on: receivedOn,
                lines: lines.map((l) => ({
                    ...(l.newItem
                        ? {
                              new_item: {
                                  ...l.newItem,
                                  price: parseMoney(l.newItem.price),
                                  min_stock:
                                      parseInt(l.newItem.min_stock, 10) || 0,
                              },
                          }
                        : { inventory_item_id: l.itemId }),
                    quantity: parseInt(l.quantity, 10),
                    lot: l.lot.trim() || null,
                    expires_on: l.expires || null,
                    unit_cost: parseMoney(l.cost),
                })),
            },
            {
                onSuccess: () => {
                    setLines([emptyLine()]);
                    setInvoiceRef('');
                },
                onFinish: () => setIsLoading(false),
            },
        );
    };

    return (
        <div className="flex flex-wrap items-start gap-4">
            <form
                onSubmit={submit}
                className="min-w-0 flex-[3_1_960px] overflow-x-auto rounded-[14px] border border-card-border bg-white"
            >
                <div className="border-b border-divider px-5 py-[14px] font-serif text-[16px] font-semibold text-text-heading">
                    Nueva entrada{' '}
                    <span className="font-mono text-[13px] font-normal text-muted">
                        {next_number}
                    </span>
                </div>
                <EntryHeaderFields
                    suppliers={suppliers}
                    supplierId={supplierId}
                    invoiceRef={invoiceRef}
                    receivedOn={receivedOn}
                    today={today}
                    errors={errors}
                    onSupplier={setSupplierId}
                    onInvoiceRef={setInvoiceRef}
                    onReceivedOn={setReceivedOn}
                    onNewSupplier={() => setAddingSupplier(true)}
                />
                <EntryLinesTable
                    lines={lines}
                    catalog={items}
                    errors={errors}
                    onChange={change}
                    onRemove={(key) =>
                        setLines((ls) => ls.filter((l) => l.key !== key))
                    }
                    onNewProduct={setNewProductFor}
                />
                {errors.lines && (
                    <p className="m-0 px-5 pt-2 text-xs text-error">
                        {errors.lines}
                    </p>
                )}
                <div className="flex flex-wrap gap-2 px-5 py-3">
                    <button
                        type="button"
                        onClick={() => setLines((ls) => [...ls, emptyLine()])}
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-secondary-border bg-secondary-bg px-[14px] font-medium text-text-body hover:bg-accent-bg"
                    >
                        <Plus className="h-4 w-4" />
                        Agregar producto
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const line = emptyLine();
                            setLines((ls) => [...ls, line]);
                            setNewProductFor(line.key);
                        }}
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-dashed border-input-border bg-white px-[14px] font-medium text-text-secondary hover:bg-list-row-bg"
                    >
                        <Plus className="h-4 w-4" />
                        Producto nuevo (no está en catálogo)
                    </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-divider bg-list-row-bg px-5 py-3">
                    <div className="flex gap-6 tabular-nums">
                        <span>
                            Unidades: <strong>{units}</strong>
                        </span>
                        <span>
                            Costo total: <strong>{formatMoney(total)}</strong>
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href={almacen.url()}
                            className="inline-flex h-9 items-center rounded-[10px] border border-secondary-border bg-secondary-bg px-[14px] font-medium text-text-body hover:bg-accent-bg"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={!canSubmit || isLoading}
                            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] bg-primary px-[14px] font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-primary-disabled"
                        >
                            <Check className="h-4 w-4" />
                            Registrar entrada
                        </button>
                    </div>
                </div>
            </form>
            <div className="min-w-0 flex-[1_1_240px]">
                <RecentEntries entries={recent} />
            </div>
            {newProductFor !== null && (
                <NewProductDialog
                    catalog={items}
                    onAdd={(newItem, cost) =>
                        change(newProductFor, { newItem, itemId: null, cost })
                    }
                    onUseExisting={(item) =>
                        change(newProductFor, {
                            itemId: item.id,
                            newItem: null,
                            cost:
                                item.cost != null
                                    ? (item.cost / 100).toFixed(2)
                                    : '',
                        })
                    }
                    onClose={() => setNewProductFor(null)}
                />
            )}
            {addingSupplier && (
                <SupplierDialog
                    supplier={null}
                    onClose={() => setAddingSupplier(false)}
                />
            )}
        </div>
    );
}
