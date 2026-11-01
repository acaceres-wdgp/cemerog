import React, { FormEvent, useMemo, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Check, FlaskConical, ScanLine } from 'lucide-react';
import FormDialog from '@/components/cemerog/FormDialog';
import FormField from '@/components/cemerog/FormField';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { LabCatalogItem } from './types';

/**
 * «Ordenar estudios» (Consulta and Emergencia). Laboratory for now; imaging
 * is shown but not enabled yet. The charge goes to the account when the
 * sample is taken.
 */
export default function OrderStudiesDialog({
    open,
    onOpenChange,
    subtitle,
    catalog,
    url,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subtitle: string;
    catalog: LabCatalogItem[];
    url: string;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [selected, setSelected] = useState<number[]>([]);
    const [indication, setIndication] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const groups = useMemo(() => {
        const map = new Map<string, LabCatalogItem[]>();
        for (const item of catalog)
            map.set(item.category, [...(map.get(item.category) ?? []), item]);
        return [...map.entries()];
    }, [catalog]);
    const chosen = catalog.filter((c) => selected.includes(c.id));
    const total = chosen.reduce((sum, c) => sum + c.price, 0);
    const preparations = [
        ...new Set(chosen.map((c) => c.preparation).filter(Boolean)),
    ] as string[];

    const toggle = (id: number) =>
        setSelected((s) =>
            s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
        );

    const close = (value: boolean) => {
        if (!value) {
            setSelected([]);
            setIndication('');
        }
        onOpenChange(value);
    };

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        router.post(
            url,
            { lab_test_ids: selected, indication: indication.trim() || null },
            {
                preserveScroll: true,
                onSuccess: () => close(false),
                onFinish: () => setIsLoading(false),
            },
        );
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={close}
            title="Ordenar estudios"
            description={subtitle}
            submitLabel="Enviar órdenes"
            onSubmit={submit}
            isLoading={isLoading}
            submitDisabled={selected.length === 0}
            maxWidth="sm:max-w-2xl"
        >
            <div className="flex flex-col gap-4">
                {errors.lab_test_ids && (
                    <p className="m-0 text-xs text-error">
                        {errors.lab_test_ids}
                    </p>
                )}
                {groups.length === 0 && (
                    <p className="m-0 text-[13px] text-muted">
                        No hay análisis activos en el catálogo.
                    </p>
                )}
                {groups.map(([category, items]) => (
                    <div key={category} className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[13px] font-semibold text-text-heading">
                            <FlaskConical className="h-4 w-4 text-primary" />
                            Laboratorio · {category}
                        </div>
                        <div className="grid gap-1.5 sm:grid-cols-2">
                            {items.map((t) => {
                                const on = selected.includes(t.id);
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        role="checkbox"
                                        aria-checked={on}
                                        onClick={() => toggle(t.id)}
                                        className={cn(
                                            'flex cursor-pointer items-center gap-2 rounded-[10px] border px-3 py-2 text-left text-[13.5px]',
                                            on
                                                ? 'border-primary bg-accent-bg'
                                                : 'border-card-border bg-white hover:bg-list-row-bg',
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'inline-flex h-4 w-4 flex-none items-center justify-center rounded border',
                                                on
                                                    ? 'border-primary bg-primary text-white'
                                                    : 'border-input-border',
                                            )}
                                        >
                                            {on && (
                                                <Check className="h-3 w-3" />
                                            )}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            {t.name}
                                        </span>
                                        <span className="text-muted tabular-nums">
                                            {formatMoney(t.price)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
                <div className="flex items-center gap-2 rounded-[10px] border border-dashed border-input-border px-3 py-2 text-[13px] text-muted">
                    <ScanLine className="h-4 w-4" />
                    Imágenes · disponible próximamente
                </div>
                {preparations.length > 0 && (
                    <p className="m-0 rounded-[10px] bg-info-bg px-3 py-2 text-[13px]">
                        <strong>Preparación:</strong> {preparations.join(' ')}
                    </p>
                )}
                <FormField
                    as="textarea"
                    name="indication"
                    label="Indicación clínica"
                    rows={2}
                    placeholder="Ej.: fiebre de 3 días, descartar infección"
                    value={indication}
                    onChange={(e) => setIndication(e.target.value)}
                    error={errors.indication}
                />
                <div className="flex items-center justify-between rounded-[10px] bg-list-row-bg px-3 py-2 text-[13.5px]">
                    <span className="text-text-secondary">
                        Se cargará a la cuenta al tomar la muestra
                    </span>
                    <strong className="tabular-nums">
                        {formatMoney(total)}
                    </strong>
                </div>
            </div>
        </FormDialog>
    );
}
