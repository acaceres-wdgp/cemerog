import React, { FormEvent, useMemo, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Minus, Plus, Search } from 'lucide-react';
import FormDialog from '@/components/cemerog/FormDialog';
import FormField from '@/components/cemerog/FormField';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import emergenciaRoutes from '@/routes/emergencia';
import type { ApplicationKind, CatalogItem } from '../../types';

/** Aplicar medicamento / Registrar insumo, from the catalog */
export default function ApplyDialog({
    emergencyId,
    kind,
    catalog,
    routes,
    onClose,
    url,
}: {
    emergencyId: number;
    kind: ApplicationKind;
    catalog: CatalogItem[];
    routes: string[];
    onClose: () => void;
    /** Internamiento posts to its own route */
    url?: string;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const isMed = kind === 'medicamento';
    const [query, setQuery] = useState('');
    const [itemId, setItemId] = useState<number | null>(null);
    const [brought, setBrought] = useState(false);
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [route, setRoute] = useState(isMed ? routes[0] : '');
    const [isLoading, setIsLoading] = useState(false);

    const items = useMemo(() => {
        const q = query.trim().toLowerCase();
        return catalog
            .filter((i) => i.kind === kind)
            .filter(
                (i) =>
                    q === '' || `${i.code} ${i.name}`.toLowerCase().includes(q),
            );
    }, [catalog, kind, query]);
    const item = catalog.find((i) => i.id === itemId) ?? null;
    const canSubmit = brought ? description.trim() !== '' : item !== null;

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!canSubmit) return;
        setIsLoading(true);
        router.post(
            url ?? emergenciaRoutes.applications.store.url(emergencyId),
            {
                kind,
                quantity,
                ...(isMed ? { route } : {}),
                ...(brought
                    ? {
                          brought_by_patient: true,
                          description: description.trim(),
                      }
                    : { inventory_item_id: itemId }),
            },
            {
                preserveScroll: true,
                onSuccess: onClose,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    return (
        <FormDialog
            open
            onOpenChange={(open) => !open && onClose()}
            title={isMed ? 'Aplicar medicamento' : 'Registrar insumo'}
            description={
                isMed
                    ? 'Del almacén se descuenta y se carga a la cuenta.'
                    : 'Algodón, alcohol, gasa… Se descuenta del almacén y se carga a la cuenta.'
            }
            submitLabel={isMed ? 'Registrar aplicación' : 'Registrar insumo'}
            onSubmit={submit}
            isLoading={isLoading}
            submitDisabled={!canSubmit}
            maxWidth="sm:max-w-xl"
        >
            <div className="flex flex-col gap-4">
                {errors.emergency && (
                    <p className="text-xs text-error" role="alert">
                        {errors.emergency}
                    </p>
                )}
                {isMed && (
                    <label className="flex cursor-pointer items-center gap-2 text-[14px]">
                        <input
                            type="checkbox"
                            checked={brought}
                            onChange={(e) => setBrought(e.target.checked)}
                        />
                        Lo trajo el paciente (no se cobra ni sale del almacén)
                    </label>
                )}
                {brought ? (
                    <FormField
                        name="description"
                        label="Medicamento"
                        placeholder="Ej.: Salbutamol inhalador"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        error={errors.description}
                        required
                    />
                ) : (
                    <div className="flex flex-col gap-2">
                        <label className="flex h-9 items-center gap-2 rounded-[10px] border border-input-border px-3 focus-within:border-primary">
                            <Search className="h-4 w-4 text-muted" />
                            <input
                                aria-label="Buscar en almacén"
                                placeholder="Buscar en almacén…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full border-0 bg-transparent outline-none"
                            />
                        </label>
                        <div
                            role="radiogroup"
                            className="max-h-[220px] overflow-y-auto rounded-[10px] border border-card-border"
                        >
                            {items.length === 0 && (
                                <p className="m-0 p-3 text-center text-[13px] text-muted">
                                    No hay artículos activos que coincidan.
                                </p>
                            )}
                            {items.map((i) => (
                                <button
                                    key={i.id}
                                    type="button"
                                    role="radio"
                                    aria-checked={itemId === i.id}
                                    onClick={() => setItemId(i.id)}
                                    className={cn(
                                        'flex w-full cursor-pointer items-center gap-3 border-b border-divider px-3 py-2 text-left last:border-b-0',
                                        itemId === i.id
                                            ? 'bg-accent-bg'
                                            : 'bg-white hover:bg-list-row-bg',
                                    )}
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block font-medium text-text-heading">
                                            {i.name}
                                        </span>
                                        <span className="text-[12px] text-muted">
                                            {[
                                                i.presentation,
                                                `Existencia: ${i.stock}`,
                                            ]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </span>
                                    </span>
                                    <span className="font-semibold tabular-nums">
                                        {formatMoney(i.price)}
                                    </span>
                                </button>
                            ))}
                        </div>
                        {errors.inventory_item_id && (
                            <span className="text-xs text-error">
                                {errors.inventory_item_id}
                            </span>
                        )}
                    </div>
                )}
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-[14px] font-medium text-text-heading">
                            Cantidad
                        </span>
                        <div className="flex h-9 items-center rounded-[10px] border border-input-border">
                            <button
                                type="button"
                                aria-label="Menos"
                                onClick={() =>
                                    setQuantity((q) => Math.max(1, q - 1))
                                }
                                className="h-full cursor-pointer px-2 text-text-secondary"
                            >
                                <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center font-semibold tabular-nums">
                                {quantity}
                            </span>
                            <button
                                type="button"
                                aria-label="Más"
                                onClick={() => setQuantity((q) => q + 1)}
                                className="h-full cursor-pointer px-2 text-text-secondary"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    {isMed && (
                        <FormField
                            as="select"
                            name="route"
                            label="Vía"
                            value={route}
                            onChange={(e) => setRoute(e.target.value)}
                            className="w-[160px]"
                        >
                            {routes.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </FormField>
                    )}
                </div>
                {item && !brought && (
                    <p className="m-0 rounded-[10px] bg-accent-bg px-3 py-2 text-[13px] text-accent-fg">
                        Se descontarán <strong>{quantity}</strong> del almacén
                        (quedan {item.stock - quantity}). Cargo a la cuenta:{' '}
                        <strong>{formatMoney(item.price * quantity)}</strong>.
                    </p>
                )}
            </div>
        </FormDialog>
    );
}
