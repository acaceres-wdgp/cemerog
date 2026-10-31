import React, { FormEvent, useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import FormDialog from '@/components/cemerog/FormDialog';
import FormField from '@/components/cemerog/FormField';
import SegmentedControl from '@/components/cemerog/SegmentedControl';
import { parseMoney } from '@/lib/money';
import type { ItemKind } from '@/pages/almacen/types';
import type { CatalogOption, NewItem } from '../types';
import { itemLabel } from '../types';

const norm = (s: string) =>
    s
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .trim()
        .toLowerCase();

/** «Producto nuevo»: created in the catalog when the entry is saved */
export default function NewProductDialog({
    catalog,
    onAdd,
    onUseExisting,
    onClose,
}: {
    catalog: CatalogOption[];
    onAdd: (item: NewItem, cost: string) => void;
    onUseExisting: (item: CatalogOption) => void;
    onClose: () => void;
}) {
    const [kind, setKind] = useState<ItemKind>('medicamento');
    const [name, setName] = useState('');
    const [presentation, setPresentation] = useState('');
    const [cost, setCost] = useState('');
    const [price, setPrice] = useState('');
    const [min, setMin] = useState('');

    const duplicate = useMemo(
        () =>
            name.trim().length >= 3
                ? (catalog.find((c) => norm(c.name) === norm(name)) ?? null)
                : null,
        [catalog, name],
    );
    const costC = parseMoney(cost);
    const priceC = parseMoney(price);
    const margin =
        costC > 0 && priceC > 0
            ? Math.round(((priceC - costC) / costC) * 100)
            : null;
    const valid =
        name.trim() !== '' &&
        presentation.trim() !== '' &&
        cost.trim() !== '' &&
        price.trim() !== '';

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onAdd(
            {
                name: name.trim(),
                presentation: presentation.trim(),
                kind,
                price,
                min_stock: min,
            },
            cost,
        );
        onClose();
    };

    return (
        <FormDialog
            open
            onOpenChange={(open) => !open && onClose()}
            title="Producto nuevo"
            description="Se crea en el catálogo y se agrega a esta entrada."
            submitLabel="Crear y agregar a la entrada"
            onSubmit={submit}
            submitDisabled={!valid}
            maxWidth="sm:max-w-xl"
        >
            <div className="flex flex-col gap-3">
                <SegmentedControl<ItemKind>
                    segments={[
                        { value: 'medicamento', label: 'Medicamento' },
                        { value: 'insumo', label: 'Insumo' },
                    ]}
                    value={kind}
                    onChange={setKind}
                    className="self-start"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                        name="name"
                        label={
                            kind === 'medicamento' ? 'Medicamento' : 'Insumo'
                        }
                        placeholder={
                            kind === 'medicamento'
                                ? 'Ej.: Dipirona'
                                : 'Ej.: Gasa estéril 4x4'
                        }
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <FormField
                        name="presentation"
                        label="Presentación"
                        placeholder={
                            kind === 'medicamento'
                                ? 'Ej.: 1 g/2 ml · ampolla'
                                : 'Ej.: Paquete de 10'
                        }
                        value={presentation}
                        onChange={(e) => setPresentation(e.target.value)}
                        required
                    />
                </div>
                {duplicate && (
                    <div className="flex flex-wrap items-center gap-2 rounded-[10px] bg-info-bg px-3 py-2 text-[13px]">
                        <Info className="h-4 w-4 shrink-0" />
                        <span>
                            Ya existe en el catálogo:{' '}
                            <strong>{itemLabel(duplicate)}</strong>.
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                onUseExisting(duplicate);
                                onClose();
                            }}
                            className="cursor-pointer font-semibold text-primary underline"
                        >
                            Usar ese producto
                        </button>
                    </div>
                )}
                <div className="grid gap-3 sm:grid-cols-4">
                    <FormField
                        name="code"
                        label="Código"
                        value="Al guardar"
                        readOnly
                    />
                    <FormField
                        name="cost"
                        label="Costo unit. (RD$)"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        required
                    />
                    <FormField
                        name="price"
                        label="Precio de venta (RD$)"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                    />
                    <FormField
                        name="min_stock"
                        label="Existencia mínima"
                        inputMode="numeric"
                        placeholder="Ej.: 20"
                        value={min}
                        onChange={(e) =>
                            setMin(e.target.value.replace(/\D/g, ''))
                        }
                    />
                </div>
                {margin !== null && (
                    <p className="m-0 text-[13px] text-text-secondary">
                        Margen: <strong>{margin} %</strong> · El mínimo genera
                        la alerta de «Bajo el mínimo» en el catálogo.
                    </p>
                )}
            </div>
        </FormDialog>
    );
}
