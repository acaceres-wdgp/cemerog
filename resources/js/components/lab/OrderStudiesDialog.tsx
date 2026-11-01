import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import FormDialog from '@/components/cemerog/FormDialog';
import FormField from '@/components/cemerog/FormField';
import { formatMoney } from '@/lib/money';
import StudiesPicker from './StudiesPicker';
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

    const total = catalog
        .filter((c) => selected.includes(c.id))
        .reduce((sum, c) => sum + c.price, 0);

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
                <StudiesPicker
                    catalog={catalog}
                    selected={selected}
                    onToggle={toggle}
                />
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
